#!/usr/bin/env node
// tax-calc — single tax (ЄП), military levy (ВЗ) and ЄСВ for a Ukrainian ФОП, plus a deadline calendar (.ics).
// Zero dependencies, Node >= 18. All numbers come from data/fop-rates.json (one file per plugin, with year and source).
//
// Usage:
//   node scripts/tax-calc.mjs calc --group 3 --year 2026 --period q1 --income 300000 [--ytd-before 0] [--vat] [--no-esv] [--json]
//   node scripts/tax-calc.mjs calc --group 2 --year 2026 --period year [--rate 1500] [--income 900000] [--exempt-months 1]
//   node scripts/tax-calc.mjs general --year 2026 --income 1000000 --expenses 400000 [--months 12]
//   node scripts/tax-calc.mjs calendar --group 3 --year 2026 [--ics deadlines.ics] [--json] [--now 2026-11-12T00:00:00Z]
//   node scripts/tax-calc.mjs limits --year 2026
// Options: --data <path to fop-rates.json> (default: ../data/fop-rates.json next to this script).
// Amounts are UAH; internally integer kopecks. Output ends with a verify-with-an-accountant line.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_DATA = join(HERE, '..', 'data', 'fop-rates.json');
export const VERIFY_LINE = 'Розрахунок довідковий. Перевірте суми та строки з бухгалтером і в Електронному кабінеті ДПС перед сплатою.';

// ---------- money ----------
export const toKop = (uah) => {
  const n = typeof uah === 'string' ? Number(uah.replace(/\s/g, '').replace(',', '.')) : uah;
  if (!Number.isFinite(n)) throw new Error(`not a number: ${uah}`);
  return Math.round(n * 100);
};
export const pctOf = (kop, pct) => Math.round((kop * pct) / 100);
export const fmt = (kop) => {
  const sign = kop < 0 ? '-' : '';
  const a = Math.abs(kop);
  const int = Math.floor(a / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${int},${String(a % 100).padStart(2, '0')}`;
};
const kopToNumber = (kop) => Math.round(kop) / 100;

// ---------- data ----------
export function loadData(path = DEFAULT_DATA) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
export function yearData(data, year) {
  const y = data.years?.[String(year)];
  if (!y) {
    const have = Object.keys(data.years || {}).join(', ') || 'none';
    throw new Error(`No rates for ${year} in fop-rates.json (have: ${have}). Add the year block from that year's State Budget law and the Tax Code, then re-run.`);
  }
  return y;
}
export function minWageForMonth(y, year, month) {
  const key = `${year}-${String(month).padStart(2, '0')}`;
  return y.minWage.byMonth?.[key] ?? y.minWage.monthly;
}
export function sourceLine(data, year) {
  const y = yearData(data, year);
  return `Джерело: data/fop-rates.json, рік ${year} (перевірено ${y.checked || data.checked}); мінзарплата — ${y.minWage.basis}; ставки і ліміти — ${y.singleTax.basis}; ВЗ — ${y.militaryLevy.basis}; ЄСВ — ${y.esv.basis}.`;
}

// ---------- periods ----------
export function periodMonths(period) {
  const p = String(period || 'year').toLowerCase();
  if (p === 'year') return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const q = p.match(/^q([1-4])$/);
  if (q) { const s = (Number(q[1]) - 1) * 3 + 1; return [s, s + 1, s + 2]; }
  const m = p.match(/^m(\d{1,2})$/);
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12) return [Number(m[1])];
  throw new Error(`Unknown period "${period}" (use year, q1..q4, m1..m12)`);
}

export function esvMinFor(y, year, months) {
  return months.reduce((s, m) => s + pctOf(toKop(minWageForMonth(y, year, m)), y.esv.ratePct), 0);
}

