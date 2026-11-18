#!/usr/bin/env node
// design-lint — static checks for UI code: AI-slop tells, accessibility defects and template leftovers.
// Zero dependencies. Works the same in Claude Code and Antigravity.
//
// Usage: node design-lint.mjs <file|dir> [...] [--json] [--min=P0|P1|P2]
//   Scans .html .htm .jsx .tsx .vue .svelte .astro .css .scss (skips node_modules, dist, build, .next, coverage, .git).
//   Exit 1 when any P0 finding exists, 0 otherwise, 2 on usage error.
// Rule IDs map to absolute-designer/references/anti-slop.md and absolute-ui-ux/references/ux-rules.md.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const EXTS = new Set(['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro', '.css', '.scss']);
const MARKUP = new Set(['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.nuxt', '.svelte-kit', 'coverage', '.git', '.turbo', 'out', '.visual-review']);
const RANK = { P0: 0, P1: 1, P2: 2 };

// Pictographic emoji, excluding typographic symbols that are legitimate in UI copy (© ® ™ arrows ✓ ✔ × ✕).
const EMOJI = /(?![©®™←-⇿✓✔✕✖×•])\p{Extended_Pictographic}/u;

// Line rules: [id, severity, test(line, ctx) → boolean, message, extensions or null for all]
const LINE_RULES = [
  ['DL-LOREM', 'P0', (l) => /lorem ipsum|dolor sit amet/i.test(l), 'Placeholder copy (lorem ipsum). Write real copy in the product language.', null],
  ['DL-PLACEHOLDER-IMG', 'P0', (l) => /(picsum\.photos|via\.placeholder\.com|placehold\.(co|it)|dummyimage\.com|placekitten\.com|source\.unsplash\.com)/i.test(l), 'Placeholder image service. Use real, generated or deliberate SVG/CSS imagery.', null],
  ['DL-ZOOM-LOCK', 'P0', (l) => /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/i.test(l), 'Viewport blocks zoom (WCAG 1.4.4). Remove user-scalable=no / maximum-scale=1.', null],
  ['DL-OUTLINE', 'P0', (l) => /\boutline-none\b/.test(l) && !/focus-visible:|focus:ring|focus:outline|focus-visible:ring/.test(l), 'outline-none without a focus-visible replacement. Add focus-visible:outline-2 focus-visible:outline-offset-2.', MARKUP],
  ['DL-OUTLINE-CSS', 'P1', (l) => /outline\s*:\s*(none|0)\b/i.test(l), 'outline removed in CSS. Confirm a :focus-visible style replaces it.', null],
  ['DL-EMOJI', 'P0', (l) => EMOJI.test(l) && !/^\s*(\/\/|\/\*|\*|<!--)/.test(l), 'Emoji in UI markup. Use one icon set (Lucide, Phosphor, Tabler) or custom SVG.', MARKUP],
  ['DL-GRADIENT-TEXT', 'P1', (l) => (/\bbg-clip-text\b/.test(l) && /\btext-transparent\b/.test(l)) || /(-webkit-)?background-clip\s*:\s*text/i.test(l), 'Gradient-filled text. Create emphasis with size and weight instead.', null],
  ['DL-LILA', 'P1', (l) => /\bfrom-(purple|violet|indigo|fuchsia)-\d{2,3}\b.*\b(via|to)-(blue|pink|indigo|purple|violet|cyan|fuchsia)-\d{2,3}\b/.test(l) || /linear-gradient\([^)]*(#8b5cf6|#7c3aed|#6366f1|#a855f7|#9333ea)[^)]*(#3b82f6|#ec4899|#06b6d4|#6366f1|#2563eb)/i.test(l), 'Purple→blue/pink gradient (Lila rule). Derive colour from the brand, not the AI default.', null],
  ['DL-VH', 'P1', (l) => /\bh-screen\b/.test(l) || (/(^|[^-])height\s*:\s*100vh/i.test(l) && !/dvh/.test(l)), '100vh / h-screen jumps on mobile browsers. Use 100dvh / min-h-[100dvh].', null],
  ['DL-ROLE-GRID', 'P1', (l) => /<table[^>]*role\s*=\s*["']grid["']/i.test(l), 'role="grid" on a table promises arrow-key cell navigation. Use a plain <table> with aria-sort on header buttons.', MARKUP],
  ['DL-BORDER-ACCENT', 'P2', (l) => /\bborder-l-(4|8)\b|border-left\s*:\s*([3-9]|\d{2,})px|box-shadow\s*:\s*inset\s+([3-9]|\d{2,})px\s+0/i.test(l), 'Thick coloured left strip on a card/callout is an AI tell. Use a tinted surface, icon or heading instead.', null],
  ['DL-100VW', 'P1', (l) => /width\s*:\s*100vw|\bw-screen\b/i.test(l), '100vw includes the scrollbar and causes horizontal scroll. Use 100% / w-full.', null],
  ['DL-OVERFLOW-HIDDEN', 'P2', (l) => /^\s*(html|body)\b[^{]*\{[^}]*overflow-x\s*:\s*hidden/i.test(l), 'overflow-x: hidden on html/body breaks position: sticky. Use overflow-x: clip.', null],
  ['DL-NO-PASTE', 'P0', (l) => /onPaste[\s\S]{0,80}preventDefault|onpaste\s*=\s*["']\s*return\s+false/i.test(l), 'Blocking paste breaks password managers and WCAG 3.3.8. Allow paste.', null],
  ['DL-TEMPLATE-RESIDUE', 'P0', (l) => /\[(Company|Brand|Product|Your|First|Last) ?Name\]|\[Insert [^\]]+\]/i.test(l), 'Template residue in UI copy. Replace with real content or a visibly marked slot.', MARKUP],
  ['DL-MIDDOT-META', 'P2', (l) => (l.match(/\s·\s/g) || []).length >= 2 && !/^\s*(\/\/|\/\*|\*|<!--)/.test(l), 'Middle-dot meta string ("A · B · C") is an AI tell. Write a sentence or a real list.', MARKUP],
  ['DL-ARROW-LINK', 'P2', (l) => /(→|&rarr;|&#8594;)\s*(<\/span>\s*)?<\/(a|button)>/i.test(l) || /content\s*:\s*["'](→|\\2192)["']/i.test(l), 'Arrow appended to link/button text is an AI tell when used everywhere. Keep it only where direction matters.', null],
  ['DL-TRANSITION-ALL', 'P2', (l) => /\btransition-all\b|transition\s*:\s*all\b/i.test(l), 'transition: all animates layout properties. List the properties (transform, opacity, colors).', null],
  ['DL-HYPE-COPY', 'P2', (l) => /\b(revolutioni[sz]e|unlock the power|supercharge|game[- ]?changer|next[- ]gen(eration)?|cutting[- ]edge|seamless(ly)?|elevate your|whether you're|join thousands|in today's fast[- ]paced)\b|not just [^.,<]{1,40},? but|революційн|інноваційн|найкращ\S* у світі|не просто [^.,<]{1,40}, а /i.test(l), 'Hype or template copy. Say what the product does, specifically.', MARKUP],
  ['DL-VAGUE-CTA', 'P2', (l) => />\s*(Submit|Click here|Learn more|Read more|Надіслати|Детальніше|Дізнатися більше|Дізнатись більше|Натисніть тут|Читати далі)\s*</i.test(l), 'Vague button/link label. Name the action and object ("Create invoice" / «Оформити підписку»).', MARKUP],
  ['DL-RAW-HEX', 'P2', (l) => /\b(bg|text|border|from|to|via|fill|stroke|ring)-\[#[0-9a-f]{3,8}\]/i.test(l) || /style=\{\{[^}]*#[0-9a-f]{3,8}/i.test(l), 'Raw hex inside a component. Use design tokens (CSS variables / @theme).', MARKUP],
];

// Whole-file rules for multi-line tags.
function fileRules(text, ext) {
  const out = [];
  const lineOf = (idx) => text.slice(0, idx).split('\n').length;
  // Coloured strip faked with a pseudo-element: ::before/::after pinned to the left edge, a few px wide.
  for (const m of text.matchAll(/([^{}]*::?(before|after)[^{]*)\{([^}]*)\}/g)) {
    const body = m[3];
    const pinned = /inset\s*:\s*0\s+auto\s+0\s+0/i.test(body) || (/\bleft\s*:\s*0/i.test(body) && /\btop\s*:\s*0/i.test(body) && /\bbottom\s*:\s*0/i.test(body));
    const narrow = body.match(/\bwidth\s*:\s*(\d+)px/i);
    if (pinned && narrow && Number(narrow[1]) >= 3 && Number(narrow[1]) <= 16 && /background/i.test(body)) {
      out.push([lineOf(m.index + m[1].length), 'DL-BORDER-ACCENT', 'P2', 'Coloured left strip faked with a pseudo-element is the same AI tell as border-left. Use a tinted surface, icon or heading.']);
    }
  }
  if (!MARKUP.has(ext)) return out;
  for (const m of text.matchAll(/<img\b[^>]*>/gis)) {
    if (!/\balt\s*=/.test(m[0])) out.push([lineOf(m.index), 'DL-IMG-ALT', 'P0', '<img> without alt. Describe it, or alt="" if decorative.']);
  }
  for (const m of text.matchAll(/<(div|span|li|td)\b[^>]*\bon[Cc]lick\b[^>]*>/gs)) {
    const tag = m[0];
    if (!/\brole\s*=/.test(tag) || !/\btab[Ii]ndex\s*=/.test(tag)) out.push([lineOf(m.index), 'DL-DIV-CLICK', 'P0', `<${m[1]} onClick> is not keyboard accessible. Use <button> (actions) or <a href> (navigation).`]);
  }
  for (const m of text.matchAll(/<button\b(?![^>]*\baria-label\b)[^>]*>\s*(<svg[\s\S]*?<\/svg>|<(Icon|[A-Z]\w*Icon|[A-Z]\w*)\b[^>]*\/>)\s*<\/button>/g)) {
    out.push([lineOf(m.index), 'DL-ICON-BUTTON', 'P0', 'Icon-only button without aria-label.']);
  }
  const headings = [...text.matchAll(/<h([1-6])\b/gi)].map((m) => ({ level: Number(m[1]), line: lineOf(m.index) }));
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length > 1) out.push([h1s[1].line, 'DL-H1-COUNT', 'P1', `${h1s.length} <h1> elements on one page. Use exactly one.`]);
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level > headings[i - 1].level + 1) {
      out.push([headings[i].line, 'DL-HEADING-SKIP', 'P2', `Heading jumps from h${headings[i - 1].level} to h${headings[i].level}. Keep levels sequential.`]);
    }
  }
  if (ext === '.html' || ext === '.htm') {
    if (/<body\b/i.test(text) && h1s.length === 0) out.push([1, 'DL-H1-COUNT', 'P1', 'Page has no <h1>.']);
    const html = text.match(/<html\b[^>]*>/i);
    if (html && !/\blang\s*=/.test(html[0])) out.push([lineOf(html.index), 'DL-NO-LANG', 'P1', '<html> without lang (e.g. lang="uk"). Screen readers pick the wrong voice.']);
    const head = text.match(/<head\b[^>]*>/i);
    if (head && !/<meta[^>]+name\s*=\s*["']viewport["']/i.test(text)) out.push([lineOf(head.index), 'DL-NO-VIEWPORT', 'P0', 'Missing <meta name="viewport" content="width=device-width, initial-scale=1">. Mobile renders at desktop width.']);
  }
  return out;
}

function collect(target, files) {
  let st;
  try { st = statSync(target); } catch { console.error(`design-lint: not found: ${target}`); process.exit(2); }
  if (st.isDirectory()) {
    for (const name of readdirSync(target)) {
      if (SKIP_DIRS.has(name)) continue;
      collect(join(target, name), files);
    }
  } else if (EXTS.has(extname(target).toLowerCase())) files.push(target);
}

// Suppress with a comment: `design-lint-disable-line [ID,ID]` on the line, or `design-lint-disable-next-line [ID]` above it.
function suppressions(lines) {
  const map = new Map();
  const add = (n, ids) => map.set(n, ids.length ? new Set(ids) : 'all');
  lines.forEach((l, i) => {
    const same = l.match(/design-lint-disable-line\b([^*\n>]*)/);
    const next = l.match(/design-lint-disable-next-line\b([^*\n>]*)/);
    const ids = (m) => (m[1].match(/DL-[A-Z0-9-]+/g) || []);
    if (same) add(i + 1, ids(same));
    if (next) add(i + 2, ids(next));
  });
  return map;
}

// Class/attribute rules that must see a whole tag: in markup, `className` often spans several lines
// (outline-none on one line, focus-visible:… on the next). These run per tag; lines inside tags skip them.
const TAG_RULES = new Set(['DL-OUTLINE', 'DL-GRADIENT-TEXT', 'DL-LILA', 'DL-VH', 'DL-100VW', 'DL-RAW-HEX']);

function tagSpans(text) {
  const spans = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '<' || !/[A-Za-z]/.test(text[i + 1] || '')) continue;
    let depth = 0;
    let quote = null;
    let j = i + 1;
    for (; j < text.length; j++) {
      const c = text[j];
      if (quote) { if (c === quote && text[j - 1] !== '\\') quote = null; continue; }
      if (c === '"' || c === "'" || c === '`') quote = c;
      else if (c === '{') depth++;
      else if (c === '}') depth = Math.max(0, depth - 1);
      else if (c === '>' && depth === 0) break;
    }
    spans.push({ start: i, end: Math.min(j, text.length - 1) });
    i = j;
  }
  return spans;
}

export function lintText(text, ext) {
  const lines = text.split(/\r?\n/);
  const off = suppressions(lines);
  const muted = (f) => { const s = off.get(f.line); return s === 'all' || (s && s.has(f.id)); };
  const findings = [];
  const markup = MARKUP.has(ext);
  const lineStarts = [0];
  for (let k = 0; k < text.length; k++) if (text[k] === '\n') lineStarts.push(k + 1);
  const lineAt = (offset) => { let lo = 0, hi = lineStarts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= offset) lo = mid; else hi = mid - 1; } return lo + 1; };
  const inTag = new Set();
  if (markup) {
    for (const span of tagSpans(text)) {
      const first = lineAt(span.start);
      const last = lineAt(span.end);
      for (let n = first; n <= last; n++) inTag.add(n);
      const tag = text.slice(span.start, span.end + 1).replace(/\s+/g, ' ');
      for (const [id, sev, test, msg, exts] of LINE_RULES) {
        if (!TAG_RULES.has(id) || (exts && !exts.has(ext))) continue;
        if (test(tag)) findings.push({ line: first, id, severity: sev, message: msg });
      }
    }
  }
  lines.forEach((line, i) => {
    for (const [id, sev, test, msg, exts] of LINE_RULES) {
      if (exts && !exts.has(ext)) continue;
      if (markup && TAG_RULES.has(id) && inTag.has(i + 1)) continue; // judged per tag above
      if (test(line)) findings.push({ line: i + 1, id, severity: sev, message: msg });
    }
  });
  for (const [line, id, severity, message] of fileRules(text, ext)) findings.push({ line, id, severity, message });
  return findings.filter((f) => !muted(f)).sort((a, b) => a.line - b.line || RANK[a.severity] - RANK[b.severity]);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const minArg = (args.find((a) => a.startsWith('--min=')) || '--min=P2').slice(6).toUpperCase();
  const targets = args.filter((a) => !a.startsWith('--'));
  if (!targets.length || !(minArg in RANK)) {
    console.error('Usage: node design-lint.mjs <file|dir> [...] [--json] [--min=P0|P1|P2]');
    process.exit(2);
  }
  const files = [];
  const display = new Map();
  for (const t of targets) {
    const before = files.length;
    collect(t, files);
    const isDir = statSync(t).isDirectory();
    for (const f of files.slice(before)) display.set(f, (isDir ? join(t, relative(t, f)) : t).replace(/\\/g, '/'));
  }
  const report = [];
  for (const f of files) {
    const ext = extname(f).toLowerCase();
    for (const finding of lintText(readFileSync(f, 'utf8'), ext)) {
      if (RANK[finding.severity] <= RANK[minArg]) report.push({ file: display.get(f), ...finding });
    }
  }
  const counts = { P0: 0, P1: 0, P2: 0 };
  report.forEach((r) => counts[r.severity]++);
  if (json) {
    console.log(JSON.stringify({ files: files.length, counts, findings: report }, null, 2));
  } else {
    for (const r of report) console.log(`${r.file}:${r.line}  ${r.severity}  ${r.id}  ${r.message}`);
    console.log(`design-lint: ${files.length} files · P0 ${counts.P0} · P1 ${counts.P1} · P2 ${counts.P2}`);
  }
  process.exit(counts.P0 ? 1 : 0);
}
