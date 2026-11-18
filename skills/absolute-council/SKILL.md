---
name: absolute-council
description: "Convenes an emergency council of specialist agents on one decision: product, architecture, frontend, backend, UX, visual, security, QA, devops, mobile, antislop, contrarian and domain experts (selling, ads, marketing, brand…) each propose blind, tear the other proposals apart with concrete evidence, credit what is genuinely strong, revise, face a devil's advocate and a chair, and leave a written decision record with dissent. Use when a choice is costly to reverse or has several credible options — stack, data model, auth, architecture, pricing, brand or design direction, launch scope — or when the user asks for a council, debate, second opinions or /absolute-council."
argument-hint: "<question> [--tier quick|standard|critical] [--seats a,b,c]"
---

# /absolute-council — the emergency meeting

You are the **orchestrator**, not a seat: you frame the question, dispatch seats in parallel, move files between rounds, verify disputed facts with tools and hand everything to the chair. You never argue a position yourself and never let a seat see another seat's identity.

Rules for seats and chair: `${CLAUDE_SKILL_DIR}/references/protocol.md` (read it once per council). Script: `node "${CLAUDE_PLUGIN_ROOT}/scripts/council.mjs"` (state in `.planning/council/<id>/`). PLUGIN_ROOT for briefs = `${CLAUDE_PLUGIN_ROOT}`.

## 1. Frame (R0)
1. Should this be a council at all? Not for facts, trivia, decided questions or pure execution — answer those directly.
2. Gather the facts seats need (files, constraints, prices, traffic, deadlines, earlier decisions in `.planning/council/`) — neutral, no recommendation.
3. Pick the tier and 3/5/7 seats with the selection rule in the protocol; write one reason per seat.
4. `council.mjs new "<question>" --seats <agents> --tier <tier> [--criteria "Correctness:3,Risk:3,Value:2,Simplicity:2,Reversibility:2,Evidence:2[,Craft:2]"]` → id. Fill `brief.md` (constraints, facts, options in random order) and `seats.md`. Write your own lean into the brief's last line as `Orchestrator lean (sealed): …` — seats are told to ignore it; it exists to expose drift.

## 2. Rounds (parallel dispatch in one message per round)
Dispatch each seat with the Agent tool, `subagent_type: "perfect-hub:<agent>"`. Every prompt starts with `COUNCIL <id> — ROUND <n>`, carries `PLUGIN_ROOT=<path>`, the path of the brief or packet, and nothing else — never your reasoning, never another seat's name.
- **R1:** prompt = brief path + "write your R1 proposal in the exact format of the protocol". Save each reply to a temp file → `council.mjs save <id> r1 <seat> <file>`; a schema failure → re-dispatch that seat once with the listed problems. Then `council.mjs overlap <id>`: theatrical → add `absolute-contrarian` and one method-different seat.
- **R2:** for each seat `council.mjs packet <id> r2 <seat>` → dispatch with that packet path. Save replies (`save … r2 …`). `council.mjs tally <id>`.
- **R3** (standard/critical): `council.mjs packet <id> r3 <seat>` per seat → dispatch → `save … r3 …`. Critical tier: one more R2-R3 cycle only if the leader changed or a high-weight criterion still has a spread ≥ 2.
- **R4:** dispatch `absolute-contrarian` (model: the strongest available) with the brief and the leading proposal only → `save … da absolute-contrarian …`. Then verify every disputed, load-bearing claim yourself with tools (run the test, read the installed version's docs, measure, fetch the price) and write `verify.md` in the council folder: claim → command or source → result.
- **R5:** dispatch `absolute-chair` with the folder path (it reads brief, r1-r3, scores.json, da, verify.md) → `save … chair absolute-chair …` → `council.mjs record <id>` → `DECISION.md`.

## 3. After the decision
- `CONVERGED` → act on the chair's actions (or return them to the caller: `/absolute`, `/absolute-goal`). Inside a goal run: `goal.mjs decision "<id>" ".planning/council/<id>/DECISION.md"`.
- `ANOTHER ROUND` → run exactly what the chair named, within the round cap; then the chair again.
- `ESCALATE` → ask the user one question with the chair's options and recommendation (AskUserQuestion); record the answer in DECISION.md. In unattended goal runs: take the recommendation, write it to `.planning/ASSUMPTIONS.md` with its cost if wrong, and continue.

## 4. Report to the user (their language)
```
Council <id> · <tier> · seats: <list>
Decision: <one paragraph>
Why: <3 lines, each tied to a criterion and evidence>
Stolen from the losers: <credited elements that made it into the decision>
Dissent: <seat — concern — revisit trigger> | none
Record: .planning/council/<id>/DECISION.md
```
Show the user the strongest objection that was overruled and why — they should see the fight, not only the result.
