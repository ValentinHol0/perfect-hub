# Experiments

An experiment is a decision procedure written down before the data arrives. All maths runs through `node "${CLAUDE_PLUGIN_ROOT}/scripts/ab-calc.mjs"` (normal-approximation formulas of R's `power.prop.test` and a two-proportion z-test) — never estimate sample sizes or p-values in prose.

## 1. Should this be an A/B test at all?
Run `ab-calc mde` with the traffic you really have before designing anything:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ab-calc.mjs" mde --baseline 0.025 --n 6000
```
- If the minimum detectable lift is larger than any plausible effect of the change (a button colour will not lift conversion by 40% relative), do not A/B test it. Alternatives: test a bolder change, test higher in the funnel where rates are larger (add-to-cart instead of purchase), pool traffic over a longer period, or ship and monitor with a before/after note that says it is not causal.
- Low traffic plus small change = qualitative research instead: 5 user sessions, an on-page poll, support transcripts.
- Never test what is legally required, ethically questionable (fake scarcity), or already decided.

## 2. Hypothesis
```
Because we saw <evidence: analytics, recordings, survey, reviews, interview quotes>,
we believe <change> for <audience / traffic source>
will move <primary metric> by at least <MDE>,
because <mechanism: which doubt or effort it removes>.
```
A hypothesis without evidence is a guess — say so and prefer cheaper research. One change per variant unless the test is explicitly about a whole new page.

## 3. Metrics
- **Primary (exactly one):** the metric the decision rides on, per randomisation unit (usually users): purchase conversion, lead-form completion, trial start. Define numerator, denominator and attribution window.
- **Secondary (diagnostic):** steps that explain the primary (add-to-cart, checkout start, scroll to price).
- **Guardrails (must not get worse):** revenue per visitor or average order value, refund / COD-refusal rate, unsubscribe or spam-complaint rate for email, page load time, support contacts. Name a tolerance for each ("AOV not lower by more than 3%").
- Randomise and analyse by the same unit. Randomising sessions while counting users double-counts returning visitors.

## 4. Sample size and duration
Inputs, all written down with their source:
- **Baseline rate** of the primary metric for the exact traffic that will enter the test (same pages, same devices, same channels), from the last 4 complete weeks.
- **MDE:** the smallest lift worth acting on, from economics, not hope (e.g. "+10% relative pays for the development time").
- **alpha 0.05, power 0.8, two-sided** unless there is a written reason; more arms → the script applies Bonferroni (`--variants 3`).
- **Daily eligible traffic** and the share allocated to the test.
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ab-calc.mjs" size --baseline 0.025 --mde 0.15 --relative --daily 1800
node "${CLAUDE_PLUGIN_ROOT}/scripts/ab-calc.mjs" size --baseline 0.025 --mde 0.15 --relative --variants 3 --daily 1800 --json
```
Rules:
- Run in **full weeks** (the script rounds up) so every weekday appears equally; avoid windows dominated by unusual traffic (Black Friday, a TV mention, a blackout week) unless the test is about that period.
- **Fixed horizon:** stop at the planned sample size, not when the dashboard turns green. Repeated peeking with a fixed-horizon test inflates false positives. If early stopping is needed, use a tool that implements sequential testing and follow its rules.
- If the required duration exceeds ~6–8 weeks, cookie churn and seasonality start to contaminate the result (a practitioner judgement) — redesign rather than wait.

## 5. Pre-registration (deliverable: `experiment-<slug>.md`)
```markdown
# Experiment: <name>            Status: draft | running | read
Hypothesis: <from §2>
Variants: A = control <link/screenshot> · B = <exact change>
Audience and allocation: <who is eligible, exclusions (internal, bots, returning buyers?)>, split 50/50, unit = user
Primary metric: <definition> · Guardrails: <metric — tolerance>
Baseline: <rate> (<source, period>) · MDE: <abs / rel> · alpha / power / sides: 0.05 / 0.8 / 2
Sample size: <n per arm> (ab-calc output pasted) · Duration: <days>, start <date>, end <date>
Decision rule: ship B if the 95% CI of the difference is above 0 and no guardrail breaches its tolerance; otherwise keep A and record the learning.
Tool and implementation: <PostHog / VWO / Optimizely / platform A/B> — implementation ticket for the core
QA: events in both arms, SRM check after day 2, no flicker, internal traffic excluded
```

## 6. QA during the run
- After day 1–2 and at the end, check the split: `node "${CLAUDE_PLUGIN_ROOT}/scripts/ab-calc.mjs" srm --observed 10234,9766` (add `--weights` for unequal splits; this example is an SRM, p ≈ 0.0009). A sample ratio mismatch (default threshold p < 0.001) means assignment or logging is broken — stop reading results and fix the bug.
- Confirm both arms fire the primary and guardrail events with identical definitions.
- Client-side tools can flash the control before the variant (flicker); implementation and anti-flicker are a core task.

## 7. Readout
1. SRM check first (above). Failed → no conclusion.
2. Primary metric at the planned sample size:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/ab-calc.mjs" test --a 412/16890 --b 468/16912
   ```
   Report the absolute and relative difference, the 95% CI and the p-value from the output; never "trending to significance".
3. Guardrails against their tolerances.
4. Segments: only those pre-registered; anything else is a new hypothesis, not a result (with 10 segments, one "wins" by chance at alpha 0.05 about 40% of the time: 1 − 0.95¹⁰ ≈ 0.40).
5. Decision per the rule, the learning in one sentence, the next test.
Readout format (numbers from the command above): `Result: B +0.33 pp (+13.4%), 95% CI [−0.01, +0.67] pp, p = 0.058 · Guardrails: AOV −0.8% (tolerance −3%) OK · SRM p = 0.41 · Decision: keep A (CI includes 0) · Learning: …`

## 8. Common traps
- Testing many tiny changes on low traffic → no result ever reaches power.
- Changing the variant, allocation or eligibility mid-test → restart.
- Counting conversions that happen outside the attribution window, or excluding refused COD orders in one arm only.
- Novelty effects: email and returning-user tests can show a first-week bump; check the effect by week.
- Email subject tests on small lists: run `mde` first — a list of 3 000 rarely detects anything smaller than a large relative lift.
- Ad creative tests run inside the ad platform's own experiment tools — route to `/ads`.

## 9. Delivery checklist
- [ ] `mde` checked against traffic before design; test is worth running.
- [ ] Hypothesis cites evidence; one primary metric; guardrails with tolerances.
- [ ] Sample size, duration and SRM/test outputs pasted from `ab-calc.mjs`.
- [ ] Pre-registration file written before launch; implementation handed to the core.
- [ ] Readout follows §7 and states the decision and learning.

Credit: test-design checklist ideas partly paraphrased from coreyhaines31/marketingskills (MIT).
