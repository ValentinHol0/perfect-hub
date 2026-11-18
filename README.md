# Perfect Hub 4.0

An office of specialist agents for Claude Code. You bring an idea or a problem; a council of experts argues it out, a workshop builds it, gates prove it, and nothing generic ships.

```
/absolute <request>          the office: routes the work, convenes the council for costly decisions, builds behind gates
/absolute-council <question> an emergency meeting on one decision → .planning/council/<id>/DECISION.md
/absolute-goal <idea>        idea → release candidate, phase by phase, until evidence says RELEASE READY
/antislop <path>             removes the template traces of AI from UI, copy (EN/UK) and code
/selling /ads /office /business /brand /social /marketing /research /translate   components for the rest of the business
```

## Коротко українською
Perfect Hub — це «офіс» агентів-спеціалістів у Claude Code. На кожне дороге рішення `/absolute` скликає екстрену раду: фронтенд, бекенд, UX, візуал, безпека, QA, DevOps, мобайл, продукт, антислоп, адвокат диявола і доменні експерти. Кожен спершу пропонує своє наосліп, потім жорстко й конкретно розносить чужі пропозиції (анонімно), обов'язково визнає, що в них сильне, переглядає свою позицію, а голова ухвалює письмове рішення з окремою думкою незгодних. `/absolute-goal` веде ідею до релізу скільки завгодно довго: зупиняється лише тоді, коли докази на диску кажуть RELEASE READY, а публікацію лишає вам. `/antislop` прибирає шаблонні сліди ШІ з дизайну, текстів (англійських і українських) і коду.

## The council
Research on multi-agent debate is clear about what helps and what hurts: independent first drafts and honest aggregation help; seats drifting toward each other (sycophancy, conformity) hurts; identical seats add nothing; anonymity cuts conformity sharply. The protocol is built on that:

