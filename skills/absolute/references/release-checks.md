# Release checks — website launch, app stores, desktop (used by P12 SHIP)

Run the part that matches the product. Store and platform rules change every year: where a requirement is dated or numeric, read the current official page at release time (links in each section) and quote it in the release report; never ship on a remembered number.

## A. Website / web app launch
**Automated:** `node "<PLUGIN_ROOT>/scripts/site-check.mjs" <build dir> --prod` (0 errors) · `shots.mjs` at 375/768/1280 (+ `--focus`, `--nojs` for content sites) · verifier performance budget · `code-scan.mjs . --risks --fail-on high` (no new high markers).
**Technical SEO and sharing**
- Every indexable page: unique `<title>` and meta description, absolute `canonical`, one `h1`, `lang` on `<html>`, Open Graph + `twitter:card` with an absolute `og:image` (absolute-assets §4).
- `robots.txt` allows production crawling (staging/previews: `noindex` header or basic auth, never shipped to production); `sitemap.xml` with absolute production URLs, referenced from robots.txt; submit in Google Search Console / Bing Webmaster Tools after launch (user's accounts — give the steps).
- Redirects: old URLs → new with 301 (308 for non-GET), no chains, `http → https`, one host (`www` or apex); trailing-slash policy consistent with canonicals.
- 404 page returns status 404 (not 200), links home and to search/catalogue; soft-404s fixed.
- Structured data (JSON-LD) for the page types that have it: `Organization`/`LocalBusiness` (name, address, phone, opening hours), `Product` + `Offer` (price, currency, availability), `BreadcrumbList`, `Article`, `FAQPage` only for real FAQ content. Validate with Google's Rich Results Test (manual step) — no markup for content that isn't visible.
- Multilingual: `hreflang` pairs incl. self-reference and `x-default`; one language per URL; translated slugs/metadata (perfect-translate component for the content).
- Rendering: content and links present in server HTML (or prerendered) for public pages; no JS-only navigation for primary links.
**Platform hygiene**
- Security headers on HTML: `Content-Security-Policy` (at least `frame-ancestors`, `object-src 'none'`, `base-uri`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` for unused features. Cookies `Secure; HttpOnly; SameSite`.
- Caching: hashed static assets `Cache-Control: public, max-age=31536000, immutable`; HTML short or revalidated; no `no-store` on HTML unless required (it disables back/forward cache).
- Error monitoring and uptime check configured; analytics and consent banner per the tracking plan (perfect-marketing for the plan; implementation here). In the EU/UA context, non-essential cookies wait for consent.
- Forms: server-side validation, spam protection (honeypot/rate limit/turnstile), success and failure states, delivery of submissions tested end to end.
- Legal pages linked in the footer (privacy, cookies, offer/terms, returns for shops) — texts from a lawyer; contact details visible.
- Favicon/manifest/OG present (absolute-assets); `/favicon.ico` and `og:image` URLs return 200.
**After deploy (smoke, 5–10 min):** home, one page per template, the changed flows, a form submission, a test-mode payment if commerce; error logs and monitoring quiet; Search Console property verified (user).

## B. iOS App Store
Official: developer.apple.com/app-store/review/guidelines · developer.apple.com/news/upcoming-requirements · App Store Connect Help.
- Build with the minimum Xcode/SDK App Store Connect currently requires (check "upcoming requirements"); bump `CFBundleShortVersionString` (marketing) and `CFBundleVersion` (build, must increase).
- App icon 1024 px, opaque, no alpha (absolute-assets §3); launch screen present.
- Every permission has a usage-description string that says *why* (`NSCameraUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSPhotoLibraryUsageDescription`, …) — missing ones crash or get rejected.
- Privacy: privacy manifest (`PrivacyInfo.xcprivacy`) for the app and SDKs that need one (required-reason APIs, tracking domains) `[verify current list]`; App Privacy answers in App Store Connect match what the app and its SDKs collect; App Tracking Transparency prompt only if tracking.
- Account deletion in-app if the app supports account creation; Sign in with Apple when other third-party sign-ins are offered `[verify current rule]`; digital goods through In-App Purchase where the guidelines require it.
- Export compliance (`ITSAppUsesNonExemptEncryption`) declared.
- Review notes: demo account credentials (a test account created for review), steps to reach gated features; screenshots for the device sizes App Store Connect currently asks for, showing the real app.
- Expo: `eas build --platform ios --profile production` → `eas submit` (outward — ask). Native: archive in Xcode / `xcodebuild archive` + upload via Transporter or `xcrun altool`/`notarytool` per current docs.

## C. Google Play
Official: developer.android.com/google/play/requirements/target-sdk · support.google.com/googleplay/android-developer.
- `targetSdkVersion` meets Play's current target API requirement (it moves up yearly — check the page); bump `versionCode` (must increase) and `versionName`.
- Android App Bundle (`.aab`) signed with the upload key; Play App Signing enabled; the keystore and passwords backed up outside the repo.
- Adaptive icon with monochrome layer; 512 px store icon; feature graphic 1024×500 `[verify]`; screenshots per current listing requirements.
- Data safety form matches the app and SDKs; permissions minimal — sensitive ones (SMS, call log, background location, all-files access, exact alarms) need declarations or are refused.
- New personal developer accounts may need a closed test with testers before production access `[verify current rule]`.
- Pre-launch report / Android vitals: no crashes or ANRs on the test devices; R8/ProGuard mapping file uploaded for readable crash traces.
- Expo: `eas build --platform android --profile production` → `eas submit` (outward — ask). Native: `./gradlew bundleRelease`.

## D. Desktop apps
- **macOS:** sign with a Developer ID certificate and **notarize** (`xcrun notarytool submit … --wait`, then `xcrun stapler staple`); hardened runtime; entitlements minimal. Unnotarized apps are blocked by Gatekeeper on users' machines.
- **Windows:** Authenticode-sign installer and executables (OV/EV certificate or a cloud signing service); expect SmartScreen reputation warnings for new certificates; installer (MSI/NSIS/MSIX) with uninstall entry.
- **Linux:** AppImage/deb/rpm/Flatpak per audience; desktop file and icons.
- **Electron:** `contextIsolation`, `sandbox`, no `nodeIntegration` in renderers; auto-update feed over HTTPS with signed artifacts; crash reporting; version in `package.json` drives the update channel. **Tauri:** updater with its signing key pair; capabilities/permissions scoped to what the app uses.
- Smoke: install from the built artifact on a clean machine/VM, first launch, update from the previous version, uninstall.

## E. Release report additions
`Platform checks: web A ✓ (site-check 0 errors) · iOS B: <items> · Play C: <items> · desktop D: <items>` — each external requirement quoted with the URL and the date it was read; anything not checkable here (store console forms, certificates, accounts) listed as a user step.
