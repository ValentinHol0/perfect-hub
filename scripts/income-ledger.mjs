#!/usr/bin/env node
// income-ledger — turns bank statement exports (CSV, or monobank API JSON) into a classified income ledger
// for a Ukrainian ФОП on the single tax: which inflows are income, which are not (own transfers, currency sales,
// loans, refunds, tax refunds), quarterly and annual totals, limit check against data/fop-rates.json.
// Zero dependencies, Node >= 18.
//
// Usage:
//   node scripts/income-ledger.mjs --in statement.csv [--in second.csv] [--preset mono-api]
//        [--map "date=Дата операції,amount=Сума,description=Призначення платежу"] [--delimiter ";"] [--decimal ","]
//        [--date-order dmy|ymd|mdy] [--rules extra-rules.json] [--self "Іваненко Іван"] [--self-id 1234567890]
//        [--rates nbu-rates.json] [--group 3 --year 2026] [--out ledger.csv|ledger.json] [--json]
// Canonical fields for --map: date, amount, credit, debit, currency, uah, description, comment, counterparty,
//   counterpartyId, counterpartyIban, id.
// Rates file: { "USD": { "2026-03-02": 41.2345 }, "EUR": { ... } } — official NBU rate on the date of receipt (ПКУ 292.5).
// Output ends with a verify-with-an-accountant line. Header candidates below are best-known monobank/PrivatBank names [Unverified]:
// always check the detected mapping printed in the summary.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_DATA = join(HERE, '..', 'data', 'fop-rates.json');
export const VERIFY_LINE = 'Книга доходів сформована автоматично. Перевірте класифікацію та підсумки з бухгалтером перед поданням декларації.';

// ---------- header candidates for monobank, PrivatBank and generic exports (case-insensitive, exact, first match wins) ----------
export const HEADER_CANDIDATES = {
  date: ['дата і час операції', 'дата i час операції', 'дата операції', 'дата проводки', 'дата', 'date and time', 'date'],
  amount: ['сума в валюті картки (uah)', 'сума в валюті рахунку', 'сума операції', 'сума', 'card currency amount, (uah)', 'amount'],
  credit: ['надходження', 'сума надходження', 'кредит', 'credit'],
  debit: ['списання', 'сума списання', 'дебет', 'debit'],
  currency: ['валюта', 'валюта операції', 'currency'],
  uah: ['сума в гривнях', 'еквівалент в uah', 'сума, грн', 'uah equivalent'],
  description: ['деталі операції', 'призначення платежу', 'призначення', 'опис операції', 'опис', 'details', 'description'],
  comment: ['коментар', 'comment'],
  counterparty: ['контрагент', 'найменування контрагента', 'кореспондент', 'counterparty'],
  counterpartyId: ['єдрпоу контрагента', 'код контрагента', 'єдрпоу', 'рнокпп контрагента', 'counterparty id'],
  counterpartyIban: ['iban контрагента', 'рахунок контрагента', 'counterparty iban'],
  id: ['id', 'номер операції', 'референс'],
};

