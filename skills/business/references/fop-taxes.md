# ФОП taxes: groups, rates, limits

All numbers: `${CLAUDE_PLUGIN_ROOT}/data/fop-rates.json` (2026 verified 2026-11-12). Print the current limits with `node ${CLAUDE_PLUGIN_ROOT}/scripts/tax-calc.mjs limits --year <year>`. Articles: `${CLAUDE_PLUGIN_ROOT}/skills/business/references/sources.md` (ПКУ = Податковий кодекс).

## 1. The groups (ПКУ 291.4, 293)
| | Group 1 | Group 2 | Group 3 | General system |
|---|---|---|---|---|
| Who | ФОП only | ФОП only | ФОП and legal entities | ФОП |
| Activity | Only retail from market stalls and/or household services to the population (list of 40 in 291.7) | Services (incl. household) to single-tax payers and/or the population; production and/or sale of goods; restaurants | Any activity not banned by 291.5 | Any |
| Clients for services | Population | **Only single-tax payers and the population** — services to a company or ФОП on the general system are outside group 2 → 15 % on that income (293.4 п. 5) | Anyone, incl. foreign clients | Anyone |
| Employees | None | Up to 10 at a time | Unlimited | Unlimited |
| Income limit per year | 167 × minimum wage on 1 Jan | 834 × | 1167 × | none |
| Single tax | Fixed, up to 10 % of the subsistence minimum for able-bodied persons on 1 Jan, per month, set by the local council | Fixed, up to 20 % of the minimum wage on 1 Jan, per month, set by the local council | 5 % of income, or 3 % + VAT for VAT payers | PIT 18 % of net income (167.1, 177) |
| Military levy | 10 % of minimum wage per month | 10 % of minimum wage per month | 1 % of income | 5 % of net income |
| ЄСВ | Minimum per month | Minimum per month | Minimum per month | 22 % of net income, not below the minimum |
| Cash register (ПРРО) | Not applied (296.10) | Required for settlement operations, with exemptions → `references/prro.md` | Same as group 2 | Same as group 2 |
| Reporting period | Year | Year | Quarter | Year |

Group 2 cannot cover: real-estate intermediary services (KVED 70.31 ДК 009:2005), internet access services, production/sale of jewellery and household items from precious metals and stones — these belong only to group 3 (291.4 п. 2 абз. 4).

**Banned for groups 1–3** (291.5 — non-exhaustive summary, read the article before advising): gambling and lotteries; currency exchange; excise goods (except retail of fuel in containers up to 20 l and retail of beer, cider, perry and table wine by individuals); mining/sale of precious metals and stones (except jewellery); financial intermediation (except insurance agents, surveyors, average adjusters); management of enterprises; postal (except courier), fixed and mobile telecom with network operation; sale of art and antiques and their auctions; touring events; security activity (added by Law 4698-IX); technical testing (KVED 74.3) and audit by ФОП; renting land > 0.2 ha, residential premises > 400 m², non-residential > 900 m²; entities where non-single-tax legal entities own ≥ 25 %; non-residents; tax debt on the application date.

**Money only.** Groups 1–3 settle only in money — cash or non-cash incl. e-money (291.6). Barter → 15 % on that income (293.4 п. 3) and a forced switch (298.2.3 п. 4).

## 2. What is income (ПКУ 292)
- Money received during the period (cash or non-cash) plus the value of goods/works/services received free of charge under written contracts (292.1 п. 1, 292.3). **Date = date the money arrives** (292.6) — not the invoice or act date.
- Foreign currency → UAH at the official NBU rate on the date of receipt (292.5).
- Agent/commission contracts: income is the agent's fee (292.4).
- Not income for a ФОП (292.1 п. 1, 292.11): passive income (interest, dividends, royalties), insurance payments, budget grants, proceeds from selling the ФОП's own movable/immovable property used in the business; VAT amounts; loans and returnable financial aid returned within 12 months; prepayments returned to the buyer on return of goods / termination; overpaid taxes and ЄСВ refunded.
- Over-limit income: 15 % on the excess (293.4 п. 1); groups 1–2 must switch from the next quarter (application by the 20th of the month after the quarter — 293.8 пп. 1–2); group 3 ФОП moves to the general system from the first day of the month after the quarter (293.8 п. 3, 298.2.3 п. 3).

