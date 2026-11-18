// Tests for brand component scripts. Run: node --test scripts/tests/brand.test.mjs
// Never calls the real image generator: gen-image is exercised through argument validation, the agy-missing
// path, `--check`, pure helpers and (POSIX only) a fake agy executable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as gen from '../gen-image.mjs';
import * as icons from '../export-icons.mjs';
import * as tpl from '../render-templates.mjs';
import { buildIco, crc32, decodePng, encodePng, flattenPng, pngSize } from '../lib/raster.mjs';
import { contrast } from '../contrast.mjs';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = () => mkdtempSync(join(tmpdir(), 'brand-test-'));

// Environment in which neither agy nor Playwright can be found.
function isolatedEnv(extra = {}) {
  const dir = tmp();
  return { ...process.env, AGY_PATH: join(dir, 'no-agy'), HOME: dir, USERPROFILE: dir, PATH: dir, Path: dir, PLAYWRIGHT_DIR: dir, NODE_PATH: '', ...extra };
}
const run = (script, args, env = isolatedEnv(), cwd = tmp()) => spawnSync(process.execPath, [join(SCRIPTS, script), ...args], { encoding: 'utf8', env, cwd });

// ---------- gen-image ----------
test('gen-image parseArgs: requires --out and a prompt', () => {
  assert.match(gen.parseArgs([]).error, /Usage/);
  assert.match(gen.parseArgs(['--out', 'a.png']).error, /Usage/);
  assert.match(gen.parseArgs(['--prompt', 'x']).error, /Usage/);
  assert.match(gen.parseArgs(['--out', 'a.png', '--prompt', '   ']).error, /Usage/);
});

test('gen-image parseArgs: validates extension, aspect and timeout', () => {
  assert.match(gen.parseArgs(['--out', 'a.gif', '--prompt', 'x']).error, /must end in/);
  assert.match(gen.parseArgs(['--out', 'a.png', '--prompt', 'x', '--aspect', '16x9']).error, /Invalid --aspect/);
  assert.match(gen.parseArgs(['--out', 'a.png', '--prompt', 'x', '--aspect', '0:1']).error, /Invalid --aspect/);
  assert.match(gen.parseArgs(['--out', 'a.png', '--prompt', 'x', '--timeout', 'abc']).error, /Invalid --timeout/);
  assert.match(gen.parseArgs(['--out', 'a.png', '--prompt', 'x', '--timeout', '5']).error, /Invalid --timeout/);
  assert.match(gen.parseArgs(['--out', 'a.png', '--prompt', 'x', '--aspect']).error, /Invalid --aspect/);
});

test('gen-image parseArgs: defaults and prompt file', () => {
  assert.deepEqual(gen.parseArgs(['--out', 'a.png', '--prompt', ' hi ']).opts, { out: 'a.png', prompt: 'hi', aspect: '1:1', timeout: 240 });
  assert.match(gen.parseArgs(['--out', 'a.png', '--prompt-file', join(tmp(), 'missing.txt')]).error, /not found/);
  const dir = tmp();
  const pf = join(dir, 'p.txt');
  writeFileSync(pf, '  flat lay of a ceramic cup  \n');
  assert.equal(gen.parseArgs(['--out', 'a.jpg', '--prompt-file', pf, '--aspect', '4:5']).opts.prompt, 'flat lay of a ceramic cup');
  assert.deepEqual(gen.parseArgs(['--check']).opts, { check: true });
});

test('gen-image: buildInstruction carries the aspect and forbids side effects', () => {
  const s = gen.buildInstruction('a red cup', '9:16');
  assert.match(s, /generate_image/);
  assert.match(s, /Aspect ratio: 9:16\./);
  assert.match(s, /Do not run shell commands/);
});

