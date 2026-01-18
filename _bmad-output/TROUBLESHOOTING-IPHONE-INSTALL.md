# Troubleshooting: Getting Cooked on Your iPhone

**Date:** January 14, 2026
**Status:** In Progress
**Goal:** Install Cooked app on physical iPhone using free Apple ID (no $99 developer account)

---

## Current State

### What's Working
- ✅ Native iOS project can be generated via Expo CNG (`npx expo run:ios` or `npx expo prebuild --platform ios`)
- ✅ CocoaPods can be installed after generation (inside `apps/mobile/ios/`)
- ✅ Signed into Xcode with Apple ID (William Pride - Personal Team)
- ✅ Bundle ID changed to `com.williampride.cookedapp`
- ✅ Entitlements file cleaned (removed push notifications & associated domains)

### The Error
```
Cannot create a iOS App Development provisioning profile for "com.williampride.cookedapp".
Personal development teams, including "William Pride", do not support the Associated Domains and Push Notifications capabilities.
```

---

## Things to Try Tomorrow

### 1. Connect iPhone & Enable Developer Mode
- [ ] Plug iPhone into Mac with USB cable
- [ ] On iPhone: **Settings → Privacy & Security → Developer Mode → ON**
- [ ] iPhone will restart
- [ ] Trust the computer when prompted

### 2. Generate iOS Project + Clean Build in Xcode
- [ ] Generate the iOS project (CNG):
  - [ ] `cd apps/mobile && npx expo run:ios` (recommended)
  - or `cd apps/mobile && npx expo prebuild --platform ios`
- [ ] Open Xcode: `open apps/mobile/ios/Cooked.xcworkspace`
- [ ] Menu: **Product → Clean Build Folder** (⇧⌘K)
- [ ] Click **Try Again** in Signing & Capabilities

### 3. Select iPhone as Target
- [ ] At top of Xcode, click device dropdown (says "iPhone 16 Pro" or similar)
- [ ] Select YOUR physical iPhone from the list
- [ ] If iPhone not showing, check cable connection

### 4. Verify Capabilities Are Removed in Xcode UI
- [ ] Click **Cooked** target → **Signing & Capabilities** tab
- [ ] Scroll down - there should be NO:
  - Associated Domains
  - Push Notifications
- [ ] If they're still there, click the **−** button next to each to remove

### 5. If Still Not Working - Nuclear Option
Delete and regenerate the iOS folder:
```bash
cd /Users/williampride/Projects/Cooked/apps/mobile
rm -rf ios
npx expo prebuild --platform ios
```
Then remove capabilities from `app.json` before prebuild (see below).

---

## Files Modified

### Entitlements (already cleaned)
**File:** `apps/mobile/ios/Cooked/Cooked.entitlements`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict/>
</plist>
```

### Bundle ID Changed
**In Xcode:** `com.williampride.cookedapp` (was `com.cooked.app`)

---

## To Restore Later (When You Get $99 Account)

See `RESTORE-CAPABILITIES.md` for full details:
- Change Bundle ID back to `com.cooked.app`
- Add Associated Domains capability
- Add Push Notifications capability

---

## Quick Commands

```bash
# Open Xcode
open /Users/williampride/Projects/Cooked/apps/mobile/ios/Cooked.xcworkspace

# Clean and regenerate iOS folder (if needed)
cd /Users/williampride/Projects/Cooked/apps/mobile
rm -rf ios
npx expo prebuild --platform ios

# Run pod install (if needed)
cd apps/mobile/ios && pod install && cd ../../..
```

---

## Alternative: Run in Dev Mode (Simulator Only)

If iPhone install keeps failing, you can still test in simulator:
```bash
cd /Users/williampride/Projects/Cooked/apps/mobile
npx expo start
# Press 'i' to open iOS simulator
```
The DEV LOGIN button will appear, letting you bypass phone auth.

---

## Resources

- [Apple Developer Forums - Provisioning Profile Issues](https://developer.apple.com/forums/thread/63957)
- [Solving Xcode Provisioning Profile Errors](https://gordonbeeming.com/blog/2025-10-15/solving-xcode-provisioning-profile-and-capability-errors)
- Free accounts have 7-day certificate expiration
- Max 3 devices per free account

---

## Notes

- Push notifications and deep links WON'T work without paid account
- App will expire every 7 days (need to reinstall)
- This is just for personal testing - beta testers need TestFlight ($99 account)
