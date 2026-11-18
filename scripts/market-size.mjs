#!/usr/bin/env node
// market-size — bottom-up TAM/SAM/SOM (or any chain of steps) from a JSON model where every number is
// declared as a cited fact, a labelled estimate or a definitional constant. Zero dependencies, Node >= 18.
//
// Usage:
//   node market-size.mjs model.json            Markdown report to stdout (exit 1 on any integrity error)
//   node market-size.mjs model.json --json     machine-readable result
//   node market-size.mjs --example             print an example model
//
// Model:
// {
//   "topic": "…", "currency": "UAH", "period": "year",
//   "sources": { "S1": { "title": "…", "url": "https://…", "accessed": "2026-11-12" } },
//   "inputs": {
//     "shops": { "value": 1000, "unit": "shops", "type": "fact", "source": "S1" },
//     "adoption": { "low": 0.1, "base": 0.15, "high": 0.2, "unit": "share", "type": "estimate", "basis": "why / formula" },
//     "months": { "value": 12, "unit": "months/year", "type": "constant" }
//   },
//   "steps": [ { "name": "tam", "label": "TAM", "formula": "shops * price * months" }, … ]
// }
// Rules: formulas may use + - * / ( ) and names of inputs or earlier steps — no literal numbers except 0 and 1
// (declare them as inputs so each one is cited, estimated or defined). "share" units must lie in [0, 1].

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// ---------- formula parsing (no eval) ----------
export function tokenize(src) {
  const tokens = [];
  const re = /\s*(?:([A-Za-z_][A-Za-z0-9_]*)|(\d+(?:\.\d+)?(?:e[+-]?\d+)?)|([-+*/()]))/gy;
  let m;
  let pos = 0;
  while (pos < src.length) {
    re.lastIndex = pos;
    m = re.exec(src);
    if (!m || m[0].length === 0) {
      if (/^\s*$/.test(src.slice(pos))) break;
      throw new Error(`unexpected character "${src.slice(pos).trim()[0]}" in formula "${src}"`);
    }
    if (m[1]) tokens.push({ t: 'id', v: m[1] });
    else if (m[2]) tokens.push({ t: 'num', v: m[2] });
    else tokens.push({ t: 'op', v: m[3] });
    pos = re.lastIndex;
  }
  return tokens;
}

// Returns an AST: { k: 'id', v } | { k: 'num', v } | { k: 'neg', a } | { k: 'bin', op, a, b }
export function parse(src) {
  const tokens = tokenize(src);
  let i = 0;
  const peek = () => tokens[i];
  const expect = (v) => { if (!peek() || peek().v !== v) throw new Error(`expected "${v}" in formula "${src}"`); i++; };
  function expr() {
    let node = term();
    while (peek() && (peek().v === '+' || peek().v === '-')) { const op = tokens[i++].v; node = { k: 'bin', op, a: node, b: term() }; }
    return node;
  }
  function term() {
    let node = factor();
    while (peek() && (peek().v === '*' || peek().v === '/')) { const op = tokens[i++].v; node = { k: 'bin', op, a: node, b: factor() }; }
    return node;
  }
  function factor() {
    const tok = peek();
    if (!tok) throw new Error(`formula "${src}" ends unexpectedly`);
    if (tok.v === '(') { i++; const node = expr(); expect(')'); return node; }
    if (tok.v === '-') { i++; return { k: 'neg', a: factor() }; }
    if (tok.t === 'id') { i++; return { k: 'id', v: tok.v }; }
    if (tok.t === 'num') { i++; return { k: 'num', v: Number(tok.v) }; }
    throw new Error(`unexpected "${tok.v}" in formula "${src}"`);
  }
  if (!tokens.length) throw new Error('empty formula');
  const ast = expr();
  if (i < tokens.length) throw new Error(`unexpected "${tokens[i].v}" in formula "${src}"`);
  return ast;
}

export function names(ast, out = new Set()) {
  if (ast.k === 'id') out.add(ast.v);
  if (ast.a) names(ast.a, out);
  if (ast.b) names(ast.b, out);
  return out;
}
// 0 and 1 are definitional (complements like 1 - p); every other number must be a declared input.
const hasLiteral = (ast) => (ast.k === 'num' && ast.v !== 0 && ast.v !== 1) || (ast.a && hasLiteral(ast.a)) || (ast.b && hasLiteral(ast.b));

