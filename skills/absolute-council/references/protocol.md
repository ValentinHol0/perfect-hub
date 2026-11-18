# Council protocol (every seat and the chair follow this)

The council exists to reach the **right** decision, not a polite one and not a loud one. Gains come from independent thinking plus honest aggregation; the main failure is seats drifting toward each other (sycophancy, conformity). Every rule below defends against that.

## Tone: brutal and exact — never contrarian for show
- Attack ideas, never seats. No softening words ("maybe", "a bit", "consider perhaps"). Say what breaks, when, and how you know.
- Every flaw is **concrete and falsifiable**: the requirement it breaks · the scenario where it breaks · the evidence (file:line, URL, command output, a number, a platform rule). "Feels complex", "not scalable", "bad UX" without a scenario are rejected.
- **Credit is mandatory.** For every opponent proposal name the strongest transferable element — what you would steal and why it is strong on the criteria. If nothing is transferable, say why in one line. Generic praise ("good idea") fails validation.
- Disagree where your lens gives a reason; agree where it does not. Manufactured disagreement is as worthless as flattery. Never argue to win — argue to find what survives.
- Severity: **BLOCK** (breaks money, data, security, law, the primary flow, or a hard constraint — needs evidence) · **MAJOR** (costly to fix later, measurable harm) · **MINOR** (polish).

## Rounds
**R0 — Frame (orchestrator).** `brief.md`: the decision, constraints and facts, success criteria with weights, known options in random order with no favourite, budget. The orchestrator records its own lean in `state.json` before dispatch (`lean`), so drift is visible later.

**R1 — Blind proposal (all seats in parallel, fresh context, brief + own lens only).** ≤ 350 words, exactly these sections:
```
## Position
## Reasons            (3, each with "evidence: file:line | URL | command | number")
## Assumptions
## Top risk
## Wrong if           (the observation that would prove this position wrong)
## Cost & reversibility
## Confidence: N/5
## What others will miss
```
If every seat proposes the same thing with confidence ≥ 4 and `council.mjs overlap` reports `theatrical: false`, skip to R4. If `theatrical: true` (reasoning overlap > 0.6), add the contrarian seat and one seat with a different method before continuing.

**R2 — Anonymised cross-critique (parallel).** Each seat gets `council.mjs packet <id> r2 <seat>`: the other proposals shuffled as P-A, P-B…, persona words stripped, its own proposal absent. For **each** proposal:
```
### P-X
Flaws:
- [F1] (BLOCK|MAJOR|MINOR) <requirement broken> — <scenario> — <evidence>
Credit: <element worth stealing> — <why it is strong>
Scores: Correctness=N Risk=N Value=N …   (1-5 per criterion in the brief; written before the ranking)
```
End with `FINAL RANKING: P-? > P-? > …`. The orchestrator saves it with `council.mjs save` (schema-checked) and re-dispatches a malformed critique once.

**R3 — Revise or hold (parallel; skipped in the quick tier).** Each seat gets `council.mjs packet <id> r3 <seat>`: only the critiques of its own proposal (critics anonymised) and the aggregate scores. For every critique ID: **concede** (name the change) · **rebut** (with *new* evidence or a test) · **absorb** (name the credited element and its label). A position change that cites no critique ID, or cites "the majority", is invalid and reverted. Hybrids are welcome when they name their parts.

**R4 — Devil's advocate + verification.** `absolute-contrarian` (fresh context, strongest available model) attacks the current leader in ≤ 200 words and names the single fact that would flip the verdict. Then the orchestrator **checks every disputed, load-bearing claim with tools** (run the test, open the docs for the installed version, measure) and writes the results to `verify.md`. Evidence beats rhetoric.

**R5 — Chair.** `absolute-chair` (never a seat) reads brief, proposals, critiques, revisions, scores (`council.mjs tally`), the advocate and `verify.md`. Decision = the leader by weighted score (no self-scores) unless verified evidence or a hard constraint (security, data loss, law, money) overrides it — the override is written down. Top two within 0.3 on a **values** dispute → `ESCALATE` (DECISION NEEDED for the user, with a recommendation); within 0.3 on a **facts** dispute → verify, then decide.

## Tiers and stop rules
| Tier | When | Seats | Rounds |
|---|---|---|---|
| quick | reversible but non-trivial choice; one critique would help | 3 | R1 → R4 (verification only) → R5 |
| standard | costly to reverse: data model, auth, framework, public API, pricing, brand direction | 5 | R1 → R5 |
| critical | irreversible or high-stakes (payments, migration of live data, rebrand, platform choice for a product) | 7 | R1 → R5, plus one extra R2-R3 cycle only if R3 changed the leader or a high-weight criterion still has a spread ≥ 2 |
Never more than two critique rounds. Stop early when R3 changes no position and the leader holds. A seat that fails the schema twice is dropped (logged). The budget in the brief is binding: when it runs out, the chair decides from what exists.
**Don't convene** for factual lookups, trivial or already-decided questions, pure execution, or anything one specialist plus review can settle.

## Choosing seats (3-7)
1. 1-2 **owner** seats from the decision's domain.
2. One **risk** seat: Security if data, auth, money or personal data are involved; otherwise QA.
3. One **value** seat: Product, or the component's domain seat (Selling, Marketing, Brand…).
4. One **challenger**: Antislop for UI, copy or scope; otherwise Contrarian.
5. Fill to the tier: DevOps if it deploys or migrates, Architect if it crosses modules, Mobile for apps, Visual/UX for interfaces.
6. Never two seats with the same lens. Above 5 seats, R2 packets may summarise the weakest proposals and keep the top two in full.
7. Write each seat's reason in `seats.md`; the user may change the line-up.

| Seat (agent) | Signature question | Method |
|---|---|---|
| Product (`absolute-product`) | Does it move the outcome? What is the smallest version? | outcome tree, cut list |
| Architect (`absolute-architect`) | What does this lock in for two years? | dependency and reversibility map |
| Frontend (`absolute-frontend`) | What breaks on the slowest device or the longest content? | state and edge enumeration |
| Backend (`absolute-backend`) | Where is data corrupted, lost or double-charged? | invariants, failure injection |
| UX (`absolute-ux`) | Can a first-time user finish the primary flow? | task walkthrough, heuristics |
| Visual (`absolute-visual`) | Distinctive and coherent at real size — or a template? | reference comparison |
| Security (`absolute-security-auditor`) | How would I abuse this? | threat model, abuse cases |
| QA (`absolute-test-engineer`) | How do we prove it, and what can't be tested? | test oracle, boundaries |
| DevOps (`absolute-devops`) | Deploy, rollback, observe, cost, 3 a.m.? | runbook pre-mortem |
| Mobile (`absolute-mobile`) | Offline, store review, platform conventions? | device and store checklist |
| Antislop (`antislop-critic`) | What is generic, padded, AI-looking or unneeded? | delete-until-it-breaks |
| Contrarian (`absolute-contrarian`) | What if the premise is wrong? | pre-mortem, inversion |
| Domain seats | Selling, Ads, Office, Business, Brand, Social, Marketing, Research, Translate agents | the component's checklist and scripts |

## Dissent and the record
`council.mjs record <id>` writes `DECISION.md` (question, criteria, options, scores without self-scores, credit ledger, chair). Every seat whose final position differs from the decision keeps a dissent line: position · strongest argument · the evidence that would flip the decision · a revisit trigger (metric, date, event). Dissent is never deleted; later councils in the same area read earlier decisions first (`.planning/council/`).
