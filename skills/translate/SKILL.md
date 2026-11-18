---
name: translate
description: "Localises text and products between Ukrainian, English, Polish, German and other languages so they read native - register-adapted translation, marketing transcreation, i18n string files (i18next JSON, ICU, gettext .po, Android, iOS), brand termbases and translation QA with a back-translation review. Use when the user asks to translate, localise or adapt copy for another market, build a glossary, or check a translation or a locale file. Entry point of translate component."
argument-hint: "[what to translate, from which language into which]"
---

# /translate — Perfect Translate

Localisation transfers meaning, intent, register and market conventions — not words. The reader must not notice that the text was translated. This component owns translation content and its QA; wiring i18n into code belongs to the core, legal validity to a lawyer.

## 1. Intake
Ask at most 3 questions, and only those whose answer changes the output:
1. **Locales:** source → target, with the variant (uk-UA; en-US vs en-GB; de-DE vs de-AT/de-CH; pl-PL).
2. **Reader and register:** who reads it, which address form (ви/ти, Sie/du, Pan/Pani/Państwo vs ty), brand-voice document if any.
3. **Constraints:** channel and character limits, existing glossary/termbase or translation memory, legal or regulatory weight.

Rulings when you do not ask (state them in the notes):
| Unknown | Default |
|---|---|
| Target variant | uk-UA · en-US (en-GB when the audience is British or the source uses British spelling) · de-DE · pl-PL |
| Address form | Ukrainian: ви, lowercase in UI and marketing · German: Sie (du only if the brand already uses it) · Polish: impersonal/imperative UI (Zapisz, Anuluj), Pan/Pani/Państwo in letters · English: you |
| Spelling norm | Ukrainian: Український правопис 2019 (Cabinet resolution № 437 of 22.05.2019) · German: reformed spelling (de-CH: ss, no ß) |
| Money | keep the source currency and amount; never convert or invent a local price — ask or flag |
| Units | metric for uk/pl/de; for en-US keep the source unit and flag if a conversion is needed |
| Brand and product names | keep in Latin script unless the glossary says otherwise |
| No glossary | for 5+ recurring terms, draft one with `references/glossary.md` and deliver it with the job |

## 2. Routing
| Request | Skill |
|---|---|
| Prose: articles, emails, product cards, docs, letters, presentations, slogans, ads, landing copy | `references/text.md` |
| Locale files and UI strings: JSON/i18next, ICU, .po, Android `strings.xml`, iOS `.strings`/`.xcstrings`, store listings with limits | `references/ui-strings.md` |
| Terminology: termbase, "how do we always translate X", consistency audit | `references/glossary.md` |
| Check, proofread or score a translation or a locale file | `references/qa.md` (+ `check-i18n.mjs` for files) |
| Localise a whole product (UI + site + emails) | glossary → ui-strings + text → qa → `translate-reviewer` |

## 3. Workflow
1. **Classify the text** — strategy follows function:
   | Type | Strategy |
   |---|---|
   | Informative (docs, help, product facts) | faithful meaning, target syntax, zero additions |
   | Persuasive (ads, landing, slogans, email subject lines) | transcreation: same effect and claim, new wording; 2–3 variants |
   | UI and microcopy | shortest natural form, consistent verbs, length limits, placeholders intact |
   | Legal, regulatory, medical, financial | conservative and terminologically exact; flag every ambiguity; no "improvement" of content |
2. **Terminology first:** load the glossary (project `glossary.csv` or `deliverables/translate/<project>/glossary.csv`); if none, extract recurring terms before translating.
3. **Translate** with the routed skill.
4. **QA:** run the `references/qa.md` checklist; for locale files run `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-i18n.mjs" <source> <target>` and fix until exit 0.
5. **Independent review** — dispatch the `translate-reviewer` agent (Agent tool, `subagent_type: "perfect-hub:translate-reviewer"`) when the text is legal/medical/financial, public launch copy, a UI release, longer than about 1,500 words, or the user asks. Give it source, target, locale pair, glossary and the brief — not your reasoning.
6. **Deliver** (section 5).

## 4. Quality gates (all must hold before delivery)
- [ ] Meaning: nothing omitted or added; every number, date, amount, name, unit and URL identical in value.
- [ ] One register and address form across the whole product.
- [ ] Glossary terms used; forbidden variants absent.
- [ ] Target-locale conventions for numbers, dates, currency, quotes (`references/text.md/references/locale-conventions.md`).
- [ ] Placeholders, markup and plural forms complete; `check-i18n.mjs` exits 0 for files.
- [ ] Ukrainian: no Russianisms or calques from `references/qa.md/references/russianisms-calques.md`; «…» quotes; one apostrophe character; no Russian letters (ы э ъ ё) and no Latin look-alikes inside Cyrillic words.
- [ ] Native-editor test: read it aloud — anything a native editor would rewrite is rewritten.
- [ ] Every uncertainty is a note or a question, never a silent guess.

## 5. Output
- **Text:** the clean target text first (ready to paste), then `Translator notes`: | # | Source fragment | Decision | Why |, open questions, `[Unverified]` items.
- **Files:** same format, structure and key order as the source, saved next to it as `<locale>.<ext>` or in `deliverables/translate/<slug>/`, plus the check-i18n summary line.
- **Transcreation:** 2–3 variants, each with a back-translation and one line of rationale; recommend one.
- **Legal, regulatory, medical or financial text:** end with "Working translation — have it verified by a qualified lawyer or certified translator before official use."
- Reply in the user's language; the deliverable is in the target language.

## 6. Handoffs
- **Core `/absolute`** — anything in code: i18n library setup (i18next, ICU, gettext), extracting hard-coded strings, locale routing and `hreflang`, `Intl` date/number formatting, RTL, pseudo-localisation in CI. Write `.planning/handoff-translate.md` (goal, locales, file paths and formats, key naming, plural/format rules from `references/ui-strings.md`, acceptance: `check-i18n.mjs` exits 0 and no hard-coded user-facing strings) and run `/absolute`.
- **Other components** (load the skill `perfect-hub:<skill>` with a brief):
  `/marketing` — source copy and per-market keyword research (keywords are researched, never translated) · `/office` — translated DOCX/PPTX/XLSX with layout · a lawyer — adapting legal documents to another jurisdiction (translation is not adaptation) · `/brand` — text inside images and logos · `/social` — localised posts and captions.
