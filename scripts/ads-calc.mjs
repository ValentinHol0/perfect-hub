#!/usr/bin/env node
// ads-calc — exact performance-marketing arithmetic: break-even ROAS / max CPA, target CPA for a profit goal,
// budget to exit the learning phase, MER, and statistically cautious kill/scale and A/B checks.
// Zero dependencies, Node >= 18.
//
// Usage: node scripts/ads-calc.mjs <command> --flag value ... [--json]
//   breakeven --aov 900 --margin 0.42 [--ads-vat 0.2]            (or --contribution 378 instead of --margin)
//   target    --aov 900 --margin 0.42 --profit 80 [--ads-vat 0.2] (or --profit-pct 0.1)
//   learning  --cpa 180 [--events 50] [--days 7] [--adsets 3] [--budget 900]
//   mer       --revenue 240000 --spend 60000 [--margin 0.42] [--new-revenue 150000]
//   kill      --spend 540 --conversions 0 --target-cpa 180 [--alpha 0.05]
//   compare   --a-conv 18 --a-n 1200 --b-conv 31 --b-n 1250 [--alpha 0.05] [--min-conv 10]
// Definitions: skills/ads-analytics/SKILL.md. Exit: 0 ok · 2 usage or invalid input.

import { pathToFileURL } from 'node:url';

const r = (n, d = 2) => (Number.isFinite(n) ? Math.round((n + Math.sign(n) * 1e-12) * 10 ** d) / 10 ** d : n);

function need(o, key, { min = -Infinity, max = Infinity, gt } = {}) {
  const v = o[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`--${kebab(key)} must be a number`);
  if (v < min || v > max || (gt !== undefined && !(v > gt))) throw new Error(`--${kebab(key)} is out of range`);
  return v;
}
const opt = (o, key, def, lim) => (o[key] === undefined ? def : need(o, key, lim));
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function contributionOf(o) {
  const aov = need(o, 'aov', { gt: 0 });
  if (o.contribution !== undefined) return { aov, c: need(o, 'contribution', { gt: 0 }) };
  const m = need(o, 'margin', { gt: 0, max: 1 });
  return { aov, c: aov * m };
}

// Break-even: the most you can pay per order before ads eat the whole contribution.
export function breakeven(o) {
  const { aov, c } = contributionOf(o);
  const vat = opt(o, 'adsVat', 0, { min: 0, max: 1 });
  const maxCpaPlatform = c / (1 + vat);
  return { aov, contributionBeforeAds: r(c), marginPct: r((c / aov) * 100), maxCpaTotal: r(c), maxCpaPlatform: r(maxCpaPlatform), breakEvenRoas: r(aov / maxCpaPlatform) };
}

// Target CPA: leave a profit per order (absolute or % of AOV) after ad cost.
export function target(o) {
  const { aov, c } = contributionOf(o);
  const vat = opt(o, 'adsVat', 0, { min: 0, max: 1 });
  const profit = o.profitPct !== undefined ? aov * need(o, 'profitPct', { min: 0, max: 1 }) : opt(o, 'profit', 0, { min: 0 });
  const room = c - profit;
  if (!(room > 0)) throw new Error(`profit goal ${r(profit)} ≥ contribution before ads ${r(c)} — no ad budget is possible; fix price or costs first`);
  const targetCpa = room / (1 + vat);
  return { aov, contributionBeforeAds: r(c), profitPerOrder: r(profit), targetCpaPlatform: r(targetCpa), targetRoas: r(aov / targetCpa), breakEvenRoas: breakeven(o).breakEvenRoas };
}

// Learning: budget so each ad set gets `events` optimisation events in `days`.
export function learning(o) {
  const cpa = need(o, 'cpa', { gt: 0 });
  const events = opt(o, 'events', 50, { gt: 0 });
  const days = opt(o, 'days', 7, { gt: 0 });
  const adsets = opt(o, 'adsets', 1, { min: 1 });
  const perAdset = (events * cpa) / days;
  const out = { cpa, events, days, adsets, dailyPerAdset: r(perAdset), dailyTotal: r(perAdset * adsets), perWindowTotal: r(events * cpa * adsets) };
  if (o.budget !== undefined) {
    const budget = need(o, 'budget', { gt: 0 }); // total daily budget available
    const perSet = budget / adsets;
    out.budget = budget;
    out.expectedEventsPerAdset = r((perSet * days) / cpa, 1);
    out.likelyToExit = out.expectedEventsPerAdset >= events;
    out.maxAdsetsThatCanExit = Math.floor(budget / perAdset);
  }
  return out;
}

// MER: total revenue ÷ total ad spend (all channels, same period).
export function mer(o) {
  const revenue = need(o, 'revenue', { min: 0 });
  const spend = need(o, 'spend', { gt: 0 });
  const out = { revenue, spend, mer: r(revenue / spend), adCostSharePct: revenue > 0 ? r((spend / revenue) * 100) : null };
  if (o.margin !== undefined) {
    const m = need(o, 'margin', { gt: 0, max: 1 });
    out.breakEvenMer = r(1 / m);
    out.contributionAfterAds = r(revenue * m - spend);
  }
  if (o.newRevenue !== undefined) out.newCustomerMer = r(need(o, 'newRevenue', { min: 0 }) / spend);
  return out;
}

