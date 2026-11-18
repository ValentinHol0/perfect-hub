#!/usr/bin/env node
// run-evals — headless evals for PPP with the Claude Code CLI (`claude -p`), loading THIS folder via --plugin-dir.
//
//   node scripts/run-evals.mjs routing  [--limit N] [--id K] [--model sonnet] [--budget 0.40] [--bare]
//       Runs skills/absolute/evals/evals.json as DRY RUNS (plan permission mode, an instruction not to change
//       anything) and checks each eval's "contains" assertions against the final answer.
//   node scripts/run-evals.mjs triggers [--limit N] [--model sonnet] [--budget 0.15] [--bare]
//       Runs evals/triggers.json ({query, expect}) and checks which PPP skill the model invoked
//       (expect: "<skill-name>" or null for "no PPP skill").
// Each case runs in an empty temp folder, so no project is touched. Costs real tokens — cap with --limit/--budget.
// --bare skips installed plugins/hooks (avoids clashes with an older installed PPP) but may need API-key auth.
// Writes a JSON report to evals/results/<mode>-<timestamp>.json. Exit 1 if any case fails, 2 on usage error.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [mode, ...rest] = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 && rest[i + 1] !== undefined ? rest[i + 1] : fallback;
};
const bare = rest.includes('--bare');
const claude = process.env.CLAUDE_BIN || process.env.CLAUDE_CODE_EXECPATH || 'claude';
const model = opt('model');

if (!['routing', 'triggers'].includes(mode)) {
  console.error('Usage: node scripts/run-evals.mjs routing|triggers [--limit N] [--id K] [--model sonnet] [--budget USD] [--bare]');
  process.exit(2);
}

const DRY_RUN = '\n\n[EVAL DRY RUN] Do not create, modify or delete files, do not run commands that change anything, do not dispatch subagents and do not ask questions. Perform only the /absolute intake and routing, then output: the Route line, tier, flags, rulings/assumptions, and the first 3 concrete actions you would take with tool names.';

function runClaude(prompt, { streamJson, budget }) {
  const cwd = mkdtempSync(join(tmpdir(), 'ppp-eval-'));
  const args = ['-p', prompt, '--plugin-dir', ROOT, '--permission-mode', 'plan', '--no-session-persistence', '--max-budget-usd', String(budget)];
  args.push('--output-format', streamJson ? 'stream-json' : 'json');
  if (streamJson) args.push('--verbose');
  if (model) args.push('--model', model);
  if (bare) args.push('--bare');
  const started = Date.now();
  const r = spawnSync(claude, args, { cwd, encoding: 'utf8', timeout: 10 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 });
  rmSync(cwd, { recursive: true, force: true });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  if (/Not logged in|Please run \/login|Invalid API key|authentication/i.test(out)) {
    console.error('run-evals: the claude CLI is not authenticated in this shell. Run `claude` once in a terminal and /login (or set ANTHROPIC_API_KEY), or point CLAUDE_BIN at an authenticated CLI. Nothing was evaluated.');
    process.exit(2);
  }
  return { ...r, seconds: Math.round((Date.now() - started) / 1000) };
}

function finalText(stdout) {
  try { return String(JSON.parse(stdout).result || ''); } catch { /* fall through */ }
  const lines = stdout.trim().split(/\r?\n/).reverse();
  for (const l of lines) { try { const j = JSON.parse(l); if (j.type === 'result') return String(j.result || ''); } catch { /* skip */ } }
  return stdout;
}

function invokedSkills(stdout) {
  const skills = [];
  for (const line of stdout.split(/\r?\n/)) {
    let ev;
    try { ev = JSON.parse(line); } catch { continue; }
    const blocks = ev?.message?.content;
    if (ev.type !== 'assistant' || !Array.isArray(blocks)) continue;
    for (const b of blocks) {
      if (b.type === 'tool_use' && b.name === 'Skill' && b.input?.skill) skills.push(String(b.input.skill).replace(/^perfect-hub:/, ''));
    }
  }
  return skills;
}

const results = [];
if (mode === 'routing') {
  let cases = JSON.parse(readFileSync(join(ROOT, 'skills', 'absolute', 'evals', 'evals.json'), 'utf8')).evals;
  if (opt('id') !== undefined) cases = cases.filter((c) => String(c.id) === opt('id'));
  cases = cases.slice(0, Number(opt('limit', cases.length)));
  for (const c of cases) {
    const r = runClaude(c.prompt + DRY_RUN, { streamJson: false, budget: Number(opt('budget', '0.40')) });
    const text = finalText(r.stdout || '');
    const checks = (c.assertions || []).map((a) => ({ name: a.name, pass: text.toLowerCase().includes(String(a.value).toLowerCase()) }));
    const pass = r.status === 0 && checks.every((x) => x.pass);
    results.push({ id: c.id, prompt: c.prompt, pass, checks, seconds: r.seconds, exit: r.status, answer: text.slice(0, 1500), stderr: (r.stderr || '').slice(-400) });
    console.log(`${pass ? 'PASS' : 'FAIL'}  #${c.id}  ${c.prompt.slice(0, 60)}  ${checks.map((x) => `${x.name}:${x.pass ? 'ok' : 'x'}`).join(' ')}  (${r.seconds}s)`);
  }
} else {
  let cases = JSON.parse(readFileSync(join(ROOT, 'evals', 'triggers.json'), 'utf8'));
  cases = cases.slice(0, Number(opt('limit', cases.length)));
  for (const c of cases) {
    const r = runClaude(c.query + '\n\n[EVAL] Do not modify anything; if a skill applies, load it, then stop after one sentence.', { streamJson: true, budget: Number(opt('budget', '0.15')) });
    const skills = invokedSkills(r.stdout || '');
    const ppp = skills.filter((s) => !s.includes(':'));
    const pass = c.expect === null ? ppp.length === 0 : ppp.includes(c.expect);
    results.push({ query: c.query, expect: c.expect, invoked: skills, pass, seconds: r.seconds, exit: r.status });
    console.log(`${pass ? 'PASS' : 'FAIL'}  expect=${c.expect ?? 'none'}  got=${skills.join(',') || 'none'}  "${c.query.slice(0, 60)}"  (${r.seconds}s)`);
  }
}

const passed = results.filter((r) => r.pass).length;
console.log(`run-evals ${mode}: ${passed}/${results.length} passed`);
const outDir = join(ROOT, 'evals', 'results');
mkdirSync(outDir, { recursive: true });
const file = join(outDir, `${mode}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
writeFileSync(file, JSON.stringify({ mode, model: model || 'default', bare, results }, null, 2));
console.log(`report: ${file}`);
process.exit(passed === results.length ? 0 : 1);
