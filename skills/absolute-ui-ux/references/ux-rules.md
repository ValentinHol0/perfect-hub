# UX Rules

Priority: **P0** = defect (must fix) · **P1** = expected quality · **P2** = polish. Cite rule IDs in reviews (e.g. `FORM-03 P0`).

## NAV — Navigation & information architecture
- NAV-01 P0 — The user can always tell where they are (active nav state, page title, breadcrumb in deep hierarchies).
- NAV-02 P0 — Every screen has a way back/out that does not lose work (or warns first).
- NAV-03 P1 — Desktop top nav ≤ 7 items, one line, 56–72px tall; secondary items go to a menu.
- NAV-04 P1 — Mobile: bottom tab bar for 3–5 primary destinations in apps; hamburger only for secondary.
- NAV-05 P1 — Labels use the user's nouns, not internal system names.
- NAV-06 P1 — Search available wherever content > ~30 items; ⌘K / Ctrl+K palette in power tools.
- NAV-07 P2 — Sticky header only when the page is long and the header holds actions.
- NAV-08 P0 — Links navigate (`<a href>`), buttons act (`<button>`). Never a div with onClick.
- NAV-09 P1 — URL reflects state worth sharing or restoring: filters, tabs, pagination, search query, expanded panels (deep-linkable, back button works).

## CTA — Actions
- CTA-01 P0 — One primary action per view; secondary actions visually subordinate.
- CTA-02 P1 — Labels are specific verbs + object ("Create invoice"), ≤ 3 words, no wrap on desktop.
- CTA-03 P1 — One label per intent across the page ("Contact sales" everywhere, not also "Get in touch").
- CTA-04 P0 — Destructive actions are visually distinct, confirm or offer undo (undo preferred).
- CTA-05 P1 — The action's name carries through the flow: "Publish" → toast "Published".
- CTA-06 P1 — Disabled buttons explain why (tooltip/helper) or are replaced by an enabled button that validates.

