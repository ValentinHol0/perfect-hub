# Framework Fix Recipes

Fix recipes for defects found by `absolute-ui-ux (visual review)`. Section 1 holds the CSS behind every fix; the stack sections show how to express it idiomatically. WCAG references are 2.2.

Rules for every stack:
- **Fix the cause.** Find the element that is too wide (snippet in section 7) and fix its sizing. Never mask overflow with `overflow-x: hidden` on `html`/`body`: it hides the bug and breaks `position: sticky`. If a component must clip on purpose, use `overflow-x: clip` (no scroll container, sticky keeps working).
- **Tokens, not magic numbers.** Change the token or the layout rule, not one element.
- **Verify.** Contrast: `node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs" <fg> <bg>`. After each fix re-capture the same viewports (320 for reflow, 375, 768, 1280; light and dark), do a keyboard pass and re-run `node "${CLAUDE_PLUGIN_ROOT}/scripts/design-lint.mjs" <changed dirs>`.

---

## 1. Common fixes (plain CSS)

### Horizontal overflow
```css
/* Flex/grid items default to min-width: auto and refuse to shrink below their content */
.row { display: flex; flex-wrap: wrap; gap: var(--space-4); }
.row > * { flex: 1 1 16rem; min-width: 0; }

/* Responsive grid without breakpoints; min() keeps a single column inside 320px */
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr)); gap: var(--space-6); }

/* Media never wider than its container */
img, video { max-width: 100%; height: auto; }
iframe { max-width: 100%; }
.video-embed { width: 100%; height: auto; aspect-ratio: 16 / 9; }  /* on the <iframe> itself */

/* Wide tables and code scroll inside their own box, not the page */
.table-wrap, pre { overflow-x: auto; }

/* Full width is 100%, not 100vw (100vw includes the scrollbar and overflows) */
.banner { width: 100%; }

/* Full height: dvh follows mobile toolbars; 100vh hides content behind them. Use svh to avoid resize jumps. */
.hero { min-height: 100dvh; }
```

### Wrapping and truncation
```css
.prose { overflow-wrap: break-word; hyphens: auto; }  /* hyphens needs the correct lang on <html> */
.cell  { overflow-wrap: anywhere; }                   /* long URLs/ids; also lets the item shrink */
h1, h2 { text-wrap: balance; }

.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.clamp-3  { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }
```
Truncated text must stay reachable (expand control, detail view, or a tooltip that also opens on focus).

### Clipped glyphs (Cyrillic descenders and diacritics)
Symptom: the tails of у р д щ ц ф or the marks on Й Ї ґ are cut off. Causes: `line-height: 1` (`leading-none`) combined with `overflow: hidden` (truncate, clamp), fixed `height` on buttons/badges, or a web font without Cyrillic glyphs, so a fallback font with different metrics renders those letters.
```css
h1, h2, h3 { line-height: 1.15; }                  /* not 1 */
.truncate, .clamp-3 { line-height: 1.3; }          /* the clipped line box must contain descenders */
.btn   { min-height: 2.75rem; padding-block: 0.5em; }  /* min-height, not height: grows with the text */
.badge { padding-block: 0.2em; line-height: 1.3; }
```
Load a font subset that covers every script on the page (`unicode-range` / `subsets: ['latin', 'cyrillic']`). Test with real strings such as "Їжак щодня ґудзик Й".

### Focus states
```css
:where(a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])):focus-visible {
  outline: 2px solid var(--focus);  /* 3:1 against adjacent colours (1.4.11), visible (2.4.7) */
  outline-offset: 2px;
}
/* Custom ring: keep a transparent outline so forced-colors mode (Windows High Contrast) still draws one */
.btn:focus-visible { outline: 2px solid transparent; box-shadow: 0 0 0 3px var(--focus); }
/* Sticky header must not cover the focused element (2.4.11) */
html { scroll-padding-top: var(--header-height, 4rem); }
```
Never `outline: none` without an equally visible replacement. Define `--focus` per theme.