test('gen-image: extractImagePath handles JSON, raw text, status and no path', () => {
  assert.equal(gen.extractImagePath(JSON.stringify({ status: 'SUCCESS', response: 'C:\\Users\\x\\img_1.png' })).source, 'C:\\Users\\x\\img_1.png');
  assert.equal(gen.extractImagePath('Saved to /home/u/.gemini/out/a b.jpeg\n').source, '/home/u/.gemini/out/a b.jpeg');
  const failed = gen.extractImagePath(JSON.stringify({ status: 'ERROR', response: 'quota' }));
  assert.equal(failed.status, 'ERROR');
  assert.equal(failed.source, null);
  assert.equal(gen.extractImagePath('').source, null);
});

test('gen-image: resolveOut keeps the real format', () => {
  assert.match(gen.resolveOut('out/hero.png', '/x/y.jpg'), /hero\.jpg$/);
  assert.match(gen.resolveOut('out/hero.jpeg', '/x/y.jpg'), /hero\.jpeg$/);
  assert.match(gen.resolveOut('out/hero.webp', '/x/y.webp'), /hero\.webp$/);
});

test('gen-image: findAgy prefers AGY_PATH, returns null when nothing exists', () => {
  assert.equal(gen.findAgy({ AGY_PATH: process.execPath }, tmp(), () => null), process.execPath);
  assert.equal(gen.findAgy({ AGY_PATH: join(tmp(), 'nope') }, tmp(), () => null), null);
});

test('gen-image CLI: usage error exits 2 with JSON', () => {
  const r = run('gen-image.mjs', []);
  assert.equal(r.status, 2);
  assert.equal(JSON.parse(r.stdout).ok, false);
});

test('gen-image CLI: agy missing exits 2 and names the fallback', () => {
  const r = run('gen-image.mjs', ['--out', 'a.png', '--prompt', 'a cup']);
  assert.equal(r.status, 2);
  const out = JSON.parse(r.stdout);
  assert.equal(out.ok, false);
  assert.match(out.error, /agy\) not found/);
  assert.equal(run('gen-image.mjs', ['--check']).status, 2);
});

test('gen-image CLI: --check reports an available agy without generating', () => {
  const r = run('gen-image.mjs', ['--check'], isolatedEnv({ AGY_PATH: process.execPath }));
  assert.equal(r.status, 0);
  assert.deepEqual(JSON.parse(r.stdout), { ok: true, agy: process.execPath });
});

test('gen-image CLI: end-to-end with a fake agy (POSIX only)', { skip: process.platform === 'win32' && 'needs an executable script' }, () => {
  const dir = tmp();
  const img = join(dir, 'generated.png');
  writeFileSync(img, encodePng({ width: 1, height: 1, channels: 3, data: Buffer.from([1, 2, 3]) }));
  const fake = join(dir, 'agy');
  writeFileSync(fake, `#!/bin/sh\necho '${JSON.stringify({ status: 'SUCCESS', response: img })}'\n`);
  chmodSync(fake, 0o755);
  const out = join(dir, 'deliv', 'hero.jpg');
  const r = run('gen-image.mjs', ['--out', out, '--prompt', 'x'], isolatedEnv({ AGY_PATH: fake }));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const res = JSON.parse(r.stdout);
  assert.match(res.out, /hero\.png$/);
  assert.ok(existsSync(res.out));
});

// ---------- raster helpers ----------
test('raster: crc32 known vector', () => {
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
});

test('raster: PNG encode/decode round trip (RGB and RGBA)', () => {
  const rgba = { width: 2, height: 2, channels: 4, data: Buffer.from([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 0, 9, 9, 9, 255]) };
  const back = decodePng(encodePng(rgba));
  assert.deepEqual([back.width, back.height, back.channels], [2, 2, 4]);
  assert.deepEqual([...back.data], [...rgba.data]);
  assert.deepEqual(pngSize(encodePng({ width: 3, height: 1, channels: 3, data: Buffer.alloc(9) })), { width: 3, height: 1 });
  assert.throws(() => pngSize(Buffer.from('not a png at all, really not')), /Not a PNG/);
});

test('raster: flattenPng removes alpha over the background', () => {
  const src = encodePng({ width: 2, height: 1, channels: 4, data: Buffer.from([10, 20, 30, 255, 200, 200, 200, 0]) });
  const flat = decodePng(flattenPng(src, '#0E3B2E'));
  assert.equal(flat.channels, 3);
  assert.deepEqual([...flat.data], [10, 20, 30, 0x0e, 0x3b, 0x2e]);
});

