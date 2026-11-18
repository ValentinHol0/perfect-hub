# Translate QA

Review against the source, not just the target. A fluent text that says something else is the worst defect.

## 1. Run order
1. **Files first, mechanically:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-i18n.mjs" <source> <target> [--json]` for JSON and .po. Every ERROR is at least major. Android/iOS files: apply section 2F by hand.
2. **Segment-by-segment comparison** (sections 2A–2E).
3. **Target-only read-through** aloud for fluency and typography (2F–2G).
4. **Glossary pass** (`references/glossary.md` section 4).
5. **Report** (section 4). For high-stakes text, the `translate-reviewer` agent adds an independent back-translation spot check.

## 2. Checklist
**A. Accuracy**
- [ ] No omissions: every sentence, list item, footnote, disclaimer, alt text and button present.
- [ ] No additions: no new claims, softeners or intensifiers.
- [ ] Negations, modality (must/may/should), conditions (if/unless) and scope preserved.
- [ ] Numbers, prices, percentages, dates, times, units, phone numbers, IDs, URLs identical in value; only format localised.
- [ ] Names of people, products, laws and organisations correct and consistent.
- [ ] Nothing left untranslated unless it is a do-not-translate item.

**B. Terminology**
- [ ] Glossary terms used; no forbidden variants; one source term → one target term throughout.
- [ ] Domain terms match the official terminology of the field (legislation, regulator, standard).

**C. Grammar and fluency (Ukrainian focus)**
- [ ] Agreement after numerals: 1 день · 2–4 дні · 5–20 днів · 21 день · 1,5 дня.
- [ ] Vocative in address («Пане Андрію», «Шановна Олено»); dynamic names not placed in address position.
- [ ] Case government: «дякую вам» (dative), «зрадити когось» (accusative); other prepositional patterns per the reference list.
- [ ] No active present participles in -уч-/-юч- used as adjectives («виступаючі» → «ті, хто виступає»).
- [ ] Verbs over noun chains; active voice or -но/-то forms instead of passive with an agent.

**D. Register and style**
- [ ] One address form (ви/ти) and tone across the product; matches the brief.
- [ ] No Russianisms or calques — scan with `references/russianisms-calques.md`.
- [ ] No English calques: "Please find attached" → «Надсилаю…/У додатку…»; "address the issue" → «розв'язати проблему»; "actual" ≠ «актуальний» (= relevant) — use «фактичний/справжній».
- [ ] Marketing: the same effect and call to action as the source, natural for the market.

**E. Locale conventions** (`references/text.md/references/locale-conventions.md`)
- [ ] Number and date formats, currency position and symbol, 24-hour time, units.

**F. Technical (files and UI)**
- [ ] Keys unchanged; placeholders and tags intact; printf order kept unless positional.
- [ ] All CLDR plural categories present; forms that cover many numbers contain the count.
- [ ] Length within limits or flagged; no truncation in screenshots if available.
- [ ] Encoding UTF-8; Android escapes (`\'`, `\"`), iOS `.strings` syntax (`"key" = "value";`).

**G. Ukrainian typography**
- [ ] Quotes «…», nested „…“; no straight "…" around Ukrainian text.
- [ ] One apostrophe character across the project (house default ’ U+2019); apostrophe placement per Правопис 2019 § 7 (б’ю, п’ять, бур’ян, but буряк, свято).
- [ ] No Russian letters ы э ъ ё; no Latin look-alikes inside Cyrillic words (i/і, a/а, o/о, e/е, c/с, p/р, x/х, y/у) — the script flags both.
- [ ] Ґ where the word requires it (ґанок, ґудзик, ґрунт).
- [ ] Dash — with spaces between clauses; – without spaces in ranges (10–12 %, 9:00–18:00); hyphen only inside words.
- [ ] Non-breaking spaces inside numbers, before units/currency (100 грн), after № and between initials and surname.
- [ ] Sentence case in headings, buttons and menu items.

## 3. Severity
| Severity | Definition | Examples |
|---|---|---|
| Critical | changes meaning with legal, financial, safety or reputational risk; breaks the product | wrong price or dosage; negation lost; broken placeholder that crashes or leaks code; offensive wording |
| Major | wrong but not dangerous; a native reader notices | wrong term; grammar error; wrong register; missing plural form; Russianism in public copy |
| Minor | style or typography | quotes, dashes, a clumsy but correct phrase |
Release rule: 0 critical and 0 major. Minors are listed and fixed when cheap.

## 4. Report format
```markdown
# Translation QA: <project> — <source> → <target>
Verdict: PASS | FIX | RETRANSLATE      check-i18n: 0 errors · 2 warnings
Counts: critical 0 · major 3 · minor 7      Sample: 100 % of 240 segments

| # | Key / location | Category | Severity | Source | Target | Fix |
|---|---|---|---|---|---|---|
| 1 | checkout.pay | Accuracy | Critical | Pay {amount} now | Сплатити зараз | Сплатити {amount} зараз |
```
RETRANSLATE when major defects are systemic (> 1 per 10 segments, or wrong register throughout); FIX otherwise; PASS only at 0 critical and 0 major. Always deliver the corrected text or file, not only the report, unless the user asked for a review only.
