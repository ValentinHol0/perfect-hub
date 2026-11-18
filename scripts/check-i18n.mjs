#!/usr/bin/env node
// check-i18n — compare a source locale file with its translation. Zero dependencies, Node >= 18.
// Formats: JSON (nested or flat; i18next v21+ plural suffixes _one/_few/_many/_other; ICU MessageFormat values)
//          and gettext .po/.pot (basic: msgctxt, msgid_plural, msgstr[n], fuzzy, Plural-Forms header).
// Plural categories come from CLDR via the runtime's Intl.PluralRules (Node ships full ICU since v13).
//
// Usage: node check-i18n.mjs <source> <target> [options]
//   --source-locale <tag>     default: inferred from the path or .po header, else "en"
//   --target-locale <tag>     default: inferred from the path or .po header (required if not inferable)
//   --allow-identical <list>  comma-separated keys or globs (nav.*) allowed to equal the source
//   --max-ratio <n>           flat length-ratio ceiling instead of the W3C/IBM expansion bands
//   --min-ratio <n>           length-ratio floor for possible omissions (default 0.33)
//   --json                    machine-readable report
//   --strict                  treat warnings as errors
// Exit: 0 = no errors · 1 = errors (or warnings with --strict) · 2 = usage or unreadable input.

import { readFileSync } from 'node:fs';
import { basename, dirname, extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const CATEGORY_ORDER = ['zero', 'one', 'two', 'few', 'many', 'other'];
const PLURAL_SUFFIX = /^(.*)_(ordinal_)?(zero|one|two|few|many|other)$/;

// ---------- locales and CLDR plural data ----------
export function canonicalLocale(tag) {
  if (!tag) return null;
  try { return Intl.getCanonicalLocales(String(tag).replace(/_/g, '-'))[0]; } catch { return null; }
}

export function languageOf(tag) {
  try { return new Intl.Locale(tag).language; } catch { return String(tag).split(/[-_]/)[0].toLowerCase(); }
}

export function pluralCategories(locale, type = 'cardinal') {
  const cats = new Intl.PluralRules(locale, { type }).resolvedOptions().pluralCategories;
  return CATEGORY_ORDER.filter((c) => cats.includes(c));
}

// Integer examples per category (0..200) plus one fraction — used in messages and the "count needed" rule.
export function categoryExamples(locale, type = 'cardinal') {
  const pr = new Intl.PluralRules(locale, { type });
  const out = {};
  for (let n = 0; n <= 200; n++) (out[pr.select(n)] ||= []).push(n);
  const frac = pr.select(1.5);
  (out[frac] ||= []);
  if (type === 'cardinal' && !out[frac].includes(1.5)) out[frac].push(1.5);
  return out;
}

export function inferLocale(filePath) {
  const base = basename(filePath, extname(filePath));
  const candidates = [...base.split('.').reverse(), ...base.split(/[._]/).reverse(), ...dirname(resolve(filePath)).split(sep).reverse().slice(0, 3)];
  for (const c of candidates) {
    if (!/^[a-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/.test(c)) continue;
    const tag = canonicalLocale(c);
    // reject alias remaps (a folder "src" canonicalises to Sardinian "sc")
    if (tag && languageOf(tag) === c.split(/[-_]/)[0] && Intl.PluralRules.supportedLocalesOf([tag]).length) return tag;
  }
  return null;
}

// ---------- ICU MessageFormat (subset parser: arguments, plural/selectordinal/select, quoting) ----------
export class IcuError extends Error {}

export function looksIcu(s) {
  return typeof s === 'string' && /\{\s*[\w.-]+\s*,\s*(plural|selectordinal|select)\s*,/.test(s);
}

export function parseIcu(src) {
  let i = 0;
  const fail = (m) => { throw new IcuError(`${m} at position ${i}`); };
  const skipWs = () => { while (i < src.length && /\s/.test(src[i])) i++; };

  function parseMessage(inPlural, depth) {
    const nodes = [];
    let text = '';
    const flush = () => { if (text) nodes.push({ type: 'text', value: text }); text = ''; };
    while (i < src.length) {
      const c = src[i];
      if (c === "'") {
        const n = src[i + 1];
        if (n === "'") { text += "'"; i += 2; continue; }
        if (n === '{' || n === '}' || n === '|' || (inPlural && n === '#')) {
          i++;
          while (i < src.length) {
            if (src[i] === "'") { if (src[i + 1] === "'") { text += "'"; i += 2; continue; } i++; break; }
            text += src[i++];
          }
          continue;
        }
        text += c; i++; continue;
      }
      if (c === '{') { flush(); nodes.push(parseArgument(inPlural, depth)); continue; }
      if (c === '}') { if (depth === 0) fail('unmatched "}"'); break; }
      if (c === '#' && inPlural) { flush(); nodes.push({ type: 'pound' }); i++; continue; }
      text += c; i++;
    }
    flush();
    return nodes;
  }

  function parseArgument(inPlural, depth) {
    i++; skipWs();
    const start = i;
    while (i < src.length && !/[\s,{}]/.test(src[i])) i++;
    const name = src.slice(start, i);
    if (!name) fail('empty argument name');
    skipWs();
    if (src[i] === '}') { i++; return { type: 'arg', name }; }
    if (src[i] !== ',') fail(`expected "," or "}" after "${name}"`);
    i++; skipWs();
    const ks = i;
    while (i < src.length && /[A-Za-z]/.test(src[i])) i++;
    const kind = src.slice(ks, i);
    if (!kind) fail(`missing argument type for "${name}"`);
    skipWs();
    if (src[i] === '}') { i++; return { type: 'arg', name, kind }; }
    if (src[i] !== ',') fail(`expected "," after type "${kind}"`);
    i++;
    if (kind === 'plural' || kind === 'selectordinal' || kind === 'select') {
      const options = [];
      let offset = 0;
      for (;;) {
        skipWs();
        if (i >= src.length) fail(`unterminated ${kind} argument "${name}"`);
        if (src[i] === '}') { i++; break; }
        const ss = i;
        while (i < src.length && !/[\s{}]/.test(src[i])) i++;
        let sel = src.slice(ss, i);
        if (sel.startsWith('offset:')) {
          let v = sel.slice(7);
          if (!v) { skipWs(); const vs = i; while (i < src.length && /\d/.test(src[i])) i++; v = src.slice(vs, i); }
          offset = Number(v);
          continue;
        }
        if (!sel) fail(`missing selector in "${name}"`);
        skipWs();
        if (src[i] !== '{') fail(`expected "{" after selector "${sel}"`);
        i++;
        const message = parseMessage(kind !== 'select' || inPlural, depth + 1);
        if (src[i] !== '}') fail(`unterminated branch "${sel}"`);
        i++;
        options.push({ selector: sel, message });
      }
      if (!options.length) fail(`${kind} "${name}" has no branches`);
      return { type: kind, name, offset, options };
    }
    let style = '';
    let d = 0;
    while (i < src.length) {
      const ch = src[i];
      if (ch === '{') d++;
      else if (ch === '}') { if (d === 0) break; d--; }
      style += ch; i++;
    }
    if (src[i] !== '}') fail(`unterminated argument "${name}"`);
    i++;
    return { type: 'arg', name, kind, style: style.trim() };
  }

  const ast = parseMessage(false, 0);
  if (i < src.length) fail('unexpected "}"');
  return ast;
}

// Walk an ICU AST: collect argument names (with "#" resolved to its plural argument), text, and complex args.
export function icuInfo(ast) {
  const names = new Set();
  const complex = [];
  const texts = [];
  const walk = (nodes, pluralName) => {
    for (const n of nodes) {
      if (n.type === 'text') texts.push(n.value);
      else if (n.type === 'pound') { if (pluralName) names.add(pluralName); }
      else if (n.type === 'arg') names.add(n.name);
      else {
        names.add(n.name);
        complex.push(n);
        for (const o of n.options) walk(o.message, n.type === 'select' ? pluralName : n.name);
      }
    }
  };
  walk(ast, null);
  return { names, complex, text: texts.join(' ') };
}

function branchMentions(message, argName) {
  let found = false;
  const walk = (nodes, pluralName) => {
    for (const n of nodes) {
      if (n.type === 'pound' && pluralName === argName) found = true;
      else if (n.type === 'arg' && n.name === argName) found = true;
      else if (n.options) for (const o of n.options) walk(o.message, n.type === 'select' ? pluralName : n.name);
    }
  };
  walk(message, argName);
  return found;
}

// ---------- placeholders, tags, printf ----------
const RE_I18NEXT = /\{\{\s*-?\s*([^{}\s,]+)(?:\s*,[^{}]*)?\s*\}\}/g;
const RE_ICU_SIMPLE = /(?<!\{)\{\s*([A-Za-z_$][\w.$-]*)\s*(?:,[^{}]*)?\}(?!\})/g;
const RE_RUBY = /%\{\s*(\w+)\s*\}/g;
const RE_PRINTF = /%(?:(\d+)\$|\((\w+)\))?[-+#0']*(?:\d+|\*)?(?:\.(?:\d+|\*))?(?:hh|h|ll|l|L|q|j|z|t)?([sdifuxXoeEgGcp@])/g;
const RE_TAG = /<\/?([A-Za-z][\w:-]*|\d+)(?:\s[^<>]*)?\/?>/g;

export function extractPlaceholders(str) {
  const s = String(str ?? '');
  const named = [];
  const ordered = [];
  const tags = [];
  for (const m of s.matchAll(RE_I18NEXT)) named.push(`{{${m[1]}}}`);
  const noDouble = s.replace(RE_I18NEXT, ' ');
  for (const m of noDouble.matchAll(RE_RUBY)) named.push(`%{${m[1]}}`);
  for (const m of noDouble.replace(RE_RUBY, ' ').matchAll(RE_ICU_SIMPLE)) named.push(`{${m[1]}}`);
  for (const m of s.replace(/%%/g, '').matchAll(RE_PRINTF)) {
    if (m[1]) named.push(`%${m[1]}$${m[3]}`);
    else if (m[2]) named.push(`%(${m[2]})${m[3]}`);
    else ordered.push(`%${m[3]}`);
  }
  for (const m of s.matchAll(RE_TAG)) {
    const closing = m[0].startsWith('</');
    const selfClosing = /\/>$/.test(m[0]);
    tags.push(closing ? `</${m[1]}>` : selfClosing ? `<${m[1]}/>` : `<${m[1]}>`);
  }
  return { named, ordered, tags };
}

function stripMarkup(s) {
  return String(s ?? '')
    .replace(RE_I18NEXT, '')
    .replace(RE_RUBY, '')
    .replace(RE_ICU_SIMPLE, '')
    .replace(/%%/g, '%')
    .replace(RE_PRINTF, '')
    .replace(RE_TAG, '')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ');
}

const multiset = (arr) => arr.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
function multisetDiff(a, b) {
  const ma = multiset(a);
  const mb = multiset(b);
  const missing = [];
  const extra = [];
  for (const [k, n] of ma) for (let j = (mb.get(k) || 0); j < n; j++) missing.push(k);
  for (const [k, n] of mb) for (let j = (ma.get(k) || 0); j < n; j++) extra.push(k);
  return { missing, extra };
}

// ---------- loaders ----------
export function flattenJson(obj, prefix = '', out = new Map()) {
  if (obj !== null && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) flattenJson(v, prefix ? `${prefix}.${k}` : k, out);
  } else out.set(prefix, obj);
  return out;
}

function unescapePo(s) {
  return s.replace(/\\(n|t|r|"|\\|a|b|f|v)/g, (_, c) => ({ n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\', a: '\x07', b: '\b', f: '\f', v: '\v' }[c]));
}

export function parsePo(text) {
  const entries = [];
  let cur = null;
  let field = null;
  const start = () => { cur = { ctx: null, id: null, idPlural: null, str: null, strPlural: [], flags: new Set(), obsolete: false }; field = null; };
  const finish = () => { if (cur && cur.id !== null) entries.push(cur); cur = null; field = null; };
  const append = (f, val) => {
    if (f.startsWith('msgstr[')) { const n = Number(f.slice(7, -1)); cur.strPlural[n] = (cur.strPlural[n] || '') + val; }
    else if (f === 'msgctxt') cur.ctx = (cur.ctx || '') + val;
    else if (f === 'msgid') cur.id = (cur.id || '') + val;
    else if (f === 'msgid_plural') cur.idPlural = (cur.idPlural || '') + val;
    else if (f === 'msgstr') cur.str = (cur.str || '') + val;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { if (cur && cur.id !== null && (cur.str !== null || cur.strPlural.length)) finish(); continue; }
    if (line.startsWith('#~')) {
      if (cur && cur.id !== null && (cur.str !== null || cur.strPlural.length)) finish();
      else cur = null; // comments above an obsolete entry belong to it — drop them
      continue;
    }
    if (line.startsWith('#')) {
      if (cur && cur.id !== null && (cur.str !== null || cur.strPlural.length)) finish();
      if (!cur) start();
      if (line.startsWith('#,')) for (const f of line.slice(2).split(',')) cur.flags.add(f.trim());
      continue;
    }
    const kw = line.match(/^(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+"(.*)"$/);
    if (kw) {
      if (kw[1] === 'msgctxt' || kw[1] === 'msgid') {
        if (cur && cur.id !== null && (cur.str !== null || cur.strPlural.length)) finish();
        if (!cur) start();
      }
      if (!cur) start();
      field = kw[1];
      append(field, unescapePo(kw[2]));
      continue;
    }
    const cont = line.match(/^"(.*)"$/);
    if (cont && cur && field) { append(field, unescapePo(cont[1])); continue; }
    throw new Error(`unparseable .po line: ${raw}`);
  }
  finish();
  const live = entries.filter((e) => !e.obsolete);
  const headerEntry = live.find((e) => e.id === '' && !e.ctx);
  const header = {};
  if (headerEntry) for (const l of (headerEntry.str || '').split('\n')) { const m = l.match(/^([\w-]+):\s*(.*)$/); if (m) header[m[1]] = m[2].trim(); }
  return { header, entries: live.filter((e) => e !== headerEntry) };
}

// Evaluate a gettext "plural=" C expression. Only n, digits and C operators are allowed, so nothing else can run.
export function pluralFormsFunction(header) {
  const m = String(header || '').match(/plural\s*=\s*([^;]+);?/);
  if (!m) return null;
  const expr = m[1].trim();
  if (!/^[n0-9%=!&|?:<>()\s+\-*/]+$/.test(expr)) return null;
  try {
    const f = new Function('n', `return Number(${expr});`); // eslint-disable-line no-new-func
    f(1);
    return f;
  } catch { return null; }
}

function loadFile(path) {
  const ext = extname(path).toLowerCase();
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  if (ext === '.json') return { format: 'json', map: flattenJson(JSON.parse(text)) };
  if (ext === '.po' || ext === '.pot') return { format: 'po', ...parsePo(text) };
  throw new Error(`unsupported file type "${ext}" (use .json, .po or .pot)`);
}

// ---------- checks ----------
const W3C_BANDS = [[10, 3.0], [20, 2.0], [30, 1.8], [50, 1.6], [70, 1.7], [Infinity, 1.3]];
const charLen = (s) => [...stripMarkup(s).trim()].length;

function ratioCeiling(srcLen, opts) {
  if (opts.maxRatio) return opts.maxRatio;
  return W3C_BANDS.find(([max]) => srcLen <= max)[1];
}

function globToRegex(g) {
  return new RegExp(`^${g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
}

export function compare(source, target, opts = {}) {
  const tLocale = opts.targetLocale;
  const sLocale = opts.sourceLocale || 'en';
  const sameLanguage = languageOf(sLocale) === languageOf(tLocale);
  const errors = [];
  const warnings = [];
  const E = (code, key, message) => errors.push({ code, key, message });
  const W = (code, key, message) => warnings.push({ code, key, message });
  const allow = (opts.allowIdentical || []).map(globToRegex);
  const isAllowed = (key) => allow.some((r) => r.test(key));
  const card = pluralCategories(tLocale, 'cardinal');
  const ord = pluralCategories(tLocale, 'ordinal');
  const examples = { cardinal: categoryExamples(tLocale, 'cardinal'), ordinal: categoryExamples(tLocale, 'ordinal') };
  const ex = (type, c) => (examples[type][c] || []).slice(0, 4).join(', ');
  const coversMany = (type, c) => (examples[type][c] || []).filter(Number.isInteger).length > 1;
  const isUk = languageOf(tLocale) === 'uk';
  const apostrophes = new Map();

  function textChecks(key, src, tgt) {
    if (isUk) {
      const plain = stripMarkup(tgt);
      const ru = plain.match(/[ыэъёЫЭЪЁ]/g);
      if (ru) W('ru-letters', key, `letters not in the Ukrainian alphabet: ${[...new Set(ru)].join(' ')}`);
      const mixed = (plain.match(/[\p{L}'’ʼ-]+/gu) || []).filter((w) => /\p{Script=Cyrillic}/u.test(w) && /\p{Script=Latin}/u.test(w));
      if (mixed.length) W('mixed-script', key, `Cyrillic and Latin letters mixed in: ${[...new Set(mixed)].slice(0, 5).join(', ')} (e.g. Latin "i" instead of Cyrillic "і")`);
      if (/"[^"]*\p{Script=Cyrillic}[^"]*"/u.test(plain)) W('typography-quotes', key, 'straight "…" quotes around Ukrainian text — use «…» (nested: „…“)');
      for (const m of plain.matchAll(/\p{Script=Cyrillic}(['’ʼ])\p{Script=Cyrillic}/gu)) apostrophes.set(m[1], (apostrophes.get(m[1]) || 0) + 1);
    }
  }

  // setMode compares sets (plural forms may legitimately drop the count — the count rule checks that separately).
  function comparePlaceholders(key, src, tgt, setMode) {
    const a = extractPlaceholders(src);
    const b = extractPlaceholders(tgt);
    if (setMode) {
      const sa = new Set(a.named.concat(a.ordered));
      const sb = new Set(b.named.concat(b.ordered));
      const isCount = (x) => /^\{\{count\}\}$|^\{count\}$|^%(\d+\$)?[du]$|^%ll?d$/.test(x);
      const missing = [...sa].filter((x) => !sb.has(x) && !isCount(x));
      const extra = [...sb].filter((x) => !sa.has(x));
      if (missing.length || extra.length) E('placeholder', key, `placeholders differ — missing: ${missing.join(' ') || '–'} · extra: ${extra.join(' ') || '–'}`);
    } else {
      const d = multisetDiff(a.named, b.named);
      if (d.missing.length || d.extra.length) E('placeholder', key, `placeholders differ — missing: ${d.missing.join(' ') || '–'} · extra: ${d.extra.join(' ') || '–'}`);
      if (a.ordered.join() !== b.ordered.join()) E('placeholder-order', key, `non-positional printf specifiers must keep count and order: source ${a.ordered.join(' ') || '–'} · target ${b.ordered.join(' ') || '–'} (use %1$s, %2$d to reorder)`);
    }
    const t = multisetDiff(a.tags, b.tags);
    if (t.missing.length || t.extra.length) E('tags', key, `markup differs — missing: ${t.missing.join(' ') || '–'} · extra: ${t.extra.join(' ') || '–'}`);
  }

  function lengthAndIdentity(key, src, tgt) {
    if (typeof src !== 'string' || typeof tgt !== 'string') return;
    const sl = charLen(src);
    const tl = charLen(tgt);
    const letters = /\p{L}{2,}/u.test(stripMarkup(src));
    if (!sameLanguage && letters && src.trim() === tgt.trim() && !isAllowed(key)) {
      const s = stripMarkup(src).trim();
      const untranslatable = /^(https?:\/\/|www\.|[\w.+-]+@[\w-]+\.)/i.test(s) || /^[A-Z0-9][A-Z0-9 .+&/-]{0,5}$/.test(s);
      if (!untranslatable) W('identical', key, `same as source: "${src.length > 60 ? `${src.slice(0, 57)}...` : src}"`);
    }
    if (sl >= 2 && tl > 0) {
      const ratio = tl / sl;
      const ceil = ratioCeiling(sl, opts);
      if (ratio > ceil) W('length', key, `target is ${ratio.toFixed(2)}× the source (${tl} vs ${sl} chars; ceiling ${ceil}) — check UI space or shorten`);
      else if (sl >= 20 && ratio < (opts.minRatio ?? 0.33)) W('length-short', key, `target is ${ratio.toFixed(2)}× the source (${tl} vs ${sl} chars) — possible omission`);
    }
  }

  function checkIcu(key, src, tgt) {
    let sAst;
    let tAst;
    try { sAst = parseIcu(src); } catch (e) { E('icu-syntax', key, `source ICU message: ${e.message}`); return; }
    try { tAst = parseIcu(tgt); } catch (e) { E('icu-syntax', key, `target ICU message: ${e.message}`); return; }
    const si = icuInfo(sAst);
    const ti = icuInfo(tAst);
    const missing = [...si.names].filter((n) => !ti.names.has(n));
    const extra = [...ti.names].filter((n) => !si.names.has(n));
    if (missing.length || extra.length) E('placeholder', key, `ICU arguments differ — missing: ${missing.join(' ') || '–'} · extra: ${extra.join(' ') || '–'}`);
    const st = extractPlaceholders(si.text);
    const tt = extractPlaceholders(ti.text);
    const tagsS = [...new Set(st.tags)].sort().join(' ');
    const tagsT = [...new Set(tt.tags)].sort().join(' ');
    if (tagsS !== tagsT) E('tags', key, `markup differs — source: ${tagsS || '–'} · target: ${tagsT || '–'}`);
    for (const arg of ti.complex) {
      const selectors = arg.options.map((o) => o.selector);
      if (!selectors.includes('other')) E('icu-other', key, `${arg.type} "${arg.name}" has no "other" branch (required by ICU)`);
      if (arg.type === 'select') continue;
      const type = arg.type === 'plural' ? 'cardinal' : 'ordinal';
      const required = type === 'cardinal' ? card : ord;
      const present = selectors.filter((s) => !s.startsWith('='));
      const miss = required.filter((c) => !present.includes(c));
      if (miss.length) E('plural-missing', key, `${arg.type} "${arg.name}" lacks ${miss.map((c) => `${c} (${ex(type, c)})`).join(', ')} — ${tLocale} needs ${required.join('/')}`);
      const unused = present.filter((s) => !required.includes(s));
      if (unused.length) W('plural-unused', key, `${arg.type} "${arg.name}" has ${unused.join(', ')} — never selected in ${tLocale}`);
      const srcArg = si.complex.find((c) => c.name === arg.name && c.type === arg.type);
      const srcCounts = srcArg && srcArg.options.some((o) => branchMentions(o.message, arg.name));
      if (srcCounts) {
        for (const o of arg.options) {
          if (o.selector.startsWith('=') || !required.includes(o.selector) || !coversMany(type, o.selector)) continue;
          if (!branchMentions(o.message, arg.name)) E('count-missing', key, `branch "${o.selector}" of "${arg.name}" has no # — in ${tLocale} it also covers ${ex(type, o.selector)}`);
        }
      }
    }
    textChecks(key, src, ti.text);
  }

  // ---- JSON ----
  if (source.format === 'json') {
    const s = source.map;
    const t = target.map;
    const groups = new Map();
    const collect = (map, side) => {
      for (const k of map.keys()) {
        const m = k.match(PLURAL_SUFFIX);
        if (!m) continue;
        const id = `${m[1]}\u0000${m[2] ? 'ordinal' : 'cardinal'}`;
        if (!groups.has(id)) groups.set(id, { base: m[1], type: m[2] ? 'ordinal' : 'cardinal', src: new Map(), tgt: new Map() });
        groups.get(id)[side].set(m[3], k);
      }
    };
    collect(s, 'src');
    collect(t, 'tgt');
    const pluralKeys = new Set();
    for (const g of groups.values()) {
      const real = (g.src.has('other') && g.src.size >= 2) || (g.tgt.has('other') && g.tgt.size >= 2);
      if (!real) continue;
      for (const k of [...g.src.values(), ...g.tgt.values()]) pluralKeys.add(k);
      const label = `${g.base}_${g.type === 'ordinal' ? 'ordinal_' : ''}*`;
      if (!g.tgt.size) { E('missing', label, `plural group missing in target (needs ${(g.type === 'cardinal' ? card : ord).join('/')})`); continue; }
      if (!g.src.size) { W('extra', label, 'plural group not in source'); continue; }
      const required = g.type === 'cardinal' ? card : ord;
      const miss = required.filter((c) => !g.tgt.has(c));
      if (miss.length) E('plural-missing', label, `missing ${miss.map((c) => `_${g.type === 'ordinal' ? 'ordinal_' : ''}${c} (${ex(g.type, c)})`).join(', ')} — ${tLocale} needs ${required.join('/')}`);
      for (const c of g.tgt.keys()) {
        if (required.includes(c)) continue;
        if (c === 'zero') W('plural-unused', label, '_zero is not a CLDR category here — used only if your i18n library special-cases count 0 (check its docs)');
        else W('plural-unused', label, `_${c} is never selected in ${tLocale}`);
      }
      const srcForms = [...g.src.values()].map((k) => s.get(k));
      const srcRef = s.get(g.src.get('other') || [...g.src.values()][0]);
      const srcHasCount = srcForms.some((v) => /\{\{\s*count\b/.test(String(v)) || /\{\s*count\s*\}/.test(String(v)));
      for (const [c, k] of g.tgt) {
        const v = t.get(k);
        if (typeof v !== 'string' || !v.trim()) { E('empty', k, 'empty translation'); continue; }
        comparePlaceholders(k, srcForms.join(' '), v, true);
        if (srcHasCount && required.includes(c) && coversMany(g.type, c) && !/\{\{\s*count\b|\{\s*count\s*\}/.test(v)) E('count-missing', k, `no count placeholder — in ${tLocale} "${c}" also covers ${ex(g.type, c)}`);
        textChecks(k, srcRef, v);
      }
      const tOther = t.get(g.tgt.get('other'));
      if (typeof srcRef === 'string' && typeof tOther === 'string') lengthAndIdentity(g.tgt.get('other'), srcRef, tOther);
    }
    for (const [k, v] of s) {
      if (pluralKeys.has(k)) continue;
      if (!t.has(k)) { E('missing', k, 'key missing in target'); continue; }
      const tv = t.get(k);
      if (typeof v !== 'string') { if (typeof tv !== typeof v) E('type', k, `type differs: ${typeof v} vs ${typeof tv}`); continue; }
      if (typeof tv !== 'string') { E('type', k, `source is a string, target is ${tv === null ? 'null' : typeof tv}`); continue; }
      if (v.trim() && !tv.trim()) { E('empty', k, 'empty translation'); continue; }
      if (looksIcu(v) || looksIcu(tv)) { checkIcu(k, v, tv); continue; }
      comparePlaceholders(k, v, tv, false);
      lengthAndIdentity(k, v, tv);
      textChecks(k, v, tv);
    }
    for (const k of t.keys()) if (!pluralKeys.has(k) && !s.has(k)) W('extra', k, 'key not in source (stale?)');
  }

  // ---- gettext .po ----
  if (source.format === 'po') {
    const keyOf = (e) => (e.ctx ? `${e.ctx}|${e.id}` : e.id);
    const tIndex = new Map(target.entries.map((e) => [keyOf(e), e]));
    const sKeys = new Set(source.entries.map(keyOf));
    const pf = target.header['Plural-Forms'];
    const npl = pf && pf.match(/nplurals\s*=\s*(\d+)/) ? Number(pf.match(/nplurals\s*=\s*(\d+)/)[1]) : null;
    if (target.entries.some((e) => e.idPlural !== null) && npl === null) E('po-plural-forms', '(header)', 'target has plural entries but no "Plural-Forms: nplurals=…" header');
    const poIndexCoverage = {};
    const fn = pluralFormsFunction(pf);
    if (pf && !fn) W('po-plural-forms', '(header)', `cannot evaluate Plural-Forms expression: ${pf}`);
    if (fn) for (let n = 0; n <= 200; n++) (poIndexCoverage[Number(fn(n))] ||= []).push(n);
    for (const se of source.entries) {
      const k = keyOf(se);
      const te = tIndex.get(k);
      if (!te) { E('missing', k, 'entry missing in target'); continue; }
      if (te.flags.has('fuzzy')) W('fuzzy', k, 'marked fuzzy — gettext ignores it at compile time, users see the source text');
      const srcText = se.idPlural !== null ? `${se.id} ${se.idPlural}` : se.id;
      if (se.idPlural !== null) {
        const forms = te.strPlural;
        if (npl !== null && forms.length !== npl) E('plural-missing', k, `has ${forms.length} msgstr[n] forms, header says nplurals=${npl}`);
        const srcCount = extractPlaceholders(srcText).ordered.concat(extractPlaceholders(srcText).named).find((x) => /^%(\d+\$)?[du]$|^\{\{?count\}\}?$|^%\(\w+\)d$/.test(x));
        forms.forEach((f, n) => {
          if (!f || !f.trim()) { E('empty', `${k}[${n}]`, 'empty plural form'); return; }
          comparePlaceholders(`${k}[${n}]`, srcText, f, true);
          const covered = poIndexCoverage[n] || [];
          if (srcCount && covered.length > 1 && !f.includes(srcCount)) E('count-missing', `${k}[${n}]`, `no ${srcCount} — msgstr[${n}] is also used for n = ${covered.slice(0, 4).join(', ')}`);
          textChecks(`${k}[${n}]`, srcText, f);
        });
        if (!forms.length) E('empty', k, 'untranslated plural entry');
        continue;
      }
      const str = te.str ?? '';
      if (!str.trim()) { E('empty', k, 'untranslated (empty msgstr)'); continue; }
      comparePlaceholders(k, se.id, str, false);
      lengthAndIdentity(k, se.id, str);
      textChecks(k, se.id, str);
    }
    for (const te of target.entries) if (!sKeys.has(keyOf(te))) W('extra', keyOf(te), 'entry not in source template (obsolete? mark with #~ or remove)');
  }

  if (apostrophes.size > 1) {
    W('apostrophe-mixed', '(file)', `apostrophe variants mixed: ${[...apostrophes].map(([c, n]) => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} ×${n}`).join(', ')} — pick one (house default ’ U+2019)`);
  }

  return { errors, warnings, pluralCategories: { cardinal: card, ordinal: ord } };
}

// ---------- CLI ----------
function parseArgs(argv) {
  const opts = { files: [], json: false, strict: false, allowIdentical: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => { if (i + 1 >= argv.length) throw new Error(`${a} needs a value`); return argv[++i]; };
    if (a === '--json') opts.json = true;
    else if (a === '--strict') opts.strict = true;
    else if (a === '--source-locale') opts.sourceLocale = next();
    else if (a === '--target-locale') opts.targetLocale = next();
    else if (a === '--allow-identical') opts.allowIdentical.push(...next().split(',').map((x) => x.trim()).filter(Boolean));
    else if (a === '--max-ratio') opts.maxRatio = Number(next());
    else if (a === '--min-ratio') opts.minRatio = Number(next());
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (a.startsWith('--')) throw new Error(`unknown option ${a}`);
    else opts.files.push(a);
  }
  return opts;
}

export function main(argv = process.argv.slice(2)) {
  let opts;
  try { opts = parseArgs(argv); } catch (e) { console.error(`check-i18n: ${e.message}`); return 2; }
  if (opts.help || opts.files.length !== 2) {
    console.error('Usage: node check-i18n.mjs <source> <target> [--source-locale en] [--target-locale uk] [--allow-identical k1,k2] [--max-ratio n] [--min-ratio n] [--json] [--strict]');
    return opts.help ? 0 : 2;
  }
  const [srcPath, tgtPath] = opts.files;
  let source;
  let target;
  try { source = loadFile(srcPath); target = loadFile(tgtPath); } catch (e) { console.error(`check-i18n: ${e.message}`); return 2; }
  if (source.format !== target.format) { console.error('check-i18n: source and target must be the same format (both JSON or both .po/.pot)'); return 2; }
  const sLoc = canonicalLocale(opts.sourceLocale) || canonicalLocale(source.header?.Language) || inferLocale(srcPath) || 'en';
  const tLoc = canonicalLocale(opts.targetLocale) || canonicalLocale(target.header?.Language) || inferLocale(tgtPath);
  if (!tLoc) { console.error('check-i18n: cannot infer the target locale from the path or header — pass --target-locale <tag>'); return 2; }
  const res = compare(source, target, { ...opts, sourceLocale: sLoc, targetLocale: tLoc });
  const failed = res.errors.length > 0 || (opts.strict && res.warnings.length > 0);
  const keys = source.format === 'json' ? source.map.size : source.entries.length;
  if (opts.json) {
    console.log(JSON.stringify({ source: srcPath, target: tgtPath, sourceLocale: sLoc, targetLocale: tLoc, pluralCategories: res.pluralCategories, keys, errors: res.errors, warnings: res.warnings, ok: !failed }, null, 2));
  } else {
    console.log(`check-i18n: ${srcPath} (${sLoc}) → ${tgtPath} (${tLoc}) · CLDR plural categories: ${res.pluralCategories.cardinal.join('/')} · ordinal ${res.pluralCategories.ordinal.join('/')}`);
    for (const e of res.errors) console.log(`ERROR ${e.code.padEnd(18)} ${e.key} — ${e.message}`);
    for (const w of res.warnings) console.log(`WARN  ${w.code.padEnd(18)} ${w.key} — ${w.message}`);
    console.log(`${keys} source keys · ${res.errors.length} errors · ${res.warnings.length} warnings${opts.strict ? ' (strict)' : ''}`);
  }
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = main();
