# Ads — Meta (Facebook / Instagram)

Facts and dates: `${CLAUDE_PLUGIN_ROOT}/skills/ads/references/sources.md` (Meta section). Policy pitfalls: `${CLAUDE_PLUGIN_ROOT}/skills/ads/references/meta/policy-pitfalls.md`. Meta renames features often — if the user's Ads Manager shows different labels, follow the UI and note the difference.

## 1. Before building
- Money frame from `references/strategy.md` (break-even and target CPA, learning budget).
- Tracking from `references/analytics.md`: Pixel + Conversions API with deduplication (`event_id`), domain verified, the optimisation event firing once per order, CRM-confirmed purchases sent server-side if you optimise on them.
- Policy check of product and angle (`policy-pitfalls.md`). A rejected ad set restarts learning and can hurt account quality.

## 2. Choose the setup
| Situation | Setup | Why |
|---|---|---|
| One market, catalog or 1–5 products, conversion tracking healthy | **Advantage+ sales campaign**: Advantage+ audience, Advantage+ campaign budget, Advantage+ placements | Meta's automation needs all three levers to keep the Advantage+ state (developer docs, `sources.md`); fewest decisions for small teams |
| Need hard control (age 18+ for restricted categories, strict geo/region exclusions, separate budgets per angle) | Manual Sales campaign | exclusions/limits switch the Advantage+ state off — that is fine when the constraint is required |
| Creative testing with equal spend per concept | ABO test campaign (ad set budgets), 1 concept per ad set | CBO concentrates spend on early leaders — good for scaling, bad for fair tests |
| Scaling proven ads | Advantage+ campaign budget (CBO) across 2+ ad sets or the Advantage+ sales campaign | Meta: campaign budget is best with ≥ 2 ad sets and may spend unevenly — read results at campaign level |
Meta's learning phase: about 50 results in the week after the last significant edit; edits during learning reset it; combine similar ad sets; avoid high ad volumes and unrealistic budgets (`sources.md`). Size budgets with `ads-calc.mjs learning`.

## 3. Build sheet (deliverable `deliverables/ads/<project>/meta-build.md`)
| Level | Field | Value | Note |
|---|---|---|---|
| Campaign | Objective | Sales | Leads only for lead-form funnels |
| Campaign | Name | per naming convention (`references/creative-testing.md`) | |
| Campaign | Budget | Advantage+ campaign budget, daily N | or ad set budgets for tests |
| Campaign | Bid strategy | Highest volume (lowest cost) to start; cost per result goal once CPA is known | cost cap set at target CPA from `ads-calc.mjs target`; too low = no delivery |
| Ad set | Conversion location / event | Website → Purchase (or Lead) | the deduplicated event |
| Ad set | Attribution | standard: 7-day click + 1-day view (+ 1-day engage-through for video) or 1-day click for COD impulse items — choose one and keep it for comparisons | options per `sources.md`; never compare ad sets with different attribution models |
| Ad set | Audience | Advantage+ audience; suggestions: interests/lookalikes as hints; exclusions: purchasers last 30–180 days if repeat purchase is unlikely | age 18+ where policy requires (weight loss, supplements, cosmetic procedures) |
| Ad set | Geo | Ukraine; exclude regions/cities your delivery doesn't serve | match Nova Poshta / courier coverage |
| Ad set | Placements | Advantage+ placements; check each placement's preview | exclude only with evidence (placement breakdown with ≥ 10 conversions) |
| Ad | Format | 9:16 video primary, 4:5 and 1:1 variants; Ukrainian on-screen text | safe zones: keep text out of top ~14% and bottom ~20% on Reels `[Unverified]` — check the preview |
| Ad | Copy | hook in the first line, offer, risk reversal (COD, inspection), CTA | Ukrainian; no claims you can't prove |
| Ad | URL | landing + UTMs with dynamic parameters (`references/analytics.md`) | `utm_campaign={{campaign.name}}` freezes at first publish |

## 4. Audiences that matter for small stores
- **Broad + strong creative** is the default prospecting audience; creative does the targeting.
- **Custom audiences**: site visitors (7/30/180 days), add-to-cart non-buyers, video viewers (ThruPlay / 50%+), Instagram/Facebook engagers, customer list (phones/emails from CRM — only with lawful basis and hashing via Meta's upload; route privacy questions to a lawyer).
- **Exclusions**: recent buyers (unless consumable), employees/test devices if large.
- Lookalikes are hints inside Advantage+ audience rather than hard limits; test them as separate ad sets only in ABO tests.

## 5. Creative testing inside Meta
- One concept (angle) per ad set in ABO tests; 3–5 ads per ad set (variants of hook/format) — not 20.
- Keep winning ads by **post ID** when moving to scale (social proof stays).
- Judge by cost per optimisation event and downstream (approve rate, delivered orders), not CTR alone. Decisions via `ads-calc.mjs kill` / `compare` (`references/creative-testing.md`).
- Creative fatigue signals (judgement): frequency rising with CTR falling and CPA rising over 3+ days on the same audience.

## 6. Diagnosing problems
| Symptom | Check first | Usual fix |
|---|---|---|
| "Learning limited" | weekly results per ad set vs ~50 | merge ad sets, raise budget to learning level, optimise a higher-volume event |
| No delivery | bid/cost cap too low, audience too narrow, ad rejected, payment issue | remove cap or raise to target CPA, broaden, fix policy |
| CPA doubled after edits | "Last significant edit" column | stop editing; wait out learning |
| Ads Manager purchases ≠ CRM orders | dedup, attribution window, refusals | `references/analytics.md` reconciliation |
| Ad rejected | the exact policy named in the notice | edit to comply; request review only if compliant (`policy-pitfalls.md`) |

## 7. Output
Build sheet + audience list + test plan + policy check result + tracking dependencies. Implementation of Pixel/CAPI code → core `/absolute`; creatives → `perfect-hub:brand`.