export function evaluate(ast, env) {
  switch (ast.k) {
    case 'num': return ast.v;
    case 'id': if (!(ast.v in env)) throw new Error(`unknown name "${ast.v}"`); return env[ast.v];
    case 'neg': return -evaluate(ast.a, env);
    default: {
      const a = evaluate(ast.a, env); const b = evaluate(ast.b, env);
      if (ast.op === '+') return a + b;
      if (ast.op === '-') return a - b;
      if (ast.op === '*') return a * b;
      if (b === 0) throw new Error('division by zero');
      return a / b;
    }
  }
}

// Formula with values substituted, for the "show the calculation" line.
export function substitute(ast, env, fmtNum) {
  const prec = (n) => (n.k === 'bin' ? (n.op === '+' || n.op === '-' ? 1 : 2) : 3);
  const go = (n, parent) => {
    if (n.k === 'num') return fmtNum(n.v);
    if (n.k === 'id') return fmtNum(env[n.v]);
    if (n.k === 'neg') return `-${go(n.a, { prec: 3 })}`;
    const sym = { '+': '+', '-': '−', '*': '×', '/': '÷' }[n.op];
    const s = `${go(n.a, { prec: prec(n), op: n.op })} ${sym} ${go(n.b, { prec: prec(n), op: n.op, right: true })}`;
    const wrap = prec(n) < parent.prec || (parent.right && prec(n) === parent.prec && (parent.op === '-' || parent.op === '/'));
    return wrap ? `(${s})` : s;
  };
  return go(ast, { prec: 0 });
}

// ---------- model validation and computation ----------
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SCENARIOS = ['low', 'base', 'high'];

export function validate(model) {
  const errors = [];
  if (!model || typeof model !== 'object') return ['model must be a JSON object'];
  const sources = model.sources || {};
  for (const [id, s] of Object.entries(sources)) {
    if (!s || typeof s.url !== 'string' || !/^https?:\/\//.test(s.url)) errors.push(`source ${id}: url (http/https) required`);
    if (!s || !DATE_RE.test(s.accessed || '')) errors.push(`source ${id}: accessed date YYYY-MM-DD required`);
  }
  const inputs = model.inputs || {};
  if (!Object.keys(inputs).length) errors.push('inputs: at least one input required');
  for (const [name, inp] of Object.entries(inputs)) {
    const where = `input ${name}`;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) errors.push(`${where}: name must be letters, digits, underscore`);
    if (!['fact', 'estimate', 'constant'].includes(inp.type)) { errors.push(`${where}: type must be fact, estimate or constant`); continue; }
    const hasValue = typeof inp.value === 'number';
    const hasRange = typeof inp.base === 'number';
    if (hasValue === hasRange) { errors.push(`${where}: give either "value" or "low"/"base"/"high"`); continue; }
    const v = hasValue ? { low: inp.value, base: inp.value, high: inp.value } : { low: inp.low ?? inp.base, base: inp.base, high: inp.high ?? inp.base };
    if (!SCENARIOS.every((k) => Number.isFinite(v[k]))) errors.push(`${where}: values must be finite numbers`);
    else if (!(v.low <= v.base && v.base <= v.high)) errors.push(`${where}: need low <= base <= high`);
    if (inp.unit === 'share' && SCENARIOS.some((k) => v[k] < 0 || v[k] > 1)) errors.push(`${where}: a share must be between 0 and 1`);
    if (inp.type === 'fact') {
      if (!inp.source) errors.push(`${where}: a fact needs a "source" id — unsourced numbers are not allowed (or label it an estimate with a basis)`);
      else if (!sources[inp.source]) errors.push(`${where}: source "${inp.source}" is not in "sources"`);
    }
    if (inp.type === 'estimate' && !(typeof inp.basis === 'string' && inp.basis.trim().length >= 10)) errors.push(`${where}: an estimate needs a "basis" (formula or reasoning, >= 10 characters)`);
    if (inp.type === 'constant' && hasRange) errors.push(`${where}: a constant has one value, not a range`);
  }
  const steps = model.steps || [];
  if (!steps.length) errors.push('steps: at least one step required');
  const known = new Set(Object.keys(inputs));
  for (const [idx, st] of steps.entries()) {
    const where = `step ${st && st.name ? st.name : `#${idx + 1}`}`;
    if (!st || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(st.name || '')) { errors.push(`${where}: name required (letters, digits, underscore)`); continue; }
    if (known.has(st.name)) errors.push(`${where}: name already used`);
    let ast;
    try { ast = parse(String(st.formula || '')); } catch (e) { errors.push(`${where}: ${e.message}`); known.add(st.name); continue; }
    if (hasLiteral(ast)) errors.push(`${where}: literal numbers other than 0 and 1 are not allowed — declare each number as an input (fact, estimate or constant)`);
    for (const n of names(ast)) if (!known.has(n)) errors.push(`${where}: unknown name "${n}" (inputs and earlier steps only)`);
    known.add(st.name);
  }
  return errors;
}

