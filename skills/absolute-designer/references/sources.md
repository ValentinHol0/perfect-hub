# Reference Source Library

Verified November 2026 (sections 5–9 re-verified 2026-11-12). Access notes matter: some sites render client-side (WebFetch returns only the title) and some block fetchers — use the listed method.

Legend — **Access:** `free` · `free+pro` (some content locked) · `pro` (paid). **Method:** `MCP` (connected tool) · `fetch` (WebFetch works) · `browser` (needs a real browser: built-in browser pane `mcp__Claude_Browser__*` or Claude in Chrome).

---

## 1. Sections, heroes, templates

### jiro.build — design prompt library (templates + sections)
- **What:** 1,400+ landing templates and section components with copyable AI-builder prompts and component code.
- **Taxonomy:** templates by industry (Agency, Portfolio, E-commerce, Fintech, AI Agents & Chatbots, Real Estate & Construction, Health & Wellness, SaaS…); components by section (Header, About us, Features, How it Works, Brands, Testimonial, Integration, Stats & Metrics, Team, Pricing, Calls To Action, FAQ, Contact Us, Blogs & Articles, Footer).
- **URLs:** `/templates/<category>/<slug>` · `/components/<section>/<slug>` · `/templates/best-of-the-week`.
- **Access:** free+pro (one-time payment for full library). **Method:** MCP › fetch.
- **MCP:** `claude mcp add --transport http jiro https://mcp.jiro.build` → `/mcp` → jiro → Authenticate (OAuth, no API key).
- **Take:** section structure, composition, motion ideas, prompt wording. Rewrite copy and restyle to your tokens.

### getlayers.ai — cinematic AI site layers
- **What:** prompts and source for templates, 3D scenes, sections, backgrounds, gradients; 13 free design tools; Figma plugin.
- **Taxonomy:** `/templates` `/3d-scenes` `/sections` `/backgrounds` `/gradients` `/tools`; tags like landing page, Fintech, SaaS, AI/Tech, Portfolio, E-commerce, 3D Element, Waves & Terrain, Process/Roadmap, Features; filters Tone, Mood, Type, Pricing, Media.
- **URLs:** `/layer/<slug>`.
- **Access:** free+pro (MCP needs the "Full Stack Lifetime" plan). **Method:** MCP › fetch.
- **MCP:** Claude Code plugin: `/plugin marketplace add textura-agency/getlayers-plugin` then `/plugin install getlayers@getlayers`. Generic: `https://mcp.getlayers.ai/mcp` (OAuth). Tools include `getlayers_search`, `getlayers_browse`, `getlayers_explore`, `getlayers_source`, `getlayers_palettes`, `getlayers_fonts`, `getlayers_compositions`, `getlayers_reproduce`, `getlayers_figma_match`.
- **License:** commercial use allowed; no redistribution of prompts/source.
- **Take:** WebGL/3D backgrounds, gradients, cinematic hero scenes, palettes and font CSS.

### supahero.io — hero section library (part of ScreensDesign)
- **What:** ~250 curated hero sections from real websites. No category filters.
- **URLs:** `/hero/<slug>` (e.g. `/hero/linear`, `/hero/stripe`). **Access:** free. **Method:** fetch (images), browser for detail.
- **Take:** headline length, CTA arrangement, how media meets the fold.

### unsection.com — sections by type
- **What:** 5,600+ real website sections. Types: Hero, Testimonials, Feature, CTA, Footer, Blog, Navbar, Pricing, Logo, FAQs, Team, Contact, Portfolio. Tabs: Sections, Types, Industries, Templates; filters Style, Layout, Elements.
- **URLs:** `/category/<type>-section-design` (navbar: `/category/navbar-design`), `?page=2`; single `/section/<slug>`.
- **Access:** free+pro (some thumbnails blurred). **Method:** fetch.
- **Take:** many variants of ONE section type side by side — best for "how do others solve pricing/FAQ/footer".

### bentogrids.com — bento layouts
- **What:** curated bento grid layouts. **Access:** free. **Method:** browser (client-rendered; WebFetch returns only the title).
- **Take:** cell proportions, hero-cell placement, visual diversity across cells.

## 2. Product UI, flows, patterns

