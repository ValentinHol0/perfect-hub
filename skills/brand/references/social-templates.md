# Brand Social Templates

A template is a reusable layout with fixed brand decisions (tokens, grid, logo position, type scale) and named slots for what changes (headline, body, image, number). References and assets:
- `${CLAUDE_PLUGIN_ROOT}/skills/brand/references/social-templates/formats.md` — sizes per platform, safe zones, text limits, with verification status and dates.
- `${CLAUDE_PLUGIN_ROOT}/skills/brand/references/social-templates/assets/starter-kit.html` — working starter: tokens, tip post, story with safe box, three-slide carousel with a band crossing slide edges, safe-zone guides.
Post copy, calendars and video scripts come from `/social`; this skill owns the visuals.

## 1. Kit contents (default set)
| Template | Size | Slots |
|---|---|---|
| Statement / tip post | 1080×1350 | label, headline (≤ 60 chars), support line, logo |
| Photo post with caption bar | 1080×1350 | photo, headline, price/offer |
| Quote / review post | 1080×1350 | quote (real, with permission), name, source |
| Carousel (cover + 3–8 inner + final CTA) | 1080×1350 each | cover hook, slide headline + body, counter, CTA |
| Story — announcement | 1080×1920 | label, headline, detail, CTA pill |
| Story — poll/question background | 1080×1920 | headline, empty area for the native sticker |
| Reels / Shorts / TikTok cover | 1080×1920 | title in the centre zone (grid crops) |
| Telegram channel post image | 1280×720 or 1080×1350 | headline, visual |
| Highlight covers | 1080×1920 artwork, symbol centred | icon, colour |
Adjust to the brand's platforms (strategy from `/social → references/strategy.md`).

## 2. Template rules
1. **Tokens first:** colours, fonts, spacing and radius as CSS variables copied from the guidelines; no raw hex inside templates.
2. **Grid:** outer margin ≈ 8 % of width (88 px at 1080); one baseline grid; logo always in the same corner and size.
3. **Type scale for 1080-wide frames:** headline 72–110 px (display face), body 36–44 px, labels 28–32 px uppercase with tracking. Below 28 px nothing (unreadable in the feed).
4. **Slots have limits:** write the maximum characters per slot into the template comments, test with the longest real Ukrainian line (Ukrainian runs longer than English) and with a one-word line.
5. **Safe zones:** stories/Reels text inside 14 % top / 35 % bottom / 6 % sides (Meta's ad guidance, a good organic default); covers keep the title in the central square because grids crop.
6. **Carousels:** slide 1 = hook (the cover sells the swipe); one idea per slide; a visual thread across slides (a band, line or shape crossing slide edges — the starter shows how with `translateX` offsets); last slide = CTA or save/share prompt; counter "2 / 5".
7. **Ukrainian typography:** `lang="uk"`, «лапки», non-breaking spaces after one-letter words and before units/currency (`в&nbsp;темряві`, `389&nbsp;грн`), no orphans in headlines.
8. **Contrast:** every text/background pair passes `contrast.mjs` (4.5:1 body, 3:1 large); text on photos sits on a scrim or a calm area.
9. **Accessibility in delivery:** each rendered post comes with alt text (what the image shows + the text on it).

## 3. Workflow
1. Copy `assets/starter-kit.html` to `deliverables/brand/<slug>/social/templates.html`; replace tokens, fonts (Google Fonts CSS2 links serve Cyrillic subsets automatically; self-hosted fonts need the `cyrillic` subset) and the inline SVG logo symbol.
2. Build each template as a `<section data-frame="<name>" data-size="<W>x<H>">`. Names: `<type>-<topic>-<nn>` (e.g. `carousel-brewing-01`).
3. Fill slots with real copy (from the user or the social component). For batches, duplicate sections — one section per output file.
4. Remove `class="guides"` from `<body>`, then render:
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/render-templates.mjs" deliverables/brand/<slug>/social/templates.html --out deliverables/brand/<slug>/social/png`
   (`--scale 2` for 2160-wide masters; `--only name1,name2` to re-render a few). Exit 3 → Playwright missing: open the file in the browser tool and take element screenshots at each `data-size`.
5. Review every PNG at phone size: overflow, orphans, contrast, logo position, safe zone, spelling. Then put 9 posts side by side as a grid preview (an extra `data-frame="grid-preview"` with scaled copies) to check rhythm.
6. Deliver PNGs + the HTML source + a short "how to edit" note (which slots, limits, where fonts come from). Teams on Canva/Figma: export the tokens and a reference PNG per template so they can rebuild there.

## 4. Quality gates
- [ ] Every frame renders at its `data-size` (the script enforces it).
- [ ] Longest real headline fits; no text outside safe zones; no orphans.
- [ ] Contrast pass for every pair used; text never on busy photo areas without a scrim.
- [ ] Cyrillic renders in the brand faces (no fallback glyphs); `₴` present or "грн" used.
- [ ] Logo, colours and type match the guidelines; one template family looks like one brand.
- [ ] Alt text written for each delivered image.

## 5. Output
```
Kit: deliverables/brand/<slug>/social/templates.html (N templates)
PNGs: deliverables/brand/<slug>/social/png/*.png (sizes)
Slots and limits: <table or note path>
Checks: sizes ✓ · safe zones ✓ · contrast ✓ · Cyrillic ✓ · alt text ✓
```
