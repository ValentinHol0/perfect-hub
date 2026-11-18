#!/usr/bin/env node
/**
 * ledger.js — persistent task ledger for /absolute and Ralph Loop (single source of truth: .planning/STATE.md).
 *
 *   node ledger.js init [plan.md]            Create or MERGE the ledger from a plan (default .planning/ROADMAP.md).
 *                                            Existing task statuses are preserved; new tasks are appended.
 *   node ledger.js next                      Print the first task that is IN_PROGRESS, else the first PENDING whose deps are COMPLETE.
 *   node ledger.js ready                     Print ALL PENDING tasks whose deps are COMPLETE (JSON array) — candidates for parallel dispatch.
 *   node ledger.js round <id> [n]            Record the fix round of a task (default: increment). Prints the new round.
 *   node ledger.js set <id> <STATUS> [note]  STATUS: PENDING | IN_PROGRESS | COMPLETE | BLOCKED. Note: commit sha, fix round, blocker.
 *   node ledger.js status                    Print counts and the task table.
 *   node ledger.js brief <id>                Extract the task's section from the plan → .planning/tasks/task-<id>.md (prints path).
 *   node ledger.js package <id> [round]      Write the uncommitted diff since HEAD (incl. new files, excl. .planning/)
 *                                            → .planning/reviews/task-<id>-r<round>.diff (prints path) for reviewers.
 *
 * Plan format parsed: "### Task <N>: <title>" headings (optional "- Depends on: [1, 2]" line below),
 * or checklist lines "- [ ] Task <N>: <title>" / "- [x] <title>".
 * Exit codes: 0 ok · 1 nothing left / not found · 2 usage error.
 */

const fs = require('fs');
const path = require('path');

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETE', 'BLOCKED'];
const STATE_FILE = path.join(process.cwd(), '.planning', 'STATE.md');

function parsePlan(text) {
  const tasks = [];
  let current = null;
  let auto = 1;
  // When the plan uses "### Task N:" headings, checklist lines are acceptance criteria inside tasks, not tasks.
  const headingMode = /^#{2,4}\s+Task\s+\d+/im.test(text);
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^#{2,4}\s+Task\s+(\d+)\s*[:.\-—]\s*(.+?)\s*$/i);
    const check = !headingMode && line.match(/^\s*[-*]\s+\[([ xX])\]\s+(?:Task\s+(\d+)\s*[:.\-—]\s*)?(.+?)\s*$/);
    // Only a list item that starts with "Depends on" counts (plain or **bold**); prose mentioning "depends on" is ignored.
    // Accepted values: [1, 2] · 1, 2 · Task 1, Task 2 · [] · none.
    const deps = line.match(/^\s*[-*]\s+(?:\*\*)?depends[\s_-]*on(?:\*\*)?\s*:?(?:\*\*)?\s*(.*)$/i);
    if (heading) {
      current = { id: Number(heading[1]), title: heading[2], deps: [], depsSet: false, status: 'PENDING' };
      tasks.push(current);
    } else if (check) {
      current = { id: check[2] ? Number(check[2]) : null, title: check[3], deps: [], depsSet: false, status: check[1].trim() ? 'COMPLETE' : 'PENDING' };
      tasks.push(current);
    } else if (deps && current && !current.depsSet) {
      current.deps = (deps[1].match(/\d+/g) || []).map(Number);
      current.depsSet = true;
    }
  }
  const used = new Set(tasks.filter((t) => t.id !== null).map((t) => t.id));
  for (const t of tasks) {
    if (t.id === null) {
      while (used.has(auto)) auto++;
      t.id = auto;
      used.add(auto);
    }
  }
  return tasks;
}

