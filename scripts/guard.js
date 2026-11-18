#!/usr/bin/env node
// guard — Claude Code PreToolUse hook (Bash, PowerShell). Turns clearly destructive or outward commands into an
// "ask" permission prompt with the reason, instead of letting them run silently: broad recursive deletes, history
// rewrites and discarded work in git, database drops/resets, infrastructure teardown, publishing and production
// deploys, disk formatting, piping a download into a shell. Everything else passes untouched (no output).
// Never blocks outright — the user decides. Disable with env PPP_GUARD=off or a file .planning/guard-off.
// Antigravity has no hooks; its always-on rule carries the same "ask before destructive actions" instruction.
'use strict';
const fs = require('fs');
const path = require('path');

// Remove quoted strings and heredoc bodies so words inside commit messages or file contents don't trigger rules.
function stripQuoted(cmd) {
  return cmd
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(?=\n|$)/g, ' ')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'[^']*'/g, "''");
}

// Broad targets: filesystem/drive roots, top-level system folders, home folders, the current/parent folder, bare globs, .git
const DANGEROUS_TARGET = /^(?:\/\*?|\/[^/\s*]+\/?|\/(?:home|Users)\/[^/\s]+\/?\*?|\/[a-z]\/Users(?:\/[^/\s]+)?\/?\*?|~\/?\*?|\$HOME\/?\*?|\$\{HOME\}\/?\*?|\.\/?\*?|\.\.\/?\*?|\*|\.git\/?|[A-Za-z]:[\\/]?\*?|[A-Za-z]:[\\/](?:Users|Windows|Program Files(?: \(x86\))?)(?:[\\/][^\\/\s]+)?[\\/]?\*?|%USERPROFILE%|\$env:USERPROFILE)$/i;

