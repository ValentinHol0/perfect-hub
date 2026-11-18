#!/usr/bin/env node
// export-icons — renders an SVG logo master into the standard favicon and app-icon PNG set, plus favicon.ico,
// a <head> snippet and web-manifest icons. Zero dependencies; rendering uses Playwright when it is installed.
//
// Usage: node export-icons.mjs <master.svg> [--out deliverables/brand/icons] [--small <small.svg>]
//          [--bg #FFFFFF] [--pad 0.14] [--mask-scale 0.56] [--dry-run]
//   --small       simplified mark for 16/32/48 px and icon.svg (recommended: fewer details, heavier strokes)
//   --bg          background for opaque icons (apple-touch, maskable, store icons); default #FFFFFF
//   --pad         empty margin per side on opaque icons, as a fraction of the size (0..0.3, default 0.14)
//   --mask-scale  artwork box on the maskable icon (0.3..0.8, default 0.56 = square fits the 40 %-radius safe circle)
//   --dry-run     print the plan as JSON without rendering (no Playwright needed)
// Playwright: from $PLAYWRIGHT_DIR, else the current directory (same rule as the core's shots.mjs).
// Exit: 0 ok · 1 render/size failure · 2 usage error · 3 Playwright not found.

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PLAYWRIGHT_HELP, buildIco, flattenPng, loadChromium, parseHex, pngSize } from './lib/raster.mjs';

// file · px · src (master|small) · bg (none|bg) · scale (artwork box as fraction of px; 'pad' = 1 - 2*pad) · note
export const ICON_SET = [
  { file: 'favicon-16.png', px: 16, src: 'small', bg: 'none', scale: 1, use: 'packed into favicon.ico' },
  { file: 'favicon-32.png', px: 32, src: 'small', bg: 'none', scale: 1, use: 'packed into favicon.ico' },
  { file: 'favicon-48.png', px: 48, src: 'small', bg: 'none', scale: 1, use: 'packed into favicon.ico (Windows shortcuts)' },
  { file: 'apple-touch-icon.png', px: 180, src: 'master', bg: 'bg', scale: 'pad', use: 'iOS home screen (<link rel="apple-touch-icon">)' },
  { file: 'icon-192.png', px: 192, src: 'master', bg: 'none', scale: 1, use: 'web manifest, purpose any' },
  { file: 'icon-512.png', px: 512, src: 'master', bg: 'none', scale: 1, use: 'web manifest, purpose any' },
  { file: 'icon-mask.png', px: 512, src: 'master', bg: 'bg', scale: 'mask', use: 'web manifest, purpose maskable' },
  { file: 'play-store-512.png', px: 512, src: 'master', bg: 'bg', scale: 'pad', use: 'Google Play listing icon (32-bit PNG, max 1024 KB)' },
  { file: 'app-store-1024.png', px: 1024, src: 'master', bg: 'bg', scale: 'pad', flatten: true, use: 'App Store / Xcode single-size master (opaque, no alpha)' },
];

export const HEAD_SNIPPET = [
  '<link rel="icon" href="/favicon.ico" sizes="32x32">',
  '<link rel="icon" href="/icon.svg" type="image/svg+xml">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
  '<link rel="manifest" href="/manifest.webmanifest">',
].join('\n');

export const MANIFEST_ICONS = {
  icons: [
    { src: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    { src: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    { src: '/icon-mask.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
  ],
};

// Returns { opts } or { error }.
export function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run' || a === '--help' || a === '-h') flags[a.replace(/^-+/, '')] = true;
    else if (a.startsWith('--')) {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) return { error: `${a} needs a value` };
      flags[a.slice(2)] = v;
      i++;
    } else positional.push(a);
  }
  if (flags.help || flags.h) return { help: true };
  const known = new Set(['out', 'small', 'bg', 'pad', 'mask-scale', 'dry-run']);
  const unknown = Object.keys(flags).find((k) => !known.has(k));
  if (unknown) return { error: `Unknown option --${unknown}` };
  if (positional.length !== 1) return { error: 'Usage: node export-icons.mjs <master.svg> [--out <dir>] [--small <small.svg>] [--bg #FFFFFF] [--pad 0.14] [--mask-scale 0.56] [--dry-run]' };
  const pad = flags.pad === undefined ? 0.14 : Number(flags.pad);
  if (!(pad >= 0 && pad <= 0.3)) return { error: `--pad must be between 0 and 0.3 (got ${flags.pad})` };
  const maskScale = flags['mask-scale'] === undefined ? 0.56 : Number(flags['mask-scale']);
  if (!(maskScale >= 0.3 && maskScale <= 0.8)) return { error: `--mask-scale must be between 0.3 and 0.8 (got ${flags['mask-scale']})` };
  const bg = flags.bg ?? '#FFFFFF';
  try { parseHex(bg); } catch (e) { return { error: e.message }; }
  return {
    opts: {
      master: positional[0],
      small: flags.small || null,
      out: flags.out || join('deliverables', 'brand', 'icons'),
      bg,
      bgDefaulted: flags.bg === undefined,
      pad,
      maskScale,
      dryRun: Boolean(flags['dry-run']),
    },
  };
}

