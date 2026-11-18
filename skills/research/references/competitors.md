# Competitor Teardown

Judge competitors by what they actually publish and what their customers actually say — fetched, dated and cited. Never describe a competitor from memory. Matrix template and collection checklist: `${CLAUDE_PLUGIN_ROOT}/skills/research/references/competitors/teardown-template.md`. Data sources: `../research-market/references/data-sources.md` (relative to this file).

## 1. Find the competitive set
Search the way customers search, then widen:
1. **Direct:** same job, same kind of solution, same customers. Find them via the main queries in Google (Ukrainian and English or Russian phrasings, location set to the target market), marketplace search (Rozetka, Prom), app stores, ad libraries, and "alternatives to X" pages.
2. **Indirect:** same job, different solution (a service agency vs a SaaS tool; a course vs a YouTube channel).
3. **Substitutes and the status quo:** spreadsheets, a manager doing it by hand, doing nothing. Interviews (`references/interviews.md`) reveal these best: "What did you use before / instead?"
Pick 3–7 to tear down: the ones customers mention, the ones winning the main queries, and one fast-growing newcomer. Write why each was chosen.

## 2. Collect, per competitor (fetch the pages; record URL and access date for each)
| Area | What to capture | Where |
|---|---|---|
| Positioning | Hero headline and subhead (quote ≤ 25 words), target segment they address, category they claim | Homepage, landing pages from their ads |
| Offer | What's included, guarantee, trial, bonuses, delivery and payment terms (накладений платіж, оплата частинами), returns | Pricing, product, delivery/returns pages |
| Pricing | Entry price, model (one-off, subscription, per seat, commission), plan names and limits, currency, VAT note, discounts | Pricing page — save a snapshot (prices change) |
| Channels | Organic: who ranks for the main queries; content they publish; social accounts with follower counts and posting frequency (dated). Paid: active ads and their angles (Meta Ad Library, Google Ads Transparency Center, TikTok library in the EU). Marketplaces and partners | Search results, profiles, ad libraries |
| Proof | Client logos, case studies, numbers they claim (as their claims, not facts) | Site |
| Reviews | Rating, number of reviews, date range; top 3 praised and top 3 complained-about themes with short attributed quotes | Google Maps, Rozetka/Prom, app stores, G2/Capterra (SaaS), Trustpilot, Telegram/Facebook groups |
| Company | Legal entity, registration date, size signals (hiring, team page), public financials if available | ЄДР/aggregators, LinkedIn, job sites |
| Experience | What a real customer sees: sign-up steps, time to first value, checkout friction, response time of support | Your own genuine trial or purchase |

Rules:
- Their claims are labelled as claims ("Competitor states 10 000 clients [S7]"), never restated as facts.
- Reviews: count themes across at least 30 reviews where available, or all if fewer; say how many you read and the date range. Quote only short excerpts with source and date.
- Ad libraries: note how long ads have been running and how many variants share an angle — a hint at what works for them, not proof (label as interpretation).
- Ethics: interact only as a genuine prospect; no fake identities to extract confidential information; no access behind logins you were not given; no scraping against a site's terms — automated collection is a core task with a terms check.

## 3. Build the matrix
One row per competitor, one column per area, every cell with `[S#]`. Then add three analytic rows (labelled as our analysis):
- **Where they are strong** (from reviews and their channel results).
- **Where customers are unhappy** (complaint themes, with counts).
- **What they would likely do if we entered** (price cut, copy feature, bundle) — judgement, with the evidence it rests on.

## 4. Analyse
- **Positioning map:** choose two axes that matter to customers (from interviews and review themes — e.g. "speed of setup" × "price"), not two that flatter us; place competitors with the evidence for each placement.
- **Price ladder:** entry, typical and premium prices on one line, normalised to one unit (per month, per order, per kg) with the conversion shown.
- **Whitespace:** segments or needs nobody serves well — supported by complaint themes, unmet requests and gaps in the matrix. A gap with no evidence of demand is a hypothesis for `references/interviews.md`, not an opportunity.
- **Threats:** strongest competitor's moat (brand, distribution, price, data, network) and how fast they can copy.

## 5. Deliverable (`competitors.md`)
```markdown
# Competitors — <market>, <date>
Decision this serves: <…>
Set: <names with why each was chosen> · Not included: <who and why>

## Matrix
<table from teardown-template.md, cells cited>

## Review themes
<competitor → praised (n mentions) / complaints (n mentions), with 1–2 short quotes each, sources>

## Positioning map and price ladder
<axes with reasons; normalised prices with conversions>

## Opportunities and threats (our analysis)
<each with the evidence rows it rests on and confidence>

## Gaps in this teardown
<what could not be verified: private pricing, regional offers, logged-in features>
```

## 6. Delivery checklist
- [ ] Every competitor fact comes from a page fetched for this teardown; URL and access date in `sources.md`; pricing snapshot saved or quoted with date.
- [ ] Competitor claims labelled as claims; our analysis labelled as analysis.
- [ ] Review themes based on a stated number of reviews and date range.
- [ ] Substitutes and status quo included.
- [ ] Whitespace backed by evidence or marked as a hypothesis to test.
