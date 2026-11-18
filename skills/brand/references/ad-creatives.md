# Brand Ad Creatives

A creative's job: stop the scroll, make one promise, show proof, ask for one action — inside the platform's safe zone. References:
- `${CLAUDE_PLUGIN_ROOT}/skills/brand/references/ad-creatives/specs.md` — Meta and TikTok formats, safe zones, text limits, with source URLs and the check date.
- `${CLAUDE_PLUGIN_ROOT}/skills/brand/references/ad-creatives/hooks-and-testing.md` — hook patterns, overlay copy rules, variation matrix, naming, test reading.

Campaign structure, budgets, audiences and reading results belong to `/ads` — hand off, otherwise write a brief (entry skill §7).

## 1. Brief (fill before designing)
```
Product + offer:        what, price in UAH, the deal (if any) and its end date
Audience + awareness:   cold / warm / retargeting; what they already believe
One promise:            the single benefit this creative sells
Proof:                  real numbers, reviews (real, with permission), demo, guarantee, delivery terms (Nova Poshta, COD)
CTA:                    one action, matching the platform button (Купити, Дізнатися більше, Написати)
Placements:             Meta feed / Stories / Reels; TikTok In-Feed — or "all" (then 4:5 + 9:16)
Assets available:       real product photos, video, UGC, logo, fonts
Compliance notes:       category restrictions, required disclaimers
```
Never invent reviews, ratings, numbers of customers, "№1" claims or discounts. No proof → design around the demo or the offer instead.

## 2. Formats (minimum set)
| Placement | Ratio | Design canvas | Safe zone |
|---|---|---|---|
| Meta Facebook/Instagram feed | 4:5 | 1440×1800 (1080×1350 acceptable for organic reuse) | keep text off the outer ~5 % (UI overlays vary) |
| Meta Stories / Reels | 9:16 | 1440×2560 (or 1080×1920) | leave ~14 % top, ~35 % bottom, ~6 % each side free of text and logos (Meta Ads Guide) |
| TikTok In-Feed | 9:16 | 1080×1920 (minimum accepted 540×960) | load TikTok's official safe-zone template from the specs page; it depends on caption length and add-ons |
| Square fallback | 1:1 | 1440×1440 | as feed |
Exact limits, file types and character counts: `specs.md`. Re-verify on the official page if `specs.md` is older than 3 months.

## 3. Composition rules
1. **First frame = the hook.** It must work as a still and be understood in a glance: product or result visible, one large line of text, high contrast. No logo intro, no fade from black, no slow pan before the point.
2. **One message per creative.** Headline overlay ≤ 7 words (Ukrainian runs longer — rewrite rather than shrink); body text belongs in the primary text field, not on the image.
3. **Hierarchy:** hook line (largest) → product/proof → offer/price → CTA cue. Price as "1 299 грн" with a non-breaking space; old price struck through only if it was a real recent price.
4. **Text area:** keep overlay text small in share of the image — Meta stopped enforcing the old 20 % text rule but still advises less text (`specs.md`); text inside the safe zone only.
5. **Readability:** ≥ 4.5:1 contrast for overlay text (`contrast.mjs`), or a solid/scrim panel behind it; house minimums for 9:16: hook line cap height ≥ 4 % of canvas height (≈ 77 px on 1920), any other text ≥ 2.5 % (≈ 48 px) — then check on a phone-size preview.
6. **Brand:** logo small and in a safe corner, or the product itself carries the brand; brand colour in the frame; native look beats polished for TikTok (UGC-style, real people with consent, real environment).
7. **Sound-off:** Meta video gets burned-in captions; TikTok assumes sound on — still caption key lines (TikTok recommends captions/text overlays).
8. **Localisation:** Ukrainian copy written natively, not translated; advertising aimed at Ukrainian consumers is in Ukrainian by default (Law No. 2704-VIII, Art. 32 on advertising — verify current text and exceptions at `zakon.rada.gov.ua/laws/show/2704-19` with a lawyer).

## 4. Production pipeline
1. **Background/scene:** real product photo (preferred) → or a generated scene without text (`references/product-photo.md` prompt structure, aspect matching the placement).
2. **Layout in HTML:** one file, one `data-frame` per creative with `data-size` (e.g. `data-size="1440x1800"`), brand tokens as CSS variables, Cyrillic fonts loaded, a toggleable safe-zone overlay (`hooks-and-testing.md` §5) switched off before render.
3. **Render:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/render-templates.mjs" creatives.html --out deliverables/brand/<slug>/ads/<campaign>`; the script fails if any frame drifts from its declared size.
4. **Video:** deliver a shot list / storyboard (frame 1 hook, beats, end card) and the static frames (hook card, end card with CTA) as PNG; editing is done in the user's video tool. Scripts for Reels/TikTok → `/social` (`/social → references/video-scripts.md`).
5. **Review:** each PNG at 100 % and at phone size; safe zone; contrast; spelling (Ukrainian); price and offer correct; artefacts in generated parts; honesty rule. Then `brand-art-director` on the set.

## 5. Variation matrix
Build tests from the matrix in `hooks-and-testing.md` §3: **angle × hook × visual × format**, changing one variable per comparison. Typical first test: 3 angles × 2 hooks = 6 creatives in 4:5 + 9:16 (12 files). TikTok's own guidance suggests 3–5 creatives per ad group (`specs.md`). Name every file by the convention so results can be read back.

## 6. Policy and honesty
- Generated images are never presented as real photos of the client's product or real customers; before/after, testimonials and "real results" visuals must be real and documented.
- Platform rules: Meta Advertising Standards (`transparency.meta.com/policies/ad-standards`) and TikTok advertising policies (TikTok Ads help centre) — check the category (health, finance, alcohol, dating, weight loss are restricted) before producing. `[Unverified]` for specific category rules — check the live policy pages.
- AI disclosure: apply the platform's AI-content labels where its rules require them for realistic generated people or scenes `[Unverified — check current Meta and TikTok rules]`.
- Superlatives and comparisons ("найкращий", "№1", "дешевше ніж у X") need documented proof — verify with a lawyer.

## 7. Output
```
Set: <campaign> · N creatives · placements: …
Files: deliverables/brand/<slug>/ads/<campaign>/*.png (+ creatives.html source)
Matrix: deliverables/brand/<slug>/ads/<campaign>/matrix.csv
Specs: per specs.md (checked <date>) · safe zones ✓ · contrast ✓ · copy proofread ✓
Critique: brand-art-director verdict
Handoff: ads component for launch and reading (or brief path)
```
