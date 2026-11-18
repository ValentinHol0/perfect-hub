# Hooks, overlay copy and creative testing

## 1. First-frame hooks (static and video frame 1)
| Pattern | Frame 1 shows | Overlay example (UA) |
|---|---|---|
| Result first | the outcome, not the process | «Сухо за 7 хвилин» (only if it is true and tested) |
| Problem in their words | the moment of pain, recognisable | «Знову зарядка сіла о 15:00?» |
| Demo in motion | product doing the job, close-up | «Ріже помідор без зусиль» |
| Price/offer shock | product + price large | «Повний комплект — 1 299 грн» |
| Comparison | ours vs the usual way, side by side | «Звичайна vs наша: 3 дні проти 3 тижнів» (with proof) |
| Unboxing / Nova Poshta moment | parcel opened, product revealed | «Що приходить у коробці» |
| Social proof (real) | real review screenshot, with permission | «4,9 з 1 200 відгуків на Rozetka» (only if exact and current) |
| Myth vs fact | a common belief crossed out | «Ні, шкіряне взуття не треба мити шампунем» |
| Pattern break | unexpected object, colour, angle | short line or none |
| Direct callout | the audience named | «Для тих, хто їздить на роботу велосипедом» |
Rules: the hook and the product appear together in the first seconds (TikTok: proposition in the first 3 s, hook prioritised within 6 s); no logo intro; one line; numbers and claims must be true and current.

## 2. Overlay copy rules
- ≤ 7 words for the hook line; ≤ 3 text blocks per frame (hook · proof/offer · CTA cue).
- Verbs and specifics over adjectives ("Доставка завтра" > "Швидка доставка").
- Ukrainian: natural phrasing, not translated English; numbers as "1 299 грн", "−20 %"; no Russian-language tags or calques.
- CTA cue matches the button: «Замовити», «Купити», «Дізнатися більше», «Написати нам».
- Every price, discount and deadline double-checked against the brief.

## 3. Variation matrix
Variables (change one at a time per comparison):
| Variable | Options to try |
|---|---|
| Angle (why buy) | price/value · time saved · quality/material · status/look · problem solved · gift |
| Hook (frame 1) | patterns from §1 |
| Visual | studio packshot · in-use lifestyle · UGC-style selfie video · demo close-up · graphic/text-led |
| Format | 4:5 static · 9:16 static · 9:16 video · carousel (Meta) |
| Offer/CTA | none · free delivery condition · bundle · deadline |

`matrix.csv` template:
```
id,angle,hook,visual,format,offer,overlay_text,primary_text,cta,file,status
A1-H1-V1-45,time-saved,result-first,demo,4x5,none,"Сухо за 7 хвилин","…",Купити,a1-h1-v1-4x5.png,draft
```
First round: 3 angles × 2 hooks, same visual style and offer, in 4:5 + 9:16 = 12 files. Next rounds: keep the winning angle, vary hooks; then visuals; then offers.

## 4. Naming convention
`<yyyymmdd>_<brand>_<angle>_<hook>_<visual>_<ratio>_v<n>` — lowercase, hyphens inside parts, underscores between parts, e.g. `20261112_terra_time-saved_result-first_demo_4x5_v1.png`. The same id goes into the ad name in Ads Manager so results map back to files.

## 5. Safe-zone overlay (HTML, toggle off before render)
```html
<style>
  .frame { position: relative; overflow: hidden; }
  .safe-9x16::after { content: ""; position: absolute; pointer-events: none;
    inset: 14% 6% 35% 6%; outline: 3px dashed rgb(255 0 0 / .8); }
  body.render .safe-9x16::after { display: none; }
</style>
<section class="frame safe-9x16" data-frame="a1-h1-9x16" data-size="1080x1920" style="width:1080px;height:1920px">…</section>
```
Add `class="render"` to `<body>` for the final render. TikTok: overlay the official safe-zone PNG from TikTok's ads help page instead of this box.

## 6. Reading a test (hand to ads component for the full analysis)
Per creative: thumb-stop (3-second view rate for video), hook hold, CTR (link), CPC, conversion rate, CPA/ROAS. Decide only after enough spend and conversions to compare — the ads component owns thresholds. A creative "wins" on cost per result, not on likes.