const valuesFor = (inp) => (typeof inp.value === 'number' ? { low: inp.value, base: inp.value, high: inp.value } : { low: inp.low ?? inp.base, base: inp.base, high: inp.high ?? inp.base });

function runSteps(model, env0) {
  const env = { ...env0 };
  const out = {};
  for (const st of model.steps) { env[st.name] = evaluate(parse(st.formula), env); out[st.name] = env[st.name]; }
  return { env, out };
}

export function compute(model) {
  const errors = validate(model);
  if (errors.length) { const e = new Error(errors.join('\n')); e.errors = errors; throw e; }
  const vals = Object.fromEntries(Object.entries(model.inputs).map(([n, inp]) => [n, valuesFor(inp)]));
  const scenarios = {};
  const envs = {};
  for (const sc of SCENARIOS) {
    const { env, out } = runSteps(model, Object.fromEntries(Object.entries(vals).map(([n, v]) => [n, v[sc]])));
    scenarios[sc] = out; envs[sc] = env;
  }
  const last = model.steps[model.steps.length - 1].name;
  const baseEnv = Object.fromEntries(Object.entries(vals).map(([n, v]) => [n, v.base]));
  const sensitivity = Object.entries(vals)
    .filter(([, v]) => v.low !== v.high)
    .map(([n, v]) => {
      const atLow = runSteps(model, { ...baseEnv, [n]: v.low }).out[last];
      const atHigh = runSteps(model, { ...baseEnv, [n]: v.high }).out[last];
      return { input: n, atLow, atHigh, swing: Math.abs(atHigh - atLow) };
    })
    .sort((a, b) => b.swing - a.swing);
  const counts = { fact: 0, estimate: 0, constant: 0 };
  for (const inp of Object.values(model.inputs)) counts[inp.type]++;
  return { scenarios, baseEnv: envs.base, last, sensitivity, counts };
}

// ---------- report ----------
export const fmt = (x) => {
  if (!Number.isFinite(x)) return String(x);
  const abs = Math.abs(x);
  const digits = abs !== 0 && abs < 1 ? 4 : abs < 100 ? 2 : 0;
  const [int, dec] = Math.abs(x).toFixed(digits).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const trimmed = dec ? dec.replace(/0+$/, '') : '';
  return `${x < 0 ? '-' : ''}${grouped}${trimmed ? `.${trimmed}` : ''}`;
};

