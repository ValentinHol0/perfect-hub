#!/usr/bin/env node
// ab-calc — A/B test maths for conversion rates (proportions). Zero dependencies, Node >= 18.
//
// Sample size and power use the normal-approximation formula of R's stats::power.prop.test
// (pooled variance under H0, unpooled under H1, non-strict two-sided), so results match R to its
// printed precision. Other calculators (Evan Miller, Optimizely, statsmodels arcsine) use other
// variance assumptions and differ by a few percent — compare like with like.
//
// Usage:
//   node ab-calc.mjs size     --baseline 0.04 --mde 0.10 --relative [--alpha 0.05] [--power 0.8]
//                             [--sides 2] [--variants 2] [--daily 3000] [--allocation 1]
//   node ab-calc.mjs mde      --baseline 0.04 --n 20000 [--alpha] [--power] [--sides] [--variants]
//   node ab-calc.mjs power    --baseline 0.04 --target 0.044 --n 20000 [--alpha] [--sides]
//   node ab-calc.mjs srm      --observed 50110,49390 [--weights 50,50] [--threshold 0.001]
//   node ab-calc.mjs test     --a 120/2400 --b 151/2410 [--alpha 0.05]
//   add --json to any command for machine-readable output.
// Rates are fractions (0.04 = 4 %). --mde is absolute (0.004 = +0.4 pp) unless --relative (0.10 = +10 %).
// --variants k > 2 applies a Bonferroni correction: alpha / (k - 1) comparisons against control.

import { pathToFileURL } from 'node:url';

// ---------- special functions ----------
// ln Γ(a) for a a positive multiple of 0.5 (exact recursion — all this tool needs).
export function lnGammaHalf(a) {
  if (a <= 0 || Math.abs(a * 2 - Math.round(a * 2)) > 1e-12) throw new Error(`lnGammaHalf: ${a} is not a positive multiple of 0.5`);
  let r = 0;
  let x = a;
  while (x > 1.0001) { x -= 1; r += Math.log(x); }
  return Math.abs(x - 0.5) < 1e-9 ? r + 0.5 * Math.log(Math.PI) : r; // Γ(1) = 1, Γ(1/2) = √π
}

const EPS = 1e-15;
const FPMIN = 1e-300;
// Regularized upper incomplete gamma Q(a, x) (series / Lentz continued fraction, Numerical Recipes 6.2).
export function gammaQ(a, x) {
  if (x < 0 || a <= 0) throw new Error('gammaQ: invalid arguments');
  if (x === 0) return 1;
  const lnPre = -x + a * Math.log(x) - lnGammaHalf(a);
  if (x < a + 1) {
    let ap = a; let del = 1 / a; let sum = del;
    for (let i = 0; i < 10000; i++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * EPS) break; }
    return 1 - sum * Math.exp(lnPre);
  }
  let b = x + 1 - a; let c = 1 / FPMIN; let d = 1 / b; let h = d;
  for (let i = 1; i < 10000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return Math.exp(lnPre) * h;
}

// Standard normal upper tail P(Z > z) and CDF, via Q(1/2, z²/2) — accurate in both tails.
export function normUpper(z) { return z >= 0 ? 0.5 * gammaQ(0.5, (z * z) / 2) : 1 - 0.5 * gammaQ(0.5, (z * z) / 2); }
export function normCdf(z) { return 1 - normUpper(z); }
// Inverse CDF by bisection on the tail (monotone, ~1e-15).
export function normQuantile(p) {
  if (!(p > 0 && p < 1)) throw new Error(`normQuantile: p must be in (0,1), got ${p}`);
  if (p === 0.5) return 0;
  const tail = Math.min(p, 1 - p);
  let lo = 0; let hi = 40;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (normUpper(mid) > tail) lo = mid; else hi = mid; }
  const z = (lo + hi) / 2;
  return p > 0.5 ? z : -z;
}
// Chi-square survival function P(X > x) with df degrees of freedom.
export function chiSqSf(x, df) { return gammaQ(df / 2, x / 2); }

