# Sources register — ads component

Platform facts the ads skills rely on, with the date checked. Platforms rename features and change thresholds several times a year: re-open the page if the check date is older than 90 days, and say so when you can't. Everything else in the skills is practitioner judgement and is phrased as such or marked `[Unverified]`.

## Meta (facebook.com/business/help, transparency.meta.com, developers.facebook.com)
| Fact | Source | Checked |
|---|---|---|
| Learning phase: ad sets exit "as soon as they can deliver stably… usually after about 50 results in the week after the ad set's last significant edit"; editing during learning resets it; avoid high ad volumes, combine similar ad sets, use realistic budgets; "Learning limited" when an ad set can't get enough results. Shops ads: 17 website + 5 Meta purchases | https://www.facebook.com/business/help/112167992830700 | 2026-11-12 |
| Advantage+ campaign budget (formerly campaign budget optimisation) distributes one campaign budget across ad sets in real time, may spend unevenly; best with ≥ 2 ad sets; analyse at campaign level | https://www.facebook.com/business/help/153514848493595 | 2026-11-12 |
| Advantage+ state for Sales campaigns = Advantage+ audience (or geo-only / relaxed targeting) + campaign budget + no placement restrictions; changing any lever outside the criteria turns the state off; legacy ASC creation removed from API v25.0, edits blocked in v26.0; migration forces learning | https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-campaigns | 2026-11-12 |
| Advantage+ Shopping campaigns were renamed Advantage+ sales campaigns | https://www.facebook.com/business/ads/meta-advantage/advantage-plus-shopping-ads | 2026-11-12 |
| Attribution models: standard, incremental, custom. Standard settings for website conversions: click-through 1 or 7 days; view-through 1 day; engage-through 1 day (non-link clicks, video plays ≥ 5 s or 97%). Results across different attribution models are not comparable in one table | https://www.facebook.com/business/help/460276478298895 | 2026-11-12 |
| Dynamic URL parameters: `{{ad.id}}`, `{{adset.id}}`, `{{campaign.id}}`, `{{ad.name}}`, `{{adset.name}}`, `{{campaign.name}}`, `{{placement}}`, `{{site_source_name}}`; name-based values freeze at first publish | https://www.facebook.com/business/help/2360940870872492 | 2026-11-12 |
| Pixel + Conversions API deduplication: same `event_name` + `event_id` (Pixel `eventID`) within 48 h; alternative via `fbp`/`external_id` only for browser-then-server | https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events | 2026-11-12 |
| Health & wellness ad policy: 18+ targeting for weight-loss/gain, supplements, cosmetic products/procedures; no statements of inferiority about appearance; no fat-pinching close-ups; no cure claims for listed incurable diseases; before/after allowed for general cosmetic products when 18+ | https://transparency.meta.com/policies/ad-standards/restricted-goods-services/health-wellness/ (change log 22.07.2026) | 2026-11-12 |
| Ad Standards index incl. "Commercial exploitation of crises and controversial events", prohibited commercial practices, restricted goods | https://transparency.meta.com/policies/ad-standards/ | 2026-11-12 |
| Ad Library: all active ads; extra data only for social-issue/political ads and EU-delivered ads | https://transparency.meta.com/researchtools/ad-library-tools | 2026-11-12 |
| Meta charges 20% VAT to Ukrainian advertisers without a VAT ID | https://www.vatupdate.com/2026/08/14/ukraine-meta-ads-vat-rules-for-advertisers/ (secondary, `[Unverified]` on Meta's page) | 2026-11-12 |

