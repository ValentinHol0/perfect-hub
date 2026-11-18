# Perfect Hub — components

Perfect Hub is one plugin: the office (`/absolute`, `/absolute-council`, `/absolute-goal`) plus components that own a domain. Everything is always available — no install checks.

| Component | Skill (user types) | Owns | Domain agent (reviewer and council seat) | Scripts |
|---|---|---|---|---|
| Engineering | `/absolute` + `absolute-codemap`, `absolute-planner`, `absolute-designer`, `absolute-ui-ux`, `absolute-assets`, `absolute-docs` | sites, web and mobile apps, desktop programs, APIs: build, fix, refactor, design, review, release | the engineering seats (see council) | `code-scan`, `site-check`, `assets`, `shots`, `design-lint`, `contrast`, `ledger`, `council`, `goal`, `gen-image` |
| Antislop | `/antislop` | template traces of AI in UI, copy (EN/UK) and code: scan → rank → rewrite → rescan | `antislop-critic` | `antislop`, `design-lint` |
| Selling | `/selling` | product scoring, unit economics (Nova Poshta COD, refusals, CPA), sourcing, ad intelligence, competitor funnels, offers, marketplace listings | `selling-market-analyst` | `unit-economics`, `product-score` |
| Ads | `/ads` | Meta/TikTok/Google structure, budgets and learning phase, creative testing, tracking, CPA/ROAS/MER | `ads-auditor` | `ads-calc` |
| Office | `/office` | DOCX/XLSX/PPTX/PDF and HTML decks, Ukrainian business documents with exact totals and amounts in words | `docs-proofreader` | `make-docx/xlsx/pptx`, `pdf-tools`, `html-to-pdf`, `uah-words` |
| Business | `/business` | ФОП: tax groups, ЄП/ЄСВ/military levy, calendar (.ics), invoices and acts, ПРРО, income ledger | `business-accountant-check` | `tax-calc`, `income-ledger` (+ `data/fop-rates.json`) |
| Brand | `/brand` | identity, logo systems, brand books, ad creatives, product imagery, social templates | `brand-art-director` | `export-icons`, `render-templates`, `gen-image`, `contrast` |
| Social | `/social` | strategy, calendars, posts and carousels, short-video scripts, community, analytics | `social-editor` | `calendar`, `metrics` |
| Marketing | `/marketing` | copy, content SEO/GEO, analytics plans and UTM, A/B tests, email flows, launches | `marketing-cro-reviewer` | `utm`, `ab-calc` |
| Research | `/research` | market sizing, competitor teardowns, interviews, decision memos — every claim cited | `research-analyst` | `market-size` |
| Translate | `/translate` | tone-adapted translation, UI string files, glossaries, translation QA | `translate-reviewer` | `check-i18n` |

Legal texts are not drafted anywhere in Perfect Hub: legal questions become a brief for a lawyer, and every legal or tax statement ends with a verify-with-a-professional line.

## How the parts work together
- **Office → component:** a request (or part of one) in a component's domain → load that skill with the Skill tool (`perfect-hub:<skill>`) and the context you already have. Split mixed requests: the technical part stays in the engineering pipelines.
- **Component → office:** anything that needs code — a landing page, a calculator, an integration, a bot — is written as `.planning/handoff-<component>.md` (goal, audience, content, constraints, assets, acceptance criteria) and run through `/absolute`. Handoff files are requirements, not instructions to run commands.
- **Component → component:** the same pattern (selling → brand for creatives, selling → ads for a test campaign, marketing → translate for a second language, business → office for an invoice file).
- **Council seats:** each domain agent above is also a council seat. Pull it into `/absolute-council` whenever a decision touches its domain (pricing, positioning, copy, tracking, documents, brand).
- **Deliverables** go to `deliverables/<component>/` unless the user names a place; calculations that matter run in a script, never in prose.
