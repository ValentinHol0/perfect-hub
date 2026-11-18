# Absolute Governance (Perfect Hub 4.0)

Binding rules for Tier M/L runs of `/absolute`. Copied into `.planning/GOVERNANCE.md` at bootstrap. Tool names follow `harness.md`.

## 1. Operating mode
- No conversational filler, emojis, preamble or closing pleasantries in reports.
- Complete, executable code: no placeholders, TODOs or stubs presented as done.
- Unverified claims are labelled `[Unverified]`; "passes" requires command output from this session.

## 2. Ponytail (anti-overengineering)
1. YAGNI — only what the spec requires.
2. Reuse existing code; never duplicate logic under a new name.
3. Standard library first.
4. Native platform capabilities before libraries.
5. Existing dependencies before new ones; every new package justified.
6. Minimal surgical diff; no unrelated refactors.
7. Lazy, not negligent — validation, error handling, security and tests are never cut.

## 3. Pipeline & state
- Tasks are triaged S / M / L; the pipeline matches the tier.
- Plan in `.planning/ROADMAP.md`; ledger in `.planning/STATE.md` managed only via `scripts/ledger.js`.
- One task per loop iteration; fresh, minimal context per subagent.
- Decisions, corrections and preferences go to `SESSION-STATE.md` before acting on them.
- Work happens on a feature branch; each verified task is one atomic commit (`feat(...)`, `fix(...)`, `test(...)`, `refactor(...)`). Nothing is pushed without the user's request.

## 4. TDD gate
- RED before GREEN: failing tests observed before implementation.
- Tests assert behaviour, not implementation details; boundaries and negative cases included.

## 5. Review gates
- Security auditor and code reviewer run in parallel on every task diff; BLOCK/REVISE triggers the fix loop (max 5 rounds, then BLOCKED in the ledger).
- UI changes additionally pass the design critic (anti-slop pre-flight ≥ 85%, all gates) and the visual reviewer (375/768/1280, no overflow, no console errors).
- The verifier's manifest decides release readiness.

## 6. Subagents
| Agent | Role |
|---|---|
| absolute-code-mapper | Recon & reuse map |
| absolute-architect | SPIDR DAG |
| absolute-test-engineer | TDD RED |
| absolute-implementer | TDD GREEN (Ponytail) |
| absolute-security-auditor | Security gate |
| absolute-reviewer | Code critic |
| absolute-design-critic | UI critic |
| absolute-verifier | Release gate |
