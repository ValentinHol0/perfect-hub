# Brand Logo

A logo is finished when it works in one colour at 16 px, has documented clear space and minimum size, and ships as a complete file package. References:
- `${CLAUDE_PLUGIN_ROOT}/skills/brand/references/logo/svg-construction.md` — grid, optical corrections, wordmark customisation, outlining text, SVG hygiene.
- `${CLAUDE_PLUGIN_ROOT}/skills/brand/references/logo/icon-sizes.md` — verified favicon/PWA/store icon sizes with sources and check dates.

No brief or strategy yet → run `references/identity.md` §1–2 first (a short version is fine for a refresh).

## 1. Construction rules
1. **One colour first.** Design in solid black on white; colour comes last. If the idea needs a gradient, shadow or two colours to read, it is not the idea yet.
2. **One idea.** The mark explains itself in one sentence tied to the strategy; no third element "for meaning".
3. **Grid and units.** Build on a unit grid (e.g. 24 or 48 units square). All stroke weights from a short set (e.g. 4 and 6 units); radii from one scale. Write the construction down — it becomes the guideline's construction panel.
4. **Optical, not mathematical.** Round and pointed shapes overshoot the baseline/cap height by ~1–3 % of the height; circles look smaller than squares of the same size; horizontal strokes look thicker than vertical ones of the same weight — thin them slightly. Check by eye at display size.
5. **Wordmarks from real type.** Start from a licensed face (OFL/Google Fonts/Fontshare or a paid licence covering logo use), then customise 1–2 things: cut terminals, a custom letter, a ligature, tightened spacing. Kern every pair by eye at 200 %+. Cyrillic and Latin versions designed together (same x-height, contrast, width).
6. **Small sizes.** At 16–24 px hairlines vanish and counters fill in. Make a **small-size version** (fewer details, opened counters, heavier strokes, larger gaps) and state the switch size (e.g. "below 48 px use the small mark").
7. **Clear space** = a named element of the logo (e.g. the height of the symbol's counter or the cap height of the wordmark), not "some padding". **Minimum size** in px (screen) and mm (print), e.g. symbol 16 px / 6 mm, horizontal lockup 80 px / 25 mm — set per logo after testing, not copied.
8. **Avoid:** gradients as the core idea, hairlines, letters inside generic circles/shields as the whole concept, stock metaphors (swoosh, globe, bulb, generic leaf, handshake), detail that only works at poster size, trendy distortion that dates in a year.

## 2. Production path
- **Image tool available:** generate rough symbol ideas only ("flat single-colour vector-style mark, one idea, centred on white, no text, no letters"), choose, then **redraw as SVG** — a generated raster is never the production logo. Lettering is never generated; it is set from real type.
- **No image tool / final art:** author the SVG directly on the grid (`svg-construction.md`). Sketch 6–10 thumbnails as quick SVGs, keep 3 for concepts.
- Text in the final SVG is converted to outlines (`svg-construction.md` §4). No `<text>`, no embedded raster, no fonts required to render.

## 3. Review at real size (gate)
Render and look at: 16, 24, 32, 48, 128 px and a 1200 px hero, on white, on black and on the brand colour.
- [ ] Recognisable at 16 px (small-size version allowed).
- [ ] One-colour black and one-colour white versions both read; nothing depends on colour.
- [ ] Counters stay open; no strokes thinner than 1 px at the smallest intended size.
- [ ] Optical balance: the mark does not look like it is falling, floating or heavier on one side.
- [ ] Swap test: would it work equally for a competitor? If yes, push the idea.
- [ ] Not close to an existing mark found in research (logosystem.co, fontinlogo.com, the trademark search).
- [ ] `brand-art-director` pass for the final set when agents can be dispatched.
Quick render without Playwright: open an HTML page with the SVG at those sizes in the browser tool and take a screenshot; with Playwright, `render-templates.mjs` on a review sheet with `data-frame` cells.

## 4. Deliverables (logo package)
`deliverables/brand/<slug>/logo/`
| Asset | Files | Notes |
|---|---|---|
| Primary lockup (horizontal) | `logo-horizontal.svg` + `-black.svg` + `-white.svg` | symbol + wordmark |
| Secondary lockup (stacked) | `logo-stacked.svg` (+ mono) | for square spaces |
| Symbol only | `symbol.svg` (+ mono) | avatar, app icon, favicon, watermark |
| Small-size symbol | `symbol-small.svg` | ≤ 48 px uses |
| Wordmark only | `wordmark.svg` (+ mono) | tight horizontal spaces |
| Cyrillic / Latin pair | `wordmark-cyr.svg`, `wordmark-lat.svg` | when the brand uses both scripts |
| Colour versions | full colour · mono black · mono white · on brand colour | palette from the guidelines |
| Raster | `png/` @1x and @2x for each lockup, transparent | for office documents and marketplaces |
| Print | PDF (vector) per lockup; CMYK values noted | printers ask for PDF or EPS; confirm with the printer |
| Icons | output of `export-icons.mjs` (below) | favicon, PWA, store icons |
| Rules | clear space, minimum sizes, don'ts sheet | goes into `references/guidelines.md` |
Don'ts sheet (show each as a crossed-out example): stretch, rotate, recolour outside the palette, outline, add shadow/glow, place on busy photos without a scrim, rearrange lockup parts, change the typeface.

## 5. Favicon and app icons
Run (renders through Playwright):
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/export-icons.mjs" deliverables/brand/<slug>/logo/symbol.svg --small deliverables/brand/<slug>/logo/symbol-small.svg --bg "#<brand background>" --out deliverables/brand/<slug>/icons
```
Writes `favicon.ico` (16/32/48), `icon.svg`, `apple-touch-icon.png` 180, `icon-192.png`, `icon-512.png`, `icon-mask.png` 512 (maskable, artwork inside the 40 %-radius safe circle), `play-store-512.png`, `app-store-1024.png` (opaque, no alpha), `head-snippet.html`, `manifest-icons.json`. `--dry-run` prints the plan without rendering. Exit 3 = Playwright missing → install it or render the same sizes with the browser tool. Size sources and caveats: `icon-sizes.md`.
- Square icon master: give the symbol a square `viewBox` with balanced padding; store icons get a background colour (`--bg`), never transparency for the App Store master.
- Dark mode favicon: `icon.svg` may include `@media (prefers-color-scheme: dark)` inside a `<style>` to swap fills.
- Check the 16 px output at 100 % zoom in the browser tool before delivery.

## 6. Output
```
Logo: <idea sentence> · construction: <grid, strokes, radii>
Files: deliverables/brand/<slug>/logo/ (N files) · icons/ (N files)
Type: <face> (<licence>), customised: <what>
Rules: clear space = <element> · min size <px>/<mm> · small mark below <px>
Checks: one-colour ✓ · 16 px ✓ · swap test ✓ · similarity search ✓ · art director: <verdict>
```
