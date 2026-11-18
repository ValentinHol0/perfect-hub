// Tests for business component scripts. Synthetic data only. Run: node --test scripts/tests/business.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as tax from '../tax-calc.mjs';
import * as led from '../income-ledger.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const FIX = join(HERE, 'fixtures');
const data = tax.loadData();
const kop = (uah) => Math.round(uah * 100);

// ---------- data file ----------
test('data file: derived values match their multipliers (one source of truth)', () => {
  for (const [year, y] of Object.entries(data.years)) {
    const mw = y.minWage.monthly;
    assert.equal(y.singleTax.group1.incomeLimit, y.singleTax.group1.incomeLimitMinWages * mw, `${year} g1 limit`);
    assert.equal(y.singleTax.group2.incomeLimit, y.singleTax.group2.incomeLimitMinWages * mw, `${year} g2 limit`);
    assert.equal(y.singleTax.group3.incomeLimit, y.singleTax.group3.incomeLimitMinWages * mw, `${year} g3 limit`);
    assert.equal(kop(y.singleTax.group1.maxMonthly), Math.round(kop(y.subsistenceAbleBodied.monthly) * y.singleTax.group1.maxRatePctOfSubsistence / 100));
    assert.equal(kop(y.singleTax.group2.maxMonthly), Math.round(kop(mw) * y.singleTax.group2.maxRatePctOfMinWage / 100));
    assert.equal(kop(y.militaryLevy.group12Monthly), Math.round(kop(mw) * y.militaryLevy.group12PctOfMinWage / 100));
    assert.equal(kop(y.esv.minMonthly), Math.round(kop(mw) * y.esv.ratePct / 100));
    assert.equal(y.esv.maxMonthlyBase, y.esv.maxBaseMinWages * mw);
    assert.ok(y.minWage.source.startsWith('https://zakon.rada.gov.ua/'), 'source URL');
    assert.match(y.checked, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('data file: 2026 values as verified on zakon.rada.gov.ua', () => {
  const y = data.years['2026'];
  assert.equal(y.minWage.monthly, 8647);
  assert.equal(y.subsistenceAbleBodied.monthly, 3328);
  assert.equal(y.singleTax.group1.incomeLimit, 1444049);
  assert.equal(y.singleTax.group2.incomeLimit, 7211598);
  assert.equal(y.singleTax.group3.incomeLimit, 10091049);
  assert.equal(y.esv.minMonthly, 1902.34);
});

// ---------- tax-calc: money and periods ----------
test('money helpers', () => {
  assert.equal(tax.toKop('1 234,56'), 123456);
  assert.equal(tax.pctOf(30000000, 5), 1500000);
  assert.equal(tax.fmt(123456789), '1 234 567,89');
  assert.deepEqual(tax.periodMonths('q2'), [4, 5, 6]);
  assert.deepEqual(tax.periodMonths('m11'), [11]);
  assert.throws(() => tax.periodMonths('q5'));
});

test('group 3, Q1 2026, 300 000 UAH: 5 % ЄП, 1 % ВЗ, 3 × minimum ЄСВ', () => {
  const r = tax.calcSingleTax({ data, year: 2026, group: 3, period: 'q1', income: 300000 });
  assert.equal(r.singleTax, 15000);
  assert.equal(r.militaryLevy, 3000);
  assert.equal(r.esv, 5707.02);
  assert.equal(r.total, 23707.02);
});

test('group 3 VAT payer uses 3 %', () => {
  const r = tax.calcSingleTax({ data, year: 2026, group: 3, period: 'q2', income: 100000, vat: true });
  assert.equal(r.singleTax, 3000);
  assert.equal(r.militaryLevy, 1000);
});

test('group 3 over the limit: 15 % on the excess only, warning about transition', () => {
  const r = tax.calcSingleTax({ data, year: 2026, group: 3, period: 'q4', income: 600000, ytdBefore: 9591049 });
  // room 500 000 at 5 % = 25 000; excess 100 000 at 15 % = 15 000
  assert.equal(r.excess, 100000);
  assert.equal(r.singleTax, 40000);
  assert.equal(r.militaryLevy, 6000);
  assert.ok(r.notes.some((n) => n.includes('298.2.3')));
});

test('group 2, full year at the maximum rate', () => {
  const r = tax.calcSingleTax({ data, year: 2026, group: 2, period: 'year' });
  assert.equal(r.singleTax, 20752.8);
  assert.equal(r.militaryLevy, 10376.4);
  assert.equal(r.esv, 22828.08);
});

test('group 1 with a council rate and one exempt month; rate above maximum is flagged', () => {
  const r = tax.calcSingleTax({ data, year: 2026, group: 1, period: 'q1', rate: 300, exemptMonths: 1 });
  assert.equal(r.singleTax, 600);
  assert.equal(r.militaryLevy, 1729.4);
  assert.equal(r.esv, 5707.02);
  const hi = tax.calcSingleTax({ data, year: 2026, group: 1, period: 'm1', rate: 400 });
  assert.ok(hi.notes.some((n) => n.includes('перевищує максимум')));
});

test('group 2 excess over 7 211 598 taxed at 15 %', () => {
  const r = tax.calcSingleTax({ data, year: 2026, group: 2, period: 'q3', income: 300000, ytdBefore: 7111598 });
  assert.equal(r.excess, 200000);
  assert.equal(r.singleTax, 1729.4 * 3 + 30000);
});

test('missing year fails with an actionable message', () => {
  assert.throws(() => tax.calcSingleTax({ data, year: 2031, group: 3, period: 'q1', income: 1 }), /No rates for 2031/);
});

test('general system estimate', () => {
  const r = tax.calcGeneral({ data, year: 2026, income: 1000000, expenses: 400000 });
  assert.equal(r.net, 600000);
  assert.equal(r.pit, 108000);
  assert.equal(r.militaryLevy, 30000);
  assert.equal(r.esv, 132000);
  const low = tax.calcGeneral({ data, year: 2026, income: 10000, expenses: 9000 });
  assert.equal(low.esv, 22828.08, 'ЄСВ floor = 12 × minimum');
});

// ---------- calendar ----------
test('weekend shifting helpers', () => {
  assert.equal(tax.iso(tax.shiftForward(tax.ymd(2026, 5, 10))), '2026-05-11'); // Sunday → Monday
  assert.equal(tax.iso(tax.shiftBack(tax.ymd(2026, 9, 20))), '2026-09-18'); // Sunday → Friday
});

test('group 3 calendar 2026: declarations, payments and ЄСВ on the right dates', () => {
  const ev = tax.buildCalendar({ data, year: 2026, group: 3 });
  const find = (kind, period) => ev.find((e) => e.kind === kind && e.period === period);
  assert.equal(find('declaration', '2025-Q4').date, '2026-02-09');
  assert.equal(find('payment', '2025-Q4').date, '2026-02-19');
  assert.equal(find('declaration', '2026-Q1').date, '2026-05-11');
  assert.equal(find('declaration', '2026-Q1').statutory, '2026-05-10');
  assert.equal(find('payment', '2026-Q1').date, '2026-05-20');
  assert.equal(find('declaration', '2026-Q2').date, '2026-08-10');
  assert.equal(find('payment', '2026-Q2').date, '2026-08-19');
  assert.equal(find('esv', '2026-Q1').date, '2026-04-20');
  assert.equal(find('esv', '2026-Q1').amount, 5707.02);
  assert.equal(find('esv', '2025-Q4').amount, null, 'no 2025 data → no amount');
  assert.ok(ev.every((e) => e.date.startsWith('2026-')));
  assert.ok(ev.every((e, i) => i === 0 || ev[i - 1].date <= e.date), 'sorted');
});

test('group 2 calendar 2026: 12 advances, annual declaration shifted to Monday 2 March', () => {
  const ev = tax.buildCalendar({ data, year: 2026, group: 2 });
  assert.equal(ev.filter((e) => e.kind === 'advance').length, 12);
  const decl = ev.find((e) => e.kind === 'declaration');
  assert.equal(decl.statutory, '2026-03-01');
  assert.equal(decl.date, '2026-03-02');
  assert.equal(ev.find((e) => e.period === '2026-01').amount, 2594.1);
  const esvSep = ev.find((e) => e.kind === 'esv' && e.period === '2026-Q3');
  assert.equal(esvSep.date, '2026-10-20');
});

test('ЄСВ deadline on a weekend is not moved; note tells to pay earlier', () => {
  const ev = tax.buildCalendar({ data, year: 2027, group: 3 });
  const q2 = ev.find((e) => e.kind === 'esv' && e.period === '2027-Q2'); // 20 July 2027 is a Tuesday
  assert.equal(q2.date, '2027-07-20');
  const ev28 = tax.buildCalendar({ data, year: 2030, group: 3 });
  const q1 = ev28.find((e) => e.kind === 'esv' && e.period === '2030-Q1'); // 20 April 2030 is a Saturday
  assert.equal(q1.date, '2030-04-20');
  assert.match(q1.note, /2030-04-19/);
});

test('iCalendar output is valid-shaped: CRLF, folded lines ≤ 75 octets, one VEVENT per event', () => {
  const ev = tax.buildCalendar({ data, year: 2026, group: 3 });
  const ics = tax.toIcs(ev, { group: '3', year: 2026, now: new Date('2026-11-12T00:00:00Z') });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, ev.length);
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20260511'));
  assert.ok(ics.includes('DTSTAMP:20261112T000000Z'));
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `too long: ${line}`);
  assert.ok(!/\n(?<!\r\n)/.test(ics.replace(/\r\n/g, '')), 'no bare LF');
});

test('foldLine keeps multibyte characters intact', () => {
  const long = `SUMMARY:${'Декларація платника єдиного податку '.repeat(5)}`;
  const folded = tax.foldLine(long);
  assert.equal(folded.split('\r\n ').join(''), long);
});

test('CLI prints the source year and the verify line; unknown year exits 1', () => {
  const ok = spawnSync(process.execPath, [join(ROOT, 'scripts', 'tax-calc.mjs'), 'calc', '--group', '3', '--year', '2026', '--period', 'q1', '--income', '300000'], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /рік 2026/);
  assert.match(ok.stdout, /zakon|ПКУ/);
  assert.match(ok.stdout, /бухгалтером/);
  const bad = spawnSync(process.execPath, [join(ROOT, 'scripts', 'tax-calc.mjs'), 'calc', '--group', '3', '--year', '2031', '--income', '1'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /No rates for 2031/);
});

test('CLI writes an .ics file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pb-'));
  try {
    const out = join(dir, 'g2.ics');
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts', 'tax-calc.mjs'), 'calendar', '--group', '2', '--year', '2026', '--ics', out, '--now', '2026-11-12T00:00:00Z'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(readFileSync(out, 'utf8'), /X-WR-CALNAME:ФОП група 2/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---------- income-ledger: parsing ----------
test('amount parsing: Ukrainian and English formats, negatives, currency suffix', () => {
  assert.equal(led.parseAmount('1 234,56'), 123456);
  assert.equal(led.parseAmount('-1,234.50'), -123450);
  assert.equal(led.parseAmount('1.234,5'), 123450);
  assert.equal(led.parseAmount('(300,00)'), -30000);
  assert.equal(led.parseAmount('25000.00 грн'), 2500000);
  assert.equal(led.parseAmount(''), null);
  assert.equal(led.parseAmount('abc'), null);
});

test('date parsing', () => {
  assert.equal(led.parseDate('05.01.2026 10:15:00'), '2026-01-05');
  assert.equal(led.parseDate('2026-03-31'), '2026-03-31');
  assert.equal(led.parseDate('03/04/2026', 'mdy'), '2026-03-04');
  assert.equal(led.parseDate('Разом'), null);
  assert.equal(led.quarterOf('2026-10-01'), '2026-Q4');
});

test('CSV parser handles quotes, embedded delimiters and CRLF', () => {
  const rows = led.parseCsv('a;"b;c";"d ""e"""\r\n1;2;3\r\n', ';');
  assert.deepEqual(rows, [['a', 'b;c', 'd "e"'], ['1', '2', '3']]);
});

// ---------- income-ledger: classification and totals ----------
test('monobank-style export: classification and quarterly totals', () => {
  const { rows, mapping } = led.readCsvText(readFileSync(join(FIX, 'mono-fop.csv'), 'utf8'));
  assert.equal(mapping.amount, 'Сума в валюті картки (UAH)');
  assert.equal(rows.length, 10, 'footer "Разом" skipped');
  const { ledger, months, quarters, years } = led.buildLedger(rows);
  const clsOf = (prefix) => ledger.find((r) => r.description.startsWith(prefix)).class;
  assert.equal(clsOf('Переказ між власним'), 'own_transfer');
  assert.equal(clsOf('Продаж валюти USD'), 'fx_conversion');
  assert.equal(clsOf('Повернення коштів п'), 'customer_refund');
  assert.equal(clsOf('Зарахування від Liq'), 'income_acquiring');
  assert.equal(clsOf('Кешбек'), 'cashback');
  assert.equal(clsOf('Повернення надміру'), 'tax_refund');
  assert.equal(clsOf('Отримання поворотно'), 'loan');
  assert.equal(quarters['2026-Q1'].income, kop(34800.5));
  assert.equal(quarters['2026-Q1'].reductions, kop(1200));
  assert.equal(quarters['2026-Q1'].net, kop(33600.5));
  assert.equal(quarters['2026-Q1'].notIncome, kop(46000));
  assert.equal(quarters['2026-Q2'].review, kop(120));
  assert.equal(quarters['2026-Q2'].ytdNet, kop(73600.5));
  assert.equal(years['2026'].net, kop(73600.5));
  assert.ok(ledger.find((r) => r.class === 'income_acquiring').review, 'acquiring flagged for gross-up review');
  assert.equal(months['2026-02'].net, kop(-1200), 'refund month shows the reduction (ПКУ 296.1 monthly records)');
  assert.equal(months['2026-04'].ytdNet, kop(73600.5));
  assert.match(mapping.currency, /UAH/);
});

test('PrivatBank-style export: preamble, credit/debit columns, self ID, FX rates', () => {
  const { rows, mapping, delimiter } = led.readCsvText(readFileSync(join(FIX, 'privat-business.csv'), 'utf8'));
  assert.equal(delimiter, ';');
  assert.equal(mapping.credit, 'Надходження');
  const noRates = led.buildLedger(rows);
  assert.equal(noRates.quarters['2026-Q3'].pendingFx, 1, 'USD without a rate is pending, not counted');
  assert.equal(noRates.quarters['2026-Q1'].income, kop(19500), 'without --self-id the top-up looks like income');
  const r = led.buildLedger(rows, { selfId: '1234567890', rates: JSON.parse(readFileSync(join(FIX, 'rates.json'), 'utf8')) });
  assert.equal(r.quarters['2026-Q1'].income, kop(12500));
  assert.equal(r.quarters['2026-Q1'].notIncome, kop(7000));
  assert.equal(r.quarters['2026-Q3'].income, kop(41500));
  assert.match(r.ledger.find((x) => x.currency === 'USD').reason, /Курс НБУ 41.5/);
});

test('--map override and missing column error', () => {
  const csv = 'When,What,Money\n01.02.2026,Оплата від клієнта,100.00\n';
  const { rows } = led.readCsvText(csv, { map: led.parseMap('date=When,description=What,amount=Money') });
  assert.equal(rows[0].amount, 10000);
  assert.throws(() => led.readCsvText(csv, { map: { amount: 'Nope' } }), /not found/);
});

test('monobank API JSON: kopecks, Kyiv dates across DST, holds excluded', () => {
  const { rows } = led.readMonoApi(JSON.parse(readFileSync(join(FIX, 'mono-api.json'), 'utf8')));
  assert.equal(rows.length, 3);
  const { quarters } = led.buildLedger(rows);
  assert.equal(quarters['2026-Q1'].income, 1500000);
  assert.equal(quarters['2026-Q2'].income, 250050, '21:30 UTC on 31 March is 1 April in Kyiv');
});

test('custom rules take precedence over defaults', () => {
  const rules = [{ id: 'my-own-card', direction: 'in', pattern: 'поповнення рахунку', class: 'own_transfer', effect: 'not_income', reason: 'test' }, ...led.DEFAULT_RULES];
  const c = led.classify({ amount: 100, description: 'Поповнення рахунку', comment: '', counterparty: '' }, { rules });
  assert.equal(c.rule, 'my-own-card');
});

test('limit warnings use the data file', () => {
  const w = led.limitWarnings({ 2026: { net: kop(1400000), review: 0, pendingFx: 0 } }, data, '1');
  assert.match(w[0], /понад 90 %/);
  const none = led.limitWarnings({ 2031: { net: 1, review: 0, pendingFx: 0 } }, data, '3');
  assert.match(none[0], /Немає ставок/);
});

test('ledger CSV is Excel-friendly (BOM, semicolons) and CLI writes JSON with totals', () => {
  const { rows } = led.readCsvText(readFileSync(join(FIX, 'mono-fop.csv'), 'utf8'));
  const csv = led.ledgerToCsv(led.buildLedger(rows).ledger);
  assert.ok(csv.startsWith('﻿date;quarter;'));
  const dir = mkdtempSync(join(tmpdir(), 'pb-'));
  try {
    const out = join(dir, 'ledger.json');
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts', 'income-ledger.mjs'), '--in', join(FIX, 'mono-fop.csv'), '--group', '3', '--year', '2026', '--out', out], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /бухгалтером/);
    const j = JSON.parse(readFileSync(out, 'utf8'));
    assert.equal(j.years['2026'].net, kop(73600.5));
    assert.equal(j.rows.length, 10);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
