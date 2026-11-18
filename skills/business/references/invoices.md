# Invoices, acts and delivery notes

## 1. Which document, when
| Document | Role | When |
|---|---|---|
| Рахунок на оплату (рахунок-фактура) | Request to pay; not a primary document of the transaction itself | Before payment (prepayment) or with the act |
| Акт приймання-передачі наданих послуг / виконаних робіт | Primary document confirming services/works were provided and accepted | After each stage/month/project; per contract |
| Видаткова накладна | Primary document for transfer of goods | On shipment of goods to a business client |
| Фіскальний чек (ПРРО) | Settlement document for consumers paying by cash/card | → `references/prro.md` |
| Податкова накладна | VAT document in the Unified Register | Only for VAT payers (group 3 at 3 %, general system with VAT) — out of scope here; accountant |

Taxpayers must keep records on the basis of primary documents (ПКУ 44.1) and store them at least 1095 days unless a longer period applies (ПКУ 44.3.3). The accounting law's requisites list binds legal entities (Закон 996-XIV ст. 2 ч. 1); a ФОП should still meet it because company clients cannot book a document without it.

## 2. Requisites of a primary document (act, delivery note) — Закон 996-XIV ст. 9 ч. 2
1. Name of the document (form) — «Акт приймання-передачі наданих послуг № …».
2. Date of preparation.
3. Name of the entity on whose behalf it is made — for a ФОП: «ФОП Прізвище Ім'я По батькові».
4. Content and volume of the transaction, unit of measure — what exactly, quantity, unit (послуга, год, шт), price, sum.
5. Positions and names of the persons responsible for the transaction and its correct execution — for a ФОП: «ФОП [ПІБ]»; for a company client: position + name of its signatory.
6. Personal signature or other data identifying the participant (КЕП for electronic documents).

Add (practice, not statutory for a ФОП): number; reference to the contract and specification; place; РНОКПП/ЄДРПОУ and IBAN of both parties; period of services; «Без ПДВ» for non-VAT payers `[practice — no statutory wording verified]`; total in words; "services provided in full, the parties have no claims". If the document states the service period, the customer's signature requisites may be absent where the contract allows it (ст. 9 ч. 2 абз. 8). Minor defects do not invalidate the transaction if the participant, date, entity and content can be identified (ст. 9 ч. 2, last paragraph). Electronic primary documents are valid when signed with an electronic signature under the e-document laws (ст. 9 ч. 2).

## 3. Invoice (рахунок) content
Seller: «ФОП ПІБ», РНОКПП, address, IBAN, bank, tax status («Платник єдиного податку 3 групи, 5 %» / «Платник ПДВ»). Buyer: name, ЄДРПОУ/РНОКПП, address. Number and date; contract reference; table (№, найменування, од., к-сть, ціна, сума); total; «Без ПДВ» or VAT line; total in words; payment due date; **payment purpose** to copy into the bank order: «Оплата за [послуги/товар] згідно з рахунком № [__] від [дата], без ПДВ».
A single-tax ФОП (groups 1–3) receives payment only in money (ПКУ 291.6) — no barter or offsets of counter-supplies in kind.

## 4. Numbering
No statutory numbering format was found for a ФОП `[practice]`. Rules that survive audits: one continuous sequence per document type per year (`2026-001`, `2026-002`…), never reuse or skip numbers, act and invoice cross-reference each other, corrections by a new document (not editing a signed one), keep a register (date, number, client, sum, paid on). For several streams use prefixes (`Р-2026-014` invoice, `А-2026-014` act).

## 5. Amount in words (Ukrainian)
Format: «Сорок дві тисячі п'ятсот гривень 00 копійок» — capital first letter, kopecks as digits.
- Гривня: 1, 21, 31… → «гривня»; 2–4, 22–24… → «гривні»; 0, 5–20, 25–30… → «гривень» (11–14 always «гривень»).
- Тисяча — feminine: «одна тисяча», «дві тисячі», «п'ять тисяч»; мільйон — masculine: «один мільйон», «два мільйони», «п'ять мільйонів».
- Feminine numerals with гривня/тисяча: «одна», «дві» (not «один», «два»).
- Копійка: 1 «копійка», 2–4 «копійки», 0, 5–20 «копійок».
- Check: 1 021,50 → «Одна тисяча двадцять одна гривня 50 копійок»; 2 002,02 → «Дві тисячі дві гривні 02 копійки»; 15 000,00 → «П'ятнадцять тисяч гривень 00 копійок».
Let `/office` generate the amount in words and the file, then re-read it against these rules.

## 6. Templates (fill, keep `[___]` for unknowns)
**Рахунок на оплату № [___] від [дата]**
Постачальник: ФОП [ПІБ], РНОКПП [___], [адреса], IBAN [UA___] в [банк]; платник єдиного податку [__] групи.
Покупець: [назва], ЄДРПОУ [___], [адреса]. Договір: № [___] від [___].
| № | Найменування | Од. | К-сть | Ціна, грн | Сума, грн |
|---|---|---|---|---|---|
| 1 | [Послуги з ___ за [місяць рік]] | послуга | 1 | [___] | [___] |
Разом: [___] грн. Без ПДВ. Сума прописом: [___]. Оплатити до [дата]. Призначення платежу: «Оплата за [___] згідно з рахунком № [___] від [___], без ПДВ».
ФОП [ПІБ] ________

**Акт приймання-передачі наданих послуг № [___] від [дата]**
м. [___]. Ми, що нижче підписалися, Виконавець ФОП [ПІБ], РНОКПП [___], та Замовник [назва], ЄДРПОУ [___], в особі [посада, ПІБ], склали цей акт про те, що на виконання Договору № [___] від [___] Виконавець надав, а Замовник прийняв послуги за період [___]:
| № | Найменування послуги | Од. | К-сть | Ціна, грн | Сума, грн |
Загальна вартість: [___] грн, без ПДВ ([прописом]). Послуги надано в повному обсязі та належної якості, сторони претензій не мають.
Виконавець: ФОП [ПІБ] ________   Замовник: [посада, ПІБ] ________

**Видаткова накладна № [___] від [дата]** — Постачальник / Одержувач (з реквізитами), підстава (договір/рахунок), таблиця товарів (найменування, од., к-сть, ціна, сума), разом, без ПДВ, прописом; «Відвантажив» (ФОП [ПІБ]) / «Отримав» ([посада, ПІБ], довіреність за потреби `[Unverified: whether a power of attorney is required]`).

## 7. Output and handoff
- Files: `deliverables/business/docs/<number>-<type>.md`; for DOCX/PDF/XLSX hand the filled content to `/office` (`perfect-hub:office`); otherwise deliver Markdown and suggest `/office`.
- Register: update or create `deliverables/business/docs/register.csv` (date;number;type;client;amount;paid_on).
- If income timing matters (quarter boundary), remind: income is the date the money arrives (ПКУ 292.6), not the act date.
- End with the verify line from the `business` skill.
