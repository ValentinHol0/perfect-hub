#!/usr/bin/env node
// code-scan-ignore-file
// code-scan — one-call map of a codebase for agents and humans, read-only, zero dependencies (Node >= 18).
//   Stack and commands · languages · entry points (routes, handlers, mains, bins) · internal import graph
//   (core modules by fan-in, import cycles, unreferenced files) · git hotspots (churn × size, fix commits, authors)
//   · risk markers (silent failures, type escapes, debug leftovers, dangerous sinks, secrets, focused tests).
// Usage: node code-scan.mjs [path=.] [--json] [--top 15] [--since "180 days ago"] [--map|--hotspots|--risks]
//                           [--fail-on high|medium] [--out <file>]
//   --map / --hotspots / --risks limit the report to that part (combinable; default: everything).
//   --fail-on: exit 1 when a risk of that severity (or higher) is found — usable as a CI or review gate.
// Risk hits are candidates, not findings: confirm each by reading the code. A line containing `code-scan-ignore`
// is skipped by the risk scan; `code-scan-ignore-file` near the top of a file skips the whole file (as here: the rule
// table below would match itself). Secret values are masked in every output.

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve, extname, dirname, basename, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', '.output', '.turbo', '.vercel', '.netlify', 'coverage', 'vendor', 'target', '__pycache__', '.venv', 'venv', '.tox', '.mypy_cache', '.pytest_cache', '.ruff_cache', 'Pods', 'DerivedData', '.gradle', '.idea', '.dart_tool', '.expo', 'obj', '.cache', '.parcel-cache', 'storybook-static', '.planning', '.visual-review', '.design', 'bower_components', 'jspm_packages', '.terraform']);
const LOCKFILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock', 'Cargo.lock', 'poetry.lock', 'composer.lock', 'Gemfile.lock', 'go.sum', 'uv.lock', 'Pipfile.lock', 'pubspec.lock', 'Podfile.lock', 'packages.lock.json']);
const LANG = { ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', cts: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript', py: 'Python', go: 'Go', rs: 'Rust', java: 'Java', kt: 'Kotlin', kts: 'Kotlin', swift: 'Swift', m: 'Objective-C', mm: 'Objective-C', dart: 'Dart', rb: 'Ruby', php: 'PHP', cs: 'C#', fs: 'F#', c: 'C', h: 'C/C++ header', cc: 'C++', cpp: 'C++', hpp: 'C++', vue: 'Vue', svelte: 'Svelte', astro: 'Astro', html: 'HTML', css: 'CSS', scss: 'SCSS', sass: 'Sass', less: 'Less', sql: 'SQL', sh: 'Shell', bash: 'Shell', zsh: 'Shell', ps1: 'PowerShell', lua: 'Lua', ex: 'Elixir', exs: 'Elixir', erl: 'Erlang', scala: 'Scala', clj: 'Clojure', r: 'R', jl: 'Julia', graphql: 'GraphQL', gql: 'GraphQL', prisma: 'Prisma', proto: 'Protobuf', tf: 'Terraform', sol: 'Solidity', zig: 'Zig', nim: 'Nim', hs: 'Haskell', ml: 'OCaml' };
const DATA = { json: 'JSON', jsonc: 'JSON', yaml: 'YAML', yml: 'YAML', toml: 'TOML', md: 'Markdown', mdx: 'MDX', xml: 'XML', ini: 'INI', env: 'dotenv', properties: 'Properties', plist: 'plist', gradle: 'Gradle' };
const JS_LIKE = new Set(['ts', 'tsx', 'mts', 'cts', 'js', 'jsx', 'mjs', 'cjs', 'vue', 'svelte', 'astro']);
const RESOLVE_EXT = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte', '.astro', '.json'];
const MAX_FILES = 25000;
const MAX_BYTES = 1_000_000;

const posixify = (p) => p.split(sep).join('/');
const extOf = (f) => {
  const b = basename(f);
  if (b.startsWith('.env')) return 'env';
  return extname(b).slice(1).toLowerCase();
};
const isTestPath = (f) => /(^|\/)(__tests__|__mocks__|tests?|spec|specs|e2e|cypress|fixtures?|testdata)\//i.test(f) || /\.(test|spec|e2e)\.[a-z]+$/i.test(f) || /(^|\/)test_[^/]+\.py$|_test\.(go|py)$|Tests?\.(swift|kt|java|cs)$/.test(f);
const isGenerated = (f) => /\.min\.(js|css)$|\.bundle\.js$|\.generated\.|\.g\.dart$|\.pb\.go$|_pb2\.py$|(^|\/)generated\//.test(f);

function git(root, args) {
  try { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { return null; }
}

// ---------- file inventory ----------
function listFiles(root) {
  const inGit = (git(root, ['rev-parse', '--is-inside-work-tree']) || '').trim() === 'true';
  let files = [];
  if (inGit) {
    const out = git(root, ['ls-files', '-co', '--exclude-standard', '-z']) || '';
    files = out.split('\0').filter(Boolean).map(posixify);
  } else {
    const walk = (dir, rel) => {
      let entries;
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        if (files.length >= MAX_FILES) return;
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) { if (!IGNORE_DIRS.has(e.name)) walk(join(dir, e.name), r); }
        else if (e.isFile()) files.push(r);
      }
    };
    walk(root, '');
  }
  files = files.filter((f) => !f.split('/').some((seg) => IGNORE_DIRS.has(seg)) && !LOCKFILES.has(basename(f)));
  const truncated = files.length > MAX_FILES;
  return { inGit, files: files.slice(0, MAX_FILES), truncated };
}

function readText(root, f) {
  try {
    const st = statSync(join(root, f));
    if (!st.isFile() || st.size > MAX_BYTES) return null;
    const buf = readFileSync(join(root, f));
    if (buf.subarray(0, 8000).includes(0)) return null; // binary
    return buf.toString('utf8');
  } catch { return null; }
}

