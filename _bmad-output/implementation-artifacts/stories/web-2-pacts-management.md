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
status: ready-for-dev
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

Status: ready-for-dev

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

- [ ] **Task 1: Create usePacts Hook for Web**
  - [ ] Create `apps/web/src/hooks/usePacts.ts`
  - [ ] Implement `fetchGroupPacts` function (fetch all pacts for a group)
  - [ ] Implement `fetchPact` function (fetch single pact with participants)
  - [ ] Implement `createPact` function (create new pact with participants)
  - [ ] Implement `updatePact` function (update pact settings, add participants)
  - [ ] Implement `archivePact` function (archive pact, preserve history)
  - [ ] Add error handling and loading states
  - [ ] Reuse types from `@cooked/shared` package

- [ ] **Task 2: Create Pacts List Page**
  - [ ] Create `apps/web/src/app/group/[id]/pacts/page.tsx`
  - [ ] Add header with "My Pacts" title and back button
  - [ ] Add "Create Pact" button
  - [ ] Display pacts list with sections:
    - [ ] "Due Today" section (pacts due today, not checked in)
    - [ ] "Completed Today" section (pacts already checked in)
    - [ ] "Not Due Today" section (other active pacts)
  - [ ] Show pact details: name, frequency, roast level emoji, status badge
  - [ ] Add empty state when no pacts exist
  - [ ] Add refresh functionality
  - [ ] Make pacts clickable to navigate to detail view

- [ ] **Task 3: Create Pact Detail Page**
  - [ ] Create `apps/web/src/app/group/[id]/pact/[pactId]/page.tsx`
  - [ ] Display pact header with name and description
  - [ ] Display pact settings (frequency, roast level, proof required, pact type)
  - [ ] Display participant list with avatars and names
  - [ ] Add "View Statistics" toggle/button
  - [ ] Add "Edit" button (only for creator)
  - [ ] Add "Archive" button (only for creator)
  - [ ] Add back navigation

- [ ] **Task 4: Create Pact Statistics Component**
  - [ ] Create `apps/web/src/components/pacts/PactStats.tsx`
  - [ ] Display overall completion rate
  - [ ] Display participant stats table:
    - [ ] Participant name and avatar
    - [ ] Total check-ins (success + fold)
    - [ ] Success count
    - [ ] Fold count
    - [ ] Completion rate percentage
    - [ ] Current streak
    - [ ] Longest streak
  - [ ] Style with Tailwind CSS matching design system

- [ ] **Task 5: Create Create Pact Page**
  - [ ] Create `apps/web/src/app/group/[id]/create-pact/page.tsx`
  - [ ] Add form fields:
    - [ ] Pact name input (2-50 chars, with counter)
    - [ ] Description textarea (optional)
    - [ ] Frequency selector (daily, weekly, custom)
    - [ ] Custom frequency day picker (if custom selected)
    - [ ] Roast level selector (1-3 with emoji indicators)
    - [ ] Proof required selector (none, optional, required)
    - [ ] Pact type selector (individual, group, relay)
    - [ ] Participant multi-select (from group members)
    - [ ] Relay day assignments (if relay type, per participant)
  - [ ] Add form validation
  - [ ] Add error handling
  - [ ] Add loading states
  - [ ] Navigate to pact detail on success
  - [ ] Check free tier limit before allowing creation

- [ ] **Task 6: Create Edit Pact Page**
  - [ ] Create `apps/web/src/app/group/[id]/pact/[pactId]/edit/page.tsx`
  - [ ] Pre-fill form with existing pact data
  - [ ] Allow editing: name, description, proof requirements
  - [ ] Allow adding new participants (not removing)
  - [ ] Allow updating relay day assignments
  - [ ] Add save and cancel buttons
  - [ ] Navigate back to pact detail on save
  - [ ] Show confirmation dialog on cancel if changes made

- [ ] **Task 7: Create Pact Limit Hook**
  - [ ] Create `apps/web/src/hooks/usePactLimit.ts`
  - [ ] Fetch current pact count for group
  - [ ] Check subscription status (free vs premium)
  - [ ] Return: currentCount, maxCount, canCreate, isLoading
  - [ ] Use FREE_TIER_LIMITS from `@cooked/shared`

- [ ] **Task 8: Update Group Feed Navigation**
  - [ ] Update `apps/web/src/app/group/[id]/page.tsx`
  - [ ] Update "Check In" button to navigate to `/group/[id]/pacts`
  - [ ] Update FAB "Create Pact" button to navigate to `/group/[id]/create-pact`
  - [ ] Add navigation to pacts list from group feed

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

### File List
