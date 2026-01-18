---
title: "Story Web.4: Real-time Feed Updates"
status: ready-for-dev
created: 2026-01-18
---

## Summary
Make the web activity feed feel “live”: updates should appear without refresh for check-ins and other key activity types.

## Acceptance Criteria (from `epics.md`)
- Feed updates automatically when a **new check-in** is posted.
- Feed updates when a **new member joins** (shows “member joined” item).
- Feed updates when a **new pact is created** (shows “pact created” item).
- Visual indicator of new activity (web UX).

## Current Implementation Notes (already exists / partial)
- Web feed subscribes to realtime **INSERT on `check_ins`** and refreshes: `apps/web/src/hooks/useFeed.ts`

## Gaps to Close
- Feed currently renders **check-ins only** (no member-joined / pact-created items on web).
- No explicit “new activity” indicator besides refreshed list.

## Tasks
- Decide canonical feed item source for web:
  - Option A: Expand feed to include more tables (e.g., `group_members`, `pacts`) and map to `FeedItem`.
  - Option B: Create a unified `feed_events` table populated by triggers.
- Add realtime subscriptions for those additional event sources.
- Add a subtle “New activity” indicator/toast when items arrive (avoid scroll-jank).

