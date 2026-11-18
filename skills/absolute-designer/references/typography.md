# Typography System

Typography carries the personality of the page. Choose faces for this brief, then set a real system: scale, leading, measure, tracking, loading.

## 1. Role-based setup (always 2–3 roles, never more)

| Role | Job | Typical setting |
|---|---|---|
| Display | Headlines, hero, section titles. Character lives here; use with restraint. | 600–900 weight (or 300–400 for a serif), tracking −0.02 to −0.04em, line-height 0.95–1.1 |
| Body | Paragraphs, UI labels, forms. Readability first. | 400 (500 for UI ≤ 14px), line-height 1.5–1.65, measure 60–75ch |
| Utility (optional) | Data, code, captions, credits, kbd. | Mono or tabular sans, 12–13px, tracking +0.02em; caps labels +0.06 to +0.12em |

## 2. Scale
- **UI / product:** ratio 1.125–1.2, base 14–16px. Steps: 12 · 13 · 14 · 16 · 18 · 20 · 24 · 30.
- **Marketing:** ratio 1.25–1.333, base 16–18px, display up to 72–96px (max 6rem on desktop).
- **Editorial / campaign:** ratio 1.414–1.618; one oversized display moment per page.
- **Fluid sizes:** `font-size: clamp(min, preferred-vw + rem, max)`, e.g. h1 `clamp(2.5rem, 1.6rem + 4vw, 5.5rem)`. Never pure `vw` (breaks zoom).
- Max 5–6 distinct sizes on a page; every step must look like a different level.

## 3. Rhythm rules
- Leading goes **down** as size goes up: body 1.5–1.65 · h3 1.25 · h2 1.15 · h1/display 0.95–1.05. Use unitless `line-height`.
- Wider measure needs more leading; narrow columns can tighten.
- Space above a heading > space below it (≈ 2:1), so the heading belongs to what follows.
- Headings: `text-wrap: balance`. Paragraphs: `text-wrap: pretty`.
- Descenders: with leading < 1, add padding-bottom or `overflow: visible` so g/j/p/q/y and Cyrillic descenders (д, ц, щ, у, р) are not clipped.
- Text below 18px stays at weight ≥ 400. Light weights only at display sizes.
- All changing numbers (prices, counters, tables, timers): `font-variant-numeric: tabular-nums`.
- Form inputs ≥ 16px on mobile (iOS zooms below that).
- Real quotes and dashes: “ ” ‘ ’ – — … ; Ukrainian: «лапки» „ “, non-breaking space after one-letter prepositions (в, з, у, і, а) and before em dash.
- All caps only for short labels, always with positive tracking.
- ≤ 3 weights page-wide, chosen as clear extremes (400/700 or 300/800); `font-synthesis: none` so the browser never fakes bold/italic.
- Headline length bands: ≤ 20 characters → full display size; 21–50 → display; 51–90 → smaller or split; > 90 → rewrite. Cap heading measure on the element: h1 ≈ 20ch, h2 ≈ 30ch, h3 ≈ 40ch.
- `…` not `...`; non-breaking space in `10&nbsp;MB`, `⌘&nbsp;K`; loading labels end with `…`.

## 4. Loading (performance is part of typography)
- Self-host **woff2**; subset to needed scripts (`latin`, `latin-ext`, `cyrillic`).
- Prefer one **variable** font file per family over 4–6 static weights.
- `font-display: swap` for body; `optional` for decorative display faces you can live without.
- `<link rel="preload" as="font" type="font/woff2" crossorigin>` for at most 1–2 above-the-fold files.
- Reduce layout shift with a metric-matched fallback: `@font-face { font-family: "X Fallback"; src: local("Arial"); size-adjust: …; ascent-override: …; }` (Next.js `next/font` and Fontaine do this automatically).
- Next.js: `next/font/google` or `next/font/local`. Vite/other: `@fontsource-variable/<family>` packages.
- Never ship more than ~3 families / ~150KB of font data on a marketing page.

## 5. Curated pairings

Sources: **G** = Google Fonts (free, OFL) · **FS** = Fontshare (free for commercial use, Latin-only originals) · **C** = commercial.
To verify Cyrillic programmatically: `https://fonts.google.com/metadata/fonts` → families whose `subsets` include `cyrillic`.
`[Cyr]` = Cyrillic included. For Ukrainian copy, choose from `[Cyr]` rows or verify the "Cyrillic" language filter on Google Fonts.

### Product & SaaS
| Display | Body | Utility | Source | Fits |
|---|---|---|---|---|
| Inter Display 600 | Inter `[Cyr]` | JetBrains Mono `[Cyr]` | G | Dense SaaS, dashboards, dev tools |
| Geist 600 `[Cyr]` | Geist `[Cyr]` | Geist Mono | G | Engineering-grade minimal UI |
| Manrope 700 `[Cyr]` | Manrope `[Cyr]` | IBM Plex Mono `[Cyr]` | G | Friendly B2B, fintech |
| Onest 700 `[Cyr]` | Onest `[Cyr]` | — | G | Consumer apps, Cyrillic-heavy products |
| Arsenal 700 `[Cyr]` | Arsenal `[Cyr]` | — | G | Ukrainian civic, culture and heritage brands (Ukrainian-made, OFL) |
| General Sans 600 | Satoshi | — | FS | Startup marketing (Latin only) |
| Plus Jakarta Sans 700 | Inter `[Cyr]` | — | G | Soft product, onboarding |
| IBM Plex Sans 600 `[Cyr]` | IBM Plex Sans `[Cyr]` | IBM Plex Mono `[Cyr]` | G | Enterprise, data-heavy, technical docs |

