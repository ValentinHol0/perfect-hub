# Social Posts

A post does one job for one reader. References:
- `${CLAUDE_PLUGIN_ROOT}/skills/social/references/posts/hooks.md` — hook formulas with Ukrainian examples, CTA bank, carousel structures.
- `${CLAUDE_PLUGIN_ROOT}/skills/social/references/posts/ukrainian-copy.md` — Russianisms, calques and typography rules (mandatory check for Ukrainian copy).
- `${CLAUDE_PLUGIN_ROOT}/skills/social/references/strategy/platforms.md` — limits per platform.

## 1. Before writing (per post)
`Platform · format · pillar · job (save | share | comment | DM | click | buy) · reader (segment + situation) · one message · proof available · CTA`
No proof for a claim → change the claim. Never invent reviews, numbers, "clients say", results or scarcity.

## 2. Structure
1. **Hook (first line, ≤ ~125 characters — Meta's ads guide recommends 125 characters of visible feed text; organic captions also truncate after the first lines):** a specific promise, problem, number, contrast or question from `hooks.md`. The hook must be true and delivered by the body.
2. **Body:** one idea; short paragraphs (1–3 lines); concrete details (names, numbers, steps, prices in UAH, delivery terms); lists for steps; a mini-story beats adjectives.
3. **CTA:** one, matching the job — save («Збережіть, щоб не шукати»), share («Надішліть тому, хто…»), comment (a question that is easy to answer), DM («Напишіть "розмір" у Direct»), click/buy (where exactly, what happens next).
4. **Hashtags (policy below) and alt text.**

## 3. Platform rules
| Platform | Shape |
|---|---|
| Instagram caption | hook line → body 300–1,200 characters (longer only for saveable guides) → CTA → hashtags; first line works without the image |
| Instagram carousel | 5–10 slides: cover hook (≤ 8 words) → one point per slide (≤ 25 words) → summary → CTA slide; caption adds context, not a repeat |
| Telegram channel | bold first line as headline; 500–1,500 characters for text posts; one link with a clear label; formatting: bold for key phrases, lists, no wall of text; media caption ≤ 1,024 characters (else post the text separately) |
| Threads | ≤ 500 characters; one thought; a question or take that invites replies; one topic tag |
| LinkedIn | hook in the first 2 lines; personal experience + lesson; short paragraphs; ≤ 3,000 characters; links in the first comment if the brand prefers `[Unverified — reach effect]` |
| Facebook | conversational; questions and local context; photo or album; links acceptable |
| TikTok / Reels captions | 1–2 lines that add context or a question; keywords people search for; the video carries the hook |

## 4. Hashtag policy
- Instagram: 3–5 specific tags (niche + topic + brand/local), no generic mass tags (#love, #instagood); Instagram has announced a limit of 5 per caption `[Unverified — check the current limit]`.
- TikTok: 2–4 tags tied to the topic and search terms; trend tags only when the video is in that trend.
- Threads: one topic tag. LinkedIn: 0–3. Telegram: tags only as internal navigation (#рецепти, #відгуки) used consistently. Facebook: 0–2.
- Ukrainian-language tags for Ukrainian audiences (#кава_вдома), Latin tags when the audience searches in English.

## 5. Alt text (every image)
What the image shows + text on the image, ≤ 250 characters, in the post's language: «Пляшка соняшникової олії на льняній скатертині поруч із насінням; напис: "Холодний віджим, 0,5 л"». Not "image of"; no hashtags; describe what matters for the post's job.

## 6. Ukrainian copy (gate)
Run every Ukrainian text through `ukrainian-copy.md`: no Russianisms or calques; vocative in greetings (Олено, пане Андрію); «лапки», apostrophe ’, non-breaking spaces ("389 грн", "5 км", "у 2026 році"); the brand's address form (ви/Ви/ти) used consistently; no translated-English openers ("Насолоджуйтесь!", "Це про…").

## 7. Visuals
Every post gets a visual brief: format and size, what is shown, text on image (≤ 8 words), reference. Pass the brief to `/brand` (`/brand → references/social-templates.md` for posts/carousels, `/brand → references/product-photo.md` for product images); otherwise write `.planning/handoff-social-to-brand.md`. Generated images are never presented as real photos of the product or customers.

## 8. Batch format (`deliverables/social/<slug>/posts-<period>.md`)
```markdown
## 2026-12-03 · Instagram · carousel · Користь
Job: save · Reader: новачок, що купив першу турку
Hook: «3 помилки, через які кава в турці гірчить»
Slides: 1) … 2) … 3) … 4) Підсумок 5) CTA
Caption: …
CTA: Збережіть, щоб спробувати завтра вранці
Hashtags: #кава_вдома #турка #кавовірецепти
Alt text: …
Visual brief: 1080×1350, …
```
Batches of 5+ posts → dispatch the `social-editor` agent before delivery.
