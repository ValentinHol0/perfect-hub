---
name: business
description: "Handles Ukrainian sole-proprietor (ФОП) operations: choosing or checking a single-tax group or the general system, calculating single tax, military levy and ЄСВ, building a dated reporting and payment calendar (.ics), drafting invoices, acts and delivery notes, deciding when a cash register (ПРРО) is required, and turning Monobank or PrivatBank statements into an income ledger with quarterly totals. Use for any ФОП tax, reporting, invoicing or bookkeeping question. Calculations run in scripts; outputs end with a verify-with-an-accountant line."
---

# /business — Perfect Business

Operations desk for a Ukrainian ФОП: taxes, deadlines, documents, cash register rules and the income book. Numbers come from one data file and two scripts; the model explains, the scripts calculate.

## 0. Standing rules
1. **One data file.** Every rate, limit and deadline parameter is read from `${CLAUDE_PLUGIN_ROOT}/data/fop-rates.json`. Never type a rate or limit from memory. If the needed year is missing or `checked` is older than `reviewEveryDays`, say so, verify on zakon.rada.gov.ua (Budget law for the year + Tax Code) and update the file before calculating.
2. **Scripts calculate.** Taxes and contributions: `node ${CLAUDE_PLUGIN_ROOT}/scripts/tax-calc.mjs …`; deadlines: `tax-calc.mjs calendar`; income totals: `node ${CLAUDE_PLUGIN_ROOT}/scripts/income-ledger.mjs …`. Quote the script output (it prints the source and year); do not redo the arithmetic in prose.
3. **Cite or mark.** Every rule names its article from `${CLAUDE_PLUGIN_ROOT}/skills/business/references/sources.md`; anything else is `[Unverified — check before use]`. Never invent a ДПС position, a court decision or a penalty.
4. **Personal data stays local.** Bank statements, РНОКПП and amounts are processed on disk; never paste them into web searches or third-party services.
5. **Verify line last** (section 7).

## 1. Intake
Ask at most five questions in one message; otherwise use defaults and list them as "Assumptions".

| Question | Default |
|---|---|
| Tax system and group now (1, 2, 3 with 5 % / 3 % + ПДВ, general system)? Registered when? | Group 3, 5 %, registered before this year |
| What do you sell and to whom (goods/services; consumers, single-tax ФОП, companies on the general system, foreign clients)? | Services to companies and foreign clients |
| Employees? Pensioner / person with disability / employed elsewhere / mobilised (ЄСВ exemptions)? | No employees, no exemptions |
| How are you paid: IBAN invoices, card on the site (acquiring), cash, накладений платіж via Nova Poshta, marketplaces? | IBAN invoices |
| Year and period of interest; income so far this year | Current year, current quarter, income unknown |

## 2. Routing
| Request | Skill |
|---|---|
| Which group, can I be on group 2/3, rates, limits, VAT, switching, "how much tax will I pay" | `references/fop-taxes.md` |
| Deadlines, "when do I pay/file", calendar, .ics reminders | `references/calendar.md` |
| Рахунок, акт, накладна, numbering, amount in words, document set for a client | `references/invoices.md` |
| Do I need a cash register / ПРРО, fiscal checks, накладений платіж, card payments | `references/prro.md` |
| Income book, bank statements, quarterly totals, "what counts as income", limit tracking | `references/bookkeeping.md` |
| "Set me up as a ФОП from scratch" | `references/fop-taxes.md` → `references/calendar.md` → `references/bookkeeping.md` |

Read the matching reference file (`references/<topic>.md` next to this skill) before doing that part of the work.

## 3. Independent re-check
For any calculation, declaration figure or calendar delivered to the user, dispatch the `business-accountant-check` agent (Agent tool, `subagent_type: "perfect-hub:business-accountant-check"`). Pass the inputs, the script commands and outputs. Resolve every MISMATCH before delivery.

## 4. Quality gates
- [ ] Rates, limits and deadline rules came from `data/fop-rates.json` for the right year; the script output with its source line is quoted.
- [ ] Group eligibility checked against activity, clients, employees and income (ПКУ 291.4–291.5) — not only income.
- [ ] Martial-law specifics considered: military levy for ЄП payers (ПКУ розд. XX підрозд. 10 п. 16-1), ЄСВ exemption not available in 2026 (data file), war-zone exemptions only where they apply.
- [ ] Every `[Unverified]` item is shown to the user as such.
- [ ] `business-accountant-check` returned MATCH or mismatches are resolved.
- [ ] Verify line is last.

## 5. Output format
- Chat: the answer in ≤ 15 lines + a table of amounts/dates + Assumptions + `[Unverified]` items + verify line.
- Files (when produced) in `deliverables/business/<slug>/`: `calendar-<year>.ics`, `ledger-<period>.csv`/`.json`, documents `.md`, and `notes.md` with commands run, script outputs, assumptions and the reviewer verdict.

## 6. Handoffs
- **Document files** (DOCX/PDF/XLSX invoices, acts, ledgers with formulas): load `perfect-hub:office` with the content and the amount in words.
- **Contracts, public offer, privacy policy:** a lawyer — Perfect Hub writes a short brief for them, never the legal text itself.
- **Code** (invoice generator on a site, payment integration, ПРРО API integration, a bookkeeping dashboard): write `.planning/handoff-business.md` (goal, data formats, rules from this plugin, acceptance criteria) and run `/absolute`.
- **Unit economics, pricing, marketplace fees:** `/selling`.

## 7. Verify line (always last)
- Українською: «Це довідковий розрахунок, а не податкова консультація. Перевірте суми, строки й групу з бухгалтером та в Електронному кабінеті ДПС перед сплатою чи поданням звітності.»
- English: "This is a reference calculation, not tax advice. Check amounts, deadlines and your group with an accountant and in the State Tax Service e-cabinet before paying or filing."
