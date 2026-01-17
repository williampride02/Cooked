---
title: "Story Web.2 - Pacts Management"
aliases:
  - "Story Web.2"
  - "Web Pacts"
  - "Web Pacts Management"
tags:
  - cooked
  - implementation
  - story
  - epic-web
  - web-app
  - pacts
status: review
created: 2026-01-17
updated: 2026-01-17
epic: web
story: 2
related:
  - "[[Web App Design]]"
  - "[[Epics]]"
  - "[[Architecture]]"
---

# Story Web.2: Pacts Management

Status: review

## Story

As a **user on the web app**,
I want **to view, create, and manage pacts**,
So that **I can set up accountability pacts from my browser**.

## Acceptance Criteria

1. **AC1: View Pacts List**
   - Given I am viewing a group
   - When I navigate to pacts
   - Then I see a list of all active pacts in the group
   - And I can see pact details (name, frequency, roast level, participants)
   - And I can see which pacts are due today
   - And I can see which pacts I've already checked in for today

2. **AC2: Create Pact Form**
   - Given I am viewing the pacts list
   - When I tap "Create Pact"
   - Then I see a form to create a new pact
   - And I can set name (2-50 characters)
   - And I can set description (optional)
   - And I can set frequency (daily, weekly, custom)
   - And I can set roast level (1-3: Mild, Medium, Nuclear)
   - And I can set proof requirements (none, optional, required)
   - And I can select pact type (individual, group, relay)
   - And I can select participants from group members
   - And I can set relay day assignments for relay pacts

3. **AC3: Pact Creation Success**
   - Given I submit a valid pact form
   - When the pact is created
   - Then the pact appears in the pacts list
   - And I am navigated to the pact detail view
   - And all selected participants are added to the pact

4. **AC4: View Pact Details**
   - Given I am viewing a pact
   - When I tap on a pact
   - Then I see pact details (name, description, frequency, roast level, participants)
   - And I can see participant list with avatars
   - And I can see pact statistics (if available)

5. **AC5: Edit Pact (Creator Only)**
   - Given I am viewing a pact I created
   - When I tap "Edit"
   - Then I can modify pact settings (name, description, proof requirements)
   - And I can add new participants
   - And I can update relay day assignments
   - And changes are saved successfully

6. **AC6: Archive Pact (Creator Only)**
   - Given I am viewing a pact I created
   - When I tap "Archive"
   - Then I see a confirmation dialog
   - And when I confirm, the pact is archived
   - And the pact no longer appears in active pacts list
   - And pact history is preserved

7. **AC7: Pact Statistics**
   - Given I am viewing a pact
   - When I view pact statistics
   - Then I see completion rates per participant
   - And I see streaks (current and longest)
   - And I see total check-ins (success and fold counts)
   - And I see overall completion rate

8. **AC8: Free Tier Limit Enforcement**
   - Given I am on the free tier
   - When I try to create a pact and I already have 3 active pacts
   - Then I see a message about the limit
   - And I am prompted to upgrade to Premium

## Tasks / Subtasks

- [x] **Task 1: Create usePacts Hook for Web**
  - [x] Create `apps/web/src/hooks/usePacts.ts`
  - [x] Implement `fetchGroupPacts` function (fetch all pacts for a group)
  - [x] Implement `fetchPact` function (fetch single pact with participants)
  - [x] Implement `createPact` function (create new pact with participants)
  - [x] Implement `updatePact` function (update pact settings, add participants)
  - [x] Implement `archivePact` function (archive pact, preserve history)
  - [x] Add error handling and loading states
  - [x] Reuse types from `@cooked/shared` package

- [x] **Task 2: Create Pacts List Page**
  - [x] Create `apps/web/src/app/group/[id]/pacts/page.tsx`
  - [x] Add header with "My Pacts" title and back button
  - [x] Add "Create Pact" button
  - [x] Display pacts list with sections:
    - [x] "Due Today" section (pacts due today, not checked in)
    - [x] "Completed Today" section (pacts already checked in)
    - [x] "Not Due Today" section (other active pacts)
  - [x] Show pact details: name, frequency, roast level emoji, status badge
  - [x] Add empty state when no pacts exist
  - [x] Add refresh functionality
  - [x] Make pacts clickable to navigate to detail view

