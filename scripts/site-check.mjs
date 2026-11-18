#!/usr/bin/env node
// site-check — checks built HTML for what a shipped website needs and design-lint cannot see: head metadata (lang,
// charset, viewport, title, description, canonical), social previews (Open Graph, Twitter), icons, structured data
// (JSON-LD parses and has @context/@type), headings, images (alt, dimensions, lazy-loading), duplicate ids, accessible
// names of links/buttons/inputs/iframes, mixed content, localhost leftovers, noindex, hreflang; for a folder or a site
// root also robots.txt, sitemap.xml and a 404 page, plus duplicate titles/descriptions across pages.
// Usage: node site-check.mjs <dist-dir | page.html | https://url> [...more] [--json] [--max-pages 200] [--prod]
//   --prod: noindex, robots "Disallow: /" and localhost URLs become errors (default: warnings).
// Exit 1 when any error is found. Zero dependencies, Node >= 18 (built-in fetch for URLs).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', '.nuxt', '.svelte-kit', '.turbo', '.cache']);

// ---------- tiny HTML helpers (regex-based; good enough for linting generated output) ----------
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
const textOf = (html) => decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
function parseAttrs(s) {
  const a = {};
  for (const m of (s || '').matchAll(/([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) a[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return a;
}
function tags(html, name) {
  const re = new RegExp(`<${name}\\b((?:[^>"']|"[^"]*"|'[^']*')*)>`, 'gi');
  return [...html.matchAll(re)].map((m) => ({ attrs: parseAttrs(m[1]), index: m.index }));
}
function blocks(html, name) {
  const re = new RegExp(`<${name}\\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\\s\\S]*?)<\\/${name}>`, 'gi');
  return [...html.matchAll(re)].map((m) => ({ attrs: parseAttrs(m[1]), inner: m[2], index: m.index }));
}
const isAbsolute = (u) => /^https?:\/\//i.test(u || '');
const isLocal = (u) => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?/i.test(u || '');

export function checkPage(rawHtml, { url = '', prod = false } = {}) {
  const issues = [];
  const add = (level, id, message) => issues.push({ level, id, message });
  const jsonLd = blocks(rawHtml, 'script').filter((b) => /ld\+json/i.test(b.attrs.type || ''));
  const html = rawHtml.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|template|noscript)\b[\s\S]*?<\/\1>/gi, '');
  const metas = tags(html, 'meta');
  const meta = (key, val) => metas.find((m) => (m.attrs[key] || '').toLowerCase() === val);
  const links = tags(html, 'link');
  const rel = (r) => links.filter((l) => (l.attrs.rel || '').toLowerCase().split(/\s+/).includes(r));

  const htmlTag = tags(html, 'html')[0];
  if (!htmlTag?.attrs.lang) add('error', 'html-lang', '<html> has no lang attribute (screen readers, translation, hyphenation)');
  if (!metas.some((m) => 'charset' in m.attrs) && !meta('http-equiv', 'content-type')) add('warn', 'charset', 'no <meta charset="utf-8">');
  const vp = meta('name', 'viewport');
  if (!vp) add('error', 'viewport', 'no <meta name="viewport"> — the page renders zoomed out on phones');
  else if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(vp.attrs.content || '')) add('warn', 'viewport-zoom', 'viewport blocks pinch-zoom (WCAG 1.4.4)');

  const title = blocks(html, 'title')[0];
  const titleText = title ? textOf(title.inner) : '';
  if (!titleText) add('error', 'title', 'missing or empty <title>');
  else if (titleText.length < 10 || titleText.length > 60) add('warn', 'title-length', `<title> is ${titleText.length} chars (aim for 10–60 so search results show it whole)`);
  const desc = meta('name', 'description')?.attrs.content?.trim() || '';
  if (!desc) add('warn', 'description', 'no meta description (search engines will invent a snippet)');
  else if (desc.length < 50 || desc.length > 160) add('warn', 'description-length', `meta description is ${desc.length} chars (aim for 50–160)`);
  const canonical = rel('canonical')[0]?.attrs.href || '';
  if (!canonical) add('warn', 'canonical', 'no <link rel="canonical">');
  else if (!isAbsolute(canonical)) add('warn', 'canonical-relative', `canonical should be an absolute URL (got ${canonical})`);

  const og = (p) => meta('property', p)?.attrs.content || meta('name', p)?.attrs.content || '';
  const missingOg = ['og:title', 'og:description', 'og:image'].filter((p) => !og(p));
  if (missingOg.length) add('warn', 'og-missing', `link previews incomplete — missing ${missingOg.join(', ')}`);
  if (og('og:image') && !isAbsolute(og('og:image'))) add('error', 'og-image-relative', `og:image must be an absolute URL or previews show no image (got ${og('og:image')})`);
  if (!meta('name', 'twitter:card')) add('warn', 'twitter-card', 'no twitter:card (X shows a small summary card without it)');

  if (!rel('icon').length && !rel('shortcut').length) add('warn', 'favicon', 'no <link rel="icon"> (browsers fall back to /favicon.ico)');
  if (!rel('apple-touch-icon').length) add('warn', 'apple-touch-icon', 'no apple-touch-icon (iOS home-screen and some share sheets)');

  for (const b of jsonLd) {
    let data;
    try { data = JSON.parse(b.inner); } catch (e) { add('error', 'jsonld-invalid', `JSON-LD does not parse: ${e.message.slice(0, 80)}`); continue; }
    const items = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
    if (!(Array.isArray(data) ? data.every((d) => d['@context']) : data['@context'])) add('warn', 'jsonld-context', 'JSON-LD without @context');
    if (items.some((d) => !d['@type'])) add('warn', 'jsonld-type', 'JSON-LD item without @type');
  }

  const heads = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ level: +m[1], text: textOf(m[2]) || (m[2].match(/<img\b[^>]*\balt\s*=\s*["']([^"']+)["']/i)?.[1] ?? '') }));
  const h1 = heads.filter((h) => h.level === 1).length;
  if (h1 !== 1) add('warn', 'h1-count', `${h1} <h1> elements (one per page describes it best)`);
  for (let i = 1; i < heads.length; i++) if (heads[i].level > heads[i - 1].level + 1) { add('warn', 'heading-skip', `heading jumps h${heads[i - 1].level} → h${heads[i].level} ("${heads[i].text.slice(0, 40)}")`); break; }
  if (heads.some((h) => !h.text)) add('warn', 'heading-empty', 'empty heading element');

  const imgs = tags(html, 'img');
  const noAlt = imgs.filter((i) => !('alt' in i.attrs));
  if (noAlt.length) add('error', 'img-alt', `${noAlt.length} <img> without alt (use alt="" for decorative images) — first: ${noAlt[0].attrs.src || '(no src)'}`);
  const noDims = imgs.filter((i) => !(i.attrs.width && i.attrs.height) && !/aspect-ratio|width\s*:.*height\s*:/i.test(i.attrs.style || ''));
  if (noDims.length) add('warn', 'img-dimensions', `${noDims.length} <img> without width/height — layout shift (CLS) while loading`);
  const eagerLate = imgs.slice(3).filter((i) => (i.attrs.loading || '').toLowerCase() !== 'lazy');
  if (eagerLate.length) add('warn', 'img-lazy', `${eagerLate.length} images after the first three load eagerly — add loading="lazy" below the fold`);
  if (imgs[0] && (imgs[0].attrs.loading || '').toLowerCase() === 'lazy' && imgs.length) add('warn', 'lcp-lazy', 'the first image is lazy-loaded — if it is the hero/LCP image, load it eagerly with fetchpriority="high"');

  const ids = new Map();
  for (const m of html.matchAll(/\sid\s*=\s*["']([^"']+)["']/gi)) ids.set(m[1], (ids.get(m[1]) || 0) + 1);
  const dup = [...ids].filter(([, n]) => n > 1).map(([id]) => id);
  if (dup.length) add('error', 'duplicate-id', `duplicate id: ${dup.slice(0, 5).join(', ')}${dup.length > 5 ? '…' : ''} (breaks labels, anchors, aria references)`);

  const anchors = blocks(html, 'a').filter((a) => 'href' in a.attrs);
  const nameless = anchors.filter((a) => !textOf(a.inner) && !a.attrs['aria-label'] && !a.attrs['aria-labelledby'] && !a.attrs.title && !/<img\b[^>]*\balt\s*=\s*["'][^"']+["']/i.test(a.inner) && !/<svg[\s\S]*?<title>[^<]+<\/title>/i.test(a.inner));
  if (nameless.length) add('error', 'link-name', `${nameless.length} link(s) with no accessible name — first: ${nameless[0].attrs.href || '(empty href)'}`);
  const fake = anchors.filter((a) => /^\s*(#|javascript:)/i.test(a.attrs.href) && a.attrs.href.trim() !== '#main' && !/^#[\w-]+$/.test(a.attrs.href.trim()));
  if (fake.length) add('warn', 'link-as-button', `${fake.length} link(s) with href="#" or javascript: — use <button> for actions`);
  const buttons = blocks(html, 'button').filter((b) => !textOf(b.inner) && !b.attrs['aria-label'] && !b.attrs['aria-labelledby'] && !b.attrs.title && !/<svg[\s\S]*?<title>[^<]+<\/title>/i.test(b.inner));
  if (buttons.length) add('error', 'button-name', `${buttons.length} <button> with no accessible name (icon-only buttons need aria-label)`);
  const labelled = new Set(tags(html, 'label').map((l) => l.attrs.for).filter(Boolean));
  const wrapped = blocks(html, 'label').flatMap((l) => tags(l.inner, 'input').map((i) => i.attrs.name || i.attrs.id || '?'));
  const inputs = [...tags(html, 'input'), ...tags(html, 'select'), ...tags(html, 'textarea')].filter((i) => !/^(hidden|submit|button|image|reset)$/i.test(i.attrs.type || ''));
  const unlabelled = inputs.filter((i) => !(i.attrs.id && labelled.has(i.attrs.id)) && !i.attrs['aria-label'] && !i.attrs['aria-labelledby'] && !i.attrs.title && !wrapped.includes(i.attrs.name || i.attrs.id || '?'));
  if (unlabelled.length) add('warn', 'input-label', `${unlabelled.length} form field(s) without a label (placeholder is not a label)`);
  const iframes = tags(html, 'iframe').filter((f) => !f.attrs.title);
  if (iframes.length) add('warn', 'iframe-title', `${iframes.length} <iframe> without title`);
  if (meta('http-equiv', 'refresh')) add('warn', 'meta-refresh', 'meta refresh redirect — use an HTTP redirect');

  const robots = (meta('name', 'robots')?.attrs.content || '').toLowerCase();
  if (/noindex/.test(robots)) add(prod ? 'error' : 'warn', 'noindex', 'page is noindex — remove before launch unless intended');
  const pageHttps = /^https:/i.test(url) || /^https:/i.test(canonical);
  const resources = [...tags(html, 'img'), ...tags(html, 'script'), ...tags(html, 'source'), ...tags(html, 'iframe'), ...tags(html, 'video'), ...tags(html, 'audio')].map((t) => t.attrs.src).concat(links.filter((l) => /stylesheet|preload|icon/i.test(l.attrs.rel || '')).map((l) => l.attrs.href)).filter(Boolean);
  const scriptSrcs = tags(rawHtml, 'script').map((s) => s.attrs.src).filter(Boolean);
  const allRes = resources.concat(scriptSrcs);
  if (pageHttps) { const mixed = allRes.filter((u) => /^http:\/\//i.test(u) && !isLocal(u)); if (mixed.length) add('error', 'mixed-content', `https page loads http resources: ${mixed.slice(0, 3).join(', ')}`); }
  const localUrls = [...new Set([...rawHtml.matchAll(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?[^\s"'<>)]*/gi)].map((m) => m[0]))];
  if (localUrls.length) add(prod ? 'error' : 'warn', 'localhost-url', `localhost URL in the page: ${localUrls.slice(0, 2).join(', ')}`);

  const alternates = rel('alternate').filter((l) => l.attrs.hreflang);
  if (alternates.length) {
    const bad = alternates.filter((l) => !/^(x-default|[a-z]{2,3}(-[A-Za-z]{4})?(-(?:[A-Za-z]{2}|\d{3}))?)$/.test(l.attrs.hreflang));
    if (bad.length) add('error', 'hreflang-code', `invalid hreflang: ${bad.map((l) => l.attrs.hreflang).join(', ')} (use ISO 639-1 language + optional ISO 3166-1 region, e.g. uk, en-GB)`);
    if (canonical && !alternates.some((l) => l.attrs.href === canonical)) add('warn', 'hreflang-self', 'hreflang set has no self-reference matching the canonical URL');
    if (!alternates.some((l) => (l.attrs.hreflang || '').toLowerCase() === 'x-default')) add('warn', 'hreflang-default', 'no hreflang="x-default"');
  }
  return { title: titleText, description: desc, canonical, issues };
}

function checkRobots(text, prod) {
  const issues = [];
  let agentAll = false;
  for (const line of text.split(/\r?\n/)) {
    const l = line.replace(/#.*/, '').trim();
    if (/^user-agent\s*:\s*\*$/i.test(l)) agentAll = true;
    else if (/^user-agent\s*:/i.test(l)) agentAll = false;
    else if (agentAll && /^disallow\s*:\s*\/\s*$/i.test(l)) issues.push({ level: prod ? 'error' : 'warn', id: 'robots-disallow-all', message: 'robots.txt disallows everything for all crawlers' });
  }
  const sitemaps = [...text.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map((m) => m[1]);
  return { issues, sitemaps };
}
function checkSitemap(text) {
  const issues = [];
  const locs = [...text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
  if (!/<(urlset|sitemapindex)\b/i.test(text)) issues.push({ level: 'error', id: 'sitemap-invalid', message: 'sitemap has no <urlset> or <sitemapindex>' });
  const rel = locs.filter((u) => !isAbsolute(u));
  if (rel.length) issues.push({ level: 'error', id: 'sitemap-relative', message: `${rel.length} sitemap <loc> not absolute (first: ${rel[0]})` });
  const local = locs.filter(isLocal);
  if (local.length) issues.push({ level: 'error', id: 'sitemap-localhost', message: `${local.length} sitemap URLs point to localhost` });
  return { issues, count: locs.length };
}

function htmlFiles(dir, max) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (out.length >= max) return;
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(join(d, e.name)); }
      else if (/\.html?$/i.test(e.name)) out.push(join(d, e.name));
    }
  };
  walk(dir);
  return out.sort();
}

export async function run(targets, { prod = false, maxPages = 200 } = {}) {
  const pages = [];
  const site = [];
  for (const t of targets) {
    if (/^https?:\/\//i.test(t)) {
      const res = await fetch(t, { redirect: 'follow' }).catch((e) => ({ ok: false, status: 0, statusText: e.message }));
      if (!res.ok) { site.push({ level: 'error', id: 'fetch', message: `${t} → ${res.status} ${res.statusText}` }); continue; }
      const r = checkPage(await res.text(), { url: res.url || t, prod });
      pages.push({ page: t, ...r });
      const origin = new URL(t).origin;
      if (!site.some((s) => s.origin === origin)) {
        const robots = await fetch(`${origin}/robots.txt`).catch(() => null);
        let sitemapUrls = [`${origin}/sitemap.xml`];
        if (robots?.ok) { const rr = checkRobots(await robots.text(), prod); site.push(...rr.issues); if (rr.sitemaps.length) sitemapUrls = rr.sitemaps; }
        else site.push({ level: 'warn', id: 'robots-missing', message: `${origin}/robots.txt not found` });
        const sm = await fetch(sitemapUrls[0]).catch(() => null);
        if (sm?.ok) site.push(...checkSitemap(await sm.text()).issues);
        else site.push({ level: 'warn', id: 'sitemap-missing', message: `no sitemap at ${sitemapUrls[0]}` });
        site.push({ origin, level: 'info', id: 'origin', message: origin });
      }
      continue;
    }
    const abs = resolve(t);
    if (!existsSync(abs)) { site.push({ level: 'error', id: 'missing', message: `${t} does not exist` }); continue; }
    if (statSync(abs).isDirectory()) {
      const files = htmlFiles(abs, maxPages);
      if (!files.length) site.push({ level: 'error', id: 'no-html', message: `${t}: no .html files (point at the build output: dist, out, build, .output/public…)` });
      for (const f of files) pages.push({ page: relative(process.cwd(), f).split(sep).join('/') || f, ...checkPage(readFileSync(f, 'utf8'), { prod }) });
      const robotsPath = join(abs, 'robots.txt');
      if (existsSync(robotsPath)) site.push(...checkRobots(readFileSync(robotsPath, 'utf8'), prod).issues);
      else site.push({ level: 'warn', id: 'robots-missing', message: `${t}: no robots.txt (fine if the framework generates it at runtime)` });
      const sm = ['sitemap.xml', 'sitemap-index.xml', 'sitemap_index.xml'].map((n) => join(abs, n)).find(existsSync);
      if (sm) site.push(...checkSitemap(readFileSync(sm, 'utf8')).issues);
      else site.push({ level: 'warn', id: 'sitemap-missing', message: `${t}: no sitemap.xml (fine if generated at runtime)` });
      if (files.length > 1 && !files.some((f) => /(^|[\\/])(404|not-found)(\.html|[\\/]index\.html)$/i.test(f))) site.push({ level: 'warn', id: '404-missing', message: `${t}: no 404.html — static hosts will show their default error page` });
    } else pages.push({ page: t, ...checkPage(readFileSync(abs, 'utf8'), { prod }) });
  }
  // duplicates across pages
  for (const key of ['title', 'description']) {
    const seen = new Map();
    for (const p of pages) if (p[key]) seen.set(p[key], [...(seen.get(p[key]) || []), p.page]);
    for (const [val, list] of seen) if (list.length > 1) site.push({ level: 'warn', id: `duplicate-${key}`, message: `${list.length} pages share the ${key} "${val.slice(0, 50)}": ${list.slice(0, 3).join(', ')}` });
  }
  const all = pages.flatMap((p) => p.issues).concat(site.filter((s) => s.level !== 'info'));
  return { pages, site: site.filter((s) => s.level !== 'info'), errors: all.filter((i) => i.level === 'error').length, warnings: all.filter((i) => i.level === 'warn').length };
}

async function main() {
  const args = process.argv.slice(2);
  const valued = new Set(['--max-pages']);
  const targets = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
  if (!targets.length || args.includes('--help')) { console.error('Usage: node site-check.mjs <dist-dir | page.html | https://url> [...] [--json] [--max-pages 200] [--prod]'); process.exit(2); }
  const i = args.indexOf('--max-pages');
  const r = await run(targets, { prod: args.includes('--prod'), maxPages: i >= 0 ? +args[i + 1] || 200 : 200 });
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else {
    const L = [`site-check: ${r.pages.length} page(s) · ${r.errors} error(s) · ${r.warnings} warning(s)`];
    for (const p of r.pages) if (p.issues.length) { L.push('', p.page); for (const x of p.issues) L.push(`  ${x.level === 'error' ? 'ERROR' : 'WARN '} ${x.id.padEnd(20)} ${x.message}`); }
    if (r.site.length) { L.push('', 'site'); for (const x of r.site) L.push(`  ${x.level === 'error' ? 'ERROR' : 'WARN '} ${x.id.padEnd(20)} ${x.message}`); }
    console.log(L.join('\n'));
  }
  process.exit(r.errors ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
