---
name: absolute-goal
description: "Takes an idea for a website, app or program all the way to a release candidate, as long as it takes: charter, spec, architecture and design, walking skeleton, build, hardening, release checks. The council of specialist agents debates every costly decision, the workshop builds with TDD and review gates, and a Stop hook keeps the session working until evidence on disk says release-ready; publishing stays the user's call. Use when the user invokes /absolute-goal with an idea."
disable-model-invocation: true
argument-hint: "<idea> | status | pause | resume | stop | ship"
---

# /absolute-goal — idea → release

You run the office in goal mode: the same pipelines as `/absolute` (`${CLAUDE_PLUGIN_ROOT}/skills/absolute/references/pipelines.md`), the same council (`perfect-hub:absolute-council`), but you do not stop until `goal.mjs` says **RELEASE READY** — or a human must act. Publishing (production deploy, store submission) is never automatic.

State and evidence: `node "${CLAUDE_PLUGIN_ROOT}/scripts/goal.mjs" <cmd>` (call it `G` below) → `.planning/goal.json`, `PROGRESS.md`, `ASSUMPTIONS.md`, `evidence/`, `council/`. The Stop hook (`goal-guard.js`) reads that state after every turn: while the goal is active it sends you back to work with the next step; it never trusts "done" in the chat — only `G release-check`. Escape hatches: Esc/Ctrl+C, `/absolute-goal pause`, a `.planning/STOP` file. Don't run Claude Code's built-in `/goal` at the same time.

## Commands
- `/absolute-goal <idea>` → start (below). `status` → `G status`. `pause` / `stop` → `G pause`. `resume` → `G resume` and continue from `G status`. `ship` → only after RELEASE READY and the user's go-ahead for the outward step: deploy/submit with the project's mechanism (P12), smoke-check, then `G ship`.

## Start
1. `G init "<idea>" --platform web|mobile|desktop|api|cli` (infer the platform; ask only if the idea is truly ambiguous). Set limits if the user gave any (`--max-iterations`, `--max-hours`).
2. Ask at most 3 questions whose answers change the product (audience, platform, must-have) with recommended defaults; if the user is away, take the defaults and `G assume "…"` each one.
3. Announce: idea · platform · phases · how to pause · that publishing waits for them.

## Phases and gates (`G status` lists the gaps; `G advance` moves on only when the gate is met)
| Phase | Work | Council | Gate (evidence) |
|---|---|---|---|
| **P0 Charter** | `.planning/BRIEF.md`: audience and their job, value, non-goals, platform, success metrics, constraints, competitors (`/research` if the market is unknown) | standard: scope cut, platform and stack — Product, Architect, Frontend/Mobile, Backend, Contrarian | BRIEF.md + `G decision` recorded |
| **P1 Spec** | user stories with Given/When/Then; `G feature add <id> "<title>" --accept "<criterion>" [--mvp]` for each; MVP line | quick: the MVP line — Product, UX, QA | features with criteria, MVP tagged |
| **P2 Architecture & design** | decision records for data model, auth, API, key dependencies; threat model (security auditor); references → DESIGN.md (`absolute-designer`) | standard per one-way door; quick for visual direction (Visual, UX, Antislop, Product + Brand) | ≥ 2 decisions, DESIGN.md for a UI |
| **P3 Walking skeleton** | repo, CI, test harness, lint, preview deploy if available, one e2e smoke test | — (rulings only) | `G require P3 <id> -- <cmd>` checks green (`G check P3`) |
| **P4 Build** | MVP features in dependency order: ledger (`ledger.js init` from the spec) → Ralph loop per task (test-engineer → implementer → reviewer ∥ auditor → commit); after each feature `G feature pass <id> -- <e2e command>` | quick on blocked or disputed tasks; standard if a decision must be reopened | every MVP feature passes its e2e check |
| **P5 Hardening** | performance budgets, accessibility, security audit, empty/error/loading states, observability, docs, `antislop.mjs --gate` on UI and copy, `site-check.mjs` / store checks | quick go/no-go on anything risky | `G require P5 …` checks green |
| **P6 Release candidate** | changelog, version, release checks from `release-checks.md` registered as `G require release <id> -- <cmd>`; clean tree | quick go/no-go (QA, Security, DevOps) | `G release-check` → RELEASE READY |
Requirements are append-only: a failing gate adds gap tasks; never weaken a test or delete an accepted criterion to pass.

## Every iteration (one task per turn)
`G status` → take the next task from the ledger or the first gap → do it with the right agent → verify with a command → commit → record (`G check …`, `G feature pass …`, `G decision …`, `G log "…"`) → stop the turn; the hook brings you back. Re-read `goal.json`, `STATE.md` and `PROGRESS.md` after compaction — they are the truth, not your memory.

## When things go wrong
- A task fails 3 times (fresh implementer each time) → `absolute-debugger`; still failing → `ledger.js set <id> BLOCKED "<why>"`, continue with independent tasks.
- Review loops capped at 3 rounds → split the task or reopen the decision in council.
- Something only the user can do (accounts, keys, payments, legal sign-off, brand facts) → `G block human "<what>" "<how to unblock>"` and keep working on everything else; when nothing else is possible, report and stop.
- A previously green check turns red → fix forward once, then revert to the last green commit (never `reset --hard` over uncommitted work).
- Unattended product choices → take the council's recommendation, `G assume` it with its cost if wrong; the user reviews ASSUMPTIONS.md at the end.

## Final report (the user's language)
```
Goal <id>: <idea> — RELEASE READY at <sha> | BLOCKED (human) | PAUSED (<reason>)
Built: <MVP features with their e2e evidence>
Decisions: <council ids, one line each>
Evidence: <release checks: command → exit 0 @ sha>
Assumptions to review: <ASSUMPTIONS.md items>
Your steps: <publish/deploy, accounts, keys, store forms> 
```