## TikTok (ads.tiktok.com/help)
| Fact | Source | Checked |
|---|---|---|
| Learning phase: volatility typically declines "after about 25 campaign results or 7 days"; avoid pausing, edits that retrigger learning, unreasonable budgets or creative volumes (page updated June 2026). The widely quoted "50 conversions/week" is not on this page | https://ads.tiktok.com/help/article/learning-phase-faq | 2026-11-12 |
| Minimum daily budget: campaign > USD 50, ad group > USD 20; lifetime ad group = days × daily minimum; raise budget ≤ 40% per change in learning, ≤ 30% after, not more often than every two days | https://ads.tiktok.com/resources/help/article/budget?lang=en (updated July 2026) | 2026-11-12 |
| Spark Ads: boost organic posts (own or creators' with authorisation code); engagement accrues to the organic post; max 10-minute videos; up to 10,000 Spark Ads per account; supported objectives incl. Traffic, Conversions, Sales, Lead generation | https://ads.tiktok.com/help/article/spark-ads (updated June 2026) | 2026-11-12 |
| Spark authorisation durations offered: 7, 30, 60 or 365 days | https://ads.tiktok.com/resources/help/article/how-to-create-spark-ads-for-smart-campaigns-on-tiktok-ads-manager (search snippet) | 2026-11-12 |
| Non-Spark in-feed specs: 9:16 ≥ 540×960 (recommended), 16:9 ≥ 960×540, 1:1 ≥ 640×640; mp4/mov/mpeg/3gp/avi; up to 10 min; ≤ 500 MB; bitrate ≥ 516 kbps; captions without links, @ or hashtags; safe-zone templates provided | https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads (updated June 2026) | 2026-11-12 |
| Pixel + Events API deduplication by `event` + `event_id`; within 48 h; Pixel vs Events API merged when arriving after 5 min and within 48 h | https://ads.tiktok.com/help/article/event-deduplication | 2026-11-12 |
| URL macros: `__CAMPAIGN_NAME__`, `__CAMPAIGN_ID__`, `__AID_NAME__`, `__AID__`, `__CID_NAME__`, `__CID__`, `__PLACEMENT__`; upgraded Smart+: `__ADID_V2_NAME__`, `__ADID_V2__`; auto-UTM option exists | https://ads.tiktok.com/help/article/track-offsite-web-events-with-utm-parameters (updated Feb 2026) | 2026-11-12 |
| 20% VAT for Ukrainian advertisers that are not VAT-registered businesses | https://ads.tiktok.com/help/article/ukraine-vat (updated May 2026) | 2026-11-12 |
| Top Ads (Creative Center) with region=UA returned no ads when logged out | https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en | 2026-11-12 |

## Google (support.google.com)
| Fact | Source | Checked |
|---|---|---|
| Performance Max: one campaign across YouTube, Display, Search, Discover, Gmail, Maps; asset groups; audience signals; exact-match Search keywords take priority over PMax; brand exclusions; final URL expansion; objectives Sales / Leads / Website traffic / Local | https://support.google.com/google-ads/answer/10724817 | 2026-11-12 |
| Smart Bidding "Learning" status never lasts more than 7 days; convergence typically within 1–2 conversion cycles; triggered by new/reactivated strategy, composition change, significant conversion-goal change — not by budget, target or targeting edits | https://support.google.com/google-ads/answer/13020501 | 2026-11-12 |
| Target CPA needs no conversion history to start (tracking required); evaluate over ≥ 30 days with ≥ 30 conversions; from June 2026 "Maximize conversions with a Target CPA" is labelled "Target CPA" | https://support.google.com/google-ads/answer/6268632 | 2026-11-12 |
| ValueTrack: `{campaignid}`, `{adgroupid}`, `{keyword}`, `{matchtype}`, `{device}`, `{network}`, `{creative}`, `{targetid}`, `{placement}`, `{gclid}`, `{lpurl}`; Shopping: `{product_id}`, `{merchant_id}`, `{product_channel}`…; PMax: `{campaignid}`, `{device}`, `{lpurl}` full, `{gclid}` limited, `{assetgroupid}`, `{network}` = x | https://support.google.com/google-ads/answer/6305348 | 2026-11-12 |
| Brand settings: brand exclusions (PMax: Search and Shopping inventory) via brand lists; brand inclusions for broad match | https://support.google.com/google-ads/answer/13721847 (search snippet) | 2026-11-12 |
| Trademark policy: restricts trademarks in ad text after a complaint; keywords not restricted; reseller and informational exceptions; 7-day warning before suspension | https://support.google.com/adspolicy/answer/6118 | 2026-11-12 |
| Merchant Center product data: id ≤ 50, title ≤ 150, description ≤ 5000, link, image_link (≥ 500×500 for all products from 31.01.2027), availability (in_stock / out_of_stock / preorder / backorder), price ISO 4217, brand ≤ 70, gtin (≤ 14 digits), mpn ≤ 70, identifier_exists, condition | https://support.google.com/merchants/answer/7052112 | 2026-11-12 |
| Ukraine is a supported country for Shopping ads and free listings, currency UAH, Shopping tab available | https://support.google.com/merchants/answer/160637 | 2026-11-12 |
| GA4 UTM parameters: `utm_id`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_source_platform`, `utm_term`, `utm_content`, `utm_creative_format`, `utm_marketing_tactic`; always set source/medium/campaign; values are case-sensitive, lowercase recommended | https://support.google.com/analytics/answer/10917952 | 2026-11-12 |
| Google Ads Transparency Center has region "Україна" | https://adstransparency.google.com/?region=UA | 2026-11-12 |

## Ukrainian law touching ads
| Fact | Source | Checked |
|---|---|---|
| Advertising in Ukraine is in the state language (with listed exceptions) | Law 2704-VIII art. 32, https://zakon.rada.gov.ua/laws/show/2704-19 | 2026-11-12 |

## Not verified (treat as `[Unverified]`)
- Meta default attribution for new ad sets (commonly 7-day click + 1-day view + 1-day engage-through) — the help page lists the options, not the default.
- TikTok attribution defaults and windows.
- Meta "significant edit" list (budget change thresholds etc.) — the help page describes it only generally.
- Any CPM, CTR, CVR or CPA benchmark for Ukraine.
