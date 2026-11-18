#!/usr/bin/env node
// calendar — builds a dated content calendar (CSV for sheets, ICS for calendar apps) from content pillars,
// per-platform cadence and a date range, with Ukrainian public holidays from scripts/data/ua-holidays.json.
// Zero dependencies, Node 18+.
//
// Usage:
//   node calendar.mjs --start 2026-12-01 --end 2027-02-28 \
//     --pillars "Користь:40,Продукт:30,Спільнота:20,Промо:10" \
//     --cadence "instagram:3,telegram:5@mon-fri#09:00,tiktok:4#18:30,stories:daily" \
//     --csv deliverables/social/calendar.csv --ics deliverables/social/calendar.ics
// Cadence item: <platform>:<N per week 1-7 | daily>[@<days>][#HH:MM]  — days: mon+wed+fri or mon-fri.
// Options: --time 10:00 (default time) · --formats "instagram=reel+carousel" (rotation) · --extra dates.json
//          ([{ "date": "2026-12-12", "name": "...", "note": "..." }]) · --no-holidays · --holidays <file>
//          --lang uk|en (weekday and holiday names) · --tz Europe/Kyiv|floating (ICS) · --no-bom · --name "<calendar name>"
// Without --csv/--ics the CSV goes to stdout and the JSON summary to stderr. Exit: 0 ok · 2 usage error.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_HOLIDAYS = join(HERE, 'data', 'ua-holidays.json');
export const MAX_DAYS = 731;

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const WEEKDAY = { uk: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
// Evenly spread default posting days for N posts per week (index into DAY_KEYS).
export const SPREAD = { 1: [1], 2: [1, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
export const DEFAULT_FORMATS = {
  instagram: ['reel', 'carousel', 'post'],
  facebook: ['post', 'reel'],
  tiktok: ['video'],
  telegram: ['post'],
  threads: ['text'],
  linkedin: ['post', 'carousel'],
  'youtube-shorts': ['short'],
  youtube: ['short'],
  stories: ['stories'],
};
const PROMO = /промо|promo|sale|знижк|розпродаж|акці/i;

export class UsageError extends Error {}
const usage = (m) => { throw new UsageError(m); };

// ---------- dates (UTC arithmetic on YYYY-MM-DD) ----------
export function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return new Date(t).toISOString().slice(0, 10) === s ? t : null;
}
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const addDays = (t, n) => t + n * 86400000;
const weekdayIndex = (t) => (new Date(t).getUTCDay() + 6) % 7; // 0 = Monday

// Orthodox Easter (Julian computus, Meeus) converted to the Gregorian calendar; valid 1900–2099.
export function orthodoxEaster(year) {
  if (!(year >= 1900 && year <= 2099)) throw new RangeError('orthodoxEaster supports 1900–2099');
  const a = year % 4, b = year % 7, c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return iso(addDays(Date.UTC(year, month - 1, day), 13));
}

export function holidaysInRange(data, startT, endT, lang = 'uk') {
  const out = [];
  const name = (h) => (lang === 'en' && h.nameEn ? h.nameEn : h.name);
  for (let y = new Date(startT).getUTCFullYear(); y <= new Date(endT).getUTCFullYear(); y++) {
    for (const h of data.fixed || []) {
      const t = parseDate(`${y}-${h.date}`);
      if (t !== null && t >= startT && t <= endT) out.push({ date: iso(t), name: name(h), tone: h.tone || '' });
    }
    for (const h of data.movable || []) {
      if (h.rule !== 'orthodox-easter') continue;
      const t = addDays(parseDate(orthodoxEaster(y)), h.offsetDays || 0);
      if (t >= startT && t <= endT) out.push({ date: iso(t), name: name(h), tone: h.tone || '' });
    }
  }
  return out.sort((x, y) => x.date.localeCompare(y.date));
}

// ---------- parsing ----------
export function parsePillars(text) {
  if (!text || !String(text).trim()) usage('--pillars is required, e.g. "Користь:40,Продукт:30,Промо:10"');
  const items = String(text).split(',').map((s) => s.trim()).filter(Boolean).map((part) => {
    const m = /^([^:]+?)(?::\s*(\d+(?:\.\d+)?))?$/.exec(part);
    if (!m) usage(`Bad pillar "${part}" (expected Name or Name:weight)`);
    const weight = m[2] === undefined ? 1 : Number(m[2]);
    if (!(weight > 0)) usage(`Pillar "${m[1]}" needs a weight > 0`);
    return { name: m[1].trim(), weight };
  });
  const names = new Set();
  for (const p of items) { if (names.has(p.name)) usage(`Duplicate pillar "${p.name}"`); names.add(p.name); }
  return items;
}

function parseDays(text) {
  const out = new Set();
  for (const part of text.toLowerCase().split('+')) {
    const r = /^([a-z]{3})(?:-([a-z]{3}))?$/.exec(part.trim());
    if (!r || !DAY_KEYS.includes(r[1]) || (r[2] && !DAY_KEYS.includes(r[2]))) usage(`Bad day list "${text}" (use mon+wed+fri or mon-fri)`);
    const a = DAY_KEYS.indexOf(r[1]);
    const b = r[2] ? DAY_KEYS.indexOf(r[2]) : a;
    if (b < a) usage(`Bad day range "${part}"`);
    for (let i = a; i <= b; i++) out.add(i);
  }
  return [...out].sort((x, y) => x - y);
}

export function parseTime(t) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(t));
  if (!m) usage(`Bad time "${t}" (HH:MM, 00:00–23:59)`);
  return t;
}