## 3. VAT interaction
- Mandatory VAT registration at > 1 000 000 UAH of supplies in 12 months does **not** apply to single-tax payers of groups 1–3 (181.1).
- Group 3 may choose 3 % + VAT: a VAT-registered entity switching to the simplified system, or a 5 % payer registering for VAT, with an application ≥ 10/15 calendar days before the quarter (293.8 п. 4). Cancelling VAT registration → back to 5 % or leave the simplified system (293.8 п. 5).
- When 3 % + VAT makes sense: most clients are VAT payers who need tax credit; otherwise 5 % is simpler.

## 4. Switching (ПКУ 298)
- General → simplified: application ≥ 15 calendar days before the next quarter, once per calendar year, with the previous year's income meeting the group limits (298.1.4).
- New ФОП: groups 1–2 — application before the end of the registration month, taxpayer from the next month; group 3 — within 10 days of registration, taxpayer from the registration date (298.1.2, 294.4). The choice can be made in the registration application (298.1.1).
- Between groups: application ≥ 15 calendar days before the next quarter (298.1.5).
- Leaving voluntarily: application ≥ 10 calendar days before the new quarter (298.2.1).

## 5. Martial-law and 2026 specifics
- Military levy for single-tax payers applies from 1 Jan 2025 until 31 Dec of the third year after martial law ends (п. 16-1 пп. 1.1). Groups 1–2 without employees: no ЄП and no military levy for one month of vacation per year and for illness ≥ 30 days (295.5; п. 16-1 пп. 1.13).
- Groups 1–2 with a tax address in combat or occupied territories may not pay ЄП and military levy for those months (підрозд. 8 п. 11; п. 16-1 пп. 1.12) — check the official territories list.
- ЄСВ: the right not to pay ЄСВ for yourself during martial law (Закон 2464-VI розд. VIII п. 9-19) is **suspended for 2026** — ФОП pay at least the minimum. Exemptions that remain: pensioners by age / disability (ст. 4 ч. 4), months where an employer paid at least the minimum for you (ст. 4 ч. 6), mobilised ФОП (п. 9-18).
- From 2027 digital-platform operators report sellers' income to the tax authority (ПКУ розд. XVIII-3; first reporting period 2027; registration of operators by 1 Jan 2027). Which marketplaces qualify for a given seller — `[Unverified]`.

## 6. Calculate
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/tax-calc.mjs calc --group 3 --year 2026 --period q1 --income 300000 --ytd-before 0
node ${CLAUDE_PLUGIN_ROOT}/scripts/tax-calc.mjs calc --group 2 --year 2026 --period year --rate 1729.40
node ${CLAUDE_PLUGIN_ROOT}/scripts/tax-calc.mjs general --year 2026 --income 1000000 --expenses 400000
```
Flags: `--vat` (3 %), `--exempt-months N` (groups 1–2 vacation/illness), `--no-esv` (only for a verified exemption), `--json`. Group 1/2 rate defaults to the legal maximum — ask for the local council's decision and pass `--rate`. Income for groups 3 / over-limit checks: take it from `references/bookkeeping.md` (`income-ledger.mjs`), not from the user's memory.

## 7. Choosing a group — decision path
1. Is the activity banned (291.5)? → general system only.
2. Group 1 only if retail at a market stall or household services to people, no employees, income ≤ limit.
3. Services to companies/ФОП on the general system, foreign clients, IT outsourcing → group 3 (group 2 would put that income at 15 %).
4. Goods to consumers (online shop), services only to people/single-tax payers, ≤ 10 employees, income ≤ group 2 limit → compare group 2 (fixed) vs group 3 (5 %): run both with the expected income; break-even ≈ when 5 % of monthly income exceeds the group 2 fixed rate.
5. Clients need VAT credit → group 3 with 3 % + VAT.
6. Expected income above the group 3 limit or large documented expenses → model the general system with `general`.

Example (2026, maximum group 2 rate): monthly income 50 000 UAH → group 2 ЄП 1 729,40 vs group 3 ЄП 2 500,00; military levy 864,70 vs 500,00; ЄСВ the same. Quote both from the script, not from this example.

## 8. Output
Answer + amounts table from the script output (with its source line) + Assumptions + `[Unverified]` + reviewer verdict (`business-accountant-check`) + the verify line from the `business` skill.
