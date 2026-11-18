---
name: selling
description: "E-commerce product intelligence for Ukraine and other markets. Use when the user wants to evaluate or score a product idea, calculate unit economics with Nova Poshta cash on delivery and refusals, find suppliers on 1688, Temu or 7km and compute landed cost, research competitor ads in the Meta, TikTok or Google ad libraries, tear down a competitor funnel, design an offer, price ladder or bundles, or write Rozetka, Prom or Epicentr listings, or types /selling. Reads its reference files per task."
---

# /selling — Perfect Selling

Every product is a money-losing trap until its numbers, logistics and ads survive a stress test with real data. This skill takes the request, fills the minimum inputs, routes to the domain skills, and enforces the gates below. Verified facts and their check dates: `${CLAUDE_PLUGIN_ROOT}/skills/selling/references/sources.md`.

## 1. Route
| The user wants… | Skill | Main output |
|---|---|---|
| "Is this product worth selling?", a score, GO/NO-GO | `references/product-audit.md` | scorecard (`product-score.mjs`) + verdict + kill reasons |
| Margin, break-even CPA/ROAS, refusal impact, batch cash flow | `references/unit-economics.md` | `unit-economics.mjs` table, 3 scenarios |
| Who advertises this, which creatives run, how long | `references/ad-intel.md` | evidence log from ad libraries with links and capture dates |
| Supplier, MOQ, landed cost, customs | `references/sourcing.md` | supplier shortlist + landed-cost block |
| Competitor store / landing page breakdown | `references/competitors.md` | funnel teardown table + gaps to exploit |
| Offer, pricing, bundles, upsells, guarantee | `references/offer.md` | offer sheet with price ladder checked by the calculator |
| Rozetka / Prom / Epicentr listing | `references/listings.md` | listing copy + attribute table + photo brief per marketplace |
| Independent "try to kill this idea" review | agent `selling-market-analyst` | sceptic report with evidence |

Full product audit = ad-intel → sourcing → unit-economics → product-audit → market-analyst. Run them in that order; each feeds numbers to the next. Read the matching reference file (`references/<topic>.md` next to this skill) before doing that part of the work.

## 2. Intake (ask only what blocks the work)
Ask in one message, at most 5 questions, offering the default in brackets:
1. Product: link, photo or exact name + variant.
2. Channel: own landing page with COD / own store / marketplace (Rozetka, Prom, Epicentr) / mixed [landing page + COD].
3. Market and currency [Ukraine, UAH, Nova Poshta].
4. Known costs: purchase price, supplier, target price [unknown → research].
5. Their real data if any: refusal rate, CPA, approve rate, conversion rate from previous products [none → priors marked `[Unverified]`].

Rulings when the user doesn't answer: Ukraine, UAH, Nova Poshta branch delivery, buyer pays delivery on receipt, NovaPay standard COD tariff, FOP group 3 at 5% + 1% military levy, ad VAT 20% (non-VAT-registered advertiser), three scenarios (worst / expected / best). State every ruling in one line at the top of the output.

## 3. Evidence rules (non-negotiable)
- **No emulated data.** Never invent ad run-times, ad-set counts, spend, sales counts, reviews, supplier prices or marketplace prices. Every number is (a) from the user, (b) from a page you opened this session — cite URL + capture date, (c) from `sources.md`, or (d) a labelled prior marked `[Unverified]`.
- **Research live.** Use WebFetch/WebSearch; for pages that block fetchers (Meta Ad Library, Temu, Rozetka search, 1688) use the browser tools (`mcp__Claude_Browser__*` or Claude in Chrome). If a source cannot be opened, write "Data unavailable: <source> — <reason>" and lower confidence; do not fill the gap from memory.
- **Calculations run in scripts:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/unit-economics.mjs" <input.json>` and `node "${CLAUDE_PLUGIN_ROOT}/scripts/product-score.mjs" <card.json>`. Never hand-compute margins, ROAS or composite scores in prose.
- **Confidence label** on every verdict: High (user's own data + live research), Medium (live research + priors), Low (mostly priors).
- Tax, customs and legal statements end with: "Перевірте з бухгалтером / митним брокером / юристом перед рішенням." (or the user's language).

## 4. Quality gates before delivery
1. Every number traceable (user / URL+date / sources.md / `[Unverified]`).
2. Unit economics computed by the script in 3 scenarios; worst case shown first.
3. Score produced by `product-score.mjs` (deductions add up; 95+ has evidence; fatal flags and weak links applied).
4. Kill list: the 3 strongest reasons the product fails, each with evidence — even for a GO.
5. Next actions are concrete (test budget, creatives to make, listing to publish), each with an owner skill or component.

## 5. Output
Reply in the user's language. Structure: rulings line → verdict + confidence → numbers table (script output) → evidence log → kill list → next actions. Long deliverables (audit reports, listing packs, offer sheets, input JSON) go to `deliverables/selling/<product-slug>/` unless the user names a place; keep the script inputs there so the numbers can be re-run.

## 6. Hand-offs
Every part of Perfect Hub is available here: load the target skill with the Skill tool (`perfect-hub:<skill>`) and a brief (goal, inputs, constraints, acceptance criteria); code, sites and integrations go to the core through `.planning/handoff-<component>.md` and `/absolute`.
| Need | Goes to | Brief contains |
|---|---|---|
| Landing page, store, order form, CRM/Nova Poshta API integration, calculator page | core `/absolute` via `.planning/handoff-selling.md` | goal, audience, offer sheet, price ladder, sections, form fields (name + phone), tracking events, acceptance criteria |
| Ad creatives, product photos, packaging visuals | `perfect-hub:brand` | angles from ad-intel, hooks, formats 9:16 / 1:1 / 4:5, policy limits, Ukrainian copy |
| Test campaign, budgets, CPA targets | `perfect-hub:ads` | break-even CPA/ROAS from the calculator, offer, creatives, geo, daily test budget |
| Supplier contract, invoice, commercial proposal file | `perfect-hub:office` | parties, goods, Incoterms, prices, payment terms |
| Public offer, returns policy, warranty text | a lawyer | channel, goods, return terms used in the offer |
| FOP group choice, PRRO, tax calendar | `perfect-hub:business` | expected revenue, channel, payment methods |
| Landing / ad copy beyond the offer sheet | `perfect-hub:marketing` | offer sheet, audience, angles |
