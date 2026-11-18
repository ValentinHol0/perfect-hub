// Run: node --test scripts/tests/assets.test.mjs   (from the plugin root)
// Pure PNG/ICO code is always tested; rendering runs only when Playwright resolves (PLAYWRIGHT_DIR or the cwd).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { decodePng, encodePng, flattenToRgb, buildIco, icons, render } from '../assets.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets.mjs');
const hasPlaywright = (() => { try { createRequire(join(resolve(process.env.PLAYWRIGHT_DIR || process.cwd()), 'package.json')).resolve('playwright'); return true; } catch { return false; } })();

const sample = () => {
  const width = 5, height = 4, channels = 4, data = Buffer.alloc(width * height * channels);
  for (let i = 0; i < data.length; i++) data[i] = (i * 37 + 11) % 256;
  return { width, height, channels, data };
};

test('assets: PNG encode/decode round-trips with every filter type', () => {
  const img = sample();
  for (const f of [0, 1, 2, 3, 4]) {
    const back = decodePng(encodePng(img, f));
    assert.equal(back.width, 5); assert.equal(back.height, 4); assert.equal(back.channels, 4);
    assert.ok(back.data.equals(img.data), `filter ${f}`);
  }
});

test('assets: flattenToRgb composites alpha over the background and drops the channel', () => {
  const img = { width: 2, height: 1, channels: 4, data: Buffer.from([255, 0, 0, 255, 0, 0, 255, 0]) };
  const rgb = flattenToRgb(img, '#00FF00');
  assert.equal(rgb.channels, 3);
  assert.deepEqual([...rgb.data], [255, 0, 0, 0, 255, 0]);
  const png = encodePng(rgb);
  assert.equal(png[25], 2, 'IHDR colour type 2 = RGB, no alpha');
  const half = flattenToRgb({ width: 1, height: 1, channels: 4, data: Buffer.from([0, 0, 0, 128]) }, '#FFFFFF');
  assert.deepEqual([...half.data], [127, 127, 127]);
});

test('assets: ICO directory points at embedded PNGs', () => {
  const a = encodePng(sample()), b = encodePng({ width: 1, height: 1, channels: 4, data: Buffer.alloc(4) });
  const ico = buildIco([{ size: 16, png: a }, { size: 256, png: b }]);
  assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico.readUInt16LE(4), 2);
  assert.equal(ico[6], 16); assert.equal(ico[22], 0, '256 is stored as 0');
  const off1 = ico.readUInt32LE(6 + 12), len1 = ico.readUInt32LE(6 + 8);
  assert.ok(ico.subarray(off1, off1 + len1).equals(a));
  const off2 = ico.readUInt32LE(22 + 12);
  assert.ok(ico.subarray(off2).equals(b));
});

test('assets CLI: usage and missing input exit 2', () => {
  assert.equal(spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' }).status, 2);
  assert.equal(spawnSync(process.execPath, [SCRIPT, 'icons', 'nope.svg'], { encoding: 'utf8' }).status, 2);
});

test('assets: icons and render produce correct files (Playwright)', { skip: !hasPlaywright && 'Playwright not resolvable — set PLAYWRIGHT_DIR' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-assets-'));
  const svg = join(dir, 'mark.svg');
  writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="#E61919"/></svg>');
  const files = await icons(svg, join(dir, 'out'), { name: 'Obrii', bg: '#0A0A0A' });
  for (const f of ['favicon.ico', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'site.webmanifest', 'head.html', 'ios/AppIcon-1024.png', 'android/ic_launcher_foreground.png', 'android/ic_launcher_monochrome.png', 'android/ic_launcher.xml', 'android/colors.xml', 'android/ic_launcher_legacy.png', 'android/play-store-512.png'])
    assert.ok(files.includes(f) && existsSync(join(dir, 'out', f)), f);
  const ios = decodePng(readFileSync(join(dir, 'out', 'ios', 'AppIcon-1024.png')));
  assert.equal(ios.channels, 3, 'iOS icon has no alpha channel');
  assert.equal(ios.width, 1024);
  const px = (img, x, y) => [...img.data.subarray((y * img.width + x) * img.channels, (y * img.width + x) * img.channels + 3)];
  assert.deepEqual(px(ios, 512, 512), [230, 25, 25], 'mark in the centre');
  assert.deepEqual(px(ios, 2, 2), [10, 10, 10], 'background in the corner');
  const fg = decodePng(readFileSync(join(dir, 'out', 'android', 'ic_launcher_foreground.png')));
  assert.equal(fg.width, 432); assert.equal(fg.channels, 4); assert.equal(fg.data[3], 0, 'foreground corner transparent');
  const mono = decodePng(readFileSync(join(dir, 'out', 'android', 'ic_launcher_monochrome.png')));
  assert.deepEqual(px(mono, 216, 216), [0, 0, 0], 'monochrome layer is a black silhouette');
  const manifest = JSON.parse(readFileSync(join(dir, 'out', 'site.webmanifest'), 'utf8'));
  assert.equal(manifest.icons.find((i) => i.purpose === 'maskable').sizes, '512x512');
  const og = join(dir, 'og.html');
  writeFileSync(og, '<!doctype html><body style="margin:0;background:#123456"><h1 style="color:#fff">Obrii</h1></body>');
  await render(og, join(dir, 'og.png'), { width: 1200, height: 630, opaque: true });
  const ogImg = decodePng(readFileSync(join(dir, 'og.png')));
  assert.equal(ogImg.width, 1200); assert.equal(ogImg.height, 630); assert.equal(ogImg.channels, 3);
  assert.deepEqual(px(ogImg, 1199, 629), [18, 52, 86]);
  rmSync(dir, { recursive: true, force: true });
});
