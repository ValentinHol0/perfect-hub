---
name: antislop
description: "Perfect Antislop - finds and removes the template traces of AI-generated work in websites and apps: generic UI (purple gradients, glow, blobs, glass cards, icon tiles, eyebrow labels, default fonts, three equal feature cards), copy in English and Ukrainian (chat residue, hype words, stock phrases, 'not just X but Y', invented proof and names, calques, Russianisms, bureaucratese, wrong quotes) and code (swallowed errors, stubs, any, narrator comments). Scores 0-100, rewrites without inventing facts, rescans until the ship gate passes. Use when the user asks to de-slop, humanize, make a site or text look and read less AI-generated, or invokes /antislop."
argument-hint: "[path or URL] [--only ui,layout,en,uk,code]"
---

# /antislop — Perfect Antislop

The goal is not to hide that AI helped; it is to remove what makes work **generic**: defaults nobody chose, claims nobody can check, words that say nothing. Every fix must make the product more specific to *this* user, brand and audience.

Scanner: `node "${CLAUDE_PLUGIN_ROOT}/scripts/antislop.mjs" <paths> [--json] [--only ui,layout,en,uk,code] [--gate] [--baseline before.json]` — design-lint rules plus ~70 antislop rules, a 0-100 score per surface (UI, layout, English, Ukrainian, code) and overall. Catalogue and rewrite rules: `${CLAUDE_SKILL_DIR}/references/catalogue.md`. Visual direction rules: `${CLAUDE_PLUGIN_ROOT}/skills/absolute-designer/references/anti-slop.md`.

## Workflow (max 3 rounds)
1. **Scan** the source (or the built site: point it at the build folder; a live URL → save the HTML first or scan the source). Save `--json` as `before.json`. Bands: 0-14 clean · 15-34 minor · 35-59 suspicious · 60+ heavy. **Ship gate: 0 P0 and score ≤ 25.**
2. **Rank** by severity × visibility: P0 first (residue, placeholders, invented contacts/proof, swallowed errors, stubs), then the hero/h1/title, then clusters (three or more different tells in one section mean the section is generic, not just one word).
3. **Critic pass:** dispatch `antislop-critic` (Agent tool, `subagent_type: "perfect-hub:antislop-critic"`) with the file list and the JSON — not your reasoning. It confirms the items a regex cannot judge (are these testimonials real? is this stat sourced? is the purple the brand colour?), drops false positives and returns SHIP / FIX / REWRITE with ranked fixes.
4. **Fix:**
   - *Mechanical* (no judgement): straight quotes → «» in Ukrainian, spaced dashes, `h-screen` → `min-h-dvh`, remove arrows/emoji used as decoration, `transition-all` → named properties, add `prefers-reduced-motion`.
   - *Copy rewrites:* keep every fact, name and number; replace each vague claim with the concrete thing it stands for (what the product does, for whom, measured how). **Never invent** proof, customers, quotes, addresses or numbers — ask the user, or leave a clearly marked slot `[ПОТРІБНО: реальний відгук]`. Ukrainian: natural syntax (see the catalogue's calque and Russianism tables; `/translate` QA rules apply).
   - *Design:* through tokens and DESIGN.md (`absolute-designer`): a deliberate type pair, the brand hue instead of the default purple, one accent, varied section rhythm, real imagery. Structural clichés (hero + three cards + stats + testimonials + pricing + FAQ) → restructure around the user's job; that is design work, not a find-and-replace.
   - *Code:* handle or surface errors, implement or delete stubs, replace `any` with real types, delete narrator comments, keep "why" comments.
5. **Rescan** with `--baseline before.json`: P0 = 0, score ≤ 25 **and no new fingerprints** (removing one tell often creates another — the classic swap is "seamless" → "effortless"). Repeat at most 3 rounds; then report what is left for a human.

## Inside other pipelines
- `/absolute` P4 DESIGN and `/absolute-goal` hardening run `antislop.mjs --gate` on changed UI and copy; the `antislop-critic` is the challenger seat in councils about UI, copy or scope.
- Brand, marketing and social deliverables (`/brand`, `/marketing`, `/social`) get a scan before delivery.

## Report (the user's language)
```
Antislop: <before> → <after> /100 (<band>) · P0 <before → after> · rounds <n>
Fixed: <grouped list — what changed and why it is now specific>
Left for you: <facts only the user can supply (real testimonials, numbers, photos)> | none
Waived: <id — reason> | none
```
