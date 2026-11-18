#!/usr/bin/env node
// metrics — engagement rates and group summaries from a CSV export of social posts. Zero dependencies, Node 18+.
//
// Usage: node metrics.mjs <posts.csv> [--by pillar|platform|format|month] [--top 3] [--json] [--out report.md|report.json]
// Input: one row per post; header names are case-insensitive, extra columns are ignored; comma or semicolon
// delimiter (auto-detected; Excel with a Ukrainian locale exports ";"); numbers may use spaces for thousands
// and a decimal comma ("12 500", "4,5").
//   required: date (YYYY-MM-DD), platform, and reach or views
//   optional: id (or url), pillar, format, views, likes, comments, shares, saves, clicks, followers
// Per post: interactions = likes + comments + shares + saves; base = reach (or views when reach is empty);
//   er = interactions / base · save_rate, share_rate, comment_rate = x / base · ctr = clicks / base ·
//   err = views / followers (Telegram-style views per subscriber, when both are present).
// Groups use pooled rates (sum of interactions / sum of base) plus the median post ER.
// Exit: 0 ok · 2 usage or input error.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export class InputError extends Error {}
const fail = (m) => { throw new InputError(m); };

export function parseCsv(text) {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0];
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field === '') quoted = true;
    else if (ch === delim) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return { delim, rows };
}

export function parseNumber(v, decimalComma) {
  const s = String(v ?? '').replace(/[\s  ]/g, '');
  if (s === '') return null;
  const normal = decimalComma ? s.replace(',', '.') : s.replace(/,/g, '');
  const n = Number(normal);
  if (!Number.isFinite(n) || n < 0) fail(`Not a non-negative number: "${v}"`);
  return n;
}

const ALIASES = { id: ['id', 'post_id', 'url', 'link'], date: ['date', 'published', 'дата'], platform: ['platform', 'платформа'], pillar: ['pillar', 'рубрика'], format: ['format', 'формат'] };
const NUMERIC = ['reach', 'views', 'likes', 'comments', 'shares', 'saves', 'clicks', 'followers'];

export function readPosts(text) {
  const { delim, rows } = parseCsv(text);
  if (rows.length < 2) fail('CSV needs a header row and at least one post');
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (names) => header.findIndex((h) => names.includes(h));
  const idx = Object.fromEntries([...Object.entries(ALIASES).map(([k, names]) => [k, col(names)]), ...NUMERIC.map((k) => [k, col([k])])]);
  if (idx.date < 0 || idx.platform < 0) fail('CSV needs "date" and "platform" columns');
  if (idx.reach < 0 && idx.views < 0) fail('CSV needs a "reach" or "views" column');
  const posts = [];
  const skipped = [];
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (k) => (idx[k] >= 0 ? (r[idx[k]] ?? '').trim() : '');
    const date = get('date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`Line ${line}: date "${date}" is not YYYY-MM-DD`);
    const n = {};
    for (const k of NUMERIC) {
      try { n[k] = idx[k] >= 0 ? parseNumber(r[idx[k]], delim === ';') : null; } catch (e) { fail(`Line ${line}, ${k}: ${e.message}`); }
    }
    const base = n.reach > 0 ? n.reach : n.views > 0 ? n.views : null;
    if (!base) { skipped.push(`line ${line}: no reach or views`); return; }
    const interactions = (n.likes || 0) + (n.comments || 0) + (n.shares || 0) + (n.saves || 0);
    posts.push({
      id: get('id') || `line-${line}`, date, month: date.slice(0, 7), platform: get('platform').toLowerCase(),
      pillar: get('pillar') || '—', format: get('format') || '—', base, baseKind: n.reach > 0 ? 'reach' : 'views',
      ...n, interactions,
      er: interactions / base,
      save_rate: (n.saves || 0) / base, share_rate: (n.shares || 0) / base, comment_rate: (n.comments || 0) / base,
      ctr: n.clicks === null ? null : n.clicks / base,
      err: n.views !== null && n.followers > 0 ? n.views / n.followers : null,
    });
  });
  return { posts, skipped };
}

export const median = (xs) => {
  const a = xs.filter((x) => x !== null).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};

