---
title: "Story Web.9: Supabase Cron + Edge Functions Productionize"
status: ready-for-dev
created: 2026-01-18
---

## Summary
Make scheduled jobs and Edge Functions reliably work in the target Supabase project (dev/staging/prod) with correct secrets and observability.

## Scope
- Verify/standardize Vault secrets usage: `project_url`, `service_role_key`
- Verify cron jobs exist and run (reminders, auto-fold, weekly recap)
- Add a lightweight runbook/checklist for deployment + debugging

## Key References
- Migrations:
  - `supabase/migrations/20260118010000_add_cron_jobs_for_checkins.sql`
  - `supabase/migrations/20260114000004_add_weekly_recap_cron.sql`
- Functions:
  - `supabase/functions/check-in-reminder/index.ts`
  - `supabase/functions/missed-check-in-auto-fold/index.ts`
  - `supabase/functions/generate-weekly-recap/index.ts`
  - `supabase/functions/send-notification/index.ts`

## Tasks
- Confirm Vault secrets are set in the correct Supabase project.
- Confirm cron schedules exist and are executing (and not erroring).
- Add a short “ops checklist” doc under repo `docs/` (no secrets committed).

