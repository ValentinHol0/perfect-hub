// Run: node --test scripts/tests/selling.test.mjs   (from the plugin root)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { compute, run, landedCost, toMarkdown, deepMerge } from '../unit-economics.mjs';
import { score, toMarkdown as scoreMd, CRITERIA } from '../product-score.mjs';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const node = (args, opts = {}) => spawnSync(process.execPath, args, { encoding: 'utf8', ...opts });
const tmp = mkdtempSync(join(tmpdir(), 'selling-'));
const put = (name, obj) => { const p = join(tmp, name); writeFileSync(p, JSON.stringify(obj)); return p; };

// The owner's original model (evaluate_product.py), pet-spray case: net profit 51.88 UAH per order.
const petSpray = {
  name: 'Pet spray', price: 489, cogsPerUnit: 110, packaging: 30,
  shipping: { forward: 105, return: 105, payer: 'buyer' }, refusalRate: 0.08,
  ads: { cpa: 200 }, callCenterPerOrder: 30, otherPerOrder: 20,
};

// ---------- unit-economics.mjs ----------
test('unit-economics: reproduces the legacy model (pet spray = 51.88)', () => {
  const r = compute(petSpray);
  assert.equal(r.perShippedOrder.contribution, 51.88);
  assert.equal(r.markup, 4.45);
  assert.equal(r.perShippedOrder.shipping, 16.8);
  assert.ok(r.flags.some((f) => f.includes('below 150')));
});

test('unit-economics: break-even CPA equals contribution before ads; ROAS = price / CPA', () => {
  const r = compute(petSpray);
  assert.equal(r.breakEven.cpaPlatform, 251.88);
  assert.equal(r.breakEven.roasPlatform, 1.94);
  assert.equal(r.actual.roasPlatform, 2.45);
});

test('unit-economics: seller-paid shipping is charged on every shipped order', () => {
  const r = compute({ ...petSpray, shipping: { forward: 100, return: 50, payer: 'seller' }, refusalRate: 0.1 });
  assert.equal(r.perShippedOrder.shipping, 105); // 100 + 50 × 0.1
});

test('unit-economics: COD fee applies only to collected COD money, payment fee only to prepaid', () => {
  const r = compute({ price: 1000, cogsPerUnit: 200, refusalRate: 0.1, prepaidShare: 0.5, codFee: { pct: 0.025 }, paymentFee: { pct: 0.013 } });
  // COD delivered share 0.5 × 0.9 = 0.45 → 1000 × 0.45 × 2.5% = 11.25; prepaid 0.5 × 1000 × 1.3% = 6.5
  assert.equal(r.perShippedOrder.codFees, 11.25);
  assert.equal(r.perShippedOrder.paymentFees, 6.5);
  assert.equal(r.perShippedOrder.deliveredShare, 0.95);
});

test('unit-economics: lead-based CPA converts through the approve rate and ad VAT', () => {
  const r = compute({ price: 800, cogsPerUnit: 200, ads: { cpa: 100, basis: 'lead', approveRate: 0.8, vatPct: 0.2 } });
  assert.equal(r.perShippedOrder.ads, 150); // 100 / 0.8 × 1.2
  // contribution before ads = 600 → shipped ex-VAT 500 → per lead 400
  assert.equal(r.breakEven.cpaPlatform, 400);
  assert.equal(r.breakEven.roasPlatform, 2);
});

test('unit-economics: tax modes — revenue share vs VAT inside price', () => {
  const rev = compute({ price: 1200, cogsPerUnit: 300, tax: { mode: 'revenue', rate: 0.06 } });
  assert.equal(rev.perShippedOrder.tax, 72);
  const vat = compute({ price: 1200, cogsPerUnit: 300, tax: { mode: 'vat', rate: 0.2 } });
  assert.equal(vat.perShippedOrder.tax, 200);
  assert.equal(vat.perShippedOrder.netRevenue, 1000);
});

