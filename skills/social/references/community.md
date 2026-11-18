# Social Community

Every public reply is written for the next thousand readers, not only the person who complained. References:
- `${CLAUDE_PLUGIN_ROOT}/skills/social/references/community/reply-templates.md` — Ukrainian reply templates by situation (orders, delivery, quality, price, spam, praise).
- `${CLAUDE_PLUGIN_ROOT}/skills/social/references/community/crisis-playbook.md` — severity levels, first-hour checklist, holding statements, escalation, post-mortem.

## 1. Reply principles
1. **Speed targets** (house standard — set with the team): comments and DMs during working hours within 1–2 hours; complaints acknowledged the same day; crisis level 2+ within 1 hour (see playbook). Publish working hours in the bio and auto-replies.
2. **Acknowledge → act → close.** Name the problem in their words, say what happens next and when, finish the loop publicly when solved ("Оновлення: Олена отримала заміну").
3. **Move personal data to DM.** Never ask for order numbers, phone, card data or addresses in public. Never ask for card numbers, CVV or passwords — anywhere; warn customers about fake "support" accounts.
4. **One voice:** the brand's address form and tone (`references/strategy.md`); human name or initials if the team signs replies; no copy-paste that ignores what the person wrote.
5. **No arguing, no sarcasm, no blaming the customer or the courier publicly.** Facts and solutions only.
6. **Never invent:** no promises outside policy (refund terms, delivery dates) — check with the owner; no fake positive comments or reviews, no buying engagement.
7. **Language:** reply in Ukrainian for a Ukrainian audience; politely, without commenting on the commenter's language (`${CLAUDE_PLUGIN_ROOT}/skills/social/references/posts/ukrainian-copy.md`).

## 2. Moderation rules (publish a short version in highlights/pinned post)
| Content | Action |
|---|---|
| Legitimate criticism, negative reviews | keep visible; reply publicly; resolve in DM |
| Spam, scam links, fake giveaways, impersonating the brand | delete, block, report to the platform; warn followers if impersonation spreads |
| Hate speech, threats, harassment, discrimination | hide/delete, block, report; document with screenshots |
| Personal data (phones, addresses, order data) posted publicly | hide; contact the person in DM |
| Russian propaganda, war denial, mocking victims | delete, block, report |
| Off-topic but harmless | ignore or reply briefly |
| Coordinated attacks (many new accounts, same text) | do not reply one by one; hide, report, use keyword filters; post one statement if it reaches real customers |
Keyword filters: set platform comment filters for slurs, scam phrases ("розіграш від адміністрації", "перейдіть за посиланням для отримання виграшу"), competitor spam. Review hidden comments weekly — filters catch real customers too.

## 3. Negative reviews and complaints
Structure for a public reply (3–4 sentences):
1. Thank / name the issue specifically («Шкода, що замовлення приїхало з пошкодженою коробкою»).
2. Take responsibility for what is ours (no excuses, no blaming Nova Poshta in public even when it is their fault — say what we will do).
3. Next step and time («Напишіть, будь ласка, номер замовлення в Direct — сьогодні до 18:00 запропонуємо заміну або повернення коштів»).
4. Sign-off with a name if the brand uses names.
Then: solve in DM, follow up publicly when solved, log the case (date, platform, issue, resolution, time to resolve) for the monthly report.
Returns, refunds and warranty answers follow the shop's published policy and Ukrainian consumer-protection law — do not state legal terms from memory; verify with the shop's policy and a lawyer (a lawyer).

## 4. Proactive community work
- Reply to every comment in the first hour after posting (signals and relationship).
- Pin a helpful comment (FAQ answer, link) under posts that attract repeat questions.
- Turn repeated questions into posts and highlights (FAQ: доставка, оплата, повернення, розміри).
- Feature real customers' content only with their permission; credit them.
- Telegram channel: linked discussion chat with rules pinned; slow mode during spikes; admins named.

## 5. Crisis
Classify the situation with `crisis-playbook.md` §1 the moment volume or tone changes; level 2+ → follow the first-hour checklist, pause scheduled posts, escalate to the owner, publish a holding statement only after the facts are confirmed.

## 6. Output
- Reply set: `deliverables/social/<slug>/replies.md` — situation · public reply · DM script · internal action.
- Moderation policy: `moderation.md` (public short version + internal rules + filter word list).
- Crisis: timeline, statements (holding + full), Q&A for the team, post-mortem template filled.
All copy in natural Ukrainian (or the user's language); facts and promises checked with the owner.
