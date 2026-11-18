# Worked example — pet detangling spray (migrated from the legacy skill)

Purpose: show the mechanics, not a market fact. The figures are the owner's 2026 inputs from the legacy `absolute-selling` case study and were NOT re-verified — treat every input as `[Unverified]`.

## 1. Inputs (`deliverables/selling/pet-spray/ue.json`)
```json
{
  "name": "Pet detangling spray, 1 bottle",
  "price": 489, "cogsPerUnit": 110, "packaging": 30,
  "shipping": { "forward": 105, "return": 105, "payer": "buyer" },
  "refusalRate": 0.08, "ads": { "cpa": 200 },
  "callCenterPerOrder": 30, "otherPerOrder": 20,
  "scenarios": [
    { "name": "worst", "refusalRate": 0.12, "ads": { "cpa": 240 } },
    { "name": "expected" },
    { "name": "bundle 2+comb 790", "price": 790, "unitsPerOrder": 2, "otherPerOrder": 45 }
  ]
}
```
`node scripts/unit-economics.mjs deliverables/selling/pet-spray/ue.json` reproduces the legacy model exactly for the expected case: contribution 51.88 UAH per shipped order, markup 4.45×, break-even CPA 251.88 UAH, break-even platform ROAS 1.94. The worst case (12% refusal, CPA 240) is −11.68 UAH. The legacy model had no COD fee, tax or ad VAT; adding the skill's default rulings (NovaPay standard 2.5%, FOP group 3 at 6%, ad VAT 20%) turns the expected case into −26.36 UAH per shipped order with a platform break-even CPA of 178 UAH. The bundle scenario (2 bottles + comb at 790 UAH, comb 25 UAH in `otherPerOrder`) gives 202.6 UAH in the expected case before those defaults — re-run it with the defaults and a worst case before calling it viable.

## 2. Scorecard (legacy scores, re-run through `product-score.mjs`)
| # | Score | Main deduction (legacy reasoning) |
|---|---:|---|
| C1 | 68 | −32 contribution ~52 UAH at 489 UAH |
| C2 | 65 | −35 custom label limits 1:1 comparison |
| C3 | 85 | −15 pet owners redeem well (claimed 7–9% refusal, unsourced) |
| C4 | 76 | −24 needs live animal footage |
| C5 | 95 | −5 pet care is not a restricted category (needs `evidence`: link to the policy check) |
| C6 | 60 | −40 long-haired pets only |
| C7 | 55 | −45 liquid in plastic bottle, leak risk in sorting |
| C8 | 70 | −30 local bottling/certification needed |
| C9 | 85 | −15 consumable, natural 2-pack |

Raw weighted score 73.5 (weights now sum to 100%), but `unitEconomics.contribution = 51.88 < 150` → fatal → **STRICT NO-GO, 40/100** for the single bottle. The legacy recommendation — 2 bottles + dematting comb at 790 UAH — must be re-run as its own scenario and re-scored; it is a hypothesis until the calculator says contribution ≥ 150 in the worst case.

## 3. What changed versus the legacy method
- The legacy weights summed to 105%; C7 is now 5%.
- The legacy collagen-mask card printed 74.5 where its own weights give 84.55; the weak-link rule now caps that card (C2 = 28) at CONDITIONAL PLAY instead of letting the average hide the Temu twin.
- Spy-dossier cards with run-times and ad-set counts are replaced by the evidence log from `references/ad-intel.md` (real library entries with Library ID and start date, or "data unavailable").
