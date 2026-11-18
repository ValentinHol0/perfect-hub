---
name: absolute-ui-ux
description: UI/UX rules engine for building and reviewing interfaces — navigation, forms, feedback states, tables and dashboards, mobile/touch and native apps (iOS, Android, React Native, Flutter), onboarding and paywalls, microcopy, hardening, perceived performance, and WCAG 2.2 AA accessibility. Use when implementing or auditing components, forms, app shells, dashboards, flows or HTML slides, when the user asks for a UX review, accessibility fixes or "make it usable", or alongside absolute-designer for any UI build.
---

# Absolute UI/UX (Perfect Hub 4.0)


Rules with IDs and priorities (P0 defect · P1 expected · P2 polish). Reference files in `${CLAUDE_SKILL_DIR}/references/`:

| File | Content |
|---|---|
| `ux-rules.md` | ~80 rules: NAV, CTA, FORM, FEED, DATA, MOB, FLOW, COPY, PERF, A11Y |
| `accessibility.md` | WCAG 2.2 AA, native-first patterns (dialog, table, disclosure, tabs, live regions), audit |
| `components.md` | Button, field, table, empty state, skeleton, toast, kbd, window-chrome mock — all states |
| `layouts.md` | App shells: sidebar+header, settings, form grid, list–detail, command palette |
| `mobile-native.md` | Native apps (SwiftUI, Compose, React Native/Expo, Flutter): safe areas, targets, navigation, Dynamic Type, dark mode, permissions, store subscription rules, pre-flight |

Visual direction, typography, colour and motion come from `absolute-designer`. This skill makes it work.

## 1. Hero & page discipline (marketing surfaces)
- Hero fits the first viewport: headline ≤ 2 lines, sub ≤ 20 words, CTAs visible without scrolling; use `min-h-[100dvh]` at most, never `h-screen`.
- ≤ 4 hero text elements: eyebrow/brand strip, headline, sub, CTAs (1 primary + max 1 secondary). Taglines and trust strips go below the hero.
- Hero top padding ≤ `pt-24` on desktop.
- Desktop nav on one line, ≤ 80px tall (default 64–72px).
- Zigzag (image/text alternating) max 2 sections in a row; the 3rd uses another family (bento, list, marquee, full-bleed band).
- Bento: cell count = content count, no empty cells, ≥ 2–3 visually different cells.

## 2. Interaction rules that are always on
- One primary action per view; specific verb labels ≤ 3 words, no wrap on desktop; one label per intent (CTA-01..05).
- Every component ships with hover, active, focus-visible, disabled, loading, empty and error states.
- Loading = skeleton shaped like content; spinners only inline. Tactile press: `active:scale-[0.98]` or `-translate-y-px`.
- Forms: label above, error below with recovery text, `aria-invalid` + `aria-describedby`, correct `autocomplete`/`inputmode`, 16px inputs on mobile.
- Contrast: text ≥ 4.5:1, large text/UI/focus ≥ 3:1. No white text on light photos without a scrim; no ghost buttons over busy imagery. Verify with `node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs" <fg> <bg>`.
- Touch targets ≥ 44×44px; swipe/drag always has a tap alternative.
- Dialogs: native `<dialog>`, focus trapped, Esc closes, focus returns to trigger.
- Icons from one set with `aria-hidden`; icon-only buttons get `aria-label`. No emoji as UI icons.

## 3. Work mode (dashboards, admin, tools)
- Lead with ONE primary metric per view, with period and comparison (DATA-06).
- Tables over cards for comparable records; numbers right-aligned, tabular; sortable headers are buttons with `aria-sort`.
- Filters as removable chips with result count; bulk actions appear on selection.
- Density toggle for power users; keyboard shortcuts shown in tooltips and a ⌘K palette.
- Calibrate against real products: mobbin.com (patterns: tables, empty states, navigation), styles.refero.design ("Dark mode SaaS", "Design tool aesthetic").

## 4. Flows (onboarding, auth, paywall, checkout)
- Show value before sign-up when possible; ≤ 3–5 onboarding steps; skippable.
- Paywall honesty is P0: price, period, trial length and renewal in plain text, visible close, restore purchases, no fake urgency or pre-checked upsells.
- Calibrate step count and paywall type on screensdesign.com (`/categories/<slug>/`) and mobbin flows via `absolute-designer (references)`.

## 5. Slide presentations (HTML)
- Each slide: `height:100vh; height:100dvh; overflow:hidden; position:relative;` — scrollbars banned.
- Type and spacing via `clamp()`.
- Limits: title slide 1 heading + 1 subtitle · content: 1 heading + ≤ 5 bullets or 2 short paragraphs · code: ≤ 10 lines, highlighted, no scroll · grid: ≤ 6 tiles.
- Navigation: ←/→, PageUp/PageDown, wheel, swipe; slide counter; `prefers-reduced-motion` disables transitions.

## 6. Technical detailing (technical directions only)
- Shortcuts in `<kbd>` (token-styled, see components.md).
- Software mocks framed with minimal window chrome (three dots), real content inside.
- ASCII decoration (`[ CONTROL PORTAL ]`, `///`, `>>>`) only in Tactical CRT / Swiss Industrial directions.

## 7. UX review procedure (when asked to review or audit)
1. Screenshot key screens at 375 / 768 / 1280 (`absolute-ui-ux (visual review)`).
2. Walk each flow with the keyboard; note focus, order, traps.
3. Check every rule family in `ux-rules.md`; record findings as `ID · P-level · location · fix`.
4. Run axe (`npx @axe-core/cli <url>`) or Lighthouse when available.
5. Output: P0 list first (must fix), then P1, then P2; each with a concrete code-level fix. Apply fixes when asked, then re-verify.
