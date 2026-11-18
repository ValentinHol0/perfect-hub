#!/usr/bin/env node
// Multi-viewport screenshots + layout/console/focus audit with Playwright. Same behaviour in Claude Code and Antigravity.
// Usage: node shots.mjs <url> [outDir=.visual-review] [--dark] [--full] [--wide] [--nojs] [--focus] [--stress]
//   default  above-the-fold screenshot per viewport (375, 768, 1280)
//   --full   also the full page, plus readable viewport-height tiles (<vp>-tile-N.png, max 12)
//   --wide   adds 1440×900 and 1920×1080
//   --nojs   adds a JavaScript-disabled capture; content must stay visible
//   --focus  tabs through up to 15 focus stops at 1280 and reports stops without a visible indicator
//   --stress worst-case content at 375 and 1280: ~40 % longer text, unbreakable compound words in headings/buttons/
//            links/labels, longer numbers — full-page <vp>-stress.png; horizontal scroll under stress is blocking
// Playwright is resolved from $PLAYWRIGHT_DIR if set, else from the current directory's node_modules
// (run from the project root, or point PLAYWRIGHT_DIR at any folder that has playwright installed).
// Prints a JSON report. Exit 1 on blocking issues (horizontal scroll, console/page errors, no-JS blank, invisible focus).

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2).filter(Boolean);
const flags = args.filter((a) => a.startsWith('--'));
const [url, outArg] = args.filter((a) => !a.startsWith('--'));
if (!url) {
  console.error('Usage: node shots.mjs <url> [outDir] [--dark] [--full] [--wide] [--nojs] [--focus] [--stress]');
  process.exit(2);
}
const outDir = resolve(outArg || '.visual-review');
const has = (f) => flags.includes(f);
const dark = has('--dark');
const suffix = dark ? '-dark' : '';

let chromium;
const pwBase = resolve(process.env.PLAYWRIGHT_DIR || process.cwd());
try {
  ({ chromium } = createRequire(join(pwBase, 'package.json'))('playwright'));
} catch {
  console.error(`Playwright not found from ${pwBase}. Run from a project that has it, set PLAYWRIGHT_DIR, or install: npm i -D playwright && npx playwright install chromium`);
  process.exit(2);
}

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
  ...(has('--wide') ? [{ name: 'desktop-1440', width: 1440, height: 900 }, { name: 'desktop-1920', width: 1920, height: 1080 }] : []),
];

