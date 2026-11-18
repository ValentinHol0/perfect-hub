#!/usr/bin/env node
// utm — build and validate UTM-tagged links against one naming convention. Zero dependencies, Node >= 18.
//
// Convention (enforced):
//   * utm_source, utm_medium, utm_campaign are required (GA4 reports "(not set)" otherwise).
//   * Values: lowercase ASCII a-z 0-9 and . _ - only, no spaces, <= 100 characters
//     (GA4 is case-sensitive: "Facebook" and "facebook" are two sources).
//     Words are joined with "-", fields inside one value with "_".
//   * utm_medium comes from a fixed list mapped to GA4 default channel groups (see `mediums`).
//   * utm_campaign = yyyy-mm_<name>[_<more>], e.g. 2026-11_black-friday_ua.
//   * utm_source is a platform or site name (facebook, google, telegram, newsletter), never a URL.
//   * No UTMs on internal links (pass --site example.com to enforce), no click IDs pasted into links.
//
// Usage:
//   node utm.mjs build --url https://shop.example/sale --source facebook --medium paid_social \
//        --campaign "2026-11_Чорна п'ятниця_UA" [--content video-a] [--term ...] [--id ...] [--source-platform ...] [--site shop.example]
//   node utm.mjs check <url> [<url> ...] [--file urls.txt] [--site shop.example]
//   node utm.mjs mediums
//   add --json for machine-readable output; --allow-medium a,b to accept extra mediums.
// build normalises values (lowercase, Ukrainian transliteration per KMU resolution No. 55 of 27.01.2010,
// spaces -> "-") and then validates; check validates as-is. Exit code 1 when any error is found.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const PAID = 'Paid Search / Paid Social / Paid Video / Paid Shopping when GA4 recognises the source, otherwise Paid Other';
// GA4 default channel group rules, support.google.com/analytics/answer/9756891 (checked 2026-11-12).
export const MEDIUMS = {
  cpc: PAID,
  ppc: PAID,
  paid_social: PAID,
  paid_video: PAID,
  retargeting: PAID,
  display: 'Display',
  banner: 'Display',
  cpm: 'Display',
  social: 'Organic Social',
  email: 'Email',
  sms: 'SMS',
  push: 'Mobile Push Notifications',
  referral: 'Referral',
  affiliate: 'Affiliates',
  organic: 'Organic Search',
  video: 'Organic Video (Paid Video is matched first only for paid mediums)',
  audio: 'Audio',
};

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic'];
const REQUIRED = ['utm_source', 'utm_medium', 'utm_campaign'];
const CLICK_IDS = ['gclid', 'gbraid', 'wbraid', 'dclid', 'fbclid', 'ttclid', 'msclkid'];
const VALUE_RE = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/;
const CAMPAIGN_RE = /^\d{4}-(0[1-9]|1[0-2])_[a-z0-9]+(-[a-z0-9]+)*(_[a-z0-9]+(-[a-z0-9]+)*)*$/;
const MAX_LEN = 100;

// Ukrainian -> Latin, KMU resolution No. 55 (27.01.2010): є ї й ю я differ at the start of a word; зг -> zgh; ь and apostrophe dropped.
const UA = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ю: 'iu', я: 'ia', ь: '' };
const UA_INITIAL = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' };
const APOSTROPHES = /['’ʼ`]/g;
export function transliterate(text) {
  const s = text.toLowerCase().replace(APOSTROPHES, '');
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const atWordStart = i === 0 || !/[\p{L}]/u.test(s[i - 1]);
    if (ch === 'з' && s[i + 1] === 'г') { out += 'zgh'; i++; continue; }
    if (atWordStart && UA_INITIAL[ch]) { out += UA_INITIAL[ch]; continue; }
    out += ch in UA ? UA[ch] : ch;
  }
  return out;
}

// build-time normalisation: transliterate, lowercase, anything outside [a-z0-9._-] becomes "-".
export function normalise(value) {
  return transliterate(String(value).trim())
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/_{2,}/g, '_')
    .replace(/(^[-_.]+)|([-_.]+$)/g, '')
    .replace(/-?_-?/g, '_');
}