// ---------- single tax groups 1–3 ----------
export function calcSingleTax({ data, year, group, period = 'year', income, ytdBefore = 0, vat = false, rate, exemptMonths = 0, noEsv = false }) {
  const y = yearData(data, year);
  const g = Number(group);
  if (![1, 2, 3].includes(g)) throw new Error('group must be 1, 2 or 3');
  const months = periodMonths(period);
  const notes = [];
  const incomeKop = income === undefined ? null : toKop(income);
  const ytdKop = toKop(ytdBefore);
  const st = y.singleTax[`group${g}`];
  const limitKop = toKop(st.incomeLimit);
  let singleTax = 0; let militaryLevy = 0; let excessKop = 0; let rateUsed;

  if (g === 1 || g === 2) {
    const maxKop = toKop(st.maxMonthly);
    const rateKop = rate === undefined ? maxKop : toKop(rate);
    if (rateKop > maxKop) notes.push(`Ставка ${fmt(rateKop)} перевищує максимум ${fmt(maxKop)} для групи ${g} (ПКУ 293.2) — перевірте рішення місцевої ради.`);
    if (rate === undefined) notes.push(`Використано максимальну ставку групи ${g}; фактичну ставку встановлює місцева рада (ПКУ 293.2).`);
    const taxMonths = Math.max(0, months.length - Number(exemptMonths || 0));
    singleTax = rateKop * taxMonths;
    militaryLevy = toKop(y.militaryLevy.group12Monthly) * taxMonths;
    rateUsed = kopToNumber(rateKop);
    if (exemptMonths) notes.push(`Звільнено ${exemptMonths} міс. (відпустка/хвороба ≥ 30 днів, лише без найманих працівників — ПКУ 295.5; п. 16-1 пп. 1.13).`);
    if (incomeKop !== null) {
      excessKop = Math.max(0, Math.min(incomeKop, ytdKop + incomeKop - limitKop));
      if (excessKop > 0) {
        singleTax += pctOf(excessKop, y.singleTax.overLimitRatePct);
        notes.push(`Перевищення ліміту групи ${g} на ${fmt(excessKop)} грн: 15 % до суми перевищення; з наступного кварталу — перехід на іншу групу або загальну систему, заява до 20 числа місяця після кварталу (ПКУ 293.8, 298.2.3).`);
      }
    }
  } else {
    if (incomeKop === null) throw new Error('group 3 needs --income for the period');
    const ratePct = vat ? st.ratePctVatPayer : st.ratePct;
    rateUsed = ratePct;
    const room = Math.max(0, limitKop - ytdKop);
    const within = Math.min(incomeKop, room);
    excessKop = incomeKop - within;
    singleTax = pctOf(within, ratePct) + pctOf(excessKop, y.singleTax.overLimitRatePct);
    militaryLevy = pctOf(incomeKop, y.militaryLevy.group3PctOfIncome);
    if (excessKop > 0) notes.push(`Перевищення ліміту групи 3 на ${fmt(excessKop)} грн: 15 % до суми перевищення і обов'язковий перехід на загальну систему з першого числа місяця після кварталу (ПКУ 293.8 п. 3, 298.2.3 п. 3).`);
    if (vat) notes.push('Ставка 3 % — лише для зареєстрованих платників ПДВ; ПДВ сплачується окремо (ПКУ 293.3 п. 1, 297.1 п. 3).');
  }

  const esv = noEsv ? 0 : esvMinFor(y, year, months);
  if (noEsv) notes.push('ЄСВ не враховано (--no-esv): лише якщо ви звільнені (пенсіонер, особа з інвалідністю, роботодавець сплатив мінімум, мобілізовані) — Закон 2464-VI ст. 4 ч. 4, 6; розд. VIII п. 9-18.');
  else notes.push(`ЄСВ — мінімальний внесок ${months.length} міс.; можна платити більше, до 22 % від ${fmt(toKop(y.esv.maxMonthlyBase))} грн на місяць (Закон 2464-VI ст. 7 ч. 1 п. 3).`);

  const ytdAfter = incomeKop === null ? null : ytdKop + incomeKop;
  return {
    year: Number(year), group: g, period: String(period), months: months.length,
    rate: rateUsed, incomeLimit: kopToNumber(limitKop),
    income: incomeKop === null ? null : kopToNumber(incomeKop),
    ytdAfter: ytdAfter === null ? null : kopToNumber(ytdAfter),
    limitUsedPct: ytdAfter === null ? null : Math.round((ytdAfter / limitKop) * 1000) / 10,
    excess: kopToNumber(excessKop),
    singleTax: kopToNumber(singleTax), militaryLevy: kopToNumber(militaryLevy), esv: kopToNumber(esv),
    total: kopToNumber(singleTax + militaryLevy + esv),
    notes,
  };
}

