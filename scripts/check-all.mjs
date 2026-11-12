#!/usr/bin/env node
// check-all — one gate for the whole suite: every plugin's self-check (both harnesses) and script tests, shared-file
// drift between core and addons, and the hub marketplace being current. Exit 1 if anything fails.
// Usage: node scripts/check-all.mjs [--external] [--only core,selling] [--json]
//   --external  also run `claude plugin validate` and `agy plugin validate --strict` inside each self-check
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { HUB, SUITE, CORE, plugins, selected, argOpt } from './suite.mjs';

const args = process.argv.slice(2);
const list = selected(plugins(), argOpt(args, 'only'));
const node = (cwd, a) => spawnSync(process.execPath, a, { cwd, encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 });
const rows = [];
let failed = false;
for (const p of list) {
  const chk = node(p.root, ['scripts/check-plugin.mjs', ...(args.includes('--external') ? ['--external'] : [])]);
  const summary = (chk.stdout + chk.stderr).split('\n').reverse().find((l) => l.startsWith('check-plugin:')) || 'no summary';
  const testDir = join(p.root, 'scripts', 'tests');
  const files = existsSync(testDir) ? readdirSync(testDir).filter((f) => f.endsWith('.test.mjs')).map((f) => join('scripts', 'tests', f)) : [];
  let tests = 'none';
  if (files.length) {
    const t = node(p.root, ['--test', ...files]);
    const n = (k) => (t.stdout.match(new RegExp(`^# ${k} (\\d+)`, 'm')) || [])[1] || '?';
    tests = `${n('pass')}/${n('tests')} pass${n('skipped') !== '0' && n('skipped') !== '?' ? `, ${n('skipped')} skipped` : ''}`;
    if (t.status !== 0) { failed = true; tests += ' — FAIL'; }
  }
  const git = spawnSync('git', ['-C', p.root, 'status', '--porcelain'], { encoding: 'utf8' });
  const gitState = git.status !== 0 ? 'no git' : git.stdout.trim() ? `${git.stdout.trim().split('\n').length} changed` : 'clean';
  if (chk.status !== 0) failed = true;
  rows.push({ plugin: p.name, version: p.version, check: summary.replace('check-plugin: ', '') + (chk.status !== 0 ? ' — FAIL' : ''), tests, git: gitState, leftovers: existsSync(join(p.root, '_source')) ? '_source/ still present' : '' });
  if (existsSync(join(p.root, '_source'))) failed = true;
}
const sync = node(join(SUITE, CORE), ['scripts/sync-addons.mjs', '--check']);
if (sync.status !== 0) failed = true;
const market = node(HUB, ['scripts/build-marketplace.mjs', '--check']);
if (market.status !== 0) failed = true;

if (args.includes('--json')) console.log(JSON.stringify({ rows, sync: sync.stdout.trim(), marketplace: (market.stdout + market.stderr).trim(), ok: !failed }, null, 2));
else {
  console.log('| Plugin | Version | Self-check | Tests | Git |');
  console.log('|---|---|---|---|---|');
  for (const r of rows) console.log(`| ${r.plugin} | ${r.version} | ${r.check}${r.leftovers ? ` · ${r.leftovers}` : ''} | ${r.tests} | ${r.git} |`);
  console.log(`\nshared files: ${sync.stdout.trim().split('\n').pop()}${sync.status ? '\n' + sync.stdout.trim() : ''}`);
  console.log(`marketplace: ${(market.stdout + market.stderr).trim()}`);
  console.log(failed ? '\ncheck-all: FAIL' : '\ncheck-all: OK');
}
process.exit(failed ? 1 : 0);