export function report(model, res) {
  const cur = model.currency ? ` ${model.currency}` : '';
  const lines = [];
  lines.push(`# Market size: ${model.topic || 'untitled'}`);
  lines.push(`Currency: ${model.currency || 'n/a'} · Period: ${model.period || 'n/a'} · Computed by scripts/market-size.mjs`);
  lines.push('', '## Inputs', '| Name | Low | Base | High | Unit | Type | Source / basis |', '|---|---|---|---|---|---|---|');
  for (const [n, inp] of Object.entries(model.inputs)) {
    const v = valuesFor(inp);
    const src = inp.type === 'fact' ? `[${inp.source}] ${model.sources[inp.source].title || model.sources[inp.source].url}` : inp.type === 'estimate' ? `Estimate: ${inp.basis}` : 'Definition';
    lines.push(`| ${n} | ${fmt(v.low)} | ${fmt(v.base)} | ${fmt(v.high)} | ${inp.unit || ''} | ${inp.type} | ${src} |`);
  }
  lines.push('', '## Calculation (base scenario)');
  for (const st of model.steps) {
    const ast = parse(st.formula);
    const label = st.label || st.name;
    lines.push('```', `${label} = ${st.formula.replace(/\*/g, '×').replace(/\//g, '÷')}`, `${' '.repeat(label.length)} = ${substitute(ast, res.baseEnv, fmt)}`, `${' '.repeat(label.length)} = ${fmt(res.scenarios.base[st.name])}${st.unit ? ` ${st.unit}` : cur}`, '```');
  }
  lines.push('', '## Scenarios', '| Step | All-low corner | Base | All-high corner |', '|---|---|---|---|');
  for (const st of model.steps) lines.push(`| ${st.label || st.name} | ${fmt(res.scenarios.low[st.name])} | ${fmt(res.scenarios.base[st.name])} | ${fmt(res.scenarios.high[st.name])} |`);
  lines.push('', 'Corners set every ranged input to its low (or high) value at once — they bound the model, they are not probabilities.');
  if (res.sensitivity.length) {
    const lastLabel = model.steps[model.steps.length - 1].label || res.last;
    lines.push('', `## Sensitivity of ${lastLabel} (one input at a time, others at base)`, '| Input | At low | At high | Swing |', '|---|---|---|---|');
    for (const s of res.sensitivity) lines.push(`| ${s.input} | ${fmt(s.atLow)} | ${fmt(s.atHigh)} | ${fmt(s.swing)} |`);
  }
  lines.push('', '## Integrity', `Facts: ${res.counts.fact} (each cited with URL and access date) · Estimates: ${res.counts.estimate} (labelled, basis given) · Constants: ${res.counts.constant}`);
  lines.push('', '## Sources');
  for (const [id, s] of Object.entries(model.sources || {})) lines.push(`- [${id}] ${s.title || ''} — ${s.url} (accessed ${s.accessed})`);
  return lines.join('\n');
}

export const EXAMPLE = {
  topic: 'CRM subscriptions for small online shops (illustrative numbers — replace every value with your own sourced data)',
  currency: 'UAH',
  period: 'year',
  sources: { S1: { title: 'Replace with the registry or report that counts the shops', url: 'https://example.org/replace-me', accessed: '2026-11-12' } },
  inputs: {
    shops: { value: 20000, unit: 'shops', type: 'fact', source: 'S1' },
    price_month: { value: 400, unit: 'UAH/month', type: 'fact', source: 'S1' },
    months: { value: 12, unit: 'months/year', type: 'constant' },
    fit_share: { low: 0.3, base: 0.4, high: 0.5, unit: 'share', type: 'estimate', basis: 'Share of shops selling via Instagram/Telegram, from 12 interviews (5 of 12) — widened ±0.1' },
    win_share: { low: 0.02, base: 0.05, high: 0.08, unit: 'share', type: 'estimate', basis: 'Share of SAM winnable in 3 years given 2 sales reps; analogous to competitor X customer count / SAM' },
  },
  steps: [
    { name: 'tam', label: 'TAM', formula: 'shops * price_month * months' },
    { name: 'sam', label: 'SAM', formula: 'tam * fit_share' },
    { name: 'som', label: 'SOM', formula: 'sam * win_share' },
  ],
};

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const args = process.argv.slice(2);
  try {
    if (args.includes('--example')) { console.log(JSON.stringify(EXAMPLE, null, 2)); process.exit(0); }
    const file = args.find((a) => !a.startsWith('--'));
    if (!file) throw new Error('usage: node market-size.mjs model.json [--json] | --example');
    const model = JSON.parse(readFileSync(file, 'utf8'));
    const res = compute(model);
    console.log(args.includes('--json') ? JSON.stringify(res, null, 2) : report(model, res));
  } catch (e) {
    console.error(`market-size: ${e.errors ? `${e.errors.length} integrity error(s):\n- ${e.errors.join('\n- ')}` : e.message}`);
    process.exit(1);
  }
}
