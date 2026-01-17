---
title: "Android Port - Manual Testing Checklist"
aliases:
  - "Android Porting Checklist"
  - "Android Testing Checklist"
tags:
  - cooked
  - android
  - testing
  - manual
  - checklist
status: in-progress
created: 2026-01-20
updated: 2026-01-20
related:
  - "[[Platform Parity Framework]]"
  - "[[Architecture]]"
---

# Android Port - Manual Testing Checklist

> [!info] Manual Intervention Required
> **Purpose**: This checklist covers manual testing and setup tasks that require human intervention, physical devices, or interactive workflows.

## Overview

This checklist documents all manual tasks required to complete the Android port. Automated setup tasks are handled separately.

---

## Phase 1: Android Core Features Testing

### Setup & Prerequisites

- [ ] Install Android Studio (if not already installed)
- [ ] Set up Android emulator or connect physical Android device
- [ ] Enable USB debugging on physical device (if using)
- [ ] Verify Android SDK is installed and configured
- [ ] Ensure Java/JDK is installed for Android development

### Authentication Testing

- [ ] **Phone Number Entry**
  - [ ] Phone number input field works correctly
  - [ ] Country code picker functions properly
  - [ ] Formatting works as expected
  
- [ ] **SMS Verification**
  - [ ] SMS code is received on Android device
  - [ ] Code input field accepts 6-digit code
  - [ ] Verification flow completes successfully
  - [ ] Error handling works (wrong code, expired code)

- [ ] **Profile Setup**
  - [ ] Profile creation flow works
  - [ ] Image picker works (camera and gallery)
  - [ ] Profile photo uploads successfully
  - [ ] Profile data saves correctly

- [ ] **Deep Linking (Auth)**
  - [ ] Auth deep links open app correctly
  - [ ] App handles auth redirects properly

### Groups & Social Features

- [ ] **Group Creation**
  - [ ] Create group flow works
  - [ ] Group name and settings save correctly
  - [ ] Group appears in groups list

- [ ] **Invite Links**
  - [ ] Generate invite link works
  - [ ] Share functionality works (native Android share)
  - [ ] Invite link opens app when clicked
  - [ ] Join group via link works

- [ ] **Activity Feed**
  - [ ] Feed loads and displays correctly
  - [ ] Real-time updates work (new items appear)
  - [ ] Feed items render properly
  - [ ] Pull-to-refresh works
  - [ ] Infinite scroll/pagination works

- [ ] **Quick Reactions**
  - [ ] Reaction buttons are tappable
  - [ ] Reactions save and display correctly
  - [ ] Reaction counts update in real-time

### Pacts Testing

- [ ] **Pact Creation**
  - [ ] Create pact flow works
  - [ ] All pact types work (Individual, Group, Relay)
  - [ ] Pact settings save correctly
  - [ ] Pact appears in pacts list

- [ ] **Pact Management**
  - [ ] Edit pact works
  - [ ] Archive pact works
  - [ ] Pact statistics display correctly

### Check-ins Testing

- [ ] **Daily Check-in**
  - [ ] Success check-in works
  - [ ] Fold check-in works
  - [ ] Excuse selection works
  - [ ] Custom excuse input works

- [ ] **Proof Photo Submission**
  - [ ] Camera opens when selecting proof photo
  - [ ] Gallery picker works
  - [ ] Photo uploads successfully
  - [ ] Photo displays in check-in

### Roast Threads Testing

- [ ] **Thread Creation**
  - [ ] Thread opens when user folds
  - [ ] Thread displays correctly
  - [ ] Thread navigation works

- [ ] **Roast Responses**
  - [ ] Text responses work
  - [ ] GIF picker works (Tenor API)
  - [ ] Image upload works
  - [ ] Responses post correctly

- [ ] **Reactions & Polls**
  - [ ] Emoji reactions work
  - [ ] Poll creation works (if implemented)
  - [ ] Poll voting works

### Notifications Testing

- [ ] **Permission Request**
  - [ ] Notification permission prompt appears
  - [ ] Permission can be granted
  - [ ] Permission can be denied
  - [ ] App handles both cases gracefully

- [ ] **Notification Channels**
  - [ ] Default notification channel is created
  - [ ] Notifications appear in system tray
  - [ ] Notification sounds work
  - [ ] Notification vibration works (if enabled)

