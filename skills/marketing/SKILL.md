---
name: marketing
description: "Marketing for products and sites (/marketing). Use when the user wants conversion copy for a landing page, email or ad; a content, SEO or GEO plan, keyword research or a content brief; an analytics tracking plan, event taxonomy, UTM links or a consent plan; an A/B test design, sample size or result readout; lifecycle email flows; or a launch plan, in Ukrainian or English. Reads its reference files per task and hands site or tracking code to /absolute, ad buying, social posts and translation to the other Perfect Hub skills (legal texts to a lawyer)."
---

# /marketing — Perfect Marketing

Marketing here means the words, the plan and the measurement that move one audience to one action. Every output is specific to this product and this reader, built on evidence in hand, and measurable. No invented numbers, reviews, quotes, client logos or awards — ever.

## 1. Intake
Read before asking. If the user gives a URL, fetch it (`WebFetch`) and any analytics export, brief or previous copy they mention. Then ask at most 3 questions, only for what changes the output:
1. **Offer and audience:** what is sold, to whom, at what price, and the one action wanted (buy, lead form, sign-up, call).
2. **Evidence:** real numbers, reviews (with permission to quote), guarantees, certificates, case results. "None yet" is a valid answer — then the copy uses mechanism and specifics, not fake proof.
3. **Constraints:** market and language, channel, brand voice (ти/ви), legal or platform limits, deadline.

Defaults when the user doesn't say (state them in one line, then proceed):
- Market Ukraine, currency UAH (`1 299 грн`), copy in Ukrainian for a Ukrainian audience; delivery via Nova Poshta; analytics GA4 (+ PostHog for SaaS products).
- B2C unless the offer says otherwise; write for a phone screen first (confirm the device split in the user's analytics).
- Deliverables in `deliverables/marketing/<project-slug>/`.
Rulings when not asking: missing price → write copy that works without it and flag the gap; no proof → never fill the gap with "thousands of happy customers"; conflicting goals → pick the action closest to revenue and say so.

## 2. Routing
| The request is about… | Skill |
|---|---|
| Landing page, product page, email or ad text, headlines, CTAs, objection handling, editing copy | `references/copy.md` |
| Keyword research, search intent, content plan, content brief, article optimisation, internal links, E-E-A-T, being cited by ChatGPT / AI Overviews (GEO) | `references/content-seo.md` |
| Audit of a live site, technical SEO, schema, sitemaps, Core Web Vitals, Search Console or SERP data, AI-search readiness | `/seo` (Perfect Hub skill) — it measures; this skill writes the copy its findings call for |
| Tracking plan, events, conversions/key events, GA4 or PostHog setup plan, UTM links, consent mode and cookie banner requirements | `references/analytics-plan.md` |
| A/B test design, hypothesis, sample size, duration, MDE, guardrails, reading results, SRM | `references/experiments.md` |
| Welcome, abandoned cart, post-purchase, win-back flows, newsletters, SPF/DKIM/DMARC and deliverability | `references/email.md` |
| Launch plan, launch checklist, go-to-market sequence for a product, feature or store | `references/launch.md` |

Combined requests run in this order, each step reading the previous files: **copy → analytics-plan → experiments → email → launch**. Example: "launch a landing page for our course" = copy (page) → analytics-plan (events, UTMs) → experiments (first test) → launch (plan), with the page build handed to the core.

Independent review: after writing or receiving a landing page, offer page or key email, dispatch the `marketing-cro-reviewer` agent (`Agent` with `subagent_type: "perfect-hub:marketing-cro-reviewer"`). Give it the page URL or copy file, the audience and the goal — not your reasoning.

## 3. Scripts (exact maths stays out of prose)
- `node "${CLAUDE_PLUGIN_ROOT}/scripts/ab-calc.mjs" size|mde|power|srm|test …` — sample size per arm, minimum detectable effect, power, sample-ratio-mismatch check, two-proportion test. Matches R `power.prop.test`.
- `node "${CLAUDE_PLUGIN_ROOT}/scripts/utm.mjs" build|check|mediums …` — builds and validates UTM links against the naming convention (lowercase, fixed medium list mapped to GA4 channels, `yyyy-mm_name` campaigns, Ukrainian transliteration).
Run them; paste their output into the deliverable. Never compute sample sizes or significance by hand.

## 4. Quality gates (every deliverable)
- [ ] One reader, one promise, one primary action per asset.
- [ ] Every number, claim and quote traces to evidence the user gave or a cited source; anything else is removed or marked `[Unverified — confirm before publishing]`.
- [ ] Copy passes the swap test (a competitor could not run it unchanged) and the anti-slop list in `references/copy.md`.
- [ ] Ukrainian text reads as written by a native editor: no calques, correct typography (« », ’, —, `1 299 грн`).
- [ ] Ukrainian-market rules flagged where they apply: advertising and consumer information in the state language (Law No. 2704-VIII, arts. 30 and 32), the Ukrainian version of a site loading by default (art. 27), honest and comparative advertising rules (Law "Про рекламу", arts. 10 and 11). Legal wording goes to a lawyer; end such notes with "Verify with a lawyer before publishing."
- [ ] Measurement attached: what event or metric proves this asset worked, and where it is tracked.
- [ ] Files written to `deliverables/marketing/<project-slug>/`; the chat reply summarises and links them.

## 5. Output format
Reply in the user's language. Files (Markdown unless the user asks for another format):
`copy-<asset>.md` · `content-brief-<slug>.md` · `content-plan.md` · `tracking-plan.md` + `utm-links.csv` · `experiment-<slug>.md` · `email-flows.md` · `launch-plan.md`. Each opens with a 3-line header: goal, audience, primary metric. The chat reply lists the files, the 3 decisions the user must make, and any `[Unverified]` items.

## 6. Handoffs
**To the core (`perfect-hub`, `/absolute`):** building or changing a page, form, email template code, tracking/consent implementation, structured data, sitemaps, robots.txt, page speed, i18n in code. Write `.planning/handoff-marketing.md`:
```markdown
# Handoff: marketing → absolute
Goal: <one sentence> · Audience: <who> · Primary action: <event name>
Content: <paths to copy files, final and approved>
Tracking: <path to tracking-plan.md — events, parameters, consent behaviour>
Constraints: <brand, legal, language versions, deadline>
Assets: <images, logos, fonts and where they live>
Acceptance criteria: <copy rendered verbatim · events fire in GA4 DebugView with listed params · consent default denied before choice · mobile 375 px layout>
```
Then run `/absolute` with that file.

**To other components** (load the skill `perfect-hub:<skill>` with a brief — goal, inputs, constraints, acceptance criteria):
| Need | Addon |
|---|---|
| Campaign structure, budgets, audiences, creative testing in Meta/TikTok/Google | `/ads` |
| Posts, carousels, Reels scripts, content calendar for social | `/social` |
| Visuals, ad creatives, product photos, logo | `/brand` |
| Privacy/cookie policy, public offer, returns terms, claim review | a lawyer |
| Second language version, glossary | `/translate` |
| Market sizing, competitor teardown, customer interviews | `/research` |
| Offer, pricing, unit economics, marketplace listings | `/selling` |
| Deck, PDF report, spreadsheet | `/office` |
