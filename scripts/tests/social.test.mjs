// Tests for social component scripts. Run: node --test scripts/tests/social.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as cal from '../calendar.mjs';
import * as met from '../metrics.mjs';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = JSON.parse(readFileSync(cal.DEFAULT_HOLIDAYS, 'utf8'));
const tmp = () => mkdtempSync(join(tmpdir(), 'social-test-'));
const run = (script, args, env = process.env) => spawnSync(process.execPath, [join(SCRIPTS, script), ...args], { encoding: 'utf8', env, cwd: tmp() });
const base = { start: '2027-01-04', end: '2027-01-31', pillars: 'Користь:40,Продукт:30,Спільнота:20,Промо:10', cadence: 'instagram:3' };

// ---------- holidays ----------
test('holiday data: source, check date and the Article 73 list', () => {
  assert.match(DATA.sourceUrl, /^https:\/\/zakon\.rada\.gov\.ua\/laws\/show\/322-08$/);
  assert.match(DATA.checked, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(DATA.martialLaw.sourceUrl, /2136-20/);
  assert.deepEqual(DATA.fixed.map((h) => h.date), ['01-01', '03-08', '05-01', '05-08', '06-28', '07-15', '08-24', '10-01', '12-25']);
  assert.deepEqual(DATA.movable.map((h) => h.offsetDays), [0, 49]);
});

test('orthodoxEaster matches known dates', () => {
  const known = { 2023: '2023-04-16', 2024: '2024-05-05', 2025: '2025-04-20', 2026: '2026-04-12', 2027: '2027-05-02', 2028: '2028-04-16', 2030: '2030-04-28' };
  for (const [y, d] of Object.entries(known)) assert.equal(cal.orthodoxEaster(Number(y)), d, y);
  assert.throws(() => cal.orthodoxEaster(2100), RangeError);
});

test('holidaysInRange: full year 2027 incl. Easter and Trinity, English names', () => {
  const h = cal.holidaysInRange(DATA, cal.parseDate('2027-01-01'), cal.parseDate('2027-12-31'));
  assert.equal(h.length, 11);
  assert.ok(h.find((x) => x.date === '2027-05-02' && /Великдень/.test(x.name)));
  assert.ok(h.find((x) => x.date === '2027-06-20' && x.name === 'Трійця'));
  assert.ok(h.find((x) => x.date === '2027-05-08' && x.tone === 'memorial'));
  const en = cal.holidaysInRange(DATA, cal.parseDate('2026-12-24'), cal.parseDate('2027-01-02'), 'en');
  assert.deepEqual(en.map((x) => x.name), ['Christmas Day', "New Year's Day"]);
});

// ---------- parsing ----------
test('parsePillars: weights, defaults, errors', () => {
  assert.deepEqual(cal.parsePillars('A:3, B'), [{ name: 'A', weight: 3 }, { name: 'B', weight: 1 }]);
  assert.throws(() => cal.parsePillars(''), cal.UsageError);
  assert.throws(() => cal.parsePillars('A:0'), /weight > 0/);
  assert.throws(() => cal.parsePillars('A,A'), /Duplicate/);
});

test('parseCadence: spreads, day lists, ranges, times and errors', () => {
  const c = cal.parseCadence('instagram:3,telegram:5@mon-fri#09:00,stories:daily,linkedin@tue+thu#08:30', '19:00');
  assert.deepEqual(c[0], { platform: 'instagram', days: [0, 2, 4], time: '19:00' });
  assert.deepEqual(c[1], { platform: 'telegram', days: [0, 1, 2, 3, 4], time: '09:00' });
  assert.deepEqual(c[2].days, [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(c[3], { platform: 'linkedin', days: [1, 3], time: '08:30' });
  assert.throws(() => cal.parseCadence('instagram:8'), /1–7/);
  assert.throws(() => cal.parseCadence('instagram:2@mon+wed+fri'), /2 per week but 3 days/);
  assert.throws(() => cal.parseCadence('instagram:3#25:00'), /Bad time/);
  assert.throws(() => cal.parseCadence('instagram:3,instagram:2'), /twice/);
  assert.throws(() => cal.parseCadence('instagram@fri-mon'), /Bad day range/);
  assert.throws(() => cal.parseCadence('instagram'), /posts per week/);
});

test('pillar picker tracks weights exactly over a full cycle', () => {
  const pick = cal.makePillarPicker(cal.parsePillars('A:40,B:30,C:20,D:10'));
  const counts = {};
  for (let i = 0; i < 100; i++) { const p = pick(); counts[p] = (counts[p] || 0) + 1; }
  assert.deepEqual(counts, { A: 40, B: 30, C: 20, D: 10 });
});

// ---------- building ----------
test('buildCalendar: cadence per week, formats rotate, holidays as rows', () => {
  const { rows, summary } = cal.buildCalendar({ ...base, cadence: 'instagram:3,telegram:5@mon-fri#09:00', holidaysData: DATA });
  assert.equal(summary.byPlatform.instagram, 12); // 4 full weeks × 3
  assert.equal(summary.byPlatform.telegram, 20);
  const ig = rows.filter((r) => r.platform === 'instagram').map((r) => r.format);
  assert.deepEqual(ig.slice(0, 4), ['reel', 'carousel', 'post', 'reel']);
  assert.ok(rows.every((r) => !r.platform || ['пн', 'ср', 'пт', 'вт', 'чт'].includes(r.weekday)));
  const { rows: jan } = cal.buildCalendar({ ...base, start: '2027-01-01', end: '2027-01-03', cadence: 'instagram:daily', holidaysData: DATA });
  assert.equal(jan[0].format, 'holiday');
  assert.equal(jan[0].topic, 'Новий рік');
  assert.match(jan[1].notes, /Свято: Новий рік/);
});

test('buildCalendar: promo pillar on a memorial day is flagged', () => {
  const { summary, rows } = cal.buildCalendar({ ...base, start: '2027-05-08', end: '2027-05-08', pillars: 'Промо', cadence: 'instagram:daily', holidaysData: DATA });
  assert.equal(summary.warnings.length, 1);
  assert.match(summary.warnings[0], /memorial day/);
  assert.match(rows.find((r) => r.platform).notes, /без промо/);
});

test('buildCalendar: extra dates, no-holiday mode and validation', () => {
  const extra = cal.parseExtra(JSON.stringify([{ date: '2027-01-15', name: 'День народження бренду', note: 'розіграш' }, { date: '2028-01-01', name: 'out of range' }]));
  const { rows, summary } = cal.buildCalendar({ ...base, extra });
  assert.equal(summary.extra, 1);
  assert.ok(rows.find((r) => r.format === 'occasion' && r.topic === 'День народження бренду' && r.notes === 'розіграш'));
  assert.equal(cal.buildCalendar({ ...base, start: '2027-01-01', end: '2027-01-01', cadence: 'instagram:daily' }).rows.length, 1);
  assert.throws(() => cal.buildCalendar({ ...base, start: '2027-02-30' }), /Bad --start/);
  assert.throws(() => cal.buildCalendar({ ...base, start: '2027-02-01', end: '2027-01-01' }), /before/);
  assert.throws(() => cal.buildCalendar({ ...base, start: '2026-01-01', end: '2028-12-31' }), /maximum/);
  assert.throws(() => cal.parseExtra('[{"date":"2027-13-01","name":"x"}]'), /valid "date"/);
  assert.throws(() => cal.parseExtra('{oops'), /not valid JSON/);
  const early = cal.buildCalendar({ ...base, start: '2023-12-25', end: '2024-01-07', holidaysData: DATA });
  assert.match(early.summary.warnings[0], /valid from 2024-01-01/);
});

// ---------- output ----------
test('toCsv: BOM, CRLF, escaping and formula guard', () => {
  const csv = cal.toCsv([{ date: '2027-01-04', weekday: 'пн', time: '10:00', platform: 'instagram', format: 'post', pillar: 'Користь', topic: 'Кава, чай і "смаки"', hook: '=HYPERLINK("x")', cta: '', status: 'draft', notes: 'a\nb' }]);
  assert.ok(csv.startsWith('﻿date,weekday,time,platform'));
  assert.ok(csv.endsWith('\r\n'));
  assert.match(csv, /"Кава, чай і ""смаки"""/);
  assert.match(csv, /"'=HYPERLINK\(""x""\)"/);
  assert.match(csv, /"a\nb"/);
  assert.ok(!cal.toCsv([], false).startsWith('﻿'));
});

test('toIcs: structure, CRLF, folding ≤ 75 octets, escaping, all-day holidays, floating time', () => {
  const { rows } = cal.buildCalendar({ ...base, start: '2026-12-24', end: '2026-12-26', cadence: 'instagram:daily#19:00', pillars: 'Дуже довга назва рубрики про каву та чай; і все інше на світі', holidaysData: DATA });
  const ics = cal.toIcs(rows, { stamp: new Date('2026-11-12T10:00:00Z') });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, rows.length);
  assert.equal((ics.match(/END:VEVENT/g) || []).length, rows.length);
  assert.match(ics, /DTSTART;TZID=Europe\/Kyiv:20261224T190000/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261225\r\nDTEND;VALUE=DATE:20261226/);
  assert.match(ics, /DTSTAMP:20261112T100000Z/);
  assert.match(ics, /BEGIN:VTIMEZONE/);
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, `line too long: ${line}`);
  const unfolded = ics.replace(/\r\n /g, '');
  assert.match(unfolded, /CATEGORIES:Дуже довга назва рубрики про каву та чай\\; і все інше на світі/);
  assert.equal(cal.icsEscape('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
  const floating = cal.toIcs(rows, { tz: 'floating' });
  assert.match(floating, /DTSTART:20261224T190000/);
  assert.doesNotMatch(floating, /VTIMEZONE/);
  assert.throws(() => cal.toIcs(rows, { tz: 'Europe/Warsaw' }), /--tz/);
});

test('foldLine never splits a multi-byte character', () => {
  const line = `SUMMARY:${'Їжак ґанок '.repeat(20)}`;
  const folded = cal.foldLine(line);
  assert.equal(folded.replace(/\r\n /g, ''), line);
  for (const part of folded.split('\r\n')) assert.ok(Buffer.byteLength(part) <= 75);
});

// ---------- CLI ----------
test('calendar CLI: writes CSV and ICS with a JSON summary', () => {
  const dir = tmp();
  const extra = join(dir, 'extra.json');
  writeFileSync(extra, JSON.stringify([{ date: '2027-01-15', name: 'Розпродаж' }]));
  const r = run('calendar.mjs', ['--start', '2027-01-04', '--end', '2027-01-17', '--pillars', 'A:1,B:1', '--cadence', 'telegram:5@mon-fri#09:00', '--csv', join(dir, 'c.csv'), '--ics', join(dir, 'c.ics'), '--extra', extra]);
  assert.equal(r.status, 0, r.stderr);
  const s = JSON.parse(r.stdout);
  assert.equal(s.posts, 10);
  assert.equal(s.files.length, 2);
  assert.match(readFileSync(join(dir, 'c.csv'), 'utf8'), /Розпродаж/);
  assert.match(readFileSync(join(dir, 'c.ics'), 'utf8'), /BEGIN:VCALENDAR/);
});

test('calendar CLI: stdout mode and usage errors exit 2', () => {
  const ok = run('calendar.mjs', ['--start', '2027-01-04', '--end', '2027-01-10', '--pillars', 'A', '--cadence', 'tiktok:2', '--no-holidays', '--lang', 'en', '--no-bom']);
  assert.equal(ok.status, 0, ok.stderr);
  assert.ok(ok.stdout.startsWith('date,weekday'));
  assert.match(ok.stdout, /Tue,10:00,tiktok,video,A/);
  assert.equal(JSON.parse(ok.stderr).posts, 2);
  assert.equal(run('calendar.mjs', []).status, 2);
  assert.equal(run('calendar.mjs', ['--start', '2027-01-04', '--end', '2027-01-10', '--pillars', 'A', '--cadence', 'x:9']).status, 2);
  assert.equal(run('calendar.mjs', ['--start', '2027-01-04', '--end', '2027-01-10', '--pillars', 'A', '--cadence', 'x:1', '--bogus', '1']).status, 2);
  assert.equal(run('calendar.mjs', ['--start', '2027-01-04', '--end', '2027-01-10', '--pillars', 'A', '--cadence', 'x:1', '--extra', join(tmp(), 'none.json')]).status, 2);
  assert.equal(run('calendar.mjs', ['--start', '2027-01-04', '--end', '2027-01-10', '--pillars', 'A', '--cadence', 'x:1', '--tz', 'UTC']).status, 2);
});

// ---------- metrics ----------
const SAMPLE = [
  'id,date,platform,pillar,format,reach,views,likes,comments,shares,saves,clicks,followers',
  'p1,2026-11-02,instagram,Користь,carousel,1000,,50,10,20,20,5,',
  'p2,2026-11-04,instagram,Промо,reel,2000,,20,0,0,0,40,',
  'p3,2026-11-05,telegram,Користь,post,,900,10,5,5,0,,1500',
  'p4,2026-11-06,instagram,Користь,post,,,1,0,0,0,,',
].join('\r\n');

test('metrics parseCsv: BOM, quotes, CRLF and semicolon delimiter', () => {
  const { delim, rows } = met.parseCsv('﻿a,b\r\n"x, ""y""",2\r\n');
  assert.equal(delim, ',');
  assert.deepEqual(rows, [['a', 'b'], ['x, "y"', '2']]);
  const semi = met.parseCsv('date;reach\n2026-11-01;"12 500"\n');
  assert.equal(semi.delim, ';');
  assert.equal(met.parseNumber('12 500', true), 12500);
  assert.equal(met.parseNumber('4,5', true), 4.5);
  assert.equal(met.parseNumber('1,200', false), 1200);
  assert.equal(met.parseNumber('', false), null);
  assert.throws(() => met.parseNumber('-3', false), met.InputError);
});

test('metrics readPosts: rates per post, views fallback, ERR, skipped rows', () => {
  const { posts, skipped } = met.readPosts(SAMPLE);
  assert.equal(posts.length, 3);
  assert.deepEqual(skipped, ['line 5: no reach or views']);
  const p1 = posts.find((p) => p.id === 'p1');
  assert.equal(p1.interactions, 100);
  assert.equal(p1.er, 0.1);
  assert.equal(p1.save_rate, 0.02);
  assert.equal(p1.ctr, 0.005);
  const p3 = posts.find((p) => p.id === 'p3');
  assert.equal(p3.baseKind, 'views');
  assert.equal(p3.er, 20 / 900);
  assert.equal(p3.err, 0.6);
  assert.throws(() => met.readPosts('date,platform\n2026-11-01,instagram\n'), /reach" or "views/);
  assert.throws(() => met.readPosts('date,platform,reach\n01.11.2026,instagram,10\n'), /YYYY-MM-DD/);
});

test('metrics summarise: pooled rates, medians, ranking', () => {
  const { posts } = met.readPosts(SAMPLE);
  const s = met.summarise(posts, 'pillar', 2);
  const kor = s.groups.find((g) => g.pillar === 'Користь');
  assert.equal(kor.posts, 2);
  assert.equal(kor.base, 1900);
  assert.equal(kor.er, 120 / 1900);
  assert.equal(kor.median_er, (0.1 + 20 / 900) / 2);
  assert.equal(s.groups[0].pillar, 'Користь');
  assert.equal(s.top[0].id, 'p1');
  assert.equal(s.bottom[0].id, 'p2');
  assert.equal(met.median([3, 1, 2]), 2);
  assert.equal(met.median([null]), null);
  assert.throws(() => met.summarise(posts, 'colour'), /--by/);
  const md = met.toMarkdown({ posts: 3, skipped: [], summary: s });
  assert.match(md, /\| Користь \| 2 \| 1900 \| 6\.32 % \|/);
});

test('metrics CLI: markdown to stdout, JSON file, usage errors exit 2', () => {
  const dir = tmp();
  const f = join(dir, 'posts.csv');
  writeFileSync(f, SAMPLE);
  const md = run('metrics.mjs', [f, '--by', 'platform']);
  assert.equal(md.status, 0, md.stderr);
  assert.match(md.stdout, /\| instagram \| 2 \|/);
  const out = join(dir, 'r', 'report.json');
  const js = run('metrics.mjs', [f, '--out', out]);
  assert.equal(js.status, 0, js.stderr);
  assert.equal(JSON.parse(readFileSync(out, 'utf8')).posts, 3);
  assert.equal(run('metrics.mjs', []).status, 2);
  assert.equal(run('metrics.mjs', [join(dir, 'none.csv')]).status, 2);
  assert.equal(run('metrics.mjs', [f, '--top', '0']).status, 2);
  assert.equal(run('metrics.mjs', [f, '--by', 'colour']).status, 2);
});