export function summarise(posts, by = 'pillar', top = 3) {
  if (!['pillar', 'platform', 'format', 'month'].includes(by)) fail(`--by must be pillar, platform, format or month (got ${by})`);
  const groups = new Map();
  for (const p of posts) groups.set(p[by], [...(groups.get(p[by]) || []), p]);
  const sum = (list, k) => list.reduce((s, p) => s + (p[k] || 0), 0);
  const rows = [...groups.entries()].map(([key, list]) => {
    const base = sum(list, 'base');
    return {
      [by]: key, posts: list.length, base,
      er: sum(list, 'interactions') / base,
      median_er: median(list.map((p) => p.er)),
      save_rate: sum(list, 'saves') / base,
      share_rate: sum(list, 'shares') / base,
      median_err: median(list.map((p) => p.err)),
    };
  }).sort((a, b) => b.er - a.er);
  const ranked = [...posts].sort((a, b) => b.er - a.er);
  return { by, groups: rows, top: ranked.slice(0, top), bottom: ranked.slice(-top).reverse() };
}

const pct = (x) => (x === null || x === undefined ? '—' : `${(x * 100).toFixed(2)} %`);
const num = (x) => (x === null || x === undefined ? '—' : x.toFixed(2));

export function toMarkdown(report) {
  const { by, groups, top, bottom } = report.summary;
  const lines = [`# Social metrics: ${report.posts} posts${report.skipped.length ? ` (${report.skipped.length} skipped)` : ''}`, ''];
  lines.push(`| ${by} | posts | base | ER (pooled) | median ER | save rate | share rate | median ERR |`, '|---|---|---|---|---|---|---|---|');
  for (const g of groups) lines.push(`| ${g[by]} | ${g.posts} | ${g.base} | ${pct(g.er)} | ${pct(g.median_er)} | ${pct(g.save_rate)} | ${pct(g.share_rate)} | ${num(g.median_err)} |`);
  const list = (title, ps) => {
    lines.push('', `## ${title}`, '| id | date | platform | pillar | format | ER | saves | shares |', '|---|---|---|---|---|---|---|---|');
    for (const p of ps) lines.push(`| ${p.id} | ${p.date} | ${p.platform} | ${p.pillar} | ${p.format} | ${pct(p.er)} | ${p.saves ?? '—'} | ${p.shares ?? '—'} |`);
  };
  list('Top posts by ER', top);
  list('Bottom posts by ER', bottom);
  lines.push('', 'ER = (likes + comments + shares + saves) / reach (views when reach is missing). ERR = views / followers.');
  if (report.skipped.length) lines.push('', `Skipped: ${report.skipped.join('; ')}`);
  return `${lines.join('\n')}\n`;
}

export function parseArgs(argv) {
  const o = { by: 'pillar', top: 3, json: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') return { help: true };
    if (a === '--json') { o.json = true; continue; }
    if (['--by', '--top', '--out'].includes(a)) {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) fail(`${a} needs a value`);
      o[a.slice(2)] = a === '--top' ? Number(v) : v;
      i++;
      continue;
    }
    if (a.startsWith('--')) fail(`Unknown option ${a}`);
    positional.push(a);
  }
  if (positional.length !== 1) fail('Usage: node metrics.mjs <posts.csv> [--by pillar|platform|format|month] [--top 3] [--json] [--out file]');
  if (!(Number.isInteger(o.top) && o.top >= 1 && o.top <= 20)) fail('--top must be an integer 1–20');
  return { opts: { ...o, file: positional[0] } };
}

function main() {
  try {
    const parsed = parseArgs(process.argv.slice(2));
    if (parsed.help) { console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 15).join('\n')); return; }
    const o = parsed.opts;
    let text;
    try { text = readFileSync(o.file, 'utf8'); } catch { fail(`File not found: ${o.file}`); }
    const { posts, skipped } = readPosts(text);
    if (!posts.length) fail('No posts with reach or views');
    const report = { posts: posts.length, skipped, summary: summarise(posts, o.by, o.top) };
    const asJson = o.json || (o.out && o.out.endsWith('.json'));
    const out = asJson ? `${JSON.stringify(report, null, 2)}\n` : toMarkdown(report);
    if (o.out) { mkdirSync(dirname(resolve(o.out)), { recursive: true }); writeFileSync(resolve(o.out), out); console.log(JSON.stringify({ ok: true, out: resolve(o.out), posts: posts.length, skipped: skipped.length })); }
    else process.stdout.write(out);
  } catch (e) {
    if (e instanceof InputError) { console.error(`metrics: ${e.message}`); process.exit(2); }
    throw e;
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) main();
