# Native & Mobile Apps (SwiftUI · Jetpack Compose · React Native/Expo · Flutter)

The rest of this skill assumes a browser. On native and cross-platform mobile, platform conventions win where they conflict with web habits. Priorities: **P0** defect · **P1** expected · **P2** polish. Numbers come from the official pages in §13 (fetched 2026-11); anything not confirmed there is marked **[Unverified]**.

## 1. Platform stance
- **Native per platform (default):** iOS gets tab bar + navigation stack + sheets + SF; Android gets M3 navigation bar/rail + top app bar + predictive back + Roboto. Choose it for utilities, productivity, communication, anything leaning on system features.
- **One cross-platform brand look:** fine for games, media and brand-led products. Brand the *surface* (colour, type, illustration, cards); never the *behaviour*.
- **P0 regardless of stance:** OS behaviours stay native — back gesture/button, scroll physics and overscroll, text editing/selection, keyboard, system alerts, permission dialogs, share sheet. Flutter's docs split exactly this: OS-environment behaviours that would be "wrong" if different vs. app conventions that are a design choice.
- Controls tightly bound to the OS (switch, slider, checkbox, radio, progress, alert dialog) use platform variants: Flutter `.adaptive()`, RN `Platform.select` or `Foo.ios.tsx`/`Foo.android.tsx`.
- **P1:** don't cross-pollinate idioms: no "‹ Back" text buttons on Android, no hamburger drawer as primary iOS navigation, no tab bar used for actions.

