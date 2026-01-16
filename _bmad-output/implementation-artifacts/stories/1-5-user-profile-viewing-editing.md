---
title: "Story 1.5 - User Profile Viewing and Editing"
aliases:
  - "Story 1.5"
  - "Profile Editing"
  - "Settings Screen"
tags:
  - cooked
  - implementation
  - story
  - epic-1
  - authentication
  - settings
status: done
created: 2026-01-14
updated: 2026-01-14
epic: 1
story: 5
related:
  - "[[Architecture]]"
  - "[[UX Design]]"
  - "[[Epics]]"
  - "[[1-4-profile-setup]]"
---

# Story 1.5: User Profile Viewing and Editing

Status: done

## Story

As an **existing user**,
I want **to view and edit my profile information**,
So that **I can keep my information up to date**.

## Acceptance Criteria

1. **AC1: Profile Screen Layout**
   - Given I am logged in
   - When I navigate to the profile/settings screen
   - Then I see my current avatar (large)
   - And I see my display name
   - And I see my phone number (masked as +1 ****1234)
   - And I see "Member since [date]" formatted nicely
   - And I see an "Edit Profile" button

2. **AC2: Change Avatar**
   - Given I am on the profile screen
   - When I tap on my avatar (or Edit Profile)
   - Then I can select a new photo from camera or gallery
   - And the new photo is uploaded to Supabase Storage
   - And my avatar is updated
   - And I see a success confirmation

3. **AC3: Edit Display Name**
   - Given I am on the profile screen
   - When I tap on my display name (or Edit Profile)
   - Then I can edit it inline or in a modal
   - And the name must be 2-20 characters
   - And I see character count feedback
   - And the change is saved when I tap done

4. **AC4: Profile Update Success**
   - Given I have made changes
   - When I save my profile
   - Then the changes are persisted to the database
   - And I see a success confirmation
   - And haptic feedback triggers

5. **AC5: Profile Update Error**
   - Given I try to save changes and an error occurs
   - When the save fails
   - Then I see an error message
   - And my previous data is preserved

6. **AC6: Navigation**
   - Given I am on the main app
   - When I tap the profile icon in the header
   - Then I am navigated to the profile screen
   - And I can go back to the main app

## Tasks / Subtasks

- [ ] **Task 1: Create Profile Screen** (AC: 1, 6)
  - [ ] Create `src/app/(main)/profile.tsx`
  - [ ] Add large avatar display
  - [ ] Add display name
  - [ ] Add masked phone number
  - [ ] Add "Member since" date
  - [ ] Add navigation from main screen

- [ ] **Task 2: Create useProfile Hook** (AC: 1)
  - [ ] Create `src/hooks/useProfile.ts`
  - [ ] Fetch user profile from Supabase
  - [ ] Cache profile data
  - [ ] Provide loading and error states

- [ ] **Task 3: Implement Avatar Editing** (AC: 2)
  - [ ] Reuse AvatarPicker component
  - [ ] Handle avatar upload
  - [ ] Update avatar_url in database
  - [ ] Show success feedback

- [ ] **Task 4: Implement Name Editing** (AC: 3)
  - [ ] Add edit mode for display name
  - [ ] Validate 2-20 character limit
  - [ ] Save changes to database
  - [ ] Show character counter

- [ ] **Task 5: Add Profile Navigation** (AC: 6)
  - [ ] Add profile button to main screen header
  - [ ] Navigate to profile screen on tap

## Dev Notes

### Architecture Requirements (MUST FOLLOW)

**File Structure:**
```
src/
├── app/(main)/
│   ├── index.tsx          # UPDATE: Add profile button to header
│   └── profile.tsx        # NEW: Profile/settings screen
└── hooks/
    └── useProfile.ts      # NEW: Profile data hook
```

**Fetch User Profile:**
```typescript
const { data: profile } = await supabase
  .from('users')
  .select('id, phone, display_name, avatar_url, created_at')
  .eq('id', userId)
  .single();
```

**Update User Profile:**
```typescript
// Reuse updateUserProfile from utils/image.ts
import { updateUserProfile, uploadAvatar } from '@/utils/image';
```

### Design System Requirements (MUST FOLLOW)

**Profile Screen Layout (from UX spec):**
```
┌─────────────────────────────┐
│  ←  Profile                 │
│─────────────────────────────│
│                             │
│     [Large Avatar]          │
│     Your Name               │
│     +1 ****1234             │
│     Member since Jan 2026   │
│                             │
│     [Edit Profile]          │
│                             │
└─────────────────────────────┘
```

**Avatar Size:** 96px (XL size from design system)

**Masked Phone Format:** +1 ****1234 (show last 4 digits only)

**Member Since Format:** "Member since Jan 2026"

### Dependencies

- expo-image-picker (already installed)
- expo-image-manipulator (already installed)
- AvatarPicker component (from Story 1.4)
- updateUserProfile, uploadAvatar (from utils/image.ts)

### Testing Approach

- Verify profile data loads correctly
- Verify avatar can be changed
- Verify display name can be edited with validation
- Verify changes persist to database
- Verify masked phone number displays correctly
- Verify member since date formats correctly

### References

- [Source: planning-artifacts/epics.md#Story 1.5] - Story requirements
- [Source: planning-artifacts/ux-design.md] - Profile screen wireframe
- [Source: planning-artifacts/architecture.md] - User profile structure

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

- [[Architecture]] - User profile structure
- [[UX Design]] - Profile screen wireframe
- [[Epics]] - All stories for Epic 1
- [[1-4-profile-setup]] - Previous story (profile setup)
