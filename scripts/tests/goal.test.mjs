// Run: node --test scripts/tests/goal.test.mjs   (from the plugin root)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOAL = join(SCRIPTS, 'goal.mjs');
const { decide } = createRequire(import.meta.url)(join(SCRIPTS, 'goal-guard.js'));
const gitOk = spawnSync('git', ['--version']).status === 0;

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'ppp-goal-'));
  if (gitOk) {
    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
    writeFileSync(join(dir, 'README.md'), '# app\n');
    execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=T', 'add', '-A'], { cwd: dir });
    execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=T', 'commit', '-qm', 'init'], { cwd: dir });
  }
  return dir;
}
const goal = (dir, ...args) => spawnSync(process.execPath, [GOAL, ...args], { cwd: dir, encoding: 'utf8' });
const state = (dir) => JSON.parse(readFileSync(join(dir, '.planning', 'goal.json'), 'utf8'));
const ok = (r) => { assert.equal(r.status, 0, r.stdout + r.stderr); return r.stdout; };

test('goal: init creates state, refuses a second goal, status lists the P0 gaps', () => {
  const dir = repo();
  ok(goal(dir, 'init', 'Barbershop booking app', '--platform', 'web'));
  assert.equal(state(dir).phase, 'P0');
  assert.equal(goal(dir, 'init', 'again').status, 2);
  const s = ok(goal(dir, 'status'));
  assert.match(s, /BRIEF\.md missing/);
  assert.match(s, /no council decision/);
  assert.ok(existsSync(join(dir, '.planning', 'ASSUMPTIONS.md')) && existsSync(join(dir, '.planning', 'PROGRESS.md')));
  rmSync(dir, { recursive: true, force: true });
});

test('goal: gates only advance on evidence; checks record exit, log and sha', { skip: !gitOk }, () => {
  const dir = repo();
  ok(goal(dir, 'init', 'App'));
  assert.equal(goal(dir, 'advance').status, 1);
  writeFileSync(join(dir, '.planning', 'BRIEF.md'), '# brief\n');
  ok(goal(dir, 'decision', '001-scope', '.planning/decisions/001-scope.md'));
  ok(goal(dir, 'advance'));
  assert.equal(state(dir).phase, 'P1');
  ok(goal(dir, 'feature', 'add', 'book', 'Book a slot', '--accept', 'a visitor books a free slot and gets a confirmation', '--mvp'));
  ok(goal(dir, 'advance'));
  ok(goal(dir, 'decision', '002-stack', 'x'));
  writeFileSync(join(dir, 'DESIGN.md'), '# design\n');
  ok(goal(dir, 'advance'));
  assert.equal(state(dir).phase, 'P3');
  ok(goal(dir, 'require', 'P3', 'smoke', '--', 'node -e "process.exit(1)"'));
  assert.equal(goal(dir, 'check', 'smoke').status, 1);
  assert.equal(state(dir).checks.smoke.evidence.exit, 1);
  assert.equal(goal(dir, 'advance').status, 1);
  ok(goal(dir, 'require', 'P3', 'smoke', '--', 'node -e "console.log(42)"'));
  ok(goal(dir, 'check', 'P3'));
  const ev = state(dir).checks.smoke.evidence;
  assert.equal(ev.exit, 0);
  assert.equal(ev.sha.length, 40);
  assert.match(readFileSync(join(dir, ev.log), 'utf8'), /42/);
  ok(goal(dir, 'advance'));
  assert.equal(state(dir).phase, 'P4');
  assert.equal(goal(dir, 'feature', 'pass', 'book', '--', 'node -e "process.exit(3)"').status, 1);
  assert.equal(goal(dir, 'advance').status, 1);
  ok(goal(dir, 'feature', 'pass', 'book', '--', 'node -e "0"'));
  ok(goal(dir, 'advance'));
  assert.equal(state(dir).phase, 'P5');
  rmSync(dir, { recursive: true, force: true });
});