test('unit-economics: refused goods loss and marketplace commission', () => {
  const r = compute({ price: 1000, cogsPerUnit: 300, refusalRate: 0.2, refusedGoodsLossPct: 0.5, marketplaceCommissionPct: 0.1 });
  assert.equal(r.perShippedOrder.goods, 270); // 300 × (0.8 + 0.2 × 0.5)
  assert.equal(r.perShippedOrder.marketplaceCommission, 80);
});

test('unit-economics: landed cost — duty on customs value, import VAT on value + duty', () => {
  const l = landedCost({ unitPrice: 2, freightPerKg: 10, weightKg: 0.2, fx: 40, dutyPct: 0.1, importVatPct: 0.2, brokerPerUnit: 1 });
  assert.equal(l.customsValue, 160);
  assert.equal(l.duty, 16);
  assert.equal(l.importVat, 35.2);
  assert.equal(l.perUnit, 212.2);
  const reclaim = landedCost({ unitPrice: 2, freightPerKg: 10, weightKg: 0.2, fx: 40, dutyPct: 0.1, importVatPct: 0.2, importVatReclaimable: true });
  assert.equal(reclaim.perUnit, 176);
});

test('unit-economics: batch cash flow and monthly break-even', () => {
  const r = compute({ ...petSpray, fixedMonthly: 5188, batch: { units: 1000, ordersPerDay: 20, cashLagDays: 5 } });
  assert.equal(r.monthly.breakEvenShippedOrders, 100);
  assert.equal(r.batch.cost, 110000);
  assert.equal(r.batch.shippedOrders, 1086.96); // refused units return to stock
  assert.equal(r.batch.ordersToRecoverCost, Math.ceil(110000 / (51.88 + 101.2)));
  assert.equal(r.batch.peakCashNeed, 110000 + 20 * 5 * (200 + 30 + 30 + 20));
});

test('unit-economics: scenarios deep-merge overrides', () => {
  const res = run({ ...petSpray, scenarios: [{ name: 'worst', refusalRate: 0.2, ads: { cpa: 260 } }, { name: 'best', refusalRate: 0.05 }] });
  assert.deepEqual(res.map((x) => x.scenario), ['worst', 'best']);
  assert.ok(res[0].perShippedOrder.contribution < res[1].perShippedOrder.contribution);
  assert.deepEqual(deepMerge({ a: { b: 1, c: 2 } }, { a: { c: 3 } }), { a: { b: 1, c: 3 } });
  assert.match(toMarkdown(res), /\| Metric \| worst \| best \|/);
});

test('unit-economics: invalid input is rejected with a clear message', () => {
  assert.throws(() => compute({ cogsPerUnit: 1 }), /price is required/);
  assert.throws(() => compute({ price: 100 }), /cogsPerUnit/);
  assert.throws(() => compute({ price: 100, cogsPerUnit: 10, refusalRate: 1.5 }), /refusalRate/);
  assert.throws(() => compute({ price: 100, cogsPerUnit: 10, refusalRate: 1 }), /nothing is ever delivered/);
  assert.throws(() => compute({ price: 100, cogsPerUnit: 10, shipping: { payer: 'courier' } }), /payer/);
});

test('unit-economics CLI: markdown by default, JSON with --json, exit 2 on bad input', () => {
  const file = put('in.json', petSpray);
  const md = node([join(SCRIPTS, 'unit-economics.mjs'), file]);
  assert.equal(md.status, 0, md.stderr);
  assert.match(md.stdout, /Contribution \/ shipped order\*\* \| \*\*51\.88/);
  const js = node([join(SCRIPTS, 'unit-economics.mjs'), file, '--json']);
  assert.equal(JSON.parse(js.stdout)[0].perShippedOrder.contribution, 51.88);
  const bad = node([join(SCRIPTS, 'unit-economics.mjs'), put('bad.json', { price: -1 })]);
  assert.equal(bad.status, 2);
  const stdin = node([join(SCRIPTS, 'unit-economics.mjs'), '-', '--json'], { input: JSON.stringify(petSpray) });
  assert.equal(JSON.parse(stdin.stdout)[0].markup, 4.45);
});

