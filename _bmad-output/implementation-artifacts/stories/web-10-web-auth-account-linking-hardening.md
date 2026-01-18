---
title: "Story Web.10: Web Auth + Account Linking Hardening"
status: ready-for-dev
created: 2026-01-18
---

## Summary
Make web authentication and email/phone account linking robust, predictable, and easy to recover from edge cases (duplicate email/phone, partial profiles, invite flows).

## Why
We’ve had multiple “profile not found / duplicate constraint” issues historically; the goal is to harden flows and add clearer user-facing errors.

## Key References
- Web auth pages:
  - `apps/web/src/app/login/page.tsx`
  - `apps/web/src/app/signup/page.tsx`
  - `apps/web/src/app/settings/page.tsx`
- Components:
  - `apps/web/src/components/auth/LinkAccountForm.tsx`
  - `apps/web/src/components/auth/OtpVerificationForm.tsx`
- DB trigger:
  - `supabase/migrations/20260117000000_add_user_profile_trigger.sql`

## Tasks
- Review and document supported linking paths (email→phone, phone→email).
- Add resilient UI state + better error surfacing for linking failures.
- Add a small diagnostic surface in Settings (read-only) to show linked methods detected (email/phone present).

