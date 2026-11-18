---
name: absolute-assets
description: "Produces the images and icons a website or app ships with — favicon set, PWA and app icons for iOS and Android (adaptive, monochrome, store), splash screens, Open Graph and social preview cards, hero and section imagery — as real files wired into the project and verified. Use when a site or app needs icons, a favicon, share-preview images, store icons, a splash screen or imagery for its pages. Logos and brand identities are brand work for the `/brand` component."
---

# Absolute Assets (Perfect Hub 4.0) — P6

Files, wired in, checked at real size — never descriptions of assets, never "add your icon here".
Scripts (Node ≥ 18): `${CLAUDE_PLUGIN_ROOT}/scripts/assets.mjs` (icons, render), `site-check.mjs` (head tags), `gen-image.mjs` (Gemini via `agy`), `contrast.mjs`. Rendering needs Playwright in the project or `PLAYWRIGHT_DIR`.

## 1. Inventory first (one pass)
- What exists: `favicon.ico`, `icon.svg`, `apple-touch-icon`, a manifest, `og:image`, platform icon folders (`ios/**/AppIcon.appiconset`, `android/app/src/main/res/mipmap-*`, Expo `app.json` icon fields, `build/icon.png`, `src-tauri/icons/`).
- For a site with a build: `node "${CLAUDE_PLUGIN_ROOT}/scripts/site-check.mjs" <build dir>` — `favicon`, `apple-touch-icon`, `og-missing`, `og-image-relative`, `twitter-card` warnings are this skill's to-do list.
- Brand source: the project's logo SVG, `DESIGN.md` tokens, or `/brand` deliverables. No mark at all and no brand component → build a plain monogram/wordmark SVG (§2) and say it is a placeholder for brand work.