// ---------- general system (estimate) ----------
export function calcGeneral({ data, year, income, expenses = 0, months = 12 }) {
  const y = yearData(data, year);
  const net = Math.max(0, toKop(income) - toKop(expenses));
  const pit = pctOf(net, y.generalSystem.pitPct);
  const ml = pctOf(net, y.generalSystem.militaryLevyPct);
  const monthList = Array.from({ length: Number(months) }, (_, i) => i + 1);
  const floor = esvMinFor(y, year, monthList);
  const cap = pctOf(toKop(y.esv.maxMonthlyBase), y.esv.ratePct) * Number(months);
  const esv = Math.min(cap, Math.max(floor, pctOf(net, y.esv.ratePct)));
  return {
    year: Number(year), system: 'general', income: kopToNumber(toKop(income)), expenses: kopToNumber(toKop(expenses)), net: kopToNumber(net),
    pit: kopToNumber(pit), militaryLevy: kopToNumber(ml), esv: kopToNumber(esv), total: kopToNumber(pit + ml + esv),
    notes: [
      'Оцінка за рік: ПДФО 18 % і ВЗ 5 % від чистого доходу (ПКУ 167.1, 177.2; п. 16-1); ЄСВ 22 % від чистого доходу, не менше мінімуму за кожен місяць і не більше 22 % від максимальної бази (Закон 2464-VI ст. 7 ч. 1 п. 2).',
      '[Unverified] Чи включається ЄСВ «за себе» до витрат, авансові платежі ВЗ, строк сплати річного ПДФО (ПКУ 57.1 чи 179.7) — перевірте з бухгалтером.',
    ],
  };
}

// ---------- dates ----------
const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
export const ymd = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
export const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const isWeekend = (d) => d.getUTCDay() === 0 || d.getUTCDay() === 6;
export function isNonWorking(d, holidays = []) { return isWeekend(d) || holidays.includes(iso(d)); }
export function shiftForward(d, holidays = []) { let x = d; while (isNonWorking(x, holidays)) x = addDays(x, 1); return x; }
export function shiftBack(d, holidays = []) { let x = d; while (isNonWorking(x, holidays)) x = addDays(x, -1); return x; }
const quarterEnd = (year, q) => addDays(ymd(year, q * 3 + 1, 1), -1); // month 13 rolls over to 1 January
const MONTHS_UA = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];