// Poisson CDF P(X ≤ k | λ), log-space so large λ does not underflow.
export function poissonCdf(k, lambda) {
  if (lambda === 0) return 1;
  let logTerm = -lambda;
  let maxLog = logTerm;
  const logs = [logTerm];
  for (let i = 1; i <= k; i++) { logTerm += Math.log(lambda) - Math.log(i); logs.push(logTerm); if (logTerm > maxLog) maxLog = logTerm; }
  return Math.min(1, Math.exp(maxLog) * logs.reduce((s, l) => s + Math.exp(l - maxLog), 0));
}

// Kill check: if the ad really hit target CPA, how likely is a result this bad?
export function kill(o) {
  const spend = need(o, 'spend', { min: 0 });
  const conv = need(o, 'conversions', { min: 0 });
  const tcpa = need(o, 'targetCpa', { gt: 0 });
  const alpha = opt(o, 'alpha', 0.05, { gt: 0, max: 0.5 });
  const expected = spend / tcpa;
  const pWorse = poissonCdf(Math.floor(conv), expected); // P(≤ conv | true CPA = target)
  const pBetter = conv > 0 ? 1 - poissonCdf(Math.floor(conv) - 1, expected) : 1; // P(≥ conv | true CPA = target)
  let decision;
  if (pWorse < alpha) decision = 'KILL — results are significantly worse than target';
  else if (pBetter < alpha) decision = 'SCALE CANDIDATE — significantly better than target';
  else decision = 'KEEP RUNNING — not enough evidence either way';
  const spendFor0ConvKill = tcpa * -Math.log(alpha); // spend at which 0 conversions becomes significant
  return { spend, conversions: conv, targetCpa: tcpa, expectedAtTarget: r(expected, 2), observedCpa: conv > 0 ? r(spend / conv) : null, pWorse: r(pWorse, 4), pBetter: r(pBetter, 4), decision, zeroConversionKillSpend: r(spendFor0ConvKill) };
}

// Normal CDF via Abramowitz–Stegun 7.1.26 erf approximation (|error| < 1.5e-7).
export function normCdf(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

export function wilson(x, n, z = 1.96) {
  const p = x / n;
  const den = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / den;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / den;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

// A/B: two-proportion z-test on conversion rates (conversions / clicks or / landing views).
export function compare(o) {
  const aConv = need(o, 'aConv', { min: 0 }); const aN = need(o, 'aN', { gt: 0 });
  const bConv = need(o, 'bConv', { min: 0 }); const bN = need(o, 'bN', { gt: 0 });
  if (aConv > aN || bConv > bN) throw new Error('conversions cannot exceed the denominator');
  const alpha = opt(o, 'alpha', 0.05, { gt: 0, max: 0.5 });
  const minConv = opt(o, 'minConv', 10, { min: 0 });
  const pa = aConv / aN; const pb = bConv / bN;
  const pool = (aConv + bConv) / (aN + bN);
  const se = Math.sqrt(pool * (1 - pool) * (1 / aN + 1 / bN));
  const z = se > 0 ? (pb - pa) / se : 0;
  const p = 2 * (1 - normCdf(Math.abs(z)));
  const [aLo, aHi] = wilson(aConv, aN); const [bLo, bHi] = wilson(bConv, bN);
  let verdict;
  if (Math.min(aConv, bConv) < minConv) verdict = `INSUFFICIENT DATA — each variant needs at least ${minConv} conversions`;
  else if (p < alpha) verdict = pb > pa ? 'B WINS' : 'A WINS';
  else verdict = 'NO SIGNIFICANT DIFFERENCE';
  return { a: { rate: r(pa * 100, 3), ci95: [r(aLo * 100, 3), r(aHi * 100, 3)] }, b: { rate: r(pb * 100, 3), ci95: [r(bLo * 100, 3), r(bHi * 100, 3)] }, liftPct: pa > 0 ? r(((pb - pa) / pa) * 100, 1) : null, z: r(z, 3), pValue: r(p, 4), alpha, verdict };
}

export const COMMANDS = { breakeven, target, learning, mer, kill, compare };

export function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const o = {};
  let json = false;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--json') { json = true; continue; }
    if (!a.startsWith('--')) throw new Error(`unexpected argument "${a}"`);
    const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const v = rest[++i];
    if (v === undefined) throw new Error(`${a} needs a value`);
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error(`${a} must be a number, got "${v}"`);
    o[key] = n;
  }
  return { cmd, o, json };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    const { cmd, o, json } = parseArgs(process.argv.slice(2));
    if (!COMMANDS[cmd]) throw new Error(`usage: node ads-calc.mjs <${Object.keys(COMMANDS).join('|')}> --flag value ... [--json]`);
    const res = COMMANDS[cmd](o);
    if (json) console.log(JSON.stringify(res, null, 2));
    else for (const [k, v] of Object.entries(res)) console.log(`${k.padEnd(24)} ${typeof v === 'object' && v !== null ? JSON.stringify(v) : v}`);
  } catch (e) {
    console.error(`ads-calc: ${e.message}`);
    process.exit(2);
  }
}
