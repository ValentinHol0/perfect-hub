// Run: node --test scripts/tests/code-scan.test.mjs   (from the plugin root)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import { scan } from '../code-scan.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'code-scan.mjs');
let dir;
const put = (rel, text) => { const p = join(dir, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); };
const gitOk = spawnSync('git', ['--version']).status === 0;
const g = (...a) => execFileSync('git', ['-C', dir, ...a], { stdio: 'ignore' });

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'ppp-scan-'));
  put('package.json', JSON.stringify({ name: 'shop', scripts: { dev: 'next dev', test: 'vitest run', lint: 'eslint .' }, dependencies: { next: '15.0.0', react: '19.0.0', '@prisma/client': '6.0.0' }, devDependencies: { vitest: '3.0.0', typescript: '5.6.0' } }));
  writeFileSync(join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n');
  put('tsconfig.json', '{\n  // comment\n  "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] }, },\n}\n');
  put('src/app/page.tsx', "import { db } from '@/lib/db';\nexport default function Home() { return null; }\n");
  put('src/app/blog/[slug]/page.tsx', "import { a } from '@/lib/a';\nexport default function Post() { return null; }\n");
  put('src/app/api/orders/route.ts', "import { db } from '../../../lib/db';\nexport async function POST(req: Request) { return new Response('ok'); }\nexport const GET = () => new Response('[]');\n");
  put('src/lib/db.ts', "import { a } from './a';\nexport const db = { a };\n");
  put('src/lib/a.ts', "import { b } from './b';\nexport const a = 1 + b;\n");
  put('src/lib/b.ts', "import { a } from './a.js';\nexport const b = 2;\n// TODO: remove\n");
  put('src/lib/orphan.ts', 'export const unused = 1;\n');
  put('src/lib/risky.ts', [
    "export async function load(id: string, db: any) {",
    "  try { await db.query(`SELECT * FROM t WHERE id = ${id}`); } catch (e) {}",
    "  // @ts-ignore",
    "  const x: any = 1;",
    "  fetch('/x').catch(() => {});",
    "  const key = '" + 'sk_' + 'live_' + 'a1B2c3D4e5F6g7H8i9J0k1L2' + "';",
    "  const token = 'abcdefghijklmnopqrstuvwxyz123456';",
    "  const apiKey = 'your-api-key-goes-here-123456';",
    "  console.log('[DEBUG-" + 'a1f3' + "] here');",
    "  el.innerHTML = id; // code-scan-ignore",
    "  return x;",
    "}",
  ].join('\n'));
  put('src/components/List.tsx', "import { useEffect } from 'react';\nexport function L({ items }) { useEffect(async () => {}, []); return items.map((x, i) => <li key={i}>{x}</li>); }\n");
  put('src/lib/risky.test.ts', "import { describe, it } from 'vitest';\ndescribe.only('x', () => { it.skip('y', () => {}); });\n");
  put('server/app.py', "from .models import User\nfrom . import utils\nimport os\n\n@app.get('/health')\ndef health():\n    try:\n        return 1\n    except Exception:\n        pass\n\nif __name__ == '__main__':\n    os.system('ls ' + User)\n");
  put('server/models.py', 'class User: ...\n');
  put('server/utils.py', 'def f():\n    return 1\n');
  put('server/__init__.py', '');
  put('.github/workflows/ci.yml', 'jobs:\n  t:\n    steps:\n      - run: pnpm install --frozen-lockfile\n      - run: pnpm test\n');
  put('.env.example', 'DATABASE_URL=\nSTRIPE_SECRET_KEY=\n');
  put('node_modules/dep/index.js', "eval(userInput)\n");
  put('dist/out.js', "eval(userInput)\n");
  if (gitOk) {
    g('init', '-q', '-b', 'main');
    g('-c', 'user.email=t@t', '-c', 'user.name=T', 'add', '-A');
    g('-c', 'user.email=t@t', '-c', 'user.name=T', 'commit', '-q', '-m', 'feat: initial');
    put('src/lib/a.ts', "import { b } from './b';\nexport const a = 2 + b;\n");
    g('-c', 'user.email=t@t', '-c', 'user.name=T', 'commit', '-q', '-am', 'fix: off by one in a');
    put('.env', 'SECRET=1\n');
    g('-c', 'user.email=t@t', '-c', 'user.name=U', 'add', '-f', '.env');
    g('-c', 'user.email=t@t', '-c', 'user.name=U', 'commit', '-q', '-m', 'chore: env');
  }
});
after(() => rmSync(dir, { recursive: true, force: true }));