- [ ] **Background Notifications**
  - [ ] Notifications received when app is closed
  - [ ] Notifications received when app is in background
  - [ ] Tapping notification opens app correctly
  - [ ] Notification data is handled correctly

---

## Phase 2: Android Platform-Specific Features

### Permissions Testing

- [ ] **Camera Permission**
  - [ ] Runtime permission request appears
  - [ ] Permission can be granted
  - [ ] Permission can be denied
  - [ ] Camera opens when permission granted
  - [ ] App handles denial gracefully

- [ ] **Photo Library Permission**
  - [ ] Runtime permission request appears (Android 13+)
  - [ ] Permission can be granted
  - [ ] Gallery picker works when granted
  - [ ] App handles denial gracefully

- [ ] **Notification Permission**
  - [ ] Runtime permission request appears (Android 13+)
  - [ ] Permission can be granted
  - [ ] Notifications work when granted
  - [ ] App handles denial gracefully

### Deep Linking (App Links)

- [ ] **App Links Configuration**
  - [ ] Verify `AndroidManifest.xml` has correct intent filters
  - [ ] Test App Links verification (if domain verified)
  - [ ] App Links open app directly (not browser)

- [ ] **Deep Link Paths**
  - [ ] `/group/{id}` opens group correctly
  - [ ] `/join/{code}` opens join flow correctly
  - [ ] `/recap/{id}` opens recap correctly
  - [ ] Invalid links handled gracefully

### Android-Specific UI/UX

- [ ] **Back Button**
  - [ ] Android back button navigates correctly
  - [ ] Back button closes modals/sheets
  - [ ] Back button exits app from home screen
  - [ ] Back button history works correctly

- [ ] **Edge-to-Edge Display**
  - [ ] App uses full screen (edge-to-edge enabled)
  - [ ] Content doesn't overlap with system bars
  - [ ] Safe area insets work correctly

- [ ] **Haptic Feedback**
  - [ ] Haptics work on button presses
  - [ ] Haptics work on interactions
  - [ ] Haptic intensity is appropriate

- [ ] **Keyboard Behavior**
  - [ ] Keyboard doesn't cover input fields
  - [ ] Keyboard dismisses correctly
  - [ ] Input fields scroll into view when focused

### Platform-Specific Components

- [ ] **Image Picker**
  - [ ] Native Android image picker works
  - [ ] Camera integration works
  - [ ] Gallery integration works
  - [ ] Image compression works

- [ ] **Share Functionality**
  - [ ] Native Android share sheet appears
  - [ ] Share to other apps works
  - [ ] Share data is correct

---

## Phase 3: Build & Distribution

### EAS Build Configuration

- [ ] **Signing Keys Setup**
  - [ ] Generate Android keystore (or use EAS managed)
  - [ ] Configure keystore in EAS
  - [ ] Verify signing configuration

- [ ] **Build Profiles**
  - [ ] Development build works (APK)
  - [ ] Preview build works (APK)
  - [ ] Production build works (AAB for Play Store)

- [ ] **Build Testing**
  - [ ] Test development build on device
  - [ ] Test preview build on device
  - [ ] Test production build (if ready)

### Google Play Console Setup

- [ ] **Account Setup**
  - [ ] Create Google Play Console account
  - [ ] Pay one-time registration fee ($25)
  - [ ] Complete developer profile

- [ ] **App Listing**
  - [ ] Create app in Play Console
  - [ ] Upload app icon (512x512)
  - [ ] Upload feature graphic (1024x500)
  - [ ] Add screenshots (phone and tablet)
  - [ ] Write app description
  - [ ] Add privacy policy URL
  - [ ] Set content rating

- [ ] **App Signing**
  - [ ] Set up app signing by Google Play (recommended)
  - [ ] Upload signing key (or use Play App Signing)
  - [ ] Verify signing configuration

- [ ] **Release Tracks**
  - [ ] Set up internal testing track
  - [ ] Set up closed beta track
  - [ ] Set up open beta track (if desired)
  - [ ] Configure production track

---

## Phase 3B: Remote Testing & Sharing

### Building APK for Remote Testing

- [ ] **Build Development APK**
  - [ ] Run: `eas build --platform android --profile development`
  - [ ] Wait for build to complete (EAS will provide download link)
  - [ ] Download APK file to your computer
  - [ ] Verify APK file size is reasonable (~50-100MB typical)

