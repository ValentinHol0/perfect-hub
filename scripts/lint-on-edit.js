#!/usr/bin/env node
/**
 * lint-on-edit.js — PostToolUse hook (Claude Code, matcher Edit|Write|MultiEdit). OPT-IN.
 * Active only when `.design/lint-on-edit` exists in the project (absolute-designer creates it for UI builds).
 * After an edit to a UI file it runs design-lint on that file; P0 findings are fed back to Claude so they
 * get fixed immediately. Silent otherwise; never blocks on its own errors.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const UI = /\.(html?|jsx|tsx|vue|svelte|astro|css|scss)$/i;

try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const cwd = input.cwd || process.cwd();
  if (!fs.existsSync(path.join(cwd, '.design', 'lint-on-edit'))) process.exit(0);
  const file = input.tool_input && (input.tool_input.file_path || input.tool_input.path);
  if (!file || !UI.test(file) || !fs.existsSync(file)) process.exit(0);

  const lint = path.join(__dirname, 'design-lint.mjs');
  const run = spawnSync(process.execPath, [lint, file, '--json', '--min=P0'], { encoding: 'utf8', timeout: 15000 });
  const report = JSON.parse(run.stdout || '{}');
  const findings = (report.findings || []).filter((f) => f.severity === 'P0');
  if (!findings.length) process.exit(0);
  const lines = findings.slice(0, 10).map((f) => `- ${f.file}:${f.line} ${f.id} — ${f.message}`);
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: `design-lint found ${findings.length} P0 issue(s) in the file you just edited. Fix them now (or add a design-lint-disable-line comment with the reason if it is intentional):\n${lines.join('\n')}`,
  }));
} catch {
  /* silent */
}
process.exit(0);
