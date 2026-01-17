---
title: "Story 4.4 - Check-in Reminder Notifications"
aliases:
  - "Story 4.4"
  - "Check-in Reminder Notifications"
tags:
  - cooked
  - implementation
  - story
  - epic-4
  - notifications
  - backend
status: ready-for-dev
created: 2026-01-16
updated: 2026-01-16
epic: 4
story: 4
related:
  - "[[Architecture]]"
  - "[[Epics]]"
---

# Story 4.4: Check-in Reminder Notifications

Status: ready-for-dev

## Story

As a **pact participant**,
I want **to receive reminders to check in**,
So that **I don't forget my daily commitment**.

## Acceptance Criteria

1. **AC1: Default Reminder Time**
   - Given I have active pacts
   - When my reminder time arrives (default 8 PM local)
   - Then I receive a push notification: "Clock's ticking... ⏰"

2. **AC2: Customizable Reminder Time**
   - Given I want to customize my reminder time
   - When I go to Settings > Notifications
   - Then I can set my preferred reminder time
   - And the reminder time is saved to my user preferences

3. **AC3: Last Chance Notification**
   - Given I receive a reminder and haven't checked in
   - When 11 PM arrives
   - Then I receive a "last chance" notification
   - And the notification text is appropriate for urgency

4. **AC4: Deep Link from Notification**
   - Given I tap the reminder notification
   - When the app opens
   - Then I am taken directly to my pacts list
   - And the app highlights pacts that need check-in

## Tasks / Subtasks

- [ ] **Task 1: Create Edge Function for Reminder Scheduling** (AC: 1, 2, 3)
  - [ ] Create `supabase/functions/check-in-reminder/index.ts`
  - [ ] Implement logic to query users with active pacts due today
  - [ ] Filter by user's reminder time preference (default 8 PM)
  - [ ] Send push notifications via Expo Push API
  - [ ] Handle timezone conversion (user local time)

- [ ] **Task 2: Set Up Cron Job for Reminder Function** (AC: 1, 3)
  - [ ] Configure Supabase cron to run every hour
  - [ ] Check if current hour matches user's reminder time
  - [ ] Schedule "last chance" notification at 11 PM
  - [ ] Test cron execution

- [ ] **Task 3: Update Notification Preferences** (AC: 2)
  - [ ] Add reminder_time field to user settings/notification preferences
  - [ ] Update notification preferences UI to include time picker
  - [ ] Save preference to database
  - [ ] Validate time format and range

- [ ] **Task 4: Implement Deep Linking** (AC: 4)
  - [ ] Configure notification payload with deep link to pacts screen
  - [ ] Handle notification tap in app
  - [ ] Navigate to pacts list on notification open
  - [ ] Highlight pacts needing check-in

- [ ] **Task 5: Notification Content** (AC: 1, 3)
  - [ ] Create notification templates with roasty copy
  - [ ] Include pact name in notification if single pact
  - [ ] Handle multiple pacts: "You have X pacts waiting"
  - [ ] Test notification delivery

## Dev Notes

### Architecture Requirements

**Edge Function Location:**
- `supabase/functions/check-in-reminder/index.ts`

**Database Queries:**
- Query `pacts` table for active pacts
- Query `pact_participants` to get users with due check-ins
- Query `users` table for notification preferences and push tokens
- Query `check_ins` to verify if user already checked in today

**Push Notification Setup:**
- Requires Expo Push Notification tokens stored in database
- Use Expo Push API to send notifications
- Handle token refresh and invalid tokens

**Cron Configuration:**
- Set up in Supabase dashboard or via migration
- Run every hour to check for reminder times
- Consider timezone handling (user's local time vs UTC)

### Technical Notes

**From Epics:**
- Implements: FR-CHECKIN-004
- Requires: Expo Push Notifications setup
- Default reminder time: 8 PM local
- Last chance notification: 11 PM local

**From Architecture:**
- Edge Functions run on Deno runtime
- Use Supabase client in Edge Function
- Store push tokens in `users` table or separate `push_tokens` table
- Timezone handling: store user timezone preference, convert UTC to local

**Notification Preferences:**
- Add to existing notification preferences structure
- Store as time string (e.g., "20:00" for 8 PM)
- Validate 24-hour format
- Default to "20:00" if not set

### References

- [Source: planning-artifacts/epics.md#Story-4.4]
- [Source: planning-artifacts/architecture.md#Edge-Functions]
- [Source: planning-artifacts/prd.md#FR-CHECKIN-004]

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

TBD