- [ ] **Alternative: Build Preview APK**
  - [ ] Run: `eas build --platform android --profile preview`
  - [ ] Use this if you want a more production-like build
  - [ ] Download APK when ready

### Sharing Methods

#### Option 1: Direct APK Sharing (Easiest)

- [ ] **Upload APK to Cloud Storage**
  - [ ] Upload APK to Google Drive, Dropbox, or similar
  - [ ] Create shareable link (set to "Anyone with link can view")
  - [ ] Share link with your friend via text/email

- [ ] **Friend Installation Steps** (send these instructions):
  ```
  1. Open the shared link on your Android device
  2. Download the APK file
  3. When prompted, allow "Install from unknown sources" (Android will guide you)
  4. Open Settings → Security → Enable "Install unknown apps" for your browser/Drive app
  5. Tap the downloaded APK file to install
  6. If prompted, allow installation from this source
  ```

#### Option 2: Google Play Internal Testing (Recommended for Multiple Testers)

- [ ] **Set Up Google Play Console** (if not done in Phase 3)
  - [ ] Create Google Play Console account ($25 one-time fee)
  - [ ] Create app listing
  - [ ] Complete basic app information

- [ ] **Create Internal Testing Track**
  - [ ] Go to Play Console → Your App → Testing → Internal testing
  - [ ] Create new release
  - [ ] Upload AAB file (build with `eas build --platform android --profile production`)
  - [ ] Add release notes
  - [ ] Save and review release

- [ ] **Add Testers**
  - [ ] Go to Internal testing → Testers tab
  - [ ] Create tester list or use email addresses
  - [ ] Add your friend's email address
  - [ ] Share the opt-in link with your friend

- [ ] **Friend Installation Steps** (send these instructions):
  ```
  1. Click the opt-in link I sent you
  2. Join the internal testing program
  3. You'll be redirected to Play Store
  4. Install "Cooked" from Play Store (it will show as a test version)
  5. Updates will come through Play Store automatically
  ```

#### Option 3: Firebase App Distribution (Free Alternative)

- [ ] **Set Up Firebase App Distribution**
  - [ ] Create Firebase project (free)
  - [ ] Install Firebase CLI: `npm install -g firebase-tools`
  - [ ] Login: `firebase login`
  - [ ] Initialize: `firebase init appdistribution`

- [ ] **Distribute APK**
  - [ ] Run: `firebase appdistribution:distribute path/to/app.apk --app YOUR_APP_ID --groups testers`
  - [ ] Add friend's email to tester group
  - [ ] Friend will receive email with download link

- [ ] **Friend Installation Steps** (send these instructions):
  ```
  1. Check your email for Firebase App Distribution invite
  2. Click the download link
  3. Install the app (may need to allow unknown sources)
  4. Report any issues back to me
  ```

### Testing Coordination

- [ ] **Create Testing Document**
  - [ ] Create shared document (Google Doc, Notion, etc.)
  - [ ] List features to test (use checklist from Phase 1 & 2)
  - [ ] Add sections for bug reports
  - [ ] Share document with friend

- [ ] **Set Up Communication Channel**
  - [ ] Choose communication method (text, email, Slack, etc.)
  - [ ] Establish testing schedule/check-ins
  - [ ] Set expectations for feedback format

- [ ] **Provide Testing Instructions**
  - [ ] Share app version/build number
  - [ ] Explain what to test (core features, specific flows)
  - [ ] Provide test account credentials (if needed)
  - [ ] Explain how to report bugs (screenshots, steps to reproduce)

### Collecting Feedback

- [ ] **Bug Reporting Template** (share with friend):
  ```
  Bug Report:
  - Device: [Phone model, Android version]
  - Feature: [What were you testing?]
  - Steps to reproduce: [What did you do?]
  - Expected: [What should happen?]
  - Actual: [What actually happened?]
  - Screenshots: [Attach if possible]
  ```

- [ ] **Feature Testing Checklist** (share with friend):
  - [ ] Can you sign up/login?
  - [ ] Can you create/join a group?
  - [ ] Can you create a pact?
  - [ ] Can you check in (success/fold)?
  - [ ] Do notifications work?
  - [ ] Does the app feel smooth/responsive?
  - [ ] Any crashes or freezes?

