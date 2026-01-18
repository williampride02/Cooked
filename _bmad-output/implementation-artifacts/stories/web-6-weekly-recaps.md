---
title: "Story Web.6: Weekly Recaps (Web)"
status: ready-for-dev
created: 2026-01-18
---

## Summary
Allow web users to view weekly recaps and share a recap card image.

## Acceptance Criteria (from `epics.md`)
- Recap appears as a feed item and can be opened.
- Recap detail shows awards, stats, highlights, leaderboard.
- User can generate a **shareable recap card image** and download/copy it.

## Current Implementation Notes (already exists / partial)
- Recaps list + detail pages exist:
  - `apps/web/src/app/group/[id]/recaps/page.tsx`
  - `apps/web/src/app/group/[id]/recaps/[recapId]/page.tsx`
- Recap fetch hook exists:
  - `apps/web/src/hooks/useRecaps.ts`

## Gaps to Close
- No shareable image generation on web recap detail.
- Feed doesn’t currently include a recap feed-item type on web (feed is check-ins only).

## Tasks
- Implement “Share recap” on web:
  - Generate a recap card image (client canvas or server-side) and enable download/copy.
- Ensure recaps can surface in the dashboard feed (either via feed_events table or multi-table feed query).

