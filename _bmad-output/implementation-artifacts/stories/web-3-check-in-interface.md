---
title: "Story Web.3: Check-in Interface"
status: ready-for-dev
created: 2026-01-18
---

## Summary
Enable **web** users to complete daily check-ins for pacts (success/fold), including excuse selection and proof upload, with a clear path to see check-in history.

## Acceptance Criteria (from `epics.md`)
- From a group, user can get to a **list of pacts due today** and mark each **Success** or **Fold**.
- **Fold**: choose excuse (preset or custom), record fold, create roast thread.
- **Success**: optionally upload proof photo, record success.
- User can view **check-in history** when viewing a pact.

## Current Implementation Notes (already exists / partial)
- **Due-today pacts + Success/Fold actions**: `apps/web/src/app/group/[id]/pacts/page.tsx`
- **Check-in submit UI** (status, excuses, proof file upload): `apps/web/src/app/group/[id]/pact/[pactId]/check-in/page.tsx`
- **Insert check-in + upload proof to Storage**: `apps/web/src/hooks/useCheckIns.ts`
- **Fold → roast thread created**: `apps/web/src/hooks/useCheckIns.ts` (creates `roast_threads`)

## Gaps to Close
- Pact detail page does **not** show check-in history today.
  - Pact detail: `apps/web/src/app/group/[id]/pact/[pactId]/page.tsx` (stats only; no history list)

## Tasks
- Add a “Recent check-ins” section to the pact detail page (paginate or cap to last N).
- Ensure proof thumbnails render using signed URLs (reuse logic from `useFeed` or centralize).
- Ensure permissions/RLS allow reading check-ins for group members (verify in Supabase policies).

