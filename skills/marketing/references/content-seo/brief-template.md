# Content brief template and AI-visibility tracking

## 1. Content brief (`deliverables/marketing/<slug>/content-brief-<page>.md`)
```markdown
# Brief: <working title>
Target cluster: <primary query> + <secondary queries>      Language: uk | en | …
Intent: <informational | commercial | transactional | local> — dominant SERP format: <guide | comparison | category | product | tool | video>
SERP checked: <date>, location <city/country>, top results: <3–5 URLs with one line each: what they do well, what they miss>
Reader and job: <who, in what situation, wants to do/decide what>
Angle / information gain: <what this page adds that the top results lack — own test, data, calculator, expert, local specifics>
Primary action: <CTA and tracking event>

## Outline
H1: <what the page is>
- H2: <reader sub-question 1> — answer in the first 2 sentences; facts: <fact — source URL — date>
- H2: <sub-question 2> — …
- H2: FAQ (only real questions from PAA, support, reviews)

## Evidence to gather
- First-hand: <photos, measurements, screenshots, prices in UAH with date>
- Expert input: <name, role> — quote with permission
- Sources to cite: <primary sources only: laws, official stats, vendor docs, studies>

## E-E-A-T
Author: <name, credentials, author page URL> · Reviewer (YMYL): <name, credentials> · Method note: <how tested / how AI was used>

## Links
In (existing pages that will link here, with anchor idea): 1. … 2. … 3. …
Out (hub and siblings): …

## Snippet drafts
Title: <primary phrasing first — differentiator — brand>
Meta description: <promise + reason to click>
Slug: /<transliterated-or-english-slug>

## Technical notes for the core (if any)
<schema type to implement, redirect from old URL, canonical, hreflang pair>
```

## 2. Refresh brief (existing page)
Add: current URL · Search Console last 16 months (clicks, impressions, average position, top queries) exported on <date> · what changed in the SERP since publication · facts to update (with new sources) · sections to cut · internal links to add · keep the URL.

## 3. AI-visibility tracking
1. **Prompt set:** 20–50 prompts real customers would ask, split by stage (problem, comparison, brand). Ukrainian and English if both markets matter. Freeze the list; change it only quarterly.
2. **Monthly run:** ask each prompt in ChatGPT (search on), Perplexity, Gemini, and Google (note whether an AI Overview appears). Record in a sheet: `date | assistant | prompt | our brand mentioned (y/n) | our URL cited (y/n) | competitors cited | answer accuracy about us (ok / wrong — what)`.
3. **Wrong facts about the brand** are the first fix: correct the source page, then the third-party pages the assistant cited.
4. **GA4 referrals:** build a custom channel group "AI assistants" (implementation by the core or in the GA4 UI) that matches session source against the assistants' referrer domains you actually see in GA4's traffic acquisition report (for example `chatgpt.com`, `perplexity.ai`, `gemini.google.com` — confirm in the property's own data before relying on the list). Report sessions and key events from it monthly.
5. **Search Console:** AI Overview and AI Mode clicks are included in "Web" totals and are not separable; watch query-level CTR changes for queries where an AI Overview appears.