test('code-scan: stack, package manager, commands, CI commands', () => {
  const r = scan(dir);
  assert.ok(r.stack.frameworks.includes('Next.js') && r.stack.frameworks.includes('Prisma') && r.stack.frameworks.includes('Vitest'));
  assert.deepEqual(r.stack.managers.slice(0, 1), ['pnpm']);
  assert.match(r.stack.commands.test, /^pnpm run test\s+→\s+vitest run$/);
  assert.ok(r.stack.ciCommands.includes('pnpm test'));
  assert.deepEqual(r.stack.env.keys, ['DATABASE_URL', 'STRIPE_SECRET_KEY']);
});

test('code-scan: entry points — app router pages with params, API methods, python handlers and main', () => {
  const r = scan(dir);
  const routes = r.entryPoints.map((e) => `${e.kind} ${e.route ?? ''}`.trim());
  assert.ok(routes.includes('page /'), routes.join('|'));
  assert.ok(routes.includes('page /blog/:slug'));
  const api = r.entryPoints.find((e) => e.kind === 'api');
  assert.equal(api.route, '/api/orders');
  assert.deepEqual(api.methods.sort(), ['GET', 'POST']);
  assert.ok(r.entryPoints.some((e) => e.kind === 'http' && e.method === 'GET' && e.route === '/health'));
  assert.ok(r.entryPoints.some((e) => e.kind === 'main' && e.file === 'server/app.py'));
});

test('code-scan: import graph — tsconfig alias, .js→.ts, python relative imports, cycle, fan-in, unreferenced', () => {
  const r = scan(dir);
  const fan = Object.fromEntries(r.coreModules.map((m) => [m.file, m.importedBy]));
  assert.equal(fan['src/lib/db.ts'], 2, JSON.stringify(fan)); // page.tsx via @/ alias + route.ts via ../../../
  assert.equal(fan['src/lib/a.ts'], 3);                          // db.ts, blog page, b.ts (./a.js → a.ts)
  assert.equal(fan['server/models.py'], 1);
  assert.equal(fan['server/utils.py'], 1);                        // from . import utils
  assert.deepEqual(r.cycles, [['src/lib/a.ts', 'src/lib/b.ts']]);
  assert.ok(r.unreferenced.includes('src/lib/orphan.ts'));
  assert.ok(!r.unreferenced.includes('src/app/page.tsx'));
});

test('code-scan: risk markers — silent failures, type escapes, injection, secrets masked, tests, ignores', () => {
  const r = scan(dir);
  const has = (id, file) => r.risks.some((x) => x.id === id && (!file || x.file === file));
  for (const id of ['empty-catch', 'sql-interpolation', 'ts-ignore', 'ts-any', 'swallowed-promise', 'secret-stripe', 'secret-assignment', 'debug-marker', 'async-effect', 'index-key', 'py-except-pass', 'py-os-system', 'focused-test', 'skipped-test']) assert.ok(has(id), `missing ${id}`);
  assert.ok(!has('html-sink'), 'code-scan-ignore line must be skipped');
  const stripe = r.risks.find((x) => x.id === 'secret-stripe');
  assert.ok(!stripe.excerpt.includes('a1B2c3D4e5F6'), 'secret must be masked');
  assert.equal(r.risks.filter((x) => x.id === 'secret-assignment').length, 1, 'placeholder value must not be reported');
  assert.ok(!r.risks.some((x) => x.file.startsWith('node_modules/') || x.file.startsWith('dist/')), 'ignored folders are not scanned');
  assert.ok(!r.risks.some((x) => x.id === 'focused-test' && !x.test));
  if (gitOk) assert.ok(has('env-committed', '.env'));
});

test('code-scan: git hotspots count commits, fix commits and authors', { skip: !gitOk }, () => {
  const r = scan(dir);
  const a = r.hotspots.rows.find((h) => h.file === 'src/lib/a.ts');
  assert.equal(a.commits, 2);
  assert.equal(a.fixes, 1);
  assert.equal(r.hotspots.commits, 3);
});

test('code-scan CLI: markdown report, --json, --risks only, --fail-on high', () => {
  const md = spawnSync(process.execPath, [SCRIPT, dir, '--top', '5'], { encoding: 'utf8' });
  assert.equal(md.status, 0, md.stderr);
  for (const h of ['## Stack', '## Commands', '## Entry points', '## Core modules', '## Import cycles (1)', '## Risk markers']) assert.ok(md.stdout.includes(h), h);
  const js = JSON.parse(spawnSync(process.execPath, [SCRIPT, dir, '--json', '--risks'], { encoding: 'utf8' }).stdout);
  assert.ok(Array.isArray(js.risks) && !('entryPoints' in js) && !('hotspots' in js));
  const gate = spawnSync(process.execPath, [SCRIPT, dir, '--risks', '--fail-on', 'high'], { encoding: 'utf8' });
  assert.equal(gate.status, 1);
  const missing = spawnSync(process.execPath, [SCRIPT, join(dir, 'nope')], { encoding: 'utf8' });
  assert.equal(missing.status, 2);
});
