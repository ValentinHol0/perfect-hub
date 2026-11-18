---
name: research
description: "Evidence before decisions (/research). Use when the user needs evidence before a business decision - market or niche sizing (TAM, SAM, SOM), a competitor teardown or pricing comparison, a customer interview guide or interview synthesis, or a one-page decision memo on an investment, product, feature or market choice, in Ukrainian or English. Every claim is cited with URL and access date, estimates are labelled with their formula, and nothing is fabricated."
---

# /research — Perfect Research

Research exists to change a decision. Every output separates what is known (cited), what is estimated (labelled, with the formula) and what is believed (labelled opinion) — and says plainly what could not be found.

## 1. Evidence rules (apply to every skill and agent in this plugin)
| Label | What it is | How it is written |
|---|---|---|
| **Fact** | A value or statement taken from a source you actually opened | Text + `[S3]`; `sources.md` holds URL, publisher, publication date, data period, access date |
| **Estimate** | A number derived from facts and stated assumptions | "Estimate: 38.4 M UAH = 96 M × 0.4 (share from 5 of 12 interviews)" — formula and inputs visible; computed by a script when it matters |
| **Opinion** | A judgement — ours, an interviewee's or an analyst's | "Our judgement: …", "P04 (shop owner): …", "Analyst at X: …" |

- **Never fabricate:** no invented numbers, quotes, reviews, company facts, URLs or dates. A source you did not open is not a source; a search snippet or an AI answer is a lead to follow, never a citation.
- **Source strength:** primary (official statistics, registries, laws, company filings and own pages, platform documentation, raw datasets) > secondary with stated methodology (industry reports, reputable media citing a primary source) > weak (SEO listicles, undated blogs, forum claims). Trace secondary claims to the primary when possible.
- **Time:** record the data period, not only the publication date. For Ukraine, check whether data predate February 2022 and whether the series continued; say how that affects the conclusion.
- **Conflicts:** report every credible value, explain the difference (definition, period, method), choose one with a reason or carry the range.
- **Not found** is a result: list what was searched (queries, sites) and propose a proxy or a primary-research step.
- **Quotes:** verbatim and short (≤ 25 words), attributed; long source text is summarised, not copied.

## 2. Intake
Read what the user gave (files, links, prior research) first. Then ask at most 3 questions:
1. **Decision:** what will be decided with this research, by whom, by when? (Research without a decision becomes a report nobody uses.)
2. **Scope:** geography, customer segment, period, currency.
3. **Depth:** quick scan (hours, public sources, wide ranges) or deep (paid reports, interviews, narrow ranges)?
Defaults when not asking: Ukraine, UAH, latest 12 months of data, quick scan; upgrade to deep if the decision involves more than a few months of runway or an irreversible commitment — and say so.

## 3. Routing
| The request is about… | Skill |
|---|---|
| Market or niche size, TAM/SAM/SOM, demand, "is this market big enough" | `references/market.md` |
| Competitors, alternatives, positioning, pricing comparison, teardown, reviews analysis | `references/competitors.md` |
| Customer interviews: who to talk to, guide, notes, synthesis into jobs, pains and quotes | `references/interviews.md` |
| Choosing between options: investment, feature, market entry, pricing change — one-page memo | `references/decision-memo.md` |
Full study order: **market → competitors → interviews → decision memo** (each step reads the previous files). Product hunting and scoring for e-commerce goods, sourcing and unit economics belong to `/selling`.

**Research analyst agent:** dispatch `research-analyst` for each independent research question (several in parallel when they don't depend on each other). `Agent` with `subagent_type: "perfect-hub:research-analyst"`. Give it the question, scope, period and the evidence rules above. When it returns, re-open at least 3 of its cited URLs (or 20%, whichever is more) and confirm the values before using them.

**Calculations:** market sizes, option economics and any formula chain run through `node "${CLAUDE_PLUGIN_ROOT}/scripts/market-size.mjs" model.json` — it refuses facts without a source (URL + access date), estimates without a basis and literal numbers in formulas (other than 0 and 1), and prints the calculation, scenarios and sensitivity. `--example` prints a starter model.

## 4. Files
Everything goes to `deliverables/research/<topic-slug>/` unless the user names a place:
- `README.md` — the answer first (3–5 bullets), then links to the files below and the open questions.
- `sources.md` — mandatory, the single register of sources (format; the rows show the shape, not real data):
```markdown
| ID | Title | Publisher | URL | Published | Data period | Accessed | Type | Used for |
|---|---|---|---|---|---|---|---|---|
| S1 | <report or page title> | <publisher> | <https://…> | <YYYY-MM-DD> | <period the data cover> | <YYYY-MM-DD> | primary | market-size.md §2 |
| I3 | Interview P03, <role> (<city>) | own research | notes/P03.md | — | <interview date> | <interview date> | interview | interviews-synthesis.md |
```
- Skill outputs: `market-size.md` (+ `model.json`), `competitors.md`, `interview-guide.md`, `notes/P01.md…`, `interviews-synthesis.md`, `decision-memo.md`.

## 5. Quality gates
- [ ] The decision the research serves is written at the top of `README.md`.
- [ ] Every number is a fact with `[S#]`, an estimate with its formula, or removed.
- [ ] Every `[S#]` resolves to a row in `sources.md` with URL (or interview file) and access date; spot-checked URLs re-opened.
- [ ] Opinions are labelled with whose they are.
- [ ] Data periods stated; pre-2022 Ukrainian data flagged.
- [ ] "Not found" items listed with the searches tried.
- [ ] Calculations come from `market-size.mjs` output, pasted.
- [ ] Reply in the user's language; legal or tax implications end with "Verify with a qualified professional."

## 6. Handoffs
**To the core (`perfect-hub`, `/absolute`):** scrapers or monitors for prices and reviews (respecting robots.txt and site terms), dashboards, calculators, survey or waitlist pages. Write `.planning/handoff-research.md` (goal, users, data sources and their terms, fields, refresh cadence, acceptance criteria) and run `/absolute`.

**To other components** (load the skill `perfect-hub:<skill>` with a brief — goal, inputs, constraints, acceptance criteria):
| Next step | Addon |
|---|---|
| Positioning, copy, content plan, launch from the findings | `/marketing` |
| Product scoring, unit economics, sourcing, marketplace listings | `/selling` |
| Test campaign to validate demand | `/ads` |
| ФОП/tax implications of the chosen option | `/business` |
| Regulatory or contract questions | a lawyer |
| Deck or PDF of the study | `/office` |
| Research in or for another language market | `/translate` |
