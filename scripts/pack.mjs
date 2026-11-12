#!/usr/bin/env node
// pack — zips each plugin's committed HEAD (git archive) into dist/<plugin>-<version>.zip, ready to upload as a
// claude.ai organisation plugin (the zip root contains .claude-plugin/) or to hand to an Antigravity user.
// Refuses plugins with uncommitted changes unless --allow-dirty (which still packs HEAD, not the working tree).
// Usage: node scripts/pack.mjs [--only core,docs] [--allow-dirty]
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { HUB, plugins, selected, argOpt } from './suite.mjs';

const args = process.argv.slice(2);
const dist = join(HUB, 'dist');
mkdirSync(dist, { recursive: true });
let bad = 0;
for (const p of selected(plugins(), argOpt(args, 'only'))) {
  const status = spawnSync('git', ['-C', p.root, 'status', '--porcelain'], { encoding: 'utf8' });
  if (status.status !== 0) { console.error(`skip ${p.name}: not a git repository`); bad++; continue; }
  if (status.stdout.trim() && !args.includes('--allow-dirty')) { console.error(`skip ${p.name}: uncommitted changes (commit first, or --allow-dirty to pack HEAD anyway)`); bad++; continue; }
  const out = join(dist, `${p.name}-${p.version}.zip`);
  const r = spawnSync('git', ['-C', p.root, 'archive', '--format=zip', '-o', out, 'HEAD'], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(`fail ${p.name}: ${r.stderr.trim()}`); bad++; continue; }
  console.log(out);
}
process.exit(bad ? 1 : 0);
