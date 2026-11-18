// Run: node --test scripts/tests/ads.test.mjs   (from the plugin root)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { breakeven, target, learning, mer, kill, compare, poissonCdf, normCdf, wilson, parseArgs } from '../ads-calc.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'ads-calc.mjs');
const cli = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

test('breakeven: max CPA = AOV × margin, break-even ROAS = 1 / margin', () => {
  const b = breakeven({ aov: 1000, margin: 0.4 });
  assert.equal(b.maxCpaPlatform, 400);
  assert.equal(b.breakEvenRoas, 2.5);
});

test('breakeven: ad VAT lowers the CPA you can bid on the platform', () => {
  const b = breakeven({ aov: 1000, contribution: 360, adsVat: 0.2 });
  assert.equal(b.maxCpaTotal, 360);
  assert.equal(b.maxCpaPlatform, 300);
  assert.equal(b.breakEvenRoas, 3.33);
});

test('target: profit per order or % of AOV', () => {
  const t = target({ aov: 1000, margin: 0.4, profit: 100 });
  assert.equal(t.targetCpaPlatform, 300);
  assert.equal(t.targetRoas, 3.33);
  const p = target({ aov: 1000, margin: 0.4, profitPct: 0.15, adsVat: 0.2 });
  assert.equal(p.targetCpaPlatform, 208.33); // (400 − 150) / 1.2
  assert.throws(() => target({ aov: 1000, margin: 0.1, profit: 150 }), /no ad budget is possible/);
});

test('learning: 50 events in 7 days per ad set', () => {
  const l = learning({ cpa: 140 });
  assert.equal(l.dailyPerAdset, 1000);
  const b = learning({ cpa: 140, adsets: 3, budget: 1500 });
  assert.equal(b.dailyTotal, 3000);
  assert.equal(b.expectedEventsPerAdset, 25);
  assert.equal(b.likelyToExit, false);
  assert.equal(b.maxAdsetsThatCanExit, 1);
});

test('mer: blended revenue / spend, break-even MER = 1 / margin', () => {
  const m = mer({ revenue: 200000, spend: 50000, margin: 0.4, newRevenue: 120000 });
  assert.equal(m.mer, 4);
  assert.equal(m.adCostSharePct, 25);
  assert.equal(m.breakEvenMer, 2.5);
  assert.equal(m.contributionAfterAds, 30000);
  assert.equal(m.newCustomerMer, 2.4);
});

test('poisson and normal helpers', () => {
  assert.ok(Math.abs(poissonCdf(0, 3) - Math.exp(-3)) < 1e-12);
  assert.ok(Math.abs(poissonCdf(2, 2) - 5 * Math.exp(-2)) < 1e-12);
  assert.ok(poissonCdf(900, 1000) < 0.01 && poissonCdf(900, 1000) > 0);
  assert.ok(Math.abs(normCdf(1.96) - 0.975) < 1e-4);
  const [lo, hi] = wilson(10, 100);
  assert.ok(lo > 0.05 && lo < 0.06 && hi > 0.17 && hi < 0.18);
});

test('kill: zero conversions after 3× target CPA is significant at 5%', () => {
  const k = kill({ spend: 540, conversions: 0, targetCpa: 180 });
  assert.equal(k.expectedAtTarget, 3);
  assert.equal(k.pWorse, 0.0498);
  assert.match(k.decision, /^KILL/);
  assert.equal(k.zeroConversionKillSpend, 539.23); // 180 × ln(20)
  const early = kill({ spend: 360, conversions: 0, targetCpa: 180 });
  assert.match(early.decision, /^KEEP RUNNING/);
  const good = kill({ spend: 1800, conversions: 20, targetCpa: 180 });
  assert.match(good.decision, /^SCALE CANDIDATE/);
});

test('compare: two-proportion z-test with minimum-conversion guard', () => {
  const c = compare({ aConv: 100, aN: 5000, bConv: 150, bN: 5000 });
  assert.equal(c.verdict, 'B WINS');
  assert.ok(c.pValue < 0.01);
  assert.equal(c.liftPct, 50);
  const same = compare({ aConv: 50, aN: 2000, bConv: 55, bN: 2000 });
  assert.equal(same.verdict, 'NO SIGNIFICANT DIFFERENCE');
  const thin = compare({ aConv: 3, aN: 200, bConv: 9, bN: 200 });
  assert.match(thin.verdict, /^INSUFFICIENT DATA/);
  assert.throws(() => compare({ aConv: 10, aN: 5, bConv: 1, bN: 10 }), /cannot exceed/);
});

test('parseArgs: kebab flags to camelCase numbers', () => {
  assert.deepEqual(parseArgs(['kill', '--target-cpa', '180', '--spend', '540', '--json']), { cmd: 'kill', o: { targetCpa: 180, spend: 540 }, json: true });
  assert.throws(() => parseArgs(['mer', '--spend', 'abc']), /must be a number/);
});

test('CLI: text and JSON output, exit 2 on misuse', () => {
  const t = cli('breakeven', '--aov', '900', '--margin', '0.4');
  assert.equal(t.status, 0, t.stderr);
  assert.match(t.stdout, /breakEvenRoas\s+2\.5/);
  const j = cli('learning', '--cpa', '200', '--json');
  assert.equal(JSON.parse(j.stdout).dailyPerAdset, 1428.57);
  assert.equal(cli('nope').status, 2);
  assert.equal(cli('breakeven', '--aov', '900').status, 2);
});
