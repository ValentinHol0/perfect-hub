# Customer Interviews

People are polite about your idea and accurate about their own recent past. Interview about their life, not your product. Ready-to-use Ukrainian and English guides, screener and consent text: `${CLAUDE_PLUGIN_ROOT}/skills/research/references/interviews/interview-guide.md`.

Approach credit: the principles in §2 paraphrase Rob Fitzpatrick's *The Mom Test* (https://www.momtestbook.com) — read the book for the full method.

## 1. Plan
- **Learning goals (max 3):** what you must learn to make the decision ("How do shop owners track Instagram orders today and what does it cost them?"). Each guide question serves a goal.
- **Who:** define participants by recent behaviour, not demographics: "sold via Instagram or Telegram in the last 30 days and handles orders personally". One segment per round; mixing segments hides patterns.
- **How many:** start with 5–8 per segment and stop when new interviews stop adding new themes; report how many you did. Small samples describe, they don't measure — no percentages, write "6 of 8".
- **Where to recruit:** own customers and churned users, trial sign-ups, people who reviewed competitors, niche Telegram chats and Facebook groups (follow their rules), LinkedIn, professional communities (DOU for IT), referrals from each interviewee ("Who else should I talk to?").
- **Screener:** 3–5 behaviour questions that qualify or disqualify; avoid revealing the "right" answer.
- **Incentive:** modest and the same for everyone (a gift card or a payment in UAH); state it upfront; never tie it to answers.

## 2. Principles (paraphrased from *The Mom Test*)
1. Talk about their life and their problem, not your idea. Mention the idea late or never.
2. Ask about specific things that already happened, not opinions or hypothetical futures. "Tell me about the last time…" beats "Would you…?".
3. Listen far more than you talk; silence lets them continue.
4. Compliments, generic claims ("I always…", "I would definitely…") and feature wishes are noise — redirect to a concrete past example.
5. Dig under every strong statement: why it mattered, what it cost, what they did about it.
6. Real interest shows as commitment: time (a follow-up session), reputation (an introduction), money (a pre-order, a deposit). Ask for a next step when it fits; a polite "keep me posted" is a no.

Questions to avoid → better version:
| Avoid | Ask instead |
|---|---|
| Would you use an app that…? | How do you handle <job> today? Walk me through the last time. |
| How much would you pay for…? | What do you spend on this now — money, tools, hours? What did you pay for the last solution you tried? |
| Do you think this is a good idea? | What have you already tried to fix it? Why didn't it stick? |
| Isn't it frustrating when…? (leading) | What was the hardest part of that? |
| Would you like feature X? | When did you last need to do X? What did you do? |

## 3. Running the interview
- 30–45 minutes; video or phone; two people if possible (one asks, one takes notes).
- Consent before recording: purpose, what is recorded, how it is stored and for how long, who sees it, anonymity by default, the right to stop. Ukraine: personal data processing falls under Law No. 2297-VI; for EU participants GDPR applies — wording via a lawyer. Store recordings and notes with restricted access; anonymise in deliverables (P01, role, segment).
- Structure (details in `interview-guide.md`): warm-up and context → the last time story → current solution and workarounds → cost and consequences → what they tried and why it failed → how they decide and buy → wrap-up and next step.
- Notes: verbatim quotes with timestamps in quotation marks; observations separate from interpretations (`[interp]`); write the summary card within 24 hours.

## 4. Synthesis
1. **Per interview — summary card** (`notes/P01.md`): participant profile (role, segment, context), the story in 5–8 bullets, current solution and spend, top pains with evidence, quotes (timestamped), surprises, commitment signals, follow-ups.
2. **Tag** every note: `job`, `trigger`, `pain`, `workaround`, `spend`, `decision`, `quote`, `surprise`.
3. **Cluster** tags across interviews; for each cluster count participants (n of N) and keep the best 1–3 quotes.
4. **Jobs:** write as job stories — "When <situation>, I want to <motivation>, so I can <expected outcome>." Each job lists the participants who expressed it.
5. **Pains:** rate frequency (how often it happens) × intensity (cost in time/money, emotion, risk) using evidence from the stories, not stated importance. Pains with workarounds people pay for or spend hours on are the strongest signal.
6. **Contradictions:** where participants disagree, split by segment or context before averaging.
7. **Implications:** what this means for the decision, each with confidence (high: consistent across ≥ most participants with behaviour evidence; medium: several participants or stated only; low: one participant or inferred) — label as our interpretation.

## 5. Deliverables
- `interview-guide.md` — goals, screener, consent text, guide, note template.
- `notes/P01.md …` — summary cards (anonymised).
- `interviews-synthesis.md`:
```markdown
# Interview synthesis — <segment>, <dates>, N = <n>
Decision this serves: <…> · Learning goals: <…>

## Jobs
1. When …, I want to …, so I can … — P01, P03, P04, P07 (4 of 8)

## Pains (by evidence; the row below only shows the shape)
| Pain | Who (n of N) | Frequency | Cost / workaround (evidence) | Quotes |
|---|---|---|---|---|
| Orders lost in Direct during evening peaks | P01, P02, P05 (3 of 8) | daily in season | hires a helper 3 h/day (P02) | "…" — P02, shop owner, 2026-11-05 [I2] |

## Current solutions and spend
## Buying and decision process
## Surprises and contradictions
## Implications (our interpretation, with confidence)
## Open questions for the next round
```
- Each interview gets a row in `sources.md` (`I#`, date, role, segment, consent level, notes path). Quotes are attributed to the participant ID; real names only with written permission.

## 6. Delivery checklist
- [ ] Learning goals tied to the decision; participants defined by behaviour.
- [ ] Guide has no hypothetical, leading or pricing-opinion questions.
- [ ] Consent and storage described; deliverables anonymised.
- [ ] Synthesis counts participants (n of N), no percentages for small samples.
- [ ] Every quote verbatim, short, attributed with ID and date; interpretations labelled.
- [ ] Commitment signals reported separately from compliments.
