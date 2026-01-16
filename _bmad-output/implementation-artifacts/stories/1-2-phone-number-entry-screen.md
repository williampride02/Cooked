---
title: "Story 1.2 - Phone Number Entry Screen"
aliases:
  - "Story 1.2"
  - "Phone Number Entry"
  - "Phone Auth Entry"
tags:
  - cooked
  - implementation
  - story
  - epic-1
  - authentication
  - onboarding
status: done
created: 2026-01-14
updated: 2026-01-14
epic: 1
story: 2
related:
  - "[[Architecture]]"
  - "[[UX Design]]"
  - "[[Epics]]"
  - "[[1-1-project-setup-and-design-system-foundation]]"
---

# Story 1.2: Phone Number Entry Screen

Status: done

## Story

As a **new user**,
I want **to enter my phone number to start the sign-up process**,
So that **I can create an account using my phone**.

## Acceptance Criteria

1. **AC1: Welcome Screen Navigation**
   - Given I am on the welcome screen (auth index)
   - When I tap "Get Started"
   - Then I am navigated to the phone number entry screen
   - And haptic feedback (light) triggers on button press

2. **AC2: Phone Number Entry Screen Layout**
   - Given I am on the phone number entry screen
   - When I view the screen
   - Then I see a back button in the header
   - And I see the heading "What's your number?"
   - And I see a country code picker (defaulting to +1 US)
   - And I see a phone number input field with placeholder "(555) 123-4567"
   - And I see helper text "We'll text you a code. Standard rates apply."
   - And I see a disabled "Continue" button

3. **AC3: Country Code Picker**
   - Given I am on the phone number entry screen
   - When I tap the country code selector
   - Then a bottom sheet opens with country options
   - And I can search for a country by name
   - And I can select a country code
   - And the selector updates to show the selected code with flag

4. **AC4: Phone Number Input Formatting**
   - Given I am entering my phone number
   - When I type digits
   - Then the input auto-formats as I type (e.g., "(555) 123-4567" for US)
   - And only numeric characters are accepted
   - And the keyboard is numeric type
   - And the maximum length respects E.164 format (15 digits max)

5. **AC5: Phone Number Validation**
   - Given I enter a phone number
   - When the number is valid E.164 format
   - Then the "Continue" button becomes enabled
   - And the input border shows success state (optional visual feedback)

   - Given I enter an invalid phone number
   - When the number is too short or malformed
   - Then the "Continue" button remains disabled
   - And I see an error message "Enter a valid phone number" (on blur or submit attempt)

6. **AC6: Submit Phone Number**
   - Given I have entered a valid phone number
   - When I tap "Continue"
   - Then the button shows a loading spinner
   - And the input is disabled during submission
   - And Supabase Auth `signInWithOtp` is called with the E.164 phone number
   - And on success, I am navigated to the code verification screen
   - And the phone number is passed to the verification screen

7. **AC7: Error Handling**
   - Given I tap Continue with a valid number
   - When Supabase returns an error (rate limit, invalid number, etc.)
   - Then I see an error toast/message with the error description
   - And the button returns to enabled state
   - And I can retry

8. **AC8: Back Navigation**
   - Given I am on the phone number entry screen
   - When I tap the back button
   - Then I am navigated back to the welcome screen

## Tasks / Subtasks

- [x] **Task 1: Create Phone Number Entry Screen** (AC: 2, 8)
  - [x] Create `src/app/(auth)/phone.tsx` file
  - [x] Implement screen layout with header and back navigation
  - [x] Add heading "What's your number?"
  - [x] Add helper text below input
  - [x] Use design system colors and typography from `lib/theme.ts`
  - [x] Ensure proper safe area handling

- [x] **Task 2: Create Country Code Picker Component** (AC: 3)
  - [x] Create `src/components/auth/CountryCodePicker.tsx`
  - [x] Implement bottom sheet with country list
  - [x] Add search/filter functionality
  - [x] Include common countries at top (US, CA, UK, AU)
  - [x] Store country data with code, name, dial code, flag emoji
  - [x] Handle selection and update parent state