const readJson = (root, f) => {
  const t = readText(root, f);
  if (t == null) return null;
  try { return JSON.parse(t); } catch { return null; }
};
// JSONC (tsconfig): strip comments outside strings and trailing commas.
function parseJsonc(text) {
  let out = '', inStr = false, q = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inStr) { out += c; if (c === '\\') { out += n ?? ''; i++; } else if (c === q) inStr = false; continue; }
    if (c === '"' || c === "'") { inStr = true; q = c; out += c; continue; }
    if (c === '/' && n === '/') { while (i < text.length && text[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i++; continue; }
    out += c;
  }
  try { return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1')); } catch { return null; }
}

// ---------- stack, commands, platforms ----------
const JS_FRAMEWORKS = [
  ['next', 'Next.js'], ['react-native', 'React Native'], ['expo', 'Expo'], ['react', 'React'], ['nuxt', 'Nuxt'], ['vue', 'Vue'],
  ['@sveltejs/kit', 'SvelteKit'], ['svelte', 'Svelte'], ['astro', 'Astro'], ['@remix-run/react', 'Remix'], ['react-router', 'React Router'],
  ['@angular/core', 'Angular'], ['solid-js', 'Solid'], ['@builder.io/qwik', 'Qwik'], ['express', 'Express'], ['fastify', 'Fastify'],
  ['@nestjs/core', 'NestJS'], ['hono', 'Hono'], ['koa', 'Koa'], ['electron', 'Electron'], ['@tauri-apps/api', 'Tauri'], ['vite', 'Vite'],
  ['tailwindcss', 'Tailwind CSS'], ['@prisma/client', 'Prisma'], ['prisma', 'Prisma'], ['drizzle-orm', 'Drizzle'], ['typeorm', 'TypeORM'],
  ['mongoose', 'Mongoose'], ['@supabase/supabase-js', 'Supabase'], ['firebase', 'Firebase'], ['stripe', 'Stripe'], ['@trpc/server', 'tRPC'],
  ['graphql', 'GraphQL'], ['zod', 'Zod'], ['vitest', 'Vitest'], ['jest', 'Jest'], ['mocha', 'Mocha'], ['@playwright/test', 'Playwright'],
  ['cypress', 'Cypress'], ['@testing-library/react', 'Testing Library'], ['storybook', 'Storybook'], ['typescript', 'TypeScript'],
  ['eslint', 'ESLint'], ['@biomejs/biome', 'Biome'], ['i18next', 'i18next'], ['next-intl', 'next-intl'], ['@sentry/node', 'Sentry'],
  ['@sentry/nextjs', 'Sentry'], ['@sentry/react', 'Sentry'], ['posthog-js', 'PostHog'], ['@clerk/nextjs', 'Clerk'], ['next-auth', 'Auth.js'],
  ['@auth/core', 'Auth.js'], ['better-auth', 'Better Auth'], ['@tanstack/react-query', 'TanStack Query'], ['redux', 'Redux'], ['zustand', 'Zustand'],
  ['socket.io', 'Socket.IO'], ['bullmq', 'BullMQ'], ['@shopify/hydrogen', 'Shopify Hydrogen'],
];
const PY_FRAMEWORKS = [['django', 'Django'], ['fastapi', 'FastAPI'], ['flask', 'Flask'], ['sqlalchemy', 'SQLAlchemy'], ['pydantic', 'Pydantic'], ['celery', 'Celery'], ['pytest', 'pytest'], ['ruff', 'Ruff'], ['mypy', 'mypy'], ['streamlit', 'Streamlit'], ['torch', 'PyTorch'], ['pandas', 'pandas'], ['aiogram', 'aiogram'], ['python-telegram-bot', 'python-telegram-bot']];

function detectStack(root, files) {
  const has = (f) => files.includes(f);
  const anyMatch = (re) => files.some((f) => re.test(f));
  const st = { languages: [], managers: [], frameworks: [], platforms: [], commands: {}, ci: [], deploy: [], monorepo: null, env: null, notes: [] };
  const fw = new Set();
  const pkg = has('package.json') ? readJson(root, 'package.json') : null;
  if (pkg) {
    const lock = (f) => existsSync(join(root, f)); // lockfiles are excluded from the inventory, so check the disk
    const pm = /^(pnpm|yarn|bun)@/.test(pkg.packageManager || '') ? pkg.packageManager.split('@')[0] : lock('pnpm-lock.yaml') ? 'pnpm' : lock('yarn.lock') ? 'yarn' : (lock('bun.lockb') || lock('bun.lock')) ? 'bun' : 'npm';
    st.managers.push(pm);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    for (const [dep, label] of JS_FRAMEWORKS) if (deps[dep] || (dep === 'storybook' && Object.keys(deps).some((d) => d.startsWith('@storybook/')))) fw.add(label);
    const scripts = pkg.scripts || {};
    const run = (k) => (pm === 'npm' && (k === 'test' || k === 'start') ? `npm ${k}` : `${pm} run ${k}`);
    for (const k of ['dev', 'build', 'start', 'test', 'test:unit', 'test:e2e', 'e2e', 'lint', 'typecheck', 'type-check', 'check', 'format', 'db:migrate', 'migrate']) {
      if (scripts[k]) st.commands[k] = `${run(k)}  →  ${scripts[k]}`;
    }
    if (pkg.workspaces || has('pnpm-workspace.yaml') || has('turbo.json') || has('nx.json') || has('lerna.json')) {
      st.monorepo = files.filter((f) => f.endsWith('/package.json') && f.split('/').length <= 4).map((f) => dirname(f));
    }
    if (fw.has('Electron')) st.platforms.push('desktop (Electron)');
    if (fw.has('Expo') || fw.has('React Native')) st.platforms.push('mobile (React Native)');
  }
  const pyFiles = ['pyproject.toml', 'requirements.txt', 'requirements-dev.txt', 'Pipfile', 'setup.py', 'setup.cfg'].filter(has);
  if (pyFiles.length) {
    const text = pyFiles.map((f) => readText(root, f) || '').join('\n').toLowerCase();
    st.managers.push(existsSync(join(root, 'uv.lock')) ? 'uv' : existsSync(join(root, 'poetry.lock')) || /\[tool\.poetry\]/.test(text) ? 'poetry' : 'pip');
    for (const [dep, label] of PY_FRAMEWORKS) if (new RegExp(`(^|[^a-z0-9_-])${dep.replace('.', '\\.')}([^a-z0-9_-]|$)`, 'm').test(text)) fw.add(label);
    if (fw.has('pytest')) st.commands.test ??= 'pytest';
    if (fw.has('Ruff')) st.commands.lint ??= 'ruff check .';
    if (fw.has('mypy')) st.commands.typecheck ??= 'mypy .';
    if (has('manage.py')) st.commands.dev ??= 'python manage.py runserver';
  }
  if (has('go.mod')) { st.managers.push('go modules'); Object.assign(st.commands, { test: st.commands.test ?? 'go test ./...', lint: st.commands.lint ?? 'go vet ./...', build: st.commands.build ?? 'go build ./...' }); }
  if (has('Cargo.toml')) { st.managers.push('cargo'); Object.assign(st.commands, { test: st.commands.test ?? 'cargo test', lint: st.commands.lint ?? 'cargo clippy -- -D warnings', build: st.commands.build ?? 'cargo build' }); if (anyMatch(/(^|\/)src-tauri\//)) st.platforms.push('desktop (Tauri)'); }
  if (has('pubspec.yaml')) {
    const flutter = /\bflutter:/.test(readText(root, 'pubspec.yaml') || '');
    st.managers.push(flutter ? 'flutter pub' : 'dart pub'); if (flutter) { fw.add('Flutter'); st.platforms.push('mobile (Flutter)'); }
    Object.assign(st.commands, { test: st.commands.test ?? (flutter ? 'flutter test' : 'dart test'), lint: st.commands.lint ?? (flutter ? 'flutter analyze' : 'dart analyze') });
  }
  if (has('Gemfile')) { st.managers.push('bundler'); const g = readText(root, 'Gemfile') || ''; if (/['"]rails['"]/.test(g)) fw.add('Rails'); if (/rspec/.test(g)) st.commands.test ??= 'bundle exec rspec'; }
  if (has('composer.json')) { st.managers.push('composer'); const c = readJson(root, 'composer.json') || {}; const d = { ...c.require, ...c['require-dev'] }; if (d['laravel/framework']) fw.add('Laravel'); if (d['symfony/framework-bundle']) fw.add('Symfony'); if (d['phpunit/phpunit']) st.commands.test ??= 'vendor/bin/phpunit'; }
  if (anyMatch(/\.(csproj|sln|fsproj)$/)) { st.managers.push('dotnet'); st.commands.test ??= 'dotnet test'; st.commands.build ??= 'dotnet build'; }
  const gradle = files.filter((f) => /(^|\/)build\.gradle(\.kts)?$/.test(f));
  if (gradle.length) {
    st.managers.push('gradle'); st.commands.test ??= './gradlew test';
    if (gradle.some((f) => /com\.android\.application|id\("com\.android\.application"\)|android\s*\{/.test(readText(root, f) || ''))) { fw.add('Android'); if (!st.platforms.some((p) => p.startsWith('mobile'))) st.platforms.push('mobile (Android native)'); }
  }
  if (has('pom.xml')) { st.managers.push('maven'); st.commands.test ??= 'mvn test'; }
  if (anyMatch(/\.xcodeproj\//) || has('Podfile') || has('Package.swift')) {
    if (has('Package.swift')) { st.managers.push('swiftpm'); st.commands.test ??= 'swift test'; }
    if (anyMatch(/\.xcodeproj\//) && !st.platforms.some((p) => p.startsWith('mobile'))) st.platforms.push('Apple platforms (Xcode)');
  }
  if (anyMatch(/(^|\/)(Dockerfile|docker-compose\.ya?ml|compose\.ya?ml)$/)) st.deploy.push('Docker');
  for (const [f, label] of [['vercel.json', 'Vercel'], ['netlify.toml', 'Netlify'], ['fly.toml', 'Fly.io'], ['wrangler.toml', 'Cloudflare Workers'], ['wrangler.json', 'Cloudflare Workers'], ['wrangler.jsonc', 'Cloudflare Workers'], ['render.yaml', 'Render'], ['firebase.json', 'Firebase'], ['serverless.yml', 'Serverless'], ['Procfile', 'Procfile (Heroku-style)'], ['eas.json', 'Expo EAS'], ['app.yaml', 'Google App Engine'], ['railway.json', 'Railway']]) if (has(f)) st.deploy.push(label);
  st.ci = files.filter((f) => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(f) || ['.gitlab-ci.yml', 'bitbucket-pipelines.yml', 'azure-pipelines.yml', 'Jenkinsfile'].includes(f) || /^\.circleci\//.test(f));
  // What CI actually runs is the most reliable definition of "green".
  st.ciCommands = [...new Set(st.ci.filter((f) => /\.ya?ml$/.test(f)).flatMap((f) => [...(readText(root, f) || '').matchAll(/^\s*(?:-\s*)?(?:run|script):\s*(?![|>]\s*$)(.+)$/gm)].map((m) => m[1].trim().replace(/^['"]|['"]$/g, ''))))].filter((c) => !/^(echo|cd|ls|cat)\b/.test(c)).slice(0, 12);
  const envExample = files.find((f) => /(^|\/)\.env\.(example|sample|template)$/.test(f));
  if (envExample) st.env = { example: envExample, keys: (readText(root, envExample) || '').split('\n').map((l) => l.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/)?.[1]).filter(Boolean) };
  st.frameworks = [...fw];
  if (fw.has('Next.js') && existsSync(join(root, 'node_modules', 'next', 'dist', 'docs'))) st.notes.push('Next.js ships version-matched docs in node_modules/next/dist/docs — read them before relying on memory.');
  return st;
}

// ---------- entry points ----------
function routeFromPath(f, base) {
  let r = f.slice(base.length).replace(/\/(page|route|layout|\+page|\+page\.server|\+server|\+layout|index)\.[a-z]+$|\.[a-z]+$/i, '');
  r = r.split('/').filter((s) => s && !/^\(.*\)$/.test(s) && !s.startsWith('@')).join('/');
  return '/' + r.replace(/\[\.\.\.(\w+)\]/g, '*$1').replace(/\[(\w+)\]/g, ':$1');
}

const dirBase = (f, dir) => f.slice(0, (f.startsWith(`${dir}/`) ? 0 : f.indexOf(`/${dir}/`) + 1) + dir.length);

function detectEntries(root, files, texts, stack) {
  const out = [];
  const pkg = files.includes('package.json') ? readJson(root, 'package.json') : null;
  if (pkg) {
    if (typeof pkg.bin === 'string') out.push({ kind: 'bin', name: pkg.name, file: pkg.bin });
    else if (pkg.bin) for (const [k, v] of Object.entries(pkg.bin)) out.push({ kind: 'bin', name: k, file: v });
    if (pkg.main) out.push({ kind: 'main', file: pkg.main });
    const exp = typeof pkg.exports === 'string' ? pkg.exports : pkg.exports?.['.'];
    if (exp) out.push({ kind: 'export', file: typeof exp === 'string' ? exp : exp.import || exp.default || exp.require || JSON.stringify(exp) });
  }
  const expo = stack.frameworks.includes('Expo');
  const fileRouting = ['Next.js', 'Nuxt', 'Astro'].some((x) => stack.frameworks.includes(x)); // pages/ is only a router in these
  for (const f of files) {
    if (/(^|\/)app\/(.*\/)?page\.(tsx?|jsx?|mdx)$/.test(f)) out.push({ kind: 'page', route: routeFromPath(f, dirBase(f, 'app')), file: f });
    else if (/(^|\/)app\/(.*\/)?route\.(ts|js)$/.test(f)) {
      const methods = [...(texts.get(f) || '').matchAll(/export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)].map((x) => x[1]);
      out.push({ kind: 'api', route: routeFromPath(f, dirBase(f, 'app')), methods: [...new Set(methods)], file: f });
    } else if (/(^|\/)pages\/api\/.+\.(ts|js)$/.test(f)) out.push({ kind: 'api', route: routeFromPath(f, dirBase(f, 'pages')), file: f });
    else if (fileRouting && /(^|\/)pages\/(?!_app|_document|_error).+\.(tsx|jsx|vue|astro|md|mdx)$/.test(f) && !isTestPath(f)) out.push({ kind: 'page', route: routeFromPath(f, dirBase(f, 'pages')), file: f });
    else if (/(^|\/)src\/routes\/.*\+(page|server|page\.server)\.(svelte|ts|js)$/.test(f)) out.push({ kind: /\+server/.test(f) ? 'api' : 'page', route: routeFromPath(f, dirBase(f, 'src/routes')), file: f });
    else if (expo && /^(src\/)?app\/.+\.(tsx|jsx)$/.test(f) && !/_layout\.|\+html\.|\+not-found\./.test(f)) out.push({ kind: 'screen', route: routeFromPath(f, dirBase(f, 'app')), file: f });
    else if (/(^|\/)server\/api\/.+\.(ts|js)$/.test(f) && stack.frameworks.includes('Nuxt')) out.push({ kind: 'api', route: '/api' + routeFromPath(f, dirBase(f, 'server/api')), file: f });
    else if (/^(?:src\/)?(?:index|server|main|app)\.(?:ts|js|mjs|cjs)$|^src\/main\.(?:tsx|jsx)$|^electron\/main\.(?:ts|js)$|(^|\/)main\.go$|(^|\/)src\/main\.rs$|(^|\/)lib\/main\.dart$|(^|\/)__main__\.py$|^manage\.py$|(^|\/)Program\.cs$/.test(f) && f.split('/').length <= 4 && !isTestPath(f)) out.push({ kind: 'main', file: f });
  }
  // executable scripts (shebang or "run when executed directly" guards)
  for (const [f, t] of texts) {
    if (isTestPath(f) || out.some((o) => o.file === f)) continue;
    const head = t.slice(0, 400);
    if (/^#!.*\b(node|python3?|bun|deno|tsx|ts-node)\b/.test(head) || /require\.main\s*===\s*module|import\.meta\.url\s*===\s*pathToFileURL\(|import\.meta\.main\b/.test(t)) out.push({ kind: 'cli', file: f });
  }
  // handler registrations
  const reJs = /\b(?:app|router|server|api|fastify|r|routes)\.(get|post|put|patch|delete|all)\(\s*(['"`])(\/[^'"`]*)\2/g;
  const rePy = /@(?:app|router|bp|blueprint|api)\.(get|post|put|patch|delete|route)\(\s*['"](\/[^'"]*)['"]/g;
  const reGo = /\.(?:HandleFunc|Handle|GET|POST|PUT|PATCH|DELETE)\(\s*"(\/[^"]*)"/g;
  for (const [f, t] of texts) {
    if (isTestPath(f)) continue;
    const e = extOf(f);
    const lineAt = (i) => t.slice(0, i).split('\n').length;
    if (JS_LIKE.has(e)) for (const m of t.matchAll(reJs)) out.push({ kind: 'http', method: m[1].toUpperCase(), route: m[3], file: `${f}:${lineAt(m.index)}` });
    if (e === 'py') {
      for (const m of t.matchAll(rePy)) out.push({ kind: 'http', method: m[1] === 'route' ? 'ANY' : m[1].toUpperCase(), route: m[2], file: `${f}:${lineAt(m.index)}` });
      if (/if\s+__name__\s*==\s*['"]__main__['"]/.test(t) && !out.some((o) => o.file === f)) out.push({ kind: 'main', file: f });
      if (/(^|\/)urls\.py$/.test(f)) for (const m of t.matchAll(/\bpath\(\s*['"]([^'"]*)['"]/g)) out.push({ kind: 'http', method: 'ANY', route: '/' + m[1], file: `${f}:${lineAt(m.index)}` });
    }
    if (e === 'go') for (const m of t.matchAll(reGo)) out.push({ kind: 'http', method: /HandleFunc|Handle\(/.test(m[0]) ? 'ANY' : m[0].match(/\.(\w+)\(/)[1], route: m[1], file: `${f}:${lineAt(m.index)}` });
  }
  return out;
}

// ---------- import graph ----------
function loadAliases(root, files) {
  const aliases = [];
  for (const cfg of ['tsconfig.json', 'jsconfig.json', 'tsconfig.base.json'].filter((f) => files.includes(f))) {
    const j = parseJsonc(readText(root, cfg) || '');
    const co = j?.compilerOptions; if (!co) continue;
    const base = (co.baseUrl || '.').replace(/^\.\/?/, '').replace(/\/$/, '');
    for (const [pat, targets] of Object.entries(co.paths || {})) {
      const prefix = pat.replace(/\*$/, '');
      for (const t of [].concat(targets)) aliases.push({ prefix, target: [base, t.replace(/^\.\//, '').replace(/\*$/, '')].filter(Boolean).join('/') });
    }
    if (co.baseUrl) aliases.push({ prefix: '', target: base, baseUrl: true });
  }
  return aliases;
}

function normalize(p) {
  const out = [];
  for (const seg of p.split('/')) { if (seg === '..') out.pop(); else if (seg && seg !== '.') out.push(seg); }
  return out.join('/');
}

function buildGraph(files, texts, aliases) {
  const set = new Set(files);
  const tryResolve = (base) => {
    if (set.has(base)) return base;
    if (/\.(js|jsx|mjs|cjs)$/.test(base)) { const stem = base.replace(/\.(js|jsx|mjs|cjs)$/, ''); for (const e of ['.ts', '.tsx', '.mts', '.cts']) if (set.has(stem + e)) return stem + e; }
    for (const e of RESOLVE_EXT) if (set.has(base + e)) return base + e;
    for (const e of RESOLVE_EXT) if (set.has(`${base}/index${e}`)) return `${base}/index${e}`;
    return null;
  };
  const resolveJs = (from, spec) => {
    if (spec.startsWith('.')) return tryResolve(normalize(`${dirname(from)}/${spec}`));
    for (const a of aliases) {
      if (a.baseUrl) { const r = tryResolve(normalize(`${a.target}/${spec}`)); if (r) return r; continue; }
      if (a.prefix && spec.startsWith(a.prefix)) { const r = tryResolve(normalize(`${a.target}/${spec.slice(a.prefix.length)}`)); if (r) return r; }
    }
    return null;
  };
  const resolvePy = (from, mod) => {
    let base;
    if (mod.startsWith('.')) {
      const dots = mod.match(/^\.+/)[0].length;
      let dir = dirname(from); for (let i = 1; i < dots; i++) dir = dirname(dir);
      base = normalize(`${dir === '.' ? '' : dir}/${mod.slice(dots).replace(/\./g, '/')}`);
    } else base = mod.replace(/\./g, '/');
    for (const root of ['', 'src/', 'app/']) {
      const b = normalize(root + base);
      if (set.has(`${b}.py`)) return `${b}.py`;
      if (set.has(`${b}/__init__.py`)) return `${b}/__init__.py`;
    }
    return null;
  };
  const edges = new Map();
  const reJs = /(?:^|[^\w$.])(?:import|export)\s+(?:type\s+)?(?:[\w*${}\s,]+?\s+from\s+)?['"]([^'"\n]+)['"]|(?:^|[^\w$.])(?:import|require)\(\s*['"]([^'"\n]+)['"]\s*\)/g;
  const rePy = /^[ \t]*from[ \t]+(\.+[\w.]*|[\w.]+)[ \t]+import[ \t]+(\([^)]*\)|[^\n#]+)|^[ \t]*import[ \t]+([\w.]+)/gm;
  for (const [f, t] of texts) {
    const e = extOf(f);
    const deps = new Set();
    if (JS_LIKE.has(e)) {
      for (const m of t.matchAll(reJs)) { const r = resolveJs(f, m[1] || m[2]); if (r && r !== f) deps.add(r); }
    } else if (e === 'py') {
      for (const m of t.matchAll(rePy)) {
        if (m[1]) {
          let r = resolvePy(f, m[1]);
          if (m[1].match(/^\.+$/)) for (const name of m[2].replace(/[()]/g, '').split(',').map((s) => s.trim()).filter(Boolean)) { const sub = resolvePy(f, m[1] + name); if (sub) deps.add(sub); }
          if (r && r !== f) deps.add(r);
        } else if (m[3]) { const r = resolvePy(f, m[3]); if (r && r !== f) deps.add(r); }
      }
    }
    edges.set(f, deps);
  }
  return edges;
}

function findCycles(edges) {
  // Tarjan's strongly connected components; components with > 1 node are import cycles.
  let index = 0; const stack = []; const on = new Set(); const idx = new Map(); const low = new Map(); const comps = [];
  const strong = (v) => {
    idx.set(v, index); low.set(v, index); index++; stack.push(v); on.add(v);
    for (const w of edges.get(v) || []) {
      if (!edges.has(w)) continue;
      if (!idx.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))); }
      else if (on.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)));
    }
    if (low.get(v) === idx.get(v)) {
      const comp = []; let w;
      do { w = stack.pop(); on.delete(w); comp.push(w); } while (w !== v);
      if (comp.length > 1) comps.push(comp.sort());
    }
  };
  try { for (const v of edges.keys()) if (!idx.has(v)) strong(v); } catch (e) { if (!(e instanceof RangeError)) throw e; return [['(import graph too deep to analyse for cycles)']]; }
  return comps.sort((a, b) => b.length - a.length);
}

// ---------- git hotspots ----------
const FIX_RE = /^(fix|hotfix|revert|bugfix)\b|\bfix(es|ed)?\b|\bbug\b|\bregression\b|\bcrash\b|\bвиправ|\bбаг\b/i;
function hotspots(root, since, loc) {
  const out = git(root, ['log', `--since=${since}`, '--no-merges', '--relative', '--name-only', '--format=%x1e%an%x1f%s']);
  if (out == null) return null;
  const stats = new Map(); let commits = 0;
  for (const rec of out.split('\x1e').slice(1)) {
    const [head, ...rest] = rec.split('\n');
    const [author, subject = ''] = head.split('\x1f');
    commits++;
    const isFix = FIX_RE.test(subject);
    for (const f of rest.map((s) => s.trim()).filter(Boolean)) {
      const s = stats.get(f) || { file: f, commits: 0, fixes: 0, authors: new Set() };
      s.commits++; if (isFix) s.fixes++; s.authors.add(author); stats.set(f, s);
    }
  }
  const rows = [...stats.values()].filter((s) => loc.has(s.file)).map((s) => ({ file: s.file, commits: s.commits, fixes: s.fixes, authors: s.authors.size, loc: loc.get(s.file), score: Math.round(s.commits * Math.sqrt(loc.get(s.file) || 1)) }));
  return { commits, rows: rows.sort((a, b) => b.score - a.score) };
}

// ---------- risk markers ----------
const JS_TS = ['ts', 'tsx', 'mts', 'cts', 'js', 'jsx', 'mjs', 'cjs', 'vue', 'svelte', 'astro'];
const TS = ['ts', 'tsx', 'mts', 'cts'];
const CODE = Object.keys(LANG);
const PLACEHOLDER = /x{4,}|your[_-]?|example|changeme|placeholder|dummy|<[^>]+>|\$\{|process\.env|os\.environ|getenv|test[_-]?key|fake|sample|\*{3,}/i;
// [id, severity, exts, regex, message, options]  options.multiline: run on the whole text; options.skipTests; options.secret
const RULES = [
  ['secret-private-key', 'high', 'any', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/, 'Private key in the repository', { secret: true }],
  ['secret-aws', 'high', 'any', /\b(AKIA|ASIA)[0-9A-Z]{16}\b/, 'AWS access key id', { secret: true }],
  ['secret-stripe', 'high', 'any', /\b[sr]k_live_[0-9a-zA-Z]{16,}\b/, 'Stripe live secret key', { secret: true }],
  ['secret-github', 'high', 'any', /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/, 'GitHub token', { secret: true }],
  ['secret-slack', 'high', 'any', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/, 'Slack token', { secret: true }],
  ['secret-google', 'high', 'any', /\bAIza[0-9A-Za-z_-]{35}\b/, 'Google API key (check restrictions; browser keys may be public by design)', { secret: true }],
  ['secret-llm', 'high', 'any', /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}\b/, 'LLM provider API key (Anthropic/OpenAI style)', { secret: true }],
  ['secret-telegram', 'high', 'any', /\b\d{8,10}:AA[A-Za-z0-9_-]{33}\b/, 'Telegram bot token', { secret: true }],
  ['secret-assignment', 'medium', 'any', /\b[\w-]*(?:api[_-]?key|apikey|secret|passw(?:or)?d|token|private[_-]?key)[\w-]*['"]?\s*[:=]\s*['"]([^'"\s]{16,})['"]/i, 'Hard-coded credential-like value', { secret: true, skipTests: true, valueGroup: 1 }],
  ['empty-catch', 'medium', JS_TS.concat(['java', 'kt', 'cs', 'dart', 'swift', 'php']), /catch\s*(?:\([^)]*\))?\s*\{\s*\}/, 'Empty catch — the error disappears', { multiline: true }],
  ['catch-returns-empty', 'medium', JS_TS, /catch\s*(?:\(\s*\w*\s*\))?\s*\{\s*return\s+(?:null|undefined|false|\[\]|\{\}|''|"")\s*;?\s*\}/, 'Error turned into an empty value — callers cannot tell failure from "no data"', { multiline: true }],
  ['swallowed-promise', 'medium', JS_TS, /\.catch\(\s*(?:\(\s*\w*\s*\)|\w+)\s*=>\s*(?:\{\s*\}|null|undefined|void 0|false|\[\])\s*\)|\.catch\(\s*(?:noop|\(\)\s*=>\s*\{\s*\})\s*\)/, 'Promise rejection swallowed'],
  ['py-except-pass', 'medium', ['py'], /^[ \t]*except\b[^:\n]*:[ \t]*(?:#[^\n]*)?\n[ \t]*(?:pass|\.\.\.)[ \t]*$/m, 'except … pass — the error disappears', { multiline: true }],
  ['py-except-returns-empty', 'medium', ['py'], /^[ \t]*except\b[^:\n]*:[ \t]*\n[ \t]*return(?:[ \t]+(?:None|False|\[\]|\{\}|""|''))?[ \t]*$/m, 'Exception turned into an empty value', { multiline: true }],
  ['py-bare-except', 'low', ['py'], /^\s*except\s*:/, 'Bare except also catches KeyboardInterrupt/SystemExit'],
  ['go-empty-err', 'medium', ['go'], /if\s+err\s*!=\s*nil\s*\{\s*\}/, 'Error checked and ignored', { multiline: true }],
  ['go-discarded-err', 'low', ['go'], /^\s*_\s*=\s*\w[\w.]*\(|,\s*_\s*:?=\s*\w[\w.]*\(/, 'Return value discarded with _ (verify it is not an error)', { skipTests: true }],
  ['ts-ignore', 'medium', TS.concat(['js', 'jsx', 'vue', 'svelte']), /\/\/\s*@ts-(?:ignore|nocheck)\b/, 'Type checker silenced (@ts-ignore/@ts-nocheck)'],
  ['ts-any', 'low', TS.concat(['vue', 'svelte']), /(?::\s*any\b(?!\w)|\bas\s+any\b|<any>)/, 'any — types stop protecting this path', { skipTests: true }],
  ['py-type-ignore', 'low', ['py'], /#\s*type:\s*ignore/, 'Type checker silenced (type: ignore)'],
  ['eslint-disable-all', 'medium', JS_TS, /\/\*\s*eslint-disable\s*\*\/|\/\/\s*eslint-disable(?:-next-line|-line)?\s*$/, 'Lint disabled without naming a rule'],
  ['debug-marker', 'high', CODE, /\[DEBUG-[0-9a-f]{4}\]/i, 'Leftover tagged debug log from a debugging session'],
  ['debugger', 'medium', JS_TS, /^\s*debugger\s*;?\s*$/, 'debugger statement', { skipTests: true }],
  ['console-log', 'low', JS_TS, /\bconsole\.(log|debug)\(/, 'console.log in shipped code', { skipTests: true, skipScripts: true }],
  ['todo', 'low', CODE, /\b(TODO|FIXME|HACK|XXX)\b/, 'TODO/FIXME marker'],
  ['eval', 'high', JS_TS.concat(['py', 'php', 'rb']), /(?<![\w.$])(?:eval|exec)\s*\(\s*(?!['"`][^'"`]*['"`]\s*\))/, 'eval/exec on a non-literal — code injection if input reaches it', { skipTests: true, jsOnlyEval: true }],
  ['new-function', 'high', JS_TS, /\bnew\s+Function\s*\(/, 'new Function(...) — code injection risk'],
  ['html-sink', 'medium', JS_TS, /dangerouslySetInnerHTML|\.(?:inner|outer)HTML\s*=(?!=)|document\.write\(|insertAdjacentHTML\(|\bv-html=|\{@html\s|\bset:html=/, 'Raw HTML sink — XSS if untrusted data reaches it'],
  ['shell-interpolation', 'high', JS_TS, /\b(?:exec|execSync|spawnSync|spawn)\(\s*(?:`[^`]*\$\{|['"][^'"]*['"]\s*\+)/, 'Shell command built from strings — command injection'],
  ['shell-true', 'medium', JS_TS.concat(['py']), /shell\s*[:=]\s*(?:true|True)\b/, 'shell=true — command injection if arguments carry input'],
  ['py-os-system', 'high', ['py'], /\bos\.(?:system|popen)\(/, 'os.system/popen — command injection risk'],
  ['unsafe-deserialize', 'medium', ['py', 'rb', 'php'], /\bpickle\.loads?\(|\bmarshal\.loads?\(|\byaml\.load\((?![^)]*SafeLoader)|\bYAML\.load\(|\bunserialize\(/, 'Unsafe deserialisation of possibly untrusted data'],
  ['sql-interpolation', 'high', JS_TS.concat(['py', 'go', 'rb', 'php', 'java', 'kt', 'cs']), /\b(?:query|execute|raw|queryRawUnsafe|executeRawUnsafe|\$queryRawUnsafe|\$executeRawUnsafe)\s*\(\s*(?:`[^`]*\$\{|f["']|["'][^"']*["']\s*(?:\+|%\s*[\w(])|["'][^"']*\{\}[^"']*["']\s*\.format\()|fmt\.Sprintf\(\s*"(?:SELECT|INSERT|UPDATE|DELETE)\b/i, 'SQL built by string interpolation — injection unless every value is trusted'],
  ['raw-unsafe', 'medium', JS_TS, /\$(?:queryRawUnsafe|executeRawUnsafe)\(/, 'Prisma *Unsafe raw query — parameters are not escaped'],
  ['tls-off', 'high', JS_TS.concat(['py', 'go', 'rb', 'php', 'yaml', 'yml', 'env']), /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*[=:]\s*['"]?0|verify\s*=\s*False|InsecureSkipVerify\s*:\s*true|CURLOPT_SSL_VERIFYPEER\s*,\s*(?:false|0)/, 'TLS certificate verification disabled', { skipTests: true }],
  ['cors-wildcard', 'medium', JS_TS.concat(['py', 'go', 'php', 'rb', 'json', 'toml', 'yaml', 'yml']), /Access-Control-Allow-Origin['"]?\s*[:,=]\s*['"]\*['"]|\borigin\s*:\s*['"]\*['"]|allow_origins\s*=\s*\[\s*['"]\*['"]/, 'CORS allows any origin — fine for public data, wrong with cookies/credentials'],
  ['jwt-decode', 'low', JS_TS, /\bjwt\.decode\(|\bjwtDecode\(/, 'JWT decoded without verification — never trust its claims server-side', { skipTests: true }],
  ['jwt-none', 'high', JS_TS.concat(['py']), /algorithms\s*[:=]\s*\[\s*['"]none['"]|verify_signature['"]?\s*:\s*False/, 'JWT signature verification disabled'],
  ['weak-hash', 'low', JS_TS.concat(['py', 'go', 'php', 'rb']), /createHash\(\s*['"](?:md5|sha1)['"]|hashlib\.(?:md5|sha1)\(|\bmd5\(|\bsha1\(/, 'MD5/SHA-1 — fine for checksums, never for passwords or signatures'],
  ['focused-test', 'high', JS_TS, /\b(?:it|test|describe|context)\.only\(|(?<![\w.$])f(?:it|describe)\(/, 'Focused test — the rest of the suite is silently skipped', { onlyTests: true }],
  ['skipped-test', 'low', JS_TS.concat(['py', 'go']), /\b(?:it|test|describe)\.skip\(|(?<![\w.$])x(?:it|describe)\(|@pytest\.mark\.skip\b|\bt\.Skip\(/, 'Skipped test', { onlyTests: true }],
  ['async-effect', 'high', JS_TS, /useEffect\(\s*async\b/, 'useEffect(async …) returns a promise — cleanup breaks and errors go unhandled'],
  ['index-key', 'low', ['tsx', 'jsx'], /\bkey=\{\s*(?:i|idx|index)\s*\}/, 'List key is the array index — state jumps between rows on reorder/insert'],
  ['localhost-url', 'low', JS_TS.concat(['py', 'go', 'dart', 'swift', 'kt']), /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/, 'Hard-coded localhost URL in shipped code', { skipTests: true, skipScripts: true }],
  ['rust-unwrap', 'low', ['rs'], /\.unwrap\(\)/, 'unwrap() panics on error', { skipTests: true }],
];

const isScriptPath = (f) => /(^|\/)(scripts?|bin|tools|examples?|docs?)\//.test(f) || /\.config\.[a-z]+$/.test(f);
const mask = (v) => (v.length <= 8 ? '****' : `${v.slice(0, 4)}…${v.slice(-2)}`);

function scanRisks(texts, files, inGit, root) {
  const risks = [];
  for (const [f, t] of texts) {
    const e = extOf(f);
    if (e === 'md' || e === 'mdx' || isGenerated(f)) continue;
    if (/code-scan-ignore-file/.test(t.slice(0, 2000))) continue;
    const test = isTestPath(f);
    const example = /\.(example|sample|template)$|example/i.test(basename(f));
    let lines = null;
    for (const [id, sev, exts, re, msg, o = {}] of RULES) {
      if (exts !== 'any' && !exts.includes(e)) continue;
      if (exts === 'any' && !(e in LANG || e in DATA)) continue;
      if (o.skipTests && test) continue;
      if (o.onlyTests && !test) continue;
      if (o.skipScripts && isScriptPath(f)) continue;
      if (o.secret && example) continue;
      if (o.multiline) {
        const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
        for (const m of t.matchAll(g)) {
          const line = t.slice(0, m.index).split('\n').length;
          const text = t.split('\n')[line - 1] || '';
          if (/code-scan-ignore/.test(text)) continue;
          risks.push({ id, severity: sev, message: msg, file: f, line, excerpt: m[0].replace(/\s+/g, ' ').slice(0, 100), test });
        }
        continue;
      }
      lines ??= t.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const L = lines[i];
        if (L.length > 2000 || /code-scan-ignore/.test(L)) continue;
        const m = L.match(re);
        if (!m) continue;
        if (o.secret) {
          const val = o.valueGroup ? m[o.valueGroup] : m[0];
          if (o.valueGroup && PLACEHOLDER.test(val)) continue;
          if (/^\s*(\/\/|#|\*)/.test(L) && id === 'secret-assignment') continue;
          risks.push({ id, severity: test && sev === 'high' ? 'medium' : sev, message: msg + (test ? ' (test file)' : ''), file: f, line: i + 1, excerpt: mask(val), test });
          continue;
        }
        if (id === 'eval' && e !== 'py' && e !== 'php' && e !== 'rb' && /\bexec\s*\(/.test(m[0]) && !/\beval\s*\(/.test(m[0])) continue; // JS exec() is usually RegExp/child_process — handled elsewhere
        risks.push({ id, severity: sev, message: msg, file: f, line: i + 1, excerpt: L.trim().slice(0, 120), test });
      }
    }
  }
  if (inGit) {
    const tracked = (git(root, ['ls-files']) || '').split('\n').map((s) => posixify(s.trim())).filter(Boolean);
    for (const f of tracked) if (/(^|\/)\.env(\.[\w-]+)?$/.test(f) && !/\.(example|sample|template)$/.test(f)) risks.push({ id: 'env-committed', severity: 'high', message: '.env file is committed — rotate anything in it and untrack it', file: f, line: 1, excerpt: '', test: false });
  }
  const order = { high: 0, medium: 1, low: 2 };
  return risks.sort((a, b) => order[a.severity] - order[b.severity] || a.id.localeCompare(b.id) || a.file.localeCompare(b.file) || a.line - b.line);
}

// ---------- main scan ----------
export function scan(rootArg = '.', opts = {}) {
  const root = resolve(rootArg);
  const since = opts.since || '180 days ago';
  const { inGit, files, truncated } = listFiles(root);
  const texts = new Map();
  const loc = new Map();
  const langs = new Map();
  for (const f of files) {
    const e = extOf(f);
    if (!(e in LANG) && !(e in DATA)) continue;
    if (isGenerated(f)) continue;
    const t = readText(root, f);
    if (t == null) continue;
    texts.set(f, t);
    const n = t.split('\n').filter((l) => l.trim()).length;
    loc.set(f, n);
    const name = LANG[e] || DATA[e];
    const row = langs.get(name) || { language: name, files: 0, loc: 0, code: e in LANG };
    row.files++; row.loc += n; langs.set(name, row);
  }
  const codeTexts = new Map([...texts].filter(([f]) => extOf(f) in LANG));
  const stack = detectStack(root, files);
  const languages = [...langs.values()].sort((a, b) => b.loc - a.loc);
  stack.languages = languages.filter((l) => l.code).slice(0, 5).map((l) => l.language);
  const result = {
    root, generated: new Date().toISOString(), git: inGit, truncated,
    summary: { files: files.length, codeFiles: [...codeTexts.keys()].length, codeLoc: languages.filter((l) => l.code).reduce((s, l) => s + l.loc, 0) },
    stack, languages,
  };
  const want = (k) => !opts.only || opts.only.has(k);
  if (want('map')) {
    result.entryPoints = detectEntries(root, files, codeTexts, stack);
    const edges = buildGraph([...codeTexts.keys()], codeTexts, loadAliases(root, files));
    const fanIn = new Map();
    for (const [, deps] of edges) for (const d of deps) fanIn.set(d, (fanIn.get(d) || 0) + 1);
    result.coreModules = [...fanIn].map(([file, importedBy]) => ({ file, importedBy, loc: loc.get(file) || 0 })).sort((a, b) => b.importedBy - a.importedBy || b.loc - a.loc);
    result.cycles = findCycles(edges);
    result.largest = [...codeTexts.keys()].filter((f) => !isTestPath(f)).map((f) => ({ file: f, loc: loc.get(f) })).sort((a, b) => b.loc - a.loc);
    const entryFiles = new Set(result.entryPoints.map((x) => String(x.file).replace(/:\d+$/, '').replace(/^\.\//, '')));
    const graphable = [...edges.keys()].filter((f) => JS_LIKE.has(extOf(f)) || extOf(f) === 'py');
    result.unreferenced = graphable.filter((f) => !fanIn.has(f) && !entryFiles.has(f) && !isTestPath(f) && !isScriptPath(f) && f.includes('/')
      && !/\.d\.ts$|\.stories\.|\.config\.|(^|\/)(page|layout|route|loading|error|not-found|template|default|middleware|instrumentation|_app|_document|\+[\w.]+|__init__|conftest|setup|main|index|App|seed[\w-]*)\.[a-z]+$|(^|\/)(migrations|seeds?|public|static|pages|routes|app)\//.test(f));
    result.testFiles = [...texts.keys()].filter(isTestPath).length;
  }
  if (want('hotspots')) result.hotspots = inGit ? hotspots(root, since, loc) : null;
  if (want('risks')) result.risks = scanRisks(texts, files, inGit, root);
  result.since = since;
  return result;
}

// ---------- report ----------
function toMarkdown(r, top) {
  const L = [];
  const head = `# code-scan: ${basename(r.root)}`;
  L.push(head, '', `${r.summary.files} files · ${r.summary.codeFiles} code files · ${r.summary.codeLoc} code lines (non-blank)${r.git ? '' : ' · not a git repository'}${r.truncated ? ` · truncated at ${MAX_FILES} files` : ''}`, '');
  const s = r.stack;
  L.push('## Stack');
  L.push(`- ${[s.languages.join(', '), s.managers.join(', '), s.frameworks.join(' · ')].filter(Boolean).join(' — ') || 'unknown'}`);
  if (s.platforms.length) L.push(`- Platforms: ${s.platforms.join(', ')}`);
  if (s.monorepo) L.push(`- Monorepo packages: ${s.monorepo.slice(0, top).join(', ') || '(workspace config found)'}`);
  if (s.ci.length) L.push(`- CI: ${s.ci.join(', ')}`);
  if (s.deploy.length) L.push(`- Deploy/runtime: ${s.deploy.join(', ')}`);
  if (s.env) L.push(`- Env vars (${s.env.example}): ${s.env.keys.slice(0, 30).join(', ')}`);
  for (const n of s.notes) L.push(`- Note: ${n}`);
  L.push('', '## Commands');
  const cmds = Object.entries(s.commands);
  L.push(...(cmds.length ? cmds.map(([k, v]) => `- ${k}: \`${v}\``) : [s.ciCommands.length ? '- no package scripts — CI commands below are the reference' : '- none detected — read the README']));
  if (s.ciCommands.length) L.push(`- CI runs: ${s.ciCommands.map((c) => `\`${c}\``).join(' · ')}`);
  L.push('', '## Languages', '| Language | Files | Lines |', '|---|---:|---:|', ...r.languages.slice(0, top).map((l) => `| ${l.language}${l.code ? '' : ' (data/docs)'} | ${l.files} | ${l.loc} |`));
  if (r.entryPoints) {
    L.push('', `## Entry points (${r.entryPoints.length})`);
    const fmt = (e) => e.kind === 'bin' ? `- bin \`${e.name}\` → ${e.file}` : e.kind === 'main' || e.kind === 'export' ? `- ${e.kind} ${e.file}` : `- ${e.kind.padEnd(6)} ${e.method ? e.method + ' ' : ''}${e.methods?.length ? e.methods.join(',') + ' ' : ''}${e.route}  ${e.file}`;
    L.push(...r.entryPoints.slice(0, top * 3).map(fmt));
    if (r.entryPoints.length > top * 3) L.push(`- … ${r.entryPoints.length - top * 3} more (--json for all)`);
    L.push('', '## Core modules (most imported internally — change with care, test first)', '| Module | Imported by | Lines |', '|---|---:|---:|', ...r.coreModules.slice(0, top).map((m) => `| ${m.file} | ${m.importedBy} | ${m.loc} |`));
    L.push('', `## Import cycles (${r.cycles.length})`, ...(r.cycles.length ? r.cycles.slice(0, top).map((c) => `- ${c.slice(0, 8).join(' ⇄ ')}${c.length > 8 ? ` (+${c.length - 8})` : ''}`) : ['- none']));
    L.push('', '## Largest files', ...r.largest.slice(0, Math.min(top, 10)).map((f) => `- ${f.file} — ${f.loc} lines`));
    L.push('', `## Tests: ${r.testFiles} test files`);
  }
  if ('hotspots' in r) {
    L.push('', `## Hotspots (since ${r.since}; score = commits × √lines; fixes = commits whose message says fix/bug/revert)`);
    if (!r.hotspots) L.push('- no git history');
    else if (!r.hotspots.rows.length) L.push(`- ${r.hotspots.commits} commits, no files changed in the window`);
    else L.push(`${r.hotspots.commits} commits in the window.`, '| File | Commits | Fixes | Authors | Lines |', '|---|---:|---:|---:|---:|', ...r.hotspots.rows.slice(0, top).map((h) => `| ${h.file} | ${h.commits} | ${h.fixes} | ${h.authors} | ${h.loc} |`));
  }
  if (r.risks) {
    const by = (sev) => r.risks.filter((x) => x.severity === sev);
    L.push('', `## Risk markers (${r.risks.length}) — candidates, confirm by reading the code`);
    for (const sev of ['high', 'medium']) {
      const list = by(sev);
      L.push('', `### ${sev.toUpperCase()} (${list.length})`);
      L.push(...(list.length ? list.slice(0, top * 2).map((x) => `- ${x.id} — ${x.message} — ${x.file}:${x.line}${x.excerpt ? `  \`${x.excerpt.replace(/`/g, "'")}\`` : ''}`) : ['- none']));
      if (list.length > top * 2) L.push(`- … ${list.length - top * 2} more (--json for all)`);
    }
    const low = by('low');
    const groups = new Map();
    for (const x of low) { const g = groups.get(x.id) || { message: x.message, n: 0, at: [] }; g.n++; if (g.at.length < 3) g.at.push(`${x.file}:${x.line}`); groups.set(x.id, g); }
    L.push('', `### LOW (${low.length})`, ...(groups.size ? [...groups].sort((a, b) => b[1].n - a[1].n).map(([id, g]) => `- ${id} ×${g.n} — ${g.message} — e.g. ${g.at.join(', ')}`) : ['- none']));
  }
  if (r.unreferenced?.length) L.push('', `## Unreferenced code files (${r.unreferenced.length}) — verify before deleting: dynamic imports, framework conventions and external callers are invisible here`, ...r.unreferenced.slice(0, top).map((f) => `- ${f}`));
  return L.join('\n') + '\n';
}

function main() {
  const args = process.argv.slice(2);
  const valued = new Set(['--top', '--since', '--fail-on', '--out']);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
  const positional = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
  if (args.includes('--help') || args.includes('-h')) { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 11).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); return; }
  const root = positional[0] || '.';
  if (!existsSync(root)) { console.error(`code-scan: ${root} does not exist`); process.exit(2); }
  const only = new Set(['map', 'hotspots', 'risks'].filter((k) => args.includes(`--${k}`)));
  const top = Math.max(1, parseInt(opt('--top', '15'), 10) || 15);
  const r = scan(root, { since: opt('--since'), only: only.size ? only : null });
  const text = args.includes('--json') ? JSON.stringify(r, null, 2) + '\n' : toMarkdown(r, top);
  const out = opt('--out');
  if (out) { writeFileSync(out, text, 'utf8'); console.log(`code-scan: wrote ${out}`); } else process.stdout.write(text);
  const failOn = opt('--fail-on');
  if (failOn && r.risks) {
    const levels = failOn === 'medium' ? ['high', 'medium'] : ['high'];
    const hits = r.risks.filter((x) => levels.includes(x.severity) && !x.test);
    if (hits.length) { console.error(`code-scan: ${hits.length} risk marker(s) at ${failOn} or above`); process.exit(1); }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
