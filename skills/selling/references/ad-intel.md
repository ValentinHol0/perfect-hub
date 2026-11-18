# Selling — Ad Intelligence

This replaces "spy-tool emulation". You report only what a public source shows today, with a link and capture date. What each library can and cannot show: `${CLAUDE_PLUGIN_ROOT}/skills/selling/references/ad-intel/ad-libraries.md`.

## 1. Rules
- Never invent run-times, ad-set counts, spend, impressions, likes or sales. Ad libraries do not show spend or impressions for commercial ads outside the EU — say so instead of estimating.
- "Started running on" in the Meta Ad Library is the start date of that ad ID, not the start of the campaign or proof of profit. Long-running is a signal, never proof.
- Paid spy tools (AdHeart, PiPiAds, Minea, etc.): use their data only if the user pastes exports or screenshots; cite them as "user-provided, <tool>, <date>".
- Pages that refuse fetchers (Meta Ad Library returns 403 to plain HTTP) → open them with the browser tools; if the browser is unavailable too, write "Data unavailable: <source> — <reason>" and ask the user for screenshots or links.
- Capture date = today in ISO format. Store raw notes in `deliverables/selling/<slug>/ad-intel.md`.

## 2. Search plan (run all that apply)
| Step | Where | How |
|---|---|---|
| 1 | Meta Ad Library | `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=UA&q=<query>&search_type=keyword_unordered&media_type=all` — queries: Ukrainian and Russian product names, the core benefit ("без запаху", "за 5 хвилин"), offer markers ("накладений платіж", "1+1=3", "-50%"), competitor domains. Sort by "Total impressions" when the UI offers it (order only, no numbers). Repeat with `country=PL`, `US` for proven foreign angles |
| 2 | Meta advertiser page | open "See ad details" → all ads of that page; count active ads with the same creative ("This ad has multiple versions") |
| 3 | TikTok Creative Center Top Ads | `https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en` — filter industry, objective, region. On 2026-11-12, region UA returned nothing (logged out); use PL / RO / US for angles and say UA data is unavailable |
| 4 | TikTok Commercial Content Library | `https://library.tiktok.com/ads` — covers ads shown in the EU (DSA); useful for EU competitors, not UA |
| 5 | Google Ads Transparency Center | `https://adstransparency.google.com/?region=UA` — search advertiser or domain; shows Search, Shopping, YouTube, Display ads by advertiser |
| 6 | Organic proof | TikTok/Instagram search for the product name: view counts and comment language ("де купити", "на Temu дешевше") with links |
| 7 | Marketplaces | Rozetka, Prom, Epicentr, Temu, OLX: listing count, review count and dates, price range — evidence of demand and of price parity |

## 3. Evidence log format (one row per ad)
| # | Source | Advertiser | Library ID / URL | Start date | Platforms | Format | Hook (first 3 s / first line) | Angle | Offer and price | Landing URL | Captured |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Meta AL, UA | vizerunok_com | 1956922821665272 | 2026-08-16 | FB, IG | video 0:27 | "-50% на перше замовлення" | gift / personalisation | 299 UAH, COD | podarunok.shop | 2026-11-12 |
Quote ad copy only as needed (one line), never reproduce full scripts or brand creatives.

## 4. Reading the signals (judgement — label it)
| Observation | Interpretation (not proof) |
|---|---|
| Same advertiser has many active versions of one creative started weeks apart | creative is being iterated → likely profitable enough to keep testing |
| Ad started > 30 days ago and still active | someone keeps paying for it; check whether the landing and price are unchanged |
| Many advertisers, identical video, started within days | dropshipping wave → expect price war and saturation (C2, C4 deductions) |
| Only ads < 7 days old | untested or recently relaunched; no conclusion |
| No ads in UA but long-running in PL/US | untested here — opportunity or a reason it fails here (price, policy, logistics); test, don't assume |
| Comments mention Temu price or "розвод" | parity and trust problem (C2, C3) |

## 5. Angle extraction (for creatives and offer)
For the 3–5 strongest ads: hook type (problem close-up, result reveal, ASMR process, objection, social proof, price shock), pain named, mechanism shown, proof type, risk reversal (COD, "огляд перед оплатою", warranty), offer structure (price, bundle, gift, deadline). Output a table of angles with how many independent advertisers use each — overused angles are a reason to find a different one, not to copy.

## 6. Output
1. Summary: is it advertised in UA? by how many advertisers? oldest active start date? dominant angle and offer? — each with row references.
2. Evidence log table.
3. Data gaps ("TikTok UA: no data available on Creative Center — region unsupported when logged out").
4. Implications for the scorecard: C2, C4, C5, C6 notes with row references.
5. Creative brief seeds for `perfect-hub:brand` (angles to test, angles to avoid, policy limits) and offer seeds for `references/offer.md`.
