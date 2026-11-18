# Analytics Plan

Measure what someone will act on. A tracking plan is a contract between marketing, product and the developers who implement it: every event has a reason, an exact trigger, typed parameters and an owner. Platform limits and consent facts (checked 2026-11-12, with sources): `${CLAUDE_PLUGIN_ROOT}/skills/marketing/references/analytics-plan/ga4-consent-facts.md`. UTM convention and channel table: `${CLAUDE_PLUGIN_ROOT}/skills/marketing/references/analytics-plan/utm-convention.md`.

**Boundary.** This skill writes the plan. Tag Manager containers, gtag/SDK code, server-side tagging, Measurement Protocol, CMP installation and dashboards in code go to the core via `.planning/handoff-marketing.md` (attach `tracking-plan.md`). Privacy and cookie policy texts go to a lawyer.

## 1. From questions to events
1. Write the 5–10 business questions the data must answer ("Which channel brings buyers who don't refuse COD parcels?", "Where do trial users drop before activation?").
2. For each: the metric (formula), the dimension to cut it by, the decision it informs, the review cadence.
3. Derive events and parameters from the metrics. An event nobody will read gets cut.

## 2. Conversion definitions
Write each conversion as a definition, not a name:
| Field | Example |
|---|---|
| Name | `purchase` |
| Business meaning | Order placed and confirmed on the thank-you page |
| Trigger | Thank-you page load after successful order creation (not button click) |
| Deduplication | `transaction_id` = order ID; fire once per order |
| Value | Order total without delivery, number, `currency: "UAH"` |
| Key event in GA4 | Yes (GA4 calls conversions "key events"; Google Ads conversions are created from them with a linked account) |
| Known gaps | Consent denials and ad blockers → fewer events than orders; COD refusals counted as purchases until corrected |

- Keep key events few: the primary action and 1–3 stepping stones (e.g. `purchase`, `generate_lead`, `begin_checkout`). Everything else is a normal event.
- **Cash on delivery (накладений платіж):** an order is not revenue until the parcel is collected. Plan a back-end status feed (collected / refused / returned) and send `refund` or a custom `order_refused` server-side so channel ROAS reflects collected money; implementation is a core task (Measurement Protocol), economics belong to `/selling`.
- Lead-gen: `generate_lead` at form success, then CRM stages (`qualify_lead`, `close_convert_lead` are GA4 recommended lead events) imported from the CRM.

## 3. Event taxonomy
- **Use GA4 recommended event names whenever one fits** (`page_view`, `view_item_list`, `view_item`, `add_to_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase`, `refund`, `sign_up`, `login`, `search`, `generate_lead`, `share`) — they populate built-in reports.
- **Custom events:** `object_action`, lowercase snake_case, present tense (`quiz_complete`, `calculator_submit`, `delivery_option_select`). If PostHog is the main tool, its documented convention is `category:object_action` (e.g. `checkout:payment_submit`); when both tools run, use the GA4 names for shared events and keep one dictionary.
- **Names:** start with a letter; letters, digits, underscores; ≤ 40 characters; case-sensitive (`Purchase` ≠ `purchase`); never a reserved prefix (`_`, `firebase_`, `ga_`, `google_`, `gtag.`).
- **Parameters:** ≤ 25 per event, names ≤ 40 characters, values ≤ 100 characters (`page_location` 1 000). Booleans `is_`/`has_`; units in the name (`price_uah`, `duration_sec`).
- **Custom dimensions** (standard property): 50 event-scoped, 25 user-scoped, 10 item-scoped, 50 custom metrics — register only what reports need; avoid high-cardinality values (IDs, timestamps) as dimensions.
- **No personal data:** Google's policy forbids sending data Google could recognise as PII (emails, phone numbers, names) — including in page URLs, titles and UTM values. Use an internal user ID, never an email or phone.

## 4. Tracking plan (deliverable: `tracking-plan.md`)
```markdown
| Event | Trigger (exact) | Parameters (name: type = example) | Key event | Tools | Consent | Owner | Status |
|---|---|---|---|---|---|---|---|
| begin_checkout | Checkout page first render with ≥1 item | value: number = 1299; currency: string = UAH; items: array | no | GA4, Meta CAPI | analytics + ads | dev | planned |
| purchase | Thank-you page after order created | transaction_id: string; value; currency; items; payment_type: string = cod | yes | GA4, Google Ads, Meta CAPI | analytics + ads | dev | planned |
```
Add: user properties, custom dimensions to register, cross-domain list, payment-gateway domains to exclude as referrals (whatever appears in referral reports after the redirect back), internal-traffic filter, QA steps.

