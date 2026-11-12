#!/usr/bin/env node
// build-marketplace — writes the hub's .claude-plugin/marketplace.json from the sibling plugin manifests, so one
// `claude plugin marketplace add <owner>/perfect-hub` offers the core and every addon at their current versions.
// Usage: node scripts/build-marketplace.mjs [--owner <github owner>] [--check]
//   --owner  GitHub user/org that hosts the plugin repositories (saved to hub.json for next time)
//   --check  exit 1 if marketplace.json is out of date (versions/descriptions changed) — run before a release
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { HUB, CORE, plugins, hubConfig, argOpt } from './suite.mjs';

const args = process.argv.slice(2);
const cfg = hubConfig();
const owner = argOpt(args, 'owner', cfg.owner);
if (argOpt(args, 'owner')) writeFileSync(join(HUB, 'hub.json'), JSON.stringify({ ...cfg, owner }, null, 2) + '\n');

const CATEGORY = { core: 'development', selling: 'business', ads: 'marketing', docs: 'productivity', legal: 'business', business: 'business', brand: 'design', social: 'marketing', marketing: 'marketing', research: 'business', translate: 'productivity', teach: 'education' };
const market = {
  name: cfg.marketplace || 'perfect-suite',
  owner: { name: 'Perfect Suite' },
  metadata: { description: 'Perfect Suite: the Perfect Programming core (/absolute — sites, apps, programs) and domain addons that work alone or as one system, in Claude Code and Google Antigravity.' },
  plugins: plugins().map((p) => ({
    name: p.name,
    source: { source: 'github', repo: `${owner}/${p.dir}` },
    description: p.description,
    version: p.version,
    category: CATEGORY[p.short] || 'productivity',
    keywords: p.keywords,
  })),
};
const text = JSON.stringify(market, null, 2) + '\n';
const target = join(HUB, '.claude-plugin', 'marketplace.json');
if (args.includes('--check')) {
  const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (current !== text) { console.error('build-marketplace: marketplace.json is out of date — run node scripts/build-marketplace.mjs'); process.exit(1); }
  console.log(`build-marketplace: up to date (${market.plugins.length} plugins)`);
} else {
  mkdirSync(join(HUB, '.claude-plugin'), { recursive: true });
  writeFileSync(target, text);
  console.log(`build-marketplace: ${market.plugins.length} plugins → ${target}${owner === 'OWNER' ? '\n  owner is the placeholder OWNER — run with --owner <github user or org> before publishing' : ''}`);
  if (!market.plugins.some((p) => p.name === CORE)) console.warn(`build-marketplace: ${CORE} not found next to the hub`);
}
