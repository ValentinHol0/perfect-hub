# Selling — Product Audit

Stance: the product is guilty until proven innocent. A white-label commodity almost never earns 90+ on more than two criteria. Rubric with deduction tables: `${CLAUDE_PLUGIN_ROOT}/skills/selling/references/product-audit/scorecard.md`. Worked example: `${CLAUDE_PLUGIN_ROOT}/skills/selling/references/product-audit/worked-example.md`.

## 1. Pipeline (in this order — each step feeds the next)
1. **Identify the product** — exact variant, materials, power source (USB-C / built-in Li-ion / 220 V / none), dimensions and gross weight (from the supplier page or the user; never guessed). Volumetric weight for courier tariffs = L×W×H cm / 4000 `[Unverified]` divisor — confirm on the carrier's site.
2. **Demand and ad evidence** — run `references/ad-intel.md`: who advertises it in UA and abroad, how long ads have been live, which angles repeat. No evidence of anyone advertising it is a signal (untested or dead), not a neutral fact.
3. **Price parity** — open the identical item on Temu, Prom, Rozetka, OLX, AliExpress (browser if blocked). Record the cheapest delivered price per source with URL + date. Parity ratio = your price ÷ cheapest delivered price for the same item.
4. **Sourcing** — run `references/sourcing.md` for purchase price, MOQ, lead time and landed cost.
5. **Unit economics** — run `references/unit-economics.md` with three scenarios. Use the worst-case contribution and refusal in the scorecard's `unitEconomics` block.
6. **Score** — fill the card (format below) and run:
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/product-score.mjs" deliverables/selling/<slug>/scorecard.json`
7. **Independent kill attempt** — dispatch agent `selling-market-analyst` (Agent tool, `subagent_type: "perfect-hub:selling-market-analyst"`) with the evidence log, calculator output and card. If it finds a fatal issue with evidence, re-score.

## 2. The 9 criteria (weights sum to 100%)
| # | Criterion | Weight | What earns points |
|---|---|---:|---|
| C1 | Unit economics and margin resilience | 20% | worst-case contribution per shipped order ≥ 250 UAH; markup ≥ 3×; break-even CPA well above realistic CPA |
| C2 | Marketplace / Temu price-parity resistance | 15% | parity ratio ≤ 1.8, or a bundle/private label that has no 1:1 twin |
| C3 | COD redemption and return hazard | 15% | no sizing, no fragile unboxing, low regret; projected refusal < 12% |
| C4 | Creative hook and demonstrability | 15% | visible problem → visible result in < 3 s; works without voice-over |
| C5 | Ad-policy safety (Meta, TikTok, Google) | 10% | no health/appearance claims, no restricted category, no trademark use |
| C6 | Audience breadth and pain intensity | 10% | mass audience + acute, recurring pain or desire |
| C7 | Logistics, fragility, power autonomy | 5% | light, unbreakable, no liquids; works during blackouts (USB-C / battery) |
| C8 | Sourcing speed and scalability | 5% | stock in Ukraine or reliable factory with re-order ≤ 3 weeks |
| C9 | Cross-sell, upsell, LTV | 5% | consumables, 2+1 bundles, accessory ladder |

Every criterion starts at 100. Each lost point is a line item `{points, reason, evidence}`; the script rejects a card whose deductions don't add up, and any score ≥ 95 without `evidence`.

## 3. Fatal disqualifiers → STRICT NO-GO, composite capped at 40
- Worst-case contribution < 150 UAH per shipped order, or markup < 2.3× (owner's thresholds; override per business in `thresholds`).
- Projected COD refusal > 22% (fitted clothing and shoes, fragile high-ticket items, complex electronics without instructions in Ukrainian).
- C5 < 30: the selling angle itself depends on a prohibited claim or content.
- C2 < 25: the identical item is on Temu/marketplaces for < ~25% of your price with no differentiation.
- Any explicit legal block (counterfeit brand, certification you cannot get, product banned for sale).
**Weak-link rule:** any criterion < 40 caps the verdict at CONDITIONAL PLAY (composite ≤ 74) even if the weighted average is higher. This stops a great hook from hiding a Temu twin.

## 4. Verdict bands
- **SCALABLE WINNER ≥ 75**, no weak links → test budget and creative plan now (hand to `/ads`).
- **CONDITIONAL PLAY 60–74** → viable only with the named fix (bundle, private label, different price, different channel). State the fix and re-run the calculator with it.
- **NO-GO < 60** or any fatal → do not spend. Say what would have to change for a re-audit.

## 5. Scorecard input (`scorecard.json`)
```json
{
  "product": "Електрична пилка для п'ят, USB-C",
  "unitEconomics": { "contribution": 132.4, "markup": 4.3, "refusalRate": 0.13 },
  "criteria": {
    "C1": { "score": 72, "deductions": [{ "points": 28, "reason": "worst-case contribution 132 UAH", "evidence": "deliverables/selling/foot-file/ue.md" }] },
    "C2": { "score": 35, "deductions": [{ "points": 65, "reason": "same item on Temu at 161 UAH delivered", "evidence": "temu.com/... captured 2026-11-12" }] }
  },
  "fatal": []
}
```
(All nine C1..C9 are required.) `unitEconomics` comes from the worst-case scenario of `unit-economics.mjs`.

## 6. Output (in the user's language)
```
Рішення: CONDITIONAL PLAY — 68/100 · Впевненість: Medium
Припущення: <rulings line>
Scorecard: <product-score.mjs table>
Юніт-економіка (worst / expected / best): <unit-economics.mjs table>
Докази: <numbered list: claim — URL — date>
Чому це провалиться (3): <reason — evidence>
Що змінити, щоб стало GO: <bundle / price / channel — recomputed numbers>
Наступні кроки: <test budget, creatives brief → brand, campaign → ads, landing → /absolute>
```
Comparing several products: one card each, then a ranking table sorted by composite with fatal/weak-link columns; never average away a fatal.

## 7. Ukrainian market checks to apply in scoring
- Cold traffic in UA buys mostly with COD `[Unverified]` share — prefer the user's own prepaid/COD split; refusals cost forward + return shipping when the buyer doesn't collect (check your NP contract: the 2024 free-return change may apply).
- Delivery speed expectation is 1–3 days; shipping each order from China defeats COD — stock must be in Ukraine (own stock, 3PL or local supplier).
- "10-second Lens test": a buyer screenshots the ad and finds it on Temu/Prom. If found cheaper than ~1/3 of your price, expect toxic comments and in-transit cancellations — C2 and C3 both lose points.
- Blackout resilience: devices needing 220 V and > 1.5 kW suffer in outage seasons; USB-C / battery products gain (C7, C6) — judgement, mark `[Unverified]` if no data.
- Price zones are priors from the legacy skill, not facts: < 390 UAH hard to make profitable with paid ads; 390–890 impulse; 900–1,490 needs call-centre confirmation; > 1,500 high refusal unless prepaid or instalments (`[Unverified]`; replace with the user's data).