### mobbin.com — real app & web screens, flows, patterns
- **What:** 600,000+ screens; flows (onboarding, checkout, account setup, subscription), UI patterns (dialogs, navigation, forms, tables, empty states, paywalls), website sections.
- **Access:** free (limited) / Pro (full library + MCP) / Team (REST API). **Method:** MCP › browser with the user's login (fetchers get 403 on `/explore`).
- **MCP:** server `https://api.mobbin.com/mcp` (Streamable HTTP, OAuth). Recommended: add the Mobbin connector to the Claude account, then `/mcp` in Claude Code. CLI-only: `claude plugin marketplace add mobbin/skills` → `claude plugin install mobbin@mobbin` → `/mcp` → Authenticate. Tools: `search_screens`, `search_flows`, `search_sections`, `list_collections`, `get_collection_contents`, `create_collection`, `save_content`, `add_comment`. Rate limit 60 req/min.
- **Machine-readable:** `mobbin.com/llms.txt`, `mobbin.com/mcp.md`.
- **Take:** step counts, screen order, error/empty states, where value appears. Cite results as observations, not proof of performance.

### refero.design — web & iOS UI tagged by pattern
- **Access:** free+pro. **Method:** browser (client-rendered). MCP announced at `refero.design/mcp` — read the page in a browser for current setup.
- **Take:** pattern-tagged screens (e.g. settings, empty states, pricing) across many products.

### styles.refero.design — real colour & type systems (DESIGN.md library)
- **What:** 2,000+ design systems extracted from real product websites, each with colours, typography, spacing, components and a DESIGN.md.
- **Chips:** Luxury e-commerce, Botanical & organic, Dark mode SaaS, Warm indie SaaS, Cinematic hardware, Creative studio site, Zero border radius, Design tool aesthetic. Sort: Trending/Popular/Newest.
- **URLs:** `/style/<uuid>` · `/design-styles/<slug>` (e.g. `fintech-websites`) · `/design-md/<slug>` · `/ai-agents/design-md-examples`.
- **Access:** free (beta). **Method:** fetch for lists, browser for style pages.
- **Take:** a complete starting DESIGN.md when the brief says "like <brand>" — then change accent, display face and signature so it isn't a clone.

### screensdesign.com — iOS onboarding, paywalls, subscription flows
- **What:** screen-by-screen recordings of ~2,900 top-grossing apps; per-category stats (average revenue, installs, onboarding step count, most common paywall type).
- **URLs:** `/categories/<slug>/` · `/apps/<slug>/` · `/articles/` · `/guides/`.
- **Access:** free listings, Pro for full videos and MCP. **Method:** fetch (listings) · MCP.
- **MCP:** `https://api.screensdesign.com/v1/mcp` (Streamable HTTP; OAuth or scoped API key; Pro). Setup page: `screensdesign.com/mcp/setup` (client-rendered — open in browser).
- **Take:** onboarding length, paywall type (soft/hard, trial), plan presentation. Never copy dark patterns (hidden close, fake urgency, pre-checked upsells).

### designspells.com — micro-interactions ("design details that feel like magic")
- **Tags:** Mobile, Desktop, Interaction, Easter Egg, Skeuomorphic, Fun, Apple, Animation, 404, Motion, Occasion, Unique, Dynamic Island, Beautiful, Button, Tablet, Confetti, Transition, 3D.
- **URLs:** `/spells/<slug>` · `/apps/<app>` · RSS `/feed`. **Access:** free. **Method:** fetch.
- **Take:** one delight moment tied to a real event (see designer `motion.md` catalogue).

## 3. Typography

### typewolf.com — fonts on real sites
- **What:** "Site of the Day" entries list each site's fonts; font pages list similar fonts, free alternatives, suggested pairing and every featured site using it.
- **URLs:** `/<font-slug>` (e.g. `/apercu`) · `/site-of-the-day/<slug>` · `/recommendations` · `/google-fonts` · `/free-fonts` · `/all-fonts`. RSS `/feed`.
- **Access:** free (affiliate links flagged). **Method:** fetch.
- **Take:** real pairings with dates; "closest free alternative" for commercial faces.

