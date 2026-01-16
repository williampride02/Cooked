---
title: "Story 1.4 - Profile Setup"
aliases:
  - "Story 1.4"
  - "Profile Setup"
  - "Onboarding Profile"
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
story: 4
related:
  - "[[Architecture]]"
  - "[[UX Design]]"
  - "[[Epics]]"
  - "[[1-3-sms-code-verification]]"
---

# Story 1.4: Profile Setup

Status: done

## Story

As a **new user who verified their phone**,
I want **to set up my profile with a display name and optional photo**,
So that **my friends can recognize me in the app**.

## Acceptance Criteria

1. **AC1: Profile Setup Screen Layout**
   - Given I am on the profile setup screen
   - When I view the screen
   - Then I see a back button in the header
   - And I see a tappable avatar placeholder with "tap to add photo" text
   - And I see the heading "What should we call you?"
   - And I see a text input for display name
   - And I see helper text "This is how friends will see you in roast threads."
   - And I see a "Let's Go" button

2. **AC2: Avatar Photo Selection**
   - Given I tap the avatar placeholder
   - When the image picker opens
   - Then I see options to choose from camera or gallery
   - And I can cancel and return to the profile setup screen

3. **AC3: Avatar Image Processing**
   - Given I select an image from camera or gallery
   - When the image is processed
   - Then the image is cropped to a square
   - And the image is compressed to max 1MB
   - And the image is displayed in the avatar area

4. **AC4: Avatar Upload to Storage**
   - Given I have selected an avatar image
   - When I complete my profile (tap "Let's Go")
   - Then the image is uploaded to Supabase Storage (avatars bucket)
   - And the avatar_url is saved to my user profile

5. **AC5: Display Name Input Validation**
   - Given I am entering my display name
   - When I type in the input
   - Then I see a character count indicator (X/20)
   - And the input enforces 2-20 character limit
   - And I see an error if name is less than 2 characters
   - And I see an error if name exceeds 20 characters

6. **AC6: Let's Go Button State**
   - Given I am on the profile setup screen
   - When my display name is empty or invalid
   - Then the "Let's Go" button is disabled
   - And when my display name is valid (2-20 chars)
   - Then the "Let's Go" button is enabled

7. **AC7: Profile Save Success**
   - Given I have a valid display name (avatar optional)
   - When I tap "Let's Go"
   - Then I see a loading state
   - And my display_name is saved to the users table
   - And my avatar_url is saved (if I selected an avatar)
   - And I am navigated to the create/join group screen
   - And haptic success feedback triggers

8. **AC8: Profile Save Error**
   - Given I tap "Let's Go" and an error occurs
   - When the save fails
   - Then I see an error message
   - And I remain on the profile setup screen
   - And I can retry

9. **AC9: Back Navigation**
   - Given I am on the profile setup screen
   - When I tap the back button
   - Then I am navigated back (sign out and return to phone entry)
   - And my session is cleared

## Tasks / Subtasks

- [ ] **Task 1: Update Profile Setup Screen** (AC: 1, 6, 9)
  - [ ] Update `src/app/(auth)/profile-setup.tsx` from placeholder to full implementation
  - [ ] Add proper heading "What should we call you?"
  - [ ] Add helper text
  - [ ] Add back button with sign-out behavior
  - [ ] Style according to design system

- [ ] **Task 2: Create Avatar Picker Component** (AC: 2)
  - [ ] Create `src/components/auth/AvatarPicker.tsx`
  - [ ] Implement tappable avatar placeholder
  - [ ] Show camera/gallery options via action sheet
  - [ ] Use expo-image-picker for image selection
  - [ ] Add proper accessibility labels

- [ ] **Task 3: Implement Image Processing** (AC: 3, 4)
  - [ ] Create `src/utils/image.ts` for image utilities
  - [ ] Implement image cropping to square
  - [ ] Implement image compression to max 1MB
  - [ ] Implement upload to Supabase Storage avatars bucket
  - [ ] Return public URL after upload

- [ ] **Task 4: Create Display Name Input** (AC: 5)
  - [ ] Create or use existing TextInput with character counter
  - [ ] Show character count (X/20)
  - [ ] Validate min 2, max 20 characters
  - [ ] Show error state for invalid input

