# Motion & Micro-interactions

One authored moment lands harder than scattered effects. Motion explains (where did this come from, what changed, what can I do), confirms (it worked), or delights once. Anything else is noise.

## 1. Tokens
```css
:root {
  --dur-instant: 100ms;  /* press, toggle */
  --dur-fast: 160ms;     /* hover, small state change */
  --dur-base: 240ms;     /* popover, accordion, tab */
  --dur-slow: 400ms;     /* sheet, modal, page section reveal */
  --dur-cinematic: 800ms;/* hero sequence, scroll story — once */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* expo-out: entrances */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* moves between two states */
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);       /* exits (shorter than entrances) */
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
```
Springs (Motion / Framer Motion): UI press `{ type:"spring", stiffness:500, damping:30 }` · sheets/modals `{ stiffness:300, damping:30 }` · playful `{ stiffness:260, damping:14 }`.

## 2. Rules
- Animate `transform`, `opacity`, `clip-path`, `filter`, `mask` — never `width/height/top/left/margin` (layout thrash).
- Start from an already-visible default: content must be readable if JS or animation fails. No `opacity:0` waiting for an IntersectionObserver that never fires.
- Exits are 60–75% of entrance duration.
- Tooltips appear after 800–1000 ms hover delay, instantly on keyboard focus. Focus rings never animate.
- Spinners only after 150–300 ms of waiting (faster responses would just flash).
- Stagger lists by 30–60ms, cap the whole sequence at ~600ms.
- Same entrance on every section = AI tell. Pick one reveal style for the page and use it where it helps.
- Never animate an image itself on hover; give the container the feedback.
- Hover effects need a non-hover equivalent on touch.
- Infinite animations only for live status; pause off-screen.

## 3. Modern native tools (prefer before adding a library)
- **View Transitions API** — `document.startViewTransition()` / `@view-transition { navigation: auto; }` for page and state morphs.
- **Scroll-driven animations** — `animation-timeline: view()` / `scroll()` for reveals and progress, zero JS.
- **`@starting-style`** — entry animations for elements appearing from `display:none` (dialogs, popovers).
- **`interpolate-size: allow-keywords`** — animate to `height:auto` (accordions).
- **Popover API + `<dialog>`** — built-in top layer, focus handling, Esc to close.
Libraries only when already installed or clearly needed: Motion (React springs, layout animations), GSAP (complex timelines/scroll stories), Lottie (designer-made vector animation).

## 4. Micro-interaction catalogue
Calibrate on designspells.com (tags: Interaction, Animation, Transition, Button, Confetti, Easter Egg, Skeuomorphic, Dynamic Island, 404, Occasion). Pick 1–3 per product, each tied to a real moment:

| Moment | Spell | Notes |
|---|---|---|
| Button press | Scale 0.97 + shadow collapse (100ms) | Tactile; brutalist variant shifts 4px into its offset shadow |
| Async action | Button morphs into spinner → check → label "Saved" | Keeps layout stable; label names the result |
| Copy to clipboard | Icon swaps to check for 1.5s + "Copied" tooltip | Announce via `aria-live="polite"` |
| Success milestone | Confetti burst from the clicked element | Only for real milestones (first publish, payment) — never on every save |
| Toggle | Thumb slides with spring, track colour cross-fades | Skeuomorphic texture only if the direction allows |
| Number change | Digits roll/cross-fade, tabular-nums | Counters, prices, dashboards |
| Search focus | Field expands, recent queries appear (morph) | ⌘K palette pattern |
| List add/remove | Height animates to auto, item fades/slides | `interpolate-size` or Motion layout |
| Drag | Lift (shadow + scale 1.02), siblings make room | Reduced-motion: no lift, just reorder |
| Empty → filled | Illustration steps aside as first item enters | Reward the first action |
| Hover preview | Cursor-follow image preview on index lists | Desktop only |
| Seasonal/occasion | Small dated variation (holiday logo, birthday) | Opt-out friendly |
| 404 | A playable or witty moment + a real way back | Never a dead end |
| Easter egg | Hidden reward for curiosity (Konami, long-press) | Zero cost to normal users |

## 5. Motion QA
- [ ] Every animation answers "what does this explain or confirm?"
- [ ] Reduced-motion users get the end state instantly.
- [ ] No layout shift caused by animation; 60fps on a mid-range phone.
- [ ] Content readable with animations disabled / JS failed.
- [ ] ≤ 1 cinematic moment per page.