function broadDelete(raw) {
  // quotes removed but their content kept ("$HOME" still counts); heredoc bodies dropped
  const cmd = raw.replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(?=\n|$)/g, ' ').replace(/["']/g, '');
  // POSIX rm
  for (const m of cmd.matchAll(/(?:^|[;&|(]\s*|\b(?:sudo|xargs|exec)\s+)rm\s+([^;&|)\n]+)/g)) {
    const toks = m[1].trim().split(/\s+/);
    const flags = toks.filter((t) => t.startsWith('-')).join(' ');
    const recursive = /(^|\s)-[a-zA-Z]*[rR]|--recursive/.test(flags);
    const targets = toks.filter((t) => !t.startsWith('-'));
    const hit = targets.find((t) => DANGEROUS_TARGET.test(t.replace(/^['"]|['"]$/g, '')));
    if (recursive && hit) return `recursive delete of a broad path (${hit})`;
  }
  // PowerShell Remove-Item / rd /s
  for (const m of cmd.matchAll(/\b(?:Remove-Item|ri|rm|rmdir|rd|del)\b([^;|\n]*)/gi)) {
    const rest = m[1];
    if (!/-Recurse\b|\/s\b/i.test(rest)) continue;
    const targets = rest.split(/\s+/).filter((t) => t && !t.startsWith('-') && !/^\/[sq]$/i.test(t));
    const hit = targets.find((t) => DANGEROUS_TARGET.test(t.replace(/^['"]|['"]$/g, '')));
    if (hit) return `recursive delete of a broad path (${hit})`;
  }
  return null;
}

// [id, regex, reason, scope]  scope 'code' = matched against the command without quoted strings; 'all' = raw text
const RULES = [
  ['git-force-push', /\bgit\s+push\b[^;&|\n]*(?:\s--force(?:-with-lease)?\b|\s-[a-zA-Z]*f\b|\s\+\S+|\s--mirror\b)/, 'force push rewrites remote history (prefer --force-with-lease on your own branch, never on a shared one)', 'code'],
  ['git-push-delete', /\bgit\s+push\b[^;&|\n]*(?:\s--delete\b|\s-d\b|\s:\S+)/, 'deletes a remote branch or tag', 'code'],
  ['git-reset-hard', /\bgit\s+reset\b[^;&|\n]*\s--hard\b/, 'git reset --hard discards uncommitted work', 'code'],
  ['git-clean', /\bgit\s+clean\b[^;&|\n]*\s-[a-zA-Z]*f/, 'git clean -f deletes untracked files permanently', 'code'],
  ['git-discard-all', /\bgit\s+checkout\b(?:\s+--?[\w-]+)*\s+(?:--\s+)?\.(?:\s|$)|\bgit\s+restore\b(?![^;&|\n]*--staged(?![^;&|\n]*(?:--worktree|\s-W\b)))(?:\s+--?[\w-]+)*\s+(?:--\s+)?\.(?:\s|$)/, 'discards all uncommitted changes in the tree', 'code'],
  ['git-stash-drop', /\bgit\s+stash\s+(?:drop|clear)\b/, 'drops stashed work permanently', 'code'],
  ['git-branch-D', /\bgit\s+branch\b[^;&|\n]*\s-D\b/, 'force-deletes a branch even if unmerged', 'code'],
  ['git-rewrite', /\bgit\s+(?:filter-branch|filter-repo)\b|\bgit\s+update-ref\s+-d\b|\bgit\s+reflog\s+expire\b|\bgit\s+gc\b[^;&|\n]*--prune=now/, 'rewrites or prunes git history', 'code'],
  ['sql-destructive', /\b(?:psql|mysql|mariadb|sqlite3|sqlcmd|mongosh?|clickhouse-client|cockroach\s+sql|turso\s+db\s+shell|wrangler\s+d1\s+execute|prisma\s+db\s+execute|supabase\s+db)\b[\s\S]*\b(?:DROP\s+(?:TABLE|DATABASE|SCHEMA|INDEX)|TRUNCATE\b|DELETE\s+FROM\s+[\w."`]+\s*(?:;|$|["'`])|dropDatabase\s*\()/i, 'destructive SQL against a database (drop/truncate/delete without WHERE)', 'all'],
  ['db-reset', /\bprisma\s+migrate\s+reset\b|\bprisma\s+db\s+push\b[^;&|\n]*--(?:force-reset|accept-data-loss)|\bdrizzle-kit\s+drop\b|\b(?:rails|rake)\s+db:(?:drop|reset|schema:load)\b|\bmanage\.py\s+flush\b|\bsequelize(?:-cli)?\s+db:drop\b|\bsupabase\s+db\s+reset\b|\bdropdb\b|\bredis-cli\b[^;&|\n]*\bflush(?:all|db)\b/i, 'resets or drops a database', 'code'],
  ['infra-destroy', /\bterraform\s+destroy\b|\bterraform\s+apply\b[^;&|\n]*-auto-approve|\bpulumi\s+destroy\b|\bkubectl\s+delete\b|\bhelm\s+(?:uninstall|delete)\b|\bdocker\s+(?:system|volume|image|builder)\s+prune\b|\bdocker[\s-]compose\s+down\b[^;&|\n]*(?:\s-v\b|--volumes)|\baws\s+s3\s+(?:rm|rb)\b[^;&|\n]*--recursive|\baz\s+group\s+delete\b|\bgcloud\b[^;&|\n]*\bdelete\b/, 'tears down infrastructure or deletes cloud resources', 'code'],
  ['publish', /\b(?:npm|pnpm|bun)\s+publish\b|\byarn\s+(?:npm\s+)?publish\b|\bcargo\s+publish\b|\btwine\s+upload\b|\bgem\s+push\b|\bdotnet\s+nuget\s+push\b|\bflutter\s+pub\s+publish\b|\bgh\s+release\s+create\b|\bgh\s+pr\s+merge\b|\bgh\s+repo\s+(?:delete|archive)\b/, 'publishes a package/release or merges — visible to others and hard to undo', 'code'],
  ['deploy-prod', /\bvercel\b[^;&|\n]*\s--prod\b|\bnetlify\s+deploy\b[^;&|\n]*\s--prod\b|\bfirebase\s+deploy\b|\bfly(?:ctl)?\s+deploy\b|\bwrangler\s+(?:deploy|publish)\b|\beas\s+submit\b|\bfastlane\s+(?:deliver|supply|pilot|release)\b|\bheroku\s+[^;&|\n]*\b(?:destroy|releases:rollback)\b|\bserverless\s+(?:deploy|remove)\b/, 'deploys to production or submits to a store', 'code'],
  ['disk', /\bmkfs(?:\.\w+)?\b|\bdd\b[^;&|\n]*\bof=\/dev\/|\bformat\s+[a-z]:|\bdiskpart\b|\bFormat-Volume\b|\bClear-Disk\b|:\(\)\s*\{\s*:\|:&\s*\};:/i, 'formats or overwrites a disk', 'code'],
  ['chmod-root', /\bch(?:mod|own)\s+-R\b[^;&|\n]*\s\/(?:\s|$)/, 'recursive permission change on /', 'code'],
  ['pipe-to-shell', /\b(?:curl|wget)\b[^|;\n]*\|\s*(?:sudo\s+)?(?:sh|bash|zsh|python3?|node)\b|\b(?:iwr|irm|Invoke-WebRequest|Invoke-RestMethod)\b[^|;\n]*\|\s*(?:iex|Invoke-Expression)\b/i, 'runs a downloaded script without reviewing it', 'code'],
];

function check(command) {
  if (!command || typeof command !== 'string') return null;
  const code = stripQuoted(command);
  const del = broadDelete(command);
  if (del) return { id: 'broad-delete', reason: del };
  for (const [id, re, reason, scope] of RULES) if (re.test(scope === 'all' ? command : code)) return { id, reason };
  return null;
}

function disabled(cwd) {
  if (String(process.env.PPP_GUARD || '').toLowerCase() === 'off') return true;
  try { return fs.existsSync(path.join(cwd || process.cwd(), '.planning', 'guard-off')); } catch { return false; }
}

function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => { raw += d; });
  process.stdin.on('end', () => {
    let input;
    try { input = JSON.parse(raw || '{}'); } catch { return; }
    if (disabled(input.cwd)) return;
    const hit = check(input.tool_input && input.tool_input.command);
    if (!hit) return;
    const shown = String(input.tool_input.command).replace(/\s+/g, ' ').slice(0, 160);
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: `PPP guard (${hit.id}): ${hit.reason}. Command: ${shown}. Approve only if this is intended. (Disable: PPP_GUARD=off or .planning/guard-off)`,
      },
    }));
  });
}

module.exports = { check, stripQuoted };
if (require.main === module) main();