function readState() {
  if (!fs.existsSync(STATE_FILE)) return { plan: '', tasks: [], log: [] };
  const text = fs.readFileSync(STATE_FILE, 'utf8');
  const plan = (text.match(/^Plan:\s*(.+)$/m) || [])[1] || '';
  const tasks = [];
  const withRound = /\|\s*Round\s*\|/.test(text);
  const row = withRound
    ? /^\|\s*(\d+)\s*\|\s*(PENDING|IN_PROGRESS|COMPLETE|BLOCKED)\s*\|\s*([^|]*)\|\s*(\d*)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/gm
    : /^\|\s*(\d+)\s*\|\s*(PENDING|IN_PROGRESS|COMPLETE|BLOCKED)\s*\|\s*([^|]*)\|()\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/gm; // v3.1 files without the Round column
  for (const m of text.matchAll(row)) {
    tasks.push({ id: Number(m[1]), status: m[2], deps: m[3].trim() ? m[3].split(',').map((d) => Number(d.trim())) : [], round: Number(m[4] || 0), title: m[5], note: m[6] });
  }
  const logStart = text.indexOf('## Log');
  const log = logStart >= 0 ? text.slice(logStart + 6).split(/\r?\n/).filter((l) => l.startsWith('- ')) : [];
  return { plan, tasks, log };
}

function writeState(state) {
  const esc = (s) => String(s || '').replace(/\|/g, '/');
  const rows = state.tasks
    .sort((a, b) => a.id - b.id)
    .map((t) => `| ${t.id} | ${t.status} | ${t.deps.join(', ')} | ${t.round || 0} | ${esc(t.title)} | ${esc(t.note)} |`);
  const counts = STATUSES.map((s) => `${s}: ${state.tasks.filter((t) => t.status === s).length}`).join(' · ');
  const out = [
    '# Project State',
    `Plan: ${state.plan}`,
    `Updated: ${new Date().toISOString()}`,
    `Summary: ${counts}`,
    '',
    '## Tasks',
    '| ID | Status | Depends on | Round | Title | Note |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
    '## Log',
    ...state.log,
    '',
  ].join('\n');
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, out, 'utf8');
}

function init(planArg) {
  const planPath = path.resolve(planArg || path.join('.planning', 'ROADMAP.md'));
  if (!fs.existsSync(planPath)) {
    console.error(`ledger: plan not found: ${planPath}`);
    process.exit(2);
  }
  const parsed = parsePlan(fs.readFileSync(planPath, 'utf8'));
  if (!parsed.length) {
    console.error('ledger: no tasks found. Use "### Task N: title" headings or "- [ ] title" checklist lines.');
    process.exit(2);
  }
  const state = readState();
  const existing = new Map(state.tasks.map((t) => [t.id, t]));
  let added = 0;
  for (const t of parsed) {
    const prev = existing.get(t.id);
    if (prev) {
      prev.title = t.title;
      prev.deps = t.deps;
      if (t.status === 'COMPLETE') prev.status = 'COMPLETE';
    } else {
      state.tasks.push({ ...t, round: 0, note: '' });
      added++;
    }
  }
  state.plan = path.relative(process.cwd(), planPath).replace(/\\/g, '/');
  state.log.push(`- ${new Date().toISOString()} init from ${state.plan}: ${parsed.length} tasks parsed, ${added} new`);
  writeState(state);
  console.log(`ledger: ${STATE_FILE} — ${state.tasks.length} tasks (${added} new, ${state.tasks.length - added} preserved)`);
}

function next() {
  const { tasks } = readState();
  const done = new Set(tasks.filter((t) => t.status === 'COMPLETE').map((t) => t.id));
  const pick = tasks.find((t) => t.status === 'IN_PROGRESS') || tasks.find((t) => t.status === 'PENDING' && t.deps.every((d) => done.has(d)));
  if (!pick) {
    const blocked = tasks.filter((t) => t.status === 'BLOCKED' || t.status === 'PENDING');
    console.log(blocked.length ? `NONE_READY (${blocked.length} pending/blocked)` : 'ALL_COMPLETE');
    process.exit(1);
  }
  console.log(JSON.stringify(pick));
}

function ready() {
  const { tasks } = readState();
  const done = new Set(tasks.filter((t) => t.status === 'COMPLETE').map((t) => t.id));
  const list = tasks.filter((t) => t.status === 'PENDING' && t.deps.every((d) => done.has(d)));
  console.log(JSON.stringify(list));
  if (!list.length) process.exit(1);
}

function round(id, n) {
  const state = readState();
  const task = state.tasks.find((t) => t.id === Number(id));
  if (!task) {
    console.error(`ledger: task ${id} not found`);
    process.exit(1);
  }
  task.round = n === undefined ? (task.round || 0) + 1 : Number(n);
  if (!Number.isInteger(task.round) || task.round < 0) {
    console.error('ledger: round must be a non-negative integer');
    process.exit(2);
  }
  state.log.push(`- ${new Date().toISOString()} task ${id} fix round ${task.round}`);
  writeState(state);
  console.log(task.round);
}

