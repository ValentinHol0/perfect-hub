# Income book from bank statements

## 1. What the law requires
- Groups 1–2 and non-VAT group 3 keep income records in free form, by month (ПКУ 296.1 абз. 1), on paper and/or electronically, incl. in the ДПС e-cabinet (296.1 абз. 4). Group 3 VAT payers keep income and expenses in the Ministry of Finance form (296.1 абз. 2) — out of scope; accountant.
- Income = money received; date = date it reaches the account or cash (ПКУ 292.1, 292.6); foreign currency at the NBU rate of that date (292.5); exclusions in 292.1 п. 1 and 292.11 (see `references/fop-taxes.md` section 2).
- Keep supporting documents ≥ 1095 days (ПКУ 44.3.3).

## 2. Get the statements (user does this; you never log in to banks)
- monobank: export the ФОП account statement for the period as CSV from the app/web, or use the personal API (`/personal/statement/{account}/{from}/{to}`, amounts in kopecks, `counterEdrpou`/`counterIban`/`counterName` present for ФОП accounts — documented at api.monobank.ua) `[Unverified: exact export menu path and CSV column names]`.
- PrivatBank: export the account statement from Privat24 for Business as CSV `[Unverified: menu path and column names]`.
- Every account that receives business money: ФОП UAH account, currency account, acquiring settlement account, cash register Z-reports if cash is accepted.
Statements contain personal data: process locally, store under `deliverables/business/ledger/` only if the user agrees, never paste them into web tools.

## 3. Run
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/income-ledger.mjs --in mono.csv --in privat.csv \
  --self "Прізвище Ім'я" --self-id 1234567890 --rates nbu-rates.json \
  --group 3 --year 2026 --out deliverables/business/ledger/ledger-2026.csv
```
- CSV headers are auto-detected from one list of monobank/PrivatBank/generic names; `--preset mono-api` (or a `.json` file) reads monobank API output; `--map "date=…,amount=…,description=…"` when headers differ. The summary prints the detected column mapping — **show it to the user and confirm** before trusting totals. Split columns are supported (`credit=…,debit=…`). `--delimiter`, `--decimal`, `--date-order` override detection.
- `--self` / `--self-id` (the ФОП's own name / РНОКПП) mark transfers from the owner's personal accounts as own funds.
- `--rates` JSON `{ "USD": { "2026-03-02": 41.2345 } }` — official NBU rates on each receipt date; without it foreign-currency inflows are listed as "без курсу" and excluded from totals. Take rates from bank.gov.ua, never estimate.
- `--rules my-rules.json` prepends custom rules (same shape as `DEFAULT_RULES` in the script) for recurring counterparties.
- `--out *.json` gives rows + monthly/quarterly/annual totals; `*.csv` is Excel-ready (UTF-8 BOM, `;`).

## 4. Default classification (first match wins; review the flagged rows)
| Class | Effect | Trigger (description/comment/counterparty) | Basis |
|---|---|---|---|
| customer_refund (outflow) | reduces income of the refund period | "повернення … покупцю/клієнту/за товар" | ПКУ 292.11 п. 5 |
| own_transfer | not income | "між власними рахунками", "з власної картки", counterparty = ФОП itself | ПКУ 292.1 (not income from another person) |
| fx_conversion | not income | sale/exchange of currency | ПКУ 292.5 — income counted when currency arrived |
| tax_refund | not income | refund of overpaid taxes/ЄСВ | ПКУ 292.11 п. 9 |
| loan | not income, review | кредит, позика, поворотна фінансова допомога | ПКУ 292.11 п. 3 (return within 12 months) |
| refund_in | not income, review | refund/reversal of your own payment | — (verify it is not a customer payment) |
| grant | not income, review | грант, єРобота | ПКУ 292.1 п. 1 |
| passive_interest | not income | interest on balance/deposit | ПКУ 292.1 п. 1 |
| cashback | review (excluded until decided) | кешбек, cashback | `[Unverified]` |
| income_acquiring | income, review | LiqPay, WayForPay, Fondy, NovaPay, накладений платіж, еквайринг | income is the gross amount paid by the buyer `[Unverified]` — add back fees withheld |
| income | income | any other inflow from another person | ПКУ 292.1, 292.6 |

## 5. Checks before giving totals
1. Mapping confirmed; row count equals the statement's operations (footer/total lines are skipped automatically).
2. Every `review=yes` row resolved with the user; re-run with `--rules` instead of editing numbers by hand.
3. No double counting between accounts (own transfers between the ФОП's UAH and currency accounts; acquiring settlements vs individual card payments).
4. Currency inflows have rates; currency sales are excluded.
5. Customer refunds are matched to earlier income (returned goods/terminated contract).
6. Cash and ПРРО Z-reports added if cash is accepted (not in bank statements).
7. Quarter totals reconcile with the e-cabinet and with the previous declaration (cumulative for group 3).
8. Limit status printed by `--group/--year` (80 % / 90 % / exceeded warnings) — if close, show the consequences from `references/fop-taxes.md` section 2.

## 6. Output
- Ledger file (`.csv`/`.json`) + summary table: month/quarter · income · reductions · net · cumulative · not income · under review.
- Declaration helper: for group 3 the quarter's income and cumulative income → feed into `tax-calc.mjs calc --group 3 --period qN --income <quarter net> --ytd-before <previous cumulative>`.
- Dispatch `business-accountant-check` with the input files, command and outputs; then the verify line from the `business` skill.
- XLSX with formulas or a monthly income-book template → `/office` (`/office`).
