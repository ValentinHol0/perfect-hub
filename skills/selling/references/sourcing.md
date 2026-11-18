# Selling — Sourcing and Landed Cost

Customs and tax facts with dates: `${CLAUDE_PLUGIN_ROOT}/skills/selling/references/sourcing/customs-ua.md`. Re-check them on zakon.rada.gov.ua / customs.gov.ua / tax.gov.ua before any decision; the parcel regime is changing (law adopted 15.10.2026, effective no earlier than 01.07.2027).

## 1. Identify the exact item
Collect: product photos (all angles), material, dimensions, gross weight, power (battery type and Wh for Li-ion — carriers restrict them), certifications printed on the box. Reverse image search (Google Lens, 1688 image search "以图搜货", Taobao "拍立淘") to find the factory listing, not a reseller.

## 2. Search queries (always give all three languages)
| Language | Query pattern | Example (USB-C foot file) |
|---|---|---|
| Chinese (characters + pinyin) | product noun + key spec + 厂家/批发 (factory/wholesale) | 电动磨脚器 USB充电 厂家 — diàndòng mójiǎoqì USB chōngdiàn chǎngjiā |
| English | noun + spec + "factory" / "OEM" | electric callus remover USB-C rechargeable OEM |
| Ukrainian / Russian (local wholesale, Prom) | noun + "оптом" / "опт" | електрична пилка для п'ят оптом |
Translate the Chinese yourself and show the literal meaning; if unsure of a technical term, give two variants and say which matched listings.

## 3. Supplier shortlist (3–5 rows; all from pages opened this session)
| # | Source | Supplier / shop | URL | Unit price (tier) | MOQ | Lead time | Weight/packaging | Signals | Captured |
|---|---|---|---|---|---|---|---|---|---|
Signals to record from the page, never assume: years on platform, factory vs trading company, repurchase rate or ratings as shown, real photos vs renders, customisation (logo, box) MOQ. On 1688 most sellers ship only inside China — you need an agent/forwarder (buying agent fee 3–10% `[Unverified]`; take the user's quote).

Local options: 7th Kilometer (Odesa), Barabashovo (Kharkiv), importers on Prom/Rozetka wholesale, UA dropshipping suppliers — faster cash cycle, lower margin, crowded creatives. Epicentr marketplace does not accept dropshipping (sources.md).

## 4. Landed cost — run the calculator
Put the shipment into the `landed` block of the unit-economics input and run `node "${CLAUDE_PLUGIN_ROOT}/scripts/unit-economics.mjs" <file>`:
```jsonc
"landed": {
  "unitPrice": 3.1,          // supplier price per unit in supplier currency (USD here)
  "fx": 41.2,                // UAH per USD, NBU rate on the date (cite)
  "freightPerKg": 9.5, "weightKg": 0.32,   // or "freightPerUnit"
  "dutyPct": 0.1,            // by UKTZED code — look it up, see references
  "importVatPct": 0.2,
  "importVatReclaimable": false,           // true only for VAT payers who can credit it
  "brokerPerUnit": 4.5,      // broker/declaration fees ÷ units
  "domesticPerUnit": 3       // forwarder warehouse → your stock
}
```
The script applies duty to the customs value (goods + freight to the border, CIP/CIF-style) and import VAT to customs value + duty. If the forwarder quotes "cargo all-in" (білий/сірий карго per kg including customs), do not use the duty fields — put the all-in rate in `freightPerKg` and flag the legal risk below.

## 5. Customs regime decision (state which applies)
| Route | When | Cost logic | Risk |
|---|---|---|---|
| Commercial import, full customs declaration | stock for resale by FOP/company | duty by UKTZED code + 20% import VAT + broker | clean documents; needed for marketplaces that require invoices |
| Postal/express parcels to a private person | samples, personal use | ≤ EUR 150 per recipient no payments today; above: 10% duty + 20% VAT on the excess | using personal parcels for commercial stock is a misuse of the exemption; parcel VAT changes from 2027 |
| "All-in cargo" forwarders | quoted per kg incl. "customs" | one rate | documents may not support resale; ask what customs declaration is issued; marketplaces and banks may ask for proof of origin |
Always end with: "Митні та податкові висновки перевірте з митним брокером і бухгалтером перед закупівлею."

## 6. Quality and compliance checklist before paying
- Sample ordered and tested (photos/video of the real unit, drop test for fragile items).
- Packaging survives Nova Poshta sorting (C7); inner box and filler specified.
- Ukrainian-language labelling and instructions where required for consumer goods `[Unverified]` — confirm category rules (a lawyer).
- Certification needs: electrical goods, cosmetics, food-contact, children's products → ask a broker before ordering.
- Battery shipments: Wh rating, UN38.3 test report for air freight `[Unverified]` — the forwarder decides.
- Payment terms: deposit %, balance before shipment, inspection; contract/invoice → `perfect-hub:office`.

## 7. Output
Shortlist table → recommended supplier and why → landed-cost block (script output) → customs route + verification line → risks → next step (sample order, forwarder quote request text in Chinese/English if asked).
