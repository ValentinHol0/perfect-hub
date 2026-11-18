# Brief, research routes and name checks

URL patterns re-used from the core's reference library (`absolute-designer (references)/references/sources.md`, verified November 2026). Access notes: all four sites below are free and readable with WebFetch / `read_url_content`.

## 1. Brief template (copy into `deliverables/brand/<slug>/brief.md`)
```
Name:                      (Cyrillic / Latin spelling, pronunciation)
Offer (one sentence):      what it sells or does, for whom
Market and language:       Ukraine (UA copy) / + EU / global
Audience:                  who buys, age range, context of use, price sensitivity
Price position:            economy / mid / premium
Personality (3 words):     e.g. точний, теплий, сміливий
Anti-words (3):            what it must never feel like, e.g. дешевий, корпоративний, дитячий
Competitors (3–5):         names + links
Category convention:       (filled after research)
Logo type wanted:          wordmark / symbol + text / lettermark / emblem / no preference
Must keep:                 existing assets, colours, equity
Applications:              favicon 16 px, app icon, avatar, site header, packaging, signage, uniform, Nova Poshta box sticker, marketplace card, social templates, ads
Deadline and budget:       incl. font licences (free OFL only vs. paid)
Decision maker:            who approves
```

## 2. Research routes
| Need | Where | URL pattern | Take |
|---|---|---|---|
| Competitor typefaces and brand colours | fontinlogo.com | `/logo/<brand>` · `/industry/<slug>` · `/font/<slug>` | Font with confidence label (Verified · Modified · Based On · Closest Font · Community Suggestion) and hex. Treat "Closest" as approximate. |
| Logo vocabulary and category scan | logosystem.co | `/logos/<category>` (e.g. `/logos/wordmark`, `/logos/geometric`) · `/?q=<term>` · `/?moods=Elegant` · `/app-icons` · `/animated` | Type, style, shape, mood terms for the brief; 6–10 references. Logos belong to their owners. |
| Full identity case studies | the-brandidentity.com | `/search?filter=tag_application:<Logo, Wordmark, Packaging, Website, Poster>` + `tag_industry:` + `tag_aesthetic:<Minimalist, Editorial, Elegant>` + `tag_colour:` · `/project/<slug>` | How the system extends: lede → brief → idea → logotype → palette → type → imagery → applications → credits; the typeface and foundry credit. |
| Type in real identities | fontsinuse.com | Formats → Branding/Identity `/in/2/formats/<id>/<slug>` · `/typefaces/<id>/<slug>` · `/uses/<id>/<slug>` | Which faces a category actually uses — to follow or to avoid. |
| Cyrillic coverage | fonts.google.com | `https://fonts.google.com/metadata/fonts` (JSON; `subsets` contains `cyrillic`) | Verify before proposing a face for Ukrainian copy. |

## 3. Competitor audit table (`research.md`)
| Brand | Logo type | Typeface (source) | Colours | Symbol idea | Convention it follows | Gap we can own |
|---|---|---|---|---|---|---|
Fill 5–8 rows, then write: **Category convention** (one line) · **Keep** (trust signals the audience expects) · **Break** (where to differ: colour family, type genre, symbol logic, tone).

## 4. Moodboard entry format
`<URL> — take: <structure / ratio / type pairing / device / colour logic> — not: <what would be copying or off-brief>`
3–6 entries. A moodboard is quality training, never a template: never reuse an exact logo, name, slogan, composition or unique asset.

## 5. Name checks (sanity, not legal clearance)
| Check | Where |
|---|---|
| Ukrainian trademarks (applications and registrations) | `https://sis.nipo.gov.ua/uk/search/simple/` (UKRNOIVI information system; recommended for a pre-filing search in Ukrpatent's practical guide) |
| International marks | WIPO Global Brand Database `https://branddb.wipo.int`, TMview `https://www.tmdn.org/tmview` |
| Domains | `.ua`, `.com.ua`, `.com` availability via a registrar's WHOIS |
| Handles | instagram.com/<handle>, t.me/<handle>, tiktok.com/@<handle> |
Search exact name, partial word and transliterated spellings. Report findings only; a lawyer decides on registrability — verify with a qualified IP lawyer before filing.

## 6. Transliteration (Ukrainian → Latin)
Official system: Cabinet of Ministers Resolution No. 55 of 27.01.2010 "Про впорядкування транслітерації українського алфавіту латиницею", `https://zakon.rada.gov.ua/laws/show/55-2010-п` (checked 2026-11-12). Common cases: Г → h, Ґ → g, Ж → zh, И → y, Х → kh, Ц → ts, Ч → ch, Ш → sh, Щ → shch; Є/Ї/Й/Ю/Я have word-initial forms (ye, yi, y, yu, ya) and other forms (ie, i, i, iu, ia); the soft sign and apostrophe are dropped; "зг" → zgh. Check the resolution's table for edge cases before fixing a Latin brand spelling.
