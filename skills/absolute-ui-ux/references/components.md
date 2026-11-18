# Component Patterns

Neutral reference implementations (HTML + Tailwind, token-based classes). Restyle to the project's DESIGN.md — the structure and states are the point, not the look. Assumes Tailwind v4 `@theme` roles: `bg`, `surface`, `ink`, `muted`, `accent`, `accent-ink`, `border`, `focus`, `positive`, `negative`, `warning`.

## 1. Button (all states)
```html
<button type="button"
  class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-ink
         transition-[transform,background-color] duration-150 hover:bg-accent/90 active:scale-[0.98]
         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus
         disabled:cursor-not-allowed disabled:opacity-50
         aria-busy:cursor-progress">
  <svg aria-hidden="true" class="size-4"><!-- icon --></svg>
  Create invoice
</button>
```
Loading: set `aria-busy="true"`, swap the icon for a spinner, keep the width (no layout jump), label becomes "Creating…".

## 2. Text field with validation
```html
<div class="flex flex-col gap-1.5">
  <label for="company" class="text-sm font-medium text-ink">Company name</label>
  <input id="company" name="company" autocomplete="organization" aria-invalid="true" aria-describedby="company-error"
    class="min-h-11 rounded-md border border-border bg-surface px-3 text-base text-ink placeholder:text-muted
           focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus
           aria-invalid:border-negative" />
  <p id="company-error" class="text-sm text-negative">Enter the company name as it appears on invoices.</p>
</div>
```
Rules: label above, helper/error below, error replaces helper, 16px text on mobile, never clear input on error.

## 3. Data table (sortable, status badges, row actions)
```html
<div class="overflow-x-auto rounded-lg border border-border bg-surface">
  <table class="w-full text-sm">
    <thead class="sticky top-0 bg-surface text-left text-muted">
      <tr class="border-b border-border">
        <th scope="col" aria-sort="descending" class="px-4 py-3 font-medium">
          <button type="button" class="inline-flex items-center gap-1">Date <svg aria-hidden="true" class="size-3"><!-- arrow-down --></svg></button>
        </th>
        <th scope="col" class="px-4 py-3 font-medium">Customer</th>
        <th scope="col" class="px-4 py-3 text-right font-medium">Amount</th>
        <th scope="col" class="px-4 py-3 font-medium">Status</th>
        <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
      </tr>
    </thead>
    <tbody class="divide-y divide-border text-ink">
      <tr class="hover:bg-bg">
        <td class="px-4 py-3 tabular-nums">2026-11-03</td>
        <td class="px-4 py-3">Northwind Studio</td>
        <td class="px-4 py-3 text-right tabular-nums">$12,480.00</td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
            <svg aria-hidden="true" class="size-3"><!-- clock --></svg> Overdue
          </span>
        </td>
        <td class="px-4 py-3 text-right">
          <button type="button" aria-label="More actions for invoice 1042" class="min-h-8 min-w-8 rounded hover:bg-bg">…</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```
Empty result → replace `tbody` with an empty state row spanning all columns (what was searched + "Clear filters").

## 4. Empty state
```html
<section class="mx-auto flex max-w-sm flex-col items-center gap-3 py-16 text-center">
  <svg aria-hidden="true" class="size-12 text-muted"><!-- illustration or icon --></svg>
  <h2 class="text-base font-semibold text-ink">No invoices yet</h2>
  <p class="text-sm text-muted">Create your first invoice or import them from a CSV export.</p>
  <div class="flex gap-2">
    <button type="button" class="…primary">Create invoice</button>
    <button type="button" class="…secondary">Import CSV</button>
  </div>
</section>
```

## 5. Skeleton (shaped like the content it replaces)
```html
<div class="animate-pulse space-y-3 rounded-lg border border-border p-6" aria-hidden="true">
  <div class="h-6 w-1/3 rounded bg-border"></div>
  <div class="h-4 w-full rounded bg-border"></div>
  <div class="h-4 w-5/6 rounded bg-border"></div>
</div>
<span class="sr-only" role="status">Loading invoices…</span>
```
`motion-reduce:animate-none` on the pulse.

## 6. Toast
```html
<div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3" role="status" aria-live="polite">
  <div class="flex items-start gap-3 rounded-lg bg-ink px-4 py-3 text-bg shadow-lg">
    <svg aria-hidden="true" class="mt-0.5 size-4 text-positive"><!-- check --></svg>
    <div class="flex-1">
      <p class="text-sm font-medium">Invoice sent</p>
      <p class="text-xs opacity-80">Northwind Studio will receive it in a minute.</p>
    </div>
    <button type="button" class="text-xs underline">Undo</button>
    <button type="button" aria-label="Dismiss notification" class="opacity-70 hover:opacity-100">×</button>
  </div>
</div>
```
Auto-dismiss 4–6s, pause on hover/focus; errors that block work go inline, not in a toast.

## 7. Keyboard shortcut hint
```html
<kbd class="rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-xs text-muted">⌘K</kbd>
```

## 8. Software screenshot mock (window chrome)
When presenting UI inside marketing pages, frame it with a minimal window bar: light top bar, three 10px circles (`#FF5F57`, `#FEBC2E`, `#28C840`), 1px border, radius matching the direction. Content inside is a real screenshot or a real-looking build — never lorem.
