#!/usr/bin/env node
/**
 * pre-compact.js — PreCompact hook (Claude Code). Automates the absolute (memory) Working Buffer:
 * before the conversation is compacted, the last user requests are appended to memory/working-buffer.md,
 * so they survive the summary. Runs only in projects PPP manages (SESSION-STATE.md or .planning/ exists).
 * Silent, never blocks, never writes elsewhere.
 */
const fs = require('fs');
const path = require('path');

const KEEP_REQUESTS = 8;
const MAX_ENTRIES = 40;

function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.filter((c) => c && c.type === 'text').map((c) => c.text).join('\n');
  return '';
}

try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const cwd = input.cwd || process.cwd();
  const managed = fs.existsSync(path.join(cwd, 'SESSION-STATE.md')) || fs.existsSync(path.join(cwd, '.planning'));
  if (!managed || !input.transcript_path || !fs.existsSync(input.transcript_path)) process.exit(0);

  const requests = [];
  for (const line of fs.readFileSync(input.transcript_path, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.type !== 'user' || !entry.message || entry.isMeta) continue;
    const text = textOf(entry.message.content).trim();
    if (!text || text.startsWith('<') || /tool_result/.test(JSON.stringify(entry.message.content).slice(0, 40))) continue;
    requests.push(text.length > 1200 ? `${text.slice(0, 1200)}…` : text);
  }
  if (!requests.length) process.exit(0);

  const file = path.join(cwd, 'memory', 'working-buffer.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '# Working buffer\n';
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const block = [`## ${stamp} · before compaction (${input.trigger || 'auto'})`, ...requests.slice(-KEEP_REQUESTS).map((r) => `- USER: ${r.replace(/\r?\n/g, ' ⏎ ')}`), ''].join('\n');

  const [head, ...entries] = (previous.trimEnd() + '\n\n' + block).split(/\n(?=## )/);
  fs.writeFileSync(file, [head, ...entries.slice(-MAX_ENTRIES)].join('\n') + '\n', 'utf8');
} catch {
  /* never interfere with compaction */
}
process.exit(0);
