# App Layout Shells

Marketing page structures live in `absolute-designer/references/layout-patterns.md`. This file covers application shells.

## 1. Sidebar + header app shell
```html
<div class="flex h-dvh overflow-hidden bg-bg text-ink">
  <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to content</a>

  <aside class="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex" aria-label="Primary">
    <div class="flex h-16 items-center px-5 font-semibold">Product</div>
    <nav class="flex-1 space-y-0.5 px-3 py-2 text-sm">
      <a href="/overview" aria-current="page" class="flex min-h-10 items-center gap-3 rounded-md bg-bg px-3 font-medium">
        <svg aria-hidden="true" class="size-4"><!-- icon --></svg> Overview
      </a>
      <a href="/invoices" class="flex min-h-10 items-center gap-3 rounded-md px-3 text-muted hover:bg-bg hover:text-ink">
        <svg aria-hidden="true" class="size-4"></svg> Invoices
      </a>
    </nav>
  </aside>

  <div class="flex min-w-0 flex-1 flex-col">
    <header class="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-6">
      <h1 class="text-lg font-semibold">Overview</h1>
      <button type="button" class="…">Search <kbd>⌘K</kbd></button>
    </header>
    <main id="main" class="flex-1 overflow-y-auto p-6">
      <!-- primary metric row, main chart/table, secondary panels -->
    </main>
  </div>
</div>
```
Mobile: sidebar becomes a bottom tab bar (3–5 destinations) or a drawer for secondary items. Use `h-dvh`, not `h-screen`.

## 2. Settings page
- Left: section nav (sticky) · Right: grouped forms, each group with a title, one-line description, and its own Save (or autosave with "Saved" status).
- Danger zone last, visually separated, destructive actions confirmed.

## 3. Form grid
```html
<form class="grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-6">
  <div class="md:col-span-6"><!-- full-width field --></div>
  <div class="md:col-span-3"><!-- half --></div>
  <div class="md:col-span-3"><!-- half --></div>
  <div class="md:col-span-2"><!-- third: e.g. postal code --></div>
  <div class="flex justify-end gap-2 md:col-span-6"><!-- Cancel / Save --></div>
</form>
```
Field width hints at expected input length (postal code narrow, address wide).

## 4. List–detail (master/detail)
Desktop: list 320–400px + detail pane; selection reflected in URL. Mobile: list → push to detail with back button.

## 5. Command palette (⌘K)
Dialog centered at ~20% from top, input autofocused, results grouped (Navigation / Actions / Recent), ↑/↓/Enter/Esc, fuzzy match, shows shortcut hints.
