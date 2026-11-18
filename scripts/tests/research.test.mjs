// Tests for scripts/market-size.mjs — run: node --test scripts/tests/research.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse, evaluate, substitute, validate, compute, report, fmt, EXAMPLE } from '../market-size.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'market-size.mjs');
const clone = (o) => JSON.parse(JSON.stringify(o));

test('parser respects precedence, associativity, parentheses and unary minus', () => {
  const env = { a: 10, b: 4, c: 2 };
  const cases = { 'a + b * c': 18, '(a + b) * c': 28, 'a - b - c': 4, 'a - (b - c)': 8, 'a / b / c': 1.25, 'a / (b * c)': 1.25, '-(a + b) * c': -28, 'a*b+c': 42 };
  for (const [f, v] of Object.entries(cases)) assert.equal(evaluate(parse(f), env), v, f);
});
test('parser rejects malformed formulas', () => {
  for (const f of ['', 'a +', '(a + b', 'a b', 'a % b', 'a + )']) assert.throws(() => parse(f), Error, f);
});
test('substitution shows the calculation with the parentheses that matter', () => {
  const env = { a: 10, b: 4, c: 2 };
  assert.equal(substitute(parse('a - (b + c)'), env, String), '10 − (4 + 2)');
  assert.equal(substitute(parse('a * (b / c)'), env, String), '10 × 4 ÷ 2');
  assert.equal(substitute(parse('a / (b * c)'), env, String), '10 ÷ (4 × 2)');
  assert.equal(substitute(parse('(a + b) * c'), env, String), '(10 + 4) × 2');
});
test('number formatting groups thousands with spaces', () => {
  assert.equal(fmt(96000000), '96 000 000');
  assert.equal(fmt(0.05), '0.05');
  assert.equal(fmt(12.5), '12.5');
  assert.equal(fmt(-1500), '-1 500');
});
test('example model computes TAM/SAM/SOM, corners and sensitivity', () => {
  const res = compute(EXAMPLE);
  assert.equal(res.scenarios.base.tam, 20000 * 400 * 12);
  assert.equal(res.scenarios.base.sam, 96000000 * 0.4);
  assert.ok(Math.abs(res.scenarios.base.som - 1920000) < 1e-6);
  assert.ok(Math.abs(res.scenarios.low.som - 96000000 * 0.3 * 0.02) < 1e-6);
  assert.ok(Math.abs(res.scenarios.high.som - 96000000 * 0.5 * 0.08) < 1e-6);
  assert.deepEqual(res.sensitivity.map((s) => s.input), ['win_share', 'fit_share']);
  assert.deepEqual(res.counts, { fact: 2, estimate: 2, constant: 1 });
});
test('report shows formula, substituted numbers, result and sources', () => {
  const text = report(EXAMPLE, compute(EXAMPLE));
  assert.match(text, /TAM = shops × price_month × months/);
  assert.match(text, /= 20 000 × 400 × 12/);
  assert.match(text, /= 96 000 000 UAH/);
  assert.match(text, /\[S1\].*accessed 2026-11-12/);
  assert.match(text, /Estimate: Share of shops/);
});

// Integrity rules: sourced numbers only.
test('a fact without a source is rejected', () => {
  const m = clone(EXAMPLE); delete m.inputs.shops.source;
  assert.match(validate(m).join('\n'), /input shops: a fact needs a "source"/);
});
test('a fact citing an unknown source, or a source without URL/access date, is rejected', () => {
  const m = clone(EXAMPLE); m.inputs.shops.source = 'S9';
  assert.match(validate(m).join('\n'), /source "S9" is not in "sources"/);
  const n = clone(EXAMPLE); n.sources.S1 = { title: 'x', url: 'ftp://x', accessed: '12.11.2026' };
  const errs = validate(n).join('\n');
  assert.match(errs, /source S1: url/);
  assert.match(errs, /source S1: accessed date/);
});
test('an estimate needs a basis; ranges must be ordered; shares within 0..1', () => {
  const m = clone(EXAMPLE); m.inputs.fit_share.basis = 'guess';
  assert.match(validate(m).join('\n'), /needs a "basis"/);
  const n = clone(EXAMPLE); n.inputs.fit_share.low = 0.6;
  assert.match(validate(n).join('\n'), /low <= base <= high/);
  const o = clone(EXAMPLE); o.inputs.win_share.high = 1.5;
  assert.match(validate(o).join('\n'), /share must be between 0 and 1/);
});
test('literal numbers in formulas, unknown names and forward references are rejected', () => {
  const m = clone(EXAMPLE); m.steps[0].formula = 'shops * price_month * 12';
  assert.match(validate(m).join('\n'), /literal numbers other than 0 and 1 are not allowed/);
  const n = clone(EXAMPLE); n.steps[1].formula = 'tam * unknown_share';
  assert.match(validate(n).join('\n'), /unknown name "unknown_share"/);
  const o = clone(EXAMPLE); o.steps[0].formula = 'sam * months';
  assert.match(validate(o).join('\n'), /unknown name "sam"/);
});
test('type, value shape and constants are checked', () => {
  const m = clone(EXAMPLE); m.inputs.shops.type = 'opinion';
  assert.match(validate(m).join('\n'), /type must be fact, estimate or constant/);
  const n = clone(EXAMPLE); n.inputs.months = { low: 11, base: 12, high: 13, type: 'constant' };
  assert.match(validate(n).join('\n'), /a constant has one value/);
  const o = clone(EXAMPLE); o.inputs.shops.base = 5;
  assert.match(validate(o).join('\n'), /either "value" or "low"\/"base"\/"high"/);
});
test('compute throws with all integrity errors listed', () => {
  const m = clone(EXAMPLE); delete m.inputs.shops.source; m.inputs.fit_share.basis = '';
  assert.throws(() => compute(m), (e) => e.errors.length === 2);
});
test('complements with 1 are allowed (1 - p)', () => {
  const m = clone(EXAMPLE); m.steps.push({ name: 'lost', formula: 'sam * (1 - win_share)' });
  assert.deepEqual(validate(m), []);
  assert.ok(Math.abs(compute(m).scenarios.base.lost - 38400000 * 0.95) < 1e-6);
});
test('division by zero is reported, not returned as Infinity', () => {
  const m = clone(EXAMPLE); m.inputs.zero = { value: 0, type: 'constant' }; m.steps.push({ name: 'per', formula: 'som / zero' });
  assert.throws(() => compute(m), /division by zero/);
});
test('CLI: report on a valid model, exit 1 with a list on an invalid one', () => {
  const dir = mkdtempSync(join(tmpdir(), 'market-size-'));
  const good = join(dir, 'good.json');
  writeFileSync(good, JSON.stringify(EXAMPLE));
  const ok = spawnSync(process.execPath, [SCRIPT, good], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /## Sensitivity of SOM/);
  const badModel = clone(EXAMPLE); delete badModel.inputs.price_month.source;
  const bad = join(dir, 'bad.json');
  writeFileSync(bad, JSON.stringify(badModel));
  const r = spawnSync(process.execPath, [SCRIPT, bad], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /integrity error/);
  const ex = spawnSync(process.execPath, [SCRIPT, '--example'], { encoding: 'utf8' });
  assert.equal(JSON.parse(ex.stdout).steps.length, 3);
});
