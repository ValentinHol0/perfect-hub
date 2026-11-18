# UTM convention

Enforced by `node "${CLAUDE_PLUGIN_ROOT}/scripts/utm.mjs"` (`build` normalises and validates, `check` validates as-is, `mediums` lists the allowed media with their GA4 channel).

## Rules
| Parameter | Rule | Example |
|---|---|---|
| `utm_source` | Required. The platform, site or list that sent the click; never a URL or `www.` | `instagram`, `google`, `telegram`, `newsletter`, `dou` |
| `utm_medium` | Required. One of: `cpc`, `ppc`, `paid_social`, `paid_video`, `retargeting`, `display`, `banner`, `cpm`, `social`, `email`, `sms`, `push`, `referral`, `affiliate`, `organic`, `video`, `audio` | `paid_social` |
| `utm_campaign` | Required. `yyyy-mm_<name>[_<market or segment>]` | `2026-11_black-friday_ua` |
| `utm_content` | Creative, placement or link position | `reels-a`, `hero-button` |
| `utm_term` | Keyword or audience (paid search outside Google Ads, audience tests) | `crm-dlia-magazynu` |
| `utm_id` | Campaign ID from the ad platform, for cost-data import | `120210000000` |
| All values | lowercase ASCII `a-z 0-9 . _ -`, no spaces, ≤ 100 characters; words joined by `-`, fields by `_`; Ukrainian transliterated (KMU No. 55, 2010) | `2026-11_chorna-piatnytsia_ua` |

## Channel table (Ukrainian defaults)
| Placement | utm_source | utm_medium | utm_content | GA4 default channel |
|---|---|---|---|---|
| Meta ads (Facebook / Instagram placements) | `facebook` or `instagram` | `paid_social` | ad or creative name | Paid Social if GA4 recognises the source, else Paid Other |
| TikTok ads | `tiktok` | `paid_social` | creative name | as above |
| Google Ads | — use auto-tagging (gclid), no manual UTMs | — | — | Google Ads rules |
| Own Telegram channel post | `telegram` | `social` | post slug | Organic Social |
| Paid post in another Telegram channel | `telegram` | `paid_social` | channel handle | Paid Social or Paid Other (`telegram` on Google's social list is `[Unverified]`) |
| Telegram Ads | `telegram` | `cpc` | ad name | Paid Other unless the source is recognised |
| Instagram bio / stories link (organic) | `instagram` | `social` | `bio`, `story-<date>` | Organic Social |
| Influencer (paid fee) | platform (`instagram`, `youtube`, `tiktok`) | `paid_social` | creator handle | Paid Social / Paid Other |
| Influencer (commission) | platform | `affiliate` | creator handle | Affiliates |
| Email newsletter or flow | `newsletter` or flow name | `email` | link position | Email |
| SMS | `sms` or provider | `sms` | message name | SMS |
| Viber / Telegram bot broadcast | `viber` / `telegram` | `push` — or a custom `messenger` medium with `--allow-medium messenger` and a GA4 custom channel group | message name | Mobile Push (or your custom group) |
| PR article, partner site, directory | site name (`ain`, `dou`) | `referral` | article slug | Referral |
| Offline QR (flyer, packaging) | placement (`flyer`, `box-insert`) | custom `offline` with `--allow-medium offline` + custom channel group | location or batch | Unassigned in the default group |

## Process
1. Build every link with `utm.mjs build` from a sheet; paste the output into `utm-links.csv` with the check date.
2. Before launch, run `utm.mjs check --file links.txt --site <own domain>` on everything published; exit code 0 or fix.
3. Keep one dictionary of allowed sources per company; add new ones deliberately, not ad hoc.
4. After launch, look for `(not set)` and unexpected sources in GA4 traffic acquisition — they show where the convention leaked.
