#!/usr/bin/env node
// WCAG 2.x contrast checker for design tokens. Zero dependencies. Same behaviour in Claude Code and Antigravity.
//
// Pair mode:   node contrast.mjs "#111111" "#F4F4F0" [--ui | --min=3]
// Role mode:   node contrast.mjs bg=#F4F4F0 surface=#FFFFFF ink=#111111 muted=#5B5B57 accent=#E61919 accent-ink=#FFFFFF border=#D6D6D0
//              optional roles: focus, control-border, positive, negative, warning
// CSS mode:    node contrast.mjs --css src/styles/tokens.css [--scope=dark]
//              reads --bg / --color-bg … ; --scope=dark reads the block after `prefers-color-scheme: dark`, `[data-theme="dark"]` or `.dark`
// Colors: #rgb, #rrggbb, rgb(r g b) / rgb(r,g,b), oklch(L C H) with L in 0..1 or %.
// Exit: 0 all required pairs pass · 1 a required pair fails · 2 usage error.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const clamp01 = (x) => Math.min(1, Math.max(0, x));

function oklchToRgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((c) => {
    const v = clamp01(c);
    return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
  });
}

export function parseColor(input) {
  const s = String(input).trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) {
    const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (m) return m.slice(1, 4).map(Number);
  m = s.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/);
  if (m) return oklchToRgb(m[2] ? Number(m[1]) / 100 : Number(m[1]), Number(m[3]), Number(m[4]));
  throw new Error(`Unsupported color: ${input}`);
}

function luminance([r, g, b]) {
  const ch = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

export function contrast(a, b) {
  const [l1, l2] = [luminance(parseColor(a)), luminance(parseColor(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [foreground role, background role, minimum ratio, label]; minimum ≤ 1.2 = advisory (WARN, never fails)
const ROLE_PAIRS = [
  ['ink', 'bg', 4.5, 'body text on page'],
  ['ink', 'surface', 4.5, 'body text on cards'],
  ['muted', 'bg', 4.5, 'secondary text on page'],
  ['muted', 'surface', 4.5, 'secondary text on cards'],
  ['accent-ink', 'accent', 4.5, 'label on primary button'],
  ['accent', 'bg', 3.0, 'accent as UI/large text on page'],
  ['accent', 'surface', 3.0, 'accent as UI/large text on cards'],
  ['focus', 'bg', 3.0, 'focus ring on page'],
  ['focus', 'surface', 3.0, 'focus ring on cards'],
  ['control-border', 'surface', 3.0, 'input/control outline (WCAG 1.4.11)'],
  ['control-border', 'bg', 3.0, 'input/control outline on page'],
  ['positive', 'surface', 4.5, 'success text'],
  ['negative', 'surface', 4.5, 'error text'],
  ['warning', 'surface', 4.5, 'warning text'],
  ['border', 'bg', 1.2, 'hairline border visible (decorative, not WCAG)'],
  ['border', 'surface', 1.2, 'hairline border on cards (decorative, not WCAG)'],
];
export const ROLES = [...new Set(ROLE_PAIRS.flatMap(([a, b]) => [a, b]))];

function darkBlock(css) {
  const markers = [/prefers-color-scheme\s*:\s*dark/i, /\[data-theme=["']?dark["']?\]/i, /(^|[\s,}])\.dark\s*[{,]/];
  for (const re of markers) {
    const m = css.match(re);
    if (!m) continue;
    const start = css.indexOf('{', m.index);
    let depth = 0;
    for (let i = start; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1);
    }
  }
  return null;
}

export function readCssTokens(css, scope = 'light') {
  const source = scope === 'dark' ? darkBlock(css) : css;
  if (source === null) throw new Error('No dark block found (prefers-color-scheme: dark, [data-theme="dark"] or .dark)');
  const tokens = {};
  for (const role of ROLES) {
    const m = source.match(new RegExp(`--(?:color-)?${role}\\s*:\\s*([^;}]+)[;}]`, 'i'));
    if (m) tokens[role] = m[1].trim();
  }
  if (scope === 'dark') {
    // roles not overridden in the dark block inherit the light values
    const light = readCssTokens(css, 'light');
    for (const r of Object.keys(light)) if (!(r in tokens)) tokens[r] = light[r];
  }
  return tokens;
}

export function report(tokens, log = console.log) {
  let failed = false;
  const rows = [];
  for (const key of Object.keys(tokens)) {
    if (!ROLES.includes(key)) rows.push(`WARN  unknown role "${key}" ignored (known: ${ROLES.join(', ')})`);
  }
  let checked = 0;
  for (const [fg, bg, min, label] of ROLE_PAIRS) {
    if (!tokens[fg] || !tokens[bg]) continue;
    checked++;
    const ratio = contrast(tokens[fg], tokens[bg]);
    const ok = ratio >= min;
    const advisory = min <= 1.2;
    if (!ok && !advisory) failed = true;
    const verdict = ok ? 'PASS' : advisory ? 'WARN' : 'FAIL';
    rows.push(`${verdict}  ${ratio.toFixed(2).padStart(5)}:1  (min ${min})  ${fg} on ${bg}  — ${label}`);
  }
  if (!checked) throw new Error(`No recognised role pairs. Roles: ${ROLES.join(' ')}`);
  log(rows.join('\n'));
  return failed;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const args = process.argv.slice(2);
  const flags = args.filter((a) => a.startsWith('--'));
  const positional = args.filter((a) => !a.startsWith('--'));
  try {
    if (!args.length || flags.includes('--help') || args.includes('-h')) {
      console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 11).join('\n'));
      process.exit(0);
    }
    let failed;
    if (flags.includes('--css')) {
      const scope = (flags.find((f) => f.startsWith('--scope=')) || '--scope=light').slice(8);
      const file = positional[0];
      if (!file) throw new Error('--css needs a file path');
      failed = report(readCssTokens(readFileSync(file, 'utf8'), scope));
    } else if (positional.length && positional.every((a) => a.includes('='))) {
      failed = report(Object.fromEntries(positional.map((a) => a.split('=').map((s) => s.trim()))));
    } else if (positional.length === 2) {
      const minFlag = flags.find((f) => f.startsWith('--min='));
      const min = minFlag ? Number(minFlag.slice(6)) : flags.includes('--ui') ? 3 : 4.5;
      const r = contrast(positional[0], positional[1]);
      console.log(`${r.toFixed(2)}:1  normal-text AA ${r >= 4.5 ? 'PASS' : 'FAIL'} · AAA ${r >= 7 ? 'PASS' : 'FAIL'} · large-text/UI AA ${r >= 3 ? 'PASS' : 'FAIL'}  (gate: ${min}:1)`);
      failed = r < min;
    } else {
      throw new Error('Expected two colors, role=value pairs, or --css <file>.');
    }
    process.exit(failed ? 1 : 0);
  } catch (err) {
    console.error(`contrast: ${err.message}`);
    process.exit(2);
  }
}