// ---------- classification rules (ordered; first match wins) ----------
// effect: income | not_income | reduce (lowers income of the period) | review (excluded from income until decided)
export const DEFAULT_RULES = [
  { id: 'customer-refund', direction: 'out', pattern: '(повернен\\p{L}*|refund).{0,40}(покупц|клієнт|замовник|за товар|за замовлення)', class: 'customer_refund', effect: 'reduce', review: true, reason: 'Повернення коштів покупцю при поверненні товару чи розірванні договору не включається до доходу (ПКУ 292.11 п. 5) — зменшує дохід періоду повернення.' },
  { id: 'outflow', direction: 'out', pattern: '.', class: 'outflow', effect: 'not_income', reason: 'Списання — не дохід платника ЄП.' },
  { id: 'own-transfer', direction: 'in', pattern: '(між власними рахунками|власн\\p{L}* рахун|з власної картки|своїх рахунків|own account|between own accounts|поповнення власного)', self: true, class: 'own_transfer', effect: 'not_income', reason: 'Власні кошти, а не надходження від іншої особи — не дохід (ПКУ 292.1).' },
  { id: 'fx-sale', direction: 'in', pattern: '((продаж|купівл|обмін|конвертац)\\p{L}*\\s+(\\S+\\s+)?валют|currency exchange|продаж (usd|eur|pln)|обов.язков\\p{L}* продаж)', class: 'fx_conversion', effect: 'not_income', reason: 'Гривня від продажу власної валюти: дохід визнано в день надходження валюти за курсом НБУ (ПКУ 292.5), повторно не враховується.' },
  { id: 'tax-refund', direction: 'in', pattern: '(повернення\\s+(надміру|помилково)\\s+сплачен|повернення (єдиного податку|єсв|єп|військового збору))', class: 'tax_refund', effect: 'not_income', reason: 'Повернення надміру сплачених податків і ЄСВ не є доходом (ПКУ 292.11 п. 9).' },
  { id: 'loan', direction: 'in', pattern: '(кредит(?!ов\\p{L}* картк)|позик|поворотн\\p{L}* фінансов\\p{L}* допомог|loan)', class: 'loan', effect: 'not_income', review: true, reason: 'Кредит або поворотна фінансова допомога не є доходом за умови повернення протягом 12 місяців (ПКУ 292.11 п. 3) — контролюйте строк повернення.' },
  { id: 'supplier-refund', direction: 'in', pattern: '(повернення коштів|повернення платежу|повернення оплати|refund|reversal|скасування операції|відміна операції)', class: 'refund_in', effect: 'not_income', review: true, reason: 'Повернення раніше сплачених вами коштів — не дохід; переконайтеся, що це не оплата від покупця.' },
  { id: 'grant', direction: 'in', pattern: '(грант|єробота|erobota)', class: 'grant', effect: 'not_income', review: true, reason: 'Бюджетні гранти не включаються до доходу ФОП (ПКУ 292.1 п. 1) — підтвердіть джерело.' },
  { id: 'interest', direction: 'in', pattern: '(відсотк\\p{L}* на залишок|нарахування відсотків|відсотки за депозит|проценти|interest)', class: 'passive_interest', effect: 'not_income', reason: 'Пасивні доходи у вигляді процентів не включаються до доходу ФОП (ПКУ 292.1 п. 1).' },
  { id: 'cashback', direction: 'in', pattern: '(кешбек|кешбэк|cashback|бонус банку)', class: 'cashback', effect: 'review', review: true, reason: '[Unverified] Класифікація кешбеку для ФОП не перевірена — вирішіть з бухгалтером.' },
  { id: 'acquiring', direction: 'in', pattern: '(еквайр|acquiring|liqpay|wayforpay|fondy|portmone|platon|novapay|нова пошта|накладен\\p{L}* платіж|післяплат|plata by mono|monopay|mono pay|інтернет-еквайринг)', class: 'income_acquiring', effect: 'income', review: true, reason: 'Дохід від покупців через еквайринг/післяплату. [Unverified] Доходом вважається повна сума, сплачена покупцем: якщо банк зарахував суму за мінусом комісії — додайте комісію.' },
  { id: 'default-income', direction: 'in', pattern: '.', class: 'income', effect: 'income', reason: 'Надходження від іншої особи — дохід на дату зарахування (ПКУ 292.1, 292.6).' },
];

