# Colour System

A palette is a set of **roles**, not a list of nice colours. Build roles, verify contrast with the script, then ship them as tokens.

## 1. Roles (minimum set)
| Token | Job | Rule |
|---|---|---|
| `--bg` | Page background | Chosen from the use scene (ambient light, session length), not the category |
| `--surface` | Cards, panels, inputs | 1 step off bg (lighter in light mode, lighter in dark mode too) |
| `--raised` (opt.) | Popovers, menus | Next step from surface |
| `--ink` | Body text | ≥ 4.5:1 on bg and surface; aim ≥ 12:1 |
| `--muted` | Secondary text, captions, placeholders | ≥ 4.5:1 on bg AND surface. Tint it from the hue of bg — never a random neutral grey |
| `--accent` | Primary action, focus, key data | ≥ 3:1 on bg when used as UI/large text; fill-only accents are allowed but must never carry text |
| `--accent-ink` | Text/icons on accent | ≥ 4.5:1 on accent |
| `--border` | Dividers, input outlines | Hairlines are decorative; input borders that define a control need ≥ 3:1 (or a filled surface) |
| `--positive` `--negative` `--warning` | Status | Each ≥ 4.5:1 as text on surface; never rely on colour alone (icon/label too) |
| `--focus` | Focus ring | ≥ 3:1 against both the control and the bg; usually = accent |

Verify:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs" bg=#F7F7F4 surface=#FFFFFF ink=#1C1B22 muted=#615F6B accent=#C9370F accent-ink=#FFFFFF border=#DADAD4
node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs" --css src/styles/tokens.css
```
Exit code 1 = a required pair failed. Fix before building.

## 2. Building a palette (OKLCH method)
1. Pick the accent from the subject's world (pigment, material, signal). Express it in `oklch(L C H)`.
2. Neutrals: same hue as the accent (or the bg), chroma 0.005–0.02. Tinted neutrals look designed; pure greys look default.
3. Ramp: generate 50→950 by stepping L (≈ 0.97, 0.93, 0.87, 0.78, 0.68, 0.58, 0.49, 0.40, 0.31, 0.23, 0.16) while easing C down at both ends. Keep H constant (or shift ≤ 10° toward warm at dark end).
4. Assign roles from the ramp; run the contrast script; nudge L (not H) until every pair passes.
5. Proportion: ≈ 60% bg/surface · 30% ink/neutral structure · ≤ 10% accent (aim < 5% of any single viewport). If accent is everywhere, it signals nothing.
6. Every rule that paints a dark (or coloured) surface sets its text colour in the same rule; never grey text on a coloured surface — tint it from that surface's hue.

## 3. Dark mode is a separate palette, not an inversion
- bg L ≈ 0.13–0.18 (not pure #000 unless the direction is cinematic); surfaces get **lighter** with elevation.
- Desaturate accents by ~10–20% chroma and raise L so they don't vibrate.
- Body text ≈ L 0.92–0.95 (not pure white) to reduce halation.
- Shadows barely read in dark mode — separate with surface steps and 1px borders.
- Decide per product: ship dark mode only when the use scene or brief needs it (long sessions, night use, dev tools). Then test both palettes (`contrast.mjs --css <file> --scope=dark`) and offer `prefers-color-scheme` plus a manual toggle. Otherwise declare `color-scheme: light` and don't half-support dark.

## 4. Gradients, glass, glow
- Gradients only when they describe something (light source, material, data). Mesh/aurora blobs behind a hero are the AI default.
- Never gradient-filled text for emphasis — use size/weight.
- Glass (`backdrop-filter`) only over real content that moves beneath it (sticky nav over scrolling content), with a solid fallback.
- **Lila rule:** no neon-purple glow buttons, no purple-to-blue gradient over a dot grid.

## 5. Data-visualisation colour
- Categorical: max 6–8 hues, equal perceived lightness (same OKLCH L ±0.05), distinguishable for colour-vision deficiency (avoid red/green as the only pair).
- Sequential: one hue, L from 0.95 → 0.35.
- Diverging: two hues meeting at a neutral mid-point.
- Highlight one series in accent, everything else in muted neutrals.

## 6. Where to steal real systems
- **styles.refero.design** — 2,000+ real product-site design systems with colours, type, spacing and a DESIGN.md per site; filter chips like "Dark mode SaaS", "Luxury e-commerce", "Botanical & organic", "Zero border radius". Best first stop when a brief says "like <real brand>".
- **fontinlogo.com/logo/<brand>** — shows the brand colour hex next to the logo font.
- **getlayers.ai** MCP (`getlayers_palettes`) — curated palettes, if connected.
- Directions in `directions.md` — 14 pre-verified palettes.

## 7. Colour QA
- [ ] Every role pair passes the script (exit code 0).
- [ ] Accent used for ≤ 10% of the surface and always means "action" or "the key thing".
- [ ] Status never conveyed by colour alone.
- [ ] Focus ring visible on every interactive element in both themes.
- [ ] No raw hex inside components — only tokens.
