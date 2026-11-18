# Content SEO and GEO

Rank and get cited by being the most useful, most verifiable page for a real query — not by gaming signals. Sources with check dates: `${CLAUDE_PLUGIN_ROOT}/skills/marketing/references/content-seo/sources.md`. Brief template and AI-visibility tracking: `${CLAUDE_PLUGIN_ROOT}/skills/marketing/references/content-seo/brief-template.md`.

**Boundary.** This skill owns what the page says and how pages relate. Crawling, indexing, robots.txt, sitemaps, canonical tags, redirects, hreflang, structured-data code, page speed and Core Web Vitals belong to the core (`/absolute`) — list them in `.planning/handoff-marketing.md` under "Technical SEO" and move on.

## 1. Keyword research (real data only)
Volumes from any tool are estimates; write the source and date next to every number. Never invent volumes or difficulty scores.

| Source | Use it for | Caveat |
|---|---|---|
| Google Search Console → Performance | Queries the site already gets impressions for, CTR, average position, pages per query; about 16 months of history (`sources.md`) | Only for a verified existing site; some rare queries are withheld for privacy `[Unverified on the cited page]` |
| Google Keyword Planner (Google Ads account) | Volume estimates, related ideas, bid ranges | Estimates; very low-volume and sensitive keywords are hidden |
| Google Trends | Seasonality, region split, rising queries, comparing two phrasings (UA vs RU, brand vs category) | A 0–100 index over a sample, not volume |
| Live SERP (fetch or the browser) | Intent, dominant format, who ranks, SERP features (AI Overview, People Also Ask, shopping, video, map) | Personalised and location-dependent — note the location used |
| Autocomplete, People Also Ask, related searches; Rozetka/Prom/YouTube search suggestions | Real phrasing, long-tail questions, product attributes | No volumes |
| Ahrefs / Semrush / Serpstat (if the user has access) | Volume and difficulty estimates, competitor keyword gaps | Modelled data; tools disagree — use for relative priority, not absolutes |
| Customer language: reviews, support chats, sales calls, forum threads | Words customers actually use, objections, comparisons | Needs a manual pass |

