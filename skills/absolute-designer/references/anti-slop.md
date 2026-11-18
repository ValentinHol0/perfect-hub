# Anti-Slop Pre-flight

Run this on the PLAN (before code) and again on the BUILT page (with screenshots). Gates 6–8, parts of 10 (one h1, heading order, alt text, clickable divs) and many AI tells are also checked mechanically by `node "${CLAUDE_PLUGIN_ROOT}/scripts/design-lint.mjs" <files>` — run it first, then judge the rest by eye. Gates must all pass. Quality checks are scored; ship at ≥ 85%.

The brief always wins: if the user explicitly asked for something on this list, it is allowed — note it as "requested".

**Evidence rule:** every gate PASS and every quality point cites its evidence — `file:line`, a screenshot path, or command output (`design-lint`, `contrast.mjs`, `shots.mjs`). No evidence → not awarded. The builder's score is provisional; on new surfaces and redesigns the reported score is the independent design-critic's. If the two differ by more than 10 points, report both and the critic's stands.

## A. Gates (any FAIL blocks shipping)
1. Every brief requirement is present and findable within seconds.
2. All role colour pairs pass `contrast.mjs` (exit 0).
3. No horizontal scroll at 375px; no clipped text at 375 / 768 / 1280.
4. Visible keyboard focus on every interactive element; logical tab order.
5. `prefers-reduced-motion` respected.
6. Real copy in the product's language — no lorem ipsum, no "Feature One", no "John Doe, CEO".
7. No emoji used as icons or decoration (use an icon set: Lucide, Phosphor, Tabler, or custom SVG).
8. No broken or placeholder images (grey boxes, picsum, unsplash-random) unless the user asked for placeholders.
9. Hover, active, disabled, loading, empty and error states exist for the components shown.
10. Semantic HTML: one `h1`, ordered headings, `button` for actions, `a` for navigation, labelled form fields.
11. No invented facts: metrics, testimonials, client logos, case-study counts, addresses or phone numbers that the user didn't provide. A missing fact becomes a visibly marked slot ("Venue to be announced"); a form without a real endpoint never shows a success state.
12. Content is visible with JavaScript off (`shots.mjs --nojs`), and the hero headline + one sentence + primary action fit in 1280×800.

## B. AI tells (each found = −1 quality point; fix by rewriting the element, not softening it)
Composition
- [ ] Hero = big number + small label + three stats + gradient accent (when the number is not the product).
- [ ] Page skeleton made of identical icon-heading-text cards.
- [ ] Cards nested in cards.
- [ ] Tracked uppercase eyebrow above every section.
- [ ] `01 / 02 / 03` numbering where order carries no meaning.
- [ ] Three or more zigzag (image-left/text-right) sections in a row.
- [ ] Centered everything; no alignment tension anywhere.
- [ ] Modal used for a task that doesn't need interruption.

Surface
- [ ] Purple/indigo → blue gradient, aurora blobs, or dot-grid glow behind the hero (Lila rule).
- [ ] Gradient-filled text.
- [ ] Glassmorphism as decoration rather than over moving content.
- [ ] Coloured `border-left` > 1px on cards/callouts.
- [ ] Generic soft drop shadow on every card; shadows with zero offset used as glow.
- [ ] Sparklines/progress rings standing in for real content.
- [ ] Monospace as a "tech" costume for non-data text.
- [ ] Light/dark picked by category cliché instead of use scene.
- [ ] One word of the headline accented by colour/italic/gradient as the only typographic idea.
- [ ] Middle-dot meta strings ("Fast · Secure · Simple") and `→` appended to every link or button.
- [ ] One border-radius on everything regardless of hierarchy; one uniform `rgba(0,0,0,.1)` shadow everywhere.

Type & copy
- [ ] Single default face (Inter/Roboto/system) on a marketing page with no display decision.
- [ ] Same weight for all heading levels; no visible scale steps.
- [ ] Copy that sells instead of says ("Revolutionize your workflow", "Unlock the power of", "Seamless", "Next-gen", "Elevate").
- [ ] Buttons labelled "Submit", "Learn more", "Get started" when a specific verb exists.
- [ ] Invented specifics as decoration ("Batch No. 047", "38% faster") or a strip of 3–4 stats under one-word labels — put each real number in the sentence it proves.
- [ ] Two-fragment headings ("Fast. Simple.") more than once per page; "not X but Y" / "rather than" framings more than twice; negation runs ("No forms, no waiting") more than once.
- [ ] Virtue words about ourselves (honest, thoughtful, genuinely, simply) and stock lines ("Whether you're A or B", "Join thousands of", "In today's fast-paced world").
- [ ] Section heads that are category labels ("Features", "Why us") instead of what the visitor gets.
- [ ] Template residue: `[Company Name]`, `{{token}}`, markdown asterisks in UI.
- [ ] Duplicate CTA intents with different labels ("Contact us" + "Get in touch").

Motion
- [ ] The same fade-up on every section.
- [ ] Animations that delay reading content.

## C. Quality checks (score 1 point each)
Direction
1. The Design Read names a specific audience and job.
2. One signature element exists and is memorable.
3. The direction would not be produced for a different brief (generic test passed).
4. References were consulted (or the user waived them) and are cited.
Typography
5. 2–3 families, roles distinct, real scale steps.
6. Measure ≤ 75ch, leading follows size.
7. Display tracking tuned; caps labels tracked positive.
8. Tabular numbers where numbers change/align.
Colour
9. Accent ≤ 10% of surface and always meaningful.
10. Neutrals tinted from the palette hue.
11. Status conveyed with icon/label, not colour alone.
Layout
12. Section layout families rotate (no family 3× in a row).
13. Spacing from the scale; more space above headings than below.
14. Grid alignment consistent across sections.
15. Mobile composition designed (reordered/simplified), not just stacked.
Components & UX
16. Primary action obvious on every screen; one primary per view.
17. Forms: labels above, errors below with recovery text, 16px inputs on mobile.
18. Empty states invite the first action.
19. Loading uses skeletons shaped like content (or optimistic UI).
20. Touch targets ≥ 44×44px.
Imagery & icons
21. Images real/generated for this brief, correct aspect ratios, `alt` text written.
22. One icon set, consistent stroke and size.
Motion
23. One authored moment; micro-interactions tied to real moments.
24. Motion never animates layout properties (width, height, top, left, margin); colour/opacity/transform/clip-path/filter are fine.
Performance
25. LCP image sized and prioritised; fonts ≤ 2 preloads; no layout shift from late content.
Polish ("remove one accessory")
26. One decorative element removed after review because it didn't serve the brief.

**Copy tests:** swap test (would this headline work on a competitor's page? then rewrite) · can the reader picture it · could it be proven false · could only this business say it.

**Score** = (quality points − AI tells) / applicable quality checks. Mark checks that cannot apply (no forms, no empty state, no imagery on this surface) as N/A and remove them from the denominator — never count them as failures or passes. Report it as `Pre-flight: gates 12/12 · quality 24/26 · tells 1 → 88%` (or `quality 21/23 (3 N/A)`). Ship at ≥ 85% without rounding up.