test('goal: release-check needs P6, green checks at HEAD on a clean tree and no open blockers; ship needs release_ready', { skip: !gitOk }, () => {
  const dir = repo();
  ok(goal(dir, 'init', 'App'));
  const g = state(dir); g.phase = 'P6'; writeFileSync(join(dir, '.planning', 'goal.json'), JSON.stringify(g));
  assert.equal(goal(dir, 'ship').status, 1);
  ok(goal(dir, 'require', 'release', 'build', '--', 'node -e "0"'));
  const b = ok(goal(dir, 'block', 'human', 'Apple signing certificate', 'user creates it')).trim();
  writeFileSync(join(dir, 'stray.txt'), 'x');
  let r = goal(dir, 'release-check');
  assert.equal(r.status, 1);
  assert.match(r.stdout, /uncommitted|clean tree/);
  assert.match(r.stdout, /open blockers/);
  rmSync(join(dir, 'stray.txt'));
  ok(goal(dir, 'unblock', b));
  ok(goal(dir, 'release-check'));
  assert.equal(state(dir).status, 'release_ready');
  ok(goal(dir, 'ship'));
  assert.equal(state(dir).status, 'done');
  rmSync(dir, { recursive: true, force: true });
});

test('goal-guard: allows when there is no active goal; blocks with the next step; binds the session', () => {
  const dir = repo();
  assert.equal(decide({ cwd: dir }), null);
  ok(goal(dir, 'init', 'App'));
  const out = decide({ cwd: dir, session_id: 's1' });
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /Goal not reached \(P0 Charter\)/);
  assert.match(out.reason, /goal\.mjs" status/);
  assert.match(out.systemMessage, /absolute-goal 1\/400/);
  assert.equal(state(dir).session_id, 's1');
  assert.equal(decide({ cwd: dir, session_id: 'other' }), null, 'another session is not looped');
  rmSync(dir, { recursive: true, force: true });
});

test('goal-guard: background tasks, STOP file, limits and stalls let the session stop', () => {
  const dir = repo();
  ok(goal(dir, 'init', 'App', '--max-iterations', '3'));
  assert.equal(decide({ cwd: dir, background_tasks: [{ id: 'a', status: 'running' }] }), null);
  assert.equal(decide({ cwd: dir }).decision, 'block');
  assert.equal(decide({ cwd: dir }).decision, 'block');
  assert.match(decide({ cwd: dir }).reason, /No progress|Goal not reached/);
  const lim = decide({ cwd: dir });
  assert.equal(lim.decision, undefined);
  assert.match(lim.systemMessage, /limit/);
  assert.equal(state(dir).status, 'paused');
  ok(goal(dir, 'resume'));
  const g = state(dir); g.limits.max_iterations = 100; writeFileSync(join(dir, '.planning', 'goal.json'), JSON.stringify(g));
  mkdirSync(join(dir, '.planning'), { recursive: true }); writeFileSync(join(dir, '.planning', 'STOP'), '');
  assert.match(decide({ cwd: dir }).systemMessage, /paused/);
  assert.equal(state(dir).status, 'paused');
  rmSync(dir, { recursive: true, force: true });
});

test('goal-guard: no-progress rescue then pause; a "done" claim without evidence is rejected', () => {
  const dir = repo();
  ok(goal(dir, 'init', 'App'));
  const reasons = [];
  for (let i = 0; i < 7; i++) { const o = decide({ cwd: dir }); if (o) reasons.push(o.reason || o.systemMessage); } // 1st turn records the fingerprint
  assert.ok(reasons.some((r) => /No progress for 3 turns/.test(r)), reasons.join('\n'));
  assert.match(reasons.at(-1), /paused: no progress/);
  ok(goal(dir, 'resume'));
  const c = decide({ cwd: dir, last_assistant_message: 'All good. <goal-status>DONE</goal-status>' });
  assert.match(c.reason, /Completion was claimed in chat/);
  writeFileSync(join(dir, '.planning', 'goal.json'), '{broken');
  assert.match(decide({ cwd: dir }).systemMessage, /unreadable/);
  rmSync(dir, { recursive: true, force: true });
});
