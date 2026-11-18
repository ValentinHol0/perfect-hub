# Absolute Coder (Perfect Hub 4.0)

For multi-task work, use `/absolute` or `/ralph` — the loop, gates, fix rounds and model tiers are defined once in `${CLAUDE_PLUGIN_ROOT}/skills/absolute/references/pipelines.md`. This skill is the standard for writing the code itself.

## 1. Before writing
- Read the files you will touch and their tests; find the project's commands (test, single test, typecheck, lint).
- Ponytail: YAGNI → reuse → stdlib → native platform → existing deps → minimal diff → never negligent (validation, errors, security, types stay).
- Branch per pipelines 0.2; never commit to the default branch.

## 2. Loop for one task
1. **RED:** a failing test for the behaviour (dispatch `absolute-test-engineer`, or write it yourself for small tasks). See it fail for the right reason.
2. **GREEN:** the smallest correct change (dispatch `absolute-implementer` for anything non-trivial, using `${CLAUDE_PLUGIN_ROOT}/assets/implementer-prompt.md`).
3. **Gates:** per pipelines 0.5 — reviewer, plus the security auditor when auth, input parsing, payments or data access are touched; UI changes add design-lint and screenshots.
4. **Commit:** one conventional commit after the gates pass.
Implementation written before a failing test exists is discarded and redone test-first.

## 3. UI from comps or DESIGN.md
Read the tokens/comps first; reproduce spacing, columns, type, radii, colours and copy exactly; never invent design properties not in the spec. Verify with `absolute-ui-ux (visual review)`.

## 4. Reference standards (`${CLAUDE_PLUGIN_ROOT}/skills/absolute/references/coding/examples/`)
- `prisma_transaction.ts` — idempotency claimed by INSERT under a unique key with a request hash (replay vs. 422 on reuse), conditional decrement (`stock >= qty`, no oversell under concurrency), deterministic lock order, typed HTTP errors.
- `react_form_hook.tsx` — React 19 optimistic updates: post-`await` state updates re-wrapped in `startTransition`, last-request-wins per field, `AbortSignal.timeout`.
- `request_validator.py` — boundary validation and explicit error contracts.
- `clean_architecture.py` — dependency direction and ports/adapters without ceremony.
Match their rigour, not their verbosity.

## 5. Output
Code first. Then at most: files changed, test command + result, gate verdicts. No filler.