### Iterative Testing Process

- [ ] **Build → Share → Test → Fix → Repeat**
  - [ ] Build new APK after fixes
  - [ ] Share updated APK with friend
  - [ ] Friend tests fixes
  - [ ] Collect feedback
  - [ ] Make additional fixes if needed
  - [ ] Repeat until stable

- [ ] **Version Tracking**
  - [ ] Keep track of which build version friend is testing
  - [ ] Use build numbers or version codes to track
  - [ ] Document which issues are fixed in which version

### Security Considerations

- [ ] **APK Signing**
  - [ ] Use EAS managed signing (recommended) or your own keystore
  - [ ] Never share debug keystore (use development/preview profiles)
  - [ ] For production testing, use production signing

- [ ] **Privacy**
  - [ ] Ensure test builds don't contain production API keys
  - [ ] Use development/staging backend if possible
  - [ ] Warn friend that it's a test build

---

## Phase 4: QA & Device Testing

### Multiple Android Versions

- [ ] **Android 10 (API 29)**
  - [ ] App installs and runs
  - [ ] Core features work
  - [ ] No critical crashes

- [ ] **Android 11 (API 30)**
  - [ ] App installs and runs
  - [ ] Core features work
  - [ ] Scoped storage works correctly

- [ ] **Android 12 (API 31)**
  - [ ] App installs and runs
  - [ ] Core features work
  - [ ] Material You theming works (if applicable)

- [ ] **Android 13 (API 33)**
  - [ ] App installs and runs
  - [ ] Runtime permissions work correctly
  - [ ] Notification permissions work

- [ ] **Android 14+ (API 34+)**
  - [ ] App installs and runs
  - [ ] Latest permission model works
  - [ ] All features work correctly

### Different Device Types