- [x] **Task 3: Create Pact Detail Page**
  - [x] Create `apps/web/src/app/group/[id]/pact/[pactId]/page.tsx`
  - [x] Display pact header with name and description
  - [x] Display pact settings (frequency, roast level, proof required, pact type)
  - [x] Display participant list with avatars and names
  - [x] Add "View Statistics" toggle/button
  - [x] Add "Edit" button (only for creator)
  - [x] Add "Archive" button (only for creator)
  - [x] Add back navigation

- [x] **Task 4: Create Pact Statistics Component**
  - [x] Create `apps/web/src/components/pacts/PactStats.tsx`
  - [x] Display overall completion rate
  - [x] Display participant stats table:
    - [x] Participant name and avatar
    - [x] Total check-ins (success + fold)
    - [x] Success count
    - [x] Fold count
    - [x] Completion rate percentage
    - [x] Current streak
    - [x] Longest streak
  - [x] Style with Tailwind CSS matching design system

- [x] **Task 5: Create Create Pact Page**
  - [x] Create `apps/web/src/app/group/[id]/create-pact/page.tsx`
  - [x] Add form fields:
    - [x] Pact name input (2-50 chars, with counter)
    - [x] Description textarea (optional)
    - [x] Frequency selector (daily, weekly, custom)
    - [x] Custom frequency day picker (if custom selected)
    - [x] Roast level selector (1-3 with emoji indicators)
    - [x] Proof required selector (none, optional, required)
    - [x] Pact type selector (individual, group, relay)
    - [x] Participant multi-select (from group members)
    - [x] Relay day assignments (if relay type, per participant)
  - [x] Add form validation
  - [x] Add error handling
  - [x] Add loading states
  - [x] Navigate to pact detail on success
  - [x] Check free tier limit before allowing creation

- [x] **Task 6: Create Edit Pact Page**
  - [x] Create `apps/web/src/app/group/[id]/pact/[pactId]/edit/page.tsx`
  - [x] Pre-fill form with existing pact data
  - [x] Allow editing: name, description, proof requirements
  - [x] Allow adding new participants (not removing)
  - [x] Allow updating relay day assignments
  - [x] Add save and cancel buttons
  - [x] Navigate back to pact detail on save
  - [x] Show confirmation dialog on cancel if changes made

- [x] **Task 7: Create Pact Limit Hook**
  - [x] Create `apps/web/src/hooks/usePactLimit.ts`
  - [x] Fetch current pact count for group
  - [x] Check subscription status (free vs premium)
  - [x] Return: currentCount, maxCount, canCreate, isLoading
  - [x] Use FREE_TIER_LIMITS from `@cooked/shared`

- [x] **Task 8: Update Group Feed Navigation**
  - [x] Update `apps/web/src/app/group/[id]/page.tsx`
  - [x] Update "Check In" button to navigate to `/group/[id]/pacts`
  - [x] Update FAB "Create Pact" button to navigate to `/group/[id]/create-pact`
  - [x] Add navigation to pacts list from group feed

## Dev Notes

### Implementation Details

**Hooks to Create:**
- `usePacts.ts` - Complete pact management (create, read, update, archive)
- `usePactLimit.ts` - Free tier limit checking

**Pages to Create:**
- `/group/[id]/pacts` - Pacts list page
- `/group/[id]/pact/[pactId]` - Pact detail page
- `/group/[id]/create-pact` - Create pact form
- `/group/[id]/pact/[pactId]/edit` - Edit pact form

**Components to Create:**
- `PactStats.tsx` - Statistics display component

**Key Patterns from Mobile:**
- Mobile uses `usePacts` hook with comprehensive pact management
- Mobile has `usePactLimit` hook for free tier checking
- Mobile pacts screen shows sections: due today, completed, not due
- Mobile create pact form is complex with all options
- Mobile pact detail shows stats toggle, edit, archive options

### Project Structure Notes

- Web app uses Next.js 15 App Router
- Shared types from `@cooked/shared` package (Pact, PactWithParticipants, etc.)
- Tailwind CSS for styling (matches mobile design system)
- Supabase client for data fetching
- Follow same patterns as mobile app for consistency

### Database Schema

Pacts table structure (from mobile implementation):
- `id`, `group_id`, `name`, `description`, `frequency`, `frequency_days`, `roast_level`, `proof_required`, `pact_type`, `created_by`, `start_date`, `end_date`, `status`