### fontsinuse.com — typefaces in real-world use
- **What:** 35,000+ documented uses (branding, web, packaging, posters, books) with credits.
- **URLs:** `/uses/<id>/<slug>` · `/typefaces/<id>/<slug>` · formats `/in/2/formats/<id>/<slug>` (Branding/Identity, Web, Packaging…) · topics `/in/1/topics/<id>/<slug>` · `/search/advanced`. RSS `main.rss`, `staff-picks.rss`.
- **Access:** free. **Method:** fetch.
- **Take:** which faces a category actually uses (to follow or deliberately avoid), multi-face combinations from real identities.

### fontinlogo.com — the typeface behind a logo
- **What:** brand → font with a confidence label: Verified · Modified · Based On · Closest Font · Community Suggestion. Shows brand colour hex.
- **URLs:** `/logo/<brand>` · `/font/<slug>` · `/industry/<slug>` · `/verified`.
- **Access:** free. **Method:** fetch.
- **Take:** competitor logo fonts (to differentiate), brand colour. Treat "Closest" as approximate.

## 4. Brand identity & logos

### the-brandidentity.com — identity case studies
- **What:** daily Project / Interview / Insight / Typeface pieces. Case studies credit studio and typeface (e.g. Söhne by Klim).
- **Filters:** `/search?filter=tag_application:<Logo|Wordmark|Website|Packaging|Poster…>` · `tag_industry:` · `tag_aesthetic:<Minimalist|Editorial|Elegant…>` · `tag_colour:` · `tag_material:` · `tag_typographic-genre:`.
- **URLs:** `/project/<slug>`. **Access:** free (store is paid). **Method:** fetch.
- **Take:** how a full identity is structured and presented: lede → brief → idea → logotype → palette → type → imagery → applications → credits.

### logosystem.co — logo gallery with taxonomy
- **What:** 1,600+ logos and animated logos. Filters: Type (Symbol & Text, Wordmark, Symbol, Animated) · Industry · Style (Minimal, Sans-Serif, Geometric, Serif, Script, Monospace…) · Shape (Letterform, Abstract, Circle, Shield & Badge…) · Colour · Mood (Modern, Corporate, Luxury, Playful…).
- **URLs:** `/logo/<slug>` · `/logos/<category>` (e.g. `/logos/wordmark`) · `/?q=` · `/?moods=Elegant` · `/animated` · `/app-icons` · `/moodboard`.
- **Access:** free. **Method:** fetch.
- **Take:** logo-type and style vocabulary for briefs and moodboards. Logos belong to their owners.

---

## 5. More galleries (verified November 2026)
| Source | Best for | Access / method | URL patterns |
|---|---|---|---|
| **One Page Love** — onepagelove.com | First research call for any landing page; section-level references | free; **MCP, no auth:** `claude mcp add --transport http onepagelove https://api.onepagelove.com/mcp` (ask the agent explicitly to use it; up to 10 results per search) | `/style/{brutalism,editorial,luxury,minimal,typographic…}` · `/section/{cta-hero,pricing-table,faq-accordion,footer…}` · `/tech/{gsap,three-js,shadcn-ui…}` · `/typeface/…` |
| **Land-book** — land-book.com | Style-led retrieval ("brutalism + saas + serif") | free; WebFetch 403 → browser | `/design/{landing-page,pricing-page,product-page,case-study…}` · `/?style=brutalism` · `/sections` · `/motion` |
| **Lapa Ninja** — lapa.ninja | Element-level references (hero, pricing, page transitions, cursor hover), colour browsing | free + pro; WebFetch 403 → browser; RSS `/index.xml` | `/category/{saas,minimal,bento-grid,typography…}/` · `/elements/{hero,pricing,faq,page-transition,cursor-hover…}/` · `/color/{name}/` |
| **Awwwards** — awwwards.com/websites | High-craft, experimental; filter by font or tech (GSAP, WebGL, Three.js) | free; fetch | `/websites/{category or tag or technology}/` · `/websites/{Font}/` · `/websites/sites_of_the_day/` |
| **Httpster** — httpster.net | Anti-template layouts and navigation | free; fetch | `/style/{non-standard-layout,non-standard-navigation,typographic,print,brutalist…}/` |
| **SiteInspire** — siteinspire.com | Typographic and editorial | free; fetch | `/websites/category/{slug}` · `/websites/popular/{week,month}` |
| **Minimal Gallery** — minimal.gallery | Restraint-first (whitespace, type) | free; fetch | `/tag/{portfolio,agency,e-commerce…}/` |
| **Dark.design** — dark.design | Dark-mode-first product and AI sites | free; fetch | `/?category={ai,software,hardware…}` · `/site/{slug}` |
| **Recent Design** (former godly.website) — recent.design | Motion references: entries carry screen-recording MP4s | free; fetch | `/websites` · `/launch-videos` · `/app-icons` · `/i/{id}-{slug}` |