**Process**
1. **Seeds:** product and category names, problems solved, competitors' main pages, customer phrasing. Ukraine: collect Ukrainian and Russian phrasings separately — people search in both; which language versions to build is the user's decision (the Ukrainian version is the legal default for Ukrainian businesses' sites, Law No. 2704-VIII art. 27). Never machine-translate a keyword list: check each language's real queries.
2. **Expand** with the sources above. Keep a sheet: `query | language | source | volume (source, date) | GSC impressions | current ranking URL`.
3. **Classify intent from the live SERP, not from the words** — informational (guides dominate), commercial investigation (comparisons, "best", reviews), transactional (category/product pages, shopping units), navigational (one brand), local (map pack).
4. **Cluster by SERP overlap:** queries whose top-10 results share several URLs belong on one page; different result sets mean different pages. State the overlap threshold you used.
5. **Map one primary cluster to one URL.** Two pages chasing the same cluster cannibalise each other — merge them (redirect = core task).
6. **Prioritise:** business value (does this intent lead to the primary action?) × attainability (who ranks: marketplaces and big media vs small sites like ours) × demand. Score 1–3 each; start with the highest product.

**Deliverable — keyword map:** `cluster | primary query | secondary queries | intent | dominant SERP format | demand (source, date) | target URL (existing/new) | priority | notes`.

## 2. Match the intent and format
- Format follows what ranks: if the top 10 are category pages, a blog post will not rank for that query — build or improve the category page; if they are comparison guides, write the comparison.
- Beat the format on substance: first-hand testing, original photos, real prices in UAH with the check date, a calculator or table, a clear recommendation per reader type.
- Commercial pages need commercial content: assortment, filters that match query attributes, delivery and payment info, reviews — not a 2 000-word SEO text block under the grid.

## 3. Content brief
Every new or rewritten page gets a brief (template in `brief-template.md`): target cluster and intent, reader and job, the angle (what this page adds that the current top results lack — information gain), outline with H2s phrased as the reader's sub-questions, facts to include with sources, first-hand evidence to gather (photos, tests, data, quotes from in-house experts), author and reviewer, internal links in and out, CTA matched to intent, title and meta description drafts.

## 4. On-page content rules
- Answer first: the first 1–3 sentences under the H1 and under each H2 answer the question directly; detail follows.
- One H1 that says what the page is; H2s that a reader scanning only headings would understand.
- Self-contained sections: each H2 block makes sense if quoted alone (this is what AI answers and featured snippets lift).
- Facts carry their source and date in the text ("за даними НБУ на 01.10.2026" — with a link). Prices dated.
- Tables for comparisons and specs; lists for steps; images that show something (own photos, diagrams) with descriptive alt text.
- Title tag: primary phrasing first, then the differentiator, then the brand; Google truncates titles by pixel width, so keep the query in the first words. Meta description: the page's promise in one sentence with a reason to click; it is not a ranking factor and Google may rewrite it.
- URL slug: short, transliterated (KMU No. 55 rules — `node "${CLAUDE_PLUGIN_ROOT}/scripts/utm.mjs"` uses the same transliteration) or English; consistent across the site; never change live URLs without a redirect plan (core).
- Do not write to a word count and do not bump dates without real updates — Google lists both as warning signs of search-engine-first content.
- AI-assisted drafts are fine when they are accurate, original and reviewed; mass-producing pages to manipulate rankings violates Google's spam policies. Disclose AI use where readers would reasonably wonder.

## 5. Internal linking
- Build hubs: one pillar page per topic linking to every cluster page; each cluster page links back to the pillar and to 2–3 siblings where it helps the reader.
- Every new page gets contextual links from at least 3 relevant existing pages at publish time (a working rule, not a Google threshold) — list them in the brief.
- Anchor text describes the target page in natural words; vary it; never "тут" / "click here".
- Find orphans and weak pages: Search Console → Links (internal) and a site crawl (core). Pages with impressions but position 8–20 are the cheapest wins: add links from strong pages and improve the answer.
- Breadcrumbs, navigation and faceted URLs are implementation — core.

## 6. E-E-A-T (experience, expertise, authoritativeness, trust)
Google's guidance: trust is the most important element; topics affecting health, finances, safety or well-being (YMYL) get extra weight. Make Who, How and Why visible:
- **Who:** bylines linking to author pages with real credentials and photos; never invented experts or AI-generated headshots.
- **How:** show first-hand experience (we tested 6 kettles for 2 weeks — photos, measurements), the method, and how AI or automation was used.
- **Why:** content exists to help a reader decide or do something, with a clear recommendation.
- Site trust: real contacts, legal entity and ФОП/ТОВ details where required, returns and delivery terms, reviews with sources, editorial or review policy for YMYL.

## 7. GEO — being cited by AI answers
Facts checked 2026-11-12 (see `sources.md`):
- **Google AI Overviews and AI Mode:** no special optimisation, files or schema are required; a page must be indexed and eligible to show a snippet. `nosnippet`, `data-nosnippet`, `max-snippet` and `noindex` limit appearance. Clicks are reported in Search Console under the "Web" search type, not separately.
- **ChatGPT search:** pages appear when `OAI-SearchBot` may crawl them; `GPTBot` (training) is controlled independently, so a site can allow search and block training. robots.txt edits are a core task.
- **Evidence on what helps:** the GEO paper (Aggarwal et al., KDD 2024) found that adding quotations, statistics and cited sources raised visibility in generative-engine answers by up to about 40% on their benchmark, while keyword stuffing performed worse than the unoptimised baseline. A benchmark result, not a guarantee.

Practices:
1. Write passages an AI can lift and attribute: a direct answer, then the supporting fact with its source and date, under a heading that states the question.
2. Publish original, citable data: price indexes, test results, survey numbers with method and sample size. Original data is what others (and AI answers) cite.
3. Keep entity facts identical everywhere: brand name, address, phone, prices, delivery terms across the site, Google Business Profile, Merchant Center, marketplaces, social profiles.
4. Earn third-party mentions where answers are sourced: independent reviews, comparison articles, forums, YouTube reviews, industry media (DOU, AIN, Forbes Ukraine for tech/business — choose by audience). Never fake reviews or plant undisclosed posts.
5. Treat `llms.txt` as optional — Google states no AI text files are needed; other assistants have not committed to reading it `[Unverified]`.
6. Measure with a fixed prompt set (see `brief-template.md` §3) plus AI-assistant referrals in GA4.

## 8. Content plan and maintenance
- Plan by cluster and funnel stage, with a cadence the team can sustain; every item has a brief owner, author, reviewer and due date.
- Quarterly: export Search Console and archive the exports (history is limited to about 16 months), find pages losing clicks, refresh the answer and facts, consolidate overlapping pages (redirects via core), prune pages with no traffic, links or purpose.

## 9. Delivery checklist
- [ ] Every volume, ranking or trend number has its source and date; no invented metrics.
- [ ] Intent and format confirmed on the live SERP (location noted).
- [ ] One primary cluster per URL; cannibalisation resolved.
- [ ] Brief includes information gain, sources, first-hand evidence, author, internal links.
- [ ] GEO practices applied; measurement plan included.
- [ ] Technical items listed for the core; content files in `deliverables/marketing/<slug>/`.

Credit: SEO and GEO checklist ideas partly paraphrased from coreyhaines31/marketingskills (MIT).
