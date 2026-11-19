#!/usr/bin/env node
// PostToolUse (Edit|Write): validates JSON-LD in the edited file with the SEO
// engine's validate-schema.py. Starts Python only for files that can hold markup
// and actually contain JSON-LD, so ordinary edits cost one stat and one read.
// Exit 2 (critical schema errors) is fed back to Claude; off: SEO_SCHEMA_HOOK=off.
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXTENSIONS = ['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.php', '.ejs', '.astro'];
const MAX_BYTES = 2 * 1024 * 1024;

function filePathFrom(raw) {
  try {
    const event = JSON.parse(raw || '{}');
    const input = event.tool_input || {};
    return input.file_path || input.path || '';
  } catch {
    return '';
  }
}

function shouldValidate(file) {
  if (!file || !EXTENSIONS.includes(path.extname(file).toLowerCase())) return false;
  try {
    const st = fs.statSync(file);
    if (!st.isFile() || st.size > MAX_BYTES) return false;
    return /application\/ld\+json|"@context"\s*:/.test(fs.readFileSync(file, 'utf8'));
  } catch {
    return false;
  }
}

function main() {
  if (String(process.env.SEO_SCHEMA_HOOK || '').toLowerCase() === 'off') return 0;
  const raw = (() => { try { return fs.readFileSync(0, 'utf8'); } catch { return ''; } })();
  const file = filePathFrom(raw);
  if (!shouldValidate(file)) return 0;
  const hooks = path.join(__dirname, '..', 'seo', 'hooks');
  const r = spawnSync(process.execPath, [path.join(hooks, 'run-python-hook.js'), path.join(hooks, 'validate-schema.py'), file], {
    input: raw,
    encoding: 'utf8',
    timeout: 25000,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  // No usable Python or a timeout must never block the user's edit.
  if (r.error || r.status === null) return 0;
  return r.status === 2 ? 2 : 0;
}

if (require.main === module) process.exit(main());
module.exports = { filePathFrom, shouldValidate };
