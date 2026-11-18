---
name: absolute-designer
description: Distinctive, production-grade visual design for websites, landing pages, app UI, dashboards, components and HTML slide decks. Use whenever the user asks to design, redesign, restyle or "make it look premium / not AI-generated", builds a new page or screen, or invokes /design. Commits to one visual direction, pulls real-world references, defines tokens, builds, then gates the result with an anti-slop pre-flight and visual verification.
---

# Absolute Designer (Perfect Hub 4.0)

Zero fluff. Every colour, face and layout decision is derived from the brief and written down as tokens before code. Reference files live in `${CLAUDE_SKILL_DIR}/references/`.

| File | Use it for |
|---|---|
| `directions.md` | 14 committed directions with contrast-verified palettes, type, shape, motion, dials |
| `typography.md` | Roles, scale, rhythm, loading, curated pairings (Cyrillic flagged), real-world pairings |
| `color.md` | Roles, OKLCH palette method, dark mode, data-viz colour, QA |
| `layout-patterns.md` | Hero archetypes, section families, bento rules, page blueprints, wireframes |
| `motion.md` | Duration/easing tokens, native APIs, micro-interaction catalogue |
| `anti-slop.md` | Pre-flight gates, AI tells, quality score — mandatory before delivery |

Related skills: `absolute-designer (references)` (live references), `absolute-designer (design system)` (DESIGN.md + tokens), `absolute-ui-ux` (UX rules, a11y, states), `absolute-ui-ux (visual review)` (screenshots, layout bugs), `absolute-assets` (icons, OG cards, page imagery). Logos and brand identity: the `/brand` component.

---

## 0. Read the situation (before anything)
1. **Incumbent truth:** look for `DESIGN.md`, a tokens/theme file, `tailwind.config.*` / `@theme`, CSS variables, a component library. If the project has a visual identity → **refinement mode**: keep identity, change only what was asked. If it has styles but no DESIGN.md and the work is more than a one-off tweak → run `absolute-designer (design system)` (extract) first.
2. **The brief wins.** Pinned colours, fonts, eras, brands, "make it like X" override every default in this skill.
3. **Mode** (from the surface, not the company): **Sell** (landing, pricing, campaign) · **Work** (app, dashboard, settings, editor) · **Read** (docs, articles, help) · **Show** (portfolio, gallery). Work and Read put scanability before expression.
4. Missing subject/audience? Pin them yourself in one line and state the assumption — do not stall.

## 1. Design Read + Dials
Output one line:
`Reading this as: <surface> for <audience>, mode <Sell|Work|Read|Show>, with a <vibe> language, leaning toward <direction>.`

Set dials (1–10) and let them drive decisions:
- `DESIGN_VARIANCE` — 1 rigid/symmetric … 10 asymmetric/art-directed.
- `MOTION_INTENSITY` — 1 static … 10 cinematic scroll stories.
- `VISUAL_DENSITY` — 1 airy gallery … 10 data cockpit.
Defaults: Sell 6/5/4 · Work 2/2/7 · Read 3/2/4 · Show 7/5/2. What the values commit you to:
| Dial | 1–3 | 4–6 | 7–10 |
|---|---|---|---|
| Variance | symmetric grid, one layout family per page type | one asymmetric or grid-breaking section | art-directed compositions, cropped type, overlapping layers |
| Motion | state changes only; one authored moment at most; no scroll reveals | one entrance style + micro-interactions | scroll-linked sequences, kinetic type (with reduced-motion fallbacks) |
| Density | ≥ 96px section padding, ≤ 1 idea per screen | 64–96px, cards/lists | tables, 13–14px UI text, 32–40px rows |

## 2. References (mandatory for any new surface; skip for small refinements)
Gather 3–6 real references before choosing tokens. Use `absolute-designer (references)` for the full routing table and MCP setup. Fast routing:

| Need | Go to |
|---|---|
| Hero / sections | onepagelove.com (MCP) · supahero.io · unsection.com · lapa.ninja · jiro.build (MCP) · getlayers.ai (MCP) |
| Whole style of a real product site | styles.refero.design (DESIGN.md per site) |
| App screens & flows | mobbin.com (MCP, Pro) · refero.design |
| Onboarding / paywall | screensdesign.com (MCP, Pro) |
| Bento layouts | bentogrids.com |
| Micro-interactions | designspells.com |
| Type pairings from real brands | typewolf.com · fontsinuse.com · fontinlogo.com |
| Brand identity / logos | the-brandidentity.com · logosystem.co · fontinlogo.com |

For each reference write: URL · what to take (structure, ratio, type scale, motion idea) · what NOT to take. Never copy logos, brand assets, copy or paid source code.

## 3. Direction & tokens
1. Choose one direction from `directions.md` or build a custom one with its recipe.
2. Write the token block:
   - **Colour:** bg, surface, ink, muted, accent, accent-ink, border (+ status if needed). Verify: `node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs" bg=… surface=… ink=… muted=… accent=… accent-ink=… border=…` — must exit 0.
   - **Type:** display / body / utility with sizes, weights, leading, tracking (`typography.md`). Ukrainian copy → `[Cyr]` families only.
   - **Space** (4px scale), **radius**, **elevation**, **motion** tokens (`motion.md`).
   - **Theme:** light, dark or both — chosen from the use scene (`color.md` §3). Single theme → declare `color-scheme`.
   - **Signature:** the one element this page will be remembered by.
