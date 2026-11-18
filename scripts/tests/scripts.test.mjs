// Run: node --test scripts/tests/   (from the plugin root)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { contrast, parseColor } from '../contrast.mjs';
import { lintText } from '../design-lint.mjs';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const node = (args, opts = {}) => spawnSync(process.execPath, args, { encoding: 'utf8', ...opts });
const ids = (findings) => findings.map((f) => f.id);

// ---------- contrast.mjs ----------
test('contrast: black on white is 21:1', () => assert.equal(contrast('#000', '#ffffff').toFixed(2), '21.00'));
test('contrast: identical colours are 1:1', () => assert.equal(contrast('#777777', '#777777').toFixed(2), '1.00'));
test('contrast: rgb() and oklch() parse', () => {
  assert.deepEqual(parseColor('rgb(10, 20, 30)'), [10, 20, 30]);
  assert.deepEqual(parseColor('oklch(1 0 0)'), [255, 255, 255]);
  assert.deepEqual(parseColor('oklch(0% 0 0)'), [0, 0, 0]);
});
test('contrast: invalid colour throws', () => assert.throws(() => parseColor('#zz')));
test('contrast CLI: failing role pair exits 1, passing exits 0', () => {
  const bad = node([join(SCRIPTS, 'contrast.mjs'), 'bg=#FFFFFF', 'ink=#AAAAAA']);
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /FAIL/);
  const good = node([join(SCRIPTS, 'contrast.mjs'), 'bg=#FFFFFF', 'ink=#111111', 'border=#F2F2F2']);
  assert.equal(good.status, 0, good.stdout + good.stderr); // border below threshold is only a WARN
  assert.match(good.stdout, /WARN/);
});
test('contrast CLI: --css reads tokens', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-contrast-'));
  const css = join(dir, 't.css');
  writeFileSync(css, ':root{--bg:#F7F7F4;--ink:#1C1B22;--color-accent:#C9370F;--accent-ink:#FFFFFF}');
  const r = node([join(SCRIPTS, 'contrast.mjs'), '--css', css]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /accent-ink on accent/);
  rmSync(dir, { recursive: true, force: true });
});

