---
name: brand
description: "Brand and visual production delivered as real files: brand identity, logo systems, favicons and app icons, brand books and guideline boards, Meta and TikTok ad creatives, product imagery and social templates. Use when the user asks for a logo, identity, rebrand, brand book, ad creative, banner, product shot or social post design, or invokes /brand. Reads its reference files per task, generates images or builds them in SVG/HTML, and hands websites and code to the core /absolute."
---

# /brand — Perfect Brand

Deliver files, not descriptions. Every asset is an SVG, PNG, HTML or PDF in `deliverables/brand/<brand-slug>/` (unless the user names a place), checked at real size before it is called done.

## 1. Intake
Ask only what is missing and blocks the work — at most 4 questions in one message:
1. **Brand:** name, what it sells or does (one sentence), market (default: Ukraine, Ukrainian-language copy).
2. **Audience and position:** who buys, price level, 3–5 competitors (names or links).
3. **Asset and placement:** what exactly, where it will run (Instagram feed, TikTok, packaging, site header, marketplace card), deadline.
4. **What exists:** logo files, palette, fonts, `DESIGN.md`, photos of the real product, brand rules that cannot change.

Rulings when the user does not answer or says "just do it" — state them in one line and proceed:
- Market Ukraine; copy in Ukrainian; every typeface must cover Cyrillic incl. `Ґ ґ Є є І і Ї ї ’` and the hryvnia sign `₴` (else write "грн").
- Logos: 3 distinct concepts → 1 refined system. Creatives and photos: 2 variants per placement.
- Formats from the verified spec tables in the domain skills; nothing from memory.
- Existing identity wins: refine inside it (refinement mode) unless the user asks for a rebrand.

## 2. Production path — check the session's tools first
| Asset | Image tool available | No image tool |
|---|---|---|
| Logo, icon, monogram | Generate rough concepts → choose → **redraw the final as SVG** (a raster is never the production logo) | Author SVG on a grid directly (`references/logo.md`) |
| Product shot, lifestyle scene | Generate from an art-direction prompt (`references/product-photo.md`) | Write a 3-variant prompt pack and say which generator to run it in; optionally stage a CSS/SVG composition |
| Ad, banner, social post, board | Generate background art **without text** → set type in HTML/SVG on top → render PNG | Full HTML/SVG composition → render PNG |

Image tools, in this order — never claim a call that did not happen:
1. An image-generation tool in your tool list (e.g. `generate_image`).
2. With the Gemini `agy` CLI available: `node "${CLAUDE_PLUGIN_ROOT}/scripts/gen-image.mjs" --check`, then `node "${CLAUDE_PLUGIN_ROOT}/scripts/gen-image.mjs" --out <path> --aspect 4:5 --prompt "<art direction>"` (Gemini image model through the user's `agy` CLI, roughly a minute per image, uses the user's Gemini quota — generate only what the task needs).
3. An image MCP connected to the session.
4. None → the SVG/HTML route above.

## 3. Routing
| Request | Skill |
|---|---|
| New brand, rebrand, "who are we visually", identity from a name | `references/identity.md` |
| Logo, wordmark, monogram, symbol, favicon, app icon, logo files | `references/logo.md` |
| Brand book, guidelines, brand board, palette/typography/voice rules | `references/guidelines.md` |
| Ads and banners for Meta/TikTok, creative variations for testing | `references/ad-creatives.md` |
| Product photos, packshots, lifestyle scenes, marketplace images | `references/product-photo.md` |
| Post, story, carousel and cover templates; a social kit | `references/social-templates.md` |
| Independent critique of logos or creatives | agent `brand-art-director` |

Multi-part requests run in this order: identity → logo → guidelines → social templates → ad creatives. Read the matching reference file (`references/<topic>.md` next to this skill) before doing that part of the work.

## 4. Scripts
| Script | Does |
|---|---|
| `scripts/gen-image.mjs` | One raster image through the user's Gemini `agy` CLI; `--check` only reports availability |
| `scripts/export-icons.mjs` | SVG master → favicon.ico, 16/32/48, apple-touch 180, PWA 192/512 + maskable, Play 512, App Store 1024, `<head>` snippet |
| `scripts/render-templates.mjs` | Every `data-frame` element of an HTML file → its own PNG; fails if a frame drifts from its `data-size` |
| `scripts/contrast.mjs` | WCAG contrast for colour pairs or role tokens; exit 1 on a failing pair |
Playwright-based scripts read Playwright from `$PLAYWRIGHT_DIR` or the current directory and exit 3 with install instructions when it is missing — then render with the browser tool (element screenshots at the listed sizes) instead.

## 5. Quality gates (every delivery)
- [ ] Real files at the stated paths; file names lowercase with hyphens, ≤ 4 words.
- [ ] Logo works in one colour, reads at 16 px, has a defined clear space and minimum size.
- [ ] Every text-on-colour pair passes `contrast.mjs` (4.5:1 body text, 3:1 large text/UI) — results pasted into the guidelines.
- [ ] Cyrillic and Latin both render in the chosen faces; no fallback glyphs; licence allows logo/commercial use.
- [ ] Platform sizes and safe zones match the verified tables (with check date) in `references/ad-creatives.md` / `references/social-templates.md`.
- [ ] Every generated image reviewed at 100 % for artefacts (lettering, hands, product geometry, reflections, off-brand colour); flawed → regenerate, never ship with a caveat.
- [ ] Honesty: a generated image is never presented as a real photo of the client's product, team, premises or customers.
- [ ] No imitation of an existing brand's logo, mascot or trade dress; references are for category literacy and differentiation.
- [ ] Identity, logo and campaign sets get an independent pass from `brand-art-director` before delivery.

## 6. Output format
```
Assets: <paths>
Direction: idea in one sentence · style · palette (hex) · type (faces, licence)
Prompts: <final prompt per generated asset, or "none — SVG/HTML">
Checks: one-colour ✓ · 16 px ✓ · contrast <min ratio> ✓ · Cyrillic ✓ · specs <date checked> ✓ · artefacts ✓
Critique: <brand-art-director verdict, or "not run — reason">
Next: <one line, only if something is pending>
```
Reply in the user's language. No emojis, no filler.

## 7. Handoffs
- **Core (websites, landing pages, apps, code, `DESIGN.md` in a repo):** write `.planning/handoff-brand.md` — goal, audience, content, constraints, assets (paths to logo SVG, tokens, fonts, images), acceptance criteria. Then run `/absolute` with that brief.
- **Other components** — load the component skill (`perfect-hub:<skill>`) with a brief (`.planning/handoff-brand-to-<component>.md`, same fields):

| Need | Addon |
|---|---|
| Post copy, content calendar, Reels scripts that use these templates | `/social` |
| Campaign structure, budgets, audiences, test reading | `/ads` |
| Landing, email or ad copy, slogans at scale | `/marketing` |
| Brand book as DOCX/PPTX/PDF | `/office` |
| Trademark clearance, licence wording | a qualified lawyer — Perfect Hub prepares the brief, not legal clearance |
| Second-language versions of guidelines or creatives | `/translate` |
| Marketplace listing text, offer, pricing | `/selling` |
