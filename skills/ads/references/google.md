# Ads — Google (Search, Shopping, Performance Max)

Facts with dates: `${CLAUDE_PLUGIN_ROOT}/skills/ads/references/sources.md` (Google section). Feed checklist: `${CLAUDE_PLUGIN_ROOT}/skills/ads/references/google/merchant-feed.md`.

## 1. Account architecture for a small store
| Campaign | Purpose | Setup |
|---|---|---|
| Brand Search | capture people searching your name; protect against competitors | exact/phrase brand terms; sitelinks; low CPC; separate budget |
| Non-brand Search | category and problem queries | 1 campaign per category or margin tier; tightly themed ad groups; responsive search ads with 8–15 headlines in Ukrainian |
| Shopping or Performance Max | product discovery with a feed | Merchant Center feed clean first; PMax brand exclusions so brand queries stay in Brand Search |
| Remarketing (optional) | return visitors | inside PMax audience signals or Display/YouTube when budget allows |
Ukraine is a supported Shopping country (UAH, Shopping tab available).

## 2. Search essentials
- Keyword research from Google Keyword Planner + real search terms reports; group by intent (buy-intent "купити", "ціна", model numbers vs research "як вибрати").
- Exact-match keywords in Search campaigns take priority over Performance Max for matching queries — use that to keep control of brand and best terms.
- Negative keyword lists from day one: jobs, free, DIY, wholesale (unless B2B), competitor brands you don't sell, Russian-language variants if you serve only Ukrainian landing pages (decide consciously).
- Ads: Ukrainian copy (state-language rule for advertising), price and delivery in headlines when competitive, COD/"оплата при отриманні" as risk reversal.

## 3. Smart Bidding (verified 2026-11-12)
- "Learning" status never lasts more than 7 days; convergence usually takes 1–2 conversion cycles. It is triggered by a new or reactivated strategy, adding/removing campaigns/keywords from the strategy, or a significant conversion-goal change — **not** by budget, target or targeting edits.
- Target CPA can start without conversion history (tracking required); evaluate over ≥ 30 days with ≥ 30 conversions. From June 2026 the label "Maximize conversions with a Target CPA" reads "Target CPA".
- Set targets from the money frame: `ads-calc.mjs target --aov … --margin … --profit …` → target CPA / target ROAS (Google's tROAS is entered as a percentage: ROAS 4.0 = 400%).
- Optimise to the conversion that means money: purchase with value, or for COD a confirmed order imported offline (gclid captured on the form and stored in the CRM) — implementation → core `/absolute`.

## 4. Performance Max
- One campaign across Search, Shopping, YouTube, Display, Discover, Gmail, Maps; asset groups = themes (category or audience) with their own images, videos, headlines, final URLs.
- Audience signals (customer lists, site visitors, custom segments) guide, they don't restrict.
- Final URL expansion can send traffic to other pages and generate assets — turn it off or exclude URLs if only specific landing pages convert; review generated assets.
- Brand exclusions apply to Search and Shopping inventory in PMax (brand lists); keep brand in a dedicated Search campaign.
- Reporting: `{network}` = x for all PMax traffic; `{adgroupid}` doesn't exist — use `{assetgroupid}`.

## 5. Brand protection
- Competitors may bid on your brand as a keyword — that is not restricted by Google's trademark policy; using your trademark in their **ad text** can be restricted after you file a trademark complaint (rights must be shown for the country; resellers and informational sites have exceptions).
- Defend with a Brand Search campaign (cheap clicks, sitelinks, top position) and a registered trademark in Ukraine (check with a lawyer).
- Watch auction insights and the Ads Transparency Center (`adstransparency.google.com/?region=UA`) for who appears on your brand.

## 6. Tracking
- Auto-tagging on (gclid); ValueTrack in final URL suffix or tracking template, for example:
  `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&device={device}&network={network}`
  Shopping adds `{product_id}`; PMax supports `{campaignid}`, `{device}`, `{lpurl}`, `{assetgroupid}`.
- GA4 linked; conversions imported or Google Ads tag with enhanced conversions where lawful; one primary conversion per goal to avoid double counting.

## 7. Output
Campaign plan table, keyword/negative lists, bidding targets from the calculator, feed issues list (`merchant-feed.md`), brand-protection actions, tracking requirements → `references/analytics.md` / core `/absolute`.