## 2. Layout: safe areas, insets, edge-to-edge, window sizes
**iOS**
- **P0:** controls and text stay inside the safe area — it excludes bars (toolbar, tab bar, status bar) and hardware features like the Dynamic Island. Backgrounds may bleed under; interactive elements may not. The home-indicator strip is part of the bottom inset **[Unverified: HIG Layout page doesn't name it]**.
- Use the system layout guides (standard margins, readable-width guide) instead of hard-coded padding. HIG gives no iPhone margin number; 16–20pt is common **[Unverified]**.
- Lay out by **size class** (compact/regular × width/height), "not device type or orientation". iPad windows resize in multitasking — every size-class combination must work.

**Android** (applies to Compose, RN and Flutter builds alike)
- **P0:** apps targeting SDK 35 on Android 15+ are forced edge-to-edge: the window draws behind status, navigation and caption bars. Earlier versions: call `enableEdgeToEdge()`.
- Three inset types: **system bars** (pad tappable UI), **display cutout** (inset critical UI; solid app-bar backgrounds may draw into it), **system gestures** (left/right back zones + bottom home zone).
- Backgrounds, dividers and scrolling content draw edge-to-edge; text and buttons are inset. Lists pad with insets but scroll under bars; the last item must clear the nav bar.
- Gesture nav bar stays transparent (no extra scrim); 3-button nav gets a translucent scrim. Status bar gets protection when content scrolls under it — never stack two protections.
- **P0:** no tap or drag targets under system-gesture insets; carousels, bottom sheets and swipeable rows use `safeGestures`.

**Window sizes (M3 breakpoints, dp)**

| Width class | Range | Margins / spacer | Panes | Primary nav |
|---|---|---|---|---|
| Compact | < 600 | 16 | 1 | Navigation bar (or modal expanded rail) |
| Medium | 600–839 | 24 / 24 | 1 (2 only for low-density content) | Navigation bar or rail |
| Expanded | 840–1199 | 24 / 24; fixed pane 360 | 2 recommended | Navigation rail |
| Large / XL | 1200–1599 / ≥ 1600 | — | 2 / up to 3 | Rail (modal or standard expanded) |

Height classes: compact < 480, medium 480–899, expanded ≥ 900. A phone in landscape is medium width but compact height → no two-pane layout.
- **P0:** no `isTablet` logic — decide by current window size (Android and Flutter docs both say so). The class changes at runtime (fold, rotate, split screen); keep state across it.
- **P1:** don't lock to portrait (letterboxing on large screens). Cap content width; don't stretch inputs and buttons full width; bottom sheet → side sheet on large windows. Keep text at 40–60 characters per line.

## 3. Touch & gestures
- **P0 targets:** iOS/iPadOS default control size 44×44pt (HIG absolute minimum 28×28pt — ship 44). Android/M3: ≥ 48×48dp (~9mm). The visual can be a 24dp icon; padding makes the target.
- **Spacing:** M3 ≥ 8dp between targets. HIG: ~12pt padding around bezeled controls, ~24pt around bezel-less ones.
- **P0 system gestures — never hijack:** iOS left-edge swipe pops the stack (also in Flutter); Android back from left/right edges and home from the bottom; iOS home-indicator swipe from the bottom **[Unverified: not on the fetched HIG pages]**. HIG: "Avoid conflicting with gestures that access system UI." Start horizontal swipe UIs inset from screen edges.
- **P0:** every gesture-only action has a visible alternative (swipe-to-delete + delete button or menu). Custom gestures only for frequent specialised tasks, never the only path.
- **Haptics (P2, misuse is P1):** use system patterns for their documented meaning — iOS notification (success/warning/error), impact (light…heavy, rigid, soft), selection; Android `HapticFeedbackConstants`. Short, tied to discrete events, consistent, synced with the animation. Android: given a choice between buzzy haptics and none, choose none; a keyclick lasts 10–20ms; avoid legacy one-shot `vibrate()`. Make haptics optional.

## 4. Navigation patterns
**iOS**
- **Tab bar** = top-level sections, navigation only (actions go in a toolbar). Visible in every section (only a modal may cover it). Never disable or hide tabs — explain an empty section instead. Single-word labels; badges for critical info only. HIG sets no hard iPhone count: fewer is easier, overflow becomes a "More" tab (avoid), customisable iPad tab bars default to ≤ 5. Complex IA → tab bar that adapts to a sidebar (`TabViewStyle.sidebarAdaptable`).
- **Navigation stack** for drill-down. Standard Back control — no custom "Back" text label. Large titles keep people oriented; by default they collapse to a standard title on scroll and return at the top. Titles < 15 characters; one primary action on the trailing side; ≤ 3 toolbar groups.
- **Sheets** for short, scoped tasks. Detents: medium ≈ half height, large = full; add medium for progressive disclosure, omit it for compose-style content. Resizable sheet → show the grabber. Swipe-down dismisses; with unsaved changes, confirm via an action sheet. Cancel leading, Done trailing; Done always paired with Cancel or Back; never all three. One sheet at a time. Long or multistep flows, camera, media → full-screen modal.

**Android (M3)**
- **Navigation bar:** 3–5 destinations, always labelled (1–2 words, no wrap/truncation), fixed positions, never permanently covered. < 3 → tabs; > 5 → modal expanded rail or restructure. Compact/medium only; expanded and up → navigation rail. Decide per destination whether returning to it preserves state (scroll, tab, search) or resets it.
- **Top app bar** collapses on scroll (small bar to status-bar height if sticky).
- **P0 predictive back:** opted-in apps get system back-to-home, cross-activity and cross-task animations (default from Android 15). Use `OnBackPressedCallback` / Compose `BackHandler` / `PredictiveBackHandler`; intercepting via `onBackPressed` or `KEYCODE_BACK` is no longer supported. Intercept only for UI logic (unsaved-form confirm), never for logging; at the root let the system exit.
- **Bottom sheets:** modal sheets for action menus on mobile; initial height capped at 50% of the screen; dismiss by scrim tap, swipe down or back; the drag handle is tappable to cycle heights. Standard (non-modal) sheets for persistent companions (player, map details).

**Both**
- Push = hierarchy · sheet = short self-contained task returning to its parent · full-screen modal = immersive or multistep · alert = rare blocking decision.
- Deep links: every top-level destination and detail screen is addressable; a deep-linked detail backs out to its parent, not out of the app **[Unverified: synthesis, not quoted]**. Use Universal Links (iOS) / verified App Links (Android) **[Unverified]**.

## 5. Typography
- **iOS Dynamic Type at default (Large), size/leading pt:** Large Title 34/41 · Title 1 28/34 · Title 2 22/28 · Title 3 20/25 · Headline 17/22 semibold · Body 17/22 · Callout 16/21 · Subhead 15/20 · Footnote 13/18 · Caption 1 12/16 · Caption 2 11/13. Default 17pt, minimum 11pt.
- **M3 type scale, size/line-height sp (Roboto):** display 57/64 · 45/52 · 36/44; headline 32/40 · 28/36 · 24/32; title 22/28 · 16/24 · 14/20 (medium weight); body 16/24 · 14/20 · 12/16; label 14/20 · 12/16 · 11/16. Body never < 12sp.
- **P0 scaling:** iOS text styles (custom fonts must implement the same Dynamic Type behaviour; scale custom sizes with `@ScaledMetric`); Android `sp` (incl. `lineHeight`), never `sp` for padding; RN `allowFontScaling` stays `true`; Flutter honours the OS setting. Android 14+ scales to **200%** (non-linear); Apple asks for enlargement to **at least 200%**.
- **P0 test at the largest size:** iOS Settings › Accessibility › Display & Text Size › Larger Text (accessibility sizes on); Android Settings › Accessibility › Display size and text › max font. At large sizes: wrap instead of truncate, stack horizontal rows, drop columns (`isAccessibilityCategory`), scale icons with text (SF Symbols do). A fixed-height container holding text is a P0 bug.
- Cap scaling only for chrome that cannot grow (tab labels): SwiftUI `.dynamicTypeSize(...)` with an upper bound + `accessibilityShowsLargeContentViewer()`, RN `maxFontSizeMultiplier`. Never cap body text.
- **Fonts:** SF Pro (iOS) and Roboto (Android) are the defaults; don't embed SF — its licence limits it to Apple platforms. Brand fonts are fine for headings and brand moments if they support Dynamic Type and Bold Text. Avoid Ultralight/Thin/Light weights.
- **Cyrillic (P1 for UA/RU audiences):** confirm the brand font ships Cyrillic, incl. Ukrainian і ї є ґ, in every weight used — otherwise glyphs fall back to the system font mid-word. SF Pro and Roboto cover Cyrillic **[Unverified]**. Leave label room for longer translations; navigation labels must not wrap or truncate.

## 6. Colour & theming
- **P0:** follow system light/dark. Apple: no app-only appearance switch. Android: reflect the system setting (an in-app override is optional) and don't lock to light.
- Semantic colours only: iOS system colours or asset-catalog colour sets with light + dark variants; M3 colour roles (`onPrimary` on `primary`, `onPrimaryContainer` on `primaryContainer`). No hard-coded hex in views.
- **Contrast:** text ≥ 4.5:1 (Android: < 18sp, or bold < 14sp), ≥ 3:1 for larger/bold text, icons and surfaces. Apple dark mode: never below 4.5:1; aim for 7:1 for small custom text. Nav icons ≥ 3:1 against the container. Test dark mode with Increase Contrast and Reduce Transparency on.
- **Dynamic colour (Material You, Android 12+):** opt in (wallpaper-sourced) when users benefit from personalisation; always ship a custom light/dark fallback scheme. Content-based colour (e.g. album art) works best on elements next to its source. Plugin judgement, not an M3 rule: opt out, or limit dynamic colour to neutral surfaces, when brand colour carries meaning; keep error/success colours fixed.

## 7. Feedback & states
- **Loading:** show something immediately (placeholder text/graphics shaped like the content); determinate progress when duration is known, indeterminate when not; keep the rest of the app usable. Spinners are small, inline and native (Flutter `CircularProgressIndicator.adaptive()`).
- **Pull-to-refresh** on server-backed lists: SwiftUI `.refreshable`, Compose `PullToRefreshBox`, RN `RefreshControl`, Flutter `RefreshIndicator.adaptive()`.
- **Empty / error / offline:** inline, specific, with an action. No network at launch → cached or placeholder data plus a non-intrusive label, not an alert.
- **Message hierarchy:** inline status first → **snackbar** (M3: bottom, one at a time, one action such as Undo/Retry, no icons or links, above FAB/nav, never the only route to a core action, mirror the result inline) → **alert/dialog** for blocking decisions only. Android **toast**: prefer a snackbar while the app is in the foreground; toasts are limited to 2 lines on Android 12+. iOS has no system toast — use inline status or a custom banner.
- **Alerts (HIG):** use sparingly; ≤ 3 buttons; the title says what happened (never "Error" or a code, ≤ 2 lines); no alert for common undoable actions; destructive style only for actions not deliberately chosen; a button titled "Cancel" that is not the default.
- **P0 permissions:** ask in context when the person starts the feature, not at launch unless the app can't work without it. Pre-prompt only if context isn't enough: one button ("Continue"/"Next") that opens the system dialog. iOS: no "Allow" wording, no close/cancel that skips the system alert; misleading screens before App Tracking Transparency are rejected. Android: show rationale UI when `shouldShowRequestPermissionRationale()` is true, with a "no thanks" path. Purpose strings: active, specific, full sentence ("The app records during the night to detect snoring sounds."). On denial: degrade gracefully, explain at the spot where the feature would be, don't nag. Android treats two denials as permanent; Android 11+ offers "Only this time" for location, mic and camera.

## 8. Accessibility
- **P0 labels:** every control and meaningful image has a screen-reader label stating purpose, not type ("Submit", not "Submit button"), unique within lists (include the item name). `Text` needs none in Compose. Decorative images hidden: SwiftUI `accessibilityHidden(true)`, Compose `contentDescription = null` / `hideFromAccessibility`, RN `importantForAccessibility="no-hide-descendants"` (Android).
- **Roles & state:** Compose `Role.Button`/`Role.Switch`; RN `role` (wins over `accessibilityRole`; `link` only for external URLs) + `accessibilityState` {disabled, selected, checked, busy, expanded}. Mark screen titles and section headers as headings (rotor/heading navigation); unique screen titles.
- **Grouping & order:** group image + caption or a whole card into one element; reading order = visual order; announce dynamic changes (SwiftUI `AccessibilityNotification`, RN `announceForAccessibility`, Android live region `polite`).
- **Reduce Motion (P1):** replace slides, zooms, parallax and 3D with fades; no auto-repeating animation. SwiftUI `@Environment(\.accessibilityReduceMotion)`, RN `AccessibilityInfo.isReduceMotionEnabled()`.
- **Bold Text / high contrast:** system fonts adapt; custom fonts must too (RN `isBoldTextEnabled()` on iOS; Flutter `AccessibilityFeatures`).
- **Alternatives:** core functionality is reachable without gestures (Voice Control, Switch Access, keyboard).
- **Verify:** VoiceOver + TalkBack walkthrough, Xcode Accessibility Inspector audit, Android Accessibility Scanner, Flutter `meetsGuideline(...)` tests.

## 9. Forms & keyboards
- **P1 keyboard per field** (email, URL, number pad, decimal, phone): SwiftUI `.keyboardType()`, Compose `KeyboardOptions(keyboardType = …)`, RN `keyboardType`/`inputMode`, Flutter `keyboardType`.
- **P1 autofill semantics on every identity, credential and address field:** iOS `.textContentType(.emailAddress | .password | .newPassword | .oneTimeCode)`; Compose `Modifier.semantics { contentType = ContentType.Username + ContentType.EmailAddress }`, `NewUsername`/`NewPassword` on sign-up (the credential provider may offer "suggest strong password"); RN `autoComplete` (`email`, `username`, `current-password`, `new-password`, `one-time-code`, `tel`, `postal-code`) — don't also set `textContentType`; Flutter `autofillHints`.
- **Return key:** Next moves focus to the following field; the last field's key matches the action (Done/Go/Search/Send). SwiftUI `.submitLabel()`, Compose `imeAction`, RN `enterKeyHint` + `submitBehavior`, Flutter `textInputAction`.
- No autocorrect or auto-capitalisation on email, username, code and URL fields (Compose `autoCorrectEnabled = false`, `KeyboardCapitalization.None`); words-caps for names.
- **P0 keyboard avoidance:** the focused field and its submit button stay visible above the keyboard. iOS `UIKeyboardLayoutGuide`; Compose `Modifier.imePadding()` / `WindowInsets.ime`; RN `KeyboardAvoidingView` with `behavior` set on both platforms; Flutter `scrollPadding`.
- Secure fields get a show/hide toggle; OTP fields accept paste and SMS autofill **[Unverified as a store rule — plugin rule]**. The web "16px input" rule is a Safari zoom fix — native inputs use the body style.

## 10. Onboarding, paywalls & store rules
- **Onboarding (HIG):** fast, optional, interactive; once skipped, never shown again but findable later; defer non-essential setup; sensible defaults; let people experience the app before asking for ratings or purchases; no licence text in the flow.
- **Accounts (App Store 5.1.1(v)):** no login unless the app has significant account-based features; if it supports account creation, it must offer account deletion in-app.
- **Apple subscription sign-up screen must show:** subscription name, duration and what's included; full renewal price, clear, prominent and localised; a way to sign in or **restore purchases**; links to Terms of Use and Privacy Policy (app + metadata). The **billed amount is the most prominent price**; per-week/month equivalents stay subordinate. Free trial: its length and the price billed after it. Easy access to the system subscription-management UI. Auto-renewable periods ≥ 7 days (3.1.2(a)); restorable IAP needs a restore mechanism (3.1.1); digital unlocks use IAP.
- **Google Play subscriptions policy:** disclose cost, billing frequency/auto-renewal and whether a subscription is required, with no extra action needed to see them. Trials: when and how they convert, the paid price, how to cancel. In-app access to an easy online cancel method. Deceptive flows are banned (e.g. an annual plan shown mainly as a monthly price).
- Visible close, no fake urgency, no pre-checked upsells (SKILL §4, P0). Regional exceptions (external payment links, EU/Korea/US rulings) and other legal specifics **[Unverified]** — re-read the current guidelines before release.

## 11. Framework notes
**SwiftUI** — `NavigationStack`; `TabView` + `.tabViewStyle(.sidebarAdaptable)`; `.sheet` + `.presentationDetents([.medium, .large])` + `.interactiveDismissDisabled(hasChanges)`; `.refreshable`; `.sensoryFeedback(_:trigger:)` (iOS 17+). System text styles plus `@ScaledMetric` for custom sizes; `.dynamicTypeSize(...)` ranges only on chrome. `@Environment(\.accessibilityReduceMotion)`, `.accessibilityHidden(true)`. Standard toolbars adopt Liquid Glass automatically; hand-rolled bars don't — another reason to use system containers.

**Jetpack Compose** — M3 `Scaffold`: it *passes* `innerPadding` but doesn't apply it, so give it to content (`contentPadding = innerPadding`). M3 `TopAppBar`, `NavigationBar`, `NavigationRail`, `ModalBottomSheet`, drawer sheets handle insets themselves. `WindowInsets.safeDrawing` / `safeGestures`; `imePadding()`. `currentWindowAdaptiveInfo().windowSizeClass` drives layout. Material `Button`/`IconButton`/`ListItem` enforce 48dp; custom clickables add `sizeIn(minWidth = 48.dp, minHeight = 48.dp)`. `BackHandler`/`PredictiveBackHandler`; `dynamicLightColorScheme`/`dynamicDarkColorScheme` behind an SDK ≥ 31 check, with `isSystemInDarkTheme()` fallback schemes.

**React Native / Expo** — `react-native-safe-area-context`: `SafeAreaProvider` at the root (Expo Router adds it), then `SafeAreaView` or `useSafeAreaInsets()`; core `SafeAreaView` is deprecated (iOS-only). Android edge-to-edge applies to RN too: pad tab bars, FABs and list ends with the bottom inset. `accessibilityLabel`, `role`, `accessibilityState`; `accessibilityHint` sparingly (can't be turned off on Android). `AccessibilityInfo.isReduceMotionEnabled()` / `isBoldTextEnabled()`. `Pressable` + `hitSlop` (never extends past parent bounds) + `android_ripple`. `Platform.select` / `.ios.tsx` / `.android.tsx` for nav chrome. Expo: tailor the `ios.infoPlist` purpose strings (boilerplate likely fails review); Info.plist changes need a new binary, not an OTA update.

**Flutter** — wrap the `Scaffold` *body* in `SafeArea` (nested SafeAreas don't double-pad). Lay out with `MediaQuery.sizeOf` / `LayoutBuilder` + M3 breakpoints; no orientation-based app layouts, no device checks; `PageStorageKey` keeps scroll position. Read `MediaQuery.textScalerOf(context)`; never force `TextScaler.noScaling` app-wide. `Semantics` for custom widgets. `.adaptive()` for Switch/Slider/Checkbox/Radio/AlertDialog/progress/RefreshIndicator; `CupertinoTabBar` on iOS vs `NavigationBar` on Android when going native-per-platform. SF is used only on Apple platforms (licence). CI: `meetsGuideline(androidTapTargetGuideline | iOSTapTargetGuideline | labeledTapTargetGuideline | textContrastGuideline)`.

## 12. Pre-flight checklist (per mobile screen)
- [ ] Platform stance decided; system behaviours (back, scroll, text editing, alerts, permissions) are native.
- [ ] No control or text in unsafe areas: notch/Dynamic Island, status bar, home indicator, Android nav bar, display cutout.
- [ ] Android edge-to-edge: backgrounds/lists under bars, last list item clears the nav bar, no targets in gesture insets.
- [ ] Layout checked at compact, medium and expanded widths plus phone landscape (compact height); no `isTablet` logic.
- [ ] Targets ≥ 44pt (iOS) / 48dp (Android), ≥ 8dp apart.
- [ ] No custom gesture conflicts with edge-back or home; every swipe action has a visible alternative.
- [ ] Primary nav: iOS tab bar for navigation only, always visible, labelled; Android nav bar 3–5 labelled destinations, rail from expanded.
- [ ] Predictive back works (Android); back is intercepted only for unsaved changes; sheets confirm before discarding edits.
- [ ] Largest text size tested (iOS accessibility sizes, Android 200%): nothing clipped, overlapped or truncated in key content.
- [ ] Brand font covers Cyrillic (і ї є ґ) in all weights used, and supports Dynamic Type/Bold Text.
- [ ] Light and dark both correct; semantic colours only; contrast ≥ 4.5:1 text, ≥ 3:1 icons/large text.
- [ ] Loading, empty, error and offline states designed; feedback via inline/snackbar/alert at the right level.
- [ ] Permissions asked in context with a specific purpose string; denial degrades gracefully.
- [ ] Every control has a purpose label and role/state; decorative images hidden; headings marked; focus order = visual order.
- [ ] Reduce Motion respected; haptics use system patterns and are optional.
- [ ] Each field has the right keyboard type, autofill content type and return key; the keyboard never hides the field or its submit button.
- [ ] Paywall shows billed price most prominently, period, trial terms, restore purchases, cancel/manage path, Terms + Privacy links, visible close.
- [ ] VoiceOver and TalkBack walkthrough done on a real device.

## 13. References
Pattern libraries: **mobbin.com** (real iOS/Android flows and screens) · **screensdesign.com** (paywalls, onboarding).

Official sources (fetched for this file):
- Apple HIG (data endpoints `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`): layout, accessibility, typography, tab-bars, toolbars, sheets, gestures, playing-haptics, privacy, loading, alerts, dark-mode, onboarding, virtual-keyboards, voiceover — https://developer.apple.com/design/human-interface-guidelines/
- App Review Guidelines — https://developer.apple.com/app-store/review/guidelines/ · Auto-renewable subscriptions — https://developer.apple.com/app-store/subscriptions/
- SwiftUI docs: presentationDetents, interactiveDismissDisabled, refreshable, dynamicTypeSize, ScaledMetric, accessibilityReduceMotion, sensoryFeedback, NavigationStack — https://developer.apple.com/documentation/swiftui
- Material 3: breakpoints (+ compact/medium/expanded), accessibility structure (targets), navigation bar, bottom sheets, snackbar, dynamic colour — https://m3.material.io
- Android: edge-to-edge (views + design guide), Compose insets + Material insets, window size classes, adapt layout, accessibility (apps + design guide), predictive back (dev + design), themes, Material 3 in Compose, autofill in Compose, KeyboardOptions, keyboard animations, pull-to-refresh, runtime permissions, toasts, haptics principles, Android 14 features (200% font scaling) — https://developer.android.com/develop/ui/views/layout/edge-to-edge, https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes, https://developer.android.com/design/ui/mobile
- Material Components Android docs (BottomNavigation, Snackbar) — https://github.com/material-components/material-components-android/tree/master/docs/components
- Google Play subscriptions policy — https://support.google.com/googleplay/android-developer/answer/9900533
- React Native: accessibility, AccessibilityInfo, SafeAreaView, platform-specific code, TextInput, KeyboardAvoidingView, Pressable, RefreshControl — https://reactnative.dev/docs/accessibility · Expo: safe areas, permissions — https://docs.expo.dev/develop/user-interface/safe-areas/
- Flutter: accessibility (+ UI design & styling, testing, assistive technologies), adaptive & responsive (SafeArea/MediaQuery, best practices, platform adaptations), MediaQuery.textScalerOf, TextField — https://docs.flutter.dev/ui/accessibility, https://docs.flutter.dev/ui/adaptive-responsive