### z-index scale and stacking
```css
:root { --z-dropdown: 100; --z-sticky: 200; --z-overlay: 300; --z-modal: 400; --z-toast: 500; --z-tooltip: 600; }
.site-header { position: sticky; top: 0; z-index: var(--z-sticky); }
.card { isolation: isolate; }  /* a new stacking context keeps children's z-index local */
```
Prefer native `<dialog>` (`showModal()`) and the `popover` attribute: both render in the top layer above every z-index. Never escalate to `9999`.

### Contrast (WCAG 2.2 AA)
Text 4.5:1. Large text (>= 24px, or >= 18.67px bold) 3:1. UI component boundaries, meaningful icons and focus indicators 3:1 (1.4.11).
```css
:root { --text-muted: #595959; }  /* was #999999: 2.85:1 on #fff (fail). #595959 = 7.00:1; #767676 = 4.54:1 is the lightest grey that passes */
```
Check every theme: `node "${CLAUDE_PLUGIN_ROOT}/scripts/contrast.mjs" --css src/styles/tokens.css --scope=dark`.

---

## 2. Tailwind CSS v4
v4 is CSS-first: tokens live in CSS under `@theme`; `tailwind.config.js` is legacy (load it only via `@config` while migrating).
```css
/* app.css */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));  /* only for class-based dark mode */

@theme {
  --color-ink-muted: oklch(44.6% 0.03 256.8);  /* 7.56:1 on white; generates text-ink-muted, bg-ink-muted... */
}
:root { --z-sticky: 200; }  /* no z-index namespace in @theme: plain custom property, used as z-(--z-sticky) */
```
```html
<!-- Overflow: let flex children shrink instead of clipping the parent -->
<div class="flex flex-wrap gap-4"><div class="min-w-0 flex-1">…</div></div>
<div class="grid grid-cols-[repeat(auto-fit,minmax(min(16rem,100%),1fr))] gap-6">…</div>

<!-- Text -->
<p class="truncate leading-snug">…</p>  <p class="line-clamp-3">…</p>  <p class="wrap-break-word">…</p>  <!-- wrap-*: v4.1+ -->

<!-- Height and stacking -->
<section class="min-h-dvh">…</section>  <header class="sticky top-0 z-(--z-sticky)">…</header>

<!-- Focus: outline utilities survive forced-colors mode -->
<button class="rounded-md bg-blue-700 px-4 py-2 text-white hover:bg-blue-800
               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Save</button>

<!-- Contrast: text-gray-400 is 2.6:1 on white (fails); text-gray-600 is 7.56:1 -->
<p class="text-gray-600">…</p>
```
- `leading-none` on text that may be Cyrillic clips glyphs; use `leading-tight` or more.
- v4 `outline-none` sets `outline-style: none` (v3's invisible outline is now `outline-hidden`); never use either without a `focus-visible:` replacement.
- Preflight already sets `img, video { max-width: 100%; height: auto }`; image overflow in Tailwind usually comes from fixed `w-[...]` values or a missing `min-w-0`.
- v3 -> v4 visual regressions: default border colour is now `currentColor`; `ring` is 1px `currentColor` (v3 `ring` = v4 `ring-3`); the scale shifted (`shadow-sm` -> `shadow-xs`, `rounded-sm` -> `rounded-xs`).
- Component-level responsiveness: `@container` on the parent, `@md:grid-cols-2` on the child.

---

## 3. React + CSS Modules
CSS Modules scope class names only; keep tokens as custom properties in a global stylesheet.
```css
/* Card.module.css */
.card { display: flex; flex-wrap: wrap; gap: var(--space-4); }
.compact { gap: var(--space-2); }
.body { flex: 1 1 16rem; min-width: 0; }
.title { line-height: 1.2; overflow-wrap: anywhere; }
.body :global(.rich-text a) { text-underline-offset: 0.15em; }  /* markup you don't own; keep rare */
```
```tsx
import styles from './Card.module.css';

export function Card({ title, compact = false }: { title: string; compact?: boolean }) {
  const className = compact ? `${styles.card} ${styles.compact}` : styles.card;
  return (
    <article className={className}>
      <div className={styles.body}><h3 className={styles.title}>{title}</h3></div>
    </article>
  );
}
```
A misspelled `styles.x` is `undefined` and silently applies nothing: confirm the generated class in DevTools. Use `clsx` only if it is already a dependency.

---

## 4. styled-components / Emotion
styled-components is in maintenance mode (since 2025): fix existing code in place, prefer CSS Modules or Tailwind for new code. In the Next.js App Router both libraries run only in Client Components (`'use client'`), and styled-components needs the documented style registry for SSR.
```tsx
import styled from 'styled-components';

// styled-components v6 forwards unknown props to the DOM: use transient ($) props
const Grid = styled.div<{ $min?: string }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(${({ $min = '16rem' }) => $min}, 100%), 1fr));
  gap: ${({ theme }) => theme.space.md};
`;

const Title = styled.h2`
  line-height: 1.2;
  overflow-wrap: anywhere;
  color: ${({ theme }) => theme.colors.text};
  @media (width >= 48rem) { font-size: 2rem; }  /* mobile-first, range syntax */
`;
```
Emotion (`@emotion/styled`) has the same API; it filters invalid DOM props for HTML tags itself, and custom components need `shouldForwardProp`. Keep colours in the theme object and check each theme's pairs with `contrast.mjs`.

---

## 5. Vue (scoped styles)
```vue
<template>
  <div class="card">
    <h3 class="title">{{ title }}</h3>
    <slot />
  </div>
</template>

<style scoped>
.card { display: flex; flex-wrap: wrap; gap: var(--space-4); }
.title { flex: 1 1 16rem; min-width: 0; line-height: 1.2; overflow-wrap: anywhere; }
.card :deep(.field-input) { width: 100%; }  /* inner element of a child component */
:slotted(p) { margin-block: 0; }            /* content passed in through <slot> */
</style>
```
Scoped styles reach a child component's root element but not its inner elements (use `:deep()`), and do not reach slot content (use `:slotted()`). `::v-deep`, `/deep/` and `>>>` are deprecated Vue 2 syntax. Theme values belong in global custom properties, not per-component hex codes.

---

## 6. Next.js (App Router)
```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Without the 'cyrillic' subset, Ukrainian text falls back to another font (metrics jump, glyphs clip)
const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = { title: 'App' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // lang = the content's real language (drives hyphens: auto and the screen-reader voice)
  return (
    <html lang="uk" className={inter.className}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
        <header className="sticky top-0 z-(--z-sticky)">…</header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4">{children}</main>
        <footer>…</footer>
      </body>
    </html>
  );
}
```
```css
/* app/globals.css */
@import "tailwindcss";
:root { --z-sticky: 200; }
html { scroll-padding-top: 4rem; }  /* sticky header height (2.4.11) */
/* Do NOT add `html, body { max-width: 100vw; overflow-x: hidden }`: it masks the overflow and breaks sticky */
```
- `next/image`: always pass `width`/`height`, or `fill` with `sizes` inside a positioned parent that has a size; otherwise layout shifts or the image collapses.
- Hydration mismatches (`typeof window`, `Date.now()` during render) cause layout flashes. Client Components are server-rendered too: read browser-only values in `useEffect`, after hydration.

---

## 7. Debugging snippets (DevTools console; remove before commit)
```js
// Elements sticking out of the viewport (visually-hidden skip links will also show; ignore them)
const vw = document.documentElement.clientWidth;
for (const el of document.querySelectorAll('body *')) {
  const r = el.getBoundingClientRect();
  if (r.right > vw + 1 || r.left < -1) console.log(Math.round(r.right - vw), el);
}
```
```css
/* Outline every box to spot the wide one */
* { outline: 1px solid red !important; }
```
DevTools Rendering panel emulates `prefers-color-scheme`, `prefers-reduced-motion`, `forced-colors` and vision deficiencies.