Pact participants table:
- `pact_id`, `user_id`, `relay_days`, `joined_at`

### Free Tier Limits

From `@cooked/shared`:
- `FREE_TIER_LIMITS.max_pacts_per_group = 3`
- Premium users have unlimited pacts

### References

- [Source: planning-artifacts/epics.md#Story Web.2] - Story requirements
- [Source: planning-artifacts/web-app-design.md#Phase 2] - Implementation priority
- [Source: apps/mobile/src/hooks/usePacts.ts] - Mobile pact hook implementation
- [Source: apps/mobile/src/app/(main)/group/[id]/pacts.tsx] - Mobile pacts list screen
- [Source: apps/mobile/src/app/(main)/group/[id]/pact/[pactId]/index.tsx] - Mobile pact detail screen
- [Source: apps/mobile/src/app/(main)/group/[id]/create-pact.tsx] - Mobile create pact form
- [Source: apps/mobile/src/hooks/useSubscription.ts#usePactLimit] - Mobile pact limit hook
- [Source: packages/shared/src/types.ts] - Shared Pact types

### Previous Story Intelligence (Web.1)

**Learnings:**
- Web hooks follow same pattern as mobile but use `supabase.auth.getUser()` instead of Zustand store
- Pages use Next.js App Router with `useParams()` for dynamic routes
- Components use Tailwind CSS classes matching mobile design system
- Navigation uses Next.js `useRouter()` and `router.push()`
- Empty states match mobile app design patterns

**Files Created:**
- `apps/web/src/hooks/useGroups.ts` - Pattern for web hooks
- `apps/web/src/hooks/useFeed.ts` - Pattern for pagination
- `apps/web/src/app/group/[id]/page.tsx` - Pattern for group pages

**Patterns to Follow:**
- Use `'use client'` directive for all pages
- Use `export const dynamic = 'force-dynamic'` for pages
- Error handling with user-friendly messages
- Loading states with spinners
- Empty states with helpful messaging

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250514)

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- Created comprehensive pact management system for web app matching mobile app functionality
- Implemented all 8 tasks with full feature parity
- All acceptance criteria satisfied:
  - AC1: View Pacts List - Implemented with sections for due today, completed, and not due
  - AC2: Create Pact Form - Full form with all fields including relay day assignments
  - AC3: Pact Creation Success - Navigates to detail view on success
  - AC4: View Pact Details - Complete detail page with all information
  - AC5: Edit Pact - Full edit functionality for creators
  - AC6: Archive Pact - Archive with confirmation dialog
  - AC7: Pact Statistics - Comprehensive stats component with participant breakdown
  - AC8: Free Tier Limit - Enforced via usePactLimit hook

**Key Features:**
- Full CRUD operations for pacts (create, read, update, archive)
- Support for all pact types (individual, group, relay)
- Relay day assignment interface
- Free tier limit enforcement
- Statistics display with completion rates and streaks
- Responsive design matching mobile app patterns

**Technical Notes:**
- Reused shared types from `@cooked/shared` package
- Followed same patterns as mobile app for consistency
- Used Tailwind CSS for styling matching design system
- Implemented proper error handling and loading states
- All hooks follow web app patterns (using `supabase.auth.getUser()` instead of Zustand)

### File List

**New Files:**
- `apps/web/src/hooks/usePacts.ts` - Main pact management hook
- `apps/web/src/hooks/usePactLimit.ts` - Free tier limit checking hook
- `apps/web/src/hooks/usePactsWithStatus.ts` - Hook for fetching pacts with check-in status
- `apps/web/src/hooks/usePactStats.ts` - Hook for fetching pact statistics
- `apps/web/src/utils/pactUtils.ts` - Utility functions for pact logic (isPactDueToday, getTodayDate)
- `apps/web/src/app/group/[id]/pacts/page.tsx` - Pacts list page
- `apps/web/src/app/group/[id]/pact/[pactId]/page.tsx` - Pact detail page
- `apps/web/src/app/group/[id]/create-pact/page.tsx` - Create pact form page
- `apps/web/src/app/group/[id]/pact/[pactId]/edit/page.tsx` - Edit pact form page
- `apps/web/src/components/pacts/PactStats.tsx` - Pact statistics display component

**Modified Files:**
- `apps/web/src/app/group/[id]/page.tsx` - Updated navigation (already had correct routes)