// Reads and checks an SVG file. Returns { svg, warnings } or throws with a usage-level message.
export function inspectSvg(path) {
  if (!existsSync(path)) throw new Error(`SVG not found: ${path}`);
  const svg = readFileSync(path, 'utf8');
  const root = svg.match(/<svg\b[^>]*>/i);
  if (!root) throw new Error(`Not an SVG file (no <svg> element): ${path}`);
  const warnings = [];
  const vb = root[0].match(/viewBox\s*=\s*["']\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (!vb) warnings.push(`${basename(path)}: no viewBox — scaling relies on width/height; add a tight viewBox`);
  else if (Math.abs(Number(vb[3]) - Number(vb[4])) > 0.01 * Math.max(Number(vb[3]), Number(vb[4]))) warnings.push(`${basename(path)}: viewBox is not square (${vb[3]}×${vb[4]}) — the mark is centred with empty bands; consider a square icon master`);
  if (/<text\b/i.test(svg)) warnings.push(`${basename(path)}: contains <text> — convert lettering to outlines; system fonts will substitute`);
  if (/<image\b/i.test(svg)) warnings.push(`${basename(path)}: embeds a raster <image> — a logo master should be pure vector`);
  if (/<(script|foreignObject)\b/i.test(svg)) warnings.push(`${basename(path)}: contains <script>/<foreignObject> — remove from a logo file`);
  return { svg, warnings };
}

export function plan(opts) {
  const artwork = (entry) => (entry.scale === 'pad' ? 1 - 2 * opts.pad : entry.scale === 'mask' ? opts.maskScale : entry.scale);
  const items = ICON_SET.map((e) => ({
    file: e.file,
    size: `${e.px}x${e.px}`,
    source: e.src === 'small' && opts.small ? opts.small : opts.master,
    background: e.bg === 'bg' ? opts.bg : 'transparent',
    artworkPx: Math.round(e.px * artwork(e)),
    alpha: !e.flatten,
    use: e.use,
  }));
  items.push({ file: 'favicon.ico', size: '16,32,48', source: 'favicon-16/32/48.png', use: 'root /favicon.ico' });
  items.push({ file: 'icon.svg', size: 'vector', source: opts.small || opts.master, use: 'modern browsers (<link rel="icon" type="image/svg+xml">)' });
  items.push({ file: 'head-snippet.html', use: 'paste into <head>' }, { file: 'manifest-icons.json', use: 'merge into manifest.webmanifest' });
  return items;
}

function html(svg, px, bg, artPx) {
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return `<!doctype html><html><body style="margin:0;background:transparent">
<div style="width:${px}px;height:${px}px;display:flex;align-items:center;justify-content:center;background:${bg}">
<img src="${src}" style="width:${artPx}px;height:${artPx}px;object-fit:contain;display:block" alt=""></div></body></html>`;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 14).join('\n'));
    process.exit(0);
  }
  if (parsed.error) { console.error(`export-icons: ${parsed.error}`); process.exit(2); }
  const opts = parsed.opts;
  let master, small;
  try {
    master = inspectSvg(opts.master);
    small = opts.small ? inspectSvg(opts.small) : master;
  } catch (e) { console.error(`export-icons: ${e.message}`); process.exit(2); }
  const warnings = [...master.warnings, ...(opts.small ? small.warnings : [])];
  if (opts.bgDefaulted) warnings.push('--bg not given: opaque icons use #FFFFFF; pass the brand background colour');
  const items = plan(opts);
  if (opts.dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, out: resolve(opts.out), items, warnings }, null, 2));
    return;
  }
  const chromium = loadChromium();
  if (!chromium) {
    console.error(`export-icons: Playwright not found. ${PLAYWRIGHT_HELP}`);
    process.exit(3);
  }
  const out = resolve(opts.out);
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const errors = [];
  const written = [];
  const pngs = {};
  try {
    const page = await browser.newPage();
    for (const [i, e] of ICON_SET.entries()) {
      const item = items[i];
      await page.setViewportSize({ width: e.px, height: e.px });
      await page.setContent(html((e.src === 'small' ? small : master).svg, e.px, e.bg === 'bg' ? opts.bg : 'transparent', item.artworkPx));
      await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
      let png = await page.screenshot({ clip: { x: 0, y: 0, width: e.px, height: e.px }, omitBackground: e.bg !== 'bg' });
      if (e.flatten) png = flattenPng(png, opts.bg);
      const { width, height } = pngSize(png);
      if (width !== e.px || height !== e.px) errors.push(`${e.file}: rendered ${width}×${height}, expected ${e.px}×${e.px}`);
      if (e.file === 'play-store-512.png' && png.length > 1024 * 1024) errors.push(`${e.file}: ${Math.round(png.length / 1024)} KB exceeds Google Play's 1024 KB`);
      writeFileSync(join(out, e.file), png);
      pngs[e.file] = png;
      written.push(e.file);
    }
  } catch (e) {
    errors.push(`render failed: ${e.message}`);
  } finally {
    await browser.close();
  }
  if (pngs['favicon-48.png']) {
    writeFileSync(join(out, 'favicon.ico'), buildIco([pngs['favicon-16.png'], pngs['favicon-32.png'], pngs['favicon-48.png']]));
    written.push('favicon.ico');
  }
  copyFileSync(opts.small || opts.master, join(out, 'icon.svg'));
  writeFileSync(join(out, 'head-snippet.html'), `${HEAD_SNIPPET}\n`);
  writeFileSync(join(out, 'manifest-icons.json'), `${JSON.stringify(MANIFEST_ICONS, null, 2)}\n`);
  written.push('icon.svg', 'head-snippet.html', 'manifest-icons.json');
  console.log(JSON.stringify({ ok: errors.length === 0, out, written, warnings, errors }, null, 2));
  process.exit(errors.length ? 1 : 0);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) await main();
