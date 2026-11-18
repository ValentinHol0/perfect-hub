# Sources — Perfect Business

Every rule used by this plugin's skills and scripts, with the primary source and the date it was checked. Numbers that change yearly live only in `data/fop-rates.json`; this file is the bibliography. Anything not listed here is not verified — mark it `[Unverified]` and write "check before use".

All checks: **2026-11-12**, from the official database "Законодавство України" (zakon.rada.gov.ua, print versions).

| # | Act | Provisions used | Edition on check date | URL |
|---|---|---|---|---|
| B1 | Податковий кодекс України № 2755-VI | ст. 44.1 (облік на підставі первинних документів), 44.3.3 (зберігання не менше 1095 днів), 202.1 (звітний період ПДВ — календарний місяць), 49.18.2–49.18.4 (строки декларацій: 40 днів квартал, 60 днів рік, до 1 травня для ПДФО), 49.20 (перенесення строку подання з вихідного), 57.1 (сплата протягом 10 днів; перенесення строку сплати з вихідного), 167.1 (18 %), 177.1–177.2, 177.5.1 (авансові ПДФО до 20.04, 20.07, 20.10), 177.10–177.11, 179.7, 181.1 (ПДВ 1 млн грн, крім ЄП 1–3 груп), 291.3–291.7 (групи, заборонені види діяльності, лише грошова форма розрахунків, побутові послуги), 292.1, 292.3–292.6, 292.11 (склад доходу, дата доходу, курс НБУ, виключення), 292.16, 293.1–293.8 (ставки, 15 %, переходи), 294.1–294.4, 295.1–295.8, 296.1–296.10 (облік у довільній формі помісячно; декларації; ЄСВ у складі декларації; група 1 без РРО/ПРРО), 297.1, 298.1–298.2.3, розд. XX підрозд. 8 п. 9, 11 (воєнні особливості ЄП), підрозд. 10 п. 16-1 (військовий збір), розд. XVIII-3 / підрозд. 10 п. 53-2 (звітність цифрових платформ з 2027) | зміни до № 5025-IX від 15.10.2026 | https://zakon.rada.gov.ua/laws/show/2755-17 |
| B2 | Закон № 4695-IX «Про Державний бюджет України на 2026 рік» | ст. 7 (прожитковий мінімум для працездатних 3328 грн), ст. 8 (мінімальна зарплата 8647 грн/міс, 52 грн/год), ст. 32 (максимальна база ЄСВ — 20 мінімальних зарплат) | із змінами № 4908-IX від 10.06.2026 | https://zakon.rada.gov.ua/laws/show/4695-20 |
| B3 | Закон № 2464-VI «Про збір та облік єдиного внеску…» | ст. 1 ч. 1 п. 5, ст. 4 ч. 1 п. 4, ч. 4, ч. 6, ст. 7 ч. 1 пп. 2–3, ст. 8 ч. 5, ст. 9 ч. 8, розд. VIII п. 9-18, 9-19 (зупинено на 2026) | ред. 26.01.2026 | https://zakon.rada.gov.ua/laws/show/2464-17 |
| B4 | Закон № 265/95-ВР «Про застосування реєстраторів розрахункових операцій…» | ст. 2 (розрахункова операція, розрахунковий документ), ст. 3 пп. 1–2 (обов'язки, у т. ч. для замовлень через Інтернет; спрощена назва товару для ФОП-неплатників ПДВ), ст. 9 пп. 6, 12, 14 (винятки), ст. 17 (100 % / 150 % санкції) | ред. 26.06.2026 | https://zakon.rada.gov.ua/laws/show/265/95-вр |
| B5 | Постанова КМУ № 1336 від 23.08.2000 | перелік форм і умов діяльності без РРО/ПРРО (з розрахунковими книжками) і граничні обсяги (167 мінзарплат; 500 тис.; 250 тис. грн) | ред. 19.06.2026 | https://zakon.rada.gov.ua/laws/show/1336-2000-п |
| B6 | Закон № 996-XIV «Про бухгалтерський облік та фінансову звітність в Україні» | ст. 2 ч. 1 (сфера — юридичні особи), ст. 9 ч. 2 (обов'язкові реквізити первинних документів, електронні документи) | ред. 01.04.2026 | https://zakon.rada.gov.ua/laws/show/996-14 |
| B7 | Закон № 2136-IX «Про організацію трудових відносин в умовах воєнного стану» | ст. 6 ч. 6 (ст. 73 КЗпП не застосовується — святкові дні не є вихідними) | — | https://zakon.rada.gov.ua/laws/show/2136-20 |
| B8 | monobank Open API documentation | StatementItem: `time`, `description`, `amount` (копійки), `operationAmount`, `currencyCode` (ISO 4217), `comment`, `counterEdrpou`, `counterIban`, `counterName` (рахунки ФОП) | — | https://api.monobank.ua/docs/index.html |

## Not verified (use only with the [Unverified] mark)
- ДПС position that ПРРО is required for накладений платіж through Nova Poshta / NovaPay and that the check must be issued before dispatch (letters reported by secondary sources: № 162/2/99-00-24-01-03-02 of 24.02.2025, № 500/2/99-00-07-03-01-02 of 09.05.2025) and contrary court practice — read the letters on zir.tax.gov.ua / tax.gov.ua before advising.
- Whether internet acquiring income is the gross amount paid by the buyer (before the bank's fee) — common ДПС position, not checked.
- Classification of cashback and bank bonuses for a ФОП.
- Exact column names of monobank and PrivatBank CSV/XLSX statement exports (presets in `income-ledger.mjs` are best-known names; check against the user's file).
- Counting of the 10-day payment period when the filing deadline moved from a weekend (tax-calc uses the unshifted deadline — conservative).
- Whether public holidays shift tax deadlines under martial law.
- ФОП on the general system: payment date of annual ПДФО (ПКУ 57.1 — 10 days vs 179.7 — 1 August), advance payments of military levy, treatment of own ЄСВ in expenses, final annual ЄСВ settlement date.
- 2027 values (minimum wage, subsistence minimum) — not added until the 2027 budget law is verified.
- Name and URL of the current ДПС "податковий календар" page.