## FORM — Forms & input
- FORM-01 P0 — Every input has a visible `<label>` (placeholder is not a label).
- FORM-02 P0 — Errors appear next to the field, say what's wrong and how to fix it, and are announced (`aria-describedby` + `aria-invalid`).
- FORM-03 P1 — Validate on blur/submit, not on every keystroke; never clear the user's input on error.
- FORM-04 P1 — Correct `type`, `inputmode` and `autocomplete` (email, tel, one-time-code, street-address, cc-number…).
- FORM-05 P0 — Inputs ≥ 16px font on mobile; touch targets ≥ 44px.
- FORM-06 P1 — Ask only what is needed now; optional fields marked "(optional)", not required ones starred everywhere.
- FORM-07 P1 — Long forms split into steps with a progress indicator and saved progress.
- FORM-08 P0 — Allow paste and password managers; no CAPTCHA-style cognitive tests for login (WCAG 3.3.8).
- FORM-09 P1 — Don't make users re-enter information already given in the same flow (WCAG 3.3.7).
- FORM-10 P2 — Smart defaults (country from locale, today's date) and input masks that don't fight typing.
- FORM-11 P1 — On submit with errors, move focus to the first invalid field (and announce the error count).
- FORM-12 P1 — Submit stays enabled until the request starts (then busy state); never disable it as a hint that something is invalid.
- FORM-13 P2 — `spellcheck="false"` / `autocapitalize="off"` on emails, codes, usernames; checkbox/radio and its label share one hit target.
- FORM-14 P1 — Warn before leaving a page with unsaved changes.

## FEED — Feedback & system status
- FEED-01 P0 — Every action gets feedback within 100ms (pressed state), progress within 1s, result when done.
- FEED-02 P1 — Loading: skeletons shaped like the content for > 300ms waits; optimistic UI for safe actions; spinners only for small inline waits.
- FEED-03 P1 — Toasts for non-blocking results (auto-dismiss 4–6s, pausable, `role="status"`); blocking errors inline, not in toasts.
- FEED-04 P0 — Errors name the problem, the cause if known, and the recovery; no "Something went wrong" alone.
- FEED-05 P1 — Empty states: what this area is for + the first action (+ example/import option).
- FEED-06 P1 — Long operations: background them, show progress, notify on completion.
- FEED-07 P2 — Success moments that matter get a small celebration (see designer motion.md); routine saves don't.

## DATA — Tables, lists, dashboards (Work mode)
- DATA-01 P0 — Numbers right-aligned with tabular figures; units in headers, not every cell.
- DATA-02 P1 — Sortable columns use a header `<button>` with `aria-sort`; current sort visible.
- DATA-03 P1 — Filters visible and removable as chips; result count shown; "clear all".
- DATA-04 P1 — Row actions on hover AND via keyboard/menu; bulk actions appear when rows are selected.
- DATA-05 P1 — Pagination or virtualised scrolling for > 100 rows; keep header sticky.
- DATA-06 P0 — Dashboard leads with ONE primary metric per view, with period and comparison ("vs last 30 days").
- DATA-07 P1 — Chart choice: trend → line; comparison → bar; part-of-whole (≤ 5 parts) → stacked bar over pie; distribution → histogram. Label directly, avoid legends when possible.
- DATA-08 P1 — Density control (comfortable/compact) for power users; 32–40px rows compact, 48–56px comfortable.
- DATA-09 P2 — Status badges: tinted background + text + icon; never colour alone.

## MOB — Mobile & touch
- MOB-01 P0 — No horizontal scroll at 375px; content reflows, never shrinks to fit.
- MOB-02 P0 — Tap targets ≥ 44×44px with ≥ 8px between (WCAG 2.5.8 floor is 24px; 44 is the standard to hit).
- MOB-03 P1 — Primary actions within thumb reach (bottom area) in apps; sticky bottom CTA on long mobile forms.
- MOB-04 P1 — Respect safe areas (`env(safe-area-inset-*)`), use `100dvh` not `100vh`.
- MOB-05 P1 — Every swipe/drag gesture has a tap alternative (WCAG 2.5.7).
- MOB-06 P2 — Bottom sheets over modals for mobile choices; sheets dismiss by swipe and by a visible control.
- MOB-07 P1 — `overscroll-behavior: contain` on modals, drawers and sheets (no scroll chaining to the page); `touch-action: manipulation` on controls.
- MOB-08 P2 — `autoFocus` only on desktop and only for single-input screens (it opens the mobile keyboard and jumps the page).
- Native apps (iOS/Android/React Native/Flutter): see `mobile-native.md`.

## FLOW — Onboarding, auth, paywall, checkout
- FLOW-01 P1 — Onboarding shows value before asking for sign-up when possible; ≤ 3–5 steps; skippable.
- FLOW-02 P1 — Sign-up: social/passkey options first, email second; password rules shown before typing, not after failing.
- FLOW-03 P0 — Paywall honesty: price, billing period, trial length and renewal date in plain text; visible close; restore purchases; no pre-checked upsells, fake timers or confirm-shaming.
- FLOW-04 P1 — Paywall shows 2–3 plans max, recommended one highlighted, savings expressed as a real amount.
- FLOW-05 P1 — Checkout: guest checkout, progress indicator, order summary visible, total including tax/shipping before the pay button.
- FLOW-06 P1 — Calibrate step counts and paywall type against real apps (screensdesign.com category stats, mobbin flows).

## THEME — Theming
- THEME-01 P1 — `color-scheme` set on `:root` (`light`, `dark` or `light dark`) so native controls and scrollbars match; `<meta name="theme-color">` matches the page background.
- THEME-02 P2 — Native `<select>` gets explicit `background-color` and `color` (Windows dark mode renders white-on-white otherwise).
- THEME-03 P2 — Theme browser surfaces: `::selection`, `caret-color`, `accent-color`, scrollbar colours, underline offset.

## I18N — Locale
- I18N-01 P1 — Dates, numbers, currency and relative time via `Intl.*` (`Intl.NumberFormat('uk-UA', {style:'currency', currency:'UAH'})` → «1 234,50 ₴»), never hand-formatted.
- I18N-02 P2 — Detect language from `Accept-Language` / `navigator.languages`, not IP; always allow switching.
- I18N-03 P2 — `translate="no"` on brand names, code and product identifiers.

## CONTENT — Content handling
- CONTENT-01 P1 — Flex/grid children that truncate need `min-width: 0`; every text slot is designed for short, average and very long content.
- CONTENT-02 P2 — `…` not `...`; non-breaking spaces in `10&nbsp;MB`, `⌘&nbsp;K`; loading labels end with `…`.

## HARDEN — Before calling UI done (run this checklist on every new screen)
- HARDEN-01 P1 — Extreme input: empty, 1 character, very long words/URLs, 10× the expected text, emoji, RTL text, numbers in the millions, 1,000+ list items.
- HARDEN-02 P1 — API failures render a designed state: 400 (validation), 401 (sign-in again), 403 (no access), 404 (gone), 409 (conflict), 429 (rate limit with retry time), 500 (retry + support path).
- HARDEN-03 P1 — Slow network (3G throttling), offline, timeouts: skeletons appear, actions queue or fail clearly, nothing double-submits.
- HARDEN-04 P1 — Concurrent operations: two tabs, double click, back button mid-flow.
- HARDEN-05 P2 — Translation expansion of 30–40% (German, Ukrainian) without overflow; logical CSS properties (`margin-inline-start`) so RTL works.
- HARDEN-06 P1 — 200% browser zoom and 320px width still usable (WCAG 1.4.10 reflow).

## COPY — Microcopy
- COPY-01 P1 — Sentence case, plain verbs, no filler or hype ("Seamless", "Revolutionary", "Unlock").
- COPY-02 P1 — Write from the user's side of the screen: what they control, not how it's built.
- COPY-03 P0 — Errors never blame the user and never apologise vaguely; they direct.
- COPY-04 P1 — Ukrainian UI: natural phrasing, «лапки», correct apostrophe (’), plural forms handled (1 файл / 2 файли / 5 файлів) with `Intl.PluralRules('uk')`.
- COPY-05 P1 — Plan for ~30% longer strings in translation; no fixed-width buttons around text.

## PERF — Perceived performance
- PERF-01 P0 — LCP element (hero image/headline) not lazy-loaded; images have width/height or aspect-ratio (no CLS).
- PERF-02 P1 — Images: modern formats (AVIF/WebP), `srcset`/`sizes`, lazy below the fold.
- PERF-03 P1 — Fonts: ≤ 2 preloads, woff2, metric-matched fallback (typography.md).
- PERF-04 P1 — Interaction to Next Paint < 200ms: no long tasks on click; debounce search input.
- PERF-05 P2 — Prefetch the likely next route on hover/viewport.
- PERF-06 P1 — Virtualise lists over ~50 complex items; never read layout (`getBoundingClientRect`, `offsetHeight`, `scrollTop`) during render — batch reads before writes.
- PERF-07 P2 — `<video autoplay muted loop playsinline>` instead of GIFs; autoplaying motion longer than 5 s needs pause/stop.
- PERF-08 P1 — No hydration mismatches: controlled inputs have `onChange`; dates/times render the same on server and client.
- Budgets and Core Web Vitals thresholds: `absolute-verifier` → Performance.

## A11Y — Accessibility essentials (full detail: accessibility.md)
- A11Y-01 P0 — Text contrast ≥ 4.5:1 (large ≥ 3:1); UI components and focus indicators ≥ 3:1.
- A11Y-02 P0 — Full keyboard operation; visible focus; focus never hidden under sticky headers (WCAG 2.4.11).
- A11Y-03 P0 — Dialogs trap focus, close on Esc, return focus to the trigger.
- A11Y-04 P0 — Images have meaningful `alt` (or `alt=""` if decorative); icon-only buttons have `aria-label`.
- A11Y-05 P0 — Respect `prefers-reduced-motion`; nothing flashes > 3 times/second.
- A11Y-06 P1 — Landmarks (`header`, `nav`, `main`, `footer`), one `h1`, ordered headings, skip link.
- A11Y-07 P1 — `lang` attribute set (`uk`, `en`); language changes marked inline.
