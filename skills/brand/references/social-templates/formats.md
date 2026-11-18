# Organic social formats

Checked 2026-11-12. "Verified" = read on the official page that day. `[Unverified]` = secondary sources or common practice — check the platform's help centre before relying on it. Ad placements: `references/ad-creatives.md/references/specs.md`.

| Platform / surface | Design size | Notes | Status |
|---|---|---|---|
| Instagram feed post | 1080×1350 (4:5) | Meta's ads guide recommends 4:5 at 1440×1800 for feed; 1080×1350 is the common organic master | 4:5 verified for ads (https://www.facebook.com/business/ads-guide/update/image/instagram-feed); organic `[Unverified]` |
| Instagram carousel | 1080×1350 per slide, same ratio for all slides | up to 20 photos/videos in the app (raised from 10 in 2024); the publishing API and many schedulers still cap at 10 | `[Unverified]` — secondary sources; the cached help-centre page still said 10 |
| Instagram profile grid | — | reported to show 3:4 thumbnails, cropping 4:5 posts top and bottom; keep key content in the centre | `[Unverified]` |
| Instagram hashtags | — | Instagram announced on 2025-12-18 a gradual limit of 5 hashtags per post/Reel caption | `[Unverified]` — multiple news reports, not read on Instagram's own page |
| Stories / Reels (Instagram, Facebook) | 1080×1920 (9:16) | keep text inside ~14 % top, ~35 % bottom, ~6 % sides (Meta ads guide; good organic default) | safe zone verified for ads (https://www.facebook.com/business/ads-guide/update/video/instagram-reels) |
| TikTok video / cover | 1080×1920 (9:16) | caption, buttons and progress bar cover the edges; TikTok publishes downloadable safe-zone files for ads | ads safe-zone files verified (https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads?lang=en); organic `[Unverified]` |
| YouTube Shorts | 1080×1920 (9:16) or square | a square or vertical video up to 3 minutes counts as a Short (uploads from 15 Oct 2024) | verified (https://support.google.com/youtube/answer/15424877) |
| Threads | images any common ratio; carousels 2–20 items | text posts up to 500 characters; one topic tag per post; ≤ 5 links | verified via the Threads API docs (https://developers.facebook.com/docs/threads/posts) |
| Telegram channel post | 1280×720 (16:9) or 1080×1350 (4:5) | caption up to 1024 characters with media (text messages up to 4096) per the Bot API | limits verified (https://core.telegram.org/bots/api); sizes `[Unverified]` |
| Facebook feed post | 1080×1350 (4:5) | Meta ads guide recommends 4:5 for Facebook Feed | verified for ads (https://www.facebook.com/business/ads-guide/update/image/facebook-feed) |
| LinkedIn post image | 1080×1350 or 1200×1200 | posts up to 3,000 characters | character limit verified (https://www.linkedin.com/help/linkedin/answer/a528176); image sizes `[Unverified]` |

Practical rules:
- One master ratio per campaign where possible (4:5 for feeds, 9:16 for vertical) to cut production.
- Covers and thumbnails: keep the title in the central 1080×1080 area of a 9:16 frame — grids crop.
- Never place the logo or text in the bottom 35 % of a 9:16 frame: captions and buttons sit there.
