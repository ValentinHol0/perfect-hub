# Ads — Creative Testing, Naming, Kill/Scale Rules

Creative is the main targeting lever on Meta and TikTok today; testing it badly burns most budgets. Statistics: `${CLAUDE_PLUGIN_ROOT}/scripts/ads-calc.mjs` (`kill`, `compare`).

## 1. Hypothesis card (one per creative — no card, no launch)
```
ID: C014
Angle: "без запаху і бруду — за 5 хвилин" (problem → fast result)
Hook (0–3 s): close-up of the problem + on-screen question
Format: 9:16 UGC video, 22 s, Ukrainian voice + captions
Belief we test: the speed claim beats the price claim (C009) for women 30–55
Success metric: cost per purchase/lead ≤ target CPA from ads-calc target; secondary: approve rate ≥ account average
Kill rule: ads-calc kill at the planned spend; Scale rule: SCALE CANDIDATE or ≥ 10 conversions with CPA ≤ target
```

## 2. Test matrix (what changes between creatives)
Test in this order — biggest effect first (practitioner judgement):
1. **Angle** (why buy: pain, desire, identity, price, gift, proof) — 2–4 angles per round.
2. **Hook** (first 1–3 s) on the winning angle — 3–5 hooks on the same body.
3. **Format** (UGC talking head, demo, before/after where policy allows, static, carousel).
4. **Offer framing** (bundle, gift, COD/inspection, guarantee) — coordinate with `/selling` offer sheet.
5. Copy, CTA button, thumbnails — last.
Change one variable per comparison. Two creatives that differ in angle **and** format teach you nothing about either.

## 3. Naming convention (paste-safe ASCII, `_` between fields, `-` inside a field)
| Level | Pattern | Example |
|---|---|---|
| Campaign | `<platform>_<country>_<objective>_<type>_<product>_<yyyymm>` | `meta_ua_sales_test_neck-massager_202611` |
| Ad set / ad group | `<audience>_<placement>_<event>_<budget-type>` | `broad_advplus_purchase_abo` |
| Ad | `<creativeID>_<angle>_<hook>_<format>_<length>_<lang>` | `C014_speed_q-hook_ugc_22s_uk` |
Rules: lowercase; no spaces or Cyrillic (UTM-safe, see `references/analytics.md`); creative ID is permanent across platforms and re-uploads; keep a creative register (sheet) with ID → file link → hypothesis → status. Meta name-based URL parameters freeze at first publish, so name correctly before publishing.

## 4. Budget per test
- Per creative: enough spend to reach a decision. With zero conversions, `ads-calc.mjs kill` becomes significant at spend ≈ target CPA × ln(1/α) ≈ **3 × target CPA** (α = 0.05). Plan at least that per creative, or accept that some decisions stay "KEEP RUNNING".
- Per round: creatives × 3 × target CPA; if the budget can't cover it, test fewer creatives, not less spend each.
- Platform minimums still apply (TikTok ad group > USD 20/day).

## 5. Decisions (run the calculator — write the output into the decision log)
| Question | Command | Rule |
|---|---|---|
| Kill this ad? | `ads-calc.mjs kill --spend 540 --conversions 0 --target-cpa 180` | `KILL` when results are significantly worse than target (p < α) |
| Is it already a winner? | same command | `SCALE CANDIDATE` when significantly better than target; otherwise keep collecting |
| A vs B on conversion rate | `ads-calc.mjs compare --a-conv 18 --a-n 1200 --b-conv 31 --b-n 1250` | requires ≥ 10 conversions each (default guard); `NO SIGNIFICANT DIFFERENCE` means keep both or pick by cost and downstream quality |
Cautions:
- Peeking every day inflates false winners; decide at pre-set checkpoints (e.g. each 1× target CPA of spend) and treat early "wins" as provisional.
- CTR and thumb-stop rate diagnose hooks; they don't prove profit. A high-CTR ad with low approve rate loses money on COD.
- Platforms shift spend to early leaders (CBO/Advantage+), so spend per ad is unequal; compare on rates and costs, and use ABO when fairness matters.
- Downstream check before scaling COD offers: approve rate and delivered-order CPA by creative (UTM `utm_content` → CRM).

## 6. Decision log (deliverable `deliverables/ads/<project>/creative-log.md`)
| Date | Creative | Spend | Conv | CPA | ads-calc result | Decision | Next action |
|---|---|---:|---:|---:|---|---|---|

## 7. Fatigue and refresh (judgement — confirm with data)
Signals over ≥ 3 days on a stable audience: frequency up, CTR down, CPA up. Response: new hooks on the same body first (cheap), then a new angle. Keep a pipeline of 3–5 new creatives per week per scaling product when budget allows; briefs → `perfect-hub:brand`.
