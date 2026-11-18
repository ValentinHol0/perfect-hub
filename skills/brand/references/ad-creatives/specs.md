# Ad specs — Meta and TikTok (verified)

Checked 2026-11-12 on the official pages below. Character counts in Meta's guide are recommendations for display (text gets truncated), not hard upload limits. Re-check before production if this file is older than 3 months.

## Meta Ads Guide
| Placement | Ratio | Recommended resolution | File | Max size | Duration | Text (recommended) | Safe zone | Source |
|---|---|---|---|---|---|---|---|---|
| Instagram Feed — image | 4:5 (range 1.91:1 to 4:5; 1 % tolerance) | 1440×1800 | JPG, PNG | 30 MB | — | primary 125 · headline 40 · max 30 hashtags | not stated | https://www.facebook.com/business/ads-guide/update/image/instagram-feed |
| Facebook Feed — image | 4:5 (3 % tolerance) | 1440×1800 (min width 600, min height 750) | JPG, PNG | 30 MB | — | primary 50–150 · headline 27 | not stated | https://www.facebook.com/business/ads-guide/update/image/facebook-feed |
| Facebook Feed — video | 4:5 | 1440×1800 (min 120×120) | MP4, MOV, GIF | 4 GB | 1 s – 241 min | primary 50–150 · headline 27 · captions and sound "optional, but recommended" | not stated | https://www.facebook.com/business/ads-guide/update/video/facebook-feed |
| Instagram Stories — image | 9:16 (1 % tolerance) | 1440×2560 (min width 500) | JPG, PNG | 30 MB | — | primary 125 | ~14 % top, ~35 % bottom, ~6 % each side free of text, logos, key elements | https://www.facebook.com/business/ads-guide/update/image/instagram-story |
| Instagram Reels — video | 9:16 | 1440×2560 (min width 250 for < 30 s, 500 for ≥ 30 s) | MP4, MOV | 4 GB | 0 s – 15 min | primary 44 | ~14 % top, ~35 % bottom, ~6 % each side | https://www.facebook.com/business/ads-guide/update/video/instagram-reels |
| Facebook Stories / Reels | 9:16 | `[Unverified]` — the Facebook Reels guide URL returned 404 on the check date | | | | | assume the Instagram Reels safe zone until checked | facebook.com/business/ads-guide |

Video encoding listed for Facebook Feed video: H.264, square pixels, fixed frame rate, progressive scan, stereo AAC audio ≥ 128 kbps.

Safe zone in pixels (from Meta's percentages):
| Canvas | Top 14 % | Bottom 35 % | Sides 6 % | Free text area |
|---|---|---|---|---|
| 1440×2560 | 358 px | 896 px | 86 px | 1268×1306 from (86, 358) |
| 1080×1920 | 269 px | 672 px | 65 px | 950×979 from (65, 269) |

**Text on images:** Meta removed the enforced "20 % text" rule in 2020; its business help centre is reported to still say images with less than 20 % text perform better. `[Unverified on Meta's own page this session]` — source: secondary reports (e.g. https://www.searchenginejournal.com/facebook-removes-the-20-text-limit-on-ad-images/). Treat as guidance: less text, larger.

## TikTok — Auction In-Feed Ads
Source: https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads?lang=en (checked 2026-11-12).
| Item | Non-Spark Ads | Spark Ads |
|---|---|---|
| Ratio and minimum | 9:16 ≥ 540×960 (recommended) · 16:9 ≥ 960×540 · 1:1 ≥ 640×640 | from the organic post |
| File types | .mp4, .mov, .mpeg, .3gp, .avi | .mp4, .mov |
| File size | ≤ 500 MB | — |
| Duration | up to 10 minutes | no restriction |
| Bitrate | ≥ 516 kbps | — |
| Ad caption | white uniform font, no clickable links, no "@", no hashtags; no character count stated on the page | the organic caption; up to 4 lines displayed |
| Display name | one line, ≤ 20 characters (≤ 10 for Chinese/Japanese/Korean) | the account's |
| Profile image | 98×98, 1:1, .jpg/.jpeg/.png, < 50 KB, key element in the central 66×66 | the account's |
| Safe zone | no fixed numbers: depends on dimension, caption length and extra formats — download the official safe-zone files (LTR / RTL, anchor versions) from the page | same |

Creative best practices — https://ads.tiktok.com/help/article/creative-best-practices?lang=en (checked 2026-11-12):
- Introduce the content proposition in the first 3 seconds; prioritise the hook in the first 6 seconds.
- Shoot at least 720p; use sound/music; use captions or text overlays for context; show 5–10 words per second of on-screen text.
- Keep content inside the UI safe zone per the ad specifications.
- 3–5 different creatives per ad group.

Working assumption until the official template is loaded `[Unverified]`: keep text inside the Meta 9:16 safe box above and also clear the right edge where TikTok's action buttons sit.

## What is NOT verified here
Exact Facebook Reels/Stories ad pages; TikTok caption character limit for Non-Spark ads; current category restrictions (health, finance, alcohol, gambling, weight loss) — check the platforms' policy pages before producing for these categories.
