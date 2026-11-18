# Launch

A launch is a coordinated sequence with a target, owners and decision points — not a day of posting. Size the effort to the stakes, prove readiness with gates, and decide in advance what you will do when numbers come in.

## 1. Tier the launch
| Tier | Examples | Effort |
|---|---|---|
| T1 | New product, new store, new market, price change for everyone | Full plan, 4–8 weeks of preparation, all channels, war-room on the day |
| T2 | Significant feature, new product line, new offer | 2–3 weeks, owned channels + selected earned/paid |
| T3 | Small improvement, content drop | Changelog, email/Telegram mention, in-product note |
Ask for the tier only if unclear; default from the description and say which you chose.

## 2. Foundations (fill before the timeline)
- **Goal and metric:** one primary number with a target and date from the user's plan (e.g. "300 paid orders in 14 days", "1 000 waitlist sign-ups"). No target given → propose one from their baseline and mark it as a proposal.
- **Audience:** primary segment and where they already pay attention (channels they use, communities, media they read — verified by looking, not assumed).
- **Positioning line:** `For <segment> who <situation>, <product> is the <category> that <key outcome>, unlike <alternative>, because <proof/mechanism>.` Every asset derives from it (`references/copy.md`).
- **Offer:** price, launch bonus (only real and lawful — a "launch price" must actually rise later), guarantee, deadline that is true.
- **Proof at launch:** beta users' results with permission, reviews, media, numbers with sources. No proof → lead with mechanism and transparency, never fabricate.

## 3. Readiness gates (all green before T-0; owner + evidence for each)
| Gate | Evidence of "ready" | Owner / route |
|---|---|---|
| Product works end to end | Test order or sign-up done on production, including payment and confirmation | core (`/absolute`) |
| Landing / store pages | Copy final and approved, mobile checked, speed acceptable | `references/copy.md` + core |
| Tracking | Events from `tracking-plan.md` seen in DebugView; UTM links checked by `utm.mjs` | `references/analytics-plan.md` + core |
| Consent and legal texts | Banner works; public offer, privacy, returns texts published | a lawyer + core |
| Payments | Gateway in live mode, refund path tested | core |
| Logistics (physical goods) | Stock on hand, Nova Poshta (or other carrier) account and packaging ready, COD rules set | `/selling` |
| Support | FAQ, reply templates, response-time promise, people on shift in Telegram/Viber/phone/email | user |
| Emails and messages | Flows live and tested with seed addresses; SPF/DKIM/DMARC pass | `references/email.md` |
| Creatives and ads | Assets in all formats approved; campaigns built and paused; budgets set | `/brand`, `/ads` |
| Monitoring and rollback | Who watches what dashboard; how to pause ads, hide the offer, roll back a release | user + core |

## 4. Timeline (T1 example; compress for T2/T3)
| When | Work |
|---|---|
| T-6…-4 weeks | Positioning, offer, pricing, landing copy; waitlist page live; tracking plan; media and partner list built from real outlets and their recent coverage (no invented contacts) |
| T-4…-2 | Content warm-up (problem-focused posts, behind the scenes); beta users and proof collection; creatives; email/messenger flows; ad campaigns built |
| T-2…-1 | Readiness gates review; press/partner outreach with embargo date; teaser to waitlist; support training |
| T-1 day | Final QA of every link and payment; schedule posts; brief the team; freeze code |
| T-0 | Run sheet (§5) |
| T+1…+3 | Follow-ups to non-openers/non-clickers, answer every comment, collect first reviews, fix top friction; ads optimisation per decision rules |
| T+4…+14 | Proof-led second wave (results, reviews, FAQs from real questions); close the launch offer on the stated date |
| T+7…+14 | Retro (§7) |

## 5. Launch-day run sheet
```markdown
| Time (Kyiv) | Action | Channel | Owner | Done |
|---|---|---|---|---|
| 08:30 | Final smoke test: home → product → checkout → thank-you; events in DebugView | site | dev | |
| 09:00 | Offer goes live; waitlist email + Telegram/Viber message | email, messengers | marketing | |
| 09:30 | Posts in own social; community posts where rules allow | social | SMM | |
| 10:00 | Ads switched on at the planned budget | Meta/TikTok/Google | ads | |
| 12:00 | Check: sessions, conversion, payment errors, support queue vs plan | dashboard | lead | |
| 16:00 | Second check; apply decision rules | — | lead | |
| 20:00 | Day summary to the team: numbers vs target, issues, tomorrow's actions | — | lead | |
```
Pick times from the audience's own activity data (analytics by hour, channel insights), not from generic "best time to post" lists.

## 6. Channel plan, risks and decision rules
**Channel plan:** `channel | audience reached (from the channel's own stats) | message angle | asset | date/time | owner | UTM link | KPI`. Ukrainian channels to consider by fit: own site, email, Telegram channel and bot, Viber community, Instagram, TikTok, YouTube; earned — industry media (e.g. DOU and AIN.UA for tech, niche Telegram channels, podcasts, YouTube reviewers), partner newsletters; paid — Meta, TikTok, Google, Telegram Ads, paid posts in Telegram channels (`/ads`); marketplaces Rozetka, Prom, Epicentr (`/selling`); global SaaS — Product Hunt, relevant subreddits and communities, following each community's rules.

**Risk register:** `risk | likelihood (L/M/H) | impact | early signal | mitigation | owner`. Always include: site or payment failure under load, stock-out, ad account restriction, negative public review, support overload, delivery delays during peak periods, and power or connectivity outages (plan a backup: generator or hosting status page, mobile hotspot, scheduled posts).

**Decision rules written before launch:** e.g. "If day-1 conversion is below half the planned rate with normal traffic quality → check the funnel for breakage, then swap the hero to variant B"; "If CPA exceeds the target by more than 50% after the learning budget → pause ad set, keep organic"; "If stock < 3 days of sales → switch the CTA to pre-order".

## 7. Retro (within 7–14 days)
Numbers vs targets per channel (with UTM data), what worked and why (evidence), what failed and why, surprises in customer questions, the 3 changes for the next launch, assets to reuse. Feed results into `references/experiments.md` hypotheses and the content plan.

## 8. Deliverable (`launch-plan.md`)
Header (goal, metric and target, tier, launch date) → foundations → readiness gates table with owners → timeline → channel plan → run sheet → risk register → decision rules → retro template. Tasks for the core, `/ads`, `/brand`, a lawyer, `/selling` are listed as handoffs with their brief file paths.

## 9. Delivery checklist
- [ ] Tier chosen; one primary metric with a target and date.
- [ ] Positioning line and offer are true (deadlines, prices, bonuses real).
- [ ] Every readiness gate has an owner and an evidence item.
- [ ] Channel plan uses real channels with their own reach data, UTMs checked.
- [ ] Run sheet, risk register and decision rules written before T-0.
- [ ] Retro date in the calendar.
