# Selling — Offer, Pricing, Bundles, Guarantees

An offer is the price ladder plus the reasons to believe and the risk the buyer no longer carries. Every variant you recommend is a scenario in `${CLAUDE_PLUGIN_ROOT}/scripts/unit-economics.mjs` — no "this should improve margin" without the table.

## 1. Inputs
From earlier steps (or ask): unit economics input JSON, competitor teardown (price anchors and bundles seen), ad-intel angles, parity price (Temu/Prom), supplier price for add-ons (accessories, consumables, gift items).

## 2. Build the offer stack (in this order)
1. **Core promise** — one sentence: result + time/effort + for whom. Concrete, filmable, policy-safe (no cure claims, no body shaming; check `references/product-audit.md` C5).
2. **Price and anchor** — the anchor must be real: a price you or the market actually charged (competitor link, marketplace listing). A crossed-out "old price" that never existed is misleading advertising — don't.
3. **Ladder** (default three steps):
   | Step | Structure | Purpose |
   |---|---|---|
   | 1 | 1 unit at full price | entry, comparison anchor |
   | 2 | 2 units with the second at a discount, or 1 unit + consumable kit | the step you want most people to take ("найпопулярніше") |
   | 3 | 3 units (1+1=3) or the "family / gift" kit | AOV lift; cost covered by low COGS per extra unit |
   Choose steps where the extra unit adds little shipping weight (same NP tariff step) — check in the calculator (`unitsPerOrder`, `price`, `shipping.forward`).
4. **Gift vs discount** — a gift with high perceived value and low cost (case, nozzle set, ebook-style guide in Ukrainian) beats a percentage discount when parity with Temu is the problem: it breaks 1:1 comparison.
5. **Order bump** (checkbox on the form, ≤ 30% of base price), **call-centre upsell** (script: confirm order → offer step 2 or accessory → confirm address/branch), **thank-you page / parcel insert** (repeat purchase code, consumable reorder).
6. **Risk reversal** — COD with inspection at the branch, clear return terms, warranty period, "заміна за наш рахунок" for defects. Distance-sale return rights are set by consumer law (commonly 14 days `[Unverified]` — confirm the current rule via a lawyer); a guarantee may give more than the law, never less. Every guarantee you print you must be able to pay for — model refunds as higher refusal / `otherPerOrder`.
7. **Urgency** — only true constraints: limited batch, real promo end date, seasonal deadline. No resetting timers, no fake stock counters.
8. **Prepay incentive** (optional) — small discount or gift for card payment shifts `prepaidShare` and cuts refusals; test it as a scenario with the payment fee.

## 3. Prove it — scenario set
Add one scenario per offer variant to the input JSON and run the calculator:
```json
"scenarios": [
  { "name": "1 шт 799", "price": 799 },
  { "name": "2 шт 1199", "price": 1199, "unitsPerOrder": 2 },
  { "name": "1+1=3 1499", "price": 1499, "unitsPerOrder": 3, "shipping": { "forward": 135 } },
  { "name": "1 шт + подарунок", "price": 899, "otherPerOrder": 35 }
]
```
For the mix, estimate the take-rate of each step (user's data or `[Unverified]` assumption, e.g. 50/35/15) and report the weighted contribution = Σ share × contribution (state the take-rates; re-run when real data arrives). Reject any step whose worst-case contribution is below the threshold — unless it is explicitly a loss-leader with a measured upsell rate.

## 4. Price psychology that holds in UAH (judgement, test it)
- Price endings 99 / 49 read as "price point" retail pricing; round prices (1000, 1500) read as premium/gift. Pick one style per brand.
- Show the per-unit price on bundles ("399 грн/шт") — it carries the bundle better than a percentage.
- Keep the jump between ladder steps below the price of one more unit at step 1, otherwise step 2 looks like a trick.
- Compare against the real alternative the buyer sees (Temu/Prom link in their head), not against your own anchor.

## 5. Offer sheet (deliverable `deliverables/selling/<slug>/offer.md`, Ukrainian by default)
```
Обіцянка: <результат + час/зусилля + для кого>
Ціни: 1 шт — 799 грн · 2 шт — 1 199 грн (599 грн/шт) · Комплект «Сім'я» 3 шт — 1 499 грн
Подарунок: <що, собівартість, чому цінний>
Додатковий товар у формі: <товар, ціна, очікувана частка>
Апсейл у дзвінку: <скрипт 3 речення>
Гарантія: <строк, що покриває, як звернутися> (звірити з юристом)
Оплата і доставка: Нова пошта, оплата при отриманні або карткою (-5% / подарунок)
Терміновість: <лише реальне обмеження>
Юніт-економіка: <таблиця з unit-economics.mjs>
```

## 6. Hand-offs
Landing/order form implementing the ladder → core `/absolute` (`.planning/handoff-selling.md`); ad copy and creatives per angle → `perfect-hub:brand` / `perfect-hub:marketing`; guarantee and returns text → a lawyer; campaign targets from the new break-even → `perfect-hub:ads`.