// ---------- calendar ----------
export function buildCalendar({ data, year, group }) {
  const Y = Number(year);
  const g = String(group).toLowerCase();
  if (!['1', '2', '3', 'general'].includes(g)) throw new Error('group must be 1, 2, 3 or general');
  const R = data.deadlineRules;
  const holidaysFor = (yy) => data.years?.[String(yy)]?.nonWorkingDays || [];
  const hol = [...holidaysFor(Y - 1), ...holidaysFor(Y), ...holidaysFor(Y + 1)];
  const yd = (yy) => data.years?.[String(yy)];
  const events = [];
  const push = (statutory, shiftRule, ev) => {
    let date = statutory; let note = '';
    if (shiftRule === 'next_working_day') {
      date = shiftForward(statutory, hol);
      if (iso(date) !== iso(statutory)) note = `Строк ${iso(statutory)} припадає на вихідний — перенесено на ${iso(date)} (${ev.kind === 'declaration' ? 'ПКУ 49.20' : 'ПКУ 57.1'}).`;
    } else if (shiftRule === 'none' && isNonWorking(statutory, hol)) {
      note = `Строк ${iso(statutory)} — вихідний; закон про ЄСВ не переносить строк — сплатіть до ${iso(shiftBack(statutory, hol))}.`;
    }
    events.push({ date: iso(date), statutory: iso(statutory), ...ev, note });
  };
  const esvEvent = (py, q) => {
    const d = ymd(q === 4 ? py + 1 : py, q * 3 + 1 > 12 ? 1 : q * 3 + 1, R.esvQuarterlyDayOfNextMonth.value);
    const yy = yd(py);
    const amount = yy ? kopToNumber(esvMinFor(yy, py, periodMonths(`q${q}`))) : null;
    push(d, R.shift.esvPayment, { kind: 'esv', period: `${py}-Q${q}`, title: `ЄСВ за ${q} квартал ${py}`, amount, basis: R.esvQuarterlyDayOfNextMonth.basis });
  };

  if (g === '1' || g === '2') {
    const yy = yd(Y);
    for (let m = 1; m <= 12; m++) {
      const amount = yy ? kopToNumber(toKop(yy.singleTax[`group${g}`].maxMonthly) + toKop(yy.militaryLevy.group12Monthly)) : null;
      push(ymd(Y, m, R.group12MonthlyAdvanceDay.value), R.shift.taxPayment, {
        kind: 'advance', period: `${Y}-${pad(m)}`, title: `ЄП + військовий збір: авансовий внесок за ${MONTHS_UA[m - 1]} ${Y}`,
        amount, amountNote: amount === null ? '' : 'максимальна ставка ЄП; ваша — за рішенням місцевої ради', basis: R.group12MonthlyAdvanceDay.basis,
      });
    }
    push(addDays(ymd(Y - 1, 12, 31), R.group12AnnualDeclarationDaysAfterYearEnd.value), R.shift.filing, {
      kind: 'declaration', period: `${Y - 1}`, title: `Декларація платника ЄП (група ${g}) за ${Y - 1} рік, з додатком про ЄСВ`, amount: null, basis: R.group12AnnualDeclarationDaysAfterYearEnd.basis,
    });
  } else if (g === '3') {
    for (const [py, q] of [[Y - 1, 4], [Y, 1], [Y, 2], [Y, 3], [Y, 4]]) {
      const decl = addDays(quarterEnd(py, q), R.group3DeclarationDaysAfterQuarterEnd.value);
      push(decl, R.shift.filing, {
        kind: 'declaration', period: `${py}-Q${q}`, title: `Декларація платника ЄП (група 3) за ${q} квартал ${py}${q === 4 ? ' — з додатком про ЄСВ за рік' : ''}`, amount: null, basis: R.group3DeclarationDaysAfterQuarterEnd.basis,
      });
      push(addDays(decl, R.paymentDaysAfterDeclarationDeadline.value), R.shift.taxPayment, {
        kind: 'payment', period: `${py}-Q${q}`, title: `Сплата ЄП (5 % або 3 %) і військового збору (1 %) за ${q} квартал ${py}`, amount: null,
        amountNote: 'сума залежить від доходу кварталу — tax-calc.mjs calc', basis: `${R.paymentDaysAfterDeclarationDeadline.basis}; ${R.shift.paymentBaseNote}`,
      });
    }
  } else {
    for (const md of R.generalSystemAdvanceDates.value) {
      const [m, d] = md.split('-').map(Number);
      push(ymd(Y, m, d), R.shift.taxPayment, { kind: 'advance', period: `${Y}-Q${(m - 1) / 3}`, title: `Авансовий внесок ПДФО за ${(m - 1) / 3} квартал ${Y}`, amount: null, basis: R.generalSystemAdvanceDates.basis });
    }
    const [dm, dd] = R.generalSystemAnnualDeclaration.value.split('-').map(Number);
    const decl = ymd(Y, dm, dd);
    push(decl, R.shift.filing, { kind: 'declaration', period: `${Y - 1}`, title: `Декларація про майновий стан і доходи (ФОП, загальна система) за ${Y - 1} рік, з ЄСВ`, amount: null, basis: R.generalSystemAnnualDeclaration.basis });
    push(addDays(decl, R.paymentDaysAfterDeclarationDeadline.value), R.shift.taxPayment, { kind: 'payment', period: `${Y - 1}`, title: `Сплата ПДФО і ВЗ за ${Y - 1} рік [Unverified: ПКУ 57.1 vs 179.7 — уточніть]`, amount: null, basis: 'ПКУ 57.1' });
  }
  for (const [py, q] of [[Y - 1, 4], [Y, 1], [Y, 2], [Y, 3]]) esvEvent(py, q);

  return events.filter((e) => e.date.startsWith(`${Y}-`)).sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
}

// ---------- iCalendar ----------
const icsEscape = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
export function foldLine(line) {
  const out = []; let cur = ''; let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch, 'utf8');
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}
export function toIcs(events, { group, year, now = new Date() } = {}) {
  const stamp = new Date(now).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Perfect Hub//business tax-calc//UK', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:ФОП ${group === 'general' ? 'загальна система' : `група ${group}`} — строки ${year}`];
  for (const e of events) {
    const d = e.date.replace(/-/g, '');
    const next = iso(addDays(new Date(`${e.date}T00:00:00Z`), 1)).replace(/-/g, '');
    const desc = [e.amount !== null && e.amount !== undefined ? `Сума: ${fmt(toKop(e.amount))} грн${e.amountNote ? ` (${e.amountNote})` : ''}` : e.amountNote || '', `Підстава: ${e.basis}`, e.note, VERIFY_LINE].filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT', `UID:${d}-${e.kind}-${e.period}@perfect-business`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next}`,
      `SUMMARY:${icsEscape(e.title)}`, `DESCRIPTION:${icsEscape(desc)}`, 'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(e.title)}`, 'TRIGGER:-P3D', 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

// ---------- CLI ----------
export function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const opts = { _: cmd };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith('--')) opts[key] = true; else { opts[key] = next; i++; }
  }
  return opts;
}

