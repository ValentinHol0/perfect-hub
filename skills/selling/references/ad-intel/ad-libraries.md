# What each public ad source shows — checked 2026-11-12

## Meta Ad Library — https://www.facebook.com/ads/library/
- Shows all **active** ads across Meta technologies. Extra data (spend, reach, funding entity) only for ads about social issues, elections or politics, kept for 7 years; ads delivered in the EU get extra transparency data and stay one year after the last impression. Source: https://transparency.meta.com/researchtools/ad-library-tools
- Ukraine is not in the EU: for ordinary commercial ads in UA you get the ad, advertiser, Library ID, start date ("Почато показ / Started running on"), platforms, and "This ad has multiple versions". No spend, no impressions, no end date for ads that stopped (they disappear). Verified by opening `country=UA` in the browser pane on 2026-11-12.
- Sort option "Total impressions" exists in the UI (`sort_data[mode]=total_impressions`) — it orders results, it does not show numbers.
- Plain HTTP fetch returns 403/empty; use a real browser.
- The Ad Library API is for political/issue ads and ads delivered to the EU `[Unverified]` scope detail — check https://www.facebook.com/ads/library/api before planning automation.
- Useful URL parameters: `active_status=active|all`, `ad_type=all`, `country=UA|PL|US|ALL`, `q=<keywords>`, `search_type=keyword_unordered|keyword_exact_phrase`, `media_type=all|video|image`, `view_all_page_id=<page id>` (all ads of one page) `[Unverified]` for the last one.

## TikTok Creative Center — Top Ads
- https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en — "high-performing auction ads", filters industry/objective/region/period; the page states the list is limited to ads authorised by advertisers and may not reflect all top ads.
- On 2026-11-12, `region=UA` returned no ads and the region filter reset (logged out). Treat Ukraine as unavailable unless a logged-in check shows otherwise; use neighbouring EU regions for angles.

## TikTok Commercial Content Library
- https://library.tiktok.com/ads — DSA library for ads shown in the EU `[Unverified]` exact coverage; requires interactive search in a browser.

## Google Ads Transparency Center
- https://adstransparency.google.com/?region=UA — region filter "Україна" available; search by advertiser name or website; shows ads by format (text, image, video) and date ranges for verified advertisers. Political ads have extra data. No spend or performance for commercial ads `[Unverified]` beyond what the UI shows.

## Marketplaces as demand evidence
- Rozetka / Prom / Epicentr: number of sellers for the same item, review counts and review dates (recent reviews = recent sales), price spread. Capture the URL and the date; review counts are not sales counts.
- Temu: the delivered price to Ukraine and delivery estimate; "sold" counters are platform-wide and unverifiable — quote them as "Temu shows X sold" only.

## Paid spy tools
AdHeart, PiPiAds, BigSpy, Minea and similar estimate impressions and spend with their own methods. Use only exports or screenshots the user provides; cite tool + date; never imitate their output format with invented numbers.
