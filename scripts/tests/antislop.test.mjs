// Run: node --test scripts/tests/antislop.test.mjs   (from the plugin root)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { scanText, visibleText, langOf, score } from '../antislop.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'antislop.mjs');
const ids = (fs) => [...new Set(fs.map((f) => f.id))];

test('antislop: visible text and language detection', () => {
  assert.equal(visibleText('<h1 className="text-5xl">Unlock the power of <b>{name}</b></h1>'), 'Unlock the power of');
  assert.equal(langOf('Свіжа кава щочетверга'), 'uk');
  assert.equal(langOf('Fresh coffee every Thursday'), 'en');
  assert.equal(langOf('OK'), null);
});

test('antislop: UI rules on markup, including design-lint and file-level heuristics', () => {
  const html = `<div class="absolute -top-20 blur-3xl rounded-full bg-violet-500/30"></div>
<div class="border border-gray-200 shadow-xl rounded-3xl p-6"><span class="uppercase tracking-widest text-xs">New</span></div>
<div class="border-l-4 border-indigo-500 p-4">Note</div>
<p class="text-gray-400 bg-indigo-600">Low contrast</p>
<img src="https://i.pravatar.cc/150">
<div class="animate-bounce">Hi</div>
<div class="size-12 rounded-xl bg-blue-100"></div><div class="size-12 rounded-xl bg-green-100"></div><div class="size-12 rounded-xl bg-red-100"></div>
<style>.hero{color:#764ba2} @keyframes fade{from{opacity:0}}</style>`;
  const got = ids(scanText(html, 'index.html'));
  for (const id of ['UI-BLOB', 'UI-GHOST-CARD', 'UI-BIG-RADIUS', 'UI-EYEBROW', 'UI-SIDE-TAB', 'UI-GRAY-ON-COLOR', 'UI-PLACEHOLDER-AVATAR', 'UI-BOUNCE', 'UI-ICON-TILE', 'UI-LILA-HEX', 'UI-NO-REDUCED-MOTION']) assert.ok(got.includes(id), `missing ${id}: ${got.join(',')}`);
  assert.ok(got.some((id) => id.startsWith('DL-')), 'design-lint rules are included');
  const blockquote = ids(scanText('<blockquote class="border-l-4 pl-4">Quote</blockquote>', 'a.html'));
  assert.ok(!blockquote.includes('UI-SIDE-TAB'), 'blockquote side border is fine');
});

test('antislop: English copy rules with literal-sense exemption and budgets', () => {
  const html = `<h1>Unlock the power of seamless collaboration</h1>
<p>In today's fast-paced world, our world-class platform empowers teams, ensuring results.</p>
<p>It's not just a tool, it's a movement.</p>
<p>Not only fast but also safe.</p>
<p>Rather than simply listing features.</p>
<p>Here's the thing: studies show 10x faster onboarding. Trusted by thousands. Contact John Doe at Acme Corp.</p>
<p>Use the key to unlock the door.</p>
<p>[insert your company name] — Certainly! I hope this helps.</p>`;
  const fs = scanText(html, 'page.html');
  const got = ids(fs);
  for (const id of ['EN-SLOP-WORD', 'EN-STOCK-PHRASE', 'EN-NEG-PARALLEL', 'EN-STAGED', 'EN-VAGUE-AUTHORITY', 'EN-FAKE-PROOF', 'EN-CAST-NAMES', 'EN-RESIDUE', 'EN-ING-RIDER']) assert.ok(got.includes(id), `missing ${id}`);
  assert.ok(!fs.some((f) => f.id === 'EN-SLOP-WORD' && f.line === 7), '"unlock the door" is literal');
  const neg = fs.filter((f) => f.id === 'EN-NEG-PARALLEL');
  assert.ok(neg.length >= 2 && !neg[0].scored && !neg[1].scored, 'first two hits are within budget');
  assert.equal(fs.find((f) => f.id === 'EN-SLOP-WORD' && f.line === 1).visible, 1.5, 'headings weigh more');
});

