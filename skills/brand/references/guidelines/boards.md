# Brand-guideline boards

A board is one image that argues for the whole identity: what the brand stands for, its core metaphor, how the mark expresses it, how the system scales, why it is ownable. Approach adapted (rewritten) from the MIT-licensed `brandkit` skill by Leonxlnx — credited in the README.

## 1. Layouts
| Layout | Use | Canvas |
|---|---|---|
| 3 × 3 | full identity system (default) | 1600×1200 (4:3) or 1920×1200 (16:10) |
| 2 × 3 | compact deck overview | 1920×1200 |
| 2 × 2 | single concept for approval | 1600×1200 |
| 1 × 3 | horizontal strip for a post or header | 1920×640 |
| 4 × 2 | contact sheet of applications | 1920×960 |
Outer canvas in a dark neutral (charcoal) or warm paper tone; equal gutters (24–32 px at 1600 wide); panels aligned to one grid; small page labels and numbers in a corner.

## 2. Default 3 × 3 sequence
1. **Logo cover** — mark and wordmark large, almost nothing else.
2. **Construction** — grid, geometry or negative-space logic that shows why the mark exists.
3. **Digital application** — app icon, browser tab, site header or app top bar using the mark.
4. **Brand essence** — one short tagline in large type, quiet background.
5. **Colour system** — swatches or chips with names and hex.
6. **Typography** — large specimen (Cyrillic and Latin if bilingual) with role labels.
7. **Physical application** — packaging, label, card, sign, sticker, uniform.
8. **Image direction** — one art-directed photo or illustration in the palette.
9. **System detail** — icon row, pattern, badge set, UI chips, component strip.

Rhythm: alternate quiet (1, 4) → functional (3, 9) → emotional (8) → technical (2, 6) panels. Not every panel loud; the logo repeats consistently across panels.

## 3. Details that reward a closer look (use sparingly)
Page numbers, tiny footer labels, alignment marks, construction lines, thin rules, one highlighted word, one accent chip, low-opacity grain or halftone on image panels.

## 4. Text on boards
Allowed: brand name, one tagline, one URL or handle, 2–5 section labels, short chips. Forbidden: paragraphs, fake tiny body copy, menus full of items, lorem ipsum, unreadable labels. Everything legible when the whole board is viewed at 1080 px wide.

## 5. Colour discipline
One dominant palette: base + primary accent + optional secondary accent + neutrals. Accents repeat across panels; one accent can carry the system. No rainbow, no default purple-blue glow, no random gradients.

## 6. Mockups
Minimal and believable: browser bar, app icon on a home-screen crop, phone corner, label, sticker on a Nova Poshta box, folder, badge. Not: busy fake dashboards, glossy device piles, floating business cards only.

## 7. Production routes
- **HTML (preferred for delivery):** one `<main>` grid with nine `<section>` panels; the whole board wrapped in `<div data-frame="board-01" data-size="1600x1200">`; real SVG logo, real fonts; render with `render-templates.mjs --scale 2`.
- **Image generation (concept/mood stage):** use the prompt below; then rebuild the board in HTML with the real logo and type. Generated boards with lettering are previews, never deliverables.

## 8. Prompt template (image tool)
```
Create a premium references/guidelines.md overview board for "<BRAND>".
Strategy: category <…>; audience <…>; personality <3 words>; core metaphor <…>;
logo idea <how the mark joins the metaphor and the name>.
Layout: <3x3 | 2x3 | custom> grid on a <dark charcoal | warm paper> canvas, equal gutters, strict alignment, generous negative space.
Panels: logo cover · construction · digital application · tagline · colour system · typography · physical application · image direction · system detail.
Visual mode: <mode from concept-methods.md>. Palette: <3–5 named colours with hex>.
Style: restrained, editorial, intentional, presentation-ready; sparse large type, no tiny fake text, no copied real-world logos.
Constraints: the same simple mark repeated consistently on every panel; no watermark.
```
Review the output for: inconsistent logo variants across panels, garbled lettering, fake UI noise, palette drift. Regenerate or rebuild in HTML.