// ---------- design-lint.mjs ----------
test('design-lint: flags emoji, lorem, placeholder image, missing alt', () => {
  const html = '<h2>🚀 Fast</h2>\n<p>Lorem ipsum dolor</p>\n<img src="https://picsum.photos/200">';
  const f = ids(lintText(html, '.html'));
  for (const id of ['DL-EMOJI', 'DL-LOREM', 'DL-PLACEHOLDER-IMG', 'DL-IMG-ALT']) assert.ok(f.includes(id), `${id} missing in ${f}`);
});
test('design-lint: typographic symbols are not emoji', () => {
  assert.deepEqual(ids(lintText('<p>© 2026 Brand™ — 3 × 4 → done ✓</p>', '.html')), []);
});
test('design-lint: outline-none needs focus-visible replacement', () => {
  assert.ok(ids(lintText('<button className="outline-none">x</button>', '.tsx')).includes('DL-OUTLINE'));
  assert.ok(!ids(lintText('<button className="outline-none focus-visible:outline-2">x</button>', '.tsx')).includes('DL-OUTLINE'));
});
test('design-lint: gradient text, Lila gradient, h-screen', () => {
  const f = ids(lintText('<h1 className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500 h-screen">', '.tsx'));
  for (const id of ['DL-GRADIENT-TEXT', 'DL-LILA', 'DL-VH']) assert.ok(f.includes(id), `${id} missing`);
});
test('design-lint: clickable div and icon-only button', () => {
  const f = ids(lintText('<div onClick={go}>Open</div>\n<button><svg viewBox="0 0 1 1"></svg></button>', '.jsx'));
  assert.ok(f.includes('DL-DIV-CLICK'));
  assert.ok(f.includes('DL-ICON-BUTTON'));
  assert.ok(!ids(lintText('<button aria-label="Close"><svg></svg></button>', '.jsx')).includes('DL-ICON-BUTTON'));
});
test('design-lint: multi-line img with alt is fine; 100dvh is fine', () => {
  assert.deepEqual(ids(lintText('<img\n  src="/a.png"\n  alt="Team at work"\n/>', '.tsx')), []);
  assert.deepEqual(ids(lintText('.hero{min-height:100dvh}', '.css')), []);
});
test('design-lint: html document needs lang and viewport', () => {
  const bare = ids(lintText('<!doctype html><html><head><title>x</title></head><body></body></html>', '.html'));
  assert.ok(bare.includes('DL-NO-LANG') && bare.includes('DL-NO-VIEWPORT'));
  const ok = ids(lintText('<html lang="uk"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head></html>', '.html'));
  assert.deepEqual(ok, []);
});
test('design-lint: pseudo-element strip, inset-shadow strip, CSS arrow, 100vw, overflow hidden', () => {
  const css = '.card::before {\n  content: "";\n  position: absolute;\n  inset: 0 auto 0 0;\n  width: 6px;\n  background: var(--accent);\n}\n.note { box-shadow: inset 4px 0 0 red; }\n.link::after { content: "→"; }\n.wide { width: 100vw; }\nbody { overflow-x: hidden; }';
  const f = ids(lintText(css, '.css'));
  for (const id of ['DL-BORDER-ACCENT', 'DL-ARROW-LINK', 'DL-100VW', 'DL-OVERFLOW-HIDDEN']) assert.ok(f.includes(id), `${id} missing in ${f}`);
  assert.equal(f.filter((x) => x === 'DL-BORDER-ACCENT').length, 2);
  assert.deepEqual(ids(lintText('.badge::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: red; }', '.css')), []);
});
test('design-lint: headings, Ukrainian copy, middot meta, paste blocking, template residue', () => {
  const html = '<html lang="uk"><head><meta name="viewport" content="width=device-width"></head><body>\n<h1>A</h1>\n<h3>B</h3>\n<h1>C</h1>\n<button>Надіслати</button>\n<p>Швидко · Зручно · Надійно</p>\n<input onpaste="return false">\n<p>Welcome to [Company Name]</p>\n</body></html>';
  const f = ids(lintText(html, '.html'));
  for (const id of ['DL-H1-COUNT', 'DL-HEADING-SKIP', 'DL-VAGUE-CTA', 'DL-MIDDOT-META', 'DL-NO-PASTE', 'DL-TEMPLATE-RESIDUE']) assert.ok(f.includes(id), `${id} missing in ${f}`);
});
test('design-lint: disable comments mute only what they name', () => {
  const same = ids(lintText('<p>Lorem ipsum</p> <!-- design-lint-disable-line DL-LOREM -->', '.html'));
  assert.deepEqual(same, []);
  const next = ids(lintText('<!-- design-lint-disable-next-line DL-EMOJI -->\n<p>🚀 Lorem ipsum</p>', '.html'));
  assert.deepEqual(next, ['DL-LOREM']);
});
test('contrast: UI threshold, extra roles, unknown-role warning, dark scope', () => {
  const C = (...a) => node([join(SCRIPTS, 'contrast.mjs'), ...a]);
  assert.equal(C('#767676', '#ffffff').status, 0); // 4.54
  assert.equal(C('#949494', '#ffffff').status, 1); // 3.03 fails text gate
  assert.equal(C('#949494', '#ffffff', '--ui').status, 0); // passes 3:1
  const roles = C('bg=#FFFFFF', 'surface=#FFFFFF', 'ink=#111111', 'control-border=#D0D0D0', 'tone=#123456');
  assert.equal(roles.status, 1);
  assert.match(roles.stdout, /FAIL .*control-border on surface/);
  assert.match(roles.stdout, /unknown role "tone"/);
  const dir = mkdtempSync(join(tmpdir(), 'ppp-dark-'));
  const css = join(dir, 't.css');
  writeFileSync(css, ':root{--bg:#FFFFFF;--ink:#111111}\n@media (prefers-color-scheme: dark){:root{--bg:#101010;--ink:#1A1A1A}}');
  assert.equal(C('--css', css).status, 0);
  const dark = C('--css', css, '--scope=dark');
  assert.equal(dark.status, 1);
  assert.match(dark.stdout, /FAIL .*ink on bg/);
  rmSync(dir, { recursive: true, force: true });
});
test('design-lint CLI: exit 1 on P0, 0 when clean', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-lint-'));
  writeFileSync(join(dir, 'bad.html'), '<img src="x.png">');
  writeFileSync(join(dir, 'good.html'), '<img src="x.png" alt="Product">');
  assert.equal(node([join(SCRIPTS, 'design-lint.mjs'), join(dir, 'bad.html')]).status, 1);
  assert.equal(node([join(SCRIPTS, 'design-lint.mjs'), join(dir, 'good.html')]).status, 0);
  const json = JSON.parse(node([join(SCRIPTS, 'design-lint.mjs'), dir, '--json']).stdout);
  assert.equal(json.files, 2);
  assert.equal(json.counts.P0, 1);
  rmSync(dir, { recursive: true, force: true });
});