export function parseCadence(text, defaultTime = '10:00') {
  if (!text || !String(text).trim()) usage('--cadence is required, e.g. "instagram:3,telegram:5@mon-fri#09:00"');
  const seen = new Set();
  return String(text).split(',').map((s) => s.trim()).filter(Boolean).map((item) => {
    const m = /^([a-z0-9-]+)(?::(daily|\d+))?(?:@([a-z+-]+))?(?:#(\d{2}:\d{2}))?$/i.exec(item);
    if (!m) usage(`Bad cadence item "${item}" (expected platform:N[@days][#HH:MM])`);
    const platform = m[1].toLowerCase();
    if (seen.has(platform)) usage(`Platform "${platform}" listed twice in --cadence`);
    seen.add(platform);
    let days = m[3] ? parseDays(m[3]) : null;
    let n = m[2] === undefined ? null : m[2].toLowerCase() === 'daily' ? 7 : Number(m[2]);
    if (n === null && !days) usage(`"${item}": give posts per week (platform:3) or days (platform@mon+thu)`);
    if (n !== null && !(n >= 1 && n <= 7)) usage(`"${item}": posts per week must be 1–7 or daily`);
    if (days && n !== null && days.length !== n) usage(`"${item}": ${n} per week but ${days.length} days listed`);
    if (!days) days = SPREAD[n];
    return { platform, days, time: parseTime(m[4] || defaultTime) };
  });
}

export function parseFormats(text) {
  const out = {};
  if (!text) return out;
  for (const part of String(text).split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = /^([a-z0-9-]+)=([a-z0-9+_-]+)$/i.exec(part);
    if (!m) usage(`Bad --formats item "${part}" (expected platform=fmt1+fmt2)`);
    out[m[1].toLowerCase()] = m[2].split('+').filter(Boolean);
  }
  return out;
}

export function parseExtra(json) {
  let list;
  try { list = JSON.parse(json); } catch (e) { usage(`--extra is not valid JSON: ${e.message}`); }
  if (!Array.isArray(list)) usage('--extra must be a JSON array of { "date": "YYYY-MM-DD", "name": "...", "note": "..." }');
  return list.map((x, i) => {
    if (parseDate(x && x.date) === null || !x.name) usage(`--extra item ${i + 1} needs a valid "date" (YYYY-MM-DD) and a "name"`);
    return { date: x.date, name: String(x.name), note: x.note ? String(x.note) : '' };
  });
}

// ---------- building ----------
// Smooth weighted round-robin: over any window the counts track the weights as closely as integers allow.
export function makePillarPicker(pillars) {
  const total = pillars.reduce((s, p) => s + p.weight, 0);
  const current = pillars.map(() => 0);
  return () => {
    let best = 0;
    for (let i = 0; i < pillars.length; i++) {
      current[i] += pillars[i].weight;
      if (current[i] > current[best]) best = i;
    }
    current[best] -= total;
    return pillars[best].name;
  };
}

export function buildCalendar(o) {
  const startT = parseDate(o.start);
  const endT = parseDate(o.end);
  if (startT === null) usage(`Bad --start "${o.start}" (YYYY-MM-DD)`);
  if (endT === null) usage(`Bad --end "${o.end}" (YYYY-MM-DD)`);
  if (endT < startT) usage('--end is before --start');
  const span = (endT - startT) / 86400000 + 1;
  if (span > MAX_DAYS) usage(`Range is ${span} days; maximum ${MAX_DAYS}`);
  const lang = o.lang || 'uk';
  const pillars = parsePillars(o.pillars);
  const cadence = parseCadence(o.cadence, o.time || '10:00');
  const formats = { ...DEFAULT_FORMATS, ...parseFormats(o.formats) };
  const warnings = [];
  const holidays = o.holidaysData ? holidaysInRange(o.holidaysData, startT, endT, lang) : [];
  if (o.holidaysData && o.holidaysData.validFrom && startT < parseDate(o.holidaysData.validFrom)) {
    warnings.push(`Holiday data is valid from ${o.holidaysData.validFrom}; earlier dates may have had other holidays`);
  }
  const extra = (o.extra || []).filter((x) => { const t = parseDate(x.date); return t >= startT && t <= endT; });
  const occasions = new Map();
  for (const h of holidays) occasions.set(h.date, [...(occasions.get(h.date) || []), { kind: 'holiday', ...h }]);
  for (const x of extra) occasions.set(x.date, [...(occasions.get(x.date) || []), { kind: 'extra', ...x }]);
  const toneNote = (tone) => (o.holidaysData && o.holidaysData.tones && o.holidaysData.tones[tone]) || '';

  const pickers = Object.fromEntries(cadence.map((c) => [c.platform, makePillarPicker(pillars)]));
  const formatIdx = Object.fromEntries(cadence.map((c) => [c.platform, 0]));
  const rows = [];
  for (let t = startT; t <= endT; t = addDays(t, 1)) {
    const date = iso(t);
    const wd = weekdayIndex(t);
    for (const occ of occasions.get(date) || []) {
      rows.push({ date, weekday: WEEKDAY[lang][wd], time: '', platform: '', format: occ.kind === 'holiday' ? 'holiday' : 'occasion', pillar: '', topic: occ.name, hook: '', cta: '', status: '', notes: occ.kind === 'holiday' ? [toneNote(occ.tone), 'Державне свято (ст. 73 КЗпП); під час воєнного стану — робочий день'].filter(Boolean).join(' ') : occ.note });
    }
    const dayHolidays = (occasions.get(date) || []).filter((x) => x.kind === 'holiday');
    for (const c of cadence) {
      if (!c.days.includes(wd)) continue;
      const list = formats[c.platform] || ['post'];
      const format = list[formatIdx[c.platform]++ % list.length];
      const pillar = pickers[c.platform]();
      const notes = dayHolidays.map((h) => `Свято: ${h.name}`);
      if (dayHolidays.some((h) => h.tone === 'memorial') && PROMO.test(pillar)) {
        warnings.push(`${date} ${c.platform}: pillar "${pillar}" falls on a memorial day — replace with a non-promotional post`);
        notes.push('День пам’яті: без промо');
      }
      rows.push({ date, weekday: WEEKDAY[lang][wd], time: c.time, platform: c.platform, format, pillar, topic: '', hook: '', cta: '', status: 'draft', notes: notes.join('; ') });
    }
  }
  rows.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  const posts = rows.filter((r) => r.platform);
  const count = (key) => posts.reduce((m, r) => ({ ...m, [r[key]]: (m[r[key]] || 0) + 1 }), {});
  return { rows, summary: { start: o.start, end: o.end, days: span, posts: posts.length, byPlatform: count('platform'), byPillar: count('pillar'), holidays, extra: extra.length, warnings } };
}

// ---------- output ----------
export const CSV_COLUMNS = ['date', 'weekday', 'time', 'platform', 'format', 'pillar', 'topic', 'hook', 'cta', 'status', 'notes'];

export function csvField(v) {
  let s = String(v ?? '');
  if (/^[=+@]/.test(s)) s = `'${s}`; // keep spreadsheets from evaluating user text as formulas
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows, bom = true) {
  const lines = [CSV_COLUMNS.join(','), ...rows.map((r) => CSV_COLUMNS.map((c) => csvField(r[c])).join(','))];
  return `${bom ? '\uFEFF' : ''}${lines.join('\r\n')}\r\n`;
}

export function icsEscape(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

// Folds a content line to ≤ 75 octets per physical line (RFC 5545 §3.1) without splitting UTF-8 sequences.
export function foldLine(line) {
  const out = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    const limit = out.length ? 74 : 75;
    if (bytes + b > limit) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const VTIMEZONE_KYIV = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Kyiv',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0300', 'TZNAME:EEST', 'DTSTART:19700329T030000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0300', 'TZOFFSETTO:+0200', 'TZNAME:EET', 'DTSTART:19701025T040000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

export function toIcs(rows, { tz = 'Europe/Kyiv', name = 'Контент-календар', stamp = new Date() } = {}) {
  if (!['Europe/Kyiv', 'floating'].includes(tz)) usage(`--tz must be Europe/Kyiv or floating (got ${tz})`);
  const dtstamp = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const compact = (d) => d.replace(/-/g, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Perfect Hub//social calendar//UK', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${icsEscape(name)}`];
  if (tz !== 'floating') lines.push(`X-WR-TIMEZONE:${tz}`, ...VTIMEZONE_KYIV);
  const seq = {};
  for (const r of rows) {
    const key = `${r.date}-${r.platform || r.format}`;
    seq[key] = (seq[key] || 0) + 1;
    const uid = `${compact(r.date)}-${(r.platform || r.format).replace(/[^a-z0-9-]/gi, '')}-${seq[key]}@perfect-social`;
    lines.push('BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${dtstamp}`);
    if (!r.platform) {
      const next = iso(addDays(parseDate(r.date), 1));
      lines.push(`DTSTART;VALUE=DATE:${compact(r.date)}`, `DTEND;VALUE=DATE:${compact(next)}`, 'TRANSP:TRANSPARENT', `SUMMARY:${icsEscape(r.topic)}`);
    } else {
      const start = `${compact(r.date)}T${r.time.replace(':', '')}00`;
      lines.push(tz === 'floating' ? `DTSTART:${start}` : `DTSTART;TZID=${tz}:${start}`, 'DURATION:PT30M', `SUMMARY:${icsEscape(`${r.platform} · ${r.format} · ${r.pillar}`)}`, `CATEGORIES:${icsEscape(r.pillar)}`, 'STATUS:TENTATIVE');
    }
    const desc = [r.topic && `Тема: ${r.topic}`, r.hook && `Хук: ${r.hook}`, r.cta && `CTA: ${r.cta}`, r.notes].filter(Boolean).join('\n');
    if (desc) lines.push(`DESCRIPTION:${icsEscape(desc)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

// ---------- CLI ----------
export function parseArgs(argv) {
  const o = { holidays: true, bom: true };
  const valued = new Set(['start', 'end', 'pillars', 'cadence', 'csv', 'ics', 'time', 'formats', 'extra', 'holidays-file', 'lang', 'tz', 'name']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') return { help: true };
    if (a === '--no-holidays') { o.holidays = false; continue; }
    if (a === '--no-bom') { o.bom = false; continue; }
    const key = a.startsWith('--') ? a.slice(2) : null;
    const k = key === 'holidays' ? 'holidays-file' : key;
    if (!k || !valued.has(k)) usage(`Unknown argument "${a}"`);
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) usage(`${a} needs a value`);
    o[k] = v;
    i++;
  }
  if (!o.start || !o.end) usage('--start and --end are required (YYYY-MM-DD)');
  if (o.lang && !['uk', 'en'].includes(o.lang)) usage('--lang must be uk or en');
  if (o.tz && !['Europe/Kyiv', 'floating'].includes(o.tz)) usage(`--tz must be Europe/Kyiv or floating (got ${o.tz})`);
  return { opts: o };
}

function main() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
    if (parsed.help) {
      console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 18).join('\n'));
      return;
    }
    const o = parsed.opts;
    const readText = (p, what) => { try { return readFileSync(p, 'utf8'); } catch { return usage(`${what} not found: ${p}`); } };
    const holidaysData = o.holidays ? JSON.parse(readText(o['holidays-file'] || DEFAULT_HOLIDAYS, 'Holiday data')) : null;
    const extra = o.extra ? parseExtra(readText(o.extra, '--extra file')) : [];
    if (o.time) parseTime(o.time);
    const { rows, summary } = buildCalendar({ ...o, holidaysData, extra });
    const files = [];
    const write = (p, text) => { const full = resolve(p); mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, text); files.push(full); };
    if (o.csv) write(o.csv, toCsv(rows, o.bom));
    if (o.ics) write(o.ics, toIcs(rows, { tz: o.tz || 'Europe/Kyiv', name: o.name || 'Контент-календар' }));
    const report = JSON.stringify({ ok: true, ...summary, holidaySource: holidaysData ? holidaysData.sourceUrl : null, files }, null, 2);
    if (!o.csv && !o.ics) { process.stdout.write(toCsv(rows, o.bom)); console.error(report); } else console.log(report);
  } catch (e) {
    if (e instanceof UsageError || e instanceof SyntaxError) {
      console.error(`calendar: ${e.message}`);
      process.exit(2);
    }
    throw e;
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) main();
