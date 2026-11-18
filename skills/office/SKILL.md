---
name: office
description: "Creates, edits and checks professional office files — Word (DOCX), Excel (XLSX), PowerPoint (PPTX), PDF and HTML slide decks — including Ukrainian business documents (договір, рахунок, акт, видаткова накладна, комерційна пропозиція, звіт) with exact totals and amounts in words. Use when the user asks for a document, spreadsheet, presentation or PDF as a file, wants one fixed or filled, or types /office, /docx, /xlsx, /pptx or /pdf."
---

# /office — Perfect Docs

Entry point of office component. Produces office files that look professional, calculate correctly and pass an independent proofread. Reply in the user’s language; skill text is English, Ukrainian templates are the deliverable.

## 0. Pick the engine (once per session)
1. **Claude Code**: look at your skill list. If Anthropic’s document skills are there — names ending in `:docx`, `:xlsx`, `:pptx`, `:pdf` that do **not** start with `office component:` (e.g. `anthropic-skills:docx`, `document-skills:xlsx`) — load the matching one for file mechanics (creating, editing XML, tracked changes, recalculation, OCR). Then apply this plugin’s domain skill on top: its quality rules, Ukrainian templates and scripts for anything numeric. This plugin’s own `docx`/`xlsx`/`pptx`/`pdf` skills are shortcuts that lead back here — never load them from here.
2. **No built-in document skills**: this plugin’s scripts do the work:

| Script | Does | Needs |
|---|---|---|
| `scripts/uah-words.mjs` | amount → «одна тисяча двісті тридцять чотири гривні 56 копійок» | Node ≥ 18 |
| `scripts/make-docx.py` | invoice / act / waybill DOCX from JSON, totals and VAT computed | python-docx |
| `scripts/make-xlsx.py` | XLSX with live formulas, names, validation, chart, print setup | openpyxl |
| `scripts/make-pptx.py` | 16:9 PPTX from an outline, notes, density warnings | python-pptx |
| `scripts/pdf-tools.py` | PDF info, merge, split, text, form fields, fill, tables | pypdf (+ pdfplumber) |
| `scripts/html-to-pdf.mjs` | HTML document or deck → PDF via Chromium | Playwright or Chrome/Edge/Chromium |
Run them as `python "${CLAUDE_PLUGIN_ROOT}/scripts/<name>"` / `node "${CLAUDE_PLUGIN_ROOT}/scripts/<name>"`. Check the toolchain once: `python -c "import docx, openpyxl, pptx, pypdf"`. A missing library makes the script print its `pip install …` line and exit 3; show it to the user and install only with their OK.

## 1. Intake
Ask at most three questions, in one message, only when the answer changes the file:
1. **What and for whom**: document type, purpose, recipient (client, bank, tax office, management, audience of a talk).
2. **Data**: requisites, items and prices, figures, the text or notes to use — ask the user to paste or point to files (old invoice, contract, company card, CRM export) instead of retyping.
3. **Format and look**: DOCX / PDF / XLSX / PPTX / HTML deck; brand (logo, colours, fonts) or neutral.
For invoices, acts and waybills, also always ask the VAT status (payer or not, prices with or without VAT) — it changes the totals.

Defaults when the user does not say:
| Topic | Default |
|---|---|
| Language | the user’s language; Ukrainian for documents to Ukrainian counterparties |
| Page | A4 portrait; margins 20/10/20/30 mm (top/right/bottom/left); official orders and letters → ДСТУ 4163 profile (references/docx.md) |
| Fonts | Times New Roman (official), Arial or Calibri (business); Cyrillic-capable fonts only |
| Money | UAH; «15 000,00 грн» in documents, «₴» on slides; amounts in words from `uah-words.mjs` |
| Dates | «12 листопада 2026 р.» in text, 12.11.2026 in tables |
| Slides | 16:9, one idea per slide, speaker notes for talk decks |
| Output folder | `deliverables/docs/` (create it), Latin file names: `rakhunok-104-2026-11-12.docx` |
Rulings without asking: never invent requisites, codes, IBANs, names, prices, statistics or quotes — leave visible placeholders `[ЄДРПОУ покупця]` and list them; never guess document numbers; legal wording beyond the skeletons and tax decisions are handed off (§5).