// ---------- ledger.js ----------
test('ledger: init → next → set → re-init preserves progress; deps respected', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-ledger-'));
  mkdirSync(join(dir, '.planning'));
  const plan = join(dir, '.planning', 'ROADMAP.md');
  writeFileSync(plan, '### Task 1: Types\n- Depends on: none\n### Task 2: API\n- Depends on: [1]\n');
  const L = (...a) => node([join(SCRIPTS, 'ledger.js'), ...a], { cwd: dir });
  assert.equal(L('init').status, 0);
  assert.equal(JSON.parse(L('next').stdout).id, 1);
  L('set', '1', 'COMPLETE', 'abc123');
  assert.equal(JSON.parse(L('next').stdout).id, 2);
  writeFileSync(plan, readFileSync(plan, 'utf8') + '### Task 3: UI\n- Depends on: [2]\n');
  assert.match(L('init').stdout, /1 new, 2 preserved/);
  const state = readFileSync(join(dir, '.planning', 'STATE.md'), 'utf8');
  assert.match(state, /\| 1 \| COMPLETE \|/);
  L('set', '2', 'BLOCKED', 'round 5');
  const next = L('next');
  assert.equal(next.status, 1);
  assert.match(next.stdout, /NONE_READY/);
  assert.equal(L('set', '2', 'DONE').status, 2);
  assert.equal(L('set', '99', 'COMPLETE').status, 1);
  rmSync(dir, { recursive: true, force: true });
});
test('ledger: brief extracts exactly one task section', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-brief-'));
  mkdirSync(join(dir, '.planning'));
  writeFileSync(join(dir, '.planning', 'ROADMAP.md'), '# Plan\n### Task 1: A\nbody A\n### Task 2: B\nbody B\n## Risks\nnone\n');
  const L = (...a) => node([join(SCRIPTS, 'ledger.js'), ...a], { cwd: dir });
  L('init');
  const out = L('brief', '2').stdout.trim();
  const text = readFileSync(out, 'utf8');
  assert.match(text, /Task 2: B/);
  assert.doesNotMatch(text, /Task 1|Risks/);
  rmSync(dir, { recursive: true, force: true });
});
test('ledger: package writes the uncommitted diff incl. new files, excluding .planning', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-pkg-'));
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' });
  git('init', '-q');
  git('config', 'user.email', 't@example.com');
  git('config', 'user.name', 't');
  writeFileSync(join(dir, 'a.txt'), 'a\n');
  git('add', '.');
  git('commit', '-qm', 'init');
  mkdirSync(join(dir, '.planning'));
  writeFileSync(join(dir, '.planning', 'ROADMAP.md'), '### Task 1: X\n');
  writeFileSync(join(dir, 'new.ts'), 'export const x = 1;\n');
  const out = node([join(SCRIPTS, 'ledger.js'), 'package', '1'], { cwd: dir }).stdout.trim();
  const diff = readFileSync(out, 'utf8');
  assert.match(diff, /new\.ts/);
  assert.doesNotMatch(diff, /ROADMAP/);
  rmSync(dir, { recursive: true, force: true });
});

