# Ads — Strategy, Architecture, Budgets

Platform facts with dates: `${CLAUDE_PLUGIN_ROOT}/skills/ads/references/sources.md`. All arithmetic: `${CLAUDE_PLUGIN_ROOT}/scripts/ads-calc.mjs`.

## 1. Money frame first
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/ads-calc.mjs" breakeven --aov 950 --margin 0.38 --ads-vat 0.2
node "${CLAUDE_PLUGIN_ROOT}/scripts/ads-calc.mjs" target --aov 950 --margin 0.38 --profit 90 --ads-vat 0.2
```
`margin` = contribution margin before ads, after COGS, delivery, COD fees, refusals and returns (for COD stores take it from `/selling`'s `unit-economics.mjs`: `contributionBeforeAds / price`). Write down three numbers: **break-even CPA**, **target CPA**, **break-even ROAS**. If target CPA is below anything the user has ever achieved, say so before spending.

## 2. Optimisation event ladder
Pick the deepest event the budget can feed with enough volume per ad set to stabilise (Meta: ~50 results per week after the last significant edit; TikTok: volatility declines after ~25 results or 7 days; Google Smart Bidding: learning status ≤ 7 days, convergence 1–2 conversion cycles — `sources.md`).
| Rung | Event | Use when |
|---|---|---|
| 1 | Purchase / confirmed order (server-side from CRM) | weekly volume per ad set reachable with the budget |
| 2 | Purchase from the site / Lead (COD form submit) | confirmed orders too few; approve rate stable |
| 3 | Initiate checkout / Add to cart | very low budget; accept weaker optimisation |
| 4 | Landing page views / traffic | only for creative pre-tests or retargeting pools — never as the main sales engine |
Size it: `ads-calc.mjs learning --cpa <expected CPA for that event> --adsets <n> --budget <daily budget>`. If `likelyToExit` is false, cut ad sets (`maxAdsetsThatCanExit`) or move one rung up.

## 3. Channel choice (small Ukrainian store, judgement — validate with data)
| Situation | Lead channel | Support |
|---|---|---|
| Impulse product, demonstration video, COD landing | Meta (Instagram Reels/Stories + Facebook) | TikTok if creatives are native and the audience is younger |
| People already search for the product or brand | Google Search (+ Shopping with a feed) | PMax once conversion tracking is clean |
| Marketplace seller (Rozetka/Prom/Epicentr) | Marketplace internal ads | Meta/TikTok to an own store only when unit economics allow it |
| Local service / B2B leads | Google Search + Meta lead forms | retargeting |
Telegram: big in Ukrainian media consumption; paid posts in channels are bought directly from admins (price per post, no pixel) — treat as a separate test with UTM + promo code; Telegram's own ad platform has its own budgets and rules `[Unverified]` for current minimums.

## 4. Architecture templates
**Starter (one product, daily budget below ~3× learning budget):**
```
Campaign: Sales | CBO (Advantage+ campaign budget) | 1 country
 └─ Ad set A: broad / Advantage+ audience | placements Advantage+ | optimisation: deepest feasible event
     └─ 3–6 ads = 2–3 angles × 2 formats
Retargeting: none until ≥ 1,000 site visitors/week (judgement)
```
**Growth (test + scale split):**
```
Campaign 1 TEST  | ABO | 1–3 ad sets × 3–5 new creatives, fixed budget for a set period
Campaign 2 SCALE | Advantage+ sales campaign or CBO broad | only proven creatives (post IDs reused to keep social proof)
Campaign 3 BRAND/RETARGET (optional) | small budget | catalog / proof creatives
```
**Google for a store:** Brand Search (exact) · Non-brand Search by category · Shopping or PMax with feed · brand exclusions on PMax so brand traffic stays in the brand campaign (`references/google.md`).
Rules: fewer ad sets with more budget beat many starved ones (Meta itself advises combining similar ad sets); one variable per test; never mix prospecting and retargeting goals in one ad set.

## 5. Phases and gates
| Phase | Goal | Budget rule | Exit gate |
|---|---|---|---|
| 0 Tracking | events fire once, dedup works, CRM statuses flow back | 0 | `references/analytics.md` checklist passes |
| 1 Discovery | find 1–2 angles that convert | per ad set ≥ learning budget or fixed test budget per creative (≥ 3× target CPA to judge zero-conversion ads) | ≥ 1 creative with CPA ≤ target over ≥ 10 conversions |
| 2 Stabilise | prove CPA holds at 2–3× spend | move winners to the scale campaign, keep a testing slot | CPA ≤ target for 7 days, refusal/approve stable |
| 3 Scale | grow volume with CPA ≤ break-even | raise budgets stepwise (TikTok documents ≤ 30% per change after learning, ≤ 40% in learning, not more than every 2 days; Meta: avoid frequent large changes — exact threshold `[Unverified]`) + horizontal (new angles, geos, platforms) | marginal CPA approaches break-even → hold |
Kill and scale decisions use `ads-calc.mjs kill` / `compare` (`references/creative-testing.md`).

## 6. Budget sheet (deliverable)
| Line | Daily | Weekly | Basis |
|---|---|---|---|
| Test campaign | | | n ad sets × learning budget or n creatives × 3× target CPA / test days |
| Scale campaign | | | remainder once a winner exists |
| Creative production | | | brief to `/brand` |
| Reserve (10–20%, judgement) | | | re-tests, seasonality |
Add ad VAT (20% for non-VAT-registered advertisers on TikTok; Meta `[Unverified]`) to cash planning, and COD cash lag (money arrives days after spend).

## 7. Ukrainian specifics to plan around (judgement unless sourced)
- COD funnels: optimise on confirmed orders sent back server-side when volume allows; lead-level optimisation drifts toward cheap, low-intent leads — watch approve rate weekly.
- Refusals arrive 1–2 weeks after spend: judge campaigns on CPA now, but re-check cost per **delivered** order before scaling.
- Ukrainian-language creatives and landing pages (legal requirement for ads; also matches the audience).
- Blackouts and air-raid alerts shift traffic and conversion by hour and region — read hourly breakdowns before cutting a schedule; avoid crisis exploitation in angles (Meta policy).
- Ad accounts and payment: keep a backup payment method and Business Manager admin; follow platform verification — never share account access credentials in chat.

## 8. Output
Money frame → event choice with learning math → architecture diagram → phase table with gates → budget sheet → risks → hand-offs (tracking → core `/absolute`, creatives → brand).
