# Translate Text

## 1. Procedure
1. **Read the whole source first.** Note purpose, reader, claims, numbers, names, terms, puns, cultural references and anything ambiguous. Ambiguity that changes meaning → ask, or translate the likeliest reading and note it.
2. **Fix the register** (section 2) and the glossary before writing a line.
3. **Translate by sense units** (sentence or paragraph), not word by word. Re-build the sentence in target syntax.
4. **Apply locale conventions** — `references/locale-conventions.md`.
5. **Self-revise in two passes:** (a) against the source — omissions, additions, numbers, negations, modality (must/may/should); (b) target only, read aloud — anything that sounds translated is rewritten.
6. Run the `references/qa.md` checklist; hand high-stakes texts to `translate-reviewer`.

## 2. Register and address forms
| Language | Formal | Informal | Default and rules |
|---|---|---|---|
| Ukrainian | ви + 2nd person plural verbs | ти | **ви** for business, government, finance, health, B2B, unknown audiences; ти only for youth, gaming or brands whose voice already uses it. Never mix inside one product. Capital «Ви» is a letter-to-one-person courtesy, not a UI style `[Unverified: confirm the capitalisation rule in Правопис 2019 before relying on it]`. |
| German | Sie | du | Sie by default; du for brands that already use it (many consumer apps, sport, fashion). Imperatives on buttons are infinitives: «Speichern», «Abbrechen». |
| Polish | Pan / Pani / Państwo + 3rd person | ty | UI: imperative 2nd person singular or infinitive (Zapisz, Anuluj, Wybierz plik) avoids the choice; letters: «Szanowna Pani», «Szanowny Panie», «Szanowni Państwo». |
| English | — | — | One "you"; register comes from vocabulary and sentence length. Contractions = friendly; none = formal. |

Ukrainian specifics a translator must handle:
- **Vocative case in address.** «Шановна Ірино», «Пане Олеже», «Вітаємо, Олено!». A dynamic name in address position (`Вітаємо, {name}!`) prints the nominative («Олена») — wrong. Rephrase so the name is not an address: «Ви увійшли як {name}», «З поверненням!», or store a vocative form supplied by the user.
- **Gender of the user.** Past-tense verbs carry gender («ти зробив/зробила»). Use ви-forms (plural, gender-neutral), impersonal -но/-то forms («Замовлення відправлено», «Файл збережено»), or nouns («Реєстрація завершена»).
- **Feminitives** (авторка, дизайнерка, керівниця) are standard usage; follow the client's glossary for job titles in official documents.
- **Verbs over nouns.** English nominal chains become verbs: «здійснити оплату» → «оплатити», «проводити перевірку» → «перевіряти».
- **Passive with an agent** («було зроблено командою») sounds translated — use active voice or -но/-то forms («Ці кадри знято в павільйоні»).

## 3. Meaning over form — rules
- Keep the claim, change the wording: idioms, metaphors and jokes get a target equivalent with the same function, or a plain statement — never a literal calque.
- Keep modality exact: must → має/повинен (obligation), may → може (permission/possibility), should → слід/варто. Legal "shall" → «зобов'язаний»/present tense per context — flag it.
- Negation and scope: re-read every sentence with «не», «ні», «жодний» against the source.
- Numbers, dates, prices, names, URLs, codes: copy exactly; convert only the format (section 4), never the value.
- Abbreviations: expand on first use if the target reader would not know them; keep internationally used ones (API, SEO, VAT → «ПДВ» in Ukrainian context).
- Titles and headings: sentence case in uk/pl/de (German capitalises nouns anyway); English title case only if the source style uses it.
- Do not "improve" content. A factual error in the source → translate faithfully and flag it.
- Length: Ukrainian, Polish and German usually run longer than English; when a limit exists, shorten by restructuring, not by dropping meaning.

## 4. Locale conventions (summary — full table and sources in `references/locale-conventions.md`)
| | uk-UA | pl-PL | de-DE | en-US |
|---|---|---|---|---|
| Number | 1 234 567,89 | 1 234 567,89 (1234) | 1.234.567,89 | 1,234,567.89 |
| Money | 1 250,50 грн (CLDR symbol ₴) | 1 250,50 zł | 1.250,50 € | $1,250.50 |
| Date | 12.11.2026 · 12 листопада 2026 р. | 12.11.2026 · 12 listopada 2026 | 12.11.2026 · 12. November 2026 | 11/12/2026 · November 12, 2026 |
| Time | 14:05 | 14:05 | 14:05 | 2:05 PM |
| Quotes | «…» inner „…“ | „…” inner «…» | „…“ inner ‚…‘ | “…” inner ‘…’ |
Separators between digits are non-breaking spaces (U+00A0); keep a non-breaking space between a number and its unit or currency.

## 5. Transcreation (marketing, ads, slogans, subject lines)
1. Extract the **brief from the source**: audience, single message, emotion, call to action, constraints (characters, legal claims, keywords).
2. Write **2–3 variants**: (a) close — same structure, natural target; (b) adapted — same effect, local idiom; (c) bold — new angle within the claim.
3. For each: **back-translation** into the source language + one line on why it works for this market.
4. Check claims: no new promises, superlatives or prices that the source did not make; Ukrainian consumer-protection and advertising rules may restrict comparative or "best" claims — route doubts to a lawyer.
5. Localise offers only with client data: «Безкоштовна доставка від 1 500 грн» only if the client gave that threshold; otherwise keep the source condition and flag it.
6. Market references: Nova Poshta / Ukrposhta, Monobank / PrivatBank, Rozetka / Prom, Diia — use only when the client actually works with them.

## 6. Examples
| Source (EN) | Literal (avoid) | Natural uk-UA |
|---|---|---|
| Your order has been shipped! | Ваше замовлення було відправлене! | Замовлення відправлено! |
| Are you sure you want to delete this file? | Ви впевнені, що хочете видалити цей файл? | Видалити цей файл? (+ кнопки «Видалити» / «Скасувати») |
| Welcome back, {name}! | Ласкаво просимо назад, {name}! | З поверненням! / Ви увійшли як {name} |
| Don't miss out! | Не пропустіть! | Встигніть! |
| Take part in the survey | Прийміть участь в опитуванні | Візьміть участь в опитуванні |
| As a rule, delivery takes 1–2 days | Як правило, доставка займає 1–2 дні | Зазвичай доставка триває 1–2 дні |

Polish: "Save changes" → «Zapisz zmiany»; "Are you sure?" → «Czy na pewno?». German: "Sign in" → «Anmelden»; "Do you really want to delete this file?" → «Möchten Sie diese Datei wirklich löschen?».

## 7. Output
Target text first; then `Translator notes` (| # | Source | Decision | Why |), open questions and `[Unverified]` items; for transcreation the variant table (variant · back-translation · rationale · recommended).
