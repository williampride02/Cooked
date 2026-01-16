---
title: "Story 1.3 - SMS Code Verification"
aliases:
  - "Story 1.3"
  - "SMS Verification"
  - "OTP Verification"
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
story: 3
related:
  - "[[Architecture]]"
  - "[[UX Design]]"
  - "[[Epics]]"
  - "[[1-2-phone-number-entry-screen]]"
---

# Story 1.3: SMS Code Verification

Status: done

## Story

As a **user who requested an SMS code**,
I want **to enter the verification code I received**,
So that **I can verify my phone number and access my account**.

## Acceptance Criteria

1. **AC1: Code Entry Screen Layout**
   - Given I am on the code verification screen
   - When I view the screen
   - Then I see a back button in the header
   - And I see the heading "Enter the code"
   - And I see the subtitle "Sent to [masked phone number]"
   - And I see 6 individual input boxes for the code
   - And I see a disabled "Resend" link with countdown timer

2. **AC2: Code Input Behavior**
   - Given I am entering the verification code
   - When I type a digit
   - Then it appears in the current input box
   - And the cursor automatically moves to the next box
   - And I can use backspace to go back and correct digits
   - And the keyboard is numeric type

3. **AC3: Auto-Submit on Complete**
   - Given I have entered 5 digits
   - When I enter the 6th digit
   - Then the code is automatically submitted for verification
   - And I see a loading state while verifying

4. **AC4: Valid Code - New User**
   - Given I enter a valid 6-digit code
   - When Supabase verifies the code successfully
   - And I am a new user (no profile)
   - Then my session is created and stored
   - And I am navigated to the profile setup screen

5. **AC5: Valid Code - Existing User**
   - Given I enter a valid 6-digit code
   - When Supabase verifies the code successfully
   - And I am an existing user (has profile)
   - Then my session is created and stored
   - And I am navigated to the main app (home/feed)

6. **AC6: Invalid Code**
   - Given I enter an invalid code
   - When Supabase rejects the code
   - Then I see an error message "Invalid code. Please try again."
   - And the input boxes are cleared
   - And I can re-enter the code
   - And haptic error feedback triggers

7. **AC7: Expired Code**
   - Given my code has expired (10+ minutes old)
   - When I try to verify it
   - Then I see an error "Code expired. Please request a new one."
   - And the resend button becomes active

8. **AC8: Resend Code**
   - Given I am on the verification screen
   - When 60 seconds have passed since the code was sent
   - Then the "Resend" link becomes active
   - And when I tap "Resend", a new code is sent
   - And the countdown timer resets to 60 seconds
   - And I see confirmation "Code sent!"

9. **AC9: Back Navigation**
   - Given I am on the code verification screen
   - When I tap the back button
   - Then I am navigated back to the phone entry screen
   - And I can change my phone number if needed

## Tasks / Subtasks

- [x] **Task 1: Update Verify Screen Layout** (AC: 1, 9)
  - [x] Update `src/app/(auth)/verify.tsx` from placeholder to full implementation
  - [x] Add proper heading "Enter the code"
  - [x] Add subtitle with masked phone number
  - [x] Style according to design system
  - [x] Ensure proper safe area handling

- [x] **Task 2: Create OTP Input Component** (AC: 2, 3)
  - [x] Create `src/components/auth/OtpInput.tsx`
  - [x] Implement 6 individual TextInput boxes
  - [x] Handle auto-advance on digit entry
  - [x] Handle backspace navigation between boxes
  - [x] Use numeric keyboard
  - [x] Add proper accessibility labels
  - [x] Trigger onComplete callback when all 6 digits entered

- [x] **Task 3: Implement Code Verification** (AC: 3, 4, 5, 6, 7)
  - [x] Use existing `usePhoneAuth.verifyOtp()` from Story 1.2
  - [x] Add loading state during verification
  - [x] Handle success - check if new or existing user
  - [x] Handle invalid code error
  - [x] Handle expired code error
  - [x] Clear input and allow retry on error

- [x] **Task 4: Implement User Check After Verification** (AC: 4, 5)
  - [x] After successful verification, fetch user profile
  - [x] If no display_name, navigate to profile setup
  - [x] If has display_name, navigate to main app
  - [x] Update Zustand store with user and session

- [x] **Task 5: Implement Resend Code Feature** (AC: 8)
  - [x] Add 60-second countdown timer
  - [x] Disable resend link during countdown
  - [x] Enable resend link after countdown
  - [x] Call `requestOtp` again on resend
  - [x] Reset countdown after resend
  - [x] Show "Code sent!" confirmation