| Round | What happens |
|---|---|
| R0 Frame | neutral brief: question, facts, weighted criteria, budget; seats chosen by the owner/risk/value/challenger rule (3, 5 or 7) |
| R1 Blind | every seat proposes in parallel without seeing the others: position, evidence, assumptions, risk, "wrong if", cost, confidence |
| R2 Cross-critique | proposals shuffled and anonymised, your own excluded: concrete flaws (requirement · scenario · evidence), **mandatory credit** (what you'd steal and why), rubric scores, ranking |
| R3 Revise or hold | each seat sees only the critiques of its own proposal: concede, rebut with new evidence, or absorb — changing your mind without citing a critique is invalid |
| R4 Devil's advocate | `absolute-contrarian` attacks the leader and names the fact that would flip it; the orchestrator verifies disputed claims with tools |
| R5 Chair | `absolute-chair` (never a seat) decides by weighted score without self-scores, overrides only with verified evidence or hard constraints, records dissent with revisit triggers; a values tie goes to you |

Tone rule for seats: brutal and exact, never contrarian for show — a flaw needs a scenario and evidence, and fake disagreement is as worthless as flattery. `scripts/council.mjs` keeps it honest: anonymisation, schema checks (generic praise is rejected), weighted tally, reasoning-overlap check for theatrical consensus, and the decision record.

**Seats:** Product · Architect · Frontend · Backend · UX · Visual · Security · QA · DevOps · Mobile · Antislop · Contrarian · domain seats (Selling, Ads, Office, Business, Brand, Social, Marketing, Research, Translate). **Workshop:** code-mapper · architect · test-engineer · implementer · debugger · reviewer · security-auditor · design-critic · reference-hunter · verifier.

## Goal mode
`/absolute-goal <idea>` runs P0 Charter → P1 Spec → P2 Architecture & design → P3 Walking skeleton → P4 Build → P5 Hardening → P6 Release candidate. Every gate is evidence on disk: `goal.mjs` runs the check command itself and records exit code, log and commit SHA; features pass only through their end-to-end command; `release-check` requires every release check green at HEAD on a clean tree. The Stop hook (`goal-guard.js`) keeps the session working one task per turn, lets it stop while background work runs, rescues stalls (debugger, BLOCKED, council), pauses at limits or on a `.planning/STOP` file, and rejects "done" claimed in chat without evidence. Publishing is always your step.

## Antislop
`scripts/antislop.mjs` scans markup, styles, copy and code with ~70 rules plus the design-lint set and scores each surface 0-100 (`S = 100 × (1 − e^(−R/20))`, ship gate: no P0 and ≤ 25). It knows the default AI look (purple gradients, glow, blobs, glass, icon tiles, eyebrows, default fonts), stock and hype copy in English and Ukrainian (including calques, Russianisms, bureaucratese and «» quotes) and code smells (swallowed errors, stubs, `any`, narrator comments). Fixes never invent facts; rescans must show no new fingerprints.

## Components
| Skill | Owns | Agent |
|---|---|---|
| `/selling` | product scoring, unit economics with Nova Poshta COD and refusals, sourcing, ad intelligence, competitor funnels, offers, Rozetka/Prom/Epicentr listings | selling-market-analyst |
| `/ads` | Meta/TikTok/Google structure, budgets and learning phase, creative tests, tracking, CPA/ROAS/MER | ads-auditor |
| `/office` | DOCX/XLSX/PPTX/PDF and HTML decks, Ukrainian business documents with exact totals and amounts in words | docs-proofreader |
| `/business` | ФОП taxes (ЄП, ЄСВ, military levy), calendar (.ics), invoices and acts, ПРРО, income ledger | business-accountant-check |
| `/brand` | identity, logo systems, brand books, ad creatives, product imagery, social templates | brand-art-director |
| `/social` | strategy, calendars with Ukrainian holidays, posts, short-video scripts, community, analytics | social-editor |
| `/marketing` | copy, content SEO/GEO, analytics plans and UTM, A/B tests, email, launches | marketing-cro-reviewer |
| `/research` | market sizing, competitor teardowns, interviews, decision memos — every claim cited | research-analyst |
| `/translate` | tone-adapted translation, i18n files with CLDR plurals, glossaries, QA | translate-reviewer |

Engineering skills: `absolute-codemap` (explain a codebase), `absolute-planner`, `absolute-designer` (directions, typography, colour, reference library, design system), `absolute-ui-ux` (UX rules, accessibility, mobile, visual review), `absolute-assets` (icons, OG cards, imagery), `absolute-docs`. Legal texts are not drafted: legal questions become a brief for a lawyer.

## Scripts (Node ≥ 18, zero dependencies unless noted)
| Area | Scripts |
|---|---|
| Office and goal | `council.mjs`, `goal.mjs`, `ledger.js` |
| Code and quality | `code-scan.mjs` (map, import graph, hotspots, risk markers), `antislop.mjs`, `design-lint.mjs`, `site-check.mjs`, `shots.mjs` (Playwright: viewports, focus, no-JS, `--stress`), `contrast.mjs`, `check-plugin.mjs` |
| Assets | `assets.mjs` (favicon/PWA/iOS/Android icons, OG render), `export-icons.mjs`, `render-templates.mjs`, `gen-image.mjs` (Gemini via the `agy` CLI) |
| Components | `unit-economics.mjs`, `product-score.mjs`, `ads-calc.mjs`, `tax-calc.mjs`, `income-ledger.mjs`, `uah-words.mjs`, `make-docx/xlsx/pptx.py` + `pdf-tools.py` (python-docx, openpyxl, python-pptx, pypdf), `html-to-pdf.mjs`, `calendar.mjs`, `metrics.mjs`, `utm.mjs`, `ab-calc.mjs`, `market-size.mjs`, `check-i18n.mjs` |

## Hooks
| Event | Script | Behaviour |
|---|---|---|
| PreToolUse (Bash, PowerShell) | `guard.js` | broad deletes, force-push, `reset --hard`, DB drops, teardown, publish/deploy, piping downloads into a shell → an approval prompt with the reason (off: `PPP_GUARD=off` or `.planning/guard-off`) |
| Stop | `goal-guard.js` | keeps an active `/absolute-goal` working until release-ready; silent otherwise |
| SessionStart (compact, resume) | `restore-state.js` | re-injects SESSION-STATE, working buffer, ledger and goal state |
| PreCompact | `pre-compact.js` | saves the latest requests before compaction (managed projects only) |
| PostToolUse (Edit/Write) | `lint-on-edit.js` | opt-in (`.design/lint-on-edit`): design-lint on every edited UI file |

## Install
```
/plugin marketplace add ValentinHol0/perfect-hub
/plugin install perfect-hub@perfect-hub
```
claude.ai organisation plugin: `git archive --format=zip -o perfect-hub-4.0.0.zip HEAD` and upload the zip.

## Develop
`node scripts/check-plugin.mjs --external` · `node --test scripts/tests/*.test.mjs` (set `PLAYWRIGHT_DIR` to include rendering tests) · trigger and routing evals in `evals/` (`scripts/run-evals.mjs`, needs an authenticated `claude` CLI).

## Credits
Ideas, rewritten in our own words and code: BMAD Method, Karpathy's llm-council, council-review and llm-council skills (MIT), the ECC council skill, Anthropic's multi-agent research write-up, multi-agent debate research (Du et al. 2023; Liang et al. 2024; ChatEval; Smit et al.; Zhang et al. 2025; Choi et al. 2025; Wynn et al. 2025; Kaesberg et al. 2025), Ralph loop, Spec Kit, GSD, Anthropic harness posts; impeccable (Apache-2.0), taste-skill (MIT), humanizer (MIT), stop-slop (MIT), slop-scan (MIT), Anthropic frontend-design (Apache-2.0), Wikipedia "Signs of AI writing" (CC BY-SA, ideas only); coreyhaines31/marketingskills (MIT), the taste-skill brandkit (MIT).

## Changelog
**4.0.0** — Perfect Programming Plugin becomes **Perfect Hub**: one plugin and one repository. The office: `/absolute` convenes a real council (12 engineering and challenger seats + 9 domain seats + a chair) with blind proposals, anonymised critique with mandatory credit, revisions tied to critique ids, a devil's advocate, tool-verified facts and a written decision; `/absolute-council` on any question; `/absolute-goal` from idea to release with evidence gates and a Stop hook. New: Perfect Antislop (`/antislop`, `antislop.mjs`, `antislop-critic`). Components merged in as single skills with reference files (selling, ads, office, business, brand, social, marketing, research, translate); legal and teach removed; small core skills folded into references; aliases dropped.
**3.3.0** — code-scan, codemap, site-check, assets, guard hook, release checks, components in separate repositories.
**3.2.0 / 3.1.0 / 3.0.0** — design pipeline, TDD subagents, ledger, dual-harness port.
