#!/usr/bin/env node
// assets — product assets from one master SVG, rendered with Playwright (Chromium), PNG/ICO written without dependencies.
//
//   node assets.mjs icons <master.svg> --out <dir> [--mark mark.svg] [--name "App"] [--short "App"] [--bg #FFFFFF] [--theme #111111]
//     master = the icon as it should look (a mark on transparent is best); --mark = the mark alone on transparent,
//     used for maskable and Android foreground/monochrome when the master is a full tile with its own background.
//                         [--pad 0.12] [--maskable-scale 0.56] [--android-scale 0.61] [--only web,ios,android]
//     web:     favicon.ico (16/32/48) · icon.svg · icon-192.png · icon-512.png · icon-maskable-512.png ·
//              apple-touch-icon.png (180, opaque) · site.webmanifest · head.html (tags to paste)
//     ios:     ios/AppIcon-1024.png (opaque, no alpha channel — App Store Connect rejects alpha)
//     android: android/ic_launcher_foreground.png + ic_launcher_monochrome.png (432 = 108 dp @ xxxhdpi, transparent)
//              · android/ic_launcher.xml (adaptive icon) · android/colors.xml · android/ic_launcher_legacy.png (192)
//              · android/play-store-512.png
//   node assets.mjs render <page.html | image.svg | https://url> --size 1200x630 --out og.png [--opaque] [--bg #hex]
//     Renders any HTML/SVG at an exact size — Open Graph cards (1200×630), store screenshots, splash screens.
//
// Playwright is resolved from $PLAYWRIGHT_DIR, else the current project (npm i -D playwright && npx playwright install chromium).
// Scales are the share of the canvas the artwork's bounding box may use: maskable 0.56 keeps a square mark inside the
// W3C maskable safe zone (circle of radius 40 %); Android 0.61 ≈ the 66 dp safe zone of a 108 dp adaptive layer
// (use ~0.47 for square marks under circular masks).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, resolve, extname, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inflateSync, deflateSync } from 'node:zlib';

// ---------- PNG (8-bit, non-interlaced) ----------
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };
const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };

export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  let pos = 8, width, height, depth, type, interlace; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos); const name = buf.toString('latin1', pos + 4, pos + 8); const data = buf.subarray(pos + 8, pos + 8 + len);
    if (name === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; type = data[9]; interlace = data[12]; }
    else if (name === 'IDAT') idat.push(data);
    else if (name === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8 || interlace !== 0 || !(type in CHANNELS)) throw new Error(`unsupported PNG (depth ${depth}, colour type ${type}, interlace ${interlace})`);
  const ch = CHANNELS[type], stride = width * ch, raw = inflateSync(Buffer.concat(idat)), out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? out[dst + x - ch] : 0, b = y ? out[dst - stride + x] : 0, c = x >= ch && y ? out[dst - stride + x - ch] : 0, v = raw[src + x];
      out[dst + x] = (f === 0 ? v : f === 1 ? v + a : f === 2 ? v + b : f === 3 ? v + ((a + b) >> 1) : v + paeth(a, b, c)) & 0xff;
    }
  }
  return { width, height, channels: ch, data: out };
}

