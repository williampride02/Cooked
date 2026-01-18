# Expo CNG Workflow (Why `ios/` + `android/` are ignored)

This project uses **Expo** for the mobile app (`apps/mobile`). Expo supports two main ways to manage the native iOS/Android code:

- **CNG (Continuous Native Generation)**: generate `ios/` + `android/` from config when you build.
- **“Commit native projects”**: keep `ios/` + `android/` checked into git and maintain them like a traditional React Native app.

We chose **CNG** for Cooked (for now). This doc explains what that means and why the repo is set up this way.

---

## What “CNG” means (plain English)

With **CNG**, the **native projects are treated like build output**, similar to:

- `dist/`
- `.next/`
- compiled artifacts

Instead of committing the entire Xcode project + Gradle project into git, we commit:

- **JavaScript/TypeScript source** (the actual app code)
- **Expo configuration** (`app.json` / config plugins)

Then when we need native projects, Expo generates them (via **`expo prebuild`**) and builds them.

**Source of truth** in CNG:
- `apps/mobile/app.json` (and any config plugins)
- `apps/mobile/src/**`
- `apps/mobile/package.json`

**Generated output** in CNG:
- `apps/mobile/ios/`
- `apps/mobile/android/`

---

## Why `apps/mobile/ios/` and `apps/mobile/android/` are ignored

In this repo, we intentionally ignore the native folders in `.gitignore`:

- `apps/mobile/ios/`
- `apps/mobile/android/`

### The core reason

When using CNG + EAS Build, **EAS runs `expo prebuild` during the build**. That means:

- The build system can generate `ios/` and `android/` from the config every time
- Keeping them committed is optional

### Benefits (why this is a good default for Cooked)

- **Less repo noise**: native projects are huge and contain many generated files.
- **Less “drift”**: if `ios/` is committed and someone changes `app.json`, it’s easy for the committed native code to become inconsistent.
- **Cleaner automation**: CI / EAS builds start from a consistent generated baseline.
- **Easier onboarding**: teammates don’t need to reason about native build files unless they’re doing native work.

### Why this matters for Cooked specifically

Cooked is a monorepo with:
- `apps/mobile` (Expo / React Native)
- `apps/web` (Next.js)
- `supabase` (backend)

Keeping mobile native folders untracked reduces “accidental complexity” while we iterate quickly on product features.

---

## “But don’t we need iOS/Android folders to build?”

You need them to build **locally**, but you don’t need them committed.

### Local development options

#### Option A: Expo Go (fastest iteration)

- Run `pnpm mobile` (or `cd apps/mobile && pnpm start`)
- Use Expo Go on your phone

In this mode you typically **do not need** local native folders.

#### Option B: Dev Client / native build locally (when you need native capabilities)

If you need a real native build (e.g. notifications, deep linking, native modules), use:

- `cd apps/mobile`
- `npx expo run:ios`
- `npx expo run:android`

These commands will:

1. Generate `ios/` or `android/` locally (via prebuild)
2. Build + run the native app

Because those folders are ignored, they will exist on your machine but **won’t show up as changes to commit**.

---

## What changed in this repo (and why)

Previously, the repo had:

- `apps/mobile/ios/` committed
- `apps/mobile/android/` missing

That is a confusing “half state” because:

- It suggests iOS native code is source-of-truth
- But Android is still CNG / generated

To make it consistent, we moved fully to CNG:

- Removed committed `apps/mobile/ios/`
- Ensured both `apps/mobile/ios/` and `apps/mobile/android/` are ignored

This aligns the repo to one clear workflow instead of mixing strategies.

---

## When you should *NOT* use CNG (and commit native instead)

You might prefer committing native projects if:

- You do a lot of custom native code changes directly in Xcode/Android Studio
- You have complex native build modifications that are hard to express via Expo config plugins
- You want exact native diffs reviewed in PRs for every build change

If you choose “commit native,” then:

- We would remove `apps/mobile/ios/` and `apps/mobile/android/` from `.gitignore`
- We would generate both platforms once (`expo prebuild`) and commit them
- Native changes would be made directly in those folders (plus config/plugins as needed)

This is a valid approach — it just increases maintenance cost.

---

## Expo Notifications note (why we changed an icon path)

Expo notifications configuration can reference a notification icon file.

If the config references a missing file, **native builds can fail**.

We updated the mobile config to point to an existing asset so builds don’t break.

File:
- `apps/mobile/app.json`

---

## Quick checklist (how to know which workflow you’re in)

If you’re using CNG:
- `apps/mobile/ios/` and `apps/mobile/android/` are ignored
- EAS builds work without committing native folders
- You run `expo run:*` locally when you need native builds

If you’re committing native:
- `apps/mobile/ios/` and `apps/mobile/android/` are tracked in git
- You build via Xcode/Android Studio directly (or `expo run:*` but still commit the output)

---

## Recommended next step (optional)

If you want, I can also add a shorter “How to run mobile builds” doc (2–3 minutes read) that includes:

- Expo Go vs Dev Client vs EAS Build
- When to choose each
- Common pitfalls (notifications, deep links, Android signing)

