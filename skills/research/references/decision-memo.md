# Decision Memo

One page that lets a busy decision-maker decide today and know what would make them decide differently tomorrow. It draws on the files from `references/market.md`, `references/competitors.md` and `references/interviews.md` when they exist; otherwise it gathers the minimum evidence needed (dispatch `research-analyst`) and says what is missing.

## 1. Frame the decision
- **Question** as a choice: "Should we <A> or <B> by <date>?" — not "What about the Polish market?".
- **Decider and deadline**; what happens if no decision is made (that is an option).
- **Reversibility:** reversible and cheap → decide fast with less evidence, set a review date; irreversible or expensive → demand stronger evidence and a staged path. Say which this is.
- **Criteria and weights** agreed before comparing options (e.g. expected profit in 12 months, cash needed, time to first revenue, strategic fit, risk). Max 5 criteria.

## 2. Options (2–4, always real)
Include "do nothing / defer" and, when possible, a staged or cheaper test option (pilot, smoke test, one city first). For each option: what exactly is done, cost (money, people, time), expected outcome with its basis, main risk.

Numbers that compare options (expected value, payback, break-even) run through the script — the same tool used for market sizing evaluates any formula chain with cited and estimated inputs:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/market-size.mjs" options.json
```
Example step chain: `revenue = customers * price * months`, `profit = revenue * margin - fixed_cost`, `ev = p_success * profit - (1 - p_success) * sunk_cost` (with `p_success`, `margin`, `fixed_cost`, `sunk_cost` declared as facts or labelled estimates). Probabilities are estimates — write where each comes from (base rates from comparable launches, interview signals, test results).

## 3. Evidence
Grade every piece:
| Grade | Meaning |
|---|---|
| Strong | Primary source or direct behavioural evidence (sales, pre-orders, test results, multiple consistent interviews with spend evidence) |
| Moderate | Reputable secondary source with method; consistent stated preferences; good analogues |
| Weak | Single anecdote, opinions, undated or methodless sources |
Label each line Fact `[S#]`, Estimate (formula), or Opinion (whose). Include evidence against the recommendation — a memo with only supporting evidence has not looked.

## 4. Stress-test the recommendation
- **Pre-mortem:** "It is a year later and this failed — why?" List the 3 most plausible reasons; each becomes a risk with a mitigation or a signpost.
- **Consider the opposite:** the strongest case for the runner-up option, stated fairly.
- **Base rate:** how do comparable moves usually turn out (with source, or say none was found)?

## 5. Template (`decision-memo.md`, ≤ 1 page + evidence table)
```markdown
# Decision: <question as a choice>
Decider: <name/role> · Decide by: <date> · Reversibility: <reversible | costly to reverse | irreversible>

**Recommendation:** <option> — <one sentence why>. Confidence: <low/medium/high> because <reason>.

## Options
| | A: <…> | B: <…> | C: Do nothing / defer |
|---|---|---|---|
| What we do | | | |
| Cost (UAH, people, time) | | | |
| Expected outcome (basis) | | | |
| Main risk | | | |
| Score vs criteria (weights) | | | |

## Evidence
| # | Evidence | Label | Grade | Supports |
|---|---|---|---|---|
| 1 | <…> [S2] | Fact | Strong | A |
| 2 | <…> = <formula> | Estimate | Moderate | A, against B |
| 3 | <…> (P04) | Opinion | Weak | B |

## Risks and mitigations
| Risk | Likelihood | Impact | Mitigation / early signal |
|---|---|---|---|

## What would change this decision
- If <metric> is below <threshold> by <date> → <switch to option / stop>.
- If <competitor / regulation / cost> changes <how> → <revisit>.

## Next steps
| Step | Owner | Date |
|---|---|---|

Sources: see `sources.md`.
```
Signposts must be observable, have a threshold and a check date — "if the market changes" is not a signpost.

## 6. Writing rules
- Recommendation first; the reader should be able to stop after it.
- Plain language, numbers with units and periods, no hedging adjectives ("significant", "robust") without a number.
- Our opinion is allowed and expected — labelled as such and argued from the evidence table.
- Legal, tax or regulatory aspects: summarise the question and route it to a lawyer or `/business`; the memo ends with "Verify with a qualified professional." when such aspects affect the choice.

## 7. Delivery checklist
- [ ] Question framed as a choice with decider, deadline and reversibility.
- [ ] 2–4 options including do nothing and, if possible, a staged test.
- [ ] Every evidence line labelled and graded; evidence against included.
- [ ] Numbers from `market-size.mjs`; probabilities' basis stated.
- [ ] Pre-mortem done; risks have mitigations or signals.
- [ ] Signposts with thresholds and dates; next steps with owners.
- [ ] Fits one page plus the evidence table.
