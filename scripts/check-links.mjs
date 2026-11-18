#!/usr/bin/env node
// check-links — finds rotten links in Perfect Hub's reference library (sites move: godly.website → recent.design).
// Usage: node scripts/check-links.mjs [file.md ...]   (default: every references/*.md, README.md, rules/AGENTS.md)
// Picks up full URLs and bare domains (`site.com/path`, **site.com**). API/MCP endpoints are skipped — they answer 401/405 by design.
// Classes: ok · redirect (same host) · moved (permanent redirect to another host) · blocked (401/403/429/451: bot walls) · dead (404/410) · error.
// Exit 1 when anything is dead or moved, else 0. Needs Node 18+ (global fetch).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const URL_RE = /https?:\/\/[^\s)`"'<>|]+/g;
const BARE_RE = /(?<![\w@./-])((?:[a-z0-9-]+\.)+(?:com|io|design|build|co|ai|dev|net|org|app|ninja|wtf|it|fr|gallery|me)(?:\/[A-Za-z0-9._~/-]*)?)(?![\w-])/g;
const FILE_EXT = /\.(md|js|mjs|cjs|json|ts|tsx|jsx|css|html|png|svg|jpg|jpeg|webp|py|txt)$/i;

function defaultFiles() {
  const out = ['README.md', 'rules/AGENTS.md'].map((f) => join(ROOT, f));
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (/[\\/]references[\\/][^\\/]+\.md$/.test(p)) out.push(p);
    }
  };
  walk(join(ROOT, 'skills'));
  return out;
}

const files = process.argv.slice(2).length ? process.argv.slice(2) : defaultFiles();
const urls = new Map();
const skipped = new Set();

function add(raw, rel) {
  const url = raw.replace(/[.,;:]+$/, '');
  if (/[{}<>[\]]|\.\.\.|…|example\.com|=$/.test(url)) return; // templates and placeholders
  let u;
  try { u = new URL(url); } catch { return; }
  if (/^(api|mcp)\./.test(u.hostname) || /\/mcp\/?$/.test(u.pathname)) { skipped.add(url); return; }
  const key = u.href.replace(/\/$/, '');
  if (!urls.has(key)) urls.set(key, rel);
}

for (const f of files) {
  const text = readFileSync(f, 'utf8');
  const rel = f.replace(ROOT, '').replace(/^[\\/]/, '');
  for (const m of text.matchAll(URL_RE)) add(m[0], rel);
  for (const m of text.matchAll(BARE_RE)) if (!FILE_EXT.test(m[1])) add(`https://${m[1]}`, rel);
}

async function check(url) {
  const attempt = (method) => fetch(url, { method, redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,application/json;q=0.9,*/*;q=0.8' }, signal: AbortSignal.timeout(15000) });
  try {
    let r;
    try { r = await attempt('HEAD'); } catch { r = await attempt('GET'); }
    if ([400, 403, 405, 501].includes(r.status)) r = await attempt('GET');
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get('location') || '';
      const target = loc ? new URL(loc, url).href : '';
      const strip = (h) => h.replace(/^www\./, '');
      const otherHost = target && strip(new URL(target).host) !== strip(new URL(url).host);
      return { status: otherHost && [301, 308].includes(r.status) ? 'moved' : 'redirect', code: r.status, target };
    }
    if (r.ok) return { status: 'ok', code: r.status };
    if ([401, 403, 429, 451].includes(r.status)) return { status: 'blocked', code: r.status };
    if ([404, 410].includes(r.status)) return { status: 'dead', code: r.status };
    return { status: 'error', code: r.status };
  } catch (e) {
    return { status: 'error', code: 0, error: e.name === 'TimeoutError' ? 'timeout' : e.cause?.code || e.message };
  }
}

const list = [...urls.keys()];
const results = [];
let next = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < list.length) {
    const url = list[next++];
    results.push({ url, file: urls.get(url), ...(await check(url)) });
  }
}));

const order = { dead: 0, moved: 1, error: 2, blocked: 3, redirect: 4, ok: 5 };
results.sort((a, b) => order[a.status] - order[b.status] || a.url.localeCompare(b.url));
for (const r of results) {
  if (r.status === 'ok') continue;
  console.log(`${r.status.toUpperCase().padEnd(8)} ${String(r.code).padStart(3)}  ${r.url}${r.target ? `  →  ${r.target}` : ''}${r.error ? `  (${r.error})` : ''}  [${r.file}]`);
}
const count = (s) => results.filter((r) => r.status === s).length;
console.log(`check-links: ${results.length} URLs (skipped ${skipped.size} API/MCP endpoints) · ok ${count('ok')} · redirect ${count('redirect')} · moved ${count('moved')} · blocked ${count('blocked')} · dead ${count('dead')} · error ${count('error')}`);
process.exit(count('dead') + count('moved') ? 1 : 0);
