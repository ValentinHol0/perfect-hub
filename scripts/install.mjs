#!/usr/bin/env node
// install — installs the Perfect Suite (core + chosen addons) into Claude Code and/or Antigravity.
// Prints the commands by default; add --run to execute them one by one (stops at the first failure).
// Usage: node scripts/install.mjs [--claude] [--antigravity] [--only core,selling,docs] [--source local|github]
//                                 [--scope user|project|local] [--run]
//   --claude / --antigravity   target harness (default: both)
//   --only                     short names (core, selling, ads, docs, legal, business, brand, social, marketing,
//                              research, translate, teach) or full plugin names; default: everything found
//   --source local             (default) install from the folders next to this hub
//   --source github            install from GitHub through the hub marketplace (needs the repos published and
//                              hub.json "owner" set — see build-marketplace.mjs)
import { spawnSync } from 'node:child_process';
import { plugins, hubConfig, selected, argOpt } from './suite.mjs';

const args = process.argv.slice(2);
const both = !args.includes('--claude') && !args.includes('--antigravity');
const toClaude = both || args.includes('--claude');
const toAgy = both || args.includes('--antigravity');
const source = argOpt(args, 'source', 'local');
const scope = argOpt(args, 'scope', 'user');
const list = selected(plugins(), argOpt(args, 'only'));
const cfg = hubConfig();
if (!list.length) { console.error('install: no matching plugins'); process.exit(2); }
if (source === 'github' && cfg.owner === 'OWNER') { console.error('install: hub.json owner is still OWNER — publish the repositories and run build-marketplace.mjs --owner <github owner> first'); process.exit(2); }
if (!list.some((p) => p.short === 'core') && argOpt(args, 'only')) console.warn('note: addons work alone, but code, sites and apps they hand off need the core (perfect-programming-plugin).');

const claude = process.env.CLAUDE_CODE_EXECPATH || 'claude';
const agy = process.env.AGY_PATH || 'agy';
const steps = [];
if (toClaude) {
  if (source === 'github') {
    steps.push([claude, ['plugin', 'marketplace', 'add', `${cfg.owner}/perfect-hub`, '--scope', scope]]);
    for (const p of list) steps.push([claude, ['plugin', 'install', `${p.name}@${cfg.marketplace || 'perfect-suite'}`, '--scope', scope]]);
  } else for (const p of list) steps.push([claude, ['plugin', 'install', p.name, '--marketplace', p.root, '--scope', scope]]);
}
if (toAgy) for (const p of list) steps.push([agy, ['plugin', 'install', source === 'github' ? `https://github.com/${cfg.owner}/${p.dir}` : p.root]]);

const show = (bin, a) => [bin === claude ? 'claude' : bin === agy ? 'agy' : bin, ...a.map((x) => (/\s/.test(x) ? `"${x}"` : x))].join(' ');
if (!args.includes('--run')) {
  console.log(`# Perfect Suite install (${list.map((p) => p.short).join(', ')}) — run these, or re-run with --run\n`);
  for (const [bin, a] of steps) console.log(show(bin, a));
  if (toClaude) console.log('\n# Claude Code: restart the session (or /reload-plugins) to load them. claude.ai organisation plugins: upload the zips from scripts/pack.mjs instead.');
  process.exit(0);
}
for (const [bin, a] of steps) {
  console.log(`> ${show(bin, a)}`);
  const r = spawnSync(bin, a, { stdio: 'inherit', shell: process.platform === 'win32' && !/\.exe$/i.test(bin) });
  if (r.status !== 0) { console.error(`install: failed (${r.status ?? r.error?.message}) — stopped`); process.exit(1); }
}
console.log(`install: ${list.length} plugin(s) installed`);
