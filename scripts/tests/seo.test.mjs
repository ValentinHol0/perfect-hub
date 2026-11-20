import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { convertAgent, patchRuntime, rewriteRoot, stripFooter } from '../seo-sync.mjs';

const require = createRequire(import.meta.url);
const { filePathFrom, shouldValidate } = require('../seo-schema-hook.js');
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SEO = join(ROOT, 'seo');
const rel = (p) => relative(SEO, p).split('\\').join('/');

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const guides = () => walk(SEO).filter((p) => p.endsWith('.md') && !rel(p).startsWith('tests/'));

test('sync transforms: root paths, footer, agents, runtime', () => {
  assert.equal(rewriteRoot('"${CLAUDE_PLUGIN_ROOT}/scripts/claude-seo" run a.py'), '"<PLUGIN_ROOT>/seo/scripts/claude-seo" run a.py');
  const f = stripFooter('# Hub\n\n## Community Footer\nads skool.com\n\n## Reference Files\nkeep');
  assert.ok(f.removed);
  assert.equal(f.text, '# Hub\n\n## Reference Files\nkeep');
  const agent = convertAgent('---\nname: seo-x\ndescription: Does X.\nmodel: sonnet\nmaxTurns: 30\ntools: Read, Bash, Write  # note\n---\n\nRun `${CLAUDE_PLUGIN_ROOT}/scripts/a.py`.\n', { seat: true });
  assert.match(agent, /^---\nname: seo-x\ndescription: "Does X\."\nmodel: inherit\nmaxTurns: 30\ntools:\n  - Read\n  - Bash\n  - Write\n---\n/);
  assert.throws(() => convertAgent('---\nname: seo-y\ndescription: Y.\n---\nbody'), /no tools allowlist/);
  const folded = convertAgent('---\nname: seo-z\ndescription: >\n  Semantic clustering using\n  SERP overlap.\nmodel: opus\ntools: Read\n---\nbody');
  assert.match(folded, /\ndescription: "Semantic clustering using SERP overlap\."\n/);
  assert.ok(agent.includes('<PLUGIN_ROOT>/seo/scripts/a.py'));
  assert.ok(agent.includes('## Council seat'));
  const py = 'return (root / ".claude-plugin" / "plugin.json").is_file() and not (root / ".git").exists()\nreturn (base / "claude-seo").resolve(), "plugin-fallback"';
  const patched = patchRuntime(py);
  assert.ok(patched.includes('runtime-plugin.json') && patched.includes('"perfect-hub-seo"'));
});

test('vendored engine: licence, manifest, patched runtime, LF launcher', () => {
  const v = JSON.parse(readFileSync(join(SEO, 'VENDORED.json'), 'utf8'));
  assert.equal(v.license, 'MIT');
  assert.match(readFileSync(join(SEO, 'LICENSE'), 'utf8'), /MIT License[\s\S]*agricidaniel/i);
  assert.equal(JSON.parse(readFileSync(join(SEO, 'runtime-plugin.json'), 'utf8')).version, v.version);
  const rt = readFileSync(join(SEO, 'scripts', 'runtime.py'), 'utf8');
  assert.ok(rt.includes('(root / "runtime-plugin.json").is_file()') && rt.includes('"perfect-hub-seo"'));
  assert.ok(!readFileSync(join(SEO, 'scripts', 'claude-seo'), 'utf8').includes('\r'), 'launcher must keep LF endings');
});

test('guides: no unsubstituted plugin root, no community footer', () => {
  for (const g of guides()) {
    const t = readFileSync(g, 'utf8');
    assert.ok(!t.includes('${CLAUDE_PLUGIN_ROOT}'), `${rel(g)} still has \${CLAUDE_PLUGIN_ROOT}`);
    assert.ok(!/skool\.com/.test(t), `${rel(g)} still has the community footer`);
  }
});

