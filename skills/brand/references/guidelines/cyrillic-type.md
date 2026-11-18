# Cyrillic-capable typefaces and Ukrainian typography

## 1. Verify before proposing
- Google Fonts: `https://fonts.google.com/metadata/fonts` (JSON) → the family's `subsets` must contain `cyrillic`; or the "Cyrillic" language filter on fonts.google.com.
- Any other face: open the foundry's glyph set or test the actual font file. Required Ukrainian glyphs: `А–Я а–я` plus `Ґ ґ Є є І і Ї ї`, apostrophe `’` (U+2019), `«» „“`, `№`, `—`, and ideally `₴` (U+20B4) — many fonts lack `₴`; if missing, write "грн".
- Set `lang="uk"` on Ukrainian text: some fonts carry Bulgarian or Serbian alternate letterforms activated by `lang="bg"`/`"sr"`; Ukrainian text must not pick them up.
- Render a specimen line from the real file and look: "Ґанок, їжак, Євген і бджоли: «№ 7 — 1 299 ₴»". Fallback glyphs (a different face mid-word) = the font fails.

## 2. Faces with Cyrillic (Google Fonts, per the core's typography reference checked against the Google Fonts catalogue)
| Role | Faces | Character |
|---|---|---|
| Neutral sans (UI, text) | Inter, Manrope, Onest, IBM Plex Sans, Source Sans 3, Geist | clean, product, fintech, services |
| Display with character | Unbounded, Roboto Flex (variable axes), Arsenal (Ukrainian-made) | events, youth, civic and cultural brands |
| Serif (editorial, premium) | Literata, Playfair Display, Cormorant Garamond, EB Garamond | publishing, hospitality, jewellery, heritage |
| Geometric/round | Jost | friendly, retail |
| Mono | JetBrains Mono, IBM Plex Mono | tech, data accents |
**No Cyrillic** (do not set Ukrainian copy in them): Space Grotesk, Plus Jakarta Sans, Instrument Sans/Serif, Fraunces, Newsreader, Bricolage Grotesque, DM Sans, Syne, Archivo, Young Serif, Gloock, Hanken Grotesk, Work Sans, Anybody, and Fontshare originals. Re-check a face's `subsets` if you read this list later than 2026 — foundries add scripts.

Licences: Google Fonts families are open-source (mostly SIL Open Font License; some Apache 2.0 or Ubuntu Font Licence — check each family's page) — logo use and commercial use are allowed under OFL; you may not sell the font files themselves. Paid faces: check the EULA for logo/trademark use, web views and app embedding.

## 3. Pairing rules for bilingual brands
- Match x-height and stroke contrast between the Cyrillic and Latin settings; Cyrillic lowercase has more rectangular, x-height-bound letters (н, п, т, к) — it reads denser, so tracking may need +1–2 %.
- Headlines in Ukrainian run longer than English equivalents of the same message; design layouts with ≥ 20 % spare width and test with the real Ukrainian copy, not lorem ipsum or English.
- Uppercase Cyrillic display type (all caps) loses word shape quickly; keep all-caps lines short.

## 4. Ukrainian typography rules (for guidelines and templates)
- Quotes: «ялинки» primary, „лапки“ nested.
- Apostrophe: ’ (U+2019) or ' — one choice everywhere (Ukrainian spelling uses it in words like м’ята, п’ять).
- Dashes: em dash with spaces in sentences (" — "); en dash without spaces for ranges (10–20).
- Numbers: thin or non-breaking space for thousands ("12 500"), comma as decimal separator ("4,5"), non-breaking space before units and currency ("1 299 грн", "20 %", "5 км").
- Dates: "12 листопада 2026" or "12.11.2026"; time "19:00".
- Line breaks: avoid one-letter words (в, у, з, і, й, а, о) at the end of lines in display type — use non-breaking spaces after them.
- Hyphenation: `hyphens: auto` needs `lang="uk"`; avoid hyphenating headlines.
