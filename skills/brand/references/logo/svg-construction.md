# SVG logo construction

## 1. Master file setup
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-labelledby="t">
  <title id="t">Brand name</title>
  <path fill="currentColor" d="…"/>
</svg>
```
- `viewBox` cropped to the artwork (lockups) or square with deliberate padding (symbol and icon masters). No fixed `width`/`height` on the master.
- Integer or half-unit coordinates on the grid; keep `d` data readable in the source copy, optimise a separate delivery copy.
- `fill="currentColor"` (or CSS variables) in the web version so the logo inherits theme colour; explicit hex fills in the colour versions.
- Final art uses filled shapes, not strokes: convert strokes to outlines so line weight scales with the mark and survives every renderer.
- No `<text>`, no `<image>`, no filters, no masks unless essential; no `<script>` or `<foreignObject>`.

## 2. Grid recipe
1. Choose a square unit grid: 24 (icons), 48 or 96 (symbols with finer detail).
2. Define keylines: outer square, inner circle (diameter ≈ 0.9 of the square), and the optical-centre line (slightly above the geometric centre).
3. Stroke set: two weights maximum (e.g. 4 and 6 units at 48). Radii set: one or two values.
4. Build primitives (rect, circle, path) on the grid, then boolean-combine into final paths.
5. Write the construction note: "48-unit grid · strokes 6 · corner radius 4 · counter 12 · overshoot 1". This becomes the guidelines construction panel.

## 3. Optical corrections
| Issue | Correction |
|---|---|
| Round letters (O, C, S, о, с, є) look shorter than flat ones | overshoot above cap height and below baseline by ~1–3 % of the height |
| Pointed apexes (A, V, Л, Д) look short | extend the apex past the line |
| Horizontal strokes look heavier | make horizontals slightly thinner than verticals |
| Circle looks smaller than a square of equal width | enlarge the circle a little |
| Mark looks low when centred mathematically | shift up to the optical centre |
| Junctions fill in at small size | add ink traps / notches where strokes meet |

## 4. Wordmark from a typeface → outlines
1. Set the name in the chosen face at a large size; adjust tracking for the size the logo will mostly appear at (tighter for large display).
2. Kern pair by pair by eye at 200 %+; Cyrillic pairs need their own attention (Г, Т, Л, Д, У, Я, Ї next to round letters).
3. Customise 1–2 details only (terminal cut, a joined pair, a custom Ґ or Ї, a shortened descender).
4. Convert text to paths, choosing one available tool:
   - Inkscape 1.x CLI: `inkscape in.svg --export-text-to-path --export-plain-svg --export-filename=out.svg` (check `inkscape --help` for your version).
   - opentype.js in a scratch folder (outside the project): `npm i opentype.js`, then `font.getPath(text, x, y, size).toSVG()`; kerning is applied from the font's kern data.
   - Design tools (Figma "Outline stroke"/"Flatten", Illustrator "Create Outlines") when the user works there.
5. Re-check spacing after outlining; merge overlapping paths; remove empty groups.
6. Keep the font name, version and licence in the delivery notes (logo use permitted? — OFL permits; paid faces: check the EULA for logo/trademark use).

## 5. Lockups
- Horizontal: symbol height ≈ cap height to 1.5× cap height of the wordmark; gap between symbol and wordmark = a named unit (e.g. counter width).
- Stacked: symbol centred above, gap = the same unit.
- Align optically: the wordmark's x-height or cap height centred on the symbol's optical centre, not its bounding box.

## 6. Delivery copies
- Optimise with SVGO (`npx svgo in.svg -o out.svg`) keeping `viewBox` (disable the `removeViewBox` plugin if your SVGO version removes it); keep an unoptimised source copy.
- Check: open in a browser at 16/24/48/128 px; open in a second renderer (Inkscape, Figma import, or a PDF export) to catch renderer differences.
- File names: `logo-horizontal.svg`, `logo-horizontal-black.svg`, `logo-horizontal-white.svg`, `symbol.svg`, `symbol-small.svg`, `wordmark-cyr.svg`, `wordmark-lat.svg`.
