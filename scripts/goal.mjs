#!/usr/bin/env node
// goal — state and evidence for /absolute-goal: idea → release. The model never certifies its own work: phase gates,
// feature status and release readiness change only when this script runs the check command and records the result
// (exit code, log, commit SHA). State: .planning/goal.json (machine) · PROGRESS.md · ASSUMPTIONS.md · evidence/.
//
// node goal.mjs init "<idea>" [--platform web|mobile|desktop|api|cli] [--max-iterations 400] [--max-hours 48]
// node goal.mjs status [--json]
// node goal.mjs require <phase> <check-id> -- <command…>      register a check for a phase (P0..P6, or "release")
// node goal.mjs check <check-id|phase|all>                    run checks, record evidence (exit 1 if any fails)
// node goal.mjs feature add <id> "<title>" --accept "<criterion>" [--mvp]
// node goal.mjs feature pass <id> -- <command…>               runs the command; passes only on exit 0
// node goal.mjs feature list
// node goal.mjs advance                                       next phase if the current gate is met (else lists gaps)
// node goal.mjs block <human|external|technical> "<what>" "<how to unblock>" · unblock <id>
// node goal.mjs assume "<assumption>" · log "<line>" · decision "<slug>" "<file>"
// node goal.mjs pause | resume | stop | release-check | ship
// Zero dependencies, Node >= 18. Exit 0 ok · 1 gate/check not met · 2 usage or state error.
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const PHASES = [
  ['P0', 'Charter', 'BRIEF.md: audience, value, non-goals, platform, success metrics, constraints; council decision on scope, platform and stack'],
  ['P1', 'Spec', 'features with testable acceptance criteria and MVP tags; no conflicts'],
  ['P2', 'Architecture & design', 'decision records for hard-to-reverse choices; threat model; DESIGN.md for products with a UI'],
  ['P3', 'Walking skeleton', 'repo, CI, test harness and one end-to-end smoke check green'],
  ['P4', 'Build', 'every MVP feature passes its end-to-end check'],
  ['P5', 'Hardening', 'performance, accessibility, security, states, observability, docs — hardening checks green'],
  ['P6', 'Release candidate', 'every release check green at HEAD on a clean tree → release_ready'],
];
const DIR = (root) => join(root, '.planning');
const FILE = (root) => join(DIR(root), 'goal.json');
const now = () => new Date().toISOString();
const sh = (cmd, cwd) => { try { return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }).trim(); } catch { return ''; } };
export const head = (root) => sh('git rev-parse HEAD', root) || 'no-git';
export const dirty = (root) => sh('git status --porcelain', root).split('\n').filter((l) => l && !/\.planning\//.test(l)).length > 0;

export function load(root) {
  if (!existsSync(FILE(root))) throw Object.assign(new Error('no goal here — run: goal.mjs init "<idea>"'), { code: 2 });
  try { return JSON.parse(readFileSync(FILE(root), 'utf8')); } catch (e) { throw Object.assign(new Error(`goal.json is corrupt (${e.message}) — fix or restore it from git; nothing was changed`), { code: 2 }); }
}
export function save(root, g) { g.updated_at = now(); mkdirSync(DIR(root), { recursive: true }); writeFileSync(FILE(root), JSON.stringify(g, null, 2) + '\n'); }
const progress = (root, g, line) => appendFileSync(join(DIR(root), 'PROGRESS.md'), `- ${now()} · iter ${g.iteration} · ${g.phase} · ${head(root).slice(0, 7)} · ${line}\n`);

export function init(root, idea, o = {}) {
  if (existsSync(FILE(root)) && !o.force) throw Object.assign(new Error('a goal already exists here (status, resume, or init --force to replace it)'), { code: 2 });
  mkdirSync(join(DIR(root), 'evidence'), { recursive: true });
  mkdirSync(join(DIR(root), 'decisions'), { recursive: true });
  const g = {
    version: 1, goal_id: `g-${now().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6)}`, session_id: null,
    idea, platform: o.platform || 'web', status: 'active', phase: 'P0', iteration: 0,
    limits: { max_iterations: o.maxIterations ?? 400, max_hours: o.maxHours ?? 48, no_progress_rescue: 3, no_progress_pause: 6 },
    started_at: now(), updated_at: now(),
    streaks: { no_progress: 0, fingerprint: null },
    checks: {}, features: {}, blockers: [], decisions: [],
  };
  save(root, g);
  if (!existsSync(join(DIR(root), 'ASSUMPTIONS.md'))) writeFileSync(join(DIR(root), 'ASSUMPTIONS.md'), '# Assumptions to review\n\nDecisions taken without the user; each line: what · why · cost if wrong.\n\n');
  progress(root, g, `goal started: ${idea}`);
  return g;
}

function runCheck(root, g, id) {
  const c = g.checks[id];
  const log = join(DIR(root), 'evidence', `${id}.log`);
  const t0 = Date.now();
  const r = spawnSync(c.cmd, { cwd: root, shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: (c.timeout || 900) * 1000 });
  writeFileSync(log, `$ ${c.cmd}\n# exit ${r.status} · ${((Date.now() - t0) / 1000).toFixed(1)}s · ${now()}\n\n${r.stdout || ''}\n${r.stderr || ''}`);
  c.evidence = { exit: r.status ?? -1, sha: head(root), dirty: dirty(root), at: now(), log: `.planning/evidence/${id}.log`, seconds: +((Date.now() - t0) / 1000).toFixed(1) };
  return c.evidence.exit === 0;
}
const passedAtHead = (root, e) => !!e && e.exit === 0 && e.sha === head(root);

export function gaps(root, g, phase = g.phase) {
  const out = [];
  const P = (f) => existsSync(join(DIR(root), f)) || existsSync(join(root, f));
  const phaseChecks = Object.entries(g.checks).filter(([, c]) => c.phase === phase);
  for (const [id, c] of phaseChecks) if (!passedAtHead(root, c.evidence)) out.push(`check ${id} not green at HEAD (${c.evidence ? `exit ${c.evidence.exit} @ ${c.evidence.sha.slice(0, 7)}` : 'never run'})`);
  const feats = Object.entries(g.features);
  if (phase === 'P0') {
    if (!P('BRIEF.md')) out.push('.planning/BRIEF.md missing');
    if (!g.decisions.length) out.push('no council decision recorded (scope, platform, stack)');
  }
  if (phase === 'P1') {
    if (!feats.length) out.push('no features — add them with: feature add <id> "<title>" --accept "<criterion>" [--mvp]');
    if (!feats.some(([, f]) => f.mvp)) out.push('no feature tagged --mvp');
    for (const [id, f] of feats) if (!f.accept) out.push(`feature ${id} has no acceptance criterion`);
  }
  if (phase === 'P2') {
    if (g.decisions.length < 2) out.push('architecture decisions missing (at least the data/stack decision beyond the charter)');
    if (['web', 'mobile', 'desktop'].includes(g.platform) && !existsSync(join(root, 'DESIGN.md'))) out.push('DESIGN.md missing for a product with a UI');
  }
  if (phase === 'P3' && !phaseChecks.length) out.push('register at least one skeleton check (CI/test/e2e smoke): require P3 <id> -- <cmd>');
  if (phase === 'P4') for (const [id, f] of feats) if (f.mvp && !(f.evidence && f.evidence.exit === 0)) out.push(`MVP feature ${id} not passing its end-to-end check`);
  if (phase === 'P5' && !phaseChecks.length) out.push('register hardening checks (performance, accessibility, security, audit): require P5 <id> -- <cmd>');
  if (phase === 'P6') {
    const rel = Object.entries(g.checks).filter(([, c]) => c.phase === 'release' || c.phase === 'P6');
    if (!rel.length) out.push('register release checks: require release <id> -- <cmd> (build, tests, e2e, audit, site/store checks)');
    for (const [id, c] of rel) if (!passedAtHead(root, c.evidence) || c.evidence.dirty) out.push(`release check ${id} not green at HEAD on a clean tree`);
    for (const [id, f] of feats) if (f.mvp && !(f.evidence && f.evidence.exit === 0)) out.push(`MVP feature ${id} not passing`);
    if (dirty(root)) out.push('working tree has uncommitted changes');
    if (g.blockers.some((b) => !b.resolved)) out.push('open blockers');
  }
  return [...new Set(out)];
}

export function summary(root, g) {
  const f = Object.values(g.features); const c = Object.values(g.checks);
  const open = g.blockers.filter((b) => !b.resolved);
  return `absolute-goal ${g.goal_id} · ${g.status} · ${g.phase} ${PHASES.find((p) => p[0] === g.phase)?.[1] || ''} · iter ${g.iteration}/${g.limits.max_iterations} · features ${f.filter((x) => x.evidence?.exit === 0).length}/${f.length} (MVP ${f.filter((x) => x.mvp && x.evidence?.exit === 0).length}/${f.filter((x) => x.mvp).length}) · checks ${c.filter((x) => x.evidence?.exit === 0).length}/${c.length} · blockers ${open.length}`;
}

function main() {
  const root = resolve(process.env.GOAL_ROOT || process.cwd());
  const argv = process.argv.slice(2);
  const dash = argv.indexOf('--');
  const args = dash >= 0 ? argv.slice(0, dash) : argv;
  const cmdTail = dash >= 0 ? argv.slice(dash + 1).join(' ') : '';
  const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
  const [cmd, a1, a2, a3] = args;
  const fail = (m, code = 2) => { console.error(`goal: ${m}`); process.exit(code); };
  try {
    if (cmd === 'init') {
      if (!a1) fail('usage: init "<idea>" [--platform web|mobile|desktop|api|cli]');
      const g = init(root, a1, { platform: opt('platform'), maxIterations: opt('max-iterations') ? +opt('max-iterations') : undefined, maxHours: opt('max-hours') ? +opt('max-hours') : undefined, force: args.includes('--force') });
      console.log(summary(root, g)); return;
    }
    const g = load(root);
    switch (cmd) {
      case 'status': {
        if (args.includes('--json')) { console.log(JSON.stringify(g, null, 2)); return; }
        console.log(summary(root, g));
        console.log(`Phase gate ${g.phase}: ${PHASES.find((p) => p[0] === g.phase)?.[2] || ''}`);
        const gp = gaps(root, g); console.log(gp.length ? `Gaps:\n${gp.map((x) => `- ${x}`).join('\n')}` : 'Gate met — run: goal.mjs advance');
        const open = g.blockers.filter((b) => !b.resolved); if (open.length) console.log(`Blockers:\n${open.map((b) => `- ${b.id} [${b.kind}] ${b.what} → ${b.unblock}`).join('\n')}`);
        return;
      }
      case 'require': {
        if (!a1 || !a2 || !cmdTail) fail('usage: require <phase> <check-id> -- <command>');
        if (![...PHASES.map((p) => p[0]), 'release'].includes(a1)) fail(`unknown phase ${a1}`);
        g.checks[a2] = { phase: a1, cmd: cmdTail, evidence: g.checks[a2]?.cmd === cmdTail ? g.checks[a2].evidence : undefined };
        save(root, g); console.log(`check ${a2} registered for ${a1}: ${cmdTail}`); return;
      }
      case 'check': {
        const ids = a1 === 'all' ? Object.keys(g.checks) : g.checks[a1] ? [a1] : Object.keys(g.checks).filter((id) => g.checks[id].phase === a1);
        if (!ids.length) fail(`no checks match ${a1}`);
        let ok = true;
        for (const id of ids) { const pass = runCheck(root, g, id); ok &&= pass; console.log(`${pass ? 'PASS' : 'FAIL'} ${id} (exit ${g.checks[id].evidence.exit}) → ${g.checks[id].evidence.log}`); }
        save(root, g); progress(root, g, `checks ${ids.join(',')}: ${ok ? 'green' : 'red'}`); process.exit(ok ? 0 : 1);
      }
      case 'feature': {
        if (a1 === 'add') { if (!a2 || !a3) fail('usage: feature add <id> "<title>" --accept "<criterion>" [--mvp]'); g.features[a2] = { title: a3, accept: opt('accept') || '', mvp: args.includes('--mvp'), evidence: undefined }; save(root, g); console.log(`feature ${a2} added`); return; }
        if (a1 === 'pass') {
          if (!g.features[a2] || !cmdTail) fail('usage: feature pass <id> -- <end-to-end command>');
          const id = `feature-${a2}`; g.checks[id] = { phase: 'P4', cmd: cmdTail };
          const pass = runCheck(root, g, id); g.features[a2].evidence = g.checks[id].evidence; delete g.checks[id];
          save(root, g); progress(root, g, `feature ${a2}: ${pass ? 'passes' : 'fails'}`); console.log(`${pass ? 'PASS' : 'FAIL'} feature ${a2}`); process.exit(pass ? 0 : 1);
        }
        if (a1 === 'list') { for (const [id, f] of Object.entries(g.features)) console.log(`${f.evidence?.exit === 0 ? '✔' : '·'} ${id}${f.mvp ? ' [MVP]' : ''} — ${f.title} — accept: ${f.accept || '(missing)'}`); return; }
        fail('usage: feature add|pass|list');
      }
      case 'advance': {
        const gp = gaps(root, g);
        if (gp.length) { console.log(`Gate ${g.phase} not met:\n${gp.map((x) => `- ${x}`).join('\n')}`); process.exit(1); }
        const i = PHASES.findIndex((p) => p[0] === g.phase);
        if (i === PHASES.length - 1) { console.log('Already at the release candidate — run: goal.mjs release-check'); return; }
        g.phase = PHASES[i + 1][0]; save(root, g); progress(root, g, `advanced to ${g.phase}`); console.log(summary(root, g)); return;
      }
      case 'release-check': {
        if (g.phase !== 'P6') fail(`release-check runs in P6; current phase is ${g.phase}`, 1);
        const rel = Object.keys(g.checks).filter((id) => ['release', 'P6'].includes(g.checks[id].phase));
        for (const id of rel) runCheck(root, g, id);
        const gp = gaps(root, g, 'P6');
        if (gp.length) { save(root, g); console.log(`Not release-ready:\n${gp.map((x) => `- ${x}`).join('\n')}`); process.exit(1); }
        g.status = 'release_ready'; save(root, g); progress(root, g, 'RELEASE READY — publishing waits for the user'); console.log(`RELEASE READY at ${head(root).slice(0, 7)}. Publishing (production deploy, store submission) is the user's step: /absolute-goal ship`); return;
      }
      case 'ship': { if (g.status !== 'release_ready') fail('ship only after release-check says RELEASE READY', 1); g.status = 'done'; save(root, g); progress(root, g, 'shipped by the user'); console.log('goal done'); return; }
      case 'block': {
        if (!['human', 'external', 'technical'].includes(a1) || !a2) fail('usage: block <human|external|technical> "<what>" "<how to unblock>"');
        const id = `B${g.blockers.length + 1}`; g.blockers.push({ id, kind: a1, what: a2, unblock: a3 || '', since: now(), resolved: false }); save(root, g); progress(root, g, `blocker ${id}: ${a2}`); console.log(id); return;
      }
      case 'unblock': { const b = g.blockers.find((x) => x.id === a1); if (!b) fail(`no blocker ${a1}`); b.resolved = true; if (g.status === 'blocked_human') g.status = 'active'; save(root, g); console.log(`${a1} resolved`); return; }
      case 'assume': { if (!a1) fail('usage: assume "<text>"'); appendFileSync(join(DIR(root), 'ASSUMPTIONS.md'), `- ${a1}\n`); progress(root, g, `assumption: ${a1}`); return; }
      case 'decision': { if (!a1) fail('usage: decision "<slug>" "<file>"'); g.decisions.push({ slug: a1, file: a2 || '', at: now() }); save(root, g); return; }
      case 'log': { progress(root, g, a1 || ''); return; }
      case 'pause': case 'stop': g.status = 'paused'; save(root, g); progress(root, g, `${cmd} by user`); console.log(summary(root, g)); return;
      case 'resume': if (g.status === 'release_ready' || g.status === 'done') fail(`goal is ${g.status}`, 1); g.status = 'active'; g.streaks.no_progress = 0; save(root, g); console.log(summary(root, g)); return;
      default: fail('usage: init | status | require | check | feature | advance | block | unblock | assume | decision | log | pause | resume | stop | release-check | ship');
    }
  } catch (e) { fail(e.message, e.code || 2); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
