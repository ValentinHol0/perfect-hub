# Cash register (РРО / ПРРО) rules

Law: Закон № 265/95-ВР (ПРРО law), ПКУ 296.10, Постанова КМУ № 1336 — see `${CLAUDE_PLUGIN_ROOT}/skills/business/references/sources.md`. This is the area with the most contested ДПС positions: separate **statute** (verified) from **ДПС practice** (`[Unverified]` unless the user brings the letter).

## 1. Core test
A **settlement operation** (розрахункова операція) is accepting cash, payment cards, payment cheques, tokens etc. from the buyer **at the place of sale**, and paying cash back for returns; with a bank payment card — issuing the settlement document for the non-cash payment (ст. 2). Businesses doing settlement operations in cash or non-cash form (incl. electronic payment instruments) when selling goods/services must run them through a registered РРО/ПРРО on the full amount and give the buyer a settlement document, **including for orders or payments made via the Internet** (ст. 3 пп. 1–2).

## 2. Who is exempt
| Situation | Rule | Basis |
|---|---|---|
| Single-tax group 1 | РРО/ПРРО not applied | ПКУ 296.10; Закон 265 ст. 9 п. 6 |
| Services paid **exclusively** through remote banking and/or money-transfer services (client pays your IBAN from their bank app/office) | Not applied | ст. 9 п. 14 |
| No cash settlements at the place goods are received (warehouses, wholesale) | Not applied | ст. 9 п. 12 |
| Physical persons selling at markets (not technically complex goods, medicines, jewellery…) for cash | Not applied | ст. 9 п. 9 |
| КМУ № 1336 list (village retail by single-tax ФОП, mobile trade outside premises, markets and fairs, household services in villages, etc.) | Allowed with settlement books (розрахункові книжки) instead, within annual limits: 167 minimum wages per point for item 1; 500 000 UAH per business for items 2, 3, 5, 6, 13, 14, 17, 22, 23, 27; 250 000 UAH per point for items 4, 7; no limit for items 8–11, 15, 19, 21, 25, 26. Item 1 (village retail) does **not** apply if the ФОП also sells remotely, incl. via the Internet. Not for excise retail | Постанова КМУ № 1336 пп. 1–2-1 and the list |
| Goods (not services) paid by IBAN transfer without a card at the place of sale | Commonly treated as no settlement operation `[Unverified: ст. 9 п. 14 covers services only — check the ДПС position for goods]` | ст. 2 definition |

Everything else for groups 2, 3, 4 and the general system → ПРРО required.

## 3. Payment method matrix (online shop)
| Payment | ПРРО? | Notes |
|---|---|---|
| Card on the site (internet acquiring, payment link, Apple/Google Pay) | Yes | e-check sent to the buyer's phone/e-mail; ст. 3 п. 2 explicitly covers Internet orders/payments |
| Card terminal / cash in a shop or at a fair | Yes (unless КМУ 1336 item applies) | |
| IBAN invoice paid from the client's bank | Services: no (ст. 9 п. 14). Goods: `[Unverified]` | Keep the invoice + bank statement |
| Накладений платіж (cash on delivery) via Nova Poshta / NovaPay | ДПС position: yes, the seller issues the check, and for courier/expedition shipments it must be formed before dispatch and put in the parcel `[Unverified: ДПС letters № 162/2/99-00-24-01-03-02 of 24.02.2025 and № 500/2/99-00-07-03-01-02 of 09.05.2025 reported by secondary sources; court practice is split]` | Read the letters on zir.tax.gov.ua before advising; most shops choose to issue checks |
| Marketplace pays out (Rozetka, Prom, etc.) | Depends on who accepts the buyer's money and on the contract `[Unverified]` | Ask for the marketplace's payment scheme |
| Return of goods with refund | Return check (видатковий чек) on the same register | ст. 2, ст. 3 п. 2 |

## 4. Check content and operations
- Full amount of each operation; e-checks allowed (ст. 3 пп. 1–2).
- ФОП single-tax payers **not** registered for VAT may name goods/services in the check by consumer features identifying the product group (e.g. «Сукня жіноча») — except excise goods, technically complex goods under warranty, medicines, medical devices and jewellery (ст. 3 п. 2 абз. 2).
- Software registers are prohibited for wholesale/retail of fuel (ст. 3 п. 1).
- Settlement books and the РРО book must be stored for 3 years after they are finished (ст. 3 п. 6).
- Practical setup: register the ПРРО via the ДПС electronic cabinet (free or commercial software) `[Unverified: current ДПС free ПРРО app name and registration steps]`; connect it to the site's checkout so that every paid order creates an e-check automatically → technical work goes to the core via `.planning/handoff-business.md`.

## 5. Penalties (ст. 17)
- Settlement for an incomplete amount, not via the register, no settlement document issued, etc.: **100 %** of the sale amount for the first violation, **150 %** for each subsequent one (ст. 17 п. 1).
- Not using / improperly using settlement books: 50 non-taxable minimum incomes (ст. 17 п. 3); other items in ст. 17 (control tape, excise items, reporting).
Do not quote the UAH value of a "неоподатковуваний мінімум" from memory `[Unverified]`.

## 6. Output
Per payment channel: required / not required / contested — with the article, the evidence the ФОП should keep, and the next step (register ПРРО, integrate checkout, ask the marketplace). Then `business-accountant-check` if amounts are involved, and the verify line from the `business` skill.
