# Layout Patterns

Structure is information. Every section gets a layout family chosen for its content, and no family repeats three times in a row.

## 1. Hero archetypes (pick by what the product IS)
Calibrate against live examples: supahero.io (`/hero/<slug>`), unsection.com (`/category/hero-section-design`), jiro.build (`/components/header/...`), getlayers.ai (`/sections`).

| # | Archetype | Use when | Structure |
|---|---|---|---|
| H1 | **Product-in-frame** | Software whose UI is the selling point | Short headline + sub + CTA, then a real (not mock-lorem) product screenshot breaking the fold |
| H2 | **Live demo** | The product can be tried in seconds (generator, calculator, editor) | Interactive widget IS the hero; headline is a caption |
| H3 | **Type-as-image** | Agency, campaign, manifesto, event | One oversized statement, maybe cropped by the viewport; minimal sub |
| H4 | **Full-bleed media** | Physical product, travel, hospitality, food | Photo/video edge to edge, text on a protected area (scrim ≥ 4.5:1) |
| H5 | **Split 50/50** | Two things must be seen together (product + form, before/after) | Text column + media column; stacks on mobile with media second |
| H6 | **Index/list** | Portfolio, studio, publication | The work list itself is the hero; hover reveals previews |
| H7 | **Object stage** | Hardware, packaging, 3D | Centered product render on a quiet field, scroll rotates/reveals it |
| H8 | **Search/command** | Directories, marketplaces, docs | A search field with real example queries as the main action |
| H9 | **Proof-led** | Trust is the barrier (finance, health, B2B) | Headline + the strongest single proof (named customer, real metric with source) + CTA |
| H10 | **Editorial cover** | Magazines, longform, reports | Cover-like composition: title, dek, byline, hero image with caption |

Hero constraints (from absolute-ui-ux): fits the first viewport (`min-h-[100dvh]` max, often less), headline ≤ 2 lines, sub ≤ 20 words, ≤ 4 text elements, 1 primary + max 1 secondary CTA, top padding ≤ `pt-24`. The big-number-plus-small-label-plus-stats hero is a template — use only if the number is the product.

## 2. Section families (unsection.com taxonomy)
Hero · Navbar · Logo/Brands · Feature · How-it-works · Testimonials · Stats & Metrics · Integration · Pricing · FAQ · CTA · Team · Blog · Contact · Portfolio · Footer.

Layout families to rotate through:
- **Stack** — centered or left-aligned text block.
- **Split** — text | media (zigzag allowed max 2 in a row).
- **Grid** — 2/3/4 equal columns (only when items are truly parallel).
- **Bento** — mixed-size cells (rules below).
- **List/Index** — rows with metadata; great for features with depth.
- **Carousel/Marquee** — only for many parallel items (logos, testimonials) and never as the only way to reach content.
- **Sticky scroll** — pinned visual + scrolling steps (how-it-works).
- **Full-bleed band** — one statement, one image, or one number on a colour field.
- **Table/Comparison** — pricing, specs.

Section rules:
- Same-size icon+heading+text cards as the page skeleton = template. Use them at most once per page.
- Nested cards are always wrong; a card inside a card should become a list row or a divider.
- One eyebrow label system max (not above every section). No `01 / 02 / 03` numbering unless order carries meaning.
- Testimonials: real name + role + company + photo or none at all; never "John D., CEO".
- Logos: monochrome, same optical size, ≤ 8, aligned on a baseline grid.
- Pricing: 2–4 plans, one highlighted, annual/monthly toggle that shows the saving, feature rows comparable across plans.
- FAQ: real objections (price, cancel, data, support), accordion with `<details>` or an ARIA button pattern.
- Footer: sitemap columns + legal + language/currency; not a second hero.

## 3. Bento rules (bentogrids.com for calibration)
- Cell count = content count. Empty or filler cells are forbidden.
- One hero cell (2×2 or 2×1) carries the main idea; others support it.
- ≥ 2–3 cells must differ visually (real screenshot, photo, tinted fill, custom SVG, live number) — not 6 identical icon cards.
- Gap 12–24px, consistent radius, consistent inner padding; align text to a shared baseline across cells.
- Responsive: 4 → 2 → 1 columns; reorder so the hero cell stays first on mobile.

```css
.bento { display:grid; gap:16px; grid-template-columns:repeat(4,1fr); grid-auto-rows:minmax(180px,auto); }
.bento .hero { grid-column:span 2; grid-row:span 2; }
@media (max-width:1024px){ .bento{ grid-template-columns:repeat(2,1fr);} }
@media (max-width:640px){ .bento{ grid-template-columns:1fr;} .bento .hero{ grid-column:auto; grid-row:auto; } }
```

