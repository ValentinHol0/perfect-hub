#!/usr/bin/env node
/**
 * goal-guard.js — Stop hook for /absolute-goal. Keeps the session working until the goal is release-ready, using
 * only evidence on disk (.planning/goal.json written by goal.mjs); never trusts a "done" claim in the chat.
 *
 * Allows the stop (prints nothing) when: no goal.json · status is not "active" · the goal belongs to another session ·
 * background tasks are still running (their completion wakes the session) · .planning/STOP exists or
 * ABSOLUTE_GOAL_DISABLE=1 (→ paused) · iteration or hour limit reached (→ paused) · no progress for
 * limits.no_progress_pause turns (→ paused). Otherwise blocks with a short, state-derived reason: the next step.
 * After limits.no_progress_rescue idle turns the reason switches to a rescue plan. Any error → allow (never traps).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const git = (cwd, args) => { try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).trim(); } catch { return ''; } };
const GOAL = `node "${path.join(path.resolve(__dirname), 'goal.mjs')}"`;
const PHASE_NAMES = { P0: 'Charter', P1: 'Spec', P2: 'Architecture & design', P3: 'Walking skeleton', P4: 'Build', P5: 'Hardening', P6: 'Release candidate' };

function ledgerCounts(cwd) {
  const p = path.join(cwd, '.planning', 'STATE.md');
  if (!fs.existsSync(p)) return { done: 0, total: 0, next: null };
  const rows = [...fs.readFileSync(p, 'utf8').matchAll(/^\|\s*(\d+)\s*\|\s*(PENDING|IN_PROGRESS|COMPLETE|BLOCKED)\s*\|\s*([^|]*)\|\s*([^|]*)\|/gm)];
  const done = new Set(rows.filter((r) => r[2] === 'COMPLETE').map((r) => r[1]));
  const next = rows.find((r) => r[2] === 'IN_PROGRESS') || rows.find((r) => r[2] === 'PENDING' && r[3].split(',').map((d) => d.trim()).filter(Boolean).every((d) => done.has(d)));
  return { done: done.size, total: rows.length, next: next ? `task ${next[1]}${next[4].trim() ? ` (${next[4].trim().slice(0, 80)})` : ''}` : null };
}

function decide(input, env = process.env) {
  const cwd = input.cwd || process.cwd();
  const file = path.join(cwd, '.planning', 'goal.json');
  if (!fs.existsSync(file)) return null;
  let g;
  try { g = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return { systemMessage: 'absolute-goal: .planning/goal.json is unreadable — loop paused; fix it and run goal.mjs resume.' }; }
  if (g.status !== 'active') return null;
  const save = () => { g.updated_at = new Date().toISOString(); fs.writeFileSync(file, JSON.stringify(g, null, 2) + '\n'); };
  if (input.session_id) {
    if (!g.session_id) g.session_id = input.session_id;
    else if (g.session_id !== input.session_id) return null;
  }
  if (fs.existsSync(path.join(cwd, '.planning', 'STOP')) || env.ABSOLUTE_GOAL_DISABLE === '1') {
    g.status = 'paused'; save();
    return { systemMessage: 'absolute-goal paused (STOP file or ABSOLUTE_GOAL_DISABLE). Resume: node goal.mjs resume.' };
  }
  if ((input.background_tasks || []).some((t) => !t.status || /running|pending|in_progress/i.test(t.status))) { save(); return null; }

  g.iteration = (g.iteration || 0) + 1;
  const lim = g.limits || {};
  const hours = (Date.now() - Date.parse(g.started_at || new Date().toISOString())) / 3.6e6;
  if (g.iteration > (lim.max_iterations || 400) || hours > (lim.max_hours || 48)) {
    g.status = 'paused'; g.pause_reason = 'limit'; save();
    return { systemMessage: `absolute-goal paused at its limit (iteration ${g.iteration}, ${hours.toFixed(1)} h). Review PROGRESS.md; resume with goal.mjs resume after raising limits.` };
  }

  const L = ledgerCounts(cwd);
  const feats = Object.values(g.features || {});
  const checks = Object.values(g.checks || {});
  const fp = crypto.createHash('sha1').update([
    git(cwd, ['rev-parse', 'HEAD']), git(cwd, ['status', '--porcelain']), g.phase, L.done,
    feats.filter((f) => f.evidence && f.evidence.exit === 0).length, checks.filter((c) => c.evidence && c.evidence.exit === 0).length, (g.decisions || []).length,
  ].join('|')).digest('hex');
  g.streaks = g.streaks || {};
  g.streaks.no_progress = g.streaks.fingerprint === fp ? (g.streaks.no_progress || 0) + 1 : 0;
  g.streaks.fingerprint = fp;
  if (g.streaks.no_progress >= (lim.no_progress_pause || 6)) {
    g.status = 'paused'; g.pause_reason = 'no progress'; save();
    return { systemMessage: `absolute-goal paused: no progress in ${g.streaks.no_progress} turns. See PROGRESS.md and blockers; resume with goal.mjs resume.` };
  }
  save();

  const last = String(input.last_assistant_message || '');
  const claimed = /<goal-status>\s*(DONE|RELEASE[_ ]READY)\s*<\/goal-status>/i.test(last);
  const phase = `${g.phase} ${PHASE_NAMES[g.phase] || ''}`.trim();
  const status = `absolute-goal ${g.iteration}/${lim.max_iterations || 400} · ${phase} · tasks ${L.done}/${L.total} · features ${feats.filter((f) => f.evidence && f.evidence.exit === 0).length}/${feats.length}`;
  let reason;
  if (claimed) reason = `Completion was claimed in chat, but goal.json is not release_ready. Evidence decides: run \`${GOAL} status\`, close every listed gap, then \`${GOAL} release-check\`.`;
  else if (g.streaks.no_progress >= (lim.no_progress_rescue || 3)) reason = `No progress for ${g.streaks.no_progress} turns in ${phase}. Rescue: re-read .planning/goal.json and PROGRESS.md; if a task keeps failing, dispatch absolute-debugger, or mark it BLOCKED (ledger.js set <id> BLOCKED "<why>") and take an independent task; if a decision is stuck, convene the council; if only the user can unblock it, record it with \`${GOAL} block human "<what>" "<how>"\` and continue with other work.`;
  else reason = `Goal not reached (${phase}). Next: ${L.next || `run \`${GOAL} status\` and close the first gap of this phase`}. One task per turn: do it, verify it with a command, commit, record evidence with goal.mjs, then continue. Re-read .planning/goal.json and STATE.md if unsure where you are.`;
  return { decision: 'block', reason, systemMessage: status };
}

if (require.main === module) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => { raw += d; });
  process.stdin.on('end', () => {
    try {
      const out = decide(JSON.parse(raw || '{}'));
      if (out) process.stdout.write(JSON.stringify(out));
    } catch { /* never trap the session */ }
    process.exit(0);
  });
}
module.exports = { decide };