## 2. Route
| The request is about… | Load | Typical output |
|---|---|---|
| Рахунок, акт, видаткова накладна, договір (послуги, поставка), комерційна пропозиція, звіт | `references/templates.md` (+ `references/docx.md` for layout) | DOCX via `make-docx.py`, PDF copy |
| Any Word document: letter, order, policy, manual, CV, report; editing or filling a .docx; ДСТУ 4163 formatting | `references/docx.md` | DOCX |
| Spreadsheet: budget, estimate, price list, payment schedule, register, KPI table, CSV cleanup | `references/xlsx.md` | XLSX via `make-xlsx.py` |
| Presentation: pitch, report deck, training, HTML slides, PPTX → HTML | `references/pptx.md` | PPTX via `make-pptx.py` or HTML deck + PDF |
| PDF: create from HTML/DOCX, fill a form, merge/split, extract text or tables, OCR, redaction | `references/pdf.md` | PDF |
| A file plus numbers (e.g. invoice + payment schedule) | `references/templates.md` + `references/xlsx.md` | DOCX + XLSX that agree to the kopiyka |
Read the matching reference file (`references/<topic>.md` next to this skill) before doing that part of the work.

## 3. Workflow
1. **Classify** the request with §2; state the plan in one line («Акт № 27 у DOCX + PDF, без ПДВ, дані з договору № 7»).
2. **Collect data** into a JSON or outline file saved next to the deliverable — the audit trail for every number.
3. **Generate** with the built-in skill or the script; amounts, VAT and words always come from a script, never from mental arithmetic.
4. **Look at it**: render to PDF/PNG (Word, Excel, PowerPoint via PowerShell COM on Windows; `soffice --headless --convert-to pdf` elsewhere; `html-to-pdf.mjs` for HTML) and inspect pages.
5. **Proofread independently**: dispatch the `docs-proofreader` agent for any document with money, legal effect, more than 5 pages, or a deck for an external audience. `Agent` with `subagent_type: "perfect-hub:docs-proofreader"`. Give it the file path, the data JSON, the document type and the expected totals. Fix every FAIL, re-run until PASS.
6. **Deliver** (§6).

## 4. Quality gates — all must pass before delivery
- **Numbers**: line sums, subtotals, VAT and totals recomputed by script; figures equal words; the same amount is identical in every file (DOCX, XLSX, PDF, e-mail text).
- **Required fields**: per `references/templates.md` (Law 996-XIV ст. 9 for primary documents); none silently missing.
- **Structure**: styles not manual formatting; tables with repeated headers; page numbers as fields; slides within density limits.
- **Typography**: «», ’, —, no-break spaces between numbers and units, word-numeric dates — check list in `references/docx.md/references/ukrainian-typography.md` §6.
- **Rendering**: opened and looked at; no overflow, no fallback fonts, no `[placeholders]` left unless reported.
- **Sources**: legal and tax statements cite `references/templates/legal-basis.md` or are marked [Unverified]; such documents end with the verify-with-a-professional line.
- **Privacy**: no personal data in metadata; client files never uploaded to online converters.

## 5. Handoffs
Every part of Perfect Hub is available here: load the target skill with the Skill tool (`perfect-hub:<skill>`) and a brief (goal, inputs, constraints, acceptance criteria); code, sites and integrations go to the core through `.planning/handoff-<component>.md` and `/absolute`.
| Need | Goes to | Brief file |
|---|---|---|
| Website, landing, web calculator, CRM/1C integration, auto-generating documents from an app, any code | core `/absolute` (perfect-hub) | `.planning/handoff-docs.md` |
| Contract wording, liability, penalties, disputes, offer/privacy/terms for a site | a lawyer (Perfect Hub has no legal component) | brief in `deliverables/office/<slug>/brief-lawyer.md` |
| ФОП group, single tax, ЄСВ, VAT registration, податкова накладна, ПРРО, bookkeeping | perfect-business `/business` (`/fop`) | `.planning/handoff-docs-to-business.md` |
| Logo, brand identity, ad creatives, product imagery for a deck | `/brand` `/brand` | `.planning/handoff-docs-to-brand.md` |
| Second-language version of a document or deck | perfect-translate `/translate` | `.planning/handoff-docs-to-translate.md` |
| Market numbers or competitor data that must be researched and cited | perfect-research `/research` | `.planning/handoff-docs-to-research.md` |
A brief contains: goal, audience, content and data already collected, constraints (format, deadline, brand, language), files, acceptance criteria. The core brief additionally lists the documents the code must produce and points to this plugin’s scripts as the reference implementation of totals and words.

## 6. Output
Reply in the user’s language, short:
```
Готово: deliverables/docs/akt-27-2026-10-31.docx (+ .pdf, дані: akt-27-2026-10-31.json)
Зміст: акт надання послуг № 27, 3 позиції, 27 345,56 грн без ПДВ
Перевірка: підсумки і сума прописом — скрипт; docs-proofreader — PASS; візуально — 1 сторінка
Відкрите: [ЄДРПОУ замовника] — надішліть, і я оновлю файл
[for legal/tax documents] Перевірте з юристом / бухгалтером перед використанням: норми змінюються, а цей документ не є юридичною чи податковою консультацією.
```