- [x] **Task 6: Create Profile Setup Placeholder** (AC: 4)
  - [x] Create `src/app/(auth)/profile-setup.tsx` as placeholder
  - [x] Display "Profile setup coming in Story 1.4" message
  - [x] Include basic layout structure

- [x] **Task 7: Add Session Persistence** (AC: 4, 5)
  - [x] Update Zustand store with session after verification
  - [x] Session already persists via AsyncStorage (from Supabase config)
  - [x] Verify session survives app restart

## Dev Notes

### Architecture Requirements (MUST FOLLOW)

**File Structure:**
```
src/
├── app/(auth)/
│   ├── verify.tsx         # UPDATE: Full verification screen
│   └── profile-setup.tsx  # NEW: Profile setup placeholder
├── components/auth/
│   └── OtpInput.tsx       # NEW: 6-digit OTP input
└── stores/
    └── app.ts             # UPDATE: Set user/session after verify
```

**Supabase OTP Verification:**
```typescript
// Verify OTP (already in usePhoneAuth hook)
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+15551234567',
  token: '123456',
  type: 'sms',
});

// Check if user has profile
const { data: profile } = await supabase
  .from('users')
  .select('display_name')
  .eq('id', data.user.id)
  .single();

const isNewUser = !profile?.display_name;
```

**Navigation After Verification:**
```typescript
import { router } from 'expo-router';

// New user - needs profile setup
router.replace('/profile-setup');

// Existing user - go to main app
router.replace('/(main)');
```

### Design System Requirements (MUST FOLLOW)

**Code Verification Screen Layout (from UX spec Section 4.1):**
```
┌─────────────────────────────┐
│  ←                          │
│                             │
│  Enter the code             │
│  Sent to +1 (555) ****4567  │
│                             │
│    ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐  │
│    │ │ │ │ │ │ │ │ │ │ │ │  │
│    └─┘ └─┘ └─┘ └─┘ └─┘ └─┘  │
│                             │
│  Didn't get it? Resend      │
│                             │
└─────────────────────────────┘
```

**OTP Input Box:**
- Size: 44x56px minimum (touch target compliant)
- Background: Surface (#1A1A1A)
- Border: #333333, focus: #FF4D00 (primary)
- Text: H1 size (24px), centered
- Spacing: 8px between boxes

**Colors:**
- Background: #0D0D0D
- Input background: #1A1A1A
- Input border: #333333, focus: #FF4D00
- Text: #FFFFFF
- Error text: #FF3B3B
- Disabled text: #666666

### Testing Approach

- Verify OTP input auto-advances correctly
- Verify backspace navigates backward
- Verify auto-submit triggers on 6th digit
- Verify loading state shows during verification
- Verify error handling for invalid/expired codes
- Verify resend countdown works correctly
- Verify navigation to correct screen based on user status
- Verify session persists after verification

### Dependencies

- expo-router (already installed)
- @supabase/supabase-js (already installed)
- expo-haptics (already installed)
- usePhoneAuth hook (from Story 1.2)

### References

- [Source: planning-artifacts/epics.md#Story 1.3] - Story requirements
- [Source: planning-artifacts/architecture.md#6.1] - Phone Auth Flow
- [Source: planning-artifacts/ux-design.md#4.1] - Code Verification Screen wireframe

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript check passed with no errors
- All tasks implemented in single session

### Completion Notes List

**Key Implementation Decisions:**

1. **OTP Input Component**: Custom 6-box input with auto-advance and backspace navigation. Uses refs array to manage focus between TextInput elements.

2. **Auto-Submit**: Code automatically submits when 6th digit entered via useEffect watching value length.

3. **User Detection**: After verification, queries users table for display_name to determine new vs existing user routing.

4. **Resend Cooldown**: 60-second countdown timer with useState and useEffect. Shows "Code sent!" confirmation message.

5. **Session Management**: Updates Zustand store with user and session after successful verification. Session persists via Supabase AsyncStorage config.

6. **Error Handling**: Clears input on error, shows error message with accessibility announcements, triggers haptic feedback.

### File List

**Created Files:**
- `src/app/(auth)/verify.tsx` - Full verification screen (replaced placeholder)
- `src/app/(auth)/profile-setup.tsx` - Profile setup placeholder
- `src/components/auth/OtpInput.tsx` - 6-digit OTP input component

**Modified Files:**
- `src/components/auth/index.ts` - Added OtpInput export

## Related Documents

- [[Architecture]] - Phone auth flow and Supabase integration
- [[UX Design]] - Code verification screen wireframe
- [[Epics]] - All stories for Epic 1
- [[1-2-phone-number-entry-screen]] - Previous story (phone entry)
