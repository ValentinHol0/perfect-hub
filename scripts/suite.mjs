// Shared helpers for the Perfect Suite hub scripts: find the sibling plugin repositories and read their manifests.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HUB = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SUITE = resolve(HUB, '..');
export const CORE = 'perfect-programming-plugin';

// Order: core first, then addons alphabetically.
export function plugins() {
  return readdirSync(SUITE)
    .filter((d) => /^perfect-.+-plugin$/.test(d) && existsSync(join(SUITE, d, '.claude-plugin', 'plugin.json')))
    .sort((a, b) => (a === CORE ? -1 : b === CORE ? 1 : a.localeCompare(b)))
    .map((dir) => {
      const root = join(SUITE, dir);
      const manifest = JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf8'));
      const market = existsSync(join(root, '.claude-plugin', 'marketplace.json')) ? JSON.parse(readFileSync(join(root, '.claude-plugin', 'marketplace.json'), 'utf8')) : null;
      const short = dir === CORE ? 'core' : dir.replace(/^perfect-/, '').replace(/-plugin$/, '');
      return { dir, root, short, name: manifest.name, version: manifest.version, description: manifest.description, keywords: manifest.keywords || [], marketplace: market?.name || manifest.name };
    });
}

export function hubConfig() {
  const p = join(HUB, 'hub.json');
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { owner: 'OWNER', marketplace: 'perfect-suite' };
}

export const selected = (list, only) => (only ? list.filter((p) => only.split(',').map((s) => s.trim()).some((o) => o === p.short || o === p.name || o === p.dir)) : list);
export const argOpt = (args, k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