### Editorial, luxury, culture
| Display | Body | Utility | Source | Fits |
|---|---|---|---|---|
| Cormorant Garamond 500 `[Cyr]` | Manrope `[Cyr]` | — | G | Luxury, hospitality, jewellery |
| Playfair Display 600 `[Cyr]` | Source Sans 3 `[Cyr]` | — | G | Classic editorial, restaurants |
| Fraunces 600 (SOFT, WONK axes) | Commissioner | — | G | Food, organic, warm brands |
| Instrument Serif 400 | Instrument Sans | — | G | Calm premium headlines |
| Newsreader 500 | Inter `[Cyr]` | — | G | News, longform, essays |
| Literata 600 `[Cyr]` | Literata `[Cyr]` | — | G | Books, reading apps, UA longform |
| EB Garamond 500 `[Cyr]` | Jost `[Cyr]` | — | G | Heritage, publishing, academia |
| Literata 700 `[Cyr]` | Source Sans 3 `[Cyr]` | JetBrains Mono `[Cyr]` | G | Robust Cyrillic editorial |
| Zodiak / Gambetta | Satoshi | — | FS | Contemporary editorial (Latin only) |

### Expressive & display-led
| Display | Body | Utility | Source | Fits |
|---|---|---|---|---|
| Unbounded 700 `[Cyr]` | Onest `[Cyr]` | — | G | Gen-Z, events, Ukrainian campaigns |
| Space Grotesk 700 | Inter `[Cyr]` | Space Mono | G | Tech with attitude, neo-brutalism |
| Bricolage Grotesque 800 | DM Sans | — | G | Indie, creator tools |
| Archivo 900 (wdth 125) | Archivo | — | G | Swiss/industrial, sport |
| Syne 700 | Work Sans | — | G | Studios, art, fashion-tech |
| Clash Display 600 | Switzer | — | FS | Bold startup marketing (Latin only) |
| Big Shoulders Display 800 | IBM Plex Sans `[Cyr]` | — | G | Industrial, logistics, sport |
| Roboto Flex (opsz/wdth/wght) `[Cyr]` | Roboto Flex `[Cyr]` | — | G | Kinetic, variable-axis animation |

### Ukrainian projects — provenance matters
- **Ukrainian-made:** Arsenal (Andrij Shevchenko; Google Fonts, OFL — verified). Also consider KyivType Sans/Serif/Titling (Dmytro Rastvortsev, made for Kyiv's city identity; listed as freeware on MyFonts, but licence terms differ between sources — verify before commercial use) and e-Ukraine (the typeface of Ukraine's state digital services; licence not public — do not use without confirmation).
- **Avoid for Ukrainian brands:** Golos Text and the PT family come from ParaType (Moscow); Golos was commissioned for Russia's state-services portal. Technically fine, symbolically tone-deaf.
- **No Cyrillic** (checked against the Google Fonts catalogue): Space Grotesk, Plus Jakarta Sans, Instrument Sans/Serif, Fraunces, Newsreader, Bricolage Grotesque, DM Sans, Syne, Archivo, Young Serif, Gloock, Hanken Grotesk, Work Sans, Anybody, and the Fontshare originals. Never set Ukrainian text in them — the browser falls back to a system face mid-word.

### Real-world pairings (seen on actual sites — use as calibration, license the real fonts)
Collected from typewolf.com "Site of the Day", fontinlogo.com and the-brandidentity.com:
- Canela + Apercu — Good On You
- Apercu + Tiempos Text — Norwegian Air
- Apercu (solo) — Glossier
- Grenette + Styrene — Daylight
- Cereal — Airbnb (verified on fontinlogo.com)
- Söhne (Klim) — Levrant identity by Studio Bright Green (the-brandidentity.com)
For anything else, look it up live (absolute-designer (references)) instead of guessing: `typewolf.com/<font-slug>` lists sites using a font; `fontsinuse.com/typefaces/<id>/<slug>` lists real uses; `fontinlogo.com/logo/<brand>` names a logo's typeface with a confidence label (Verified / Closest / Modified / Community).

## 6. Defaults that read as AI — choose them only on purpose
- Inter (or Roboto, Arial, system-ui) as the only face on a marketing page.
- Poppins / Montserrat / Open Sans everywhere.
- Playfair Display or Instrument Serif as the "premium" reflex on any brief.
- Space Grotesk / any mono as a costume for "technical" when the content is not data.
- Gradient-filled headline text.
- Same weight for every heading level.

## 7. Type QA (run on the built page)
- [ ] 2–3 families max; each role visibly distinct.
- [ ] Body 16px+ on marketing, 14px+ in apps; measure ≤ 75ch.
- [ ] No clipped descenders/diacritics at any breakpoint (test Ukrainian: «Й», «Ї», «щ», «ґ»).
- [ ] Headline wraps balanced; no orphan single word on the last line of an h1/h2.
- [ ] Numbers tabular where they change or align.
- [ ] ≤ 2 preloaded font files; no FOIT on body text; CLS from fonts ≈ 0.
