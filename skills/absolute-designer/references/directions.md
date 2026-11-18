# Visual Directions

Fourteen committed directions. Pick ONE per surface, then adapt it to the brief. A direction is a starting world, not a costume: change at least the accent, the display face or the signature element so the result belongs to this brief.

Every palette below was checked with `node ${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs` (WCAG 2.x). Ratios are real. Re-run the script after any change.

Token roles used everywhere: `bg` page · `surface` cards/panels · `ink` body text · `muted` secondary text · `accent` brand/action colour · `accent-ink` text on accent · `border` hairlines.

`[Cyr]` = the font family has Cyrillic (safe for Ukrainian copy). Unmarked = Latin-only or unverified: check the Google Fonts "Language → Cyrillic" filter before using it with Ukrainian text.

**Saturated directions.** Three looks are what AI design produces by default: warm cream + high-contrast serif + terracotta; near-black + one acid accent; broadsheet hairlines + zero radius. Directions 1, 2 and 13 sit close to them. Use them when the brief earns it (the user asks, or the subject's own world is print, terminals or paper), never as the free choice.

---

## 1. Swiss Industrial Print — light, rigorous, poster energy
- **Use for:** manifestos, agencies, architecture, events, technical products with attitude. **Avoid:** consumer wellness, children, luxury.
- **Tokens:** bg `#F4F4F0` · surface `#FFFFFF` · ink `#0A0A0A` · muted `#55554F` · accent `#E61919` · accent-ink `#FFFFFF` · border `#CFCFC8`; structural rules `#0A0A0A` at 2px.
- **Contrast:** ink/bg 17.96 · muted/bg 6.81 · accent-ink/accent 4.65 · accent/bg 4.22.
- **Type:** display Neue Haas Grotesk Black / Monument Extended (commercial) → free: Archivo (wdth 125, 800–900), Unbounded `[Cyr]`. Body: Inter `[Cyr]` or Manrope `[Cyr]`. Uppercase display, tracking −0.04em, leading 0.9.
- **Shape:** radius 0. Thick dividing grid lines, strikethroughs, rotated labels. No shadows.
- **Layout signature:** 12-column grid made visible; one oversized word cropped by the viewport edge.
- **Motion:** hard cuts, 120–180ms; marquee only for live data.
- **Dials:** variance 7 · motion 3 · density 6.

## 2. Tactical CRT Telemetry — dark, monospace, instrument panel
- **Use for:** dev tools, security, infra, hacker-culture products, data terminals. **Avoid:** anything a non-technical buyer must trust quickly.
- **Tokens:** bg `#0A0A0A` · surface `#121212` · ink `#EAEAEA` · muted `#9A9A9A` · accent `#FF2A2A` · accent-ink `#0A0A0A` · border `#2A2A2A`; signal green `#4AF626` (13.67 on bg) for live indicators only.
- **Contrast:** ink/bg 16.46 · muted/bg 7.04 · accent-ink/accent 5.30.
- **Type:** JetBrains Mono `[Cyr]` / IBM Plex Mono `[Cyr]` / Space Mono; tracking +0.08em on labels. Mono is allowed here because the content is data.
- **Shape:** radius 0–2px. ASCII bracket borders `[ CONTROL PORTAL ]`, crosshairs `+` at grid intersections, `///` dividers.
- **Layout signature:** a live readout (real numbers, tabular-nums) as the hero.
- **Motion:** typewriter or scanline reveal once; cursor blink; no springs.
- **Dials:** variance 4 · motion 4 · density 8.

## 3. Premium Utilitarian Minimalism — calm, document-like product UI
- **Use for:** productivity tools, docs, notes, B2B admin, settings-heavy apps.
- **Tokens:** bg `#FBFBFA` · surface `#FFFFFF` · ink `#191919` · muted `#6B6B66` · accent `#191919` (black primary buttons) · accent-ink `#FFFFFF` · border `#DDDDD9`. Tag tints (backgrounds only, text stays ink): red `#FDEBEC`, blue `#E1F3FE`, green `#EDF3EC`, yellow `#FBF3DB`.
- **Contrast:** ink/bg 16.98 · muted/bg 5.17 · accent-ink/accent 17.58.
- **Type:** SF Pro / system-ui body; display Instrument Serif (headlines only, never body). Cyrillic alternative for display: Cormorant Garamond `[Cyr]`.
- **Shape:** radius 6–8px; 1px borders; shadows only on overlays (`0 8px 24px rgb(0 0 0 / .08)`).
- **Layout signature:** generous left-aligned column (max 720px) with inline, document-style controls.
- **Motion:** 150ms opacity/transform, no entrance animations.
- **Dials:** variance 2 · motion 2 · density 5.

## 4. Editorial Luxe — quiet authority, magazine pacing
- **Use for:** fashion, jewellery, hospitality, architecture studios, premium services.
- **Tokens:** bg `#EFEEEA` · surface `#F8F7F4` · ink `#16181A` · muted `#5E6163` · accent `#1F4D3A` (bottle green) · accent-ink `#F8F7F4` · border `#D9D7D0`.
- **Contrast:** ink/bg 15.33 · muted/bg 5.37 · accent-ink/accent 8.99.
- **Type:** display Canela / GT Super (commercial) → free: Cormorant Garamond 500 `[Cyr]`, Playfair Display `[Cyr]`, Gloock. Body: Manrope `[Cyr]` or Source Sans 3 `[Cyr]`. Small caps / tracked caps for credits.
- **Shape:** radius 0–2px; full-bleed photography; captions set like a magazine.
- **Layout signature:** asymmetric image/text spreads; one image breaks the grid.
- **Motion:** slow (500–700ms) opacity + 8px rise, image clip-path reveals.
- **Dials:** variance 6 · motion 4 · density 3.

## 5. Soft Product — friendly, rounded, confident colour
- **Use for:** consumer apps, fintech for individuals, education, health tracking.
- **Tokens:** bg `#F7F7F4` · surface `#FFFFFF` · ink `#1C1B22` · muted `#615F6B` · accent `#C9370F` (tangerine-red) · accent-ink `#FFFFFF` · border `#DADAD4`.
- **Contrast:** ink/bg 15.92 · muted/bg 5.83 · accent-ink/accent 5.20 · accent/bg 4.85.
- **Type:** Plus Jakarta Sans / General Sans (Fontshare) for Latin-only; Onest `[Cyr]` or Manrope `[Cyr]` for Ukrainian copy; weights 500–700 for headings.
- **Shape:** radius 16–24px cards, full-pill buttons; one soft shadow level.
- **Layout signature:** product UI shown in real device frames with live-looking data.
- **Motion:** springs (stiffness 300, damping 26) on press and sheet open.
- **Dials:** variance 4 · motion 6 · density 4.

## 6. Dark Precision SaaS — layered greys, engineered calm
- **Use for:** dev platforms, analytics, AI infra, pro tools. Look at styles.refero.design → "Dark mode SaaS".
- **Tokens:** bg `#08090A` · surface `#111214` · raised `#17181B` · ink `#EDEEF0` · muted `#8A8F98` · accent `#4C7DFF` (cobalt, not violet) · accent-ink `#08090A` · border `#23252A`.
- **Contrast:** ink/bg 17.17 · muted/bg 6.13 · accent-ink/accent 5.39.
- **Type:** Inter Display / Inter `[Cyr]` or Geist `[Cyr]` + Geist Mono. Tight headings (−0.03em), 13–14px UI text.
- **Shape:** radius 8–12px, 1px borders do the separating; elevation = lighter surface, not shadow.
- **Layout signature:** a real product screenshot with a single focused interaction annotated.
- **Motion:** 200ms ease-out, subtle gradient border sweep on ONE element max.
- **Dials:** variance 3 · motion 4 · density 7. **Lila rule applies:** no neon-purple glow buttons.

## 7. Neo-Brutalist — loud, flat, honest
- **Use for:** indie products, creator tools, Gen-Z brands, hackathon energy.
- **Tokens:** bg `#FFFDF5` · surface `#FFFFFF` · ink `#000000` · muted `#3A3A3A` · accent `#FFD23F` (fill only, never text) · accent-ink `#000000` · border `#000000` 2–3px; extra fills `#FF6B6B`, `#4D96FF` (both ≥7:1 with black text).
- **Contrast:** ink/bg 20.62 · accent-ink/accent 14.54. Yellow on white is 1.42 → use it only as a fill under black text.
- **Type:** Space Grotesk / Archivo Black / Bricolage Grotesque; body Inter `[Cyr]`.
- **Shape:** radius 0–8px; hard offset shadow `4px 4px 0 #000`; press = shadow collapses to 0 and element shifts 4px.
- **Layout signature:** stickers, rotated badges, visible borders on everything.
- **Motion:** snappy 100ms; hover lifts with shadow growth.
- **Dials:** variance 7 · motion 5 · density 5.

## 8. Organic Botanical — natural, tactile, slow
- **Use for:** wellness, food, cosmetics, sustainability, gardening. styles.refero.design → "Botanical & organic".
- **Tokens:** bg `#EEF0E8` · surface `#F7F8F3` · ink `#1E2A1F` · muted `#4F5D50` · accent `#3E6B48` · accent-ink `#F7F8F3` · border `#D3D9CC`; clay secondary `#B86B4B` (decorative only).
- **Contrast:** ink/bg 12.99 · muted/bg 6.06 · accent-ink/accent 5.78.
- **Type:** display Fraunces (soft, wonky axes) or Literata `[Cyr]`; body Commissioner / Manrope `[Cyr]`.
- **Shape:** radius 20–32px or organic SVG blobs; paper/grain texture at 3–5% opacity.
- **Layout signature:** cut-out product photography over soft shapes; ingredient/specimen labels.
- **Motion:** 400–600ms eased reveals; gentle parallax on decorative leaves only.
- **Dials:** variance 5 · motion 4 · density 3.

## 9. Cinematic Hardware — black stage, product as hero
- **Use for:** physical products, devices, cars, audio, launches. styles.refero.design → "Cinematic hardware".
- **Tokens:** bg `#000000` · surface `#0D0D0D` · ink `#F5F5F7` · muted `#A1A1A6` · accent `#3D9BFF` · accent-ink `#000000` · border `#262626`.
- **Contrast:** ink/bg 19.29 · muted/bg 8.16 · accent-ink/accent 7.33.
- **Type:** large tight sans (Inter Display 700 `[Cyr]`, Geist); headlines short (3–6 words).
- **Shape:** full-bleed media; almost no visible containers.
- **Layout signature:** scroll-driven product sequence (pinned section, image sequence or video scrubbing).
- **Motion:** scroll-linked (`animation-timeline: view()`), 0.8–1.2s cinematic eases; respect reduced motion with static frames.
- **Dials:** variance 5 · motion 9 · density 2.

## 10. Playful Maximal — colour-blocked, joyful, Gen-Z
- **Use for:** consumer social, games, kids-adjacent (not kids), music, events.
- **Tokens:** bg `#FFF4E0` · surface `#FFFFFF` · ink `#1B1036` · muted `#4E4366` · accent `#D92A66` · accent-ink `#FFFFFF` · border `#1B1036`; block fills `#7BE0AD`, `#FFC53D`.
- **Contrast:** ink/bg 16.41 · muted/bg 8.31 · accent-ink/accent 4.69 · accent/bg 4.31.
- **Type:** display Unbounded `[Cyr]` / Syne / Chillax (Fontshare); body Onest `[Cyr]`.
- **Shape:** radius 24px+, blobs, stickers, oversized emoji-free illustrations.
- **Layout signature:** colour-blocked sections, each a different background fill.
- **Motion:** bouncy springs, confetti on real success moments only (see motion.md).
- **Dials:** variance 8 · motion 7 · density 5.

## 11. Data Cockpit — dense, scannable, serious
- **Use for:** dashboards, admin panels, trading, monitoring, CRM. Operate mode.
- **Light tokens:** bg `#F5F6F8` · surface `#FFFFFF` · ink `#0E1116` · muted `#5A6270` · accent `#0B6E99` · accent-ink `#FFFFFF` · border `#D5D9DF`; positive `#127A4A` (5.37 on white) · negative `#C2362B` (5.45) · warning `#A86200` (4.76).
- **Dark tokens:** bg `#0D1117` · surface `#161B22` · ink `#E6EDF3` · muted `#8D96A0` · accent `#4FA3D1` · accent-ink `#0D1117` · border `#30363D`.
- **Contrast:** light ink/bg 17.49 · muted/bg 5.69 · accent-ink/accent 5.67; dark ink/bg 16.02 · muted/bg 6.31.
- **Type:** Inter `[Cyr]` / IBM Plex Sans `[Cyr]` 13–14px; `font-variant-numeric: tabular-nums` on every number; mono only for IDs and code.
- **Shape:** radius 6px; tables over cards; no decorative shadows.
- **Layout signature:** one primary metric per view, everything else subordinate (see ux-rules.md → Dashboards).
- **Motion:** none on load; 120ms state changes; number changes cross-fade.
- **Dials:** variance 1 · motion 1 · density 9.

## 12. Kinetic Type — the words are the visual
- **Use for:** agencies, conferences, music, campaigns with strong copy.
- **Tokens:** bg `#DCE3E1` · surface `#EEF2F1` · ink `#0B0B0B` · muted `#46504D` · accent `#C23500` · accent-ink `#FFFFFF` · border `#B9C4C1`.
- **Contrast:** ink/bg 15.11 · muted/bg 6.41 · accent-ink/accent 5.52 · accent/bg 4.24.
- **Type:** a variable display face with a wide axis range (Archivo wdth/wght, Anybody, Roboto Flex `[Cyr]`); body Manrope `[Cyr]`.
- **Shape:** none; type fills the frame edge to edge.
- **Layout signature:** headline animates axis (weight/width) on scroll or pointer.
- **Motion:** variable-font axis interpolation; split-letter staggers ≤ 600ms total.
- **Dials:** variance 8 · motion 8 · density 3.

## 13. Warm Indie — handmade, personal, kraft paper
- **Use for:** small studios, newsletters, personal sites, craft shops, books.
- **Tokens:** bg `#F5EFE3` · surface `#FBF8F1` · ink `#2B2118` · muted `#655748` · accent `#2F5D8A` (ink blue — not terracotta) · accent-ink `#FBF8F1` · border `#E2D8C6`.
- **Contrast:** ink/bg 13.75 · muted/bg 6.09 · accent-ink/accent 6.48.
- **Type:** display Young Serif / Gloock / Spectral `[Cyr]`; body Literata `[Cyr]` or Source Serif 4 `[Cyr]`; handwritten accents only as SVG.
- **Shape:** radius 4–12px, slightly irregular hand-drawn underlines (SVG), tape/paper details.
- **Layout signature:** a single-column letter-like flow with marginalia.
- **Motion:** minimal; underline draw-on for links.
- **Dials:** variance 5 · motion 3 · density 4.

## 14. Monochrome Gallery — the work is the colour
- **Use for:** portfolios, photographers, galleries, case studies. Experience mode.
- **Tokens:** bg `#FFFFFF` · surface `#F6F6F6` · ink `#0A0A0A` · muted `#6E6E6E` · accent = ink · accent-ink `#FFFFFF` · border `#E5E5E5`.
- **Contrast:** ink/bg 19.80 · muted/bg 5.10 · muted/surface 4.72.
- **Type:** one grotesk at two sizes (Neue Montreal / Söhne commercial → free: Hanken Grotesk, Inter Display `[Cyr]`).
- **Shape:** radius 0; images at true aspect ratios, never cropped to fake uniformity.
- **Layout signature:** index list ↔ image hover preview, or a horizontal scroll gallery.
- **Motion:** image fades 300ms; cursor-follow preview on desktop only.
- **Dials:** variance 6 · motion 4 · density 2.

---

## Custom direction recipe
When none fits: name the subject's own world (materials, instruments, artefacts, vernacular), then derive:
1. Light or dark from the **use scene** (who, where, what ambient light) — never from the category.
2. Accent from an object in that world (a pigment, a signal light, a material).
3. Display face whose construction echoes that world; body face chosen for reading.
4. One signature element only that world could have.
5. Write it in the same token format above and run the contrast script.