test('every script a guide or agent runs is bundled', () => {
  const scripts = new Set(readdirSync(join(SEO, 'scripts')));
  for (const ext of readdirSync(join(SEO, 'extensions'))) {
    const d = join(SEO, 'extensions', ext, 'scripts');
    if (existsSync(d)) for (const s of readdirSync(d)) scripts.add(s);
  }
  const agents = readdirSync(join(ROOT, 'agents')).filter((n) => n.startsWith('seo-')).map((n) => join(ROOT, 'agents', n));
  const missing = new Set();
  for (const f of [...guides(), ...agents, join(ROOT, 'skills', 'seo', 'SKILL.md')]) {
    for (const m of readFileSync(f, 'utf8').matchAll(/claude-seo"? run (?:--extension [\w-]+ )?([\w-]+\.py)/g)) if (!scripts.has(m[1])) missing.add(`${m[1]} (${relative(ROOT, f)})`);
  }
  assert.deepEqual([...missing], []);
});

test('agents: every vendored agent exists and keeps the upstream permission model', () => {
  const v = JSON.parse(readFileSync(join(SEO, 'VENDORED.json'), 'utf8'));
  assert.ok(v.agents.length >= 20);
  for (const a of v.agents) {
    const t = readFileSync(join(ROOT, 'agents', a), 'utf8');
    const fm = t.split('\n---')[0];
    assert.match(fm, new RegExp(`^---\\nname: ${a.replace('.md', '')}\\n`));
    assert.match(fm, /\nmodel: inherit/);
    const desc = (fm.match(/\ndescription: "(.*)"\n/) || [])[1] || '';
    assert.ok(desc.length >= 40 && !/^[>|]/.test(desc), `${a}: description lost (${desc})`);
    const block =(fm.match(/\ntools:\n((?: {2}- .*\n?)+)/) || [])[1];
    assert.ok(block, `${a} lost its tools allowlist (YAML list)`);
    const list = block.trim().split('\n').map((s) => s.replace(/^\s*- /, '').trim());
    // agents that read untrusted pages with Bash never get an MCP grant (paid APIs)
    if (list.includes('Bash')) assert.ok(!list.some((x) => x.startsWith('mcp__')), `${a}: Bash and MCP together`);
    // MCP agents get no shell and no open web
    if (list.some((x) => x.startsWith('mcp__'))) for (const x of ['Bash', 'WebFetch', 'WebSearch']) assert.ok(!list.includes(x), `${a}: MCP agent has ${x}`);
  }
  const df = readFileSync(join(ROOT, 'agents', 'seo-dataforseo.md'), 'utf8');
  assert.match(df, /\ntools:\n(?: {2}- .*\n)*? {2}- mcp__dataforseo__\*\n/);
  assert.ok(readFileSync(join(ROOT, 'agents', 'seo-technical.md'), 'utf8').includes('## Council seat'));
});

test('/seo routes every command to an existing guide', () => {
  const hub = readFileSync(join(ROOT, 'skills', 'seo', 'SKILL.md'), 'utf8');
  const table = hub.slice(hub.indexOf('| Command |'), hub.indexOf('## Full audit'));
  const commands = [...table.matchAll(/`([a-z][a-z-]*)(?: [^`]*)?`/g)].map((m) => m[1]).filter((c) => !['setup', 'doctor'].includes(c));
  assert.ok(commands.length >= 30, `only ${commands.length} commands parsed`);
  const extDir = { bing: 'bing-webmaster' };
  for (const c of new Set(commands)) {
    const core = join(SEO, 'skills', `seo-${c}`, 'SKILL.md');
    const ext = join(SEO, 'extensions', extDir[c] || c, 'skills', `seo-${c}`, 'SKILL.md');
    assert.ok(existsSync(core) || existsSync(ext), `no guide for /seo ${c}`);
  }
});

test('schema hook starts Python only for markup that holds JSON-LD', () => {
  assert.equal(filePathFrom('{"tool_input":{"file_path":"/x/a.html"}}'), '/x/a.html');
  assert.equal(filePathFrom('not json'), '');
  const dir = mkdtempSync(join(tmpdir(), 'seo-hook-'));
  try {
    const plain = join(dir, 'a.html');
    const ld = join(dir, 'b.tsx');
    const md = join(dir, 'c.md');
    writeFileSync(plain, '<h1>Hi</h1>');
    writeFileSync(ld, '<script type="application/ld+json">{"@context":"https://schema.org"}</script>');
    writeFileSync(md, '<script type="application/ld+json">{}</script>');
    assert.equal(shouldValidate(plain), false);
    assert.equal(shouldValidate(ld), true);
    assert.equal(shouldValidate(md), false);
    assert.equal(shouldValidate(join(dir, 'missing.html')), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
