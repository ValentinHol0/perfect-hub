# Brand book — section templates

Each section: **purpose · required content · example rule**. Example rules are illustrations; write the brand's own.

## Logo usage
- Required: version matrix (horizontal, stacked, symbol, wordmark, small mark) × context (site header, avatar, packaging, document, embroidery, stamp); construction note; clear space; minimum sizes; backgrounds; don'ts.
- Example rules:
  - "Clear space on every side = the height of the symbol's inner counter (1×). Nothing — text, edges, other logos — enters it."
  - "Minimum width: horizontal lockup 96 px / 28 mm; symbol 16 px / 6 mm. Below 48 px use `symbol-small.svg`."
  - "On photos: place only on calm areas with ≥ 4.5:1 contrast behind the logo; otherwise use the mono white logo on a 40 % ink scrim."
- Don'ts (show crossed out): stretched · rotated · recoloured · outlined · with shadow/glow · on busy background · rearranged lockup · retyped wordmark · symbol inside a new container shape.

## Clear space and placement
- Diagram with the named unit drawn around the logo.
- Placement grid for common formats: top-left or bottom-right corner inset = 1 unit of the layout margin; one logo per surface; never two lockups side by side.

## Colour
| Name | Role | HEX | RGB | CMYK | Pantone | Use |
|---|---|---|---|---|---|---|
| e.g. Forest | primary | #0E3B2E | 14 59 46 | (from the printer's profile) | (closest, proof on press) | backgrounds, logo |
Rules: proportion (e.g. 60 % neutrals, 30 % primary, 10 % accent); accent never as body text colour unless it passes 4.5:1; digital vs print values (CMYK is device-dependent — get the printer's profile; mark values "approximate, proof on press").

Contrast results (paste `contrast.mjs` output):
| Text / UI | On | Ratio | Normal text AA (4.5) | Large text / UI AA (3.0) | Verdict |
|---|---|---|---|---|---|
List allowed combinations as a matrix and forbidden ones explicitly ("Lime on white — forbidden for text").

## Typography
- Roles: Display (headlines), Text (body), UI/Utility (labels, numbers), Mono (code/data) — face, weights, sizes, line height, tracking per role.
- Scale example: 12 · 14 · 16 · 20 · 24 · 32 · 48 · 64 px (web) / pt equivalents for print.
- Cyrillic: specimen line per face — "Ґанок, їжак, Євген і бджоли: «№ 7 — 1 299 ₴»" — rendered from the actual font files.
- Licences: per face (OFL / commercial seat count / web views), where files live, fallback faces for Word/Google Docs/Canva.
- Ukrainian typography: «ялинки» quotes as primary, „лапки" for nested; apostrophe ’ (U+2019) or ' consistently; em dash with spaces " — " in sentences; non-breaking space between number and unit/currency ("1 299 грн", "20 %"); no hanging one-letter prepositions (в, з, у, і, а) at line ends in large type.

## Graphic device
Construction (derived from the logo), 3 applications (e.g. a crop used as a frame on posts, a pattern on packaging, a divider on the site), what it must never become (wallpaper on everything).

## Imagery
- Photography: light (e.g. "soft daylight from one side, no flash"), framing ("product fills ⅓, generous negative space for copy"), subject ("real hands, real use; no stock handshakes"), grading ("warm, low saturation, deep greens").
- Illustration (if used): style, stroke, palette subset, level of detail.
- AI-generated images: allowed for mood and backgrounds; labelled internally; never presented as real photos of the product, team, premises or customers; platform AI-disclosure labels applied where required.
- 3 do / 3 don't with images.

## Voice and tone
- Principles (3), each with a "we say / we don't say" pair. Example for a delivery brand:
  | Principle | Ми пишемо | Ми не пишемо |
  |---|---|---|
  | Точно | «Доставимо завтра до 18:00» | «Доставимо найближчим часом» |
  | По-людськи | «Не встигли — повернемо гроші за доставку» | «Приносимо вибачення за незручності» |
  | Коротко | «Трек-номер уже в Viber» | «Повідомляємо, що трек-номер було надіслано» |
- Address form: «ви» (lowercase, plural/general) in social and ads; «Ви» (capital) only in personal letters to one person; or «ти» for youth brands — pick one and keep it.
- Feminitives: modern Ukrainian usage supports them (авторка, дизайнерка); decide policy once.
- Vocabulary: preferred terms, banned words (clichés, Russianisms — see the social component's Ukrainian copy rules), emoji policy, hashtag policy.

## Applications
For each: real format and size, safe zone, logo placement, type sizes, example. Typical Ukrainian set: Instagram post 1080×1350 and story 1080×1920, Telegram channel post image, marketplace card (Rozetka/Prom — check the marketplace's current image requirements), Nova Poshta box sticker (A6 is a common label size — confirm with the printer), business card 90×50 mm (common Ukrainian size — confirm with the printer), email signature, invoice/act header (hand to `/office`).

## Files and contacts
Folder map, naming rules, version (SemVer or date), approver, change log.
