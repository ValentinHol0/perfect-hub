# Absolute Design System (Perfect Hub 4.0)


Output: `DESIGN.md` (format: `${CLAUDE_PLUGIN_ROOT}/skills/absolute-designer/references/design-md-template.md`) + one token file in the project's native format + a contrast report. Zero invented values in extract mode — every token traces to evidence.

## Mode A — Extract from a codebase
1. **Locate sources:** `tailwind.config.*`, CSS with `@theme` (Tailwind v4), `:root` variables, `globals.css`, `components.json` (shadcn), theme files (`theme.ts`, `tokens.json`, MUI `createTheme`, styled-components theme), font setup (`next/font`, `@fontsource*`, `<link>` to Google Fonts, `@font-face`).
2. **Inventory raw values with counts:**
   ```bash
   rg -o --no-filename "#[0-9a-fA-F]{3,8}\b|oklch\([^)]*\)|hsla?\([^)]*\)|rgba?\([^)]*\)" src app components styles | sort | uniq -c | sort -rn | head -60
   rg -o --no-filename "font-family:[^;]+|--font-[a-z-]+:[^;]+" src app styles | sort | uniq -c | sort -rn
   rg -o --no-filename "rounded(-[a-z0-9]+)?|border-radius:[^;]+" src app components | sort | uniq -c | sort -rn | head -20
   rg -o --no-filename "shadow(-[a-z0-9]+)?|box-shadow:[^;]+" src app components | sort | uniq -c | sort -rn | head -20
   ```
3. **Cluster & assign roles:** merge near-duplicates (ΔE small / same role), map each cluster to a role by where it's used (body/main bg → `bg`, card bg → `surface`, paragraph colour → `ink`, captions → `muted`, primary button → `accent`, etc.). Record the evidence file:line for each role.
4. **Type:** families per role, sizes actually used (collapse to a scale), weights, leading.
5. **Components:** inventory Button/Input/Card/Table/Dialog/Nav variants and their states; note missing states.
6. **Report drift:** e.g. "17 distinct greys → proposed 6 roles", "3 different radii on buttons", "no focus style on inputs". Propose consolidation; apply only if asked.
7. **Verify:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs" bg=… ink=… …` and paste results into DESIGN.md.

## Mode B — Capture from a live brand / URL / screenshot
1. First check **styles.refero.design** for that site (DESIGN.md may already exist) and **fontinlogo.com/logo/<brand>** (logo font + brand hex).
2. Otherwise open the page in a browser (built-in pane or Chrome) and run in the page:
   ```js
   (() => {
     const pick = 'body,main,header,nav,footer,h1,h2,h3,p,a,button,input,[class*="card"],[class*="btn"]';
     const out = { colors:{}, bgs:{}, fonts:{}, sizes:{}, radii:{} };
     const bump = (o,k) => { if (k && k !== 'rgba(0, 0, 0, 0)') o[k] = (o[k]||0)+1; };
     document.querySelectorAll(pick).forEach(el => { const s = getComputedStyle(el);
       bump(out.colors, s.color); bump(out.bgs, s.backgroundColor); bump(out.fonts, s.fontFamily.split(',')[0]);
       bump(out.sizes, el.tagName+':'+s.fontSize+'/'+s.lineHeight+'/'+s.fontWeight); bump(out.radii, s.borderRadius); });
     const top = o => Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,12);
     return Object.fromEntries(Object.entries(out).map(([k,v]) => [k, top(v)]));
   })()
   ```
3. Screenshot hero + one inner section; infer layout rhythm, radius, imagery style.
4. Write DESIGN.md as "inspired by <brand>" and **change the accent, display face and signature** unless the user owns that brand. Never ship another company's logo, wordmark or exact identity.

## Mode C — Create new
Run `absolute-designer (references)` (references) → pick a direction in `absolute-designer/references/directions.md` → fill the template → export tokens → contrast check.

## Export
Write tokens where the stack expects them (examples in the template): CSS variables · Tailwind v4 `@theme` · Tailwind v3 `theme.extend` · shadcn/ui `globals.css` variables · W3C JSON. One source of truth: other formats are generated from it, not hand-edited in parallel.

## Skillify (only when the user asks — Hue-style)
Create `.claude/skills/<brand>-design/SKILL.md` in the project:
- `description`: "Apply the <brand> design language whenever building or changing UI in this project."
- Body (≤ 120 lines): the frontmatter tokens, 10 do / 10 don't rules, component recipes, path to `DESIGN.md` and the token file.
Future sessions in that repo then apply the brand automatically.

## Output
```
DESIGN.md: <path> (created|updated)
Tokens: <path> (<format>)
Contrast: all pass | failures listed
Drift: N findings (top 5 listed)
```