function set(id, status, note) {
  status = String(status || '').toUpperCase();
  if (!STATUSES.includes(status)) {
    console.error(`ledger: status must be one of ${STATUSES.join(', ')}`);
    process.exit(2);
  }
  const state = readState();
  const task = state.tasks.find((t) => t.id === Number(id));
  if (!task) {
    console.error(`ledger: task ${id} not found`);
    process.exit(1);
  }
  task.status = status;
  if (note) task.note = note;
  state.log.push(`- ${new Date().toISOString()} task ${id} → ${status}${note ? ` (${note})` : ''}`);
  writeState(state);
  console.log(`ledger: task ${id} → ${status}`);
}

function status() {
  if (!fs.existsSync(STATE_FILE)) {
    console.log('ledger: no .planning/STATE.md yet — run "init" with a plan.');
    process.exit(1);
  }
  process.stdout.write(fs.readFileSync(STATE_FILE, 'utf8'));
}

function brief(id) {
  const { plan } = readState();
  const planPath = path.resolve(plan || path.join('.planning', 'ROADMAP.md'));
  if (!fs.existsSync(planPath)) {
    console.error(`ledger: plan not found: ${planPath}`);
    process.exit(1);
  }
  const lines = fs.readFileSync(planPath, 'utf8').split(/\r?\n/);
  const start = lines.findIndex((l) => new RegExp(`^#{2,4}\\s+Task\\s+${Number(id)}\\s*[:.\\-—]`, 'i').test(l));
  if (start < 0) {
    console.error(`ledger: "### Task ${id}:" not found in ${planPath}`);
    process.exit(1);
  }
  const level = lines[start].match(/^#+/)[0].length;
  let end = lines.findIndex((l, i) => i > start && new RegExp(`^#{1,${level}}\\s`).test(l));
  if (end < 0) end = lines.length;
  const out = path.join(process.cwd(), '.planning', 'tasks', `task-${Number(id)}.md`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, lines.slice(start, end).join('\n').trim() + '\n', 'utf8');
  console.log(out);
}

function reviewPackage(id, round = '1') {
  const { execFileSync } = require('child_process');
  const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const exclude = [':(exclude).planning', ':(exclude).visual-review', ':(exclude)memory', ':(exclude)SESSION-STATE.md'];
  try {
    git(['add', '--intent-to-add', '--', '.', ...exclude]); // make new files visible to the diff without staging content
    let base = 'HEAD';
    let baseLabel;
    try {
      baseLabel = git(['rev-parse', '--short', '--verify', 'HEAD']).trim();
    } catch {
      base = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'; // git's empty tree: repository has no commits yet
      baseLabel = 'empty tree (no commits yet)';
    }
    const stat = git(['diff', base, '--stat', '--', '.', ...exclude]);
    const diff = git(['diff', base, '-U10', '--', '.', ...exclude]);
    const out = path.join(process.cwd(), '.planning', 'reviews', `task-${Number(id)}-r${round}.diff`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, `# Review package: task ${id}, round ${round}\n# Uncommitted changes since ${baseLabel}\n\n${stat}\n${diff}`, 'utf8');
    console.log(out);
  } catch (err) {
    console.error(`ledger: git failed — ${err.message.split('\n')[0]}`);
    process.exit(1);
  }
}

module.exports = { parsePlan, readState };

if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2);
  const commands = {
    init: () => init(rest[0]),
    next,
    ready,
    round: () => round(rest[0], rest[1]),
    set: () => set(rest[0], rest[1], rest.slice(2).join(' ')),
    status,
    brief: () => brief(rest[0]),
    package: () => reviewPackage(rest[0], rest[1]),
  };
  if (!commands[cmd] || (['brief', 'package', 'round'].includes(cmd) && !rest[0])) {
    console.error('Usage: node ledger.js init [plan.md] | next | ready | set <id> <STATUS> [note] | round <id> [n] | status | brief <id> | package <id> [round]');
    process.exit(2);
  }
  commands[cmd]();
}