test('antislop: Ukrainian copy rules — hype, calques, Russianisms, quotes, bureaucratese; English rules stay silent', () => {
  const md = `# Наші Послуги

Ми пропонуємо інноваційні рішення та індивідуальний підхід у сучасному цифровому світі.
Це має сенс на щоденній основі. Ця програма являється найкращою.
Приймати участь на протязі року. Це не просто кава, а стиль життя.
Відгуки клієнтів "дуже задоволені" — вражаючий результат, з метою розвитку.
\`\`\`
"code" являється
\`\`\`
`;
  const fs = scanText(md, 'about.md');
  const got = ids(fs);
  for (const id of ['UK-HYPE', 'UK-STOCK', 'UK-CALQUE-EN', 'UK-RUSSIANISM', 'UK-NEG-PARALLEL', 'UK-QUOTES', 'UK-PARTICIPLE', 'UK-KANTSELYARYT']) assert.ok(got.includes(id), `missing ${id}: ${got.join(',')}`);
  assert.ok(!got.some((id) => id.startsWith('EN-')), 'English rules do not fire on Ukrainian text');
  assert.ok(!fs.some((f) => f.line >= 7), 'code fences are skipped');
  assert.ok(!ids(scanText('Це гарячий напій і блискучий результат.', 'a.md')).includes('UK-PARTICIPLE'), 'adjectives in the whitelist are fine');
});

test('antislop: code rules; tests only get the test-slop rule; waivers and ignore-file', () => {
  const ts = `try { run() } catch (e) {}
fetch(u).catch(() => [])
// TODO: implement retry logic
const x = y as any
// This function handles the request
// should work for now
console.log('✅ done')
ReactDOM.render(<App />, el)`;
  const got = ids(scanText(ts, 'src/api.tsx'));
  for (const id of ['CODE-EMPTY-CATCH', 'CODE-ERROR-OBSCURE', 'CODE-STUB', 'CODE-ANY', 'CODE-NARRATOR', 'CODE-HEDGE', 'CODE-EMOJI-LOG', 'CODE-STALE-API']) assert.ok(got.includes(id), `missing ${id}`);
  const testFile = ids(scanText('try {} catch {}\nexpect(true).toBe(true)\nit.only("x", () => {})', 'src/a.test.ts'));
  assert.deepEqual(testFile, ['CODE-TEST-SLOP']);
  assert.ok(!ids(scanText('<p>Seamless</p> <!-- antislop-disable-line EN-SLOP-WORD -->', 'a.html')).includes('EN-SLOP-WORD'));
  assert.ok(ids(scanText('<p>Seamless</p> <!-- antislop-disable-line UI-GLOW -->', 'a.html')).includes('EN-SLOP-WORD'), 'a waiver for another id does not hide this one');
  assert.deepEqual(scanText('// antislop-ignore-file\ncatch (e) {}', 'x.js'), []);
});

test('antislop: scoring — P0 dominates, normalisation per page/words, bands', () => {
  const mk = (id, cat, sev) => ({ id, category: cat, severity: sev, det: 'R', file: 'a', visible: 1, scored: true });
  const clean = score([], { pages: 1, enWords: 500, ukWords: 0, codeLines: 0 });
  assert.equal(clean.overall, 0); assert.equal(clean.band, 'clean');
  const p0 = score([mk('EN-RESIDUE', 'en', 'P0')], { pages: 1, enWords: 1000, ukWords: 0, codeLines: 0 });
  assert.ok(p0.sub.en >= 35, JSON.stringify(p0));
  const many = score(Array.from({ length: 8 }, (_, i) => mk(`UI-X${i}`, 'ui', 'P1')), { pages: 1, enWords: 0, ukWords: 0, codeLines: 0 });
  assert.ok(many.overall >= 60 && many.band === 'heavy', JSON.stringify(many));
});

test('antislop CLI: gate, JSON, baseline delta, usage', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-slop-'));
  mkdirSync(join(dir, 'site'));
  writeFileSync(join(dir, 'site', 'index.html'), '<html lang="en"><body><h1>Unlock the power of seamless synergy</h1><p>Certainly! I hope this helps.</p></body></html>');
  const r1 = spawnSync(process.execPath, [SCRIPT, 'site', '--json'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r1.status, 1, 'P0 residue fails');
  const j = JSON.parse(r1.stdout); writeFileSync(join(dir, 'before.json'), r1.stdout);
  assert.ok(j.findings.some((f) => f.id === 'EN-RESIDUE'));
  writeFileSync(join(dir, 'site', 'index.html'), '<html lang="en"><body><h1>Roasted on Thursday, at your door on Friday</h1><p>Three origins, one roaster in Kyiv.</p></body></html>');
  const r2 = spawnSync(process.execPath, [SCRIPT, 'site', '--baseline', 'before.json', '--gate'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r2.status, 0, r2.stdout);
  assert.match(r2.stdout, /since baseline: \+0 \/ −\d+/);
  assert.match(r2.stdout, /gate: PASS/);
  assert.equal(spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' }).status, 2);
  rmSync(dir, { recursive: true, force: true });
});