// ---------- restore-state.js ----------
test('restore-state: silent without files, prints state when present', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-restore-'));
  const run = () => node([join(SCRIPTS, 'restore-state.js')], { cwd: dir, input: JSON.stringify({ cwd: dir }) });
  const empty = run();
  assert.equal(empty.status, 0);
  assert.equal(empty.stdout, '');
  writeFileSync(join(dir, 'SESSION-STATE.md'), '## DECISION\nUse Zustand');
  const full = run();
  assert.match(full.stdout, /Use Zustand/);
  rmSync(dir, { recursive: true, force: true });
});
test('ledger: checklists inside "### Task" sections are not tasks', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-phantom-'));
  mkdirSync(join(dir, '.planning'));
  writeFileSync(join(dir, '.planning', 'ROADMAP.md'), '### Task 1: API\n- [ ] returns 200\n- [ ] validates input\n### Task 2: UI\n- [ ] renders\n');
  const r = node([join(SCRIPTS, 'ledger.js'), 'init'], { cwd: dir });
  assert.match(r.stdout, /2 tasks/);
  rmSync(dir, { recursive: true, force: true });
});
test('ledger: package works in a repo without commits', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-nohead-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  writeFileSync(join(dir, 'index.js'), 'console.log(1)\n');
  const r = node([join(SCRIPTS, 'ledger.js'), 'package', '1'], { cwd: dir });
  assert.equal(r.status, 0, r.stderr);
  const diff = readFileSync(r.stdout.trim(), 'utf8');
  assert.match(diff, /empty tree/);
  assert.match(diff, /index\.js/);
  rmSync(dir, { recursive: true, force: true });
});
test('ledger: ready lists all parallel-safe tasks; round increments; old 5-column ledgers still parse', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-ready-'));
  mkdirSync(join(dir, '.planning'));
  writeFileSync(join(dir, '.planning', 'ROADMAP.md'), '### Task 1: A\n### Task 2: B\n### Task 3: C\n- Depends on: [1, 2]\n');
  const L = (...a) => node([join(SCRIPTS, 'ledger.js'), ...a], { cwd: dir });
  L('init');
  assert.deepEqual(JSON.parse(L('ready').stdout).map((t) => t.id), [1, 2]);
  assert.equal(L('round', '1').stdout.trim(), '1');
  assert.equal(L('round', '1').stdout.trim(), '2');
  assert.equal(L('round', '1', '5').stdout.trim(), '5');
  assert.match(readFileSync(join(dir, '.planning', 'STATE.md'), 'utf8'), /\| 1 \| PENDING \|  \| 5 \| A \|/);
  // a v3.1 ledger without the Round column
  writeFileSync(join(dir, '.planning', 'STATE.md'), '# Project State\nPlan: .planning/ROADMAP.md\n\n## Tasks\n| ID | Status | Depends on | Title | Note |\n|---|---|---|---|---|\n| 1 | COMPLETE |  | A | abc |\n| 2 | PENDING |  | B |  |\n\n## Log\n');
  assert.deepEqual(JSON.parse(L('ready').stdout).map((t) => t.id), [2]);
  L('set', '2', 'COMPLETE', 'def');
  assert.match(readFileSync(join(dir, '.planning', 'STATE.md'), 'utf8'), /\| ID \| Status \| Depends on \| Round \| Title \| Note \|/);
  rmSync(dir, { recursive: true, force: true });
});
test('pre-compact: saves last user requests only in PPP-managed projects', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-precompact-'));
  const transcript = join(dir, 't.jsonl');
  writeFileSync(transcript, [
    { type: 'user', message: { role: 'user', content: 'Зроби лендінг для кав\'ярні' } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'ok' }] } },
    { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: 'x' }] } },
    { type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'Колір акценту — бордо' }] } },
  ].map((l) => JSON.stringify(l)).join('\n'));
  const run = () => node([join(SCRIPTS, 'pre-compact.js')], { input: JSON.stringify({ cwd: dir, transcript_path: transcript, trigger: 'auto' }) });
  assert.equal(run().status, 0);
  assert.equal(existsSync(join(dir, 'memory')), false); // not managed → nothing written
  writeFileSync(join(dir, 'SESSION-STATE.md'), '# state');
  run();
  const buf = readFileSync(join(dir, 'memory', 'working-buffer.md'), 'utf8');
  assert.match(buf, /лендінг/);
  assert.match(buf, /бордо/);
  assert.doesNotMatch(buf, /tool_result/);
  rmSync(dir, { recursive: true, force: true });
});
test('lint-on-edit: reports P0 only when opted in', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-lintedit-'));
  const file = join(dir, 'page.html');
  writeFileSync(file, '<img src="a.png">');
  const run = () => node([join(SCRIPTS, 'lint-on-edit.js')], { input: JSON.stringify({ cwd: dir, tool_input: { file_path: file } }) });
  assert.equal(run().stdout, '');
  mkdirSync(join(dir, '.design'));
  writeFileSync(join(dir, '.design', 'lint-on-edit'), '');
  const out = JSON.parse(run().stdout);
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /DL-IMG-ALT/);
  rmSync(dir, { recursive: true, force: true });
});
test('design-lint: class rules see whole multi-line JSX tags; CSS inside <style> still checked', () => {
  const ok = '<button\n  className="rounded outline-none\n    focus-visible:outline-2 focus-visible:outline-offset-2"\n  onClick={() => save(a > b)}\n>Save</button>';
  assert.ok(!ids(lintText(ok, '.tsx')).includes('DL-OUTLINE'));
  const split = '<h1\n  className="bg-gradient-to-r from-purple-500\n  to-blue-500 bg-clip-text\n  text-transparent">Hi</h1>';
  const f = ids(lintText(split, '.tsx'));
  assert.ok(f.includes('DL-GRADIENT-TEXT') && f.includes('DL-LILA'), f.join());
  const html = '<html lang="uk"><head><meta name="viewport" content="width=device-width"><style>\n.hero { height: 100vh; }\n</style></head><body><h1>x</h1></body></html>';
  assert.ok(ids(lintText(html, '.html')).includes('DL-VH'));
});
test('ledger: dependency lines in bold or "Task N" form parse; later prose does not overwrite them', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-deps-'));
  mkdirSync(join(dir, '.planning'));
  writeFileSync(join(dir, '.planning', 'ROADMAP.md'), [
    '### Task 1: Schema', '- Depends on: []',
    '### Task 2: Service', '- **Depends on:** [1]',
    '### Task 3: API', '- Depends on: Task 1, Task 2', 'Note: the UI depends on 5 other things.',
    '### Task 4: UI', '- Depends on: none',
  ].join('\n'));
  node([join(SCRIPTS, 'ledger.js'), 'init'], { cwd: dir });
  const state = readFileSync(join(dir, '.planning', 'STATE.md'), 'utf8');
  assert.match(state, /\| 2 \| PENDING \| 1 \|/);
  assert.match(state, /\| 3 \| PENDING \| 1, 2 \|/);
  assert.match(state, /\| 4 \| PENDING \|  \|/);
  rmSync(dir, { recursive: true, force: true });
});
