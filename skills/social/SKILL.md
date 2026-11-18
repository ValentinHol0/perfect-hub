---
name: social
description: "Social media marketing that people engage with: strategy and platform choice, dated content calendars, posts and carousels, Reels, TikTok and Shorts scripts, community replies and crisis handling, analytics and reports, written in natural Ukrainian or the user's language. Use when the user asks for SMM, a content plan, posts or captions, a Telegram channel, video ideas, replies to comments or reviews, or social media reporting, or invokes /social."
---

# /social — Perfect Social

Social work is judged by what the audience does next (saves, shares, replies, clicks, buys) — not by volume. Deliverables are files in `deliverables/social/<brand-slug>/` unless the user names a place: strategy `.md`, calendar `.csv` + `.ics`, posts `.md`, scripts `.md`, reports `.md`.

## 1. Intake
Ask only what is missing and blocks the work — at most 4 questions in one message:
1. **Brand and offer:** what is sold, to whom, price level, where it is bought (site, Instagram Direct, Rozetka/Prom, offline).
2. **Goal for the next 1–3 months:** sales/leads, awareness, community, hiring, launch — one primary goal with a number if the user has one.
3. **Platforms and assets:** current accounts (links, follower counts), who can film or design, approval process, budget for ads (paid is handed to `/ads`).
4. **Voice:** 2–3 example posts the user likes (own or others'), words never to use, address form (ви/ти).

Rulings when not asking (state them in one line):
- Language: Ukrainian for a Ukrainian audience; copy follows `${CLAUDE_PLUGIN_ROOT}/skills/social/references/posts/ukrainian-copy.md`.
- Platforms: chosen by audience and goal (`references/strategy.md`), not "everywhere"; Telegram considered for every Ukrainian audience.
- Cadence the team can sustain for 3 months beats an ambitious plan abandoned in week 2.
- Never invent statistics, reviews, testimonials, follower numbers or "best time to post" figures — use the account's own analytics or mark `[Unverified]`.

## 2. Routing
| Request | Skill |
|---|---|
| Positioning on social, pillars, audience, which platforms, cadence | `references/strategy.md` |
| Content plan / calendar for dates, holidays, launches | `references/calendar.md` |
| Posts, captions, carousels, Telegram posts, threads, LinkedIn posts | `references/posts.md` |
| Reels, TikTok, YouTube Shorts scripts, stories sequences | `references/video-scripts.md` |
| Replies to comments and DMs, negative reviews, moderation rules, crisis | `references/community.md` |
| What to measure, reports, post-mortems, ER/ERR, monthly report | `references/analytics.md` |
| Independent check of a batch of posts or scripts | agent `social-editor` |
A full SMM setup runs: strategy → calendar → posts/scripts → editor pass → analytics plan. Read the matching reference file (`references/<topic>.md` next to this skill) before doing that part of the work.

## 3. Scripts
| Script | Does |
|---|---|
| `scripts/calendar.mjs` | Dated calendar (CSV + ICS) from pillars, per-platform cadence and a date range; Ukrainian public holidays from `scripts/data/ua-holidays.json` (Labour Code Art. 73, source and check date inside); flags promo posts on memorial days |
| `scripts/metrics.mjs` | Engagement rates, ERR and per-pillar/platform/format/month summaries from a CSV export of posts (comma or semicolon CSV) |
Images are not generated here: visuals go to `/brand`, which ships `gen-image.mjs`.

## 4. Quality gates (every delivery)
- [ ] Each post/script has one job (save, share, comment, click, buy) and one CTA matching it.
- [ ] Hook in the first line / first 1–2 seconds; no throat-clearing openers ("Друзі, сьогодні хочемо розповісти…").
- [ ] Ukrainian copy natural: no Russianisms or English calques, «лапки», apostrophe ’, non-breaking spaces in "1 299 грн"; the brand's address form used consistently.
- [ ] Platform limits respected (`references/strategy.md/references/platforms.md`); hashtags per policy; alt text for every image.
- [ ] Facts, prices, dates, promo terms checked against the brief; no fabricated reviews, results or numbers.
- [ ] Paid collaborations marked as advertising with the word «реклама» (Law of Ukraine "Про рекламу" No. 270/96-ВР, Art. 9 as amended in 2023 — verify current wording on zakon.rada.gov.ua and with a lawyer) plus the platform's paid-partnership label.
- [ ] Memorial days and national tragedies: no promo, no humour (`references/calendar.md` flags them).
- [ ] Batches of 5+ posts or scripts get an independent pass from `social-editor` before delivery.

## 5. Output format
```
Deliverable: <strategy | calendar | N posts | N scripts | reply set | report>
Files: <paths>
Platforms: … · Period: … · Pillars: …
Checks: hooks ✓ · UA copy ✓ · limits ✓ · alt text ✓ · facts ✓ · editor: <verdict or "not run — reason">
Next: <one line, only if something is pending>
```
Reply in the user's language. No emojis in the reply itself; emojis inside post copy only when the brand voice uses them.

## 6. Handoffs
- **Visuals** (post/story/carousel designs, covers, ad creatives, product photos): `/brand` (`/brand` → `/brand → references/social-templates.md`, `/brand → references/ad-creatives.md`) with the format, sizes, copy per slide, brand tokens and references.
- **Paid promotion** (boosting, campaigns, audiences, budgets): `/ads`.
- **Landing pages, link-in-bio sites, Telegram bots, website widgets, analytics implementation:** the core — write `.planning/handoff-social.md` (goal, audience, content, constraints, assets, acceptance criteria) and run `/absolute`.
- **Email, landing copy, UTM/tracking plan:** `/marketing`. **Second language versions:** `/translate`. **Report as PPTX/PDF:** `/office`. **Giveaway rules, influencer contracts, user-content rights:** a lawyer (a lawyer) — verify with a lawyer.
