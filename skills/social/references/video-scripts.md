# Social Video Scripts

Short video is decided in the first seconds and finished by the payoff. Reference: `${CLAUDE_PLUGIN_ROOT}/skills/social/references/video-scripts/script-templates.md` — formats with beat timings, script table, SRT subtitle format, stories sequences, filming checklist.

## 1. Brief per video
`Platform(s) · length target · format (from the templates) · job (reach | save | comment | follow | click | buy) · one message · proof/demo available · who appears (consent) · location and props · sound (voice, licensed track, trend audio)`
Lengths: plan 15–45 s for most hooks-and-payoff videos; longer only when every beat earns its place. Platform limits: YouTube Shorts up to 3 minutes (square or vertical); Instagram Reels over 3 minutes are reported not to be recommended to new audiences `[Unverified]`; TikTok in-app limits vary by account `[Unverified]` — see `${CLAUDE_PLUGIN_ROOT}/skills/social/references/strategy/platforms.md`.

## 2. The hook (0–2 s)
- Frame 1 already shows the subject: the product in action, the problem, the result, a face mid-sentence. No logo intro, no "Привіт, мене звати…", no slow pan.
- Three layers at once: **visual** (movement or contrast), **on-screen text** (≤ 7 words, inside the safe zone), **spoken line** (the same promise, said in the first breath).
- Hook types: result first · mistake callout · contrast/myth · question with stakes · POV · "watch till the end" only when the end really pays off.
- TikTok's own ads guidance: introduce the proposition in the first 3 seconds and prioritise the hook in the first 6 seconds (https://ads.tiktok.com/help/article/creative-best-practices) — for organic content aim tighter, 1–2 seconds.

## 3. Beat structure
`Hook (0–2 s) → Context/stakes (2–5 s) → Value beats (one point per 3–6 s, visual change each beat) → Payoff (the promised result) → CTA (1–2 s, one action) → optional loop (last frame flows into the first).`
- Change the picture every 2–4 seconds (cut, angle, zoom, new object) — but every cut carries information.
- Payoff before CTA; the CTA matches the job ("Збережіть рецепт", "Напишіть "хочу" — надішлемо інструкцію", "Посилання в профілі").

## 4. On-screen text, captions, subtitles
- On-screen text: ≤ 7 words per card, large, high contrast, inside the safe zone (Meta 9:16 guidance: keep ~14 % top, ~35 % bottom, ~6 % sides clear); TikTok recommends 5–10 words per second when text is used — keep each card on screen long enough to read twice.
- Captions/subtitles: burn in for silent viewing or turn on the platform's auto-captions and correct them (auto-captions misspell Ukrainian names and terms). Deliver an `.srt` when the editor needs it (format in the reference).
- Text in Ukrainian follows `${CLAUDE_PLUGIN_ROOT}/skills/social/references/posts/ukrainian-copy.md`.

## 5. Audio
- Voice-over: write for speech — short sentences, numbers spoken as words where it helps, no tongue-twisters; read it aloud and time it (≈ 2–3 words per second is a comfortable Ukrainian pace — time your own read).
- Music: business accounts use only tracks licensed for commercial use (TikTok Commercial Music Library, Meta Sound Collection) `[Unverified — check the platform's current rules for the account type]`; trend sounds from personal libraries can be blocked or muted for brands.
- Mix: voice clearly above music; captions still carry the message with sound off.

## 6. Script format (`deliverables/social/<slug>/scripts-<period>.md`)
```markdown
## Reel 03 · «3 помилки з туркою» · 30 с · job: save
Hook: «Ваша кава гірчить через ці 3 речі»
| Час | Кадр (що в кадрі) | Текст на екрані | Голос | Звук |
|---|---|---|---|---|
| 0–2 с | крупно: кава збігає з турки | «Чому кава гірчить?» | «Ваша кава гірчить через ці три речі» | тихий трек |
| 2–8 с | … | «1. Окріп» | … | |
| … | | | | |
| 27–30 с | готова чашка, рука ставить на стіл | «Збережіть» | «Збережіть, щоб спробувати завтра» | |
Caption: … · Hashtags: … · Cover text: «3 помилки з туркою» · Alt/description: …
Shot list: 1) … 2) … · Props: … · Location: … · People: (consent ✓)
```

## 7. Checks
- [ ] First frame works as a still and states the promise; spoken and written hook match.
- [ ] Every beat has a visual change and carries one point; payoff delivered.
- [ ] One CTA; on-screen text inside safe zones; subtitles proofread.
- [ ] Claims and demos are real; people on camera consented; music licensed for business use.
- [ ] Cover text readable in the profile grid (central area).
- [ ] Batches of 5+ scripts → `social-editor` agent before delivery.
Visual assets (covers, end cards, overlays) → `/brand` (`/brand → references/social-templates.md`).
