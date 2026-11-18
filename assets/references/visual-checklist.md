# Visual Review Checklist

Used by `absolute-ui-ux (visual review)`. Every item is pass/fail with evidence: a screenshot or a measured DOM fact, not an impression. Fix recipes: `framework-fixes.md` in this folder. WCAG references are 2.2 level AA unless marked otherwise.

**Viewports:** 320 (reflow), 375, 768, 1280; add 1440/1920 for wide layouts. Light and dark theme. One keyboard-only pass.

---

## 1. Layout and overflow
- [ ] No horizontal page scroll at any width, including 320px (1.4.10 Reflow): `document.documentElement.scrollWidth <= clientWidth`.
- [ ] Nothing extends past the viewport edge or out of its parent; fixed at the cause, not masked with `overflow-x: hidden` on `html`/`body`.
- [ ] Wide tables, code blocks and charts scroll inside their own container.
- [ ] Images, video, iframes and embeds stay inside their containers at every width.
- [ ] Header, navigation, sidebar and footer sit where intended; the footer reaches the bottom on short pages.
- [ ] Full-height sections use `dvh`/`svh`: no content hidden behind mobile browser toolbars (`100vh`).
- [ ] No overlapping layers: buttons over inputs, dropdowns under content, toasts or chat widgets over primary actions.
- [ ] Content has a max width; lines and cards don't stretch on 1920px screens.
- [ ] No content disappears or duplicates between breakpoints; intermediate widths (e.g. 900px) don't break.

## 2. Alignment and spacing
- [ ] Spacing comes from one scale (tokens); no stray one-off values.
- [ ] Items in a grid or flex row share edges and baselines; icons are vertically centred with their labels.
- [ ] Form labels and inputs align consistently.
- [ ] Body text is left-aligned (start-aligned); centring only for short blocks.

## 3. Typography
- [ ] Body text >= 16px; line height >= 1.5 for body text, about 1.1-1.3 for headings.
- [ ] Line length about 45-75 characters.
- [ ] Clear heading scale; one `h1`; no skipped levels.
- [ ] No clipped glyphs: Cyrillic descenders (у р д щ ц ф) and diacritics (Й Ї ґ) fully visible. High-risk spots: `line-height: 1` / `leading-none`, truncation and line clamps, fixed-height buttons and badges.
- [ ] The web font covers every script on the page (e.g. a `cyrillic` subset); no letters rendered in a fallback font.
- [ ] Long words, URLs and code wrap or scroll; truncation is intentional and the full text is reachable.
- [ ] Text survives 200% zoom (1.4.4) and the text-spacing override (1.4.12: line height 1.5, letter spacing 0.12em, word spacing 0.16em, paragraph spacing 2em) without clipping or overlap.
- [ ] `lang` on `<html>` matches the content language (hyphenation, screen-reader voice).
- [ ] Headline <= 2 lines on desktop; primary CTA label and navigation do not wrap on desktop.

## 4. Colour and contrast
- [ ] Text >= 4.5:1 (1.4.3); large text (>= 24px, or >= 18.67px bold) >= 3:1.
- [ ] UI component boundaries, meaningful icons, chart marks and focus indicators >= 3:1 against adjacent colours (1.4.11).
- [ ] Information never relies on colour alone: errors also have text or an icon; links in running text are underlined or otherwise distinguishable without colour (1.4.1).
- [ ] Placeholder text is never the only label; if it carries information, it meets 4.5:1.
- [ ] Brand, link, error, success and warning colours come from tokens and are used consistently.
- [ ] Measured, not guessed: `node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs" <fg> <bg>`.

## 5. Dark mode and forced colours
- [ ] Dark theme meets the same ratios; no hard-coded light leftovers (white cards, black text on dark surfaces).
- [ ] `color-scheme` is set, so form controls and scrollbars match the theme.
- [ ] Logos, icons and images remain visible on both backgrounds.
- [ ] Forced-colors mode (Windows High Contrast): focus rings and control borders still visible (no `box-shadow`-only focus, no bare `outline: none`).