// ---------- parsing helpers ----------
export function parseCsv(text, delimiter) {
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c;
    } else if (c === '"') q = true;
    else if (c === delimiter) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim() !== ''));
}
export function parseAmount(raw, decimal) {
  if (raw === undefined || raw === null) return null;
  let s = String(raw).trim().replace(/[\s  ']/g, '').replace(/(uah|грн|₴)$/i, '');
  if (s === '' || s === '-') return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (s.startsWith('-')) { neg = !neg; s = s.slice(1); } else if (s.startsWith('+')) s = s.slice(1);
  const dec = decimal || (s.includes(',') && s.includes('.') ? (s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.') : (s.includes(',') ? ',' : '.'));
  const thousands = dec === ',' ? '.' : ',';
  s = s.split(thousands).join('').replace(dec, '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const [i, f = ''] = s.split('.');
  const kop = Number(i) * 100 + Number((f + '00').slice(0, 2)) + (f.length > 2 && Number(f[2]) >= 5 ? 1 : 0);
  return neg ? -kop : kop;
}
export function parseDate(raw, order = 'dmy') {
  const s = String(raw || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (!m) return null;
  let [a, b, y] = [Number(m[1]), Number(m[2]), m[3]];
  if (y.length === 2) y = `20${y}`;
  const [d, mo] = order === 'mdy' ? [b, a] : [a, b];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
const kyivDate = (unixSeconds) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(unixSeconds * 1000));
const ISO_CURRENCY = { 980: 'UAH', 840: 'USD', 978: 'EUR', 985: 'PLN', 826: 'GBP' };

// ---------- header mapping ----------
export function parseMap(str) {
  const out = {};
  for (const part of String(str || '').split(',')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}
export function mapHeader(header, overrides = {}) {
  const lower = header.map((h) => h.trim().toLowerCase().replace(/^﻿/, ''));
  const map = {};
  for (const [field, names] of Object.entries(HEADER_CANDIDATES)) {
    for (const n of names) { const i = lower.indexOf(n); if (i >= 0 && !Object.values(map).includes(i)) { map[field] = i; break; } }
  }
  for (const [field, name] of Object.entries(overrides)) {
    const i = lower.indexOf(name.toLowerCase());
    if (i < 0) throw new Error(`--map: column "${name}" not found in header: ${header.join(' | ')}`);
    map[field] = i;
  }
  if (map.date === undefined) throw new Error(`No date column found. Header: ${header.join(' | ')}. Use --map date=<column>.`);
  if (map.amount === undefined && map.credit === undefined) throw new Error(`No amount or credit column found. Header: ${header.join(' | ')}. Use --map amount=<column> or credit=/debit=.`);
  return map;
}
function findHeaderRow(rows, overrides) {
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    try { return { index: i, map: mapHeader(rows[i], overrides) }; } catch { /* try next row */ }
  }
  return { index: 0, map: mapHeader(rows[0], overrides) };
}

// ---------- readers → canonical rows ----------
export function readCsvText(text, { map = {}, delimiter, decimal, dateOrder = 'dmy', source = 'csv' } = {}) {
  const clean = text.replace(/^﻿/, '');
  // Pick the delimiter whose parse yields a recognisable header with the most mapped fields
  // (decimal commas and commas inside descriptions make naive counting unreliable).
  let best = null; let lastErr;
  for (const d of delimiter ? [delimiter] : [';', ',', '\t']) {
    const rows = parseCsv(clean, d);
    try {
      const h = findHeaderRow(rows, map);
      const score = Object.keys(h.map).length;
      if (!best || score > best.score) best = { d, rows, ...h, score };
    } catch (e) { lastErr = e; }
  }
  if (!best) throw lastErr;
  const { d, rows, index, map: cols } = best;
  // "Сума в валюті картки (UAH)": the amount column names its own currency; a separate "Валюта" column then
  // describes the operation currency, not the amount, so it must not be used for conversion.
  const headerCurrency = cols.amount !== undefined ? (rows[index][cols.amount].match(/(([A-Z]{3}))/) || [])[1] : undefined;
  const out = [];
  for (const r of rows.slice(index + 1)) {
    const get = (f) => (cols[f] === undefined ? '' : (r[cols[f]] ?? '').trim());
    const date = parseDate(get('date'), dateOrder);
    if (!date) continue; // totals/footer lines
    let amount = cols.amount !== undefined ? parseAmount(get('amount'), decimal) : null;
    if (amount === null && (cols.credit !== undefined || cols.debit !== undefined)) {
      const cr = parseAmount(get('credit'), decimal) || 0; const db = parseAmount(get('debit'), decimal) || 0;
      amount = Math.abs(cr) - Math.abs(db);
    }
    if (amount === null || amount === 0) continue;
    const currency = headerCurrency || (get('currency') || 'UAH').toUpperCase().replace('ГРН', 'UAH');
    out.push({ source, id: get('id'), date, amount, currency, uah: cols.uah !== undefined ? parseAmount(get('uah'), decimal) : null,
      description: get('description'), comment: get('comment'), counterparty: get('counterparty'), counterpartyId: get('counterpartyId'), counterpartyIban: get('counterpartyIban') });
  }
  const mapping = Object.fromEntries(Object.entries(cols).map(([k, i]) => [k, rows[index][i]]));
  if (headerCurrency) mapping.currency = `${headerCurrency} (з назви колонки суми)`;
  return { rows: out, mapping, delimiter: d };
}
export function readMonoApi(json, source = 'mono-api') {
  const items = Array.isArray(json) ? json : json.items || json.statement || [];
  return { rows: items.filter((x) => !x.hold).map((x) => ({
    source, id: x.id || '', date: kyivDate(x.time), amount: x.amount, currency: ISO_CURRENCY[x.currencyCode] || String(x.currencyCode || 'UAH'), uah: null,
    description: x.description || '', comment: x.comment || '', counterparty: x.counterName || '', counterpartyId: x.counterEdrpou || '', counterpartyIban: x.counterIban || '',
  })), mapping: { format: 'monobank API StatementItem (amount in kopecks, time in unix seconds)' }, delimiter: null };
}

// ---------- classification ----------
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
export function classify(row, { rules = DEFAULT_RULES, self = '', selfId = '' } = {}) {
  const dir = row.amount > 0 ? 'in' : 'out';
  const text = norm(`${row.description} ${row.comment} ${row.counterparty}`);
  const selfName = norm(self);
  const isSelf = (selfId && row.counterpartyId && row.counterpartyId.replace(/\D/g, '') === String(selfId).replace(/\D/g, ''))
    || (selfName && norm(row.counterparty).includes(selfName));
  for (const r of rules) {
    if (r.direction !== 'any' && r.direction !== dir) continue;
    if (r.self && isSelf) return { rule: r.id, class: r.class, effect: r.effect, review: !!r.review, reason: `${r.reason} (контрагент — ви самі)` };
    if (new RegExp(r.pattern, 'iu').test(text)) return { rule: r.id, class: r.class, effect: r.effect, review: !!r.review, reason: r.reason };
  }
  return { rule: 'none', class: 'unclassified', effect: 'review', review: true, reason: 'Жодне правило не спрацювало.' };
}

// ---------- totals ----------
export const quarterOf = (date) => `${date.slice(0, 4)}-Q${Math.floor((Number(date.slice(5, 7)) - 1) / 3) + 1}`;
export function buildLedger(rows, { rules, self, selfId, rates = {} } = {}) {
  const ledger = rows.map((r) => {
    let uah = r.currency === 'UAH' ? r.amount : r.uah;
    let fxNote = '';
    if (r.currency !== 'UAH' && uah == null) {
      const rate = rates?.[r.currency]?.[r.date];
      if (rate) { uah = Math.round(r.amount * rate); fxNote = `Курс НБУ ${rate} на ${r.date} (ПКУ 292.5).`; }
    }
    const c = classify(r, { rules, self, selfId });
    const needsRate = uah == null && c.effect !== 'not_income'; // FX rate matters only for income, reductions and undecided rows
    return { ...r, quarter: quarterOf(r.date), uahAmount: uah ?? null, needsRate, ...c,
      review: c.review || needsRate, reason: needsRate ? `${c.reason} Потрібен офіційний курс НБУ на дату надходження (ПКУ 292.5) — додайте --rates.` : `${c.reason}${fxNote ? ` ${fxNote}` : ''}` };
  }).sort((a, b) => a.date.localeCompare(b.date));

  const months = aggregate(ledger, (r) => r.date.slice(0, 7)); // ПКУ 296.1: income is recorded by month
  const quarters = aggregate(ledger, (r) => r.quarter);
  const years = {};
  for (const [k, t] of Object.entries(quarters)) {
    const y = (years[k.slice(0, 4)] ||= { income: 0, reductions: 0, net: 0, notIncome: 0, review: 0, pendingFx: 0 });
    for (const f of ['income', 'reductions', 'notIncome', 'review', 'pendingFx']) y[f] += t[f];
    y.net = y.income - y.reductions;
  }
  return { ledger, months, quarters, years };
}
function aggregate(ledger, keyOf) {
  const out = {};
  for (const r of ledger) {
    const t = (out[keyOf(r)] ||= { income: 0, reductions: 0, net: 0, notIncome: 0, review: 0, pendingFx: 0, rows: 0 });
    t.rows++;
    if (r.uahAmount == null) { if (r.needsRate) t.pendingFx++; continue; }
    if (r.effect === 'income') t.income += r.uahAmount;
    else if (r.effect === 'reduce') t.reductions += Math.abs(r.uahAmount);
    else if (r.effect === 'review') t.review += Math.abs(r.uahAmount);
    else if (r.amount > 0) t.notIncome += r.uahAmount;
  }
  const ytd = {};
  for (const k of Object.keys(out).sort()) {
    const t = out[k]; t.net = t.income - t.reductions;
    ytd[k.slice(0, 4)] = (ytd[k.slice(0, 4)] || 0) + t.net; t.ytdNet = ytd[k.slice(0, 4)];
  }
  return Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));
}
export function limitWarnings(years, data, group) {
  const warns = [];
  for (const [yr, t] of Object.entries(years)) {
    const y = data?.years?.[yr];
    if (!y) { warns.push(`Немає ставок і лімітів на ${yr} у fop-rates.json — ліміт не перевірено.`); continue; }
    const limit = Math.round(y.singleTax[`group${group}`].incomeLimit * 100);
    const pct = Math.round((t.net / limit) * 1000) / 10;
    const level = pct >= 100 ? 'ПЕРЕВИЩЕНО' : pct >= 90 ? 'понад 90 %' : pct >= 80 ? 'понад 80 %' : null;
    warns.push(`${yr}: дохід ${fmtUah(t.net)} грн = ${pct} % ліміту групи ${group} (${fmtUah(limit)} грн)${level ? ` — ${level}` : ''}. Нерозглянуті надходження: ${fmtUah(t.review)} грн; без курсу: ${t.pendingFx} опер.`);
  }
  return warns;
}
export const fmtUah = (kop) => {
  const sign = kop < 0 ? '-' : ''; const a = Math.abs(kop);
  return `${sign}${Math.floor(a / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${String(a % 100).padStart(2, '0')}`;
};

// ---------- output ----------
const csvCell = (v) => { const s = v == null ? '' : String(v); return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const num = (kop) => (kop == null ? '' : (kop / 100).toFixed(2).replace('.', ','));
export function ledgerToCsv(ledger) {
  const head = ['date', 'quarter', 'direction', 'amount_uah', 'currency', 'amount_original', 'description', 'counterparty', 'counterparty_id', 'class', 'effect', 'rule', 'review', 'reason', 'source'];
  const lines = [head.join(';')];
  for (const r of ledger) lines.push([r.date, r.quarter, r.amount > 0 ? 'in' : 'out', num(r.uahAmount), r.currency, num(r.amount), r.description, r.counterparty, r.counterpartyId, r.class, r.effect, r.rule, r.review ? 'yes' : '', r.reason, r.source].map(csvCell).join(';'));
  return '﻿' + lines.join('\r\n') + '\r\n';
}
export function summaryText({ months = {}, quarters, years }, mappingInfo, warns) {
  const L = ['Місяць    Дохід          Зменшення    Чистий дохід   З поч. року'];
  for (const [k, t] of Object.entries(months)) L.push(`${k}   ${fmtUah(t.income).padStart(13)}  ${fmtUah(t.reductions).padStart(11)}  ${fmtUah(t.net).padStart(13)}  ${fmtUah(t.ytdNet).padStart(13)}`);
  L.push('', 'Квартал   Дохід          Зменшення    Чистий дохід   З поч. року    Не дохід       На розгляді');
  for (const [k, t] of Object.entries(quarters).sort()) {
    L.push(`${k}  ${fmtUah(t.income).padStart(13)}  ${fmtUah(t.reductions).padStart(11)}  ${fmtUah(t.net).padStart(13)}  ${fmtUah(t.ytdNet).padStart(13)}  ${fmtUah(t.notIncome).padStart(13)}  ${fmtUah(t.review).padStart(11)}${t.pendingFx ? `  (без курсу: ${t.pendingFx})` : ''}`);
  }
  for (const [yr, t] of Object.entries(years)) L.push(`Рік ${yr}: дохід ${fmtUah(t.net)} грн (надходження ${fmtUah(t.income)} − повернення покупцям ${fmtUah(t.reductions)}).`);
  for (const m of mappingInfo) L.push(`Колонки (${m.source}): ${JSON.stringify(m.mapping)}`);
  for (const w of warns) L.push(`! ${w}`);
  L.push('Дата доходу — дата зарахування коштів (ПКУ 292.6); облік ведеться у довільній формі помісячно (ПКУ 296.1). Рядки з review=yes перевірте вручну.');
  L.push(VERIFY_LINE);
  return L.join('\n');
}

// ---------- CLI ----------
export function parseArgs(argv) {
  const o = { in: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2); const v = argv[i + 1];
    const val = v === undefined || v.startsWith('--') ? true : (i++, v);
    if (k === 'in') o.in.push(val); else o[k] = val;
  }
  return o;
}
export function run(argv = process.argv.slice(2)) {
  const o = parseArgs(argv);
  if (!o.in.length) throw new Error('give at least one --in <statement.csv|statement.json>');
  const rules = o.rules ? [...JSON.parse(readFileSync(resolve(o.rules), 'utf8')), ...DEFAULT_RULES] : DEFAULT_RULES;
  const rates = o.rates ? JSON.parse(readFileSync(resolve(o.rates), 'utf8')) : {};
  const all = []; const mappingInfo = [];
  for (const file of o.in) {
    const text = readFileSync(resolve(file), 'utf8');
    const isJson = o.preset === 'mono-api' || extname(file).toLowerCase() === '.json';
    const res = isJson ? readMonoApi(JSON.parse(text), file) : readCsvText(text, { map: parseMap(o.map), delimiter: o.delimiter, decimal: o.decimal, dateOrder: o['date-order'] || 'dmy', source: file });
    all.push(...res.rows); mappingInfo.push({ source: file, mapping: res.mapping });
  }
  const result = buildLedger(all, { rules, self: o.self || '', selfId: o['self-id'] || '', rates });
  let warns = [];
  if (o.group) {
    const data = JSON.parse(readFileSync(o.data ? resolve(o.data) : DEFAULT_DATA, 'utf8'));
    if (!['1', '2', '3'].includes(String(o.group))) throw new Error('--group must be 1, 2 or 3');
    warns = limitWarnings(o.year ? { [o.year]: result.years[o.year] || { net: 0, review: 0, pendingFx: 0 } } : result.years, data, String(o.group));
  }
  if (o.out) {
    const out = resolve(o.out);
    if (extname(out).toLowerCase() === '.json') writeFileSync(out, JSON.stringify({ generated: new Date().toISOString(), inputs: o.in, mapping: mappingInfo, months: result.months, quarters: result.quarters, years: result.years, warnings: warns, rows: result.ledger, verify: VERIFY_LINE }, null, 2), 'utf8');
    else writeFileSync(out, ledgerToCsv(result.ledger), 'utf8');
  }
  if (o.json) return JSON.stringify({ mapping: mappingInfo, months: result.months, quarters: result.quarters, years: result.years, warnings: warns, rows: result.ledger, verify: VERIFY_LINE }, null, 2);
  return summaryText(result, mappingInfo, warns) + (o.out ? `\nФайл: ${resolve(o.out)}` : '');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(run()); } catch (e) { console.error(`income-ledger: ${e.message}`); process.exit(1); }
}