- [ ] **Task 5: Implement Profile Save** (AC: 7, 8)
  - [ ] Save display_name to users table
  - [ ] Upload avatar and save avatar_url if selected
  - [ ] Handle loading state
  - [ ] Handle errors gracefully
  - [ ] Navigate to create/join group on success

- [ ] **Task 6: Create Group Selection Placeholder** (AC: 7)
  - [ ] Create `src/app/(main)/index.tsx` as placeholder
  - [ ] Show create/join group options (placeholder UI)
  - [ ] Will be fully implemented in Epic 2

## Dev Notes

### Architecture Requirements (MUST FOLLOW)

**File Structure:**
```
src/
├── app/(auth)/
│   └── profile-setup.tsx  # UPDATE: Full profile setup screen
├── app/(main)/
│   └── index.tsx          # NEW: Main app entry (placeholder)
├── components/auth/
│   └── AvatarPicker.tsx   # NEW: Avatar selection component
└── utils/
    └── image.ts           # NEW: Image processing utilities
```

**Supabase Storage Setup:**
```typescript
// Avatar upload path: avatars/{userId}/{timestamp}.jpg
const filePath = `${userId}/${Date.now()}.jpg`;

const { error } = await supabase.storage
  .from('avatars')
  .upload(filePath, file, {
    contentType: 'image/jpeg',
    upsert: true,
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(filePath);
```

**User Profile Update:**
```typescript
const { error } = await supabase
  .from('users')
  .update({
    display_name: displayName,
    avatar_url: avatarUrl,
  })
  .eq('id', userId);
```

**Navigation After Profile Setup:**
```typescript
import { router } from 'expo-router';

// Navigate to main app (create/join group)
router.replace('/(main)');
```

### Design System Requirements (MUST FOLLOW)

**Profile Setup Screen Layout (from UX spec Section 4.1):**
```
┌─────────────────────────────┐
│  ←                          │
│                             │
│     [Avatar Upload]         │
│     (tap to add photo)      │
│                             │
│  What should we call you?   │
│                             │
│  ┌─────────────────────────┐│
│  │ Display name        X/20││
│  └─────────────────────────┘│
│                             │
│  This is how friends will   │
│  see you in roast threads.  │
│                             │
│    [Let's Go Button]        │
│                             │
└─────────────────────────────┘
```

**Avatar Placeholder:**
- Size: 100x100px (or similar, large enough to tap easily)
- Background: Surface (#1A1A1A)
- Border: Dashed, #333333
- Icon: "+" or camera icon in center
- Text below: "tap to add photo" in text-muted

**Button State:**
- Disabled: bg-surface, text-muted
- Enabled: bg-primary (#FF4D00), text-white

**Colors:**
- Background: #0D0D0D
- Input background: #1A1A1A
- Input border: #333333, focus: #FF4D00
- Text: #FFFFFF
- Helper text: #999999
- Error text: #FF3B3B

### Dependencies

- expo-image-picker (install if needed)
- expo-image-manipulator (for cropping/compression)
- expo-router (already installed)
- @supabase/supabase-js (already installed)
- expo-haptics (already installed)

### Testing Approach

- Verify avatar picker opens camera/gallery options
- Verify image is cropped to square
- Verify image compression reduces size appropriately
- Verify display name validation (2-20 chars)
- Verify character counter updates correctly
- Verify button disabled/enabled state
- Verify profile save success navigation
- Verify error handling
- Verify back button signs out and returns to phone entry

### References

- [Source: planning-artifacts/epics.md#Story 1.4] - Story requirements
- [Source: planning-artifacts/architecture.md#6.1] - User Profile Flow
- [Source: planning-artifacts/ux-design.md#4.1] - Profile Setup Screen wireframe

## Dev Agent Record

### Agent Model Used

(To be filled after implementation)

### Debug Log References

(To be filled after implementation)

### Completion Notes List

(To be filled after implementation)

### File List

(To be filled after implementation)

## Related Documents

- [[Architecture]] - Storage configuration and user profile
- [[UX Design]] - Profile setup screen wireframe
- [[Epics]] - All stories for Epic 1
- [[1-3-sms-code-verification]] - Previous story (SMS verification)
