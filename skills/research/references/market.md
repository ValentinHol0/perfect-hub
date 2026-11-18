# Market Sizing

A market size is a model, not a number someone published. Build it from things that can be counted, show every multiplication, and make the weakest input obvious. Data sources and their caveats: `${CLAUDE_PLUGIN_ROOT}/skills/research/references/market/data-sources.md`.

## 1. Define the market before searching
Write one line and get it confirmed (or state it as the assumption):
`<Customers> in <geography> who <job / need>, buying <category> at <price basis: retail incl. VAT | net>, per <year>, in <currency>.`
- Customer = who pays (household, ФОП, company by size, school); the user may differ.
- The job, not the product: "keep order records for a small online shop", not "our CRM".
- Price basis and period are fixed; mixing retail and wholesale or monthly and annual figures is the most common error.

**Levels**
- **TAM** — all spending on this job by these customers in this geography and period, whatever solution they use today (including spreadsheets, if they pay for them in time or money — say how you treat non-paying substitutes).
- **SAM** — the part your product can serve with its model, language, channels, price point, legal and logistics constraints.
- **SOM** — the part you can realistically win in a stated horizon (e.g. 3 years), justified by capacity (sales people × deals per month; ad budget ÷ CPA) and by analogues (what comparable players reached), whichever is lower.

## 2. Build the equation tree (bottom-up)
Pick the chain that matches how the market buys:
| Market type | Chain |
|---|---|
| Consumer goods | households (or people) in segment × share who buy the category × purchases per year × average price |
| Subscriptions / SaaS | number of target businesses × share with the need × adoption share × price per month × 12 |
| B2B services | firms by size band (registry counts by KVED) × share needing the service × deals per firm per year × average deal |
| Marketplaces / e-commerce niche | category orders per month (proxy from listings, reviews, seller data) × average order value × 12 |
| Education / courses | target population (e.g. teachers, students by grade) × share who pay for extra learning × spend per year |
Each leaf is either a **fact** (counted or published — cite it), an **estimate** (derived — write the basis) or a **constant** (definitions like 12 months/year).

## 3. Find the inputs
1. List every leaf. For each, search primary sources first (`data-sources.md` §1), then secondary. Dispatch `research-analyst` agents in parallel, one per leaf group, with the market definition and period.
2. Record each found value in `sources.md` (URL, publisher, data period, access date) and in the model with `"type": "fact", "source": "S#"`.
3. For gaps, build an estimate from the nearest facts and say how: proxy (Google Trends shape, marketplace review counts, search demand), analogue (a comparable country or category, adjusted with a stated factor), or primary research (a quick survey or interviews — `references/interviews.md`). Give every estimate a low / base / high range, wider when the basis is weaker.
4. Ukrainian specifics: population and household counts since 2022 are uncertain (displacement, occupied territories) — use a documented estimate, state which, and carry a range; registry counts of ФОП and companies include inactive entities — find or estimate an active share; prices: record the date (inflation and exchange-rate moves make old prices stale).

## 4. Compute with the script (never by hand)
Write `model.json` next to the report and run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/market-size.mjs" --example > model.json   # starter, then replace every value
node "${CLAUDE_PLUGIN_ROOT}/scripts/market-size.mjs" model.json > market-size-calc.md
```
The script refuses: a fact without a source that has a URL and an access date; an estimate without a basis; a literal number other than 0 or 1 inside a formula; a share outside 0–1; a range not ordered low ≤ base ≤ high. It prints inputs, each formula with the numbers substituted, all-low / base / all-high corners, and a one-at-a-time sensitivity table for the last step. Paste its output into `market-size.md` unchanged.

## 5. Cross-check
- **Top-down:** a published category total (statistics, industry report) × the share your definition covers. If bottom-up and top-down differ by more than ~2×, find the reason (definition, double counting, price basis) before reporting either.
- **Demand signals:** search demand trend (Google Trends shape, Keyword Planner estimates), marketplace activity (number of sellers and listings, review velocity), job postings, ad library activity. They support direction and seasonality, not size.
- **Sanity:** spend per customer vs income or budget (does the implied average spend make sense for this segment?), SOM vs your own capacity.

## 6. Write it up (`market-size.md`)
```markdown
# <Market> — size estimate (<geography>, <period>, <currency>)
Decision this serves: <…>
Definition: <one line from §1>

## Answer
TAM ≈ <base> (corners <low>–<high>) · SAM ≈ … · SOM (<horizon>) ≈ …
Confidence: <low/medium/high> — weakest input: <name> (<why>)

## Model
<script output: inputs table, calculations, scenarios, sensitivity>

## Cross-checks
Top-down: <value> [S#] vs bottom-up <value> — <explanation>
Signals: <trend, marketplace, ads> [S#]

## What would narrow the range
<the 1–3 inputs with the largest swing and how to measure them: survey, interviews, test campaign, purchase of a report>

## Not found
<inputs searched for and not found: queries and sites tried>
```

## 7. Mistakes that invalidate a size
- Quoting a "market size" from a press release or SEO article with no method.
- Top-down "1% of a huge market" as the SOM.
- Counting the same spending twice (retailer and manufacturer revenue; parents and students).
- Mixing currencies or years without conversion and dates (state the exchange rate source and date when converting).
- Treating all registered ФОП/companies as active customers.
- Ranges so narrow they hide the guesswork, or so wide they can't inform the decision — then the next step is research, not a decision.

## 8. Delivery checklist
- [ ] Definition line confirmed or stated as an assumption.
- [ ] Every input a cited fact, a labelled estimate with basis, or a constant — enforced by the script.
- [ ] Calculation, corners and sensitivity pasted from `market-size.mjs`.
- [ ] Top-down cross-check done or explained as impossible.
- [ ] Ukraine-specific caveats (population, active-entity share, price dates) addressed.
- [ ] `sources.md` complete; "Not found" section present.
