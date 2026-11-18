# Integrations — payments, delivery, messaging (Ukraine first, not only)

Technical integration is core work; the business side (which provider, tax/ПРРО obligations, offer texts) belongs to the perfect-business / a lawyer / `/selling` components. Provider APIs change: **read the provider's current docs before coding** (links below) and treat every detail marked `[verify]` as a pointer, not a spec. Sandbox/test credentials only during development.

## Rules for every payment integration
1. **Server decides the amount.** Price, discounts, delivery and currency are computed on the server from the catalogue and the order record; the client sends only ids and quantities.
2. **Money as integers** in minor units (kopiyky, cents) end to end; format only for display. UAH is ISO 4217 `UAH` / numeric `980`.
3. **Webhook = source of truth.** Verify the signature on the **raw request body** before parsing; reject unsigned or mismatched calls; make the handler idempotent (unique constraint on provider event id / order reference); compare the paid amount and currency with the order; move the order through explicit states (`pending → paid → fulfilled`, `failed`, `refunded`) with timestamps. The browser "success" redirect only shows status — it never marks an order paid.
4. **Order reference** unique per attempt (retries create a new attempt or reuse the pending one deliberately); store the provider's transaction id.
5. **Reconcile:** a scheduled job or admin action that asks the provider for the status of orders stuck in `pending` > N minutes.
6. **Secrets** (private keys, merchant secrets, tokens) only in server env vars; never in the client bundle, logs or error messages. Test and live keys in separate environments.
7. **Tests:** signature verification (valid, tampered body, wrong key), idempotency (same webhook twice), amount mismatch, unknown order, state transitions — with recorded sample payloads from the provider's docs/sandbox.

## Providers
| Provider | Shape of the integration (check the docs) | Docs |
|---|---|---|
| **Stripe** | Checkout Session or Payment Intents on the server; webhooks verified with the `Stripe-Signature` header via the SDK's `webhooks.constructEvent(rawBody, signature, endpointSecret)`; idempotency keys on create calls; `stripe listen --forward-to localhost:<port>/<path>` for local webhooks; test keys `sk_test_…`. | docs.stripe.com |
| **LiqPay** (PrivatBank) | Server builds `data` = base64(JSON params) and `signature` = base64(sha1(private_key + data + private_key)); the checkout form posts both; the callback to `server_url` carries `data` + `signature` — recompute and compare before trusting `status` `[verify]`. Sandbox mode via a parameter/sandbox keys `[verify]`. | liqpay.ua/documentation |
| **WayForPay** | Request signature = HMAC-MD5 over the documented fields joined with `;` using the merchant secret; the `serviceUrl` callback must be verified the same way and answered with the documented JSON (`orderReference`, `status: "accept"`, `time`, `signature`) or it is retried `[verify]`. | wiki.wayforpay.com |
| **Monobank acquiring** (plata by mono) | Server creates an invoice via the merchant API with the `X-Token` header, amount in kopiyky, `ccy` 980; redirect to the returned page URL; webhooks are signed — verify the `X-Sign` header (ECDSA) with the public key from the merchant pubkey endpoint, cache the key and refresh on failure `[verify]`. | api.monobank.ua/docs/acquiring.html |
| **Fondy, Portmone, Apple Pay / Google Pay** | Same rules; Apple Pay on the web needs domain verification; wallets usually come through the acquirer's SDK. | provider docs |

## Delivery and messaging
| Service | Notes | Docs |
|---|---|---|
| **Nova Poshta API** | JSON API: POST with `apiKey`, `modelName`, `calledMethod`, `methodProperties`; cities/warehouses are large reference lists — cache them (daily refresh), search server-side, never ship the API key to the client; TTN creation and tracking server-side `[verify]` current version and method names. | developers.novaposhta.ua |
| **Ukrposhta, Meest** | Similar server-side pattern; check the current API and auth model. | provider docs |
| **SMS / OTP** (TurboSMS, Twilio, etc.) | Rate-limit per phone and IP, short-lived codes, attempt caps, no code in logs; E.164 phone normalisation (`+380…`); a test mode that never sends real SMS. | provider docs |
| **Telegram bots** | Webhook with a secret token header (`X-Telegram-Bot-Api-Secret-Token`) checked on every update; token in env; long tasks queued, the webhook answers fast. | core.telegram.org/bots/api |
| **Fiscal receipts (ПРРО)** | Software cash registers such as Checkbox expose REST APIs for receipts; *whether* a receipt is required is a business/tax question → perfect-business component `[verify]`. | provider docs |

## Checkout UX that prevents support tickets
- Show the total with delivery before payment; show the payment status page that polls the server (or uses the webhook result) instead of trusting the redirect.
- Cash on delivery (накладений платіж) is a separate order state and flow, not a failed payment.
- Ukrainian phone, city and branch fields: autocomplete from the carrier's directory, validate before submit, keep the user's input on errors.