- [x] **Task 3: Create Phone Number Input Component** (AC: 4)
  - [x] Create `src/components/auth/PhoneInput.tsx`
  - [x] Implement auto-formatting based on country code
  - [x] Use numeric keyboard (`keyboardType="phone-pad"`)
  - [x] Handle paste events and clean non-numeric characters
  - [x] Add proper accessibility labels

- [x] **Task 4: Implement Phone Number Validation** (AC: 5)
  - [x] Create `src/utils/phone.ts` with validation functions
  - [x] Implement E.164 format validation
  - [x] Implement country-specific length validation
  - [x] Export `formatPhoneNumber(number, countryCode)` helper
  - [x] Export `validatePhoneNumber(number, countryCode)` helper
  - [x] Export `toE164(number, countryCode)` converter

- [x] **Task 5: Implement Continue Button State** (AC: 5, 6)
  - [x] Add disabled state when phone number is invalid
  - [x] Add loading state during submission
  - [x] Add haptic feedback on press
  - [x] Style according to design system

- [x] **Task 6: Implement Supabase OTP Request** (AC: 6, 7)
  - [x] Create `src/hooks/usePhoneAuth.ts` hook
  - [x] Implement `requestOtp(phone: string)` function
  - [x] Call `supabase.auth.signInWithOtp({ phone })`
  - [x] Handle success - navigate to verify screen
  - [x] Handle errors - show toast and allow retry
  - [x] Return loading and error states

- [x] **Task 7: Update Welcome Screen Navigation** (AC: 1)
  - [x] Update `src/app/(auth)/index.tsx`
  - [x] Wire "Get Started" button to navigate to `/phone`
  - [x] Add haptic feedback on navigation

- [x] **Task 8: Create Verification Screen Placeholder** (AC: 6)
  - [x] Create `src/app/(auth)/verify.tsx` as placeholder
  - [x] Accept phone number as route param
  - [x] Display "Verification coming in Story 1.3" message
  - [x] Include back navigation

## Dev Notes

### Architecture Requirements (MUST FOLLOW)

**File Structure:**
```
src/
├── app/(auth)/
│   ├── index.tsx        # Welcome screen (update)
│   ├── phone.tsx        # NEW: Phone entry screen
│   └── verify.tsx       # NEW: Verification placeholder
├── components/auth/
│   ├── CountryCodePicker.tsx  # NEW
│   └── PhoneInput.tsx         # NEW
├── hooks/
│   └── usePhoneAuth.ts  # NEW
└── utils/
    └── phone.ts         # NEW: Phone validation
```

**Supabase Phone Auth:**
```typescript
// Request OTP
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+15551234567'  // E.164 format
});
```

**Expo Router Navigation:**
```typescript
import { router } from 'expo-router';

// Navigate to phone screen
router.push('/phone');

// Navigate to verify with params
router.push({
  pathname: '/verify',
  params: { phone: '+15551234567' }
});

// Go back
router.back();
```

### Design System Requirements (MUST FOLLOW)

**Phone Entry Screen Layout (from UX spec Section 4.1):**
```
┌─────────────────────────────┐
│  ←                          │
│                             │
│  What's your number?        │
│                             │
│  ┌─────────────────────┐    │
│  │ +1  │ (555) 123-4567│    │
│  └─────────────────────┘    │
│                             │
│  We'll text you a code.     │
│  Standard rates apply.      │
│                             │
│    [Continue Button]        │
│                             │
└─────────────────────────────┘
```

**Colors:**
- Background: `#0D0D0D` (background)
- Input background: `#1A1A1A` (surface)
- Input border: `#333333`, focus: `#FF4D00` (primary)
- Text: `#FFFFFF` (textPrimary)
- Helper text: `#A0A0A0` (textSecondary)
- Error text: `#FF3B3B` (danger)

**Typography:**
- Heading: H1 (24px, bold)
- Input text: Body (16px)
- Helper text: Body Small (14px)

**Spacing:**
- Screen padding: 16px horizontal
- Input height: 48px minimum (44pt touch target)
- Button: Full width, 48px height

### Testing Approach

