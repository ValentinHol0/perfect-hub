# Data sources for market and competitor research

"Checked" = opened on 2026-11-12 and identity confirmed. "Not fetched" = automated fetch blocked or not attempted; open it in a browser before relying on it. Availability and coverage change — record the access date for every value you take.

## 1. Ukraine — official and registry data
| Source | URL | Use for | Caveats | Status |
|---|---|---|---|---|
| State Statistics Service (Держстат) | https://stat.gov.ua (also ukrstat.gov.ua) | GDP, CPI, wages, retail trade, enterprise statistics, population estimates | Check every series' latest period — continuity after February 2022 varies by series `[Unverified scope — check each series]`; treat population figures since 2022 as uncertain (displacement, occupied territories) and carry a range | Checked |
| Open data portal | https://data.gov.ua | Datasets from ministries and agencies (registries, licences, transport, education) | Dataset quality and update frequency vary — check the "last updated" date of each dataset | Checked |
| Prozorro (public procurement) | https://prozorro.gov.ua | B2G demand: what public buyers purchase, volumes, prices, suppliers | Only public buyers; categories by CPV codes | Checked (identity) |
| National Bank of Ukraine statistics | https://bank.gov.ua/ua/statistic | Payments and card statistics, exchange rates, financial sector, external sector | — | Not fetched (403 to automated fetch) |
| Unified State Register (ЄДР) search | https://usr.minjust.gov.ua | Company and ФОП registration details, KVED activity codes | Registration ≠ activity | Not confirmed (page content not readable by fetch) |
| Opendatabot, YouControl (commercial aggregators of state registers) | https://opendatabot.ua · https://youcontrol.com.ua | Counts of companies/ФОП by KVED and region, company profiles, financial statements where published, court cases | Paid tiers; aggregated from registries — cite the aggregator and the date | Not fetched (403) / not attempted |
| Laws and regulations | https://zakon.rada.gov.ua | Regulatory constraints that shape SAM (licences, language, labelling) | Use the current edition date | Checked |
| Tax Service | https://tax.gov.ua | Tax-group rules and limits that affect ФОП customers | Changes often; legal/tax conclusions go to `/business` or a lawyer | Not attempted |

## 2. Demand and behaviour signals
| Source | URL | What it gives | Caveats |
|---|---|---|---|
| Google Trends | https://trends.google.com | Relative interest over time and by region, 0–100, from a sample of searches (Google Trends help, checked) | Index, not volume; compare phrasings in Ukrainian and Russian separately |
| Google Keyword Planner | https://ads.google.com (Tools → Keyword Planner) | Monthly search estimates, bid ranges (Google Ads help, checked) | Estimates; low-volume and sensitive keywords hidden |
| Google Search Console | https://search.google.com/search-console | The user's own query demand and CTR | Only for the user's verified site |
| Marketplaces: Rozetka, Prom, Epicentr, OLX | rozetka.com.ua · prom.ua · epicentrk.ua · olx.ua | Number of listings and sellers in a category, price distribution, review counts and velocity as a demand proxy | Review-to-order ratios are unknown — never assume a fixed ratio without a basis; record the date; respect site terms (no aggressive scraping) |
| App stores | apps.apple.com · play.google.com | Ratings, review counts, version history of competitor apps | Download counts are ranges on Google Play |
| Job sites (work.ua, robota.ua, DOU for IT) | work.ua · robota.ua · jobs.dou.ua | Hiring as a growth signal for competitors and B2B demand | Not attempted |

## 3. Advertising transparency (competitor activity)
| Source | URL | What it gives | Caveats |
|---|---|---|---|
| Meta Ad Library | https://www.facebook.com/ads/library | Active ads of a page across Meta technologies, start dates, creatives | Not fetched (403 to automated fetch) — use in a browser |
| Google Ads Transparency Center | https://adstransparency.google.com | Ads by advertiser and region | Checked (identity only) |
| TikTok Commercial Content Library | https://library.tiktok.com | Ads and paid-partnership content | Launched in 2023 for ads shown in Europe; coverage of other countries `[Unverified]` |

## 4. International
| Source | URL | Use for | Status |
|---|---|---|---|
| Eurostat | https://ec.europa.eu/eurostat | EU market comparisons, household spending, e-commerce use | Not attempted |
| World Bank Open Data | https://data.worldbank.org | Population, GDP, cross-country baselines | Not attempted |
| OECD Data | https://data.oecd.org | Sector and price comparisons | Not attempted |
| UN Comtrade | https://comtradeplus.un.org | Import/export by HS code as a proxy for product markets | Not attempted |
| Company filings (SEC EDGAR, Companies House, Ukrainian financial statements via aggregators) | https://www.sec.gov/edgar · https://find-and-update.company-information.service.gov.uk | Competitor revenue and customer counts for analogues | Not attempted |

## 5. Primary research (when public data run out)
Customer interviews (`references/interviews.md`), a short screener survey to estimate a share, a smoke test (landing page + small ad budget via `/ads` and `/marketing`) to measure real click-through and sign-up rates, mystery shopping as a genuine customer to observe prices and service. Each produces a source row (`I#` for interviews, `T#` for tests) with date and method.

## 6. How to cite
In `sources.md`: ID, title, publisher, URL, publication date, data period, access date, type (primary / secondary / interview / test), and where it is used. In text: the value, its period and `[S#]`. If a figure is converted (currency, period), the conversion is an estimate: write the rate, its source and date.
