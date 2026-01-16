---
title: "Story 1.6 - Account Deletion"
aliases:
  - "Story 1.6"
  - "Account Deletion"
  - "Delete Account"
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
story: 6
related:
  - "[[Architecture]]"
  - "[[UX Design]]"
  - "[[Epics]]"
  - "[[1-5-user-profile-viewing-editing]]"
---

# Story 1.6: Account Deletion

Status: done

## Story

As a **user who wants to leave the platform**,
I want **to delete my account and all my data**,
So that **my information is removed from the system**.

## Acceptance Criteria

1. **AC1: Delete Account Button**
   - Given I am on the profile/settings screen
   - When I view the account section
   - Then I see a "Delete Account" button

2. **AC2: Confirmation Dialog**
   - Given I tap "Delete Account"
   - When the dialog appears
   - Then I see a warning explaining what will happen
   - And I see "Cancel" and "Delete" buttons
   - And the delete button is styled as destructive (red)

3. **AC3: Account Deletion Success**
   - Given I confirm account deletion
   - When the deletion is processed
   - Then I am logged out immediately
   - And I am navigated to the welcome/phone screen
   - And I see a confirmation message

4. **AC4: Account Deletion Cancellation**
   - Given I see the confirmation dialog
   - When I tap "Cancel"
   - Then nothing happens
   - And I remain on the profile screen

5. **AC5: Deletion Processing**
   - Given I confirm deletion
   - When the system processes my request
   - Then my user record is marked for deletion
   - And I am removed from all groups (future - for now just sign out)
   - And my data will be purged within 30 days

## Tasks / Subtasks

- [ ] **Task 1: Add Delete Account Button to Profile** (AC: 1)
  - [ ] Update `src/app/(main)/profile.tsx`
  - [ ] Add "Delete Account" button in account section
  - [ ] Style as danger/destructive action

- [ ] **Task 2: Implement Deletion Confirmation** (AC: 2, 4)
  - [ ] Show Alert with warning message
  - [ ] Handle Cancel action
  - [ ] Handle Delete action

- [ ] **Task 3: Implement Account Deletion** (AC: 3, 5)
  - [ ] Call Supabase to delete user data (soft delete via update)
  - [ ] Sign out user
  - [ ] Navigate to welcome screen

## Dev Notes

### Architecture Requirements (MUST FOLLOW)

**File Structure:**
```
src/
└── app/(main)/
    └── profile.tsx  # UPDATE: Add delete account functionality
```

**Soft Delete Approach:**
For MVP, we'll use soft delete - marking the user's account as deleted rather than immediately purging data. This allows for:
- Recovery if needed
- Proper cleanup via backend job
- Maintaining referential integrity

```typescript
// Mark user as deleted
await supabase
  .from('users')
  .update({
    deleted_at: new Date().toISOString(),
    display_name: 'Deleted User',
    avatar_url: null,
  })
  .eq('id', userId);

// Sign out
await supabase.auth.signOut();
```

**Confirmation Dialog Content:**
```
Title: "Delete Account?"

Message:
"This will permanently delete your account and all your data.
You will be removed from all groups and your check-in history
will be anonymized. This action cannot be undone."

Buttons: [Cancel] [Delete Account]
```

### Design System Requirements (MUST FOLLOW)

**Delete Account Button:**
- Background: transparent
- Text: #FF3B3B (danger color)
- Position: At bottom of profile screen, clearly separated

**Confirmation Dialog:**
- Native Alert.alert on both platforms
- Cancel button: default style
- Delete button: destructive style (red)

### Dependencies

- expo-router (already installed)
- @supabase/supabase-js (already installed)
- expo-haptics (already installed)

### Testing Approach

- Verify delete button appears on profile screen
- Verify confirmation dialog shows correct warning
- Verify cancel returns to profile without changes
- Verify delete signs out and navigates to welcome
- Verify user data is soft-deleted

### References

- [Source: planning-artifacts/epics.md#Story 1.6] - Story requirements
- [Source: planning-artifacts/ux-design.md] - Settings screen wireframe
- [Source: planning-artifacts/architecture.md] - User management

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

- [[Architecture]] - User management and soft delete
- [[UX Design]] - Settings screen wireframe
- [[Epics]] - All stories for Epic 1
- [[1-5-user-profile-viewing-editing]] - Previous story (profile editing)