- Verify navigation from welcome to phone screen
- Verify country picker opens and selections work
- Verify phone formatting for different country codes
- Verify validation enables/disables Continue button
- Verify loading state during OTP request
- Verify error handling shows appropriate message
- Verify successful OTP request navigates to verify screen
- Verify back navigation works correctly

### Dependencies

- expo-router (already installed)
- @supabase/supabase-js (already installed)
- expo-haptics (already installed)
- May need: country code data package or JSON file

### Accessibility Requirements

- Phone input must have accessible label
- Country picker must announce selected country
- Error messages must be announced
- Loading state must be communicated
- All touch targets minimum 44x44pt

### References

- [Source: planning-artifacts/epics.md#Story 1.2] - Story requirements
- [Source: planning-artifacts/architecture.md#6.1] - Phone Auth Flow
- [Source: planning-artifacts/ux-design.md#4.1] - Phone Entry Screen wireframe
- [Source: planning-artifacts/ux-design.md#3.5] - Input Fields design

## Senior Developer Review (AI)

**Reviewed:** 2026-01-14
**Reviewer:** Claude Opus 4.5 (Code Review Workflow)
**Outcome:** ✅ APPROVED (after fixes)

### Issues Found & Fixed

| Severity | Issue | File | Fix |
|----------|-------|------|-----|
| HIGH | Placeholder "(000) 000-0000" didn't match AC2 spec "(555) 123-4567" | PhoneInput.tsx:65 | Added `getPlaceholder()` helper |
| HIGH | Error messages not announced to screen readers | PhoneInput.tsx:78-80 | Added `accessibilityLiveRegion="polite"` |
| MEDIUM | Keyboard stays open on form submit | phone.tsx:56 | Added `Keyboard.dismiss()` |
| MEDIUM | Unused import `getPhoneValidationError` | PhoneInput.tsx:3 | Removed dead import |
| MEDIUM | Country picker button under 44pt touch target | PhoneInput.tsx:47 | Added `min-h-[44px]` |

### Issues Noted (Low - Not Fixed)

- Country search doesn't prioritize common countries (US, CA, UK, AU)
- No client-side rate limiting on OTP requests

### Verification

- TypeScript: ✅ No errors
- All HIGH/MEDIUM issues resolved

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript check passed with no errors
- Expo export build successful
- Installed missing babel-preset-expo dependency

### Completion Notes List

**Key Implementation Decisions:**

1. **Country Data**: Embedded country data in `src/utils/phone.ts` rather than using external package. Includes 25 common countries with dial codes, flag emojis, and phone formatting patterns.

2. **Phone Formatting**: Implemented country-specific phone formatting using format patterns (e.g., "(###) ###-####" for US). Auto-formats as user types.

3. **Validation**: E.164 format validation with country-specific length requirements. Continue button only enables when phone number is valid.

4. **Country Picker**: Modal-based bottom sheet with search functionality. Uses FlatList for efficient rendering of country list.

5. **Navigation**: Uses expo-router's `router.push()` and `router.back()` for navigation. Phone number passed to verify screen via route params.

6. **Error Handling**: usePhoneAuth hook handles Supabase errors with user-friendly messages. Displays errors below phone input.

### File List

**Created Files:**
- `src/app/(auth)/phone.tsx` - Phone number entry screen
- `src/app/(auth)/verify.tsx` - Verification screen placeholder
- `src/components/auth/PhoneInput.tsx` - Formatted phone input component
- `src/components/auth/CountryCodePicker.tsx` - Country selection modal
- `src/components/auth/index.ts` - Auth components barrel export
- `src/hooks/usePhoneAuth.ts` - Supabase OTP authentication hook
- `src/utils/phone.ts` - Phone validation and formatting utilities

**Modified Files:**
- `src/app/(auth)/index.tsx` - Added navigation to phone screen
- `src/hooks/index.ts` - Added usePhoneAuth export
- `src/utils/index.ts` - Added phone utilities export
- `package.json` - Added babel-preset-expo (dev dependency)

## Related Documents

- [[Architecture]] - Phone auth flow and Supabase integration
- [[UX Design]] - Phone entry screen wireframe
- [[Epics]] - All stories for Epic 1
- [[1-1-project-setup-and-design-system-foundation]] - Previous story (design system)
