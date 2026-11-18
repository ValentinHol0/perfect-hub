# Platforms — roles, formats, limits

Checked 2026-11-12. "Verified" = read on the official page that day; `[Unverified]` = secondary sources or pages that render client-side — check the platform's help centre before relying on it.

## 1. Role of each platform
| Platform | Typical role | Strong formats | Watch-outs |
|---|---|---|---|
| Instagram | discovery (Reels) + conversion (profile, Direct, Stories links) + retention (Stories, Close Friends) | Reels, carousels, Stories with stickers | hashtag limit reduced (below); Reels over 3 minutes are reported not to be recommended to non-followers |
| TikTok | discovery, youth and mass reach, product demos | native vertical video, trends adapted to the brand, series | business accounts: licensed commercial music only `[Unverified — check TikTok's Commercial Music Library rules]` |
| YouTube Shorts | discovery with long shelf life; feeds the YouTube channel | vertical/square video up to 3 minutes | landscape videos are not Shorts |
| Facebook | older audiences, local communities and groups, events | posts with photos, Reels, group discussions | reach of Page posts often low without groups or ads `[Unverified]` |
| Telegram channel | owned broadcast; news, expertise, founder voice; strong in Ukraine | text posts with one image, albums, polls, voice/video circles, comments via a linked chat | no algorithmic discovery: growth via cross-promo, other channels, ads, links |
| Threads | conversation, opinions, quick takes; text-first | short posts, threads, replies | one topic tag per post |
| LinkedIn | B2B, hiring, founder/expert voice | text posts, document carousels (PDF), short video | personal profiles usually outperform company pages `[Unverified]` |

## 2. Ukrainian media context
- Internews Ukraine / InMind survey "Ukrainian media: news consumption and trust in 2025" (fieldwork May–August 2025, 1,649 respondents): Telegram is the leading social platform for news (reported 72 % use it for news; 81 % for communication); TikTok use grew from 27 % (2024) to 30 % (2025); 86 % consumed news via social platforms. Source page: https://internews.ua/en/media-research/ukrainian-media-news-consumption-and-trust-in-2025 — figures taken from the survey summary as indexed on 2026-11-12 (the page refused automated fetching) `[verify exact figures on the page before quoting]`.
- Practical meaning: Telegram channels are where many Ukrainians read news and expert content — a brand channel competes with news; it wins with usefulness, regularity and a human voice, not with ads.

## 3. Limits and specs
| Item | Limit | Status / source |
|---|---|---|
| Telegram message text | 1–4096 characters | verified — Bot API `sendMessage` (https://core.telegram.org/bots/api) |
| Telegram media caption | 0–1024 characters | verified — Bot API `sendPhoto` |
| Telegram album | 2–10 items | `[Unverified]` (Bot API `sendMediaGroup`, not read this session) |
| Threads post | 500 characters (emoji count by UTF-8 bytes in the API); 1 topic tag; ≤ 5 links; carousel 2–20 items | verified — Threads API docs (https://developers.facebook.com/docs/threads/posts) |
| LinkedIn post | up to 3,000 characters; articles longer | verified — https://www.linkedin.com/help/linkedin/answer/a528176 |
| YouTube Shorts | square or vertical, up to 3 minutes (uploads from 15 Oct 2024); most songs usable up to 90 s in a Short | verified — https://support.google.com/youtube/answer/15424877 |
| Instagram hashtags | up to 5 per post/Reel caption (announced 2025-12-18, gradual rollout) | `[Unverified]` — news coverage of Instagram's announcement |
| Instagram carousel | up to 20 photos/videos in the app; the API and many schedulers cap at 10 | `[Unverified]` — secondary sources |
| Instagram Reels length | recording/editing up to 20 minutes; over 3 minutes reportedly not recommended to new audiences | `[Unverified]` — help-centre text seen via search; page renders client-side |
| Instagram caption length | widely cited as 2,200 characters | `[Unverified]` |
| TikTok caption | 2,200 UTF-16 characters via the Content Posting API | verified for the API (https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post); in-app limit `[Unverified]` |
| TikTok video length | all creators 3 minutes; some accounts 5 or 10 minutes; uploads via API up to 10 minutes | `[Unverified]` — help-centre text seen via search |
| Meta Stories/Reels text safe zone | ~14 % top, ~35 % bottom, ~6 % sides free of text (ads guide; sensible organic default) | verified — https://www.facebook.com/business/ads-guide/update/video/instagram-reels |

## 4. Format mix starting points
| Platform | Mix (by posts) |
|---|---|
| Instagram | Reels 40–50 % · carousels 30–40 % · single images 10–20 % · Stories daily |
| TikTok / Shorts | 100 % vertical video; 2–3 recurring series |
| Telegram | text posts 50–60 % · image/album 20–30 % · polls/questions 10 % · video circles/voice 0–10 % |
| Facebook | photo posts 40 % · Reels 30 % · links/events 30 % |
| LinkedIn | text 50 % · document carousels 30 % · video/images 20 % |
Starting points for planning — not research figures. Re-balance after 4–6 weeks from the account's own analytics.
