---
title: "Story Web.5: Roast Threads (Web)"
status: ready-for-dev
created: 2026-01-18
---

## Summary
Allow web users to open a roast thread from a fold, view responses, and participate with feature gating based on roast level.

## Acceptance Criteria (from `epics.md`)
- From a fold check-in, user can open the roast thread and see responses.
- User can post **text, GIF, or image** responses and react with emojis.
- Roast-level enforcement (Mild/Medium/Nuclear) and ability to mute as needed.

## Current Implementation Notes (already exists / partial)
- Web roast thread page exists, supports **text posting** + realtime insert refresh:
  - `apps/web/src/app/roast/[checkInId]/page.tsx`
- Fold → roast thread is created during check-in flow:
  - `apps/web/src/hooks/useCheckIns.ts`

## Gaps to Close
- No GIF/image posting on web roast page.
- No emoji reactions on roast responses on web.
- No roast-level enforcement UI/logic on web.
- No “mute thread” UI on web (mobile supports it).

## Tasks
- Add media posting (GIF + image upload) on web roast thread.
- Add reaction bar for roast responses (reuse DB `reactions` table).
- Enforce roast-level capabilities (hide/disable controls based on pact roast_level).
- Add mute/close controls if required by product spec (and ensure RLS allows it).