// ---------- A/B maths ----------
const check = (cond, msg) => { if (!cond) throw new Error(msg); };
const zAlpha = (alpha, sides) => normQuantile(1 - alpha / sides);

// Power of a two-sample proportion test with n per group (R power.prop.test, strict = FALSE).
export function power({ p1, p2, n, alpha = 0.05, sides = 2 }) {
  check(p1 > 0 && p1 < 1 && p2 > 0 && p2 <= 1 && p1 !== p2, 'rates must be in (0,1) and differ');
  const d = Math.abs(p2 - p1);
  const pbar = (p1 + p2) / 2;
  const se0 = Math.sqrt(2 * pbar * (1 - pbar));
  const se1 = Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  return normCdf((Math.sqrt(n) * d - zAlpha(alpha, sides) * se0) / se1);
}

// Exact (unrounded) n per group for the target power; closed form of the same equation.
export function sampleSize({ p1, p2, alpha = 0.05, targetPower = 0.8, sides = 2 }) {
  check(p1 > 0 && p1 < 1 && p2 > 0 && p2 <= 1 && p1 !== p2, 'rates must be in (0,1) and differ');
  check(targetPower > 0 && targetPower < 1, 'power must be in (0,1)');
  check(alpha > 0 && alpha < 1, 'alpha must be in (0,1)');
  const d = Math.abs(p2 - p1);
  const pbar = (p1 + p2) / 2;
  const a = zAlpha(alpha, sides) * Math.sqrt(2 * pbar * (1 - pbar));
  const b = normQuantile(targetPower) * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  return ((a + b) / d) ** 2;
}

