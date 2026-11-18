# Locale conventions — uk-UA, pl-PL, de-DE, en-US, en-GB

Data below is CLDR output, produced on 2026-11-12 with Node 22.20 (ICU 77.1, CLDR 47) through `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.PluralRules` and `Intl.ListFormat`, plus the CLDR delimiter files. Re-generate any row with one line of Node instead of trusting memory:
```js
new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(1250.5) // '1 250,50 ₴'
```

## Numbers
| Locale | 1234567.89 | 1234 | 25 % | Group separator | Decimal |
|---|---|---|---|---|---|
| uk-UA | 1 234 567,89 | 1 234 | 25% | U+00A0 no-break space | comma |
| pl-PL | 1 234 567,89 | 1234 (no grouping for 4 digits) | 25% | U+00A0 | comma |
| de-DE | 1.234.567,89 | 1.234 | 25 % (U+00A0 before %) | full stop | comma |
| en-US / en-GB | 1,234,567.89 | 1,234 | 25% | comma | full stop |
Rules: never leave a breakable space inside a number; the decimal separator is part of meaning (de «1.250» = one thousand two hundred fifty, not 1.25).

## Currency
| Locale | `Intl` default | In running text |
|---|---|---|
| uk-UA | 1 250,50 ₴ (symbol after the number, U+00A0 before it) | «1 250,50 грн» is the common abbreviation in documents and prices `[convention — follow the client's style]`; code UAH in finance/accounting contexts; full name «української гривні» via `currencyDisplay: 'name'` |
| pl-PL | 1 234,56 zł | zł after the amount |
| de-DE | 1.234,56 € | € after the amount with a space |
| en-US | $1,234.56 | symbol before, no space |
| en-GB with USD | US$1,234,567.89 | disambiguated symbol |
Never convert currencies or round prices in translation; a localised price is a business decision.

## Dates and time (12 November 2026, 14:05)
| Locale | Short | Long | Full | Time |
|---|---|---|---|---|
| uk-UA | 12.11.2026 | 12 листопада 2026 р. | четвер, 12 листопада 2026 р. | 14:05 |
| pl-PL | 12.11.2026 | 12 listopada 2026 | czwartek, 12 listopada 2026 | 14:05 |
| de-DE | 12.11.2026 | 12. November 2026 | Donnerstag, 12. November 2026 | 14:05 |
| en-US | 11/12/2026 | November 12, 2026 | — | 2:05 PM |
| en-GB | 12/11/2026 | 12 November 2026 | — | 14:05 |
Notes: Ukrainian, Polish and German month names in dates are in the genitive (листопада, listopada); weekday and month names are lowercase in uk and pl, capitalised in de and en. An ambiguous numeric date (03/04/2026) in an EN source must be resolved before translation — ask.

## Quotation marks (CLDR `delimiters.json`, checked 2026-11-12)
| Locale | Primary | Nested | Source |
|---|---|---|---|
| uk | «…» | „…“ | https://cdn.jsdelivr.net/npm/cldr-misc-full@47.0.0/main/uk/delimiters.json |
| pl | „…” | «…» | https://cdn.jsdelivr.net/npm/cldr-misc-full@47.0.0/main/pl/delimiters.json |
| de | „…“ | ‚…‘ | https://cdn.jsdelivr.net/npm/cldr-misc-full@47.0.0/main/de/delimiters.json |
| en | “…” | ‘…’ | https://cdn.jsdelivr.net/npm/cldr-misc-full@47.0.0/main/en/delimiters.json |
British publishers often start with single quotes ‘…’ — follow the client's style guide.

## Lists and plurals
- `new Intl.ListFormat('uk', { type: 'conjunction' }).format(['a','b','c'])` → «a, b і c» (no comma before «і»).
- Plural categories (CLDR): uk, pl — one/few/many/other; de, en — one/other. Details: `../../translate-ui-strings/references/plural-rules.md`.

## Ukrainian typography that translators must apply
- Apostrophe: one character across the project; house default ’ (U+2019). Spelling rules for where it is written: Правопис 2019, § 7 (after б, п, в, м, ф and р before я, ю, є, ї; after prefixes and first parts of compounds ending in a hard consonant) — text checked at https://2019.pravopys.net/sections/7/ on 2026-11-12 (unofficial mirror of the official edition; official PDF: https://mon.gov.ua/static-objects/mon/sites/1/zagalna%20serednya/Pravopys.2019/ukr.pravopys-2019.pdf — returned HTTP 403 to automated fetch).
- Dashes: em dash — with spaces between parts of a sentence; en dash – without spaces in ranges (1–2 дні, 9:00–18:00).
- Non-breaking space: inside numbers, between number and unit/currency (5 кг, 100 грн), after «№» and «§», between initials and surname (Т. Г. Шевченко), after one-letter words at line start in print (в, і, з, у, а, о) `[typographic convention]`.
- Abbreviations: «р.» (рік), «тис.», «млн», «млрд», «грн», «коп.» — with a non-breaking space before them `[Unverified: confirm the period/no-period forms against the graphic-abbreviation rules of Правопис 2019]`.

## Units and formats in Ukraine
Metric units; 24-hour time; week starts Monday; phone numbers +380 XX XXX XX XX `[format convention]`.