test('raster: buildIco writes a valid directory', () => {
  const p16 = encodePng({ width: 16, height: 16, channels: 4, data: Buffer.alloc(16 * 16 * 4) });
  const p32 = encodePng({ width: 32, height: 32, channels: 4, data: Buffer.alloc(32 * 32 * 4) });
  const ico = buildIco([p16, p32]);
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 2);
  assert.equal(ico[6], 16);
  assert.equal(ico[22], 32);
  assert.equal(ico.readUInt32LE(6 + 12), 6 + 32);
  assert.ok(ico.subarray(6 + 32, 6 + 40).equals(p16.subarray(0, 8)));
  assert.throws(() => buildIco([]), /at least one/);
});

// ---------- export-icons ----------
test('export-icons parseArgs: validation', () => {
  assert.match(icons.parseArgs([]).error, /Usage/);
  assert.match(icons.parseArgs(['a.svg', '--pad', '0.5']).error, /--pad/);
  assert.match(icons.parseArgs(['a.svg', '--mask-scale', '1']).error, /--mask-scale/);
  assert.match(icons.parseArgs(['a.svg', '--bg', 'green']).error, /Invalid colour/);
  assert.match(icons.parseArgs(['a.svg', '--wat', '1']).error, /Unknown option/);
  assert.match(icons.parseArgs(['a.svg', '--out']).error, /needs a value/);
  const ok = icons.parseArgs(['a.svg', '--bg', '#123', '--dry-run']).opts;
  assert.equal(ok.dryRun, true);
  assert.equal(ok.bg, '#123');
  assert.equal(ok.bgDefaulted, false);
});

