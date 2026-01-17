---
title: "Story Web.1 - Web Dashboard, Groups, and Feed"
aliases:
  - "Story Web.1"
  - "Web Dashboard"
  - "Web Groups"
  - "Web Feed"
tags:
  - cooked
  - implementation
  - story
  - epic-web
  - web-app
  - dashboard
  - groups
  - feed
status: done
created: 2026-01-17
updated: 2026-01-17
epic: web
story: 1
related:
  - "[[Web App Design]]"
  - "[[Web App Auth Spec]]"
  - "[[Architecture]]"
---

# Story Web.1: Web Dashboard, Groups, and Feed

Status: done

## Story

As a **user accessing Cooked from the web**,
I want **to see my dashboard with groups and activity feed**,
So that **I can manage my accountability groups and see activity from my browser**.

## Acceptance Criteria

1. **AC1: Dashboard Empty State**
   - Given I am logged in and have no groups
   - When I view the dashboard
   - Then I see "Create a Group" and "Join with Link" options
   - And I see helper text about needing 3 friends

2. **AC2: Dashboard Auto-Redirect**
   - Given I am logged in and have groups
   - When I view the dashboard
   - Then I am automatically redirected to my first group's feed

3. **AC3: Create Group Page**
   - Given I am on the create group page
   - When I enter a group name (2-30 characters)
   - Then I can create the group
   - And I am navigated to the group invite screen

4. **AC4: Join Group Page**
   - Given I am on the join group page
   - When I enter a 6-character invite code
   - Then I can join the group
   - And I am navigated to the group feed

5. **AC5: Group Feed Display**
   - Given I am viewing a group feed
   - When the feed loads
   - Then I see check-in items with user info, status, and time
   - And I see an empty state if there's no activity
   - And I can create a pact via FAB button

6. **AC6: Feed Item Display**
   - Given I am viewing feed items
   - When a check-in item is displayed
   - Then I see user avatar, name, status (success/fold), pact name, and time ago
   - And I see excuse text for folds
   - And I see proof images when available

## Tasks / Subtasks

- [x] **Task 1: Create useGroups Hook**
  - [x] Create `apps/web/src/hooks/useGroups.ts`
  - [x] Implement `fetchUserGroups` function
  - [x] Implement `createGroup` function
  - [x] Implement `joinGroup` function

- [x] **Task 2: Update Dashboard Page**
  - [x] Update `apps/web/src/app/dashboard/page.tsx`
  - [x] Add groups fetching logic
  - [x] Add empty state UI (create/join options)
  - [x] Add auto-redirect to first group if groups exist

- [x] **Task 3: Create Group Page**
  - [x] Create `apps/web/src/app/create-group/page.tsx`
  - [x] Add group name input with validation (2-30 chars)
  - [x] Add character counter
  - [x] Add error handling
  - [x] Add navigation to invite screen on success

- [x] **Task 4: Join Group Page**
  - [x] Create `apps/web/src/app/join-group/page.tsx`
  - [x] Add invite code input (6 characters)
  - [x] Add auto-uppercase formatting
  - [x] Add URL parameter support (`?code=XXXXXX`)
  - [x] Add error handling
  - [x] Add navigation to group feed on success

- [x] **Task 5: Create useFeed Hook**
  - [x] Create `apps/web/src/hooks/useFeed.ts`
  - [x] Implement feed fetching with pagination
  - [x] Implement refresh functionality
  - [x] Implement load more functionality
  - [x] Filter check-ins by group ID

- [x] **Task 6: Create Group Feed Page**
  - [x] Create `apps/web/src/app/group/[id]/page.tsx`
  - [x] Add group header with name
  - [x] Add "Check In" button
  - [x] Add invite and settings buttons
  - [x] Add feed display with empty state
  - [x] Add FAB for creating pacts
  - [x] Add load more functionality

- [x] **Task 7: Create Feed Item Component**
  - [x] Create `apps/web/src/components/feed/FeedItem.tsx`
  - [x] Implement CheckInItem component
  - [x] Display user avatar, name, status
  - [x] Display pact name and time ago
  - [x] Display excuse for folds
  - [x] Display proof images

## Dev Notes

### Implementation Details

**Hooks Created:**
- `useGroups.ts` - Manages group operations (fetch, create, join)
- `useFeed.ts` - Manages feed fetching with pagination

**Pages Created:**
- `/dashboard` - Main dashboard with empty state or auto-redirect
- `/create-group` - Group creation form
- `/join-group` - Group joining with invite code
- `/group/[id]` - Group feed page

**Components Created:**
- `FeedItem.tsx` - Feed item display component

**Key Features:**
- Auto-redirect to first group if user has groups
- Empty state matching mobile app design
- Feed pagination with load more
- Check-in item display with all details
- Navigation between pages

### Project Structure Notes

- Web app uses Next.js 15 App Router
- Shared types from `@cooked/shared` package
- Tailwind CSS for styling (matches mobile design system)
- Supabase client for data fetching

### References

- [Source: planning-artifacts/web-app-design.md] - Web app architecture
- [Source: planning-artifacts/web-app-summary.md] - Web app overview
- [Source: apps/mobile/src/app/(main)/index.tsx] - Mobile dashboard reference
- [Source: apps/mobile/src/app/(main)/group/[id]/index.tsx] - Mobile feed reference

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250514)

### Completion Notes List

- Implemented web dashboard matching mobile app functionality
- Created hooks for groups and feed management
- Implemented all pages with proper navigation
- Feed items display correctly with all required information
- Empty states match mobile app design
- Auto-redirect works correctly when user has groups

### File List

- `apps/web/src/hooks/useGroups.ts` - Groups management hook
- `apps/web/src/hooks/useFeed.ts` - Feed management hook
- `apps/web/src/app/dashboard/page.tsx` - Updated dashboard
- `apps/web/src/app/create-group/page.tsx` - Create group page
- `apps/web/src/app/join-group/page.tsx` - Join group page
- `apps/web/src/app/group/[id]/page.tsx` - Group feed page
- `apps/web/src/components/feed/FeedItem.tsx` - Feed item component

## Related Documents

- [[Web App Design]] - Complete web app architecture
- [[Web App Auth Spec]] - Authentication implementation
- [[Architecture]] - Overall system architecture
