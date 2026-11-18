// Tests for scripts/ab-calc.mjs and scripts/utm.mjs — run: node --test scripts/tests/marketing.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { normQuantile, normCdf, chiSqSf, power, sampleSize, minDetectable, bonferroni, duration, srm, zTest, run as abRun } from '../ab-calc.mjs';
import { transliterate, normalise, checkUrl, buildUrl, MEDIUMS } from '../utm.mjs';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const close = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg}: ${actual} vs ${expected} (tol ${tol})`);

// ---------- ab-calc: reference values ----------
// R stats::power.prop.test documentation examples (rdocumentation.org/packages/stats/versions/3.6.1/topics/power.prop.test, checked 2026-11-12).
test('power.prop.test(n = 50, p1 = .50, p2 = .75) => power = 0.740', () => {
  close(power({ p1: 0.5, p2: 0.75, n: 50 }), 0.740, 0.0005, 'power');
});
test('power.prop.test(p1 = .50, p2 = .75, power = .90) => n = 76.7', () => {
  close(sampleSize({ p1: 0.5, p2: 0.75, targetPower: 0.9 }), 76.7, 0.05, 'n');
});
test('power.prop.test(n = 50, p1 = .5, power = .90) => p2 = 0.8026', () => {
  close(minDetectable({ p1: 0.5, n: 50, targetPower: 0.9 }), 0.8026, 0.00005, 'p2');
});
test('power.prop.test(p1 = .5, p2 = 0.501, sig.level = .001, power = 0.90) => n = 10451937', () => {
  assert.equal(Math.round(sampleSize({ p1: 0.5, p2: 0.501, alpha: 0.001, targetPower: 0.9 })), 10451937);
});
test('power.prop.test(p1 = 0.90, p2 = 1.0, power = 0.8) => n = 73.37', () => {
  close(sampleSize({ p1: 0.9, p2: 1.0, targetPower: 0.8 }), 73.37, 0.005, 'n');
});

// NIST/SEMATECH e-Handbook, critical values of the chi-square distribution (itl.nist.gov/div898/handbook/eda/section3/eda3674.htm).
test('chi-square upper tail matches NIST critical values', () => {
  for (const [x, df, p] of [[3.841, 1, 0.05], [10.828, 1, 0.001], [5.991, 2, 0.05], [7.815, 3, 0.05], [16.266, 3, 0.001], [9.488, 4, 0.05], [18.307, 10, 0.05], [29.588, 10, 0.001]]) {
    close(chiSqSf(x, df), p, p * 0.002, `chi2(${x}, df ${df})`);
  }
});
test('normal quantiles and CDF', () => {
  close(normQuantile(0.975), 1.959963985, 1e-9, 'z 0.975');
  close(normQuantile(0.95), 1.644853627, 1e-9, 'z 0.95');
  close(normQuantile(0.8), 0.841621234, 1e-9, 'z 0.8');
  close(normQuantile(0.025), -1.959963985, 1e-9, 'z 0.025');
  close(normCdf(0), 0.5, 1e-15, 'cdf 0');
  close(normCdf(-3), 0.0013498980316301, 1e-15, 'cdf -3');
  assert.throws(() => normQuantile(1));
});

// ---------- ab-calc: behaviour ----------
test('sample size is symmetric in direction and grows as MDE shrinks', () => {
  close(sampleSize({ p1: 0.1, p2: 0.12 }), sampleSize({ p1: 0.12, p2: 0.1 }), 1e-9, 'symmetry');
  assert.ok(sampleSize({ p1: 0.1, p2: 0.11 }) > sampleSize({ p1: 0.1, p2: 0.12 }));
  assert.ok(sampleSize({ p1: 0.1, p2: 0.12, sides: 1 }) < sampleSize({ p1: 0.1, p2: 0.12, sides: 2 }));
});
test('mde round-trips with sample size', () => {
  const n = Math.ceil(sampleSize({ p1: 0.04, p2: 0.044 }));
  const p2 = minDetectable({ p1: 0.04, n });
  assert.ok(p2 <= 0.044 && p2 > 0.0439, `p2 ${p2}`);
  close(power({ p1: 0.04, p2, n }), 0.8, 1e-9, 'power at mde');
});
test('mde returns null when even 100 % is not detectable', () => {
  assert.equal(minDetectable({ p1: 0.5, n: 2, targetPower: 0.99 }), null);
});
test('bonferroni and duration', () => {
  assert.equal(bonferroni(0.05, 2), 0.05);
  assert.equal(bonferroni(0.05, 3), 0.025);
  assert.deepEqual(duration({ nPerVariant: 39475, variants: 2, daily: 3000 }), { days: 27, fullWeeks: 4, daysRoundedToWeeks: 28 });
  assert.deepEqual(duration({ nPerVariant: 1000, variants: 2, daily: 1000, allocation: 0.5 }), { days: 4, fullWeeks: 1, daysRoundedToWeeks: 7 });
});
test('srm flags a broken 50/50 split and passes a healthy one', () => {
  const bad = srm({ observed: [50000, 48000] });
  assert.equal(bad.mismatch, true);
  close(bad.chi2, (1000 ** 2 / 49000) * 2, 1e-9, 'chi2');
  const ok = srm({ observed: [50110, 49390] });
  assert.equal(ok.mismatch, false);
  const weighted = srm({ observed: [9000, 1000], weights: [90, 10] });
  close(weighted.chi2, 0, 1e-12, 'weighted chi2');
  assert.equal(srm({ observed: [100, 100, 100] }).df, 2);
});
test('z-test equals Pearson chi-square on the 2x2 table and has a sane CI', () => {
  const r = zTest({ x1: 120, n1: 2400, x2: 151, n2: 2410 });
  // independent 2x2 Pearson chi-square
  const t = [[120, 2280], [151, 2259]];
  const N = 4810; const rows = [2400, 2410]; const cols = [271, 4539];
  let chi2 = 0;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const e = (rows[i] * cols[j]) / N; chi2 += (t[i][j] - e) ** 2 / e; }
  close(r.z ** 2, chi2, 1e-9, 'z^2 vs chi2');
  close(r.p, chiSqSf(chi2, 1), 1e-12, 'p');
  assert.ok(r.ci[0] < r.diff && r.diff < r.ci[1]);
  assert.equal(r.significant, false);
  assert.equal(zTest({ x1: 50, n1: 1000, x2: 50, n2: 1000 }).p, 1);
});
test('CLI size with relative MDE and duration', () => {
  const { result } = abRun(['size', '--baseline', '0.04', '--mde', '0.10', '--relative', '--daily', '3000']);
  assert.equal(result.nPerVariant, 39475);
  close(result.target, 0.044, 1e-12, 'target');
  assert.equal(result.duration.daysRoundedToWeeks, 28);
});
test('CLI rejects bad input with exit code 1', () => {
  const r = spawnSync(process.execPath, [join(SCRIPTS, 'ab-calc.mjs'), 'size', '--baseline', '0.04'], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--mde must be a number/);
  const v = spawnSync(process.execPath, [join(SCRIPTS, 'ab-calc.mjs'), 'size', '--baseline', '0.9', '--mde', '0.5', '--relative'], { encoding: 'utf8' });
  assert.equal(v.status, 1);
});

// ---------- utm ----------
// Official examples from the KMU resolution No. 55 of 27.01.2010 transliteration table.
test('transliteration follows KMU No. 55 (2010)', () => {
  const cases = { Згорани: 'zghorany', Розгон: 'rozghon', Юрій: 'yurii', Їжакевич: 'yizhakevych', Яготин: 'yahotyn', Йосипівка: 'yosypivka', 'Знам’янка': 'znamianka', "Подвір'їв": 'podviriv', Гаївка: 'haivka', Щербухи: 'shcherbukhy', Ґалаґан: 'galagan', Рівне: 'rivne' };
  for (const [ua, latin] of Object.entries(cases)) assert.equal(transliterate(ua), latin, ua);
});
test('normalise produces convention-safe values', () => {
  assert.equal(normalise("2026-11_Чорна п'ятниця_UA"), '2026-11_chorna-piatnytsia_ua');
  assert.equal(normalise('  Video  A!! '), 'video-a');
  assert.equal(normalise('Spring Sale - 20%'), 'spring-sale-20');
});
test('a correct link passes and reports its GA4 channel', () => {
  const r = checkUrl('https://shop.example/p/1?utm_source=newsletter&utm_medium=email&utm_campaign=2026-11_black-friday_ua&utm_content=hero-button');
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.equal(r.channel, 'Email');
});
test('convention violations are errors', () => {
  const r = checkUrl('https://a.example/?utm_source=Facebook&utm_medium=Paid%20Social&utm_campaign=bf');
  assert.equal(r.ok, false);
  const msgs = r.problems.map((p) => `${p.param}: ${p.message}`).join('\n');
  assert.match(msgs, /utm_source: uppercase/);
  assert.match(msgs, /utm_medium: contains spaces/);
  assert.match(msgs, /utm_medium: medium "Paid Social" is not in the allowed list/);
  assert.match(msgs, /utm_campaign: campaign must be yyyy-mm_/);
});
test('missing required, typos, fragments, click IDs, internal links, URL sources', () => {
  const missing = checkUrl('https://a.example/?utm_source=google');
  assert.deepEqual(missing.problems.filter((p) => p.level === 'error').map((p) => p.param).sort(), ['utm_campaign', 'utm_medium']);
  assert.match(JSON.stringify(checkUrl('https://a.example/?utm_source=x&utm_medium=cpc&utm_campaign=2026-01_a&utm_compaign=b').problems), /unknown UTM parameter/);
  assert.match(JSON.stringify(checkUrl('https://a.example/#top?utm_source=x').problems), /after \\"#\\"/);
  const click = checkUrl('https://a.example/?utm_source=facebook&utm_medium=paid_social&utm_campaign=2026-01_a&fbclid=abc');
  assert.equal(click.ok, true);
  assert.ok(click.problems.some((p) => p.level === 'warning' && p.param === 'fbclid'));
  assert.equal(checkUrl('https://blog.shop.example/?utm_source=x&utm_medium=referral&utm_campaign=2026-01_a', { site: 'www.shop.example' }).ok, false);
  assert.equal(checkUrl('https://a.example/?utm_source=www.site.com&utm_medium=referral&utm_campaign=2026-01_a').ok, false);
  assert.equal(checkUrl('https://a.example/?utm_source=x&utm_medium=cpc&utm_campaign=2026-13_a').ok, false);
  assert.equal(checkUrl('not a url').ok, false);
});
test('custom mediums only with --allow-medium', () => {
  const url = 'https://a.example/?utm_source=viber&utm_medium=messenger&utm_campaign=2026-02_restock';
  assert.equal(checkUrl(url).ok, false);
  assert.equal(checkUrl(url, { extraMediums: ['messenger'] }).ok, true);
});
test('build keeps existing query and fragment, normalises and validates', () => {
  const r = buildUrl('https://landing.example/sale?ref=partner#form', { utm_source: 'Telegram', utm_medium: 'social', utm_campaign: '2026-11_Запуск' });
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.equal(r.url, 'https://landing.example/sale?ref=partner&utm_source=telegram&utm_medium=social&utm_campaign=2026-11_zapusk#form');
  assert.ok(r.notes.length >= 2);
  assert.equal(r.channel, MEDIUMS.social);
});
test('utm CLI exit codes', () => {
  const ok = spawnSync(process.execPath, [join(SCRIPTS, 'utm.mjs'), 'build', '--url', 'https://a.example/', '--source', 'google', '--medium', 'cpc', '--campaign', '2026-03_spring'], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  const bad = spawnSync(process.execPath, [join(SCRIPTS, 'utm.mjs'), 'check', 'https://a.example/?utm_source=google'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  const json = spawnSync(process.execPath, [join(SCRIPTS, 'utm.mjs'), 'mediums', '--json'], { encoding: 'utf8' });
  assert.equal(JSON.parse(json.stdout).email, 'Email');
});