// ---------- product-score.mjs ----------
const card = (scores, extra = {}) => ({
  product: 'Test',
  criteria: Object.fromEntries(Object.entries(scores).map(([id, s]) => [id, {
    score: s,
    deductions: s < 100 ? [{ points: 100 - s, reason: 'documented weakness' }] : [],
    evidence: s >= 95 ? 'link to proof' : undefined,
  }])),
  ...extra,
});
const all = (v) => ({ C1: v, C2: v, C3: v, C4: v, C5: v, C6: v, C7: v, C8: v, C9: v });

test('product-score: weighted composite and verdict bands', () => {
  assert.equal(score(card(all(80))).composite, 80);
  assert.equal(score(card(all(80))).verdict, 'SCALABLE WINNER');
  assert.equal(score(card(all(65))).verdict, 'CONDITIONAL PLAY');
  assert.equal(score(card(all(50))).verdict, 'NO-GO');
});

test('product-score: weights sum to 100% and the legacy collagen-mask case is capped by its weak link', () => {
  // Legacy weights summed to 105% and the legacy card said 74.5; with C7 at 5% the raw score is 79.65 —
  // above 75, yet C2 = 28 (Temu parity) is a weak link, so the verdict must not be SCALABLE WINNER.
  assert.equal(Math.round(Object.values(CRITERIA).reduce((s, c) => s + c.weight, 0) * 100), 100);
  const res = score(card({ C1: 85, C2: 28, C3: 90, C4: 94, C5: 82, C6: 85, C7: 98, C8: 95, C9: 90 }));
  assert.equal(res.raw, 79.7);
  assert.deepEqual(res.weakLinks, ['C2']);
  assert.equal(res.composite, 74);
  assert.equal(res.verdict, 'CONDITIONAL PLAY');
});

test('product-score: fatal disqualifiers cap at 40', () => {
  const policy = score(card({ ...all(80), C5: 20 }));
  assert.equal(policy.verdict, 'STRICT NO-GO');
  assert.equal(policy.composite, 40);
  const margin = score(card(all(80), { unitEconomics: { contribution: 51.88, markup: 4.45, refusalRate: 0.08 } }));
  assert.equal(margin.verdict, 'STRICT NO-GO');
  assert.ok(margin.fatal[0].includes('51.88'));
  const refusal = score(card(all(80), { unitEconomics: { refusalRate: 0.3 } }));
  assert.ok(refusal.fatal.some((f) => f.includes('refusal')));
});

test('product-score: anti-inflation — deductions must add up and 95+ needs evidence', () => {
  const c = card(all(80));
  c.criteria.C3.deductions = [{ points: 5, reason: 'x' }];
  assert.throws(() => score(c), /C3: score 80 ≠ 100 − deductions 5/);
  const d = card(all(80));
  d.criteria.C4 = { score: 97, deductions: [{ points: 3, reason: 'minor' }] };
  assert.throws(() => score(d), /C4: a score of 97 needs "evidence"/);
  assert.throws(() => score({ criteria: { C1: { score: 80 } } }), /C2 missing/);
});

test('product-score CLI: markdown table and exit codes', () => {
  const ok = node([join(SCRIPTS, 'product-score.mjs'), put('card.json', card(all(70)))]);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /Composite: \*\*70\/100\*\* · Verdict: \*\*CONDITIONAL PLAY\*\*/);
  const bad = node([join(SCRIPTS, 'product-score.mjs'), put('bad-card.json', { criteria: {} })]);
  assert.equal(bad.status, 2);
  assert.match(scoreMd(score(card(all(90)))), /\| C1 \| Unit economics/);
});
