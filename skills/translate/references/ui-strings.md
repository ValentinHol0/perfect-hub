# Translate UI Strings

Format syntax per file type: `references/formats.md`. Plural rules with sources: `references/plural-rules.md`.

## 1. Non-negotiable rules
1. **Never change keys, key order, file structure, comments or encoding** (UTF-8, no BOM unless the source has one). Translate values only.
2. **Placeholders are code.** Copy `{name}`, `{{name}}`, `%s`, `%1$s`, `%d`, `%@`, `%lld`, `%(name)s`, `%{name}`, `<0>…</0>`, `<b>…</b>` exactly; reorder them only where the format allows it (named or positional — never plain `%s %d`).
3. **Plurals per target locale, not per source.** English has one/other; Ukrainian and Polish need one/few/many/other (CLDR). In gettext, use the `Plural-Forms` header of the target file (Ukrainian: 3 forms).
4. **The count goes into every form that covers more than one number.** Ukrainian `one` also covers 21, 31, 101 — «{{count}} товар», never «Один товар».
5. **Same source string, different contexts → ask for (or create) separate keys.** "Open" (verb, button) ≠ "Open" (status adjective): «Відкрити» vs «Відкрито». Without context, flag it.
6. **Do not concatenate.** A sentence split across keys (`"You have " + n + " messages"`) cannot be translated correctly — request one key with a placeholder and hand the change to the core.
7. **Length:** respect stated limits; otherwise expect expansion and flag strings above the bands in section 4.
8. **Validate before delivery:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-i18n.mjs" <source> <target>` → exit 0. It checks missing/extra keys, placeholders and tags, printf order, CLDR plural branches (JSON suffixes and ICU), the count in multi-number forms, identical strings, length ratio, Russian letters and Latin look-alikes in Ukrainian. For Android XML and iOS files, convert or review manually with `references/formats.md` (the script covers JSON and .po).

## 2. Procedure
1. Identify the format and the target locale's plural categories: `node -e "console.log(new Intl.PluralRules('uk').resolvedOptions().pluralCategories)"`.
2. Load the glossary; collect UI verbs (Save, Cancel, Delete, Sign in, Continue, Back) and fix one translation each.
3. Translate value by value; for every plural key or ICU plural add the missing categories.
4. Write context notes for ambiguous keys (section 5).
5. Run `check-i18n.mjs`; fix every error; justify or fix every warning.
6. Deliver the file + a short report: counts, decisions, strings needing UI review (length), questions.

## 3. Ukrainian UI microcopy conventions
| Element | Rule | Example |
|---|---|---|
| Buttons, menu items | infinitive verb | Зберегти · Скасувати · Видалити · Увійти · Вийти · Продовжити · Назад |
| Status, toasts | impersonal -но/-то or noun | Збережено · Файл видалено · Помилка з'єднання |
| Errors | what happened + what to do, ви-form | «Не вдалося оплатити. Перевірте дані картки або спробуйте іншу.» |
| Confirmations | question + specific verbs on buttons | «Видалити проєкт?» → [Видалити] [Скасувати], never [Так] [Ні] |
| Placeholders in inputs | example, not instruction | «name@example.com», «+380 XX XXX XX XX» |
| Empty states | what it is + first action | «Тут з'являться ваші замовлення. Перейдіть до каталогу.» |
| Gender | avoid gendered past tense addressed to the user | «Ви увійшли» (plural form, neutral) |
| Capitalisation | sentence case everywhere | «Налаштування сповіщень», not «Налаштування Сповіщень» |
German UI: buttons as infinitives (Speichern, Abbrechen), Sie-form messages. Polish UI: imperative or infinitive buttons (Zapisz, Anuluj), impersonal messages («Zapisano zmiany»).

## 4. Length expansion
Average expansion of English UI text into European languages (W3C, citing IBM — https://www.w3.org/International/articles/article-text-size, checked 2026-11-12):
| English length | Expected size of the translation |
|---|---|
| ≤ 10 characters | 200–300 % |
| 11–20 | 180–200 % |
| 21–30 | 160–180 % |
| 31–50 | 140–160 % |
| 51–70 | 151–170 % (as printed by W3C) |
| > 70 | 130 % |
`check-i18n.mjs` warns above these bands (override with `--max-ratio`). Fixes in order: shorter synonym → restructure → ask design for space → abbreviation only with a glossary entry (W3C advises against abbreviating under space pressure).

## 5. Context notes for translators (deliver with the file)
| key | where it appears | max length | placeholder meaning | notes |
|---|---|---|---|---|
| `checkout.pay` | Pay button on the checkout step | 20 | `{amount}` = formatted price with currency | verb, infinitive |
In-file equivalents: i18next — a parallel `_description` file or comments in the source tool; gettext — `#.` extracted comments and `msgctxt`; Android — `<!-- -->` above the string and `xliff:g` for untranslatable parts; iOS — the `comment` field of the String Catalog.

## 6. Pseudo-localisation (recommend to the core before a release)
Ask the core to run a pseudo-locale build (accented, +40 % length, bracketed: «[Ŝàṽé ŷöûŕ çĥàñĝéš·····]») to catch hard-coded strings, truncation and concatenation before translators start.
