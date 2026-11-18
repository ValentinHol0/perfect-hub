---
name: ads
description: "Performance advertising on Meta, TikTok and Google for e-commerce and lead generation, with Ukrainian small-store defaults. Use when the user wants a campaign plan or account structure, budgets and learning-phase math, Advantage+ or Smart+ or Performance Max setup, creative testing and kill or scale rules, CPA, ROAS or MER targets, UTM, pixel and Conversions API tracking, or an audit of an ad account or media plan, or types /ads. Reads its reference files per task."
---

# /ads — Perfect Ads

Ads amplify an offer; they don't fix one. Every plan starts from the money a sale can afford (break-even CPA/ROAS), sizes budgets so the algorithm can learn, and judges creatives with statistics instead of hope. Verified platform facts with check dates: `${CLAUDE_PLUGIN_ROOT}/skills/ads/references/sources.md`.

## 1. Route
| The user wants… | Skill | Main output |
|---|---|---|
| Plan from zero, objective → structure → budget, phased test | `references/strategy.md` | media plan with budget math and phase gates |
| Meta (Facebook/Instagram) setup, Advantage+, audiences, placements, policy | `references/meta.md` | campaign/ad-set/ad build sheet |
| TikTok setup, Spark Ads, creative norms | `references/tiktok.md` | build sheet + creative specs |
| Google Search, Shopping / Merchant Center feed, Performance Max, brand protection | `references/google.md` | campaign plan + feed checklist |
| Creative test design, naming, kill/scale decisions | `references/creative-testing.md` | test matrix + decision log from `ads-calc.mjs` |
| UTM, pixel, Conversions/Events API, attribution, MER/ROAS/CPA definitions, reporting | `references/analytics.md` | tracking plan + KPI sheet |
| Independent review of an account, plan or results | agent `ads-auditor` | PASS / FIX / STOP with findings |

Read the matching reference file (`references/<topic>.md` next to this skill) before doing that part of the work. Typical launch: strategy → analytics (tracking first) → platform skill → creative-testing → auditor before spending.

## 2. Intake (one message, ≤ 5 questions, defaults in brackets)
1. What is sold, at what average order value, through which funnel (landing + COD, store with checkout, marketplace, lead form) [landing + COD].
2. Contribution margin before ads, or the inputs to compute it [ask; or take break-even from `/selling`'s `unit-economics.mjs` output].
3. Geo and language [Ukraine, Ukrainian copy].
4. Monthly or daily budget and how fast they need results [ask; no default].
5. Tracking state: pixel, Conversions/Events API, GA4, CRM status for confirmed orders [unknown → `references/analytics.md` first].

Rulings when unanswered: Ukraine, UAH reporting with platform spend in the account currency, ad VAT 20% for non-VAT-registered advertisers (TikTok verified; Meta `[Unverified]`), optimisation for purchases/confirmed orders if ≥ ~50 per week per ad set are reachable, otherwise the nearest higher-volume event (see `references/strategy.md`). State every ruling at the top.

## 3. Rules (non-negotiable)
- **Numbers from the calculator:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/ads-calc.mjs" <breakeven|target|learning|mer|kill|compare> ...`. Never hand-compute ROAS targets, learning budgets or significance in prose.
- **Platform facts are dated.** Quote thresholds and feature names only from `sources.md` (with date) or a help page opened this session; otherwise mark `[Unverified]`. Features get renamed (Advantage+ Shopping → Advantage+ sales; Google "Maximize conversions with a Target CPA" → "Target CPA" from June 2026).
- **No invented benchmarks.** Don't promise CPM, CTR, CPA or ROAS for Ukraine; give the break-even and the kill/scale rule instead, and use the user's history when it exists.
- **Statistical caution:** no winner with fewer than ~10 conversions per variant; no kill before spend reaches the level where zero results are significant (`ads-calc.mjs kill`).
- **Policy first:** check the product and angle against Meta Advertising Standards, TikTok and Google policies before planning creatives; wartime topics (air raids, military imagery, "for the army" claims) need explicit care — Meta lists "commercial exploitation of crises" as restricted.
- **Language law:** advertising in Ukraine is in Ukrainian (Law 2704-VIII art. 32) — Russian-only ads to UA audiences are a legal risk; have a lawyer check them.
- Never ask for or handle ad-account passwords, card numbers or tokens; the user changes settings in their own account. You may read exports and screenshots they provide.

## 4. Quality gates before delivery
1. Break-even CPA/ROAS and target CPA computed and shown.
2. Budget per ad set ≥ the learning-budget output, or the plan says explicitly which event it optimises for instead and why.
3. Tracking plan exists (events, dedup, UTMs, CRM feedback loop) before scaling advice.
4. Every creative has a hypothesis and a name per the naming convention; kill/scale thresholds written down before launch.
5. Platform facts carry a source date; everything else is labelled judgement or `[Unverified]`.

## 5. Output
Reply in the user's language. Structure: rulings → money frame (calculator output) → plan/structure tables → tracking checklist → test calendar with decision rules → risks → hand-offs. Files (media plans, build sheets, naming sheets, reports) go to `deliverables/ads/<project>/` unless the user names a place.

## 6. Hand-offs
Every part of Perfect Hub is available here: load the target skill with the Skill tool (`perfect-hub:<skill>`) and a brief (goal, inputs, constraints, acceptance criteria); code, sites and integrations go to the core through `.planning/handoff-<component>.md` and `/absolute`.
| Need | Goes to | Brief contains |
|---|---|---|
| Pixel/CAPI/Events API code, GTM, server-side tagging, landing page, feed generator | core `/absolute` via `.planning/handoff-ads.md` | events and parameters, dedup keys, consent, pages, acceptance tests |
| Creatives (video scripts to shoot, statics, UGC briefs) | `perfect-hub:brand` | hypotheses, hooks, formats, safe zones, policy limits |
| Ad copy and landing copy | `perfect-hub:marketing` | angle, audience, offer, banned claims |
| Margin, offer, price changes | `perfect-hub:selling` | current CPA, ROAS, refusal and approve rates |
| Organic content to seed Spark Ads | `perfect-hub:social` | angles that won, creator brief |
| Ad VAT / FOP tax questions | `perfect-hub:business` | platform invoices, VAT status |
