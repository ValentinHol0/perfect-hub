# Selling — Competitor Funnel Teardown

Look at the funnel the way a buyer meets it: ad → landing → form → call → parcel → after-sale. Everything recorded comes from pages you opened (URL + capture date) or from the user. Never buy, never submit a competitor's order form with real or fake personal data, never call their call centre — observe only.

## 1. Collect (browser preferred: landing pages hide offers in scripts and pop-ups)
1. Ads: from `references/ad-intel.md` (Library IDs, start dates, hooks).
2. Landing page at phone width (375 px) and desktop: screenshot the first screen, the price block, the form, the footer.
3. Page source signals (view-source or the network panel): platform (Shopify `cdn.shopify.com`, Tilda `tildacdn`, Horoshop, Prom site, WordPress/WooCommerce `wp-content`, LP-CRM/LeadVertex form endpoints `[Unverified]` signatures), pixels (Meta `fbq(`/`connect.facebook.net`, TikTok `ttq.`/`analytics.tiktok.com`, GTM `googletagmanager.com`, GA4 `gtag(`), CRM/form handler domains.
4. Legal and trust: seller entity (FOP name / ЄДРПОУ / ІПН shown?), public offer, returns text, address, phone/messengers, reviews (on-site vs independent: Google Maps, Rozetka, Prom).
5. Marketplace presence: same product on Rozetka/Prom/Epicentr under their brand? Price there vs landing.
6. Price parity: cheapest identical item (Temu, Prom) for context.

## 2. Teardown table (one per competitor)
| Stage | What they do (fact + source) | Strength | Weakness / gap | Our move |
|---|---|---|---|---|
| Ad angle | | | | |
| First screen (headline, visual, price visible?) | | | | |
| Offer and price ladder (1 / 2 / 3 pcs, gift, "old price") | | | | |
| Proof (video, UGC, reviews, numbers) | | | | |
| Objection handling (FAQ, warranty, "огляд перед оплатою") | | | | |
| Form (fields, steps, prepay option) | | | | |
| Urgency (timer, stock counter — real or fake?) | | | | |
| Upsell / cross-sell (order bump, thank-you page, call) | | | | |
| Delivery and payment (NP/Ukrposhta, COD, terms, who pays) | | | | |
| Trust and legal (entity, offer, returns, contacts) | | | | |
| Tracking stack | | | | |
| Mobile UX (speed feel, sticky CTA, broken elements) | | | | |

## 3. Scoring the funnel (0–3 per stage, relative to the best competitor found)
0 = missing or broken · 1 = present, weak · 2 = solid · 3 = best in set. Show a matrix competitors × stages; the stages where everyone scores ≤ 1 are the positioning opportunity.

## 4. Red flags that predict refusals (useful for C3 and for our own design)
- Price hidden until the form, or "-70%" against an "old price" nobody charged — attracts low-intent leads; Ukrainian law prohibits misleading advertising (Law "On Advertising", a lawyer for specifics).
- No seller identity or returns information → higher refusal and chargeback risk.
- Fake countdowns resetting on reload, stock counters → trust damage in comments.
- Prepayment forced on cold traffic in UA → low conversion; COD with "огляд перед оплатою" is the common norm `[Unverified]` share.

## 5. Output
1. One-paragraph summary per competitor (who, platform, offer, price, dominant angle).
2. Teardown tables + funnel matrix.
3. "What we copy (category conventions buyers expect)" vs "Where we win (gaps)" — max 5 each, each tied to evidence.
4. Inputs for `references/offer.md` (price anchors, bundle structures seen) and for the landing brief to core `/absolute` (sections, form, trust elements, tracking events) via `.planning/handoff-selling.md`.
Do not reproduce competitor copy or images in deliverables; describe them.
