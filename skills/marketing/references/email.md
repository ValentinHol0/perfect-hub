# Lifecycle Email

Lifecycle messages are triggered by what a person did, sent while it still matters to them, and stop the moment they act. Deliverability facts, DNS checks and sources: `${CLAUDE_PLUGIN_ROOT}/skills/marketing/references/email/deliverability.md`. Copy rules: `references/copy.md`.

## 1. Consent first
- **Ukraine:** commercial electronic messages are sent on the basis of the recipient's consent; one may be sent without consent only if the person can opt out of further messages; every commercial message must be clearly identifiable as commercial and give direct, simple access to the sender's identification details; discount and gift offers must be identifiable with clear, accessible conditions (Law "Про електронну комерцію" No. 675-VIII, art. 10). Plan explicit opt-in (an unticked checkbox or a separate subscribe form) — it satisfies the stricter reading.
- **EU recipients:** GDPR consent standards apply; route the wording to a lawyer.
- Keep proof of consent: timestamp, form or source, the exact consent text shown, and the double opt-in confirmation where used. Never buy, rent or scrape lists.
- Transactional messages (order confirmation, delivery status, password reset) are not marketing; keep promotions out of them or they become commercial messages.
Legal notes end with: "Verify with a lawyer before publishing."

## 2. Flow catalogue
Timings are starting points to test, not benchmarks. Each flow has an entry trigger, exit conditions (purchase, unsubscribe, entering a higher-priority flow) and a frequency cap shared with campaigns.

| Flow | Trigger → exit | Messages (starting timing) | Goal and content |
|---|---|---|---|
| Welcome | Subscribe or account created → first purchase / 14 days | #1 immediately · #2 day 2 · #3 day 5 | #1 deliver what was promised (lead magnet, code), set expectations (what and how often), one next step. #2 the brand's mechanism and best-sellers with reasons. #3 proof (reviews with permission) and objections (delivery, returns, payment) |
| Abandoned cart | Cart with item(s) + known email/phone, no order → order placed | #1 after 1 h · #2 after 24 h · #3 after 72 h (optional) | #1 reminder with the exact items, price and a direct return link that restores the cart. #2 answer the likely blocker (delivery cost and time via Nova Poshta, payment options, returns). #3 last reminder; an incentive only if the margin allows and not for every cart (people learn to wait) |
| Browse abandonment | Product viewed 2+ times, known contact, no cart → cart or order | 1 message after 4–24 h | Product reminder + reviews + alternatives; lower frequency than cart |
| Post-purchase | Order paid/collected | Confirmation (transactional) · shipped with ТТН tracking link · delivered + how to use (day 0–2 after delivery) · review request (after the product had time to be used) · cross-sell or replenishment (by consumption cycle) | Reduce COD refusals and returns (clear tracking and expectations), get reviews, second order |
| Win-back | No purchase for 1.5–2× the typical repurchase interval | 2–3 messages over 2–3 weeks | "What changed" (new arrivals, improved terms), a reason to return, then a polite "stay subscribed?" — non-responders move to a low-frequency segment or are suppressed |
| Sunset | No clicks for a long period (e.g. 120–180 days) | 1–2 re-permission messages | Keep or remove; protects sender reputation |

Ukraine-specific channels: Viber and Telegram bots and SMS often carry cart and delivery messages. Same consent rules; per-message cost makes frequency caps and segment choice matter more. Choose the channel per flow by where the customer gave consent.

## 3. Writing each message
- Subject = one concrete promise or the item; preheader extends it; sender name recognisable (brand, or person + brand). Test how both render on a phone inbox.
- One primary CTA per message, repeated at most once; a link that lands on the exact product or restored cart, tagged with UTMs (`references/analytics-plan.md`, medium `email`).
- Text first: the message must work with images off; alt text on every image; readable in dark mode; plain-text part included.
- Personalisation only with data you have (name, items, city for delivery estimate); never "Hi {{first_name}}" fallbacks visible — set defaults.
- Ukrainian copy rules from `references/copy.md/references/ua-copy.md`; offers state conditions (dates, minimum order) next to the offer.

## 4. Deliverability basics (verify, don't assume)
Run the DNS checks in `deliverability.md` for the sending domain before any campaign:
- **SPF** published, ≤ 10 DNS-querying mechanisms (more → permerror and SPF fails), one SPF record per name.
- **DKIM** signing with the ESP's key on your domain; key ≥ 1024 bits (2048 recommended by Gmail).
- **DMARC** published at `_dmarc.<domain>`; start `p=none` with `rua` reports, move to `quarantine` / `reject` once all legitimate senders pass and align.
- **Alignment:** the visible From domain matches the SPF or DKIM domain.
- **Gmail bulk senders** (more than 5 000 messages a day to Gmail addresses; the status is permanent once reached): SPF + DKIM + DMARC, alignment, one-click unsubscribe (RFC 8058 headers) plus a visible unsubscribe link, unsubscribes honoured within 48 hours (Google's recommendation), spam rate in Postmaster Tools below 0.3% and ideally below 0.1%. Gmail has been ramping up enforcement since November 2025.
- All senders: valid forward and reverse DNS (PTR), TLS, RFC 5322-formatted messages.
- Practices: send marketing from a subdomain (e.g. `news.example.ua`) to separate its reputation from transactional mail; warm new domains gradually; remove hard bounces at once; suppress long-term non-clickers via the sunset flow.

## 5. Measurement
- Opens are unreliable (privacy features in some mail apps pre-load images); judge by clicks, conversions per recipient, revenue per recipient, unsubscribe and complaint rates.
- Keep a 5–10% holdout on each automated flow to measure incremental orders, not just attributed ones; size the holdout with `references/experiments.md` (`ab-calc.mjs mde`) — small lists cannot detect small lifts.
- Report weekly: flow → recipients, clicks, orders, revenue, unsubscribes, complaints; red flags: complaint rate rising, sudden drop in Gmail delivery.

## 6. Deliverable (`email-flows.md`)
For each flow: trigger · exit · audience filter · channel · messages table (`# | delay | subject | preheader | goal | CTA → URL with UTM | content blocks`) · metric and holdout · ESP implementation notes. Writing the HTML templates or integrating the ESP with the shop is a core task — list it in `.planning/handoff-marketing.md`. Typical ESPs used in Ukraine include SendPulse, eSputnik, Mailchimp and Klaviyo; pick by the user's stack, budget and Viber/SMS needs.

## 7. Delivery checklist
- [ ] Consent basis and proof storage defined per channel; legal line added.
- [ ] Each flow has trigger, exit, timing, frequency cap and a holdout.
- [ ] Messages written per `references/copy.md`; links tagged with checked UTMs.
- [ ] SPF/DKIM/DMARC checked with real DNS output pasted; unsubscribe mechanics confirmed.
- [ ] Measurement by clicks, orders and revenue per recipient — not opens.
