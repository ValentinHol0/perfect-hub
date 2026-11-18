# Absolute Visual Reviewer (Perfect Hub 4.0)

Evidence first: screenshots and measured DOM facts, not impressions. Shared references: `${CLAUDE_PLUGIN_ROOT}/assets/references/visual-checklist.md` (full checklist) and `${CLAUDE_PLUGIN_ROOT}/assets/references/framework-fixes.md` (fix recipes per stack).

## 1. Find the target
1. Ask nothing if the URL is obvious. Otherwise detect servers: `node "${CLAUDE_PLUGIN_ROOT}/scripts/lib/dev-servers.js"` → JSON list of open localhost ports.
2. Several servers → choose by `package.json` scripts / framework config. None → start the dev script in the background (Claude desktop: `preview_start` with a `.claude/launch.json` entry; otherwise run `npm run dev` with run_in_background) and wait for the port.
3. Static HTML file → serve it (`npx serve .` / `python -m http.server`) or open the file directly in the browser pane.

## 2. Capture (pick the available tool)
**A. Built-in browser pane** (`mcp__Claude_Browser__*` tools present):
- `navigate` to the URL → `resize_window` preset `mobile` (375) → `computer` screenshot → `tablet` (768) → screenshot → `desktop` → screenshot. Repeat with `colorScheme: "dark"` if the UI supports dark mode. Reset to `desktop` when done.
- `read_console_messages` (onlyErrors) for runtime errors.
- `javascript_tool` for DOM facts: horizontal scroll (`document.documentElement.scrollWidth > clientWidth`), elements whose right edge exceeds the viewport, images without `alt`.

**B. Playwright script** (headless, CI-friendly; needs `playwright` in the project):
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/shots.mjs" http://localhost:5173 .visual-review --full --focus   # light, tiles, keyboard focus
node "${CLAUDE_PLUGIN_ROOT}/scripts/shots.mjs" http://localhost:5173 .visual-review --dark            # dark palette
node "${CLAUDE_PLUGIN_ROOT}/scripts/shots.mjs" http://localhost:5173 .visual-review --wide --nojs     # 1440/1920 folds, JS-off check
node "${CLAUDE_PLUGIN_ROOT}/scripts/shots.mjs" http://localhost:5173 .visual-review --stress          # worst-case content at 375 and 1280
```
- Default: above-the-fold PNG per viewport (375 / 768 / 1280). `--full` adds the full page plus viewport-height tiles (`<vp>-tile-N.png`) — read the tiles, not the full PNG (it is downscaled until text is unreadable).
- `--focus` tabs through 15 stops and reports any without a visible indicator (it compares focused vs blurred styles of the element and 3 ancestors, so `label:has(input:focus-visible)` patterns count).
- `--stress` replays the page with worst-case content: ~40 % longer text (Ukrainian, German and Polish translations run long), unbreakable compound words in headings, buttons, links and labels, longer numbers. Horizontal scroll under stress is blocking. Usual fixes: `overflow-wrap: anywhere` (or `break-word` + `min-width: 0` on flex/grid children) and `hyphens: auto` with a correct `lang` on display headings; buttons that grow instead of fixed widths; tables inside an `overflow-x: auto` wrapper; truncation only with the full text available (title/tooltip).
- JSON report: overflow, clipped text (visually-hidden elements ignored), imgs without alt, unnamed controls, h1 count, console/page errors, failed requests. Exit 1 = blocking issue.
- Playwright is resolved from `$PLAYWRIGHT_DIR` or the current directory. Run from the project root, or set `PLAYWRIGHT_DIR` to any folder with Playwright installed. Missing everywhere → `npm i -D playwright && npx playwright install chromium` (ask before installing into the user's project).
- Form error/loading/success states are app-specific: script them with Playwright (fill invalid input, submit, screenshot) when the page has forms.

**C. Browser agent:** if your tool list has `browser_subagent`, dispatch it with: the URL, the three viewport widths, "capture a screenshot at each width, report horizontal scroll, overlapping or clipped elements and console errors". Prefer option B when Playwright is available — its JSON is deterministic.

**Always also run the static lint** on the changed UI files (catches what screenshots miss — missing alt, clickable divs, focus removal, emoji icons, placeholder images):
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/design-lint.mjs" src/components src/app   # exit 1 = P0 findings
```

## 3. Inspect — blocking defects
- Horizontal scroll or elements past the viewport edge at any width.
- Overlapping/colliding layers; buttons covering inputs; sticky header covering focused elements.
- Clipped text: descenders/diacritics cut by `leading-none` or `overflow:hidden` (check Ukrainian: Й Ї щ ґ).
- Contrast below 4.5:1 (text) / 3:1 (UI) — verify suspicious pairs with `node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs" <fg> <bg>`.
- Primary CTA label wrapping on desktop; navigation wrapping to two lines.
- Any uncaught exception, console error or failed request for app assets.
- Slides: any scrollbar inside a slide or slide taller than the viewport.

## 4. Inspect — quality (report, fix if in scope)
- Hero fits the first viewport; headline ≤ 2 lines.
- Spacing rhythm consistent; alignment to one grid.
- Images: correct aspect ratio, not stretched, no layout shift.
- Focus visible when tabbing; dark mode has no unreadable leftovers (hard-coded colours).
- Taste pass: run `absolute-designer/references/anti-slop.md` section B (AI tells) on the screenshots.

## 5. Fix loop (max 3 rounds, then report a blocker)
1. Locate the source: grep the component by visible text, class names or test ids.
2. Fix at the root (token, layout rule, component) — not with one-off magic numbers or `overflow-x:hidden` on `body` to mask overflow.
3. Re-capture the same viewports and diff against the previous screenshots.
4. Stop when all blocking defects are gone; list remaining quality notes.

## 6. Output
```
Target: <url> (server: <command/port>)
Viewports: 375 ✓ | 768 ✓ | 1280 ✗ (1 issue)   Dark: ✓ / n.a.
Blocking: <list with file:line of fix> | none
Quality notes: <list> | none
Screenshots: <paths>
Rounds: N
```