// Smallest upward p2 detectable with n per group at the target power (bisection on power()).
export function minDetectable({ p1, n, alpha = 0.05, targetPower = 0.8, sides = 2 }) {
  check(p1 > 0 && p1 < 1 && n > 1, 'baseline must be in (0,1) and n > 1');
  let lo = p1 + 1e-12; let hi = 1;
  if (power({ p1, p2: hi, n, alpha, sides }) < targetPower) return null; // not reachable even at 100 %
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (power({ p1, p2: mid, n, alpha, sides }) < targetPower) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

// Effective per-comparison alpha for k arms compared with one control (Bonferroni).
export const bonferroni = (alpha, variants) => (variants > 2 ? alpha / (variants - 1) : alpha);

// Days to collect n per arm; full weeks so every weekday appears equally often.
export function duration({ nPerVariant, variants, daily, allocation = 1 }) {
  check(daily > 0 && allocation > 0 && allocation <= 1, 'daily must be > 0 and allocation in (0,1]');
  const days = Math.ceil((nPerVariant * variants) / (daily * allocation));
  return { days, fullWeeks: Math.ceil(days / 7), daysRoundedToWeeks: Math.ceil(days / 7) * 7 };
}

// Sample ratio mismatch: chi-square goodness of fit of observed arm sizes to the planned split.
export function srm({ observed, weights, threshold = 0.001 }) {
  check(observed.length >= 2 && observed.every((o) => Number.isInteger(o) && o >= 0), 'observed must be 2+ non-negative integers');
  const w = weights || observed.map(() => 1);
  check(w.length === observed.length && w.every((x) => x > 0), 'weights must match observed and be > 0');
  const total = observed.reduce((s, x) => s + x, 0);
  const wsum = w.reduce((s, x) => s + x, 0);
  const expected = w.map((x) => (total * x) / wsum);
  const chi2 = observed.reduce((s, o, i) => s + (o - expected[i]) ** 2 / expected[i], 0);
  const df = observed.length - 1;
  const p = chiSqSf(chi2, df);
  return { total, expected, chi2, df, p, mismatch: p < threshold, threshold };
}

// Two-proportion z-test (pooled SE) + Wald CI for the difference (unpooled SE).
export function zTest({ x1, n1, x2, n2, alpha = 0.05 }) {
  check([x1, n1, x2, n2].every(Number.isInteger) && n1 > 0 && n2 > 0 && x1 >= 0 && x2 >= 0 && x1 <= n1 && x2 <= n2, 'counts must be integers with 0 <= x <= n');
  const r1 = x1 / n1; const r2 = x2 / n2;
  const pooled = (x1 + x2) / (n1 + n2);
  const sePooled = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
  const z = sePooled === 0 ? 0 : (r2 - r1) / sePooled;
  const p = 2 * normUpper(Math.abs(z));
  const se = Math.sqrt((r1 * (1 - r1)) / n1 + (r2 * (1 - r2)) / n2);
  const zc = normQuantile(1 - alpha / 2);
  const diff = r2 - r1;
  return { r1, r2, diff, relLift: r1 > 0 ? diff / r1 : null, z, p, ci: [diff - zc * se, diff + zc * se], significant: p < alpha };
}

// ---------- CLI ----------
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true; else { out[key] = next; i++; }
  }
  return out;
}
const num = (v, name) => { const x = Number(v); if (v === undefined || v === true || !Number.isFinite(x)) throw new Error(`--${name} must be a number`); return x; };
const pct = (x, d = 2) => `${(x * 100).toFixed(d)} %`;
const pp = (x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(2)} pp`;
const fmt = (x) => Math.round(x).toLocaleString('en-US').replace(/,/g, ' ');

export function run(argv) {
  const args = parseArgs(argv);
  const cmd = args._[0];
  const alpha = args.alpha !== undefined ? num(args.alpha, 'alpha') : 0.05;
  const targetPower = args.power !== undefined ? num(args.power, 'power') : 0.8;
  const sides = args.sides !== undefined ? num(args.sides, 'sides') : 2;
  const variants = args.variants !== undefined ? num(args.variants, 'variants') : 2;
  if (![1, 2].includes(sides)) throw new Error('--sides must be 1 or 2');
  if (!Number.isInteger(variants) || variants < 2) throw new Error('--variants must be an integer >= 2');
  const a = bonferroni(alpha, variants);
  const lines = [];
  let result;

  if (cmd === 'size') {
    const p1 = num(args.baseline, 'baseline');
    const mde = num(args.mde, 'mde');
    const p2 = args.relative ? p1 * (1 + mde) : p1 + mde;
    if (!(p2 > 0 && p2 <= 1)) throw new Error(`target rate ${p2} is outside (0,1]`);
    const exact = sampleSize({ p1, p2, alpha: a, targetPower, sides });
    const n = Math.ceil(exact);
    result = { command: 'size', baseline: p1, target: p2, absoluteMde: p2 - p1, relativeMde: (p2 - p1) / p1, alpha, alphaPerComparison: a, power: targetPower, sides, variants, nExact: exact, nPerVariant: n, total: n * variants };
    lines.push(`Baseline ${pct(p1)} -> target ${pct(p2)} (${pp(p2 - p1)} abs, ${p2 > p1 ? '+' : ''}${pct((p2 - p1) / p1, 1)} rel)`);
    lines.push(`alpha ${alpha}${a !== alpha ? ` (Bonferroni ${a.toPrecision(3)} per comparison)` : ''}, power ${targetPower}, ${sides}-sided, ${variants} arms`);
    lines.push(`Sample size: ${fmt(n)} per arm (exact ${exact.toFixed(1)}), ${fmt(n * variants)} total`);
    if (args.daily !== undefined) {
      const dur = duration({ nPerVariant: n, variants, daily: num(args.daily, 'daily'), allocation: args.allocation !== undefined ? num(args.allocation, 'allocation') : 1 });
      result.duration = dur;
      lines.push(`Duration: ${dur.days} days of traffic -> run ${dur.daysRoundedToWeeks} days (${dur.fullWeeks} full week${dur.fullWeeks > 1 ? 's' : ''})`);
    }
  } else if (cmd === 'mde') {
    const p1 = num(args.baseline, 'baseline');
    const n = num(args.n, 'n');
    const p2 = minDetectable({ p1, n, alpha: a, targetPower, sides });
    result = { command: 'mde', baseline: p1, nPerVariant: n, alpha, alphaPerComparison: a, power: targetPower, sides, variants, target: p2, absoluteMde: p2 === null ? null : p2 - p1, relativeMde: p2 === null ? null : (p2 - p1) / p1 };
    lines.push(p2 === null ? `No upward effect is detectable with n = ${fmt(n)} per arm at power ${targetPower}.` : `With ${fmt(n)} per arm: minimum detectable rate ${pct(p2)} (${pp(p2 - p1)} abs, +${pct((p2 - p1) / p1, 1)} rel) at power ${targetPower}, alpha ${a.toPrecision(3)} ${sides}-sided`);
  } else if (cmd === 'power') {
    const p1 = num(args.baseline, 'baseline');
    const p2 = num(args.target, 'target');
    const n = num(args.n, 'n');
    const pw = power({ p1, p2, n, alpha: a, sides });
    result = { command: 'power', baseline: p1, target: p2, nPerVariant: n, alpha: a, sides, power: pw };
    lines.push(`Power to detect ${pct(p1)} -> ${pct(p2)} with ${fmt(n)} per arm: ${pw.toFixed(3)}`);
  } else if (cmd === 'srm') {
    if (!args.observed || args.observed === true) throw new Error('--observed a,b[,c] is required');
    const observed = String(args.observed).split(',').map((x) => Number(x.trim()));
    const weights = args.weights && args.weights !== true ? String(args.weights).split(',').map((x) => Number(x.trim())) : undefined;
    const threshold = args.threshold !== undefined ? num(args.threshold, 'threshold') : 0.001;
    result = { command: 'srm', ...srm({ observed, weights, threshold }) };
    lines.push(`chi2 = ${result.chi2.toFixed(3)}, df = ${result.df}, p = ${result.p.toPrecision(3)}`);
    lines.push(result.mismatch ? `SRM DETECTED (p < ${threshold}): do not read the results — find the assignment or logging bug first.` : `No sample ratio mismatch at threshold ${threshold}.`);
  } else if (cmd === 'test') {
    const parse = (v, name) => { const m = String(v ?? '').match(/^(\d+)\/(\d+)$/); if (!m) throw new Error(`--${name} must be conversions/visitors, e.g. 120/2400`); return [Number(m[1]), Number(m[2])]; };
    const [x1, n1] = parse(args.a, 'a');
    const [x2, n2] = parse(args.b, 'b');
    const r = zTest({ x1, n1, x2, n2, alpha });
    result = { command: 'test', ...r };
    lines.push(`A ${pct(r.r1)} (${x1}/${n1})  B ${pct(r.r2)} (${x2}/${n2})`);
    lines.push(`Difference ${pp(r.diff)} abs${r.relLift !== null ? `, ${r.relLift >= 0 ? '+' : ''}${pct(r.relLift, 1)} rel` : ''}; ${Math.round((1 - alpha) * 100)} % CI [${pp(r.ci[0])}, ${pp(r.ci[1])}]`);
    lines.push(`z = ${r.z.toFixed(3)}, p = ${r.p.toPrecision(3)} -> ${r.significant ? 'significant' : 'not significant'} at alpha ${alpha}. Only valid at the pre-registered sample size (no peeking).`);
  } else {
    throw new Error('command must be one of: size, mde, power, srm, test');
  }
  return { result, text: lines.join('\n') };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const { result, text } = run(process.argv.slice(2));
    console.log(process.argv.includes('--json') ? JSON.stringify(result, null, 2) : text);
  } catch (e) {
    console.error(`ab-calc: ${e.message}`);
    process.exit(1);
  }
}
