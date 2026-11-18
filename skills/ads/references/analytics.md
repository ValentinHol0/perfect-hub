# Ads — Analytics, Tracking, Definitions

Platform facts with dates: `${CLAUDE_PLUGIN_ROOT}/skills/ads/references/sources.md`. This skill specifies; code (GTM containers, server endpoints, CRM webhooks) is built by the core `/absolute` from `.planning/handoff-ads.md`.

## 1. Definitions (use exactly these in reports)
| Metric | Formula | Note |
|---|---|---|
| CPA (platform) | ad spend ex-VAT ÷ platform-attributed conversions | per the platform's attribution setting |
| CPA (CRM) | ad spend incl. ad VAT ÷ confirmed orders attributed by UTM | COD: confirmed ≠ delivered |
| Cost per delivered order | ad spend incl. VAT ÷ delivered (paid) orders | the number that pays salaries |
| ROAS (platform) | attributed conversion value ÷ spend | value sent with the event |
| ROAS (cash) | collected revenue ÷ spend incl. VAT | after refusals and returns |
| MER | total revenue ÷ total ad spend (all channels, same period) | `ads-calc.mjs mer`; break-even MER = 1 ÷ contribution margin |
| New-customer MER | first-order revenue ÷ total ad spend | when repeat revenue is large |
| Break-even CPA / ROAS | contribution before ads ÷ (1 + ad VAT); AOV ÷ break-even CPA | `ads-calc.mjs breakeven` |
| Approve rate | confirmed ÷ leads | COD funnels |
| Delivered rate | delivered ÷ shipped | 1 − refusal rate |

## 2. UTM convention (lowercase, ASCII, `_` inside values)
| Parameter | Value |
|---|---|
| `utm_source` | `facebook` / `instagram` (or `meta` + `{{site_source_name}}`), `tiktok`, `google`, `telegram`, `<channel-name>` for Telegram posts |
| `utm_medium` | `paid_social`, `cpc`, `paid_shopping`, `paid_telegram` |
| `utm_campaign` | campaign name per `references/creative-testing.md` naming (or ID macro) |
| `utm_content` | ad name (carries the creative ID) |
| `utm_term` | ad set / ad group name, or keyword on Search |
| `utm_id` | campaign ID (GA4 recommends it) |
GA4 requires source, medium and campaign; values are case-sensitive.
Templates:
- Meta: `utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&utm_id={{campaign.id}}&placement={{placement}}&site={{site_source_name}}`
- TikTok: `utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__&utm_term=__AID_NAME__&utm_id=__CAMPAIGN_ID__`
- Google: auto-tagging (gclid) + `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}`
- Telegram paid post: `utm_source=<channel>&utm_medium=paid_telegram&utm_campaign=<product>_<yyyymm>&utm_content=<post-id>` + a channel-specific promo code (Telegram in-app browser and copy-paste lose UTMs often — judgement).
Meta name-based parameters keep the name from the first publish.

## 3. Event plan (single source of truth)
| Event | Fires when | Platforms | Dedup key | Value |
|---|---|---|---|---|
| ViewContent | product/landing view | Meta, TikTok, GA4 | `event_id` | price |
| AddToCart / InitiateCheckout | form opened / step | Meta, TikTok, GA4 | `event_id` | price |
| Lead (COD form) | form submitted | browser + server | `event_id` = order ID | order value |
| Purchase (confirmed) | CRM status "confirmed" | server only (CAPI / Events API / Google offline import) | order ID | confirmed value |
| Purchase (delivered) | CRM status "paid/delivered" | server, optional custom event | order ID | collected value |
Deduplication (verified): Meta — same `event_name` + `event_id` (Pixel `eventID`) within 48 h; TikTok — same `event` + `event_id` within 48 h (Pixel vs Events API merged after 5 min). Send `fbp`/`fbc` (Meta), `ttclid` (TikTok), `gclid` (Google), hashed phone/email where lawful for match quality. Store click IDs with the order in the CRM so server events can be sent later.
Consent and privacy: collect and send personal data only with a lawful basis and a privacy notice — have a lawyer check them.

## 4. Attribution
- Meta standard attribution options: click 1 or 7 days; view 1 day; engage-through 1 day (verified). Incremental attribution exists as a separate model; results under different models are not comparable.
- Pick one window per account for decisions and keep it; document it in the report header. For impulse COD products a shorter window is closer to CRM reality (judgement).
- Platform totals will exceed CRM orders (view-through, cross-device modelling, refusals). Reconcile weekly: platform conversions vs CRM confirmed vs delivered, by campaign via UTM.
- Use MER as the business-level truth and platform CPA for in-platform optimisation.

## 5. Weekly report (deliverable `deliverables/ads/<project>/report-<yyyy-ww>.md`)
| Campaign | Spend (incl. VAT) | Platform conv | CRM confirmed | Delivered | CPA platform | CPA CRM | Cost/delivered | ROAS cash | vs break-even |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
Then: MER (`ads-calc.mjs mer`), what changed, decisions from the creative log, next week's tests.

## 6. Tracking QA checklist (before spending)
- [ ] Test order with `?utm_*` → visible in CRM with UTMs and click IDs.
- [ ] Events Manager / TikTok Events: event received from browser and server, deduplicated (one event, not two).
- [ ] Event value and currency correct (UAH).
- [ ] Google: auto-tagging on, gclid stored, conversion action primary/secondary set correctly.
- [ ] GA4: no `(not set)` source/medium for paid traffic.
- [ ] Status sync from CRM (confirmed/delivered) runs daily.
