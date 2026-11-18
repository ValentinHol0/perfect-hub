#!/usr/bin/env node
/**
 * restore-state.js — SessionStart hook (matchers: compact, resume).
 * Re-injects the project's persisted working memory after context compaction or session resume,
 * implementing the absolute (memory) WAL/Working-Buffer protocol and the Ralph Loop ledger.
 * Prints nothing (and costs nothing) when none of the files exist. Never fails the session.
 */

const fs = require('fs');
const path = require('path');

const FILES = [
  ['SESSION-STATE.md', 'Write-ahead log: decisions, corrections, preferences'],
  [path.join('memory', 'working-buffer.md'), 'Working buffer: recent exchanges before compaction'],
  [path.join('.planning', 'STATE.md'), 'Task ledger'],
  [path.join('.planning', 'goal.json'), 'absolute-goal state — evidence decides; run goal.mjs status for gaps'],
];
const MAX_PER_FILE = 6000;

function tail(text, max) {
  return text.length <= max ? text : `…(truncated, showing last ${max} chars)…\n${text.slice(-max)}`;
}

try {
  let cwd = process.cwd();
  try {
    const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
    if (input.cwd) cwd = input.cwd;
  } catch {
    /* no stdin payload — use process cwd */
  }
  const parts = [];
  for (const [rel, label] of FILES) {
    const file = path.join(cwd, rel);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8').trim();
    if (text) parts.push(`### ${rel.replace(/\\/g, '/')} — ${label}\n${tail(text, MAX_PER_FILE)}`);
  }
  if (parts.length) {
    console.log(
      [
        '[perfect-hub] Restored persisted project state. Treat it as authoritative over the compacted summary; re-read the full files if details are missing.',
        ...parts,
      ].join('\n\n')
    );
  }
} catch {
  /* never block session start */
}
process.exit(0);