3. **Generic test:** "Would I produce this same plan for a different brief in this category?" If yes for any token, change it and say what changed.
4. Persist tokens: CSS variables or Tailwind v4 `@theme` (or `tailwind.config` for v3). Multi-page sites and component-based repos also get `DESIGN.md` (format in `absolute-designer (design system)`); a single landing page doesn't need one.

## 4. Layout plan
- List sections with their layout family (`layout-patterns.md`); no family 3× in a row.
- ASCII wireframe for the hero and the most complex section.
- Mobile composition decided now (what reorders, what collapses, what disappears).
- **Plan pre-flight:** run `anti-slop.md` sections A and B against the plan before writing code; fix the plan, not the build.

## 5. Build
- Native mobile apps (SwiftUI, Compose, React Native, Flutter): follow `absolute-ui-ux/references/mobile-native.md` — platform navigation, safe areas, Dynamic Type and system dark mode outrank web habits.
- Follow the project stack. No stack → single `index.html` (vanilla CSS) for static pages, or React + Tailwind + shadcn/ui for apps (`npx shadcn@latest add <component>` — style its tokens, don't ship the default look).
- Components consume tokens only — no raw hex, no magic spacing.
- Type: `clamp()` sizes; `min-h-[100dvh]` never `h-screen`; `text-wrap: balance` on headings.
- Icons: one set (Lucide / Phosphor / Tabler / custom SVG); fetch exact SVGs via the Iconify API when the set isn't installed. **No emoji as icons.**
- Components: prefer adapting registry code (`npx shadcn@latest view @<ns>/<item>` before `add`) to writing from scratch; restyle it to the tokens so it doesn't carry the registry's default look.
- Imagery: real assets from the user first; otherwise generate photography per `absolute-assets` §5 (an image tool such as `generate_image`, or `scripts/gen-image.mjs` from Claude Code when `agy` is installed); otherwise deliberate CSS/SVG art. Never grey boxes, random stock or placeholder services unless asked.
- For UI builds in a repo, create an empty `.design/lint-on-edit` file: the plugin's PostToolUse hook then runs design-lint after every UI edit and feeds P0 findings back immediately (Claude Code).
- Copy: product language, specific verbs ("Save changes", not "Submit"), errors say what happened and how to fix it, empty states invite the first action. Ukrainian UI copy: natural Ukrainian, not translated English idioms.
- States: hover, active, focus-visible, disabled, loading (skeleton), empty, error.
- Apply `absolute-ui-ux` §1–2 while building: hero ≤ 4 text elements (a caption under media doesn't count), one primary action per viewport (a nav CTA with the same label and target is fine), forms with labels and inline errors.
- Quality floor without announcing it: responsive to 375px, keyboard focus, reduced motion, semantic HTML.
- Watch CSS specificity collisions between section and element classes (padding/margin overrides).

## 6. Critique & verify (not optional)
1. Mechanical pass: `node "${CLAUDE_PLUGIN_ROOT}/scripts/design-lint.mjs" <changed UI files or dirs>` — fix every P0 and P1 (or note why a P1 is intentional).
2. Run `anti-slop.md` on the built result: all gates pass, quality ≥ 85%.
3. Run `absolute-ui-ux (visual review)` (375 / 768 / 1280 screenshots, overflow, console errors, contrast). Fix and re-shoot.
4. "Remove one accessory": delete one decorative element that doesn't serve the brief.
5. For larger work, dispatch the `absolute-design-critic` agent for an independent review.

## 7. Output format
```
Design Read: …
Dials: variance X · motion Y · density Z
References: 3–6 lines (URL — what was taken)
Tokens: compact block (or path to DESIGN.md / tokens file)
Files: created/modified paths
Pre-flight: gates 12/12 · quality NN/MM (N/A k) · tells N → NN%
Screenshots: paths
```
No preamble, no closing pleasantries.

## Image-first loop (only when an image-generation tool is available — e.g. `generate_image`)
For visually heavy sections: generate a section comp (one section per image, not a compressed board) → extract exact properties (copy, proportions, spacing, radii, palette) → rebuild in code to match → screenshot and compare. If no image tool exists, skip this loop — do not simulate it.

## Presentation decks (HTML)
Every slide fits one viewport: `height:100dvh; overflow:hidden`; type via `clamp()`; keyboard ←/→, wheel and swipe navigation; limits per slide (title: 1 heading + 1 subtitle · content: heading + ≤ 5 bullets · code: ≤ 10 lines · grid: ≤ 6 tiles). Directions that work: Swiss Industrial, Kinetic Type, Editorial Luxe, Tactical CRT.

## Hard bans (unless the brief explicitly asks)
Lila rule (neon purple glow / purple-blue gradient over grids) · gradient text · emoji icons · default Inter-on-white with no display decision · heavy drop shadows everywhere · cards in cards · lorem ipsum · identical fade-up on every section · decorative serif when the brief is not editorial/vintage/luxury.