## 5. GA4 setup plan (for the core to implement)
1. Property and data streams (web; app if any); time zone Europe/Kyiv, currency UAH.
2. Data retention: 14 months (standard properties choose 2 or 14; it affects explorations and funnels, not standard reports).
3. Enhanced measurement: keep page views, scrolls, outbound clicks, site search (set the query parameter), file downloads; review form interactions (noisy on custom forms — replace with explicit events).
4. Ecommerce: items array on every ecommerce event; `purchase` requires `transaction_id`, `value`, `currency`, `items`.
5. Key events marked; custom dimensions registered; internal traffic and developer traffic filtered; unwanted referrals listed.
6. Links: Google Ads, Search Console, Merchant Center; BigQuery export if raw data is needed.
7. Verification: DebugView with every event and parameter from the plan; weekly reconciliation of `purchase` count and revenue with back-end orders, gap documented.

## 6. PostHog plan (SaaS and product analytics)
- `identify()` at sign-up and login with the internal user ID, or pre-login events stay detached from the user; group analytics per company for B2B.
- Events per the activation funnel: `signup:account_create`, `onboarding:project_create`, the first value moment, `team:invite_send`, `billing:subscription_start` / `billing:subscription_cancel`.
- Feature flags and experiments link to `references/experiments.md`; session replay only with consent and masked inputs.
- Ad blockers drop client-side events; plan the vendor's documented reverse-proxy setup with the core.

## 7. UTM links
Every external link we control is tagged by the convention in `utm-convention.md` and validated by the script:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/utm.mjs" build --url https://shop.example/sale --source instagram --medium paid_social --campaign "2026-11_black-friday_ua" --content reels-a
node "${CLAUDE_PLUGIN_ROOT}/scripts/utm.mjs" check --file links.txt --site shop.example
```
Deliver `utm-links.csv`: `channel, placement, final_url, utm_source, utm_medium, utm_campaign, utm_content, built_url, checked (date)`. Google Ads uses auto-tagging (gclid) instead of manual UTMs; never put UTMs on internal links.

## 8. Consent plan (plan level; texts by a lawyer, code by the core)
**When it applies:** visitors in the EU/EEA (GDPR + ePrivacy rules on cookies) — and Google requires consent signals for EEA users to keep measurement, personalisation and remarketing. Ukraine: personal data law No. 2297-VI applies; a GDPR-aligned bill (No. 8153) was still in the Rada in 2026 `[Unverified — check its status]`. Whether a UA-only site needs a banner is a a lawyer question; with any EU traffic, plan one.

**Google consent mode v2:**
- Four required types: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`; optional `functionality_storage`, `personalization_storage`, `security_storage`.
- Defaults set to `denied` on every page **before** any config or event command; updated on the user's choice; region-specific defaults with ISO 3166-2 codes; `wait_for_update` (ms) when the CMP loads asynchronously.
- **Basic vs advanced:** basic blocks Google tags until consent — nothing is sent on denial; advanced loads tags with denied defaults and sends cookieless pings, enabling advertiser-specific modelling. Advanced sends data before consent — a legal decision for a lawyer, not a default.
- Options: `url_passthrough` (keeps click IDs in URLs without cookies), `ads_data_redaction` (redacts ad click IDs while `ad_storage` is denied).

**Banner requirements** (EDPB Cookie Banner Taskforce report, January 2023 — majority positions of EU regulators, not binding guidance):
- A reject option on the first layer, as visible and easy as accept (button, not a hidden link; no low-contrast reject).
- No pre-ticked boxes; no "legitimate interest" for non-essential cookies; only truly essential cookies without consent.
- Withdrawal as easy as giving consent (GDPR art. 7(3)) — a persistent link or icon; consent records kept so it can be demonstrated (art. 7(1)).
- Categories map to consent-mode types **and** to every non-Google vendor (Meta pixel, TikTok pixel, Hotjar, Clarity, chat widgets) — those must be blocked until their category is granted.

**Consent QA for the core:** deny all → no `_ga`/`_fbp` cookies, Google tags send only cookieless pings (advanced) or nothing (basic); grant → cookies set, events carry consent state; change choice → takes effect without reload.

## 9. Delivery checklist
- [ ] Business questions → metrics → events traced; no orphan events.
- [ ] Conversions defined with trigger, dedup, value, gaps; COD/lead stages handled.
- [ ] Names and parameters within GA4 limits; no PII anywhere, including URLs and UTMs.
- [ ] UTM links built and checked by `utm.mjs` (output pasted).
- [ ] Consent plan with mode, defaults, regions, vendor mapping; legal items routed to a lawyer.
- [ ] Handoff to the core written with acceptance criteria (DebugView, consent states, reconciliation).
Legal notes end with: "Verify with a lawyer before publishing."
