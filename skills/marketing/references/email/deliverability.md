# Deliverability — checks and sources

## 1. DNS checks (run them; paste the output into the deliverable)
Replace `example.ua` with the From domain and `selector` with the ESP's DKIM selector (shown in the ESP's domain settings).
```bash
# SPF: exactly one record starting with v=spf1
nslookup -type=TXT example.ua
dig +short TXT example.ua

# DKIM: public key published under the selector
dig +short TXT selector._domainkey.example.ua

# DMARC: policy and reporting address
dig +short TXT _dmarc.example.ua

# Reverse DNS of the sending IP (dedicated IPs only; from a received message's headers)
dig +short -x 203.0.113.10
```
On Windows without `dig`, use `nslookup -type=TXT _dmarc.example.ua` (PowerShell: `Resolve-DnsName -Type TXT _dmarc.example.ua`).

Read the results:
| Check | Pass | Common failures |
|---|---|---|
| SPF | one `v=spf1 … -all` or `~all` record; ≤ 10 `include`/`a`/`mx`/`ptr`/`exists`/`redirect` terms after expansion | two SPF records; too many includes (every ESP, CRM and helpdesk added) → permerror |
| DKIM | `v=DKIM1; k=rsa; p=…` key present; ESP shows "verified" | selector typo; key not published on the From domain (ESP signs with its own domain → no alignment) |
| DMARC | `v=DMARC1; p=none|quarantine|reject; rua=mailto:…` | missing; `p=reject` before all senders align → legitimate mail lost |
| Alignment | From domain = DKIM `d=` domain (or SPF Return-Path domain) | ESP default sending domain used |
| Headers on a test message | `List-Unsubscribe` with an https URL and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` on marketing mail; `Authentication-Results` shows `spf=pass`, `dkim=pass`, `dmarc=pass` | header missing on campaigns; DMARC fail on forwards |

DMARC rollout: `p=none` + reports for 2–4 weeks → fix every legitimate source → `p=quarantine; pct=` partial → `p=reject`. Read aggregate reports with a DMARC report tool; do not move to reject on a guess.

## 2. Facts and sources (checked 2026-11-12)
| Fact | Source |
|---|---|
| All senders to Gmail: SPF or DKIM, valid forward and reverse DNS, TLS, spam rate below 0.3% in Postmaster Tools, RFC 5322 format, no Gmail From impersonation | https://support.google.com/a/answer/81126 |
| Bulk senders (more than 5 000 messages/day to Gmail): SPF, DKIM and DMARC (policy may be `none`); From aligned with SPF or DKIM domain; one-click unsubscribe for marketing (List-Unsubscribe-Post and List-Unsubscribe headers, RFC 2369 and RFC 8058) and a visible unsubscribe link; spam rate below 0.30%, recommended below 0.10%; DKIM keys 1024 bits minimum, 2048 recommended; requirements from February 2024 | https://support.google.com/a/answer/81126 |
| Unsubscribes: Google recommends honouring within 48 hours; bulk-sender status is permanent once the threshold is met; enforcement ramping up from November 2025, faster for new domains | https://support.google.com/a/answer/14229414 |
| SPF: at most 10 DNS-querying terms (`include`, `a`, `mx`, `ptr`, `exists`, `redirect`), otherwise permerror; void lookups should be limited to 2 | RFC 7208 §4.6.4 — https://www.rfc-editor.org/rfc/rfc7208#section-4.6.4 |
| DMARC specification | RFC 7489 — https://www.rfc-editor.org/rfc/rfc7489 `[not re-fetched 2026-11-12; check whether an updated DMARC RFC has superseded it]` |
| Commercial electronic messages in Ukraine: consent; opt-out exception; identification as commercial; sender details accessible; conditions of discounts and gifts | Law No. 675-VIII "Про електронну комерцію", art. 10 — https://zakon.rada.gov.ua/laws/show/675-19 |
| Yahoo / Microsoft (Outlook.com) bulk-sender requirements | `[Unverified]` — similar authentication and unsubscribe rules have been announced; read each provider's sender page before advising |
| Gmail clipping of large HTML messages | `[Unverified]` — commonly cited around 102 KB; keep HTML lean and test in Gmail |