export function encodePng({ width, height, channels, data }, filter = 0) {
  const type = { 1: 0, 2: 4, 3: 2, 4: 6 }[channels];
  const stride = width * channels, raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = filter;
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, v = data[i], a = x >= channels ? data[i - channels] : 0, b = y ? data[i - stride] : 0, c = x >= channels && y ? data[i - stride - channels] : 0;
      raw[y * (stride + 1) + 1 + x] = (filter === 0 ? v : filter === 1 ? v - a : filter === 2 ? v - b : filter === 3 ? v - ((a + b) >> 1) : v - paeth(a, b, c)) & 0xff;
    }
  }
  const chunk = (name, body) => { const len = Buffer.alloc(4); len.writeUInt32BE(body.length); const nb = Buffer.concat([Buffer.from(name, 'latin1'), body]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(nb)); return Buffer.concat([len, nb, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = type; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const hexRgb = (hex) => { const h = hex.replace('#', ''); const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h; if (!/^[0-9a-f]{6}$/i.test(f)) throw new Error(`bad colour ${hex}`); return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)); };

// Composite onto a background and drop the alpha channel (App Store icons must not have one).
export function flattenToRgb(img, bg = '#FFFFFF') {
  if (img.channels === 3) return img;
  if (img.channels !== 4) throw new Error('flattenToRgb expects RGBA');
  const [br, bgc, bb] = hexRgb(bg); const out = Buffer.alloc(img.width * img.height * 3);
  for (let p = 0, q = 0; p < img.data.length; p += 4, q += 3) {
    const a = img.data[p + 3] / 255;
    out[q] = Math.round(img.data[p] * a + br * (1 - a)); out[q + 1] = Math.round(img.data[p + 1] * a + bgc * (1 - a)); out[q + 2] = Math.round(img.data[p + 2] * a + bb * (1 - a));
  }
  return { width: img.width, height: img.height, channels: 3, data: out };
}

// ICO with PNG-compressed entries (supported by every current browser and Windows Vista+).
export function buildIco(entries) {
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length; const dir = [];
  for (const { size, png } of entries) {
    const e = Buffer.alloc(16); e[0] = size >= 256 ? 0 : size; e[1] = size >= 256 ? 0 : size; e[2] = 0; e[3] = 0;
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(png.length, 8); e.writeUInt32LE(offset, 12);
    dir.push(e); offset += png.length;
  }
  return Buffer.concat([head, ...dir, ...entries.map((x) => x.png)]);
}

// ---------- rendering ----------
async function browser() {
  const base = resolve(process.env.PLAYWRIGHT_DIR || process.cwd());
  let chromium;
  try { ({ chromium } = createRequire(join(base, 'package.json'))('playwright')); }
  catch { throw Object.assign(new Error(`Playwright not found from ${base}. Set PLAYWRIGHT_DIR to a folder that has it, or: npm i -D playwright && npx playwright install chromium`), { code: 2 }); }
  return chromium.launch();
}

async function renderSvg(page, svgText, size, { scale = 1, bg = null, mono = false } = {}) {
  await page.setViewportSize({ width: size, height: size });
  const uri = `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;
  const box = Math.round(size * scale);
  await page.setContent(`<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:${bg || 'transparent'}"><img src="${uri}" style="width:${box}px;height:${box}px;object-fit:contain;${mono ? 'filter:brightness(0)' : ''}"></body></html>`);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  return page.screenshot({ omitBackground: !bg, clip: { x: 0, y: 0, width: size, height: size } });
}

export async function icons(master, out, o = {}) {
  const svg = readFileSync(master, 'utf8');
  if (!/<svg[\s>]/i.test(svg)) throw new Error(`${master} is not an SVG`);
  // The mark (artwork on a transparent background) feeds the layers platforms mask or tint themselves: maskable,
  // Android foreground and monochrome. A full-tile master would turn the monochrome layer into a solid square.
  const mark = o.mark ? readFileSync(o.mark, 'utf8') : svg;
  const name = o.name || 'App', short = o.short || name.slice(0, 12), bg = o.bg || '#FFFFFF', theme = o.theme || bg;
  const pad = o.pad ?? 0.12, full = 1 - 2 * pad, only = new Set((o.only || 'web,ios,android').split(','));
  const written = [];
  const w = (rel, buf) => { const p = join(out, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, buf); written.push(rel); };
  const b = await browser();
  try {
    const page = await b.newPage();
    if (only.has('web')) {
      const ico = [];
      for (const s of [16, 32, 48]) ico.push({ size: s, png: await renderSvg(page, svg, s) });
      w('favicon.ico', buildIco(ico));
      copyFileSync(master, join(out, 'icon.svg')); written.push('icon.svg');
      w('icon-192.png', await renderSvg(page, svg, 192));
      w('icon-512.png', await renderSvg(page, svg, 512));
      w('icon-maskable-512.png', encodePng(flattenToRgb(decodePng(await renderSvg(page, mark, 512, { scale: o.maskableScale ?? 0.56, bg })), bg)));
      w('apple-touch-icon.png', encodePng(flattenToRgb(decodePng(await renderSvg(page, svg, 180, { scale: full, bg })), bg)));
      w('site.webmanifest', JSON.stringify({ name, short_name: short, icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ], theme_color: theme, background_color: bg, display: 'standalone', start_url: '/' }, null, 2) + '\n');
      w('head.html', ['<link rel="icon" href="/favicon.ico" sizes="32x32">', '<link rel="icon" href="/icon.svg" type="image/svg+xml">', '<link rel="apple-touch-icon" href="/apple-touch-icon.png">', '<link rel="manifest" href="/site.webmanifest">', `<meta name="theme-color" content="${theme}">`].join('\n') + '\n');
    }
    if (only.has('ios')) w('ios/AppIcon-1024.png', encodePng(flattenToRgb(decodePng(await renderSvg(page, svg, 1024, { scale: full, bg })), bg)));
    if (only.has('android')) {
      const as = o.androidScale ?? 0.61;
      w('android/ic_launcher_foreground.png', await renderSvg(page, mark, 432, { scale: as }));
      w('android/ic_launcher_monochrome.png', await renderSvg(page, mark, 432, { scale: as, mono: true }));
      w('android/ic_launcher_legacy.png', encodePng(flattenToRgb(decodePng(await renderSvg(page, svg, 192, { scale: full, bg })), bg)));
      w('android/play-store-512.png', encodePng(flattenToRgb(decodePng(await renderSvg(page, svg, 512, { scale: full, bg })), bg)));
      w('android/ic_launcher.xml', `<?xml version="1.0" encoding="utf-8"?>\n<!-- res/mipmap-anydpi-v26/ic_launcher.xml; put the PNGs in res/mipmap-xxxhdpi/ (or export vector drawables) -->\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n  <background android:drawable="@color/ic_launcher_background"/>\n  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n  <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>\n</adaptive-icon>\n`);
      w('android/colors.xml', `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <color name="ic_launcher_background">${bg}</color>\n</resources>\n`);
    }
  } finally { await b.close(); }
  return written;
}

