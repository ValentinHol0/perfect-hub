# Brand Guidelines

Guidelines are a tool, not a showcase: every page answers "what do I do when…" for someone who was not in the room. References:
- `${CLAUDE_PLUGIN_ROOT}/skills/brand/references/guidelines/brand-book.md` — section-by-section templates with required content and example rules.
- `${CLAUDE_PLUGIN_ROOT}/skills/brand/references/guidelines/boards.md` — brand-guideline board system (layouts, panel sequence, rhythm, prompt template).
- `${CLAUDE_PLUGIN_ROOT}/skills/brand/references/guidelines/cyrillic-type.md` — Cyrillic-capable faces, verification, Ukrainian typography rules.

Inputs required: final logo files (`references/logo.md`), palette, typefaces, strategy line. Missing → build them first (`references/identity.md`) or mark the section "pending".

## 1. Choose the deliverable
| Need | Deliver |
|---|---|
| Team or contractors will produce materials | **Brand book** — `brandbook.html` (one section per page, rendered to PDF/PNG) |
| Present the identity, pitch, portfolio, social announcement | **Brand board(s)** — 1–3 boards, 4:3 or 16:10 |
| Small business, one designer | **Brand sheet** — one A4/1-page summary: logo versions, palette, type, 3 do / 3 don't |
| Developers will build the site | Brand book + tokens file (CSS variables) + handoff to the core (`/absolute`) |

## 2. Brand book structure (order matters)
1. **Cover** and **contents**.
2. **Brand idea** — strategy line, personality words, anti-words (one page).
3. **Logo** — versions and when to use each; construction (grid note); clear space (named element); minimum sizes (px and mm); small-size mark switch; placement on light/dark/photo backgrounds; don'ts (crossed-out examples).
4. **Colour** — swatches with HEX, RGB, CMYK (and Pantone if print matters; mark "approximate, proof on press"); proportions (e.g. 60/30/10); **contrast results table** from `contrast.mjs` (pair · ratio · AA normal / AA large-UI) with allowed and forbidden text/background combinations.
5. **Typography** — faces, weights, roles (display / text / UI / mono), size scale, line height, tracking; Cyrillic coverage confirmed (`cyrillic-type.md`); licence and where to get the files; web/office fallbacks (e.g. if the brand face is unavailable in Google Docs/Word, use X).
6. **Graphic device** — construction and 3 applications.
7. **Imagery** — photography and/or illustration: light, framing, subject, colour grading, 3 do and 3 don't with examples; AI-generated imagery rules (labelled, never as real product/customer photos).
8. **Iconography** (if any) — set, stroke, grid, corner radius.
9. **Voice and tone** — 3 principles; "we say / we don't say" pairs in Ukrainian (and English if bilingual); vocabulary (preferred terms, banned words); address form (ви/Ви, ти) and feminitives policy; emoji policy.
10. **Applications** — social templates, ads, packaging, signage, email signature, documents, Nova Poshta box sticker/label, marketplace cards; each as a real mockup with specs.
11. **Files and contacts** — folder map, who approves, version and date.

## 3. Production
- Build the book as one HTML file with `<section data-frame="p01-cover" data-size="1600x1200">` pages (or 1920×1080 for screen), tokens as CSS variables, real SVG logo inlined, fonts loaded locally or from Google Fonts with the `cyrillic` subset.
- Render: `node "${CLAUDE_PLUGIN_ROOT}/scripts/render-templates.mjs" brandbook.html --out deliverables/brand/<slug>/brandbook --scale 2`. PDF: print the HTML from the browser tool or hand to `/office`.
- Contrast table: run `node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs" bg=… surface=… ink=… muted=… accent=… accent-ink=… border=…` and paste the PASS/FAIL lines; any FAIL is either fixed or listed as a forbidden combination.
- Boards: follow `boards.md`. With an image tool, a board may be generated for mood, but the logo, wordmark and any text in a delivered board are composited from the real SVG/type in HTML — generated lettering is never shipped.

## 4. Quality gates
- [ ] Every rule is testable ("clear space = height of the counter", not "give the logo room").
- [ ] Contrast table present; forbidden pairs listed.
- [ ] Typefaces render Ukrainian text incl. `Ґґ Єє Іі Її ’ «» № ₴` in the actual files (screenshot of a specimen line).
- [ ] Licences stated for every font and stock asset.
- [ ] Logo shown on light, dark and photographic backgrounds.
- [ ] Applications use real formats (sizes from `references/ad-creatives.md` / `references/social-templates.md`).
- [ ] Voice examples written in natural Ukrainian (no calques), checked against the brand's audience.
- [ ] Version, date and owner on the cover.

## 5. Output
```
Deliverable: brand book | boards | sheet
Files: deliverables/brand/<slug>/brandbook.html · brandbook/*.png · brandbook.pdf (if made)
Sections: N (list)
Contrast: min ratio <x>:1 · forbidden pairs: <list>
Fonts: <face> (<licence>, Cyrillic ✓)
```
