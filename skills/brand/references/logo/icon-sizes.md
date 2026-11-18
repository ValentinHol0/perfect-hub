# Favicon and app-icon sizes (verified)

Checked 2026-11-12. Re-check the source before a store submission — platform rules change.

| File | Size | Rule / use | Source |
|---|---|---|---|
| `favicon.ico` | 32×32 (optionally + 16, 48) | served at the site root; `<link rel="icon" href="/favicon.ico" sizes="32x32">` — the `sizes` attribute stops Chrome preferring the ICO over the SVG | Evil Martians, "How to Favicon in 2026" (dated 2026-01-21): https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs |
| `icon.svg` | vector | modern browsers; may contain a `prefers-color-scheme: dark` style | same |
| `apple-touch-icon.png` | 180×180 | iOS home screen; opaque background recommended | same ("Since iOS 8+, iPads have required an image with a 180×180 resolution") |
| `icon-192.png`, `icon-512.png` | 192×192, 512×512 | web manifest; Chromium requires at least these two for install | web.dev "Add a web app manifest": https://web.dev/articles/add-manifest |
| `icon-mask.png` | 512×512, `"purpose": "maskable"` | important content inside a central circle with radius 40 % of the width (the outer 10 % may be cropped) — for 512 px that is a 409 px circle | web.dev "Adaptive icon support with maskable icons": https://web.dev/articles/maskable-icon ; Evil Martians (409×409 safe circle) |
| Google Play listing icon | 512×512, 32-bit PNG with alpha, max 1024 KB | uploaded in Play Console; must meet Google Play icon design specifications | https://support.google.com/googleplay/android-developer/answer/9866151 |
| Google Play feature graphic | 1024×500, JPEG or 24-bit PNG (no alpha) | store listing banner | same |
| App Store / Xcode icon master | 1024×1024 | Xcode 14+ "Single Size" generates the rest from one 1024 file; developers report validation errors when the large icon has transparency/alpha | Apple Asset Catalog reference (archived): https://developer.apple.com/library/archive/documentation/Xcode/Reference/xcode_ref-Asset_Catalog_Format/AppIconType.html ; developer forums. `[Unverified]` against the current Human Interface Guidelines (page renders client-side) — check developer.apple.com/design/human-interface-guidelines/app-icons before submission |

## Head snippet (written by `export-icons.mjs`)
```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
```

## Social avatars (circle crop)
Platforms crop profile pictures to a circle: keep the symbol inside the central circle and test at 40 px. Exact upload sizes differ by platform and change often — `[Unverified]`, check the platform's help centre; a 1080×1080 square master covers current uploads.

## Practical rules
- Favicons use the small-size mark; 16 px is drawn, not just scaled (check pixels at 100 %).
- Store icons are full-bleed squares — the platform applies the mask; do not pre-round corners for iOS.
- Maskable: test the output at maskable.app (circle, squircle, rounded square) before shipping.
