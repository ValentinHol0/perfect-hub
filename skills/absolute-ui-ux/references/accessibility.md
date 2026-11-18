# Accessibility (WCAG 2.2 AA) & ARIA Reference

Prefer native HTML. ARIA only fills gaps native elements can't cover ("No ARIA is better than bad ARIA").

## 1. Targets & spacing
- **WCAG 2.5.8 Target Size (Minimum), AA:** ≥ 24×24 CSS px or enough spacing. **Ship 44×44px** (Apple HIG 44pt, Material 48dp) for touch; 32px is acceptable for dense desktop tables.
- Expand hit areas with padding or a pseudo-element, not with margin.
- Tailwind: `min-h-11 min-w-11 inline-flex items-center justify-center` (44px).

## 2. Keyboard & focus
- Never remove outlines without a replacement: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--focus]`.
- Focus indicator contrast ≥ 3:1 against adjacent colours.
- **WCAG 2.4.11 Focus Not Obscured:** sticky headers/footers must not cover the focused element — add `scroll-padding-top` equal to the header height.
- `tabindex="0"` only on custom widgets; never positive tabindex. `tabindex="-1"` for programmatic focus targets.
- Order of focus = visual order.

## 3. Native patterns first

### Dialog (native `<dialog>` handles top layer, Esc, focus containment for modal)
```html
<button type="button" aria-haspopup="dialog" onclick="document.getElementById('invite').showModal()">Invite member</button>

<dialog id="invite" aria-labelledby="invite-title" aria-describedby="invite-desc">
  <form method="dialog">
    <h2 id="invite-title">Invite a team member</h2>
    <p id="invite-desc">They will get an email with a link that expires in 7 days.</p>
    <label for="invite-email">Email</label>
    <input id="invite-email" type="email" autocomplete="email" required>
    <div class="actions">
      <button value="cancel" formnovalidate>Cancel</button>
      <button value="send">Send invite</button>
    </div>
  </form>
</dialog>
```
```css
dialog::backdrop { background: rgb(0 0 0 / .5); }
```
Return focus to the trigger after close (browsers do this for `showModal()`).

### Disclosure / accordion
```html
<details><summary>Can I cancel anytime?</summary><p>Yes. Your plan stays active until the end of the billing period.</p></details>
```

### Sortable data table (a table, not `role="grid"` — grid implies arrow-key cell navigation you must then implement)
```html
<table>
  <caption class="sr-only">Invoices, sorted by date, newest first</caption>
  <thead>
    <tr>
      <th scope="col" aria-sort="descending"><button type="button">Date</button></th>
      <th scope="col" aria-sort="none"><button type="button">Customer</button></th>
      <th scope="col" class="num">Amount, ₴</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><time datetime="2026-11-03">3 Nov 2026</time></td>
      <td>Kyiv Roasters</td>
      <td class="num">12 480,00</td>
      <td><span class="badge badge--warning">Overdue</span></td>
    </tr>
  </tbody>
</table>
```

### Tabs (only when panels are true alternatives at the same level)
`role="tablist"` > `role="tab"` (`aria-selected`, `aria-controls`, roving `tabindex`, ←/→ keys) + `role="tabpanel"` (`aria-labelledby`). If you can't implement arrow keys, use links or segmented buttons instead.

### Live regions
- Non-urgent results: `<div role="status" aria-live="polite">Saved</div>` (present in the DOM before the update).
- Urgent errors: `role="alert"`.

## 4. Content
- Contrast: text ≥ 4.5:1, large text (≥ 24px or ≥ 18.66px bold) ≥ 3:1, UI components/graphics ≥ 3:1. Check with `node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs" <fg> <bg>`.
- Images: informative → concise `alt`; decorative → `alt=""`; complex charts → summary text or data table.
- Icon-only buttons: `aria-label` + `title` optional; SVG inside gets `aria-hidden="true"`.
- Form fields: `<label for>`; groups in `<fieldset><legend>`; errors via `aria-describedby` + `aria-invalid="true"`.
- `lang` on `<html>`; `<span lang="en">` for foreign phrases.
- Visually hidden utility: `.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}`.

## 5. WCAG 2.2 additions to remember
- 2.4.11 Focus Not Obscured (AA) · 2.5.7 Dragging Movements (AA: single-pointer alternative) · 2.5.8 Target Size Minimum (AA) · 3.2.6 Consistent Help (A) · 3.3.7 Redundant Entry (A) · 3.3.8 Accessible Authentication (AA: no cognitive tests; allow paste/password managers).

## 6. Audit loop (evidence first)
1. Run axe / Lighthouse accessibility → use the **failing nodes** to locate the component (don't grep the repo for generic patterns).
2. Inspect the rendered accessibility tree (names, roles, states, landmarks, headings) — browser tools snapshot or Playwright `page.accessibility.snapshot()`.
3. Keyboard-walk the flow (`shots.mjs --focus` helps).
4. Fix → re-run the same audit + manual pass.
Report by impact: **Critical** — missing labels/alt, contrast failures, keyboard traps, no focus indicator · **Serious** — missing `lang`, broken heading structure, vague link text, autoplay, missing skip link · **Moderate** — unlabeled icons, inconsistent navigation, error identification, timing, landmarks.

## 7. Quick audit
- [ ] Tab through the whole page: every control reachable, focus always visible, order logical.
- [ ] Zoom to 200%: no loss of content or horizontal scroll at 1280px.
- [ ] Screen-reader smoke test (NVDA / VoiceOver): page title, landmarks, headings list, form labels.
- [ ] `prefers-reduced-motion` and `forced-colors` (Windows High Contrast) don't break the UI.
- [ ] Automated: axe DevTools or `npx @axe-core/cli <url>`; Lighthouse accessibility ≥ 95.