function checkValue(key, value, problems, extraMediums) {
  const err = (m) => problems.push({ level: 'error', param: key, message: m });
  const warn = (m) => problems.push({ level: 'warning', param: key, message: m });
  if (value === '') { err('empty value'); return; }
  if (value.length > MAX_LEN) err(`${value.length} characters (max ${MAX_LEN})`);
  if (/[A-Z]/.test(value)) err('uppercase letters — GA4 values are case-sensitive; use lowercase');
  if (/\s/.test(value)) err('contains spaces — use "-" between words');
  if (/[^\x00-\x7F]/.test(value)) err('non-ASCII characters — transliterate (utm.mjs build does it)');
  if (!/[A-Z\s]/.test(value) && /^[\x00-\x7F]*$/.test(value) && !VALUE_RE.test(value)) err('only a-z 0-9 . _ - allowed, starting and ending with a letter or digit');
  if (/--|__/.test(value)) warn('doubled separator');
  if (key === 'utm_medium' && !(value in MEDIUMS) && !extraMediums.includes(value)) err(`medium "${value}" is not in the allowed list (${Object.keys(MEDIUMS).join(', ')}) — it would land in GA4 "Unassigned" or an unintended channel`);
  if (key === 'utm_campaign' && VALUE_RE.test(value) && !CAMPAIGN_RE.test(value)) err('campaign must be yyyy-mm_<name>[_<more>], e.g. 2026-11_black-friday_ua');
  if (key === 'utm_source' && (/:\/\//.test(value) || /^www\./.test(value))) err('source is a platform or site name (facebook, google, newsletter), not a URL');
}

const sameSite = (host, site) => { const h = host.toLowerCase().replace(/^www\./, ''); const s = site.toLowerCase().replace(/^www\./, ''); return h === s || h.endsWith(`.${s}`); };

export function checkUrl(input, { site, extraMediums = [] } = {}) {
  const problems = [];
  let url;
  try { url = new URL(input); } catch { return { url: input, ok: false, problems: [{ level: 'error', param: null, message: 'not an absolute URL' }], channel: null }; }
  if (!/^https?:$/.test(url.protocol)) problems.push({ level: 'error', param: null, message: `protocol ${url.protocol} — use https` });
  else if (url.protocol === 'http:') problems.push({ level: 'warning', param: null, message: 'http link — use https' });
  if (/[?&]utm_/i.test(url.hash)) problems.push({ level: 'error', param: null, message: 'UTM parameters after "#" are invisible to analytics — put them before the fragment' });
  if (site && sameSite(url.hostname, site)) problems.push({ level: 'error', param: null, message: `internal link to ${site} — UTMs on internal links restart attribution; remove them` });
  const seen = new Map();
  for (const [k, v] of url.searchParams) {
    const key = k.toLowerCase();
    if (key.startsWith('utm_')) {
      if (k !== key) problems.push({ level: 'error', param: k, message: 'parameter name must be lowercase' });
      if (!UTM_KEYS.includes(key)) problems.push({ level: 'error', param: k, message: `unknown UTM parameter (typo?) — valid: ${UTM_KEYS.join(', ')}` });
      if (seen.has(key)) problems.push({ level: 'error', param: key, message: 'duplicate parameter' });
      seen.set(key, v);
    }
    if (CLICK_IDS.includes(key)) problems.push({ level: 'warning', param: key, message: 'click ID copied into a link — ad platforms add these themselves; remove it' });
  }
  for (const key of REQUIRED) if (!seen.has(key)) problems.push({ level: 'error', param: key, message: 'required parameter missing' });
  for (const [key, v] of seen) if (UTM_KEYS.includes(key)) checkValue(key, v, problems, extraMediums);
  const medium = seen.get('utm_medium');
  const channel = medium in MEDIUMS ? MEDIUMS[medium] : extraMediums.includes(medium) ? 'custom (not in the default convention)' : null;
  return { url: url.href, ok: !problems.some((p) => p.level === 'error'), problems, channel };
}

export function buildUrl(base, params, options = {}) {
  let url;
  try { url = new URL(base); } catch { throw new Error(`--url "${base}" is not an absolute URL`); }
  const notes = [];
  for (const key of UTM_KEYS) {
    if (params[key] === undefined) continue;
    const raw = String(params[key]);
    const value = normalise(raw);
    if (value !== raw) notes.push(`${key}: "${raw}" -> "${value}"`);
    if (url.searchParams.has(key)) notes.push(`${key}: replaced existing value "${url.searchParams.get(key)}"`);
    url.searchParams.set(key, value);
  }
  const report = checkUrl(url.href, options);
  return { ...report, notes };
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[a.slice(2)] = true; else { out[a.slice(2)] = next; i++; }
  }
  return out;
}

const render = (r) => [
  `${r.ok ? 'OK   ' : 'FAIL '} ${r.url}`,
  ...(r.notes || []).map((n) => `  note    ${n}`),
  ...r.problems.map((p) => `  ${p.level === 'error' ? 'error  ' : 'warning'} ${p.param ? `${p.param}: ` : ''}${p.message}`),
  ...(r.channel ? [`  GA4 default channel: ${r.channel}`] : []),
].join('\n');

export function run(argv) {
  const args = parseArgs(argv);
  const cmd = args._[0];
  const options = { site: typeof args.site === 'string' ? args.site : undefined, extraMediums: typeof args['allow-medium'] === 'string' ? args['allow-medium'].split(',').map((s) => s.trim()) : [] };
  if (cmd === 'mediums') {
    const text = Object.entries(MEDIUMS).map(([m, c]) => `${m.padEnd(12)} ${c}`).join('\n');
    return { ok: true, result: MEDIUMS, text };
  }
  if (cmd === 'build') {
    if (typeof args.url !== 'string') throw new Error('--url is required');
    const params = {};
    for (const key of UTM_KEYS) {
      const flag = key.slice(4).replace(/_/g, '-');
      if (typeof args[flag] === 'string') params[key] = args[flag];
    }
    const r = buildUrl(args.url, params, options);
    return { ok: r.ok, result: r, text: render(r) };
  }
  if (cmd === 'check') {
    const urls = args._.slice(1);
    if (typeof args.file === 'string') urls.push(...readFileSync(args.file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));
    if (!urls.length) throw new Error('give at least one URL or --file');
    const results = urls.map((u) => checkUrl(u, options));
    const bad = results.filter((r) => !r.ok).length;
    return { ok: bad === 0, result: results, text: `${results.map(render).join('\n')}\n${results.length} checked, ${bad} failing` };
  }
  throw new Error('command must be one of: build, check, mediums');
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const { ok, result, text } = run(process.argv.slice(2));
    console.log(process.argv.includes('--json') ? JSON.stringify(result, null, 2) : text);
    process.exit(ok ? 0 : 1);
  } catch (e) {
    console.error(`utm: ${e.message}`);
    process.exit(1);
  }
}
