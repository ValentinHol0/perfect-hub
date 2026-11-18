# Absolute Proactive (Perfect Hub 4.0)


The chat is a lossy buffer: compaction summarises it, new sessions forget it. Anything that must survive goes to disk **before** you act on it.

## 1. WAL — Write-Ahead Log (`SESSION-STATE.md` at project root)
**Triggers** (scan every user message):
- Corrections: "no, it's X", "actually…", "don't do Y".
- Preferences: style/direction choices, libraries (e.g. Phosphor vs Lucide), density, language of UI copy, naming.
- Decisions: architecture, data model, vendors, scope cuts.
- Explicit values: ports, paths, endpoints, env var NAMES (never secret values — write `<in .env>` instead).

**Action:** append the entry first, then do the work.
```markdown
## 2026-11-12 14:05 · DECISION
Use Zustand for client state; no Redux. Reason: user preference, small app.
## 2026-11-12 14:20 · CORRECTION
Buttons are sentence case, not Title Case.
```
Keep it ≤ ~150 lines: merge superseded entries (latest wins, note what it replaced).

## 2. Working Buffer (`memory/working-buffer.md`)
Activate when the session is long (many turns, large tool outputs, or after the first compaction):
- After each substantive exchange append: the user's request (verbatim if short), what was done, files touched, open threads.
- Rotate: keep the last ~40 entries.
- Claude Code automates part of this: the plugin's PreCompact hook appends your last user requests to `memory/working-buffer.md` before every compaction (only in projects that have `SESSION-STATE.md` or `.planning/`). Still log decisions and what you did yourself — the hook only sees the user's words.

## 3. Recovery
- The plugin's **SessionStart hook** (matchers `compact`, `resume`) prints `SESSION-STATE.md`, `memory/working-buffer.md` and `.planning/STATE.md` back into context automatically.
- If you see a compaction summary and no restored block, read those files yourself before continuing. Do not ask the user to repeat context that is on disk.
- On conflict between the summary and the files, the files win.

## 4. Background work
- Long-running commands: run in the background (Bash `run_in_background`) and continue; you are notified on completion — do not poll in a sleep loop.
- Recurring checks the user asked for: the built-in `/loop` or scheduled tasks — never invent cron jobs unasked.
- Routine maintenance never interrupts the user; results go to the log, problems go to the final report.

## 5. Hygiene
- Never write secrets, tokens or personal data into these files.
- Add `memory/` to `.gitignore` if the user doesn't want it committed; `SESSION-STATE.md` may be committed when it records project decisions — ask once.
