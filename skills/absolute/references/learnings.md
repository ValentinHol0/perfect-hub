# Absolute Self-Improving Mode (Perfect Hub 4.0)


## 1. Log Ingestion & Directory Setup
Ensure the `.learnings/` directory is present in the project workspace:
- `.learnings/LEARNINGS.md`: captured corrections, insights, and best practices.
- `.learnings/ERRORS.md`: tool failures, compiler type errors, runtime exceptions.
- `.learnings/FEATURE_REQUESTS.md`: capabilities requested by the developer.

---

## 2. Ingestion Triggers
Automatically append entries to `.learnings/` files upon observing:
- **Corrections**: Direct feedback stating "No, that's wrong", "Use X instead of Y".
- **Errors**: Non-zero command exits, stack traces, test runner crashes.
- **Knowledge Gaps**: API schema mismatches or outdated dependency behaviors.

### 2.A Format
Use standard ID headers: `[LRN-YYYYMMDD-XXX]`, `[ERR-YYYYMMDD-XXX]`, or `[FEAT-YYYYMMDD-XXX]`.
Include:
- Priority (low, medium, high, critical)
- Area (frontend, backend, infra, tests, docs, config)
- Details (redacted command outputs, error traces, context)
- Pattern-Key (two-level taxonomy, e.g. `deps.npm-error`, `net.timeout`)

---

## 3. Self-Improvement Guardrails
Before modifying any instruction, personality guidelines, or workflow rule, apply these verification systems:

### 3.A ADL (Anti-Drift Limits) Protocol
To prevent instructions from becoming overly complex or introducing performance bloat, enforce this priority:
`Stability > Explainability > Reusability > Scalability > Novelty`
- Never add complexity to "look smart".
- Never make changes that cannot be verified by tests.

### 3.B VFM (Value-First Modification) Protocol
Grade proposed memory updates based on this metric:
- **High Frequency** (Will this be used daily? Weight 3x)
- **Failure Reduction** (Does this turn failures into successes? Weight 3x)
- **Developer Burden** (Can the developer explain less? Weight 2x)
- **Session Cost** (Does this save tokens/time? Weight 2x)
- **Scoring**: rate each criterion 0–10, multiply by its weight (max total 100).
- **Threshold**: If the weighted score is `< 50`, reject the update.

---

## 4. Memory Promotion Rules
Promote a recurring pattern when ALL hold:
- Recurrence count ≥ 3,
- observed across ≥ 2 distinct tasks,
- within a 30-day window,
- and it scores ≥ 50 on VFM.

Promotion targets (Claude Code):
| Pattern | Target |
|---|---|
| Project conventions, workflow rules, commands, gotchas | Project `CLAUDE.md` (short bullet under a clear heading) |
| Rules scoped to certain files/paths | `.claude/rules/<topic>.md` |
| Repeatable multi-step procedures | A project skill: `.claude/skills/<name>/SKILL.md` |
| Personal, cross-project preferences | The user's memory (`~/.claude/CLAUDE.md` or the session memory system) |
| Design-language rules | `DESIGN.md` (via absolute-designer (design system)) |

Process:
1. Draft the exact diff (≤ 5 lines per promotion; concrete, testable wording).
2. Apply directly when the user invoked `/self-improving` or asked to remember; otherwise show the diff and apply on approval.
3. Mark the source `.learnings/` entries `promoted → <target>`.
4. Never promote secrets, credentials or personal data. Never duplicate a rule that already exists — update it instead.
