---
title: "Story 4.5 - Missed Check-in Auto-Fold"
aliases:
  - "Story 4.5"
  - "Missed Check-in Auto-Fold"
tags:
  - cooked
  - implementation
  - story
  - epic-4
  - backend
  - automation
status: ready-for-dev
created: 2026-01-16
updated: 2026-01-16
epic: 4
story: 5
related:
  - "[[Architecture]]"
  - "[[Epics]]"
---

# Story 4.5: Missed Check-in Auto-Fold

Status: ready-for-dev

## Story

As a **system**,
I want **to automatically mark missed check-ins as folds**,
So that **accountability is enforced even when users forget**.

## Acceptance Criteria

1. **AC1: Auto-Fold at Midnight**
   - Given a user has an active pact due today
   - When midnight local time passes with no check-in
   - Then the system creates a fold check-in automatically
   - And the excuse is set to "Ghosted 👻"
   - And a roast thread is created
   - And a fold item appears in the group feed

2. **AC2: User Notification**
   - Given a user was auto-folded
   - When they open the app the next day
   - Then they see a notification: "You ghosted yesterday"
   - And the fold appears in their check-in history

3. **AC3: Batch Processing**
   - Given the auto-fold runs
   - When it processes all due check-ins
   - Then it handles all pacts across all groups efficiently
   - And it completes within reasonable time limits

4. **AC4: Timezone Handling**
   - Given users in different timezones
   - When midnight passes in each timezone
   - Then auto-fold runs at the correct local midnight for each user
   - And no check-ins are missed or double-processed

## Tasks / Subtasks

- [ ] **Task 1: Create Edge Function for Auto-Fold** (AC: 1, 2, 3)
  - [ ] Create `supabase/functions/missed-check-in-auto-fold/index.ts`
  - [ ] Query all active pacts with check-ins due yesterday (by user timezone)
  - [ ] Filter out users who already checked in
  - [ ] Create fold check-in record for each missed check-in
  - [ ] Set excuse to "Ghosted 👻"
  - [ ] Create roast thread for each fold (reuse existing logic)
  - [ ] Create feed item for each fold

- [ ] **Task 2: Set Up Cron Job** (AC: 1, 4)
  - [ ] Configure Supabase cron to run daily at midnight UTC
  - [ ] Handle timezone conversion for each user
  - [ ] Process users in batches by timezone
  - [ ] Test cron execution

- [ ] **Task 3: Timezone Logic** (AC: 4)
  - [ ] Store user timezone in user settings
  - [ ] Query users grouped by timezone
  - [ ] Calculate "yesterday" for each timezone
  - [ ] Process each timezone group separately
  - [ ] Handle edge cases (DST, timezone changes)

- [ ] **Task 4: Integration with Existing Systems** (AC: 1)
  - [ ] Reuse roast thread creation logic from Story 5.1
  - [ ] Reuse feed item creation logic from Story 2.4
  - [ ] Ensure auto-fold check-ins are indistinguishable from manual folds
  - [ ] Update streak calculation to handle auto-folds

- [ ] **Task 5: User Notification** (AC: 2)
  - [ ] Send push notification when auto-fold occurs
  - [ ] Show in-app notification on next app open
  - [ ] Display auto-fold in check-in history
  - [ ] Mark auto-fold visually (optional: different icon or badge)

- [ ] **Task 6: Error Handling and Logging** (AC: 3)
  - [ ] Log each auto-fold operation
  - [ ] Handle errors gracefully (don't stop batch processing)
  - [ ] Send alerts for critical failures
  - [ ] Track processing time and performance

## Dev Notes

### Architecture Requirements

**Edge Function Location:**
- `supabase/functions/missed-check-in-auto-fold/index.ts`

**Database Operations:**
- Query `pacts` for active pacts
- Query `pact_participants` for users with due check-ins
- Query `check_ins` to verify if check-in exists for date
- Insert into `check_ins` table with status='fold', excuse='Ghosted 👻'
- Insert into `roast_threads` table (reuse logic from Story 5.1)
- Insert into feed (reuse logic from Story 2.4)

**Cron Configuration:**
- Run daily at midnight UTC (or multiple times for different timezones)
- Consider running hourly and checking if "yesterday" has passed for each timezone
- Alternative: Run once per hour, process users whose local midnight just passed

**Timezone Strategy:**
- Store user timezone in `users` table (e.g., "America/New_York")
- Use timezone-aware date calculations
- Process users in timezone groups to optimize queries

### Technical Notes

**From Epics:**
- Implements: FR-CHECKIN-005
- Creates: Edge Function for auto-fold cron job
- Runs: Daily at midnight (per user timezone or UTC)
- Excuse text: "Ghosted 👻"

**From Architecture:**
- Edge Functions run on Deno runtime
- Use Supabase client in Edge Function
- Batch processing for performance
- Consider rate limits and timeouts

**Integration Points:**
- Reuse roast thread creation from Story 5.1
- Reuse feed item creation from Story 2.4
- Update streak calculation (should reset on fold)
- Send notifications via Expo Push

**Performance Considerations:**
- Process in batches (e.g., 100 users at a time)
- Use database transactions for atomicity
- Consider parallel processing for different timezones
- Monitor execution time and optimize queries

### References

- [Source: planning-artifacts/epics.md#Story-4.5]
- [Source: planning-artifacts/architecture.md#Edge-Functions]
- [Source: planning-artifacts/prd.md#FR-CHECKIN-005]

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

TBD
