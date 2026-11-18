# Ads — TikTok

Facts with dates: `${CLAUDE_PLUGIN_ROOT}/skills/ads/references/sources.md` (TikTok section). Check that the user's account can target the intended country (Ads Manager location list) — availability changes; don't assume.

## 1. Setup rules (verified, June–July 2026)
- **Minimum daily budget:** campaign > USD 50, ad group > USD 20 (lifetime: days × daily minimum). Campaign budget must not be lower than ad group budgets.
- **Budget changes:** ≤ 40% per change while in learning, ≤ 30% after exiting, not more often than every two days.
- **Learning:** volatility typically declines after ~25 results or 7 days; avoid pausing, edits that retrigger learning, unreasonable budgets or creative volumes. (The "50 conversions per week" figure is a third-party rule of thumb, not on TikTok's page.)
- **Ad VAT:** 20% for Ukrainian advertisers that are not VAT-registered businesses.
Size budgets: `node "${CLAUDE_PLUGIN_ROOT}/scripts/ads-calc.mjs" learning --cpa <CPA> --events 25 --days 7 --adsets <n> --budget <daily>` (25 = TikTok's stabilisation marker; use 50 for a stricter plan).

## 2. Structure
| Level | Choice | Note |
|---|---|---|
| Campaign | Sales / Website conversions; Smart+ when tracking is solid and the user wants automation | Smart+ upgraded experience changes ad naming and macros (`__ADID_V2__`) |
| Ad group | optimisation event = deepest event with volume (`references/strategy.md` ladder); broad targeting first; placements TikTok (Pangle only after a separate test) | location + language Ukrainian |
| Ad | 3–5 creatives per ad group, each a different hook on one angle | Spark Ads preferred when an organic post exists |
Bid: start with lowest cost (maximum delivery); add cost cap at the target CPA from `ads-calc.mjs target` only after you know the achievable CPA.

## 3. Spark Ads
- Boosts an existing organic post (own account or a creator's with an authorisation code); likes, comments, follows go to the original post.
- Creator flow: creator opens the post → ad settings → enables ad authorisation → picks duration (7 / 30 / 60 / 365 days) → sends the code; advertiser adds it in Ads Manager. Put the duration and usage rights in the creator agreement (route the contract to `/office`/a lawyer).
- Max video length 10 minutes for sparked posts; banned organic posts are rejected; un-authorise before deleting the post.
- Comment moderation matters more than on Meta: a "Temu has it for 150 UAH" comment under a Spark Ad is public social proof against you — pin a reply, hide spam, answer questions within hours.

## 4. Creative norms (practitioner judgement unless marked)
- Native first: shot on a phone, person speaking to camera or hands-on demonstration, trending sound only if licensed for commercial use (Commercial Music Library) `[Unverified]` exact library rules — check in Ads Manager.
- Hook in 0–2 s: visible problem, surprising result, or direct question; the product appears by second 3.
- One idea per video; 15–35 s is a common range for conversion ads (judgement); captions on screen in Ukrainian; CTA at the end and in the ad text.
- Specs for non-Spark in-feed (verified): 9:16 ≥ 540×960 recommended (1:1 ≥ 640×640, 16:9 ≥ 960×540); mp4/mov/mpeg/3gp/avi; ≤ 500 MB; up to 10 min; bitrate ≥ 516 kbps; ad text without links, @ or hashtags; use TikTok's safe-zone templates.
- Iterate hooks on a proven body: same middle and offer, 3–5 new first seconds — the cheapest test with the biggest effect (judgement).
- Ad policy: TikTok's advertising policies are stricter than Meta's for some categories (weight management, supplements, before/after) `[Unverified]` details — read the current policy for the category before production.

## 5. Tracking
- TikTok Pixel + Events API; send `event_id` in both for deduplication (same event name + event_id within 48 h; Pixel vs Events API merged when the second arrives after 5 min within 48 h).
- Pass `ttclid` through the landing to the CRM so confirmed orders can be sent server-side `[Unverified]` matching details — see Events API docs.
- URL macros for UTMs: `__CAMPAIGN_NAME__`, `__CAMPAIGN_ID__`, `__AID_NAME__`, `__AID__`, `__CID_NAME__`, `__CID__`, `__PLACEMENT__` (Smart+: `__ADID_V2_NAME__`, `__ADID_V2__`). Example:
  `?utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__&utm_term=__AID_NAME__`
Implementation code → core `/absolute` (`.planning/handoff-ads.md`).

## 6. Reading results
- TikTok-sourced COD leads can redeem worse than Instagram leads (owner's experience, `[Unverified]`): compare approve rate and delivered-order CPA by platform before shifting budget.
- Judge creatives on cost per optimisation event over enough events (`references/creative-testing.md`); 2-second view rate and 6-second view rate diagnose the hook, not profit.

## 7. Output
Build sheet (campaign / ad group / ads with names), Spark Ads authorisation checklist, creative briefs (hooks × angle) → `perfect-hub:brand`, tracking requirements → `references/analytics.md`.
