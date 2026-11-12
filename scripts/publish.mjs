#!/usr/bin/env node
// publish — creates the GitHub repositories that don't exist yet (core, addons, hub) and pushes `main` to each.
// Prints the plan by default; --run executes it. Needs the GitHub CLI logged in (`gh auth login`).
// Usage: node scripts/publish.mjs [--visibility private|public] [--only core,docs,hub] [--run]
//   Owner comes from hub.json. Existing repositories are only pushed (fast-forward; never forced).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { HUB, plugins, hubConfig, selected, argOpt } from './suite.mjs';

const args = process.argv.slice(2);
const run = args.includes('--run');
const visibility = argOpt(args, 'visibility', 'private');
if (!['private', 'public'].includes(visibility)) { console.error('publish: --visibility must be private or public'); process.exit(2); }
const { owner } = hubConfig();
if (!owner || owner === 'OWNER') { console.error('publish: set the owner first — node scripts/build-marketplace.mjs --owner <github user or org>'); process.exit(2); }
const gh = process.env.GH_PATH || (existsSync('C:\\Program Files\\GitHub CLI\\gh.exe') ? 'C:\\Program Files\\GitHub CLI\\gh.exe' : 'gh');
const sh = (bin, a, cwd) => spawnSync(bin, a, { cwd, encoding: 'utf8' });

const targets = [...plugins().map((p) => ({ short: p.short, name: p.dir, root: p.root, description: p.description })), { short: 'hub', name: 'perfect-hub', root: HUB, description: 'Perfect Suite hub: one Claude Code marketplace for the Perfect Programming core and its addons, plus install, check and pack scripts.' }];
const only = argOpt(args, 'only');
const list = only ? targets.filter((t) => only.split(',').includes(t.short) || only.split(',').includes(t.name)) : targets;

if (run && sh(gh, ['auth', 'status']).status !== 0) { console.error('publish: GitHub CLI is not logged in — run: gh auth login'); process.exit(2); }
let failed = 0;
for (const t of list) {
  if (sh('git', ['-C', t.root, 'status', '--porcelain']).stdout.trim()) { console.error(`skip ${t.name}: uncommitted changes`); failed++; continue; }
  const repo = `${owner}/${t.name}`;
  const exists = run ? sh(gh, ['repo', 'view', repo, '--json', 'name']).status === 0 : false;
  const hasOrigin = sh('git', ['-C', t.root, 'remote', 'get-url', 'origin']).status === 0;
  const steps = [];
  // GitHub caps descriptions at 350 characters: cut at a word boundary (sentence splitting trips on "incl.", "e.g.").
  const desc = t.description.length <= 350 ? t.description : `${t.description.slice(0, 349).replace(/[\s,;:(-]+\S*$/, '')}…`;
  if (!exists) steps.push([gh, ['repo', 'create', repo, `--${visibility}`, '--description', desc]]);
  if (!hasOrigin) steps.push(['git', ['-C', t.root, 'remote', 'add', 'origin', `https://github.com/${repo}.git`]]);
  steps.push(['git', ['-C', t.root, 'push', '-u', 'origin', 'main']]);
  let ok = true;
  for (const [bin, a] of steps) {
    const shown = `${bin === gh ? 'gh' : bin} ${a.map((x) => (/\s/.test(x) ? `"${x}"` : x)).join(' ')}`;
    if (!run) { console.log(shown); continue; }
    const r = sh(bin, a);
    if (r.status !== 0) { console.error(`fail ${t.name}: ${shown}\n${(r.stderr || r.stdout).trim()}`); failed++; ok = false; break; }
  }
  if (run && ok) console.log(`ok   ${t.name} → https://github.com/${repo}`);
}
process.exit(failed ? 1 : 0);
