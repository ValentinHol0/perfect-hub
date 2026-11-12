# Perfect Suite — hub

One marketplace and one toolbox for the **Perfect Suite**: the engineering core and eleven domain addons, each in its own repository, working alone or as one system in **Claude Code** and **Google Antigravity**.

| Plugin | Entry | What it does |
|---|---|---|
| `perfect-programming-plugin` (core) | `/absolute` | Websites, web and mobile apps, desktop programs, APIs: code map, build with TDD subagents, root-cause fixes, design pipeline, product assets, reviews, release checks |
| `perfect-selling-plugin` | `/selling` | Product research and scoring, unit economics (Nova Poshta COD, refusals, CPA), sourcing, competitor funnels, offers, marketplace listings |
| `perfect-ads-plugin` | `/ads` | Meta/TikTok/Google campaign structure, budgets, creative testing, CPA/ROAS maths, tracking |
| `perfect-docs-plugin` | `/office` (`/docx` `/xlsx` `/pptx` `/pdf`) | Office documents and Ukrainian business templates: contracts, invoices, acts, proposals, spreadsheets with formulas, presentations |
| `perfect-legal-plugin` | `/legal` | Public offer, privacy and cookie policies, returns, terms, contract review — always "verify with a lawyer" |
| `perfect-business-plugin` | `/business` (`/fop`) | ФОП operations: tax groups, ЄП/ЄСВ calendar, invoices and acts, ПРРО, income ledger — always "verify with an accountant" |
| `perfect-brand-plugin` | `/brand` (`/creative` `/image` `/logo`) | Logo systems, identity, guideline boards, ad creatives, product imagery, social templates |
| `perfect-social-plugin` | `/social` | Content strategy and calendars, posts and carousels, Reels/TikTok scripts, community management |
| `perfect-marketing-plugin` | `/marketing` | Copy, content SEO/GEO, analytics plans and UTM, A/B test design, email flows, launches |
| `perfect-research-plugin` | `/research` | Market sizing, competitor teardowns, interview synthesis, decision memos — every claim cited |
| `perfect-translate-plugin` | `/translate` | Tone-adapted translation, UI string files, glossaries, translation QA |
| `perfect-teach-plugin` | `/teach` | НУШ lessons, courses, tests with answer keys, rubrics, lesson presentations |

**One system:** the core routes domain requests to an installed addon (P9 ADDON); addons hand anything that needs code — a landing page, a calculator, an integration — back to the core through `.planning/handoff-<addon>.md`, and to each other the same way (selling → brand for creatives, marketing → translate for a second language, business → docs for an invoice file). The protocol and registry live in the core: `perfect-programming-plugin/skills/absolute/references/addons.md`.

## Швидкий старт (українською)
1. Покладіть усі папки `perfect-*-plugin` і цю `perfect-hub` поруч (як зараз у `perfect-suite/`).
2. Подивіться команди встановлення: `node scripts/install.mjs` (Claude Code + Antigravity, усі плагіни) або лише потрібні: `node scripts/install.mjs --only core,selling,docs`.
3. Виконайте їх самі або додайте `--run`. Після встановлення перезапустіть сесію Claude Code.
4. Для claude.ai (організаційні плагіни): `node scripts/pack.mjs` → завантажте zip-файли з `dist/`.
Ядро потрібне завжди, коли аддону треба сайт, застосунок чи інтеграція; без ядра аддон видає лише бриф.

## Install
**From these folders (now):**
```
node scripts/install.mjs                      # print commands for both harnesses, all plugins
node scripts/install.mjs --only core,docs --claude --run
```
Claude Code gets `claude plugin install <plugin> --marketplace <folder> --scope user`; Antigravity gets `agy plugin install <folder>`.

**From GitHub** (published at github.com/ValentinHol0):
```
claude plugin marketplace add ValentinHol0/perfect-hub
claude plugin install perfect-programming-plugin@perfect-suite      # then any addon: perfect-docs-plugin@perfect-suite …
agy plugin install https://github.com/ValentinHol0/perfect-programming-plugin   # then any addon repository the same way
```
**claude.ai organisation plugins:** `node scripts/pack.mjs` → `dist/<plugin>-<version>.zip` (zip root contains `.claude-plugin/`), upload each as a plugin version.

## Develop
| Script | Purpose |
|---|---|
| `scripts/check-all.mjs [--external]` | Every plugin's self-check (both harnesses with `--external`) and tests, shared-file drift, marketplace freshness — one table, exit 1 on any failure |
| `scripts/build-marketplace.mjs [--owner X] [--check]` | Regenerate (or verify) the hub marketplace from the plugin manifests |
| `scripts/install.mjs` | Install commands for Claude Code / Antigravity, local or GitHub |
| `scripts/pack.mjs` | Zip each plugin's committed HEAD for upload |
| `scripts/publish.mjs [--visibility private\|public] [--run]` | Create the GitHub repositories that don't exist yet (core, addons, hub) and push `main` to each — never forced; prints the plan without `--run` |
| core `scripts/new-addon.mjs` | Scaffold a new addon repository next to the others (manifests, rules, entry skill, shared files, icon, git) |
| core `scripts/sync-addons.mjs [--check]` | Copy the core-owned shared files (`check-plugin.mjs`, `references/harness.md`, CI, git attributes) into every addon |
| core `scripts/render-icon.mjs <plugin>` | Render a plugin's `assets/logo.svg` to `assets/icon.png` |

Release flow: change → plugin's own checks → `node scripts/check-all.mjs --external` → bump the plugin's version in both manifests and its `marketplace.json` → commit in that repository → `node scripts/build-marketplace.mjs` → commit the hub → `node scripts/publish.mjs --run` (pushes every repository) → `pack.mjs` for claude.ai.