test('export-icons inspectSvg: warnings for text, raster, missing/non-square viewBox', () => {
  const dir = tmp();
  const a = join(dir, 'a.svg');
  writeFileSync(a, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text>Hi</text><image href="x.png"/></svg>');
  const w = icons.inspectSvg(a).warnings.join('\n');
  assert.match(w, /not square/);
  assert.match(w, /<text>/);
  assert.match(w, /raster/);
  const b = join(dir, 'b.svg');
  writeFileSync(b, '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>');
  assert.match(icons.inspectSvg(b).warnings.join('\n'), /no viewBox/);
  const c = join(dir, 'c.txt');
  writeFileSync(c, 'hello');
  assert.throws(() => icons.inspectSvg(c), /Not an SVG/);
  assert.throws(() => icons.inspectSvg(join(dir, 'none.svg')), /not found/);
});

test('export-icons plan: standard sizes and artwork boxes', () => {
  const items = icons.plan({ master: 'm.svg', small: 's.svg', bg: '#000000', pad: 0.14, maskScale: 0.56 });
  const by = Object.fromEntries(items.map((i) => [i.file, i]));
  for (const [f, s] of [['favicon-16.png', '16x16'], ['favicon-32.png', '32x32'], ['apple-touch-icon.png', '180x180'], ['icon-192.png', '192x192'], ['icon-512.png', '512x512'], ['icon-mask.png', '512x512'], ['play-store-512.png', '512x512'], ['app-store-1024.png', '1024x1024']]) assert.equal(by[f].size, s, f);
  assert.equal(by['favicon-16.png'].source, 's.svg');
  assert.equal(by['icon-512.png'].source, 'm.svg');
  assert.equal(by['icon-mask.png'].artworkPx, 287);
  assert.ok(287 / 2 * Math.SQRT2 <= 0.4 * 512, 'maskable artwork must fit the 40 % radius safe circle');
  assert.equal(by['apple-touch-icon.png'].artworkPx, Math.round(180 * 0.72));
  assert.equal(by['app-store-1024.png'].alpha, false);
  assert.ok(by['favicon.ico'] && by['icon.svg'] && by['head-snippet.html'] && by['manifest-icons.json']);
  assert.match(icons.HEAD_SNIPPET, /sizes="32x32"/);
});

test('export-icons CLI: dry run needs no Playwright; render without it exits 3', () => {
  const dir = tmp();
  const svg = join(dir, 'mark.svg');
  writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>');
  const dry = run('export-icons.mjs', [svg, '--dry-run', '--bg', '#101010'], isolatedEnv(), dir);
  assert.equal(dry.status, 0, dry.stderr);
  assert.equal(JSON.parse(dry.stdout).items.length, 13);
  const r = run('export-icons.mjs', [svg, '--bg', '#101010'], isolatedEnv(), dir);
  assert.equal(r.status, 3);
  assert.match(r.stderr, /npm i -D playwright/);
  assert.equal(run('export-icons.mjs', [join(dir, 'missing.svg')]).status, 2);
});

// ---------- render-templates ----------
test('render-templates: parseSize and parseArgs', () => {
  assert.deepEqual(tpl.parseSize('1080x1350'), { width: 1080, height: 1350 });
  assert.deepEqual(tpl.parseSize('1080 × 1920'), { width: 1080, height: 1920 });
  assert.equal(tpl.parseSize('big'), null);
  assert.match(tpl.parseArgs([]).error, /Usage/);
  assert.match(tpl.parseArgs(['a.svg']).error, /\.html/);
  assert.match(tpl.parseArgs(['a.html', '--scale', '4']).error, /--scale/);
  assert.deepEqual(tpl.parseArgs(['a.html', '--only', 'post-01, story-01']).opts.only, ['post-01', 'story-01']);
});

test('render-templates: checkFrames catches bad names, duplicates, zero size, size drift', () => {
  assert.deepEqual(tpl.checkFrames([{ name: 'post-01', width: 1080, height: 1350, declared: '1080x1350' }]), []);
  const p = tpl.checkFrames([
    { name: 'post 1', width: 10, height: 10 },
    { name: 'a', width: 0, height: 10 },
    { name: 'a', width: 1080, height: 1349.6, declared: '1080x1350' },
    { name: 'b', width: 1080, height: 1080, declared: '1080x1350' },
  ], ['zzz']).join('\n');
  assert.match(p, /Invalid frame name "post 1"/);
  assert.match(p, /Duplicate frame name "a"/);
  assert.match(p, /zero size/);
  assert.match(p, /"b" renders at 1080×1080/);
  assert.match(p, /no frame named "zzz"/);
  assert.doesNotMatch(p, /"a" renders at/);
  assert.match(tpl.checkFrames([]).join(''), /No elements/);
});

test('render-templates CLI: missing file exits 2, no Playwright exits 3', () => {
  const dir = tmp();
  assert.equal(run('render-templates.mjs', [join(dir, 'none.html')]).status, 2);
  const html = join(dir, 't.html');
  writeFileSync(html, '<div data-frame="a" style="width:10px;height:10px"></div>');
  const r = run('render-templates.mjs', [html], isolatedEnv(), dir);
  assert.equal(r.status, 3);
  assert.match(r.stderr, /Playwright not found/);
});

// ---------- contrast (shared with the core) ----------
test('contrast: known ratios and CLI exit codes', () => {
  assert.equal(contrast('#000000', '#FFFFFF').toFixed(2), '21.00');
  assert.equal(run('contrast.mjs', ['#111111', '#F4F4F0']).status, 0);
  assert.equal(run('contrast.mjs', ['#999999', '#FFFFFF']).status, 1);
  assert.equal(run('contrast.mjs', ['bg=#FFFFFF', 'ink=#111111', 'accent=#0E3B2E', 'accent-ink=#E8F5C8']).status, 0);
  assert.equal(run('contrast.mjs', ['nonsense']).status, 2);
});

test('scripts carry a usage header', () => {
  for (const f of ['gen-image.mjs', 'export-icons.mjs', 'render-templates.mjs', 'contrast.mjs']) {
    assert.match(readFileSync(join(SCRIPTS, f), 'utf8'), /Usage|Pair mode/, f);
  }
});