function printCalc(r, data) {
  const L = [];
  L.push(`ФОП, група ${r.group}, ${r.year}, період ${r.period} (${r.months} міс.)`);
  if (r.income !== null) L.push(`Дохід за період: ${fmt(toKop(r.income))} грн; з початку року: ${fmt(toKop(r.ytdAfter))} грн (${r.limitUsedPct} % ліміту ${fmt(toKop(r.incomeLimit))} грн)`);
  L.push(`Єдиний податок: ${fmt(toKop(r.singleTax))} грн${r.group === 3 ? ` (ставка ${r.rate} %)` : ` (ставка ${fmt(toKop(r.rate))} грн/міс.)`}`);
  L.push(`Військовий збір: ${fmt(toKop(r.militaryLevy))} грн`);
  L.push(`ЄСВ: ${fmt(toKop(r.esv))} грн`);
  L.push(`Разом: ${fmt(toKop(r.total))} грн`);
  for (const n of r.notes) L.push(`- ${n}`);
  L.push(sourceLine(data, r.year));
  L.push(VERIFY_LINE);
  return L.join('\n');
}

export function main(argv = process.argv.slice(2)) {
  const o = parseArgs(argv);
  const data = loadData(o.data ? resolve(o.data) : DEFAULT_DATA);
  const year = Number(o.year || new Date().getFullYear());
  if (o._ === 'calc') {
    const r = calcSingleTax({ data, year, group: o.group, period: o.period || 'year', income: o.income, ytdBefore: o['ytd-before'] || 0, vat: !!o.vat, rate: o.rate, exemptMonths: Number(o['exempt-months'] || 0), noEsv: !!o['no-esv'] });
    return o.json ? JSON.stringify({ ...r, source: sourceLine(data, year), verify: VERIFY_LINE }, null, 2) : printCalc(r, data);
  }
  if (o._ === 'general') {
    if (o.income === undefined) throw new Error('general needs --income');
    const r = calcGeneral({ data, year, income: o.income, expenses: o.expenses || 0, months: Number(o.months || 12) });
    if (o.json) return JSON.stringify({ ...r, source: sourceLine(data, year), verify: VERIFY_LINE }, null, 2);
    return [`ФОП, загальна система, ${year}`, `Чистий дохід: ${fmt(toKop(r.net))} грн`, `ПДФО: ${fmt(toKop(r.pit))} грн`, `Військовий збір: ${fmt(toKop(r.militaryLevy))} грн`, `ЄСВ: ${fmt(toKop(r.esv))} грн`, `Разом: ${fmt(toKop(r.total))} грн`, ...r.notes.map((n) => `- ${n}`), sourceLine(data, year), VERIFY_LINE].join('\n');
  }
  if (o._ === 'calendar') {
    if (!o.group) throw new Error('calendar needs --group 1|2|3|general');
    const events = buildCalendar({ data, year, group: o.group });
    if (o.ics) writeFileSync(resolve(o.ics), toIcs(events, { group: o.group, year, now: o.now ? new Date(o.now) : new Date() }), 'utf8');
    if (o.json) return JSON.stringify({ year, group: String(o.group), events, source: `data/fop-rates.json deadlineRules (перевірено ${data.checked})`, verify: VERIFY_LINE }, null, 2);
    const L = [`Строки для ФОП ${o.group === 'general' ? 'на загальній системі' : `групи ${o.group}`} у ${year} році:`];
    for (const e of events) L.push(`${e.date}  ${e.title}${e.amount !== null && e.amount !== undefined ? ` — ${fmt(toKop(e.amount))} грн` : ''}${e.note ? `  [${e.note}]` : ''}`);
    if (o.ics) L.push(`Файл календаря: ${resolve(o.ics)}`);
    L.push(`Джерело: data/fop-rates.json → deadlineRules (перевірено ${data.checked}).`, VERIFY_LINE);
    return L.join('\n');
  }
  if (o._ === 'limits') {
    const y = yearData(data, year);
    return [`Ліміти доходу ${year} (мінзарплата на 1 січня ${fmt(toKop(y.minWage.monthly))} грн):`,
      ...[1, 2, 3].map((g) => `група ${g}: ${y.singleTax[`group${g}`].incomeLimitMinWages} × мінзарплата = ${fmt(toKop(y.singleTax[`group${g}`].incomeLimit))} грн`),
      sourceLine(data, year), VERIFY_LINE].join('\n');
  }
  throw new Error('command must be calc, general, calendar or limits');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(main()); } catch (e) { console.error(`tax-calc: ${e.message}`); process.exit(1); }
}