## 6. Component code (copy-paste registries)
Default path: the **shadcn CLI/registry**. Search several distinctive registries, `view` the source before adding, then restyle to DESIGN.md tokens — never ship a registry's default look.
- **shadcn/ui** (MIT) — `npx shadcn@latest search @shadcn @magicui @react-bits -q "<query>"` · `npx shadcn@latest view @<ns>/<item>` · `npx shadcn@latest add @<ns>/<item>` · MCP: `npx shadcn@latest mcp init --client claude`. Registry index with health scores: `https://ui.shadcn.com/r/registries.json` (filter to healthy). Docs: `ui.shadcn.com/llms.txt`.
- **Magic UI** `@magicui` (MIT) — animated marketing pieces (globe, marquee, beams, number ticker). Use sparingly; it has a recognisable look.
- **React Bits** `@react-bits` (MIT + Commons Clause: not resellable as the product) — text animations and WebGL/canvas backgrounds; the variant suffix picks JS/TS × CSS/Tailwind (`SplitText-TS-TW`).
- **Motion Primitives** `@motion-primitives` (MIT) — subtle micro-interactions (text effects, morphing dialog, magnetic, tilt).
- **Aceternity UI** `@aceternity` (free + paid Pro; Pro forbids redistribution) — dramatic hero/background effects; registry sometimes degraded.
- **coss ui** (former Origin UI) `@coss` (MIT, built on Base UI) — production app UI: forms, tables, dialogs.
- **HyperUI** (MIT, plain HTML + Tailwind v4) — every page has a `.md` twin; all components in `hyperui.dev/llms-full.txt`. Best for non-React stacks.
- **Uiverse** (MIT) — small playful elements (loaders, toggles); quality varies, curate. WebFetch 403 → browser or GitHub `uiverse-io/galaxy`.
- **21st.dev** — 12,000+ community components; MCP `npx @21st-dev/cli@latest init --client claude` (API key required; `search` free, `get_component` paid; `search_logo` returns brand SVGs). Use free search for ideas, the shadcn path for code.
- **Motion docs MCP** (free, no account) — `npx motion-ai` installs the skill and `https://mcp.motion.dev`; use for correct, current Motion (Framer Motion) APIs.
- Tailwind Plus is paid with no agent access — only with the user's licence, pasted by the user.

## 7. Icons, fonts and colour tools
- **Iconify API** (free; per-set licences returned by the API): search `https://api.iconify.design/search?query=<q>` → SVG `https://api.iconify.design/<prefix>/<name>.svg` (uses `currentColor`) → licences `https://api.iconify.design/collections?prefixes=lucide,ph,tabler`. Keep one prefix per project. Sets: Lucide (ISC), Phosphor `ph`, Tabler, Heroicons, Iconoir, Radix Icons (MIT).
- **Google Fonts catalogue JSON** — `https://fonts.google.com/metadata/fonts` (about 2,000 families; filter `subsets` containing `cyrillic` for Ukrainian UIs; use popularity to avoid the overused top 20). Typography lessons as markdown: `github.com/google/fonts/tree/main/cc-by-sa/knowledge` (CC BY-SA).
- **Fontshare** — CSS embed `https://api.fontshare.com/v2/css?f[]=satoshi@400,700&display=swap`, catalogue `https://api.fontshare.com/v2/fonts`. Free for commercial use; ITF originals are **Latin-only** — not for Cyrillic text.
- **Collletttivo** (OFL, credit requested) and **UNCUT.wtf** (licence per font) — characterful Latin display faces.
- **Radix Colors** (MIT) — 12-step semantic scales (1–2 backgrounds, 3–5 component states, 6–8 borders, 9–10 solids, 11–12 text) with dark and P3 variants.
- **Adobe Leonardo** (Apache-2.0, `@adobe/leonardo-contrast-colors`) — generates colours to hit target contrast ratios; ideal for themes with guaranteed contrast.
- **Realtime Colors** — preview link for the user: `https://www.realtimecolors.com/?colors=<text>-<bg>-<primary>-<secondary>-<accent>&fonts=<Heading>-<Body>`.
- **Huemint API** — role-aware palettes from a contrast matrix; free for non-commercial use only.
- **APCA** (`apca-w3`, limited licence, beta) — secondary check for thin type on dark UIs.