## 2. The master
- **SVG, square viewBox, artwork centred, no text that depends on installed fonts** (convert lettering to paths or use the brand's SVG). Prefer a *mark on transparent* as the master; when the only source is a full tile (mark on its own background), also make a mark-only SVG for `--mark`.
- Must read at 16 px: one idea, thick strokes (≥ 2 px at 32 px), no hairlines, no small text, no gradients that turn to mud. Check by rendering 16/32 px before generating the full set.
- Placeholder monogram when nothing exists: 100×100 viewBox, one or two letters from the product name set in a geometric bold, optically centred (letters sit ~2–3 % above mathematical centre), brand accent or ink colour, one shape at most. Label it `placeholder` in the report.

## 3. Icons — one command, then wire them
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/assets.mjs" icons <master.svg> --out <dir> [--mark mark.svg] --name "<App>" --short "<≤12 chars>" --bg <#hex> --theme <#hex> [--only web,ios,android]
```
Output: `favicon.ico` (16/32/48) · `icon.svg` · `icon-192/512.png` · `icon-maskable-512.png` (opaque, safe-zone scaled) · `apple-touch-icon.png` (180, opaque) · `site.webmanifest` · `head.html` · `ios/AppIcon-1024.png` (opaque, no alpha) · `android/ic_launcher_foreground|monochrome.png` (432 px = 108 dp @xxxhdpi) · `android/ic_launcher.xml` · `android/colors.xml` · `android/ic_launcher_legacy.png` · `android/play-store-512.png`.
`--bg` is what platforms show behind the mark (opaque icons, maskable, Android background); pick the brand surface colour, not white by default, unless the brand is light.

**Wire by stack** (follow the project's existing convention when there is one):
| Stack | Where |
|---|---|
| Next.js App Router | `app/favicon.ico`, `app/icon.svg` (or `icon.png`), `app/apple-icon.png`, `app/manifest.ts` or `public/site.webmanifest`; OG via `app/opengraph-image.png` or `opengraph-image.tsx` (`ImageResponse` from `next/og`) per route segment |
| Vite / static / Astro / SvelteKit / Nuxt | files in `public/` (`static/` in SvelteKit), tags from `head.html` in the root layout/`index.html` |
| Expo | `app.json`/`app.config`: `icon` (1024 PNG), `android.adaptiveIcon.foregroundImage` + `backgroundColor` + `monochromeImage`, `ios.icon`; splash via the `expo-splash-screen` config plugin |
| React Native (bare) / native Android | `res/mipmap-anydpi-v26/ic_launcher.xml` + foreground/monochrome PNGs in `mipmap-xxxhdpi` (smaller densities: render at 108 dp × density or use vector drawables), legacy `ic_launcher.png` per density, colour in `values/colors.xml` |
| Native iOS / macOS | `Assets.xcassets/AppIcon.appiconset` with the single 1024 image (current Xcode generates the other sizes); no alpha, no rounded corners — the system applies the mask |
| Flutter | platform folders as above, or `flutter_launcher_icons` (new dev dependency → ask first) |
| Electron | `build/icon.png` ≥ 512 px (electron-builder derives `.ico`/`.icns`) or the packager's documented paths |
| Tauri | `npx tauri icon <AppIcon-1024.png>` generates the full set into `src-tauri/icons/` |

## 4. Open Graph / social preview cards
- One card per page *type* (home, product, article, docs) — not one image for the whole site. Many dynamic pages → render on demand (`next/og` `ImageResponse`, Satori-based endpoints, or a build step looping `assets.mjs render`).
- Canvas **1200×630**, safe margin 64 px, everything important inside the central area because some surfaces crop to square: brand mark, page title (≤ 60 characters, ≤ 2 lines, ≥ 56 px), one line of support text, real product imagery or a strong typographic composition from the project's tokens. No screenshots of the whole page, no tiny text, no stock photo with a gradient on top.
- Build an HTML file with the project's fonts and tokens → `node "${CLAUDE_PLUGIN_ROOT}/scripts/assets.mjs" render og.html --size 1200x630 --out public/og/<slug>.png --opaque`. Look at it at 600×315 (feed thumbnail size) before shipping; text contrast via `contrast.mjs`.
- Tags: `og:title`, `og:description`, `og:image` (**absolute URL**), `og:image:width`/`height`, `og:image:alt`, `og:url`, `og:type`, `twitter:card=summary_large_image`. Keep the file small (well under 1 MB; PNG for flat graphics, JPEG/WebP for photos — check the target platforms accept the format).

## 5. Imagery for pages (hero, sections, empty states)
Order: the user's real photos and product shots → generated imagery → deliberate CSS/SVG art. Never grey boxes, random stock or placeholder services.
- **Generate** (use the first that exists; never pretend a call happened): an image tool in your tool list (`generate_image`) → With the Gemini `agy` CLI available: `node "${CLAUDE_PLUGIN_ROOT}/scripts/gen-image.mjs" --out <path> --aspect 16:9 --prompt "<paragraph>"` (~60 s, uses the user's quota — only what the page needs) → an image MCP in the session → none: CSS/SVG composition.
- **Prompt** = one art-direction paragraph: subject → composition (where the copy sits, so the image leaves room) → camera/lens and distance → light (direction, quality, time) → set and materials → palette from the project's tokens → mood → constraints (no text, no logos, no watermarks, no extra fingers, realistic proportions).
- **Review every image** at display size and 2×: garbled text or fake lettering, hands, warped products, impossible reflections, off-palette colour, cultural or factual errors (a Kyiv café should not look like Brooklyn). Regenerate with a corrected prompt instead of shipping a flaw.
- **Honesty:** a generated image is never presented as a real photo of the client's product, team, premises or customers — use it for mood and context, or label it.
- **Ship it properly:** through the framework's image pipeline (`next/image`, `astro:assets`, `@nuxt/image`, `vite-imagetools`, or `sharp` if present) as AVIF/WebP with explicit `width`/`height`; the LCP image eager with `fetchpriority="high"`, everything below the fold `loading="lazy"`; no image wider than ~2× its largest displayed width; meaningful `alt` (what it shows and why it is there) or `alt=""` when decorative.

## 6. Splash screens and store art
- iOS: launch screen = background colour + centred mark (storyboard or the Expo splash plugin); no text, no fake loading UI.
- Android 12+: the system SplashScreen API shows the app icon on a solid colour — configure the background colour and icon (Expo: splash plugin); don't ship a full-screen image splash.
- Store screenshots and feature graphics are part of P12 SHIP: capture real screens (simulator/emulator or Playwright for web views), compose captions with `assets.mjs render` at the exact sizes the store currently requires — read the current App Store Connect / Play Console specifications at release time instead of trusting remembered sizes.

## 7. Gates
- Every icon viewed at real size: 16 and 32 px favicon, 180 px apple-touch, maskable through a circle mask, Android foreground on its background and the monochrome layer on a tinted circle, iOS 1024 opaque. A contact sheet HTML rendered with `assets.mjs render` is the quickest way to see them all.
- `site-check.mjs` on the build: no `favicon`, `apple-touch-icon`, `og-*`, `twitter-card`, `img-alt`, `img-dimensions`, `lcp-lazy` findings left for the pages touched.
- Verifier: the files load (no 404 for `/favicon.ico`, the manifest, `og:image`), the app builds with the new platform icons.

## 8. Output
```
Assets: <paths> (wired in: <files edited>)
Master: <svg path> · mark: <svg path | same> · placeholder: yes/no
OG cards: <page → file>
Images: <file — source: user | generated (prompt) | css/svg>
Checks: 16px ✓ · maskable ✓ · monochrome ✓ · iOS no-alpha ✓ · site-check: 0 errors
```
