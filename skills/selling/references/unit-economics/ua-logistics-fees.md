# Ukrainian logistics and payment fees — verified inputs

Checked 2026-11-12. Re-check before use: carriers change tariffs several times a year (Nova Poshta changed them on 13.04.2026 and published a grid valid from 10.09.2026).

## Nova Poshta — branch-to-branch parcels (UAH, incl. VAT)
Source: https://novaposhta.ua/basic_tariffs (valid from 10.09.2026).
| Weight | Within city | Across Ukraine |
|---|---:|---:|
| Documents ≤ 1 kg | 70 | 80 |
| Parcel ≤ 2 kg | 70 | 90 |
| Parcel ≤ 10 kg | 115 | 135 |
| Parcel ≤ 30 kg | 180 | 200 |
| > 30 kg | from 8 UAH/kg | to 16 UAH/kg (zone 3) |

Surcharges: postomat delivery +10 per place; village delivery +30; courier pickup or delivery +60; oversize (> 120 cm) or no box +100 per place. Declared-value fee is included up to 500 UAH; the percentage above 500 UAH is not on that page — `[Unverified]`, check your contract (commonly quoted as 0.5%).

Contract rates for business senders differ from the public grid — use the user's contract if they have one.

## Refusals (невикуп) and storage
- On 04.10.2024 Nova Poshta announced free return to the sender and no 0.5% declared-value commission when the recipient refuses a parcel (https://forbes.ua/news/nova-poshta-skasuvala-komisiyu-za-povernennya-posilki-04102024-24017). Who pays the forward delivery the buyer never paid, and whether your contract follows the announcement: `[Unverified]` — confirm with the NP manager. The calculator default (`return = forward`) is the conservative case.
- Free storage 7 calendar days at branches, 5 in postomats; unclaimed after 30 days (press summary 2026, `[Unverified]` against NP's own page).
- Every extra day before refusal delays returned stock: put refused stock back into the batch plan, not into revenue.

## COD — NovaPay post-payment (from May 2026)
Source: https://news.dtkt.ua/simple/common/110650-novapay-zminiv-tarifi-na-pisliaplatu-za-otrimannia-tovaru-shho-novogo (01.05.2026; novapay.ua blocks automated fetch).
| Tariff | Seller pays | Buyer pays |
|---|---|---|
| Standard | 2.5% (NovaPay account) / 3.3% (other bank) | nothing |
| Universal | 0.5% (NovaPay account) / 1.3% (other bank) | 1% + 10 UAH (NovaPay card) / 2% + 20 UAH (other card or cash) |
Calculator: standard → `codFee.pct: 0.025` or `0.033`; universal → `0.005` or `0.013` (the buyer's part raises the price they see at pickup — a refusal risk to test, not a seller cost).

## Prepaid payments
Acquiring fees depend on the provider and contract (LiqPay, Monobank acquiring, WayForPay, Fondy, NovaPay) — `[Unverified]`; take the rate from the user's contract and put it in `paymentFee.pct`.

## Ad VAT
- TikTok charges 20% VAT to Ukrainian advertisers that are not VAT-registered businesses (https://ads.tiktok.com/help/article/ukraine-vat, updated May 2026).
- Meta: 20% VAT unless a VAT ID is set in payment settings (secondary source, `[Unverified]`).
- Google: `[Unverified]` — check the invoice.
Set `ads.vatPct: 0.2` for FOP/individual advertisers that are not VAT payers.

## Taxes (summary only — verify with an accountant)
FOP group 3 in 2026: 5% single tax (non-VAT) + 1% military levy on income; group 3 VAT payers 3% + VAT. Source: secondary (see `selling/references/sources.md`). For VAT payers use `tax.mode: "vat"` and enter costs net of VAT.