## 8. Verification tools (visual / accessibility / performance gates)
- **Chrome DevTools MCP** (Apache-2.0) — `claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest`: `lighthouse_audit`, performance traces with LCP insights, console/network, computed styles.
- **Playwright** — Perfect Hub's `shots.mjs` for screenshots; MCP `claude mcp add playwright npx @playwright/mcp@latest`, or the token-cheaper `@playwright/cli`.
- **axe-core CLI** (MPL-2.0) — `npx @axe-core/cli <url> --exit` (JSON with `--stdout`); `@axe-core/playwright` for scripted runs.
- **Lighthouse CI** — `lhci autorun`; never use `temporary-public-storage` for private projects (public upload).
- **Figma MCP** (official) — when the user has Figma files: `claude plugin install figma@claude-plugins-official` or `claude mcp add --transport http figma https://mcp.figma.com/mcp`; extract real variables instead of inventing tokens. View/Collab seats get about 20 calls per month.

## 9. Do not use (licence or access)
- **unDraw** — licence forbids scraping, automated download and AI use. Never fetch it.
- **Pangram Pangram** — free tier is personal trial only; web use needs a paid licence.
- **Saaspo** — bot-blocked (403); use Lapa `/category/saas/` or Land-book instead.
- **Velvetyne** site — currently a splash page on every route; use gitlab.com/velvetyne and check each font's licence.
- **godly.website** — redirects to recent.design.

---

## 10. Agent skills ecosystem (ideas integrated into Perfect Hub; optional to install alongside)
| Skill | Source | Idea Perfect Hub uses |
|---|---|---|
| Frontend Design | anthropics/skills | Direction before code, generic test, one signature, writing-as-design |
| Impeccable | pbakaus/impeccable | Modes by surface, craft floor, critique/polish/harden passes |
| Taste Skill | Leonxlnx/taste-skill | Variance/motion/density dials + pre-flight check |
| Hallmark | nutlope/hallmark | Structural variety (macrostructures), themes, slop-test gates |
| UI UX Pro Max | nextlevelbuilder/ui-ux-pro-max-skill | Product type → style/palette/type reasoning; priority UX rules; persisted design system |
| Hue | dominikmartn/hue | Brand → its own design-language skill (see absolute-designer (design system) "skillify") |
| Extract DESIGN.md | google-labs-code/stitch-skills (`stitch::extract-design-md`) | DESIGN.md reverse-engineered from source files |
| shadcn/ui skill | ui.shadcn.com | Add/update components through the shadcn CLI, theme via tokens |
| Interface Design | Dammyjay93/interface-design | Product UI (dashboards, admin) hierarchy — not marketing |
| Better Typography | jakubkrehel / boraoztunc skills | Scale, leading, measure, loading rules by role |
| superpowers | obra/superpowers (MIT) | Systematic debugging, verification before completion, file-based subagent dispatch |
| skills | mattpocock/skills (MIT) | Deterministic red command before hypotheses, tagged debug logs, two-axis review |
| agent-skills, web-quality-skills | addyosmani (MIT) | Doubt gate, Core Web Vitals measurement order, task sizing, ADRs, migrations |
| web-interface-guidelines | vercel-labs (MIT) | Implementation rules folded into design-lint and ux-rules |
| skills | trailofbits (CC-BY-SA-4.0; ideas only, nothing copied) | Risk-based security review, false-positive gates, sharp edges |

Counts quoted on these projects vary between releases — check the repo before citing numbers.
