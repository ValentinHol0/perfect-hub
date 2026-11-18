# Brand Identity

An identity is an argument for why the brand exists, made visible. Deliver the system (logo + colour + type + device + imagery + voice), not a picture. References:
- `${CLAUDE_PLUGIN_ROOT}/skills/brand/references/identity/brief-and-research.md` — brief template, research routes and URL patterns, competitor audit, name checks.
- `${CLAUDE_PLUGIN_ROOT}/skills/brand/references/identity/concept-methods.md` — five concept methods, category → symbol logic, visual modes, anti-generic rules.

## 1. Brief (gate: no concepts before it is filled)
Fill the template in `brief-and-research.md` §1. Minimum to proceed: name, one-sentence offer, audience, 3 personality words, 3 anti-words, 3 competitors, required applications. Missing items → ask once (max 4 questions); otherwise rule them yourself and mark them `assumed`.

Write the **strategy line** before any drawing:
`<Brand> is the <category> for <audience> who <need>. It feels <word, word, word>, never <anti-word>. Core metaphor: <metaphor> because <reason>.`

## 2. Research (gate: references with URLs, not memory)
1. **Category map:** 5–8 competitor logos and identities — `fontinlogo.com/logo/<brand>` for their typefaces and colours, `logosystem.co/?q=<brand>` or `/logos/<style>` for type/style vocabulary. Ukrainian competitors: their sites, Instagram, Rozetka/Prom shop pages.
2. **Quality references:** 3 identity case studies from `the-brandidentity.com/search?filter=tag_application:Logo` (+ `tag_industry:` / `tag_aesthetic:`) and type in real use from `fontsinuse.com` (Formats → Branding/Identity).
3. Write the **category convention** in one line ("everyone uses blue sans-serif wordmarks with a leaf") and decide which conventions to keep (trust signals) and which to break (differentiation).
4. Output a moodboard file `research.md`: URL · what to take · what NOT to take. Never copy logos, names, slogans or unique assets.

## 3. Concepts (3, genuinely different ideas)
- Use the methods in `concept-methods.md` (monogram with meaning, product action, metaphor fusion, negative space, construction geometry) — at most two methods per concept, and the three concepts must not share a method + metaphor pair.
- Each concept is presented as:
  ```
  Concept <A>: <name of the idea>
  Idea: one sentence linking the mark to the strategy line
  Method: <method> · Logo type: wordmark | symbol + wordmark | lettermark | emblem
  Mark: <file path to SVG sketch or generated rough>
  Type: <face, licence, Cyrillic ✓/✗> · Palette: <3–4 hex>
  Why it fits: … · Risk: <what could go wrong, e.g. "close to competitor X's arrow">
  ```
- Rough concepts may be generated images (logo prompts: flat, single idea, white background, "no text" — wordmarks are never generated, they are set in SVG from real type). Final marks are always redrawn as SVG in `references/logo.md`.

## 4. Selection (score, then let the user choose)
Score each concept 1–5 and show the table:
| Criterion | Question |
|---|---|
| Distinctiveness | Does it stand apart from the category map? (swap test: would it work for a competitor?) |
| Relevance | Can you explain the mark in one sentence tied to the strategy? |
| Scalability | Does it survive 16 px, one colour, embroidery, a stamp? |
| Ownability | Free of clichés (swoosh, globe, bulb, generic leaf, letter-in-a-circle) and of near-identical existing marks? |
| Longevity | Free of a trend that will date it in 2–3 years? |
Recommend one with a reason; the user decides. Run the agent `brand-art-director` on all three before presenting when the session can dispatch agents.

## 5. System (after the choice)
1. **Logo system** → `references/logo.md` (construction, lockups, small-size version, files, icon exports).
2. **Colour:** 1 primary, 1–2 secondary, neutrals (ink, paper, muted, line), optional accent; each with HEX/RGB, CMYK noted for print; run `node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs" bg=… ink=… muted=… accent=… accent-ink=…` and keep the output.
3. **Typography:** display + text faces (and mono if digital-product), licence noted, Cyrillic coverage verified (`references/guidelines.md` → `cyrillic-type.md`).
4. **Graphic device:** one element derived from the mark (a crop, angle, pattern, frame) used across applications. One, not five.
5. **Imagery:** 3 rules for photography/illustration (light, framing, subject) + 3 don'ts.
6. **Voice:** 3 tone principles with "we say / we don't say" lines in Ukrainian (and English if the brand is bilingual).
7. **Guidelines and boards** → `references/guidelines.md`.

## 6. Ukrainian specifics
- **Bilingual names:** decide the primary script (Cyrillic, Latin, or both lockups). Official transliteration follows Cabinet of Ministers Resolution No. 55 of 27.01.2010 (`zakon.rada.gov.ua/laws/show/55-2010-п`) — e.g. Г → h, Ґ → g, Х → kh, Щ → shch; a brand may choose its own Latin spelling, but then use it everywhere.
- Both scripts in the wordmark → design them as a pair (matching x-height, stroke contrast, width); never let a Latin-only font fall back for Cyrillic.
- **Name and trademark sanity check** (not legal clearance): search the name in the Ukrainian IP office database `sis.nipo.gov.ua/uk/search/simple/`, WIPO Global Brand Database and TMview, plus the `.ua`/`.com.ua` domain and the Instagram/Telegram handle. Report what was found; clearance is a lawyer's job (hand to a lawyer) — verify with a qualified IP lawyer before registration.

## 7. Presentation (case-study order)
`identity.html` rendered with `render-templates.mjs` (or a PDF via `/office`): lede (one sentence) → brief/problem → strategy line → idea → logo construction → lockups → colour → type → device → imagery → applications on real shapes (signage, packaging, screens, social) → credits (typefaces and foundries). Mockups show real applications, never only floating business cards.

## 8. Output
```
Strategy: <strategy line>
Research: deliverables/brand/<slug>/research.md (N references)
Concepts: A/B/C paths + score table
Chosen system: logo files · palette (hex + contrast results) · type (licence, Cyrillic ✓) · device · imagery · voice
Presentation: <path>
Critique: brand-art-director verdict
```
