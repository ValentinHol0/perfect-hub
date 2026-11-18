# Translate Glossary

A termbase decides once what translators would otherwise decide differently every time. It holds terms, not sentences (sentences belong in translation memory).

## 1. What goes in
- Brand, product, feature and plan names (and whether they are translated at all).
- UI verbs and nouns that recur: Sign in, Account, Cart, Checkout, Settings, Subscription, Refund.
- Domain terms with a mandated or established equivalent (legal, medical, banking, tax — Ukrainian official terms from legislation, e.g. «фізична особа — підприємець», «ПДВ»).
- Words that tempt calques (see `references/qa.md/references/russianisms-calques.md`) and false friends (EN "actual" ≠ «актуальний»; "decade" = «десятиліття», not «декада» (10 days); "magazine" = «журнал»; DE "eventuell" = «можливо»).
- Do-not-translate items: trademarks, code identifiers, URLs, product SKUs.
Skip general vocabulary with one obvious translation.

## 2. Format — `glossary.csv` (UTF-8, comma-separated, one row per term and target locale)
| Column | Content |
|---|---|
| `term` | source term exactly as it appears (case-sensitive if it matters) |
| `pos` | noun / verb / adj / name |
| `locale` | target locale, e.g. `uk-UA` |
| `approved` | the approved translation; for nouns also note gender and the genitive plural if irregular |
| `forbidden` | rejected variants separated by `|` |
| `context` | where it is used (UI button, legal text, marketing) |
| `note` | why, source of authority (law, client decision, style guide), date |
| `status` | proposed / approved / deprecated |
| `dnt` | `yes` if the term is not translated |
Example rows:
```csv
term,pos,locale,approved,forbidden,context,note,status,dnt
Sign in,verb,uk-UA,Увійти,Залогінитися|Ввійти в систему,UI button,Infinitive for all buttons,approved,
Checkout,noun,uk-UA,Оформлення замовлення,Чекаут|Каса,UI step title,,approved,
Monobank,name,uk-UA,Monobank,Монобанк,payments,Brand keeps Latin spelling in UI,proposed,yes
sole proprietor,noun,uk-UA,фізична особа — підприємець (ФОП),приватний підприємець|СПД,legal and tax,Term used in Ukrainian tax legislation,approved,
```
Keep the file in the project (`docs/i18n/glossary.csv`) or in `deliverables/translate/<project>/glossary.csv`. Export to TBX or a CAT tool only if the client uses one.

## 3. Building a glossary
1. **Extract** candidates: capitalised phrases, repeated noun phrases (≥ 3 occurrences), UI labels, domain terms, existing translations in the client's live site or app.
2. **Research** each: existing usage in the client's materials, official terminology (legislation on zakon.rada.gov.ua for legal/tax terms, regulator sites), competitors' localised UI for established user expectations. Cite where the decision came from.
3. **Decide** one approved form + forbidden variants; for Ukrainian nouns add the forms that break naive agreement (e.g. «кошик → кошика», «акаунт → акаунта»).
4. **Mark open items** `proposed` and list them for the client; never present a proposal as approved.
5. **Version** the file (date in the note column or a changelog line at the end of the delivery message).

## 4. Consistency check (run on every translation)
1. For every glossary term present in the source, confirm the approved translation appears in the corresponding target segment (allow inflection: match the stem, e.g. `кошик`, `кошика`, `кошику`).
2. Search the whole target for every `forbidden` variant — any hit is an error.
3. Same source term → same target term across all files (UI, emails, help centre, legal).
4. `dnt` terms appear unchanged.
5. Report: | term | expected | found | location | fix |.
Tooling: a simple search is enough for small jobs (Grep for each forbidden variant); for large projects ask the core to add a term check to CI.

## 5. Brand names and transliteration
- Brand and product names stay in the original script unless the brand has an official local form.
- Ukrainian personal and place names in Latin script: use the official transliteration table (Cabinet of Ministers resolution № 55 of 27.01.2010 `[Unverified in this session — check zakon.rada.gov.ua before use]`): Київ → Kyiv, Харків → Kharkiv, Запоріжжя → Zaporizhzhia.
- Inflect foreign names in Ukrainian where grammar requires it, or restructure («у застосунку Monobank»).
