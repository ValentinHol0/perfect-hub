# DESIGN.md Template

DESIGN.md is the single source of visual truth for a project. Agents read it before touching UI. Keep it short (≤ 250 lines), factual, and in sync with the token files. YAML frontmatter is mandatory and must contain the core colour roles.

```markdown
---
name: <Product> Design System
version: 1.0.0
updated: YYYY-MM-DD
mode: sell | work | read | show          # primary surface mode
direction: <direction name or "custom: …">
colors:
  light:
    bg: "#…"
    surface: "#…"
    raised: "#…"            # optional
    ink: "#…"
    muted: "#…"
    accent: "#…"
    accent-ink: "#…"
    border: "#…"
    focus: "#…"
    positive: "#…"
    negative: "#…"
    warning: "#…"
  dark:                      # omit if the product has no dark mode
    bg: "#…"
    # … same roles
typography:
  display: { family: "…", fallback: "…", weights: [600, 700], tracking: "-0.03em", leading: 1.0 }
  body:    { family: "…", fallback: "system-ui, sans-serif", weights: [400, 500], leading: 1.55 }
  utility: { family: "…", use: "code, data, captions" }   # optional
  scale: [12, 14, 16, 18, 20, 24, 30, 40, 56, 72]          # px
  scripts: [latin, cyrillic]
spacing: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
radius: { sm: 4, md: 8, lg: 16, pill: 9999 }
elevation:
  1: "0 1px 2px rgb(0 0 0 / .06)"
  2: "0 8px 24px rgb(0 0 0 / .10)"
motion:
  durations: { instant: 100, fast: 160, base: 240, slow: 400 }
  easing: { out: "cubic-bezier(0.16,1,0.3,1)", inOut: "cubic-bezier(0.65,0,0.35,1)" }
breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 }
icons: lucide | phosphor | tabler | custom
---

# <Product> Design System

## Intent
2–4 sentences: who it is for, the feeling, the one signature element, what it must never look like.

## Colour
Role table with usage rules ("accent = primary action and focus only; never decorative fills").
Contrast report: paste the output of `contrast.mjs`.

## Typography
Roles, scale with where each step is used, rules (measure, balance, tabular numbers, Cyrillic notes).

## Layout
Grid, containers, section rhythm, layout families in use, mobile rules.

## Components
For each core component (Button, Input, Select, Card, Table, Dialog, Toast, Nav, Tabs, Badge):
variants · sizes · states (hover/active/focus/disabled/loading/error) · do/don't (one line each).

## Motion
Which moments animate and how; reduced-motion behaviour.

## Imagery & icons
Photography/illustration direction, aspect ratios, icon set, stroke width.

## Voice & copy
Tone, casing (sentence case), button verbs, error/empty-state patterns, language(s).

## Do / Don't
5–10 bullets each, concrete ("Don't use gradient text", "Do keep one primary button per view").

## References
Cited sources this system was derived from (URLs).
```

## Token export formats

CSS variables (any stack):
```css
:root { --bg:#F7F7F4; --surface:#FFFFFF; --ink:#1C1B22; --muted:#615F6B; --accent:#C9370F; --accent-ink:#FFFFFF; --border:#DADAD4; }
[data-theme="dark"] { /* dark roles */ }
```

Tailwind v4 (`@theme` in the main CSS):
```css
@import "tailwindcss";
@theme {
  --color-bg: #F7F7F4; --color-surface: #FFFFFF; --color-ink: #1C1B22; --color-muted: #615F6B;
  --color-accent: #C9370F; --color-accent-ink: #FFFFFF; --color-border: #DADAD4;
  --font-display: "Onest", system-ui, sans-serif; --font-body: "Onest", system-ui, sans-serif;
  --radius-md: 8px;
}
```

Tailwind v3 (`tailwind.config.ts` → `theme.extend`): map the same roles to `colors`, `fontFamily`, `borderRadius`, `boxShadow`, `transitionTimingFunction`.

shadcn/ui: map roles onto its variables in `globals.css` (`--background`, `--foreground`, `--card`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--border`, `--ring`) instead of keeping its default palette.

W3C design-tokens JSON (for Figma/Style Dictionary):
```json
{ "color": { "accent": { "$type": "color", "$value": "#C9370F" } } }
```