- [ ] **Phones (Various Sizes)**
  - [ ] Small phones (5" screen)
  - [ ] Medium phones (6" screen)
  - [ ] Large phones (6.5"+ screen)
  - [ ] All screen sizes render correctly

- [ ] **Tablets (if supported)**
  - [ ] App works on tablets
  - [ ] Layout adapts correctly
  - [ ] Touch targets are appropriate

### Different Manufacturers

- [ ] **Google Pixel**
  - [ ] Test on Pixel device
  - [ ] Stock Android behavior verified

- [ ] **Samsung**
  - [ ] Test on Samsung device
  - [ ] One UI compatibility verified

- [ ] **Other Manufacturers**
  - [ ] Test on at least one other brand (OnePlus, Xiaomi, etc.)
  - [ ] Verify no manufacturer-specific issues

### Feature Parity Checklist

Compare iOS vs Android for each feature:

- [ ] **All Screens**
  - [ ] All screens render correctly on Android
  - [ ] Layout matches iOS (or is appropriately adapted)
  - [ ] No visual glitches or layout issues

- [ ] **Navigation**
  - [ ] All navigation flows work
  - [ ] Back button works correctly
  - [ ] Deep linking works

- [ ] **Push Notifications**
  - [ ] Notifications work on Android
  - [ ] Notification channels configured correctly
  - [ ] Notification behavior matches iOS

- [ ] **Deep Linking**
  - [ ] App Links work correctly
  - [ ] Deep link handling matches iOS Universal Links

- [ ] **Image Picker**
  - [ ] Image picker works
  - [ ] Camera integration works
  - [ ] Gallery integration works

- [ ] **Haptics**
  - [ ] Haptic feedback works
  - [ ] Haptic patterns are appropriate

- [ ] **Sharing**
  - [ ] Share functionality works
  - [ ] Native Android share sheet appears

- [ ] **Real-time Updates**
  - [ ] WebSocket connections work
  - [ ] Real-time updates appear correctly
  - [ ] Connection handling works

---

## Phase 5: Epic 8 Story Creation

### Create Android Porting Stories

Use BMAD workflow to create stories:

- [ ] **8-1: Android Native Project Setup**
  - [ ] Run `/bmad:bmm:workflows:create-story`
  - [ ] Set story title: "Android Native Project Setup"
  - [ ] Mark platforms: iOS (not-applicable), Android (pending), Web (not-applicable)
  - [ ] Add acceptance criteria from plan
  - [ ] Save story file

- [ ] **8-2: Android Core Features Testing**
  - [ ] Run `/bmad:bmm:workflows:create-story`
  - [ ] Set story title: "Android Core Features Testing"
  - [ ] Mark platforms: iOS (not-applicable), Android (pending), Web (not-applicable)
  - [ ] Add acceptance criteria from testing checklist
  - [ ] Save story file

- [ ] **8-3: Android Platform-Specific Features**
  - [ ] Run `/bmad:bmm:workflows:create-story`
  - [ ] Set story title: "Android Platform-Specific Features"
  - [ ] Mark platforms: iOS (not-applicable), Android (pending), Web (not-applicable)
  - [ ] Add acceptance criteria from platform-specific testing
  - [ ] Save story file

- [ ] **8-4: Android Build & Distribution**
  - [ ] Run `/bmad:bmm:workflows:create-story`
  - [ ] Set story title: "Android Build & Distribution"
  - [ ] Mark platforms: iOS (not-applicable), Android (pending), Web (not-applicable)
  - [ ] Add acceptance criteria from build & distribution section
  - [ ] Save story file

- [ ] **8-5: Android QA & Device Testing**
  - [ ] Run `/bmad:bmm:workflows:create-story`
  - [ ] Set story title: "Android QA & Device Testing"
  - [ ] Mark platforms: iOS (not-applicable), Android (pending), Web (not-applicable)
  - [ ] Add acceptance criteria from QA section
  - [ ] Save story file

### Update Sprint Status

- [ ] Update `sprint-status.yaml` with Epic 8 stories
- [ ] Mark stories as `ready-for-dev` or appropriate status
- [ ] Verify platform tracking is set correctly

---

## Phase 6: Post-Testing Tasks

### Documentation

- [ ] Update `docs/PLATFORM-PARITY.md` with Android testing results
- [ ] Document any Android-specific issues found
- [ ] Document platform differences (if any)
- [ ] Update architecture docs with Android notes

### Merge Preparation

- [ ] **Rebase on Main**
  - [ ] Rebase Android branch on latest main
  - [ ] Resolve any conflicts from iPhone development
  - [ ] Test that merged code works for both platforms

- [ ] **Final Testing**
  - [ ] Test iOS app still works after merge
  - [ ] Test Android app works after merge
  - [ ] Verify no regressions

- [ ] **Create PR**
  - [ ] Create PR from `android-port/epic-8-android-porting` to `main`
  - [ ] Review for conflicts and platform parity
  - [ ] Add PR description with testing summary
  - [ ] Request review

---

## Notes & Resources

### Testing Commands

```bash
# Run on Android emulator
cd /Users/williampride/Projects/Cooked-android-port/apps/mobile
npx expo run:android

# Build APK for testing (for remote sharing)
eas build --platform android --profile development

# Build APK for preview/internal testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production

# Check build status
eas build:list --platform android

# Download build (if needed)
eas build:download --platform android --latest
```

### Remote Testing Commands

```bash
# Build and get shareable link
eas build --platform android --profile development

# After build completes, EAS provides:
# - Download URL (share this with friend)
# - QR code (friend can scan to download)
# - Direct APK link

# Alternative: Use Firebase App Distribution
firebase appdistribution:distribute apps/mobile/build/app-release.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups testers \
  --release-notes "Test build for remote testing"
```

### Useful Links

- [Expo Android Development](https://docs.expo.dev/workflow/android/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console](https://play.google.com/console/)
- [Google Play Internal Testing](https://support.google.com/googleplay/android-developer/answer/9845334)
- [Firebase App Distribution](https://firebase.google.com/docs/app-distribution)
- [Android App Links](https://developer.android.com/training/app-links)
- [Android Permissions](https://developer.android.com/training/permissions/requesting)
- [Installing APKs on Android](https://www.androidcentral.com/how-install-apk-files-android)

### Known Issues

- Document any Android-specific issues found during testing
- Document workarounds or fixes applied
- Note any platform differences from iOS

---

## Progress Tracking

**Last Updated:** {{date}}
**Current Phase:** Phase 1 - Core Features Testing
**Completion:** 0% (0/150+ items checked)

**Next Steps:**
1. Set up Android emulator OR build APK for remote testing (see Phase 3B)
2. If remote testing: Build APK and share with friend using one of the methods in Phase 3B
3. Begin Phase 1 testing (locally or coordinate with remote tester)
4. Document findings as you go
