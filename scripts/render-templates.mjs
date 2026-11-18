#!/usr/bin/env node
// render-templates — renders every frame of an HTML template file to its own PNG (posts, stories, carousel slides,
// ad creatives, guideline boards). A frame is any element with data-frame="<name>"; give it a fixed CSS size and,
// optionally, data-size="1080x1350" so the script fails if the rendered box drifts from the platform size.
//
// Usage: node render-templates.mjs <templates.html> [--out deliverables/brand/renders] [--scale 1|2|3] [--only name1,name2]
// Relative assets (fonts, images) resolve from the HTML file's folder. Waits for web fonts before capturing.
// Playwright: from $PLAYWRIGHT_DIR, else the current directory. Prints a JSON report.
// Exit: 0 ok · 1 render failure or size mismatch · 2 usage error · 3 Playwright not found.

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PLAYWRIGHT_HELP, loadChromium } from './lib/raster.mjs';

export function parseSize(text) {
  const m = String(text).trim().match(/^(\d{2,5})\s*[x×]\s*(\d{2,5})$/i);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

export function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') return { help: true };
    if (a.startsWith('--')) {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) return { error: `${a} needs a value` };
      flags[a.slice(2)] = v;
      i++;
    } else positional.push(a);
  }
  const unknown = Object.keys(flags).find((k) => !['out', 'scale', 'only'].includes(k));
  if (unknown) return { error: `Unknown option --${unknown}` };
  if (positional.length !== 1) return { error: 'Usage: node render-templates.mjs <templates.html> [--out <dir>] [--scale 1|2|3] [--only name1,name2]' };
  if (!/\.html?$/i.test(positional[0])) return { error: `Expected an .html file (wrap SVG artwork in HTML frames): ${positional[0]}` };
  const scale = flags.scale === undefined ? 1 : Number(flags.scale);
  if (![1, 2, 3].includes(scale)) return { error: `--scale must be 1, 2 or 3 (got ${flags.scale})` };
  const only = flags.only ? flags.only.split(',').map((s) => s.trim()).filter(Boolean) : null;
  return { opts: { file: positional[0], out: flags.out || join('deliverables', 'brand', 'renders'), scale, only } };
}

// frames: [{ name, width, height, declared }] (declared = data-size text or null). Returns a list of problems.
export function checkFrames(frames, only = null) {
  const problems = [];
  if (!frames.length) problems.push('No elements with data-frame="<name>" found');
  const seen = new Set();
  for (const f of frames) {
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(f.name || '')) problems.push(`Invalid frame name "${f.name}" (letters, digits, - and _ only)`);
    if (seen.has(f.name)) problems.push(`Duplicate frame name "${f.name}"`);
    seen.add(f.name);
    if (!(f.width > 0 && f.height > 0)) problems.push(`Frame "${f.name}" has zero size — give it a fixed CSS width and height`);
    if (f.declared) {
      const want = parseSize(f.declared);
      if (!want) problems.push(`Frame "${f.name}": data-size "${f.declared}" is not WIDTHxHEIGHT`);
      else if (Math.round(f.width) !== want.width || Math.round(f.height) !== want.height) {
        problems.push(`Frame "${f.name}" renders at ${Math.round(f.width)}×${Math.round(f.height)}, data-size says ${want.width}×${want.height}`);
      }
    }
  }
  for (const name of only || []) if (!seen.has(name)) problems.push(`--only: no frame named "${name}"`);
  return problems;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 10).join('\n'));
    process.exit(0);
  }
  if (parsed.error) { console.error(`render-templates: ${parsed.error}`); process.exit(2); }
  const { file, out, scale, only } = parsed.opts;
  if (!existsSync(file)) { console.error(`render-templates: file not found: ${file}`); process.exit(2); }
  const chromium = loadChromium();
  if (!chromium) { console.error(`render-templates: Playwright not found. ${PLAYWRIGHT_HELP}`); process.exit(3); }
  const browser = await chromium.launch();
  let report;
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1920 }, deviceScaleFactor: scale });
    await page.goto(pathToFileURL(resolve(file)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const frames = await page.$$eval('[data-frame]', (els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { name: el.dataset.frame, width: r.width, height: r.height, declared: el.dataset.size || null };
    }));
    const problems = checkFrames(frames, only);
    const outDir = resolve(out);
    mkdirSync(outDir, { recursive: true });
    const written = [];
    if (!problems.length) {
      for (const f of frames) {
        if (only && !only.includes(f.name)) continue;
        const path = join(outDir, `${f.name}.png`);
        await page.locator(`[data-frame="${f.name}"]`).screenshot({ path });
        written.push({ file: path, size: `${Math.round(f.width) * scale}x${Math.round(f.height) * scale}` });
      }
    }
    report = { ok: problems.length === 0, out: outDir, written, problems };
  } catch (e) {
    report = { ok: false, written: [], problems: [`render failed: ${e.message}`] };
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) await main();
