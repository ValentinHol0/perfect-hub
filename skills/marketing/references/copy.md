# Marketing Copy

Copy is a sales conversation written down for one reader at one moment. It wins by being specific, believable and easy to act on. References: `${CLAUDE_PLUGIN_ROOT}/skills/marketing/references/copy/ua-copy.md` (Ukrainian style, calques, typography, banned phrases) and `${CLAUDE_PLUGIN_ROOT}/skills/marketing/references/copy/page-blueprints.md` (section-by-section blueprints and the copy deck format).

## 1. Before a single word: the copy brief
Fill this in (from the intake, the user's page, reviews, support tickets, competitor pages). Missing rows become questions or explicit assumptions.
| Field | Example |
|---|---|
| Reader | Owner of a 1–3 person online shop on Prom, sells via Instagram, handles orders on a phone |
| Awareness stage | Problem-aware: knows order chaos costs sales, has not compared CRMs |
| Job and trigger | "Stop losing orders that came via Direct in the evening rush" — trigger: a missed order last week |
| Offer | CRM for small shops, 14-day trial, from 349 грн/міс (user's numbers) |
| Primary action | Start trial (event `trial_start`) |
| Proof in hand | 3 named reviews with permission; integration with Nova Poshta API; nothing else |
| Top objections | "Another tool to learn", "my data", "price", "will it work with Prom" |
| Voice | Ти/ви decision, formality, words the customers themselves use (copy them from reviews) |

**Awareness drives length and opening** (the 5-stage model from Eugene Schwartz's *Breakthrough Advertising*): most aware → lead with the offer and price; product-aware → differentiation and proof; solution-aware → mechanism (why this way works); problem-aware → name the problem in the reader's words, then the solution category; unaware → a story or a surprising fact, rarely the right target for a cold landing page.

## 2. Writing rules
1. **One reader, one promise, one action.** Write the promise as one sentence before the page: "<Reader> gets <outcome> <by when / with what effort> because <mechanism>."
2. **Specific beats impressive.** Replace adjectives with facts the reader can picture or check: "Нова Пошта: відправлення в день замовлення до 16:00" beats "швидка доставка". Every number needs a source in the brief; never invent one.
3. **Outcome first, feature second, mechanism third.** Feature → so what → so what for this reader. Stop at the reader's real motive (time, money, status, risk, effort).
4. **Customer words over brand words.** Lift phrases from reviews, interviews, support chats, Rozetka/Prom/Google reviews of competitors. Quote real customers only with permission and attribution.
5. **Clarity over cleverness.** A headline that needs a second read loses. Puns only when the meaning survives without them.
6. **Show, then claim.** Proof sits next to the claim it supports (a review under the feature it praises, the guarantee next to the CTA).
7. **One CTA intent per page,** repeated where decisions happen; the label is a verb + object the reader wants ("Отримати розрахунок", "Start my trial"), never "Submit", "Learn more", "Детальніше" when a specific verb exists.
8. **Microcopy carries risk reversal:** next to the CTA, answer "what happens after I click" (no card needed, call within 15 min — only if true).
9. **Readability:** sentences ≤ 20 words on average, paragraphs ≤ 3 lines on mobile, one idea per paragraph, subheads that say what the reader gets (not "Features", "Чому ми").

## 3. Frameworks — use critically, never name them in the output
| Framework | Fits | Failure mode to avoid |
|---|---|---|
| PAS (problem–agitate–solution) | Problem-aware readers, pain is real and specific | Fake drama, fear-mongering, agitating a problem the reader doesn't feel |
| AIDA | Long-form pages and emails with a cold reader | "Attention" turns into a clever but empty hook |
| BAB (before–after–bridge) | Transformations with a visible after-state | Unbelievable after-states; no mechanism in the bridge |
| FAB (feature–advantage–benefit) | Product pages, spec-heavy B2B | Stopping at the advantage; benefits too generic to matter |
| 4U headline check (useful, urgent, unique, ultra-specific) | Scoring headline variants | Fake urgency ("only today" when it isn't) — can amount to misleading advertising (Law "Про рекламу", art. 10) and kills trust |
A framework is a checklist for completeness, not a template. If the result reads like a template, rewrite it from the brief.

## 4. Objection handling
1. List the top 5–7 objections from evidence (reviews of you and competitors, sales calls, support, refund reasons). Typical in Ukrainian e-commerce: price vs. Rozetka, delivery time and cost, payment safety (накладений платіж, оплата частинами), returns, quality vs. photos, "is this a real shop".
2. Rank by how often they block the action. Answer each where it arises: price objection next to the price; delivery under the CTA; trust in the hero proof line; the rest in a FAQ written as real questions in the customer's words.
3. Answer with facts, not reassurance: "Повернення протягом 14 днів, доставку назад оплачуємо ми" (only if it is the shop's actual policy — statutory return terms go through a lawyer).
4. Never answer an objection you cannot back. Flag it to the user as a product or offer gap.

## 5. Formats
**Landing / product page:** use the blueprint in `page-blueprints.md`. Deliver a copy deck table: `section | copy | job of this section | proof used | objection answered`.

**Email:** subject (one promise; keep it short — about 50 characters is a working limit, not a rule — and check the real phone preview), preheader that extends the subject (never repeats it), one primary CTA, plain-text version. Flows live in `references/email.md`.

**Ads:** write 3–5 angles (pain, outcome, mechanism, proof, offer), each with 2 variants. Hard limits checked 2026-11-12: Google responsive search ads — headlines ≤ 30 characters (up to 15), descriptions ≤ 90 (up to 4), path fields ≤ 15 (support.google.com/google-ads/answer/7684791). Meta text lengths are recommendations that vary by placement — check the current Meta Ads Guide `[Unverified]`. Campaign structure, budgets and testing belong to `/ads`.

**Headline variants:** always give 3, each a different angle, each with a one-line hypothesis ("Outcome headline beats mechanism headline for problem-aware visitors from Instagram") so `references/experiments.md` can test them.

## 6. Anti-slop (same list as the core's anti-slop rules, plus Ukrainian tells)
Rewrite on sight — never soften:
- Selling instead of saying: revolutionize, unlock, seamless, next-gen, elevate, empower, supercharge, game-changer; "революційний", "інноваційне рішення", "розкрийте потенціал", "безшовний", "вийдіть на новий рівень", "трансформуйте свій бізнес".
- Stock lines: "In today's fast-paced world", "Whether you're A or B", "Join thousands of…", "у сучасному світі", "ідеальне рішення для", "широкий асортимент", "найкращі ціни", "якісно та швидко", "індивідуальний підхід до кожного клієнта", "команда професіоналів", "Відкрийте для себе", "Зануртеся у світ".
- Virtue words about ourselves: honest, thoughtful, genuinely, simply; "чесний", "надійний партнер", "дбаємо про кожного".
- Invented specifics as decoration ("38% faster", "Batch No. 047", "понад 10 000 клієнтів" without a source).
- Patterns: two-fragment headings ("Швидко. Просто.") more than once per page; "not X but Y / не просто X, а Y" more than twice; negation runs ("No forms, no waiting") more than once; rhetorical-question openers; triplets of adjectives.
- Category-label section heads ("Features", "Переваги", "Чому ми"), duplicate CTA intents with different labels, template residue (`[Company]`, `{{name}}`).

**Copy tests before delivery:** swap test (would a competitor's page run this unchanged? rewrite) · picture test (can the reader see it?) · falsifiability (could it be proven false? then it says something) · only-us test (could only this business say it?) · read-aloud test for Ukrainian (does it sound like a person, not a translation?).

## 7. Claims and law (Ukraine; flag, don't adjudicate)
- Misleading advertising is prohibited (Law "Про рекламу" No. 270/96-ВР, art. 10); comparative advertising is allowed only under the conditions of art. 11 (comparable characteristics, objective, no false statements about competitors). Superlatives ("найкращий", "№1", "найнижча ціна") need evidence the user can show — otherwise remove them.
- Using a person's image or name requires their consent (art. 8). Reviews and photos of customers: written permission.
- Advertising and consumer information in Ukraine are in the state language (Law No. 2704-VIII, arts. 30, 32); a second language may duplicate it.
- Health, finance, alcohol, supplements, children's products have extra restrictions — route to a lawyer.
Any legal note ends with: "Verify with a lawyer before publishing."

## 8. Delivery checklist
- [ ] Copy brief filled; assumptions stated.
- [ ] Every claim mapped to proof in the deck's "proof used" column; no orphan numbers.
- [ ] Top objections answered where they arise.
- [ ] Anti-slop and the 5 copy tests passed; Ukrainian text checked against `ua-copy.md`.
- [ ] 3 headline variants with hypotheses.
- [ ] Primary action and its tracking event named (from `references/analytics-plan.md`).
- [ ] File: `deliverables/marketing/<slug>/copy-<asset>.md`. Offer an independent pass by `marketing-cro-reviewer` for pages and key emails.

Credit: some checklist ideas are paraphrased from coreyhaines31/marketingskills (MIT).