export async function render(input, out, { width = 1200, height = 630, opaque = false, bg = '#FFFFFF' } = {}) {
  const b = await browser();
  try {
    const page = await b.newPage({ viewport: { width, height } });
    if (/^https?:\/\//i.test(input)) await page.goto(input, { waitUntil: 'networkidle' });
    else if (extname(input).toLowerCase() === '.svg') await page.setContent(`<!doctype html><body style="margin:0">${readFileSync(input, 'utf8').replace('<svg', `<svg width="${width}" height="${height}"`)}</body>`);
    else await page.goto(pathToFileURL(resolve(input)).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    let png = await page.screenshot({ omitBackground: !opaque, clip: { x: 0, y: 0, width, height } });
    if (opaque) png = encodePng(flattenToRgb(decodePng(png), bg));
    mkdirSync(dirname(resolve(out)), { recursive: true });
    writeFileSync(out, png);
    return out;
  } finally { await b.close(); }
}

async function main() {
  const [cmd, input, ...rest] = process.argv.slice(2);
  const opt = (k, d) => { const i = rest.indexOf(`--${k}`); return i >= 0 && rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : d; };
  const num = (k) => (opt(k) != null ? Number(opt(k)) : undefined);
  const usage = 'Usage:\n  node assets.mjs icons <master.svg> --out <dir> [--mark mark.svg] [--name App] [--short App] [--bg #FFFFFF] [--theme #hex] [--pad 0.12] [--maskable-scale 0.56] [--android-scale 0.61] [--only web,ios,android]\n  node assets.mjs render <page.html|image.svg|url> --size 1200x630 --out og.png [--opaque] [--bg #hex]';
  try {
    if (cmd === 'icons' && input && existsSync(input)) {
      const out = opt('out', 'icons');
      if (opt('mark') && !existsSync(opt('mark'))) throw new Error(`--mark ${opt('mark')} not found`);
      const files = await icons(input, out, { mark: opt('mark'), name: opt('name'), short: opt('short'), bg: opt('bg'), theme: opt('theme'), pad: num('pad'), maskableScale: num('maskable-scale'), androidScale: num('android-scale'), only: opt('only') });
      console.log(JSON.stringify({ out: resolve(out), files }, null, 2));
    } else if (cmd === 'render' && input) {
      const [width, height] = (opt('size', '1200x630')).split('x').map(Number);
      if (!width || !height) throw new Error('--size must look like 1200x630');
      console.log(JSON.stringify({ out: resolve(await render(input, opt('out', 'render.png'), { width, height, opaque: rest.includes('--opaque'), bg: opt('bg', '#FFFFFF') })), width, height }));
    } else { console.error(usage); process.exit(2); }
  } catch (e) { console.error(`assets: ${e.message}`); process.exit(e.code === 2 ? 2 : 1); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