## 6. Interactive states
- [ ] Every control has default, hover (pointer devices), focus-visible, active and disabled states, plus loading where actions are async.
- [ ] Focus is visible on every interactive element (2.4.7); aim for 2.4.13 (AAA): an indicator >= 2px thick with >= 3:1 contrast between focused and unfocused states. `outline: none` only with an equally visible replacement.
- [ ] The focused element is not hidden behind a sticky header, cookie banner or chat widget (2.4.11); use `scroll-padding-top`.
- [ ] Targets >= 24x24 CSS px or spaced so 24px circles don't overlap (2.5.8); 44x44 for primary touch targets (2.5.5 AAA, platform guidance).
- [ ] Content shown on hover also appears on focus, can be dismissed with Esc and stays while hovered (1.4.13).
- [ ] Every drag action has a single-pointer alternative (2.5.7).
- [ ] Links are identifiable; visited state where navigation history matters.
- [ ] Disabled controls are distinguishable, and the reason an action is unavailable is stated.

## 7. Forms
- [ ] Every field has a visible `<label>`; placeholder is not a label.
- [ ] Field boundaries >= 3:1.
- [ ] Errors: text next to the field, linked with `aria-describedby`, not colour alone; focus moves to the first error or to an error summary.
- [ ] Required fields marked in text (or a symbol explained once).
- [ ] Error, loading and success states captured in screenshots.
- [ ] Correct `type`, `inputmode` and `autocomplete`, so mobile keyboards and autofill match the field (1.3.5).
- [ ] Paste is allowed in password and code fields; login needs no puzzle or memory test (3.3.8).

## 8. Images and media
- [ ] Meaningful images have `alt` text; decorative images have `alt=""`.
- [ ] `width`/`height` attributes or `aspect-ratio` set: no stretching, no layout shift.
- [ ] `srcset`/`sizes` give sharp images on high-DPI screens without oversized downloads.
- [ ] `loading="lazy"` only below the fold, never on the hero/LCP image.
- [ ] Video and embeds keep their aspect ratio and fit their container; videos with speech have captions.
- [ ] A failed image leaves a usable layout (alt text visible, no collapsed box).

## 9. Motion and loading
- [ ] `prefers-reduced-motion: reduce` disables non-essential animation and parallax.
- [ ] Auto-moving content lasting more than 5 seconds can be paused (2.2.2); nothing flashes more than 3 times per second (2.3.1).
- [ ] Animations use `transform`/`opacity`; scrolling stays smooth.
- [ ] No layout shift while loading (CLS <= 0.1): sized media, metric-matched font fallbacks (`size-adjust` or `next/font`), skeletons at the final size.

## 10. Keyboard and structure
- [ ] A skip link appears on the first Tab and moves focus to `main`.
- [ ] Every interactive element is reachable with Tab; focus order matches the visual order.
- [ ] Modals keep focus inside, close with Esc and return focus to the trigger (native `<dialog>` with `showModal()` makes the page behind it inert).
- [ ] Landmarks: one `main`, plus `header`, `nav` and `footer` where present.
- [ ] Icon-only buttons and links have an accessible name.

---

## Priority

| Priority | Meaning | Examples |
|----------|---------|----------|
| P0 (blocking) | Use or access is broken | Horizontal scroll, covered or overlapping controls, clipped or unreadable text, contrast failure, invisible focus, runtime error |
| P1 (high) | Serious UX defect | Layout broken at one width, missing error/loading state, layout shift, target too small, CTA wrapping |
| P2 (medium) | Inconsistency | Off-scale spacing, misalignment, token drift between components |
| P3 (low) | Polish | Minor optical alignment, subtle colour variation |

P0 and P1 block sign-off; P2 and P3 are reported as quality notes.

---

## Tools
- **This plugin:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/shots.mjs"` (screenshots, overflow, clipped text, focus visibility), `node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs"`, `node "${CLAUDE_PLUGIN_ROOT}/scripts/design-lint.mjs"`.
- **DevTools:** device toolbar; Rendering panel to emulate `prefers-color-scheme`, `prefers-reduced-motion`, `forced-colors` and vision deficiencies; Lighthouse.
- **Accessibility:** axe DevTools / axe-core, WAVE. Automated tools catch only part of the issues; the keyboard pass is still required.
- **Visual regression:** Playwright `expect(page).toHaveScreenshot()`, Chromatic or Percy.
