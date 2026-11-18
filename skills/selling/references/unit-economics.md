# Selling — Unit Economics

All numbers come from `${CLAUDE_PLUGIN_ROOT}/scripts/unit-economics.mjs`. Never compute margins in prose. Fee facts with check dates: `${CLAUDE_PLUGIN_ROOT}/skills/selling/references/unit-economics/ua-logistics-fees.md`; unsourced priors for when the user has no data: `${CLAUDE_PLUGIN_ROOT}/skills/selling/references/unit-economics/benchmarks.md`.

## 1. The model (why "per shipped order")
COD sellers pay for every parcel that leaves the warehouse, not for every sale: ads, packaging, call-centre time and — when the buyer refuses — forward and return shipping. So every line is normalised to **one shipped order**, then converted:
- delivered share `d = (1 − prepaidShare) × (1 − refusalRate) + prepaidShare × (1 − prepaidRefusalRate)`
- collected revenue = price × d; tax on collected revenue (revenue mode) or VAT extracted from it (vat mode)
- goods = goods per order × (d + refused × refusedGoodsLossPct) — refused goods return to stock except the lost share
- shipping paid by seller = forward × (1 if seller pays, else refused share) + return × refused share
- COD fee = price × COD-delivered share × seller % (+ fixed); payment fee on prepaid orders; marketplace commission on delivered orders
- ads = CPA per shipped order × (1 + ad VAT); a per-lead CPA is divided by the approve rate
- **contribution before ads** = everything above; **contribution** = minus ads
- **break-even CPA** (what you may pay the platform, ex-VAT, per lead or per order) = contribution before ads ÷ (1 + ad VAT) [× approve rate for leads]
- **break-even ROAS (platform)** = price ÷ break-even CPA — compare with the ROAS Ads Manager shows when the pixel sends the order value
- **break-even ROAS (collected cash)** = collected revenue ÷ contribution before ads — the real cash ROAS after refusals

## 2. Intake → input JSON
Ask for what is missing; otherwise apply the rulings in `selling/SKILL.md` and list them.
```json
{
  "name": "Масажер для шиї, 1 шт",
  "price": 899, "unitsPerOrder": 1,
  "cogsPerUnit": 240,
  "packaging": 18,
  "shipping": { "forward": 90, "return": 90, "payer": "buyer" },
  "refusalRate": 0.14, "prepaidShare": 0.1, "prepaidRefusalRate": 0.01, "refusedGoodsLossPct": 0.05,
  "codFee": { "pct": 0.025, "fixed": 0 },
  "paymentFee": { "pct": 0.013, "fixed": 0 },
  "marketplaceCommissionPct": 0,
  "ads": { "cpa": 160, "basis": "lead", "approveRate": 0.82, "vatPct": 0.2 },
  "callCenterPerOrder": 25, "otherPerOrder": 0,
  "tax": { "mode": "revenue", "rate": 0.06 },
  "fixedMonthly": 45000,
  "batch": { "units": 400, "ordersPerDay": 12, "cashLagDays": 6 },
  "thresholds": { "minContribution": 150, "minMarkup": 2.3, "maxRefusal": 0.22 },
  "scenarios": [
    { "name": "worst", "refusalRate": 0.2, "ads": { "cpa": 210 } },
    { "name": "expected" },
    { "name": "best", "refusalRate": 0.1, "ads": { "cpa": 130 } }
  ]
}
```
Field notes:
- `landed` instead of `cogsPerUnit`: `{ "unitPrice": 3.1, "fx": 41.2, "freightPerUnit": 0.6 | "freightPerKg": 9, "weightKg": 0.3, "dutyPct": 0.1, "importVatPct": 0.2, "importVatReclaimable": false, "brokerPerUnit": 4, "domesticPerUnit": 3 }` — duty on customs value, import VAT on value + duty (see `references/sourcing.md`). `fx` = selling currency per supplier currency on the day; cite the rate source.
- `shipping.payer`: "buyer" = buyer pays delivery on receipt (common for COD); seller then pays forward + return only on refused parcels. "seller" = free-shipping offer.
- `shipping.return` defaults to `forward`. If your Nova Poshta contract gives free returns on refusal, set 0 — and say so.
- `codFee`: NovaPay standard tariff = seller 2.5% (NovaPay account) / 3.3% (other bank); universal = seller 0.5% / 1.3% and the buyer pays 1% + 10 or 2% + 20 UAH (that buyer fee raises refusal risk; it is not in the seller's cost).
- `ads.basis`: "lead" when the platform optimises for form submissions and a call centre confirms; "shipped" when CPA is already per confirmed order.
- `tax.mode`: "revenue" (single tax: FOP group 3 = 0.05 + 0.01 military levy in 2026 per sources.md — confirm with an accountant), "vat" (price includes VAT; enter all costs net of VAT), "none".
- `cashLagDays`: days from shipping to money on account (delivery + COD payout).

## 3. Run and present
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/unit-economics.mjs" deliverables/selling/<slug>/ue.json
node "${CLAUDE_PLUGIN_ROOT}/scripts/unit-economics.mjs" deliverables/selling/<slug>/ue.json --json
```
Present the markdown table as-is (worst first), then 3–6 lines of reading:
1. Contribution per shipped order in worst / expected; which flags fired.
2. Break-even CPA and the current/expected CPA → headroom. Headroom < 20% = fragile.
3. The single biggest cost line and the lever that moves it (price, bundle, refusal, CPA, COD tariff, payer of delivery).
4. Monthly break-even orders vs realistic daily volume; batch: orders to recover stock cost, peak cash need.

## 4. Levers to test (re-run the script for each — never estimate)
| Lever | Typical scenario change |
|---|---|
| Bundle 2-for / 1+1=3 | `price`, `unitsPerOrder`, `otherPerOrder` (gift) |
| Price step | `price` ± 100 UAH and the refusal you expect at that price |
| Free shipping offer | `shipping.payer: "seller"` + higher conversion (lower CPA) |
| Prepay incentive (discount for card payment) | `prepaidShare` ↑, `price` − discount, `paymentFee` |
| Call-centre upsell | `price` = average order value after upsell, `callCenterPerOrder` ↑ |
| COD tariff choice | `codFee.pct` 0.025 vs 0.005 (universal) and refusal impact |
| Marketplace instead of landing | `marketplaceCommissionPct`, `ads.cpa` 0 or marketplace ads, `prepaidShare` from the platform |

## 5. Sanity gates
- Refusal rate is the most sensitive input: always show refusal at +6 percentage points as the worst case unless the user has 300+ shipped orders of history.
- CPA from a different product, platform or season is a prior, not data — label it.
- If contribution before ads ≤ 0, stop: no ad strategy fixes it. Go to `references/offer.md` or kill the product.
- Store the input JSON next to the report so the user (or `/ads`) can re-run it.

## 6. Hand-offs
- Break-even CPA/ROAS → `perfect-hub:ads` (targets and kill rules for the test campaign).
- Pricing page or calculator on the site → core `/absolute` (brief in `.planning/handoff-selling.md`).
- Tax regime choice → `perfect-hub:business`; end tax remarks with "verify with an accountant".
