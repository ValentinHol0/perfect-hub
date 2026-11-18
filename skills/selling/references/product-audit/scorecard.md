# Scorecard rubric — deduction tables

Start each criterion at 100 and subtract the lines that apply. Deductions are the owner's calibrated judgement, not market facts; adjust them per business but keep them itemised. Points in a range: pick the value the evidence supports and say why.

## C1 Unit economics and margin resilience (20%)
Use the WORST scenario from `unit-economics.mjs`.
| Condition | Deduct |
|---|---:|
| Worst-case contribution per shipped order 150–249 UAH | 15–30 |
| Worst-case contribution < 150 UAH (also fatal) | 40–60 |
| Markup (price ÷ goods per order) 2.3–2.9× | 10–20 |
| Actual/expected CPA ≥ 80% of break-even CPA (headroom < 20%) | 10–20 |
| Contribution depends on a bundle or upsell take-rate you have not tested | 5–10 |
| Fixed costs need > 25 shipped orders/day to break even | 5–15 |
| Cash: peak cash need > 2× what the user said they can invest | 10–20 |

## C2 Price-parity resistance (15%)
Parity ratio = your price ÷ cheapest delivered price of the identical item (Temu, Prom, Rozetka, OLX, AliExpress).
| Condition | Deduct |
|---|---:|
| Ratio 1.8–2.8 | 20–40 |
| Ratio > 2.8 | 45–75 |
| Identical photos/packaging used by many sellers (reverse image search finds ≥ 5 shops) | 10–20 |
| Temu delivers to UA free or cheap and in ≤ 14 days | 5–15 |
| Mitigation: bundle with no 1:1 twin, private label, local warranty, faster delivery | give back up to 25, itemised as a smaller deduction |

## C3 COD redemption and return hazard (15%)
| Condition | Deduct |
|---|---:|
| Sizes or fit (clothes, shoes, rings) | 40–60 |
| Fragile or likely DOA on unboxing (glass, cheap motors) | 15–30 |
| Novelty/impulse with high regret ("toy" feeling) | 10–25 |
| Price > 1,500 UAH with COD only `[Unverified]` zone | 10–20 |
| Result not visible before 1–2 weeks of use → disappointment returns | 5–15 |
| Delivery from abroad per order (> 5 days) | 30–50 |
| User's own refusal data for similar items > 15% | 15–30 |

## C4 Creative hook and demonstrability (15%)
| Condition | Deduct |
|---|---:|
| Problem not visible in the first 3 seconds | 15–30 |
| Result not visible on camera (needs explanation or time-lapse) | 15–30 |
| Needs voice-over to make sense (sound-off viewing) | 5–10 |
| Angle already saturated: dozens of identical creatives in the ad library | 10–20 |
| Requires people/animals/locations hard to film | 5–15 |

## C5 Ad-policy safety (10%)
Check the current Meta Advertising Standards, TikTok ad policies and Google Ads policies for the exact category before scoring (`sources.md`).
| Condition | Deduct |
|---|---:|
| Weight loss, supplements, cosmetic procedures (18+ targeting and claim limits apply) | 15–30 |
| Angle relies on body close-ups, "negative self-perception" or before/after of body parts | 30–60 |
| Health or cure claims, medical-device framing | 40–70 |
| Restricted goods (weapons accessories, tobacco/vapes, adult products, drugs, financial) | 50–90 |
| Third-party brand, character or logo on the product (IP takedowns) | 30–70 |
| Exploits war, air raids or crisis events in the angle | 20–40 |

## C6 Audience breadth and pain intensity (10%)
| Condition | Deduct |
|---|---:|
| Narrow niche (one breed, one car model, one hobby) | 20–40 |
| Pain is mild or occasional (nice-to-have) | 15–30 |
| Seasonal window < 3 months | 10–20 |
| Buyer ≠ user and needs a gift moment | 5–10 |

## C7 Logistics, fragility, power autonomy (5%)
| Condition | Deduct |
|---|---:|
| Parcel > 2 kg or bulky (next NP tariff step or oversize +100 UAH) | 10–30 |
| Liquids, aerosols, batteries with carrier restrictions | 15–40 |
| Glass, ceramics, thin plastic | 15–30 |
| Needs 220 V and > 1.5 kW (blackout seasons) | 10–25 |

## C8 Sourcing speed and scalability (5%)
| Condition | Deduct |
|---|---:|
| Single supplier, no alternative found | 15–25 |
| Re-order lead time > 4 weeks | 10–25 |
| Needs certification/registration in Ukraine (cosmetics, food contact, electrical) not yet done | 15–40 |
| Quality variance between batches reported | 10–20 |

## C9 Cross-sell, upsell, LTV (5%)
| Condition | Deduct |
|---|---:|
| No consumable or accessory | 20–40 |
| Bundle makes no sense (one per household) | 10–20 |
| No repeat purchase within 6 months | 10–20 |

## Anti-inflation rules
- A score ≥ 95 needs `evidence` that would convince a sceptic (sales data, own test results, a live competitor with long-running ads plus a price gap).
- An unbranded commodity with no own data cannot exceed 80 on C1, C2 or C3.
- Never round up in the user's favour; when unsure between two deductions, take the larger and say what evidence would reduce it.
