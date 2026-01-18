---
title: "Story Web.12: Subscription End-to-End (RevenueCat → Supabase → Web Gating)"
status: ready-for-dev
created: 2026-01-18
---

## Summary
Ensure premium subscriptions update correctly from RevenueCat and are enforced consistently in both mobile + web.

## Key References
- Mobile purchase flow:
  - `apps/mobile/src/app/(main)/group/[id]/upgrade.tsx`
  - `apps/mobile/src/lib/revenuecat.ts`
- Webhook:
  - `supabase/functions/revenuecat-webhook/index.ts`
- DB:
  - `groups.subscription_status`, `groups.subscription_expires_at` (see migrations)
- Gating logic:
  - Mobile: `apps/mobile/src/hooks/useSubscription.ts`
  - Web: `apps/web/src/hooks/usePactLimit.ts` (and any group-limit gating)

## Tasks
- Verify webhook deployment and auth (signature verification if enabled).
- Ensure webhook updates group subscription fields correctly for renew/cancel/expire.
- Ensure web UI enforces premium gating consistently (pacts, recap history, etc.).
- Add a small “subscription status” readout in group settings (admin-only).