## 4. Page blueprints
| Page | Order (adapt, don't copy blindly) |
|---|---|
| SaaS landing | Nav → Hero (H1/H2/H9) → Logos → Problem/feature split ×2 → Bento of capabilities → How it works (sticky scroll) → Testimonials → Pricing → FAQ → Final CTA → Footer |
| Product page (e-com) | Breadcrumb → Gallery (left, sticky) + buy box (right: title, price, variants, CTA, delivery) → Details accordion → Reviews → Related → Footer |
| Pricing page | Headline → Toggle → Plans → Full comparison table → FAQ about billing → Enterprise CTA |
| Portfolio | Name/role → Index (H6) → Case studies (problem → process → outcome with real artefacts) → Contact |
| Docs | Left nav tree → Content (max 72ch) → Right "on this page" TOC; search ⌘K; code blocks with copy |
| Dashboard | Sidebar (240–280px) → Header with search/user → Primary metric row → Main chart/table → Secondary panels |
| Auth | Split (H5) or centered card ≤ 420px; social sign-in above email; inline validation |
| Checkout | 2 columns: steps/forms left, summary right (sticky); progress indicator; trust signals near the pay button |
| Onboarding / paywall (mobile) | Value screens (≤ 3–5 steps) → personalisation question(s) → paywall with plan options, trial terms in plain text, visible close/restore. Calibrate on screensdesign.com (`/categories/<slug>/` shows the typical paywall type and onboarding step count per app category) |

## 5. App flows (mobbin.com)
Before designing a multi-screen flow, look at 3+ real apps doing it (mobbin: onboarding, checkout, account setup, subscription; UI patterns: dialogs, navigation, forms, tables, empty states, paywalls). Note step count, where the value is shown, how errors recover. Keep the flow's verbs consistent ("Publish" button → "Published" toast).

## 6. Wireframes (ASCII, for planning)

SaaS hero (H1):
```text
+---------------------------------------------------------+
| [LOGO]                Features   Docs   Pricing   [CTA] |  nav 64px
+---------------------------------------------------------+
|                THE THESIS HEADLINE                      |
|             Supporting sub-copy, ≤ 20 words.            |
|             [PRIMARY CTA]   secondary link              |
|        +-----------------------------------------+      |
|        |   real product UI, crops the fold       |      |
+---------------------------------------------------------+
```

Bento feature block:
```text
+--------------------------+--------------+--------------+
|  HERO CELL (2x2)         |  cell: live  |  cell: photo |
|  main capability + demo  |  number      |              |
|                          +--------------+--------------+
|                          |  cell: integration logos    |
+--------------------------+-----------------------------+
```

Split auth (H5):
```text
+----------------------------+----------------------------+
|  brand art / product shot  |   [LOGO]  Welcome back     |
|                            |   [Continue with Google]   |
|                            |   ── or ──                 |
|                            |   Email [__________]       |
|                            |   [Continue]               |
+----------------------------+----------------------------+
```

Dashboard shell:
```text
+----------+----------------------------------------------+
| [LOGO]   |  Search…  ⌘K                     [User]      |  64px
+----------+----------------------------------------------+
| Nav      |  PRIMARY METRIC  (one, with trend + period)  |
| Nav      |  +--------------------------------------+    |
| Nav      |  |  main chart or table                 |    |
|          |  +--------------------------------------+    |
| Settings |  secondary panel   |   secondary panel       |
+----------+----------------------------------------------+
```

## 7. Grid & spacing
- Spacing scale on a 4px base: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
- Section padding: 64–128px desktop, 48–72px mobile; tight groups inside, generous separation between.
- Container: 1120–1280px marketing, fluid with max for apps; text columns ≤ 72ch.
- Nav: one line on desktop, 56–72px tall, sticky only if the page is long.
- Mobile: 16–20px side gutters, no horizontal scroll, tap targets ≥ 44px.
- `overflow-x: clip` (not `hidden`, which breaks `position: sticky`) on `html, body`; never size elements with `100vw` (it includes the scrollbar).
- Grid tracks with images: `minmax(0, 1fr)`; display headings: `overflow-wrap: break-word; min-width: 0` so long words can't blow out a column.
- Cap containers so at 1920px the gutters grow while measure and grids stay put.
- About 80 words per screen in marketing sections; more means the section is doing two jobs.
- Surfaces climb a ladder — whitespace → hairline → tinted well → card (border OR shadow, never both); nested radii are concentric (inner = outer − padding); one z-index scale (raised 10 · dropdown 100 · sticky 200 · nav 300 · modal 400 · toast 500).
