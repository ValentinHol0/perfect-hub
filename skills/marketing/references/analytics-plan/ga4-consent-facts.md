# GA4, PostHog and consent — facts with sources

Checked 2026-11-12 by fetching each page. Limits change; re-check before a client sign-off.

## GA4 collection limits (standard property) — https://support.google.com/analytics/answer/9267744
| Item | Limit |
|---|---|
| Event name length | 40 characters |
| Parameters per event | 25 |
| Parameter name length | 40 characters |
| Parameter value length | 100 characters (`page_title` 300, `page_referrer` 420, `page_location` 1 000) |
| User properties | 25 per property; name 24 characters; value 36 characters |
| Distinct event names | Web streams: no limit; app streams: 500 per app user (automatic and enhanced-measurement events excluded) |
| Item-scoped custom parameters | up to 27 per ecommerce event |
| User-ID value | 256 characters |

## GA4 naming — https://support.google.com/analytics/answer/13316687
Event names are case-sensitive, start with a letter, use letters, numbers and underscores, no spaces. Event parameters and user properties must not begin with `_`, `firebase_`, `ga_`, `google_` (parameters also not `gtag.`). Reserved names include `page_view`, `session_start`, `user_engagement` (web) — the list is not exhaustive.

## GA4 custom definitions (standard) — https://support.google.com/analytics/answer/10075209
Event-scoped custom dimensions 50 · user-scoped 25 · item-scoped 10 · custom metrics 50. Google advises avoiding high-cardinality dimensions.

## GA4 recommended events — https://developers.google.com/analytics/devguides/collection/ga4/reference/events
All properties: `login`, `search`, `select_content`, `share`, `sign_up`, `tutorial_begin`, `tutorial_complete` (and virtual-currency, group events). Online sales: `add_payment_info`, `add_shipping_info`, `add_to_cart`, `add_to_wishlist`, `begin_checkout`, `purchase`, `refund`, `remove_from_cart`, `select_item`, `select_promotion`, `view_cart`, `view_item`, `view_item_list`, `view_promotion`. Lead generation: `generate_lead`, `qualify_lead`, `disqualify_lead`, `working_lead`, `close_convert_lead`, `close_unconvert_lead`. `purchase`: `transaction_id` (dedup), `value`, `currency` (ISO 4217, required with value), `items` (each with `item_id` or `item_name`).

## Key events — https://support.google.com/analytics/answer/13965727
Conversions in GA4 are now called key events; a Google Ads conversion is created from a key event and needs a linked Google Ads account.

## Data retention — https://support.google.com/analytics/answer/7667196
Standard properties: 2 or 14 months; affects explorations and funnel reports only, not standard aggregated reports.

## PII — https://support.google.com/analytics/answer/6366371
Google's policies require that no data Google could recognise as personally identifiable (email, phone, names, government IDs) is sent — including in URLs, page titles and campaign parameters.

## UTM parameters — https://support.google.com/analytics/answer/10917952
Supported: `utm_source`, `utm_medium`, `utm_campaign`, `utm_id`, `utm_term`, `utm_content`, `utm_source_platform`, `utm_creative_format`, `utm_marketing_tactic` (the last two are not reported in GA properties). Always set source, medium, campaign; missing ones show as "(not set)". Values are case-sensitive.

## Default channel group — https://support.google.com/analytics/answer/9756891
Manual-traffic rules (abridged): paid mediums match `^(.*cp.*|ppc|retargeting|paid.*)$` and become Paid Shopping / Search / Social / Video when the source is on Google's site lists, otherwise Paid Other; Display: `display`, `banner`, `expandable`, `interstitial`, `cpm`; Organic Social: social source list or medium `social`, `social-network`, `social-media`, `sm`; Organic Video: video source list or medium containing `video`; Organic Search: search source list or medium `organic`; Referral: `referral`, `app`, `link`; Email: `email`, `e-mail`, `e_mail`, `e mail` in source or medium; Affiliates: `affiliate`; Audio: `audio`; SMS: `sms`; Mobile Push: medium ending in `push` or containing `mobile`/`notification`, or source `firebase`; Cross-network: campaign contains `cross-network`. Channel definitions are not case-sensitive. The source lists are in a downloadable spreadsheet linked from the page; whether `telegram` or `viber` is on the social list is `[Unverified]`.

## PostHog naming — https://posthog.com/docs/product-analytics/best-practices
Recommended `category:object_action` event names, lowercase, present-tense verbs, snake_case; properties `object_adjective`, `is_`/`has_` for booleans, `_date`/`_timestamp` suffixes; call `identify()` at the right time or pre-login events are not linked to the user.

## Consent mode
- Setup — https://developers.google.com/tag-platform/security/guides/consent: set defaults for each type before any `config`/`event`; example defaults all `denied`; `wait_for_update` in ms; `region` with ISO 3166-2 codes (more specific region wins); `url_passthrough`; `ads_data_redaction` (no effect when `ad_storage` is granted); consent mode updated November 2023 with `ad_user_data` and `ad_personalization`.
- Concepts — https://developers.google.com/tag-platform/security/concepts/consent-mode: basic mode blocks tags until interaction and sends nothing on denial; advanced mode loads tags with denied defaults, sends cookieless pings, and supports advertiser-specific modelling. Types: `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`, `functionality_storage`, `personalization_storage`, `security_storage`.
- EEA — https://support.google.com/tagmanager/answer/14754100: from March 2024, EEA consent mode v1 users had `ad_storage` mapped once to `ad_user_data`; `ad_personalization` needs a manual upgrade; consent for personal data must be collected from EEA end users.

## Cookie banners
- EDPB Cookie Banner Taskforce report, 18 January 2023 — https://www.edpb.europa.eu/our-work-tools/our-documents/other/report-work-undertaken-cookie-banner-taskforce_en. The PDF could not be text-extracted here; the positions in the skill (first-layer reject by majority of authorities, no pre-ticked boxes, deceptive contrast or reject-as-link problematic) were confirmed through multiple law-firm summaries found by search. Treat as `[Verify against the PDF]` before quoting.
- GDPR art. 7(1) (demonstrate consent) and 7(3) (withdraw as easily as given) — Regulation (EU) 2016/679, https://eur-lex.europa.eu/eli/reg/2016/679/oj `[not re-fetched 2026-11-12]`.
- Ukraine: Law No. 2297-VI "Про захист персональних даних" — https://zakon.rada.gov.ua/laws/show/2297-17; GDPR-aligned bill No. 8153 status `[Unverified]`.
