# Social Analytics

Measure what the goal needs, compare against the account's own baseline, and end every report with decisions. Reference: `${CLAUDE_PLUGIN_ROOT}/skills/social/references/analytics/monthly-template.md` — monthly review structure and the post-level CSV columns.

## 1. Metric set per goal
| Goal | Primary | Secondary | Business link |
|---|---|---|---|
| Reach / awareness | reach to non-followers, views, shares | follower growth, profile visits | branded search, direct traffic |
| Engagement / community | saves, shares, comments per reach | repeat commenters, DM conversations | retention, referrals |
| Traffic / sales | link clicks, DMs with purchase intent | profile visits → link taps | orders and revenue via UTM or promo code |
| Telegram channel | views per post ÷ subscribers (ERR), shares/forwards | subscriber growth and unsubscribes | clicks to site/bot |
Likes alone are not a goal. Follower count without reach and actions is vanity.

## 2. Where the numbers are (native tools)
| Platform | Tool | Key fields to export or copy |
|---|---|---|
| Instagram / Facebook | Instagram app Insights, Meta Business Suite | reach, views, interactions (likes, comments, shares, saves), profile activity, link taps, follows from post |
| TikTok | TikTok Studio / Analytics (business or creator account) | views, average watch time, watched full video, traffic sources, followers gained |
| YouTube Shorts | YouTube Studio | views, "viewed vs swiped away" `[Unverified — check the current Shorts metric name]`, average view duration, subscribers |
| Telegram | channel Statistics (for larger channels; availability threshold `[Unverified]`) or manual views per post | subscribers, views per post, shares, reactions |
| Threads / LinkedIn | native insights | views, replies, reposts, follows |
Platforms rename metrics (Meta moved toward "views" as the main reach-type metric in 2024–2025 `[Unverified]`) — label the metric names you used in every report.

## 3. Calculate with the script (not in prose)
Collect posts into a CSV (`monthly-template.md` §2 columns), then:
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/metrics.mjs" deliverables/social/<slug>/posts-2026-11.csv --by pillar
node "${CLAUDE_PLUGIN_ROOT}/scripts/metrics.mjs" deliverables/social/<slug>/posts-2026-11.csv --by format --out deliverables/social/<slug>/metrics-format.md
```
Definitions (printed in every report):
- ER (by reach) = (likes + comments + shares + saves) ÷ reach; views are used as the base when reach is missing (marked in the output).
- Save rate = saves ÷ reach · Share rate = shares ÷ reach · CTR = link clicks ÷ reach.
- ERR (Telegram) = post views ÷ subscribers at posting time.
- Groups use pooled rates (sum ÷ sum) plus the median post ER, so one viral post does not hide a weak pillar.
The script accepts comma or semicolon CSV (Excel with a Ukrainian locale exports `;`), spaces in thousands and decimal commas.

## 4. Reading the numbers
- Compare like with like: same platform, same format, same month length; Reels vs carousels are different games.
- Baseline = median of the last 30–90 days; "good" = above the account's own median, not an internet benchmark. Quote external benchmarks only with a source and date.
- Small samples: fewer than ~10 posts per group → call it a signal, not a finding.
- Look for the why: top and bottom posts side by side — hook, topic, format, time, visual. Write one hypothesis per difference.
- Attribution: sales from social need UTM links (hand the tracking plan to `/marketing`), promo codes or the "Звідки дізналися?" question at checkout.

## 5. Report (weekly: 5 lines; monthly: template)
Weekly: reach and actions vs last week · top post and why · bottom post and why · one change for next week · open issues (complaints, crises).
Monthly: `monthly-template.md` — KPIs vs targets, platform table, pillar and format table from `metrics.mjs`, top/bottom 3 with reasons, community summary, experiments and results, decisions for next month, what is `[Unverified]`. Presentation version → `/office`.

## 6. Experiments
`Hypothesis · change (one variable) · metric · sample (number of posts) · decision date · result · decision`. Examples: carousel covers with a number vs without; posting at 09:00 vs 19:00 on Telegram; series format vs one-offs on TikTok. Keep a running log in `experiments.md`.

## 7. Output
```
Review: deliverables/social/<slug>/review-<yyyy-mm>.md
Data: posts-<yyyy-mm>.csv · metrics by pillar/format/platform (script output)
Decisions: 3–5 for next period · Experiments: running/finished
```