const audit = () => {
  const vw = document.documentElement.clientWidth;
  const describe = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}`;
  const visuallyHidden = (el, r, cs) => r.width <= 1 || r.height <= 1 || /^rect\(0/.test(cs.clip) || /inset\(50%/.test(cs.clipPath);
  const overflowing = [];
  const clipped = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (visuallyHidden(el, r, cs)) continue;
    if (cs.position !== 'fixed' && (r.right > vw + 1 || r.left < -1) && overflowing.length < 15) overflowing.push(`${describe(el)} (${Math.round(r.left)}→${Math.round(r.right)}px)`);
    const hidesOverflow = ['hidden', 'clip'].includes(cs.overflow) || ['hidden', 'clip'].includes(cs.overflowY);
    if (hidesOverflow && el.scrollHeight > el.clientHeight + 2 && el.textContent.trim() && clipped.length < 10) clipped.push(`${describe(el)}: "${el.textContent.trim().slice(0, 40)}"`);
  }
  const imgsNoAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.currentSrc || i.src).slice(0, 10);
  const controlsWithoutName = [...document.querySelectorAll('button, [role="button"], a[href]')]
    .filter((b) => !(b.innerText.trim() || b.getAttribute('aria-label') || b.getAttribute('aria-labelledby') || b.getAttribute('title') || b.querySelector('img[alt]:not([alt=""])')))
    .map(describe).slice(0, 10);
  return {
    horizontalScroll: document.documentElement.scrollWidth > vw + 1,
    scrollWidth: document.documentElement.scrollWidth,
    pageHeight: document.documentElement.scrollHeight,
    overflowing,
    clipped,
    imgsNoAlt,
    controlsWithoutName,
    h1Count: document.querySelectorAll('h1').length,
    bodyTextChars: document.body ? document.body.innerText.trim().length : 0,
  };
};

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const report = { url, outDir, dark, viewports: [] };
let blocking = false;

async function open(context) {
  const page = await context.newPage();
  const log = { consoleErrors: [], pageErrors: [], failedRequests: [] };
  page.on('console', (m) => m.type() === 'error' && log.consoleErrors.push(m.text().slice(0, 300)));
  page.on('pageerror', (e) => log.pageErrors.push(String(e).slice(0, 300)));
  page.on('requestfailed', (r) => log.failedRequests.push(`${r.failure()?.errorText} ${r.url()}`.slice(0, 300)));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => log.pageErrors.push(`navigation: ${e.message}`));
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await page.waitForTimeout(150); // late layout after fonts.ready
  return { page, log };
}

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: dark ? 'dark' : 'light' });
  const { page, log } = await open(context);
  const shot = join(outDir, `${vp.name}${suffix}.png`);
  await page.screenshot({ path: shot });
  const result = { viewport: vp.name, width: vp.width, screenshot: shot, ...(await page.evaluate(audit)), ...log };
  if (has('--full')) {
    result.fullPage = join(outDir, `${vp.name}${suffix}-full.png`);
    await page.screenshot({ path: result.fullPage, fullPage: true });
    result.tiles = [];
    const count = Math.min(12, Math.ceil(result.pageHeight / vp.height));
    for (let i = 0; i < count; i++) {
      const tile = join(outDir, `${vp.name}${suffix}-tile-${i + 1}.png`);
      const y = i * vp.height;
      await page.screenshot({ path: tile, fullPage: true, clip: { x: 0, y, width: vp.width, height: Math.min(vp.height, result.pageHeight - y) } });
      result.tiles.push(tile);
    }
  }
  if (result.horizontalScroll || log.pageErrors.length || log.consoleErrors.length) blocking = true;
  report.viewports.push(result);
  await context.close();
}

if (has('--focus')) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: dark ? 'dark' : 'light' });
  const { page } = await open(context);
  const stops = [];
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      // The indicator may live on the element or on an ancestor (e.g. label:has(input:focus-visible)).
      // Compare the focused look with the blurred look of the element and 3 ancestors.
      const chain = [];
      for (let n = el; n && chain.length < 4 && n !== document.body; n = n.parentElement) chain.push(n);
      const sig = () => chain.map((n) => { const s = getComputedStyle(n); return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.backgroundColor, s.textDecorationLine].join('|'); }).join('||');
      const focused = sig();
      const label = (el.getAttribute('aria-label') || el.labels?.[0]?.innerText || el.innerText || el.getAttribute('title') || el.getAttribute('name') || el.tagName).trim().slice(0, 40);
      el.blur();
      const blurred = sig();
      return { element: `${el.tagName.toLowerCase()} "${label}"`, visibleIndicator: focused !== blurred };
    });
    if (!info) break;
    if (stops.length && stops[0].element === info.element) break; // wrapped around
    stops.push(info);
  }
  const shot = join(outDir, `focus${suffix}.png`);
  await page.screenshot({ path: shot });
  const missing = stops.filter((s) => !s.visibleIndicator);
  report.focus = { screenshot: shot, stops, missingIndicator: missing.map((s) => s.element) };
  if (missing.length) blocking = true;
  await context.close();
}

if (has('--nojs')) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false, colorScheme: dark ? 'dark' : 'light' });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  const shot = join(outDir, `nojs${suffix}.png`);
  await page.screenshot({ path: shot });
  const visibleText = await page.evaluate(() => (document.body ? document.body.innerText.trim().length : 0));
  const withJs = (report.viewports.find((v) => v.viewport === 'desktop') || {}).bodyTextChars || 0;
  report.noJs = { screenshot: shot, visibleTextChars: visibleText, withJsTextChars: withJs, ok: withJs === 0 ? visibleText > 0 : visibleText >= 0.5 * withJs };
  if (!report.noJs.ok) blocking = true;
  await context.close();
}

if (has('--stress')) {
  // Worst-case content: ~35–40 % longer text (translations into Ukrainian/German/Polish run longer than English),
  // compound words that cannot wrap, longer numbers and prices. Layout must survive it at 375 and 1280.
  report.stress = [];
  for (const vp of [VIEWPORTS[0], VIEWPORTS.find((v) => v.width === 1280)]) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: dark ? 'dark' : 'light' });
    const { page } = await open(context);
    await page.evaluate(() => {
      const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'svg']);
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim() && n.parentElement && !skip.has(n.parentElement.tagName) && !n.parentElement.closest('[aria-hidden="true"]') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const n of nodes) {
        let i = 0;
        let t = n.nodeValue.replace(/\p{L}{3,}/gu, (w) => (++i % 3 === 0 ? w + w.toLowerCase() : w)).replace(/\d+/g, (d) => d + '99');
        if (n.parentElement.closest('h1,h2,h3,h4,button,a,label,th,dt,[role="button"],[role="tab"],nav li')) t += ' Найвідповідальнішого';
        n.nodeValue = t;
      }
      for (const el of document.querySelectorAll('input[placeholder], textarea[placeholder]')) el.placeholder += ' Найвідповідальнішого';
    });
    await page.waitForTimeout(150);
    const shot = join(outDir, `${vp.name}${suffix}-stress.png`);
    await page.screenshot({ path: shot, fullPage: true });
    const a = await page.evaluate(audit);
    report.stress.push({ viewport: vp.name, screenshot: shot, horizontalScroll: a.horizontalScroll, scrollWidth: a.scrollWidth, overflowing: a.overflowing, clipped: a.clipped });
    if (a.horizontalScroll) blocking = true;
    await context.close();
  }
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
process.exit(blocking ? 1 : 0);
