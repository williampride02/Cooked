---
title: "Ops Runbook: Supabase Cron + Edge Functions"
aliases:
  - "Cron Runbook"
  - "Edge Functions Runbook"
tags:
  - cooked
  - ops
  - supabase
  - cron
  - edge-functions
status: draft
created: 2026-01-18
---

## Why this doc exists
Cooked relies on **scheduled jobs** (cron) and **Edge Functions** for:
- Daily check-in reminders
- Auto-folding missed check-ins
- Weekly recap generation

When these “background systems” fail, the app can look like it’s working while accountability silently breaks. This runbook is the “single place” to validate the pipeline end-to-end.

## Ground truth: where cron + functions are defined

### Cron schedules (SQL migrations)
- `supabase/migrations/20260118010000_add_cron_jobs_for_checkins.sql`
- `supabase/migrations/20260114000004_add_weekly_recap_cron.sql`

### Edge Functions (Deno)
- `supabase/functions/check-in-reminder/index.ts`
- `supabase/functions/missed-check-in-auto-fold/index.ts`
- `supabase/functions/generate-weekly-recap/index.ts`
- `supabase/functions/send-notification/index.ts`

## Required secrets (Vault)
These cron trigger functions are hardened to read secrets from **Supabase Vault**.

You must set:
- `project_url`: the Supabase project URL (same as your client URL)
- `service_role_key`: service role key (used to call Edge Functions from cron)

### Expectations
- Secrets exist in Vault in the **target** project (dev/staging/prod as appropriate).
- Secrets are **not** stored in repo files.

## Quick checklist (most common failures)
- **Cron schedule exists** (migration applied in the target project)
- **Vault secrets exist** (`project_url`, `service_role_key`)
- **Edge Functions are deployed** (function exists and is callable)
- **RLS doesn’t block the function’s DB writes** (functions should use service role)
- **Timezone assumptions are acceptable** (most cron schedules are UTC unless you explicitly adjust)

## Validation steps

### 1) Confirm cron schedules exist
In Supabase SQL editor, confirm `cron.job` contains the jobs (names from migrations).

If jobs are missing:
- migration not applied
- cron extension not enabled in the project
- migration executed on a different branch/project

### 2) Confirm Vault secrets exist
In the Supabase dashboard:
- Vault → Secrets
- Verify `project_url` and `service_role_key` exist

If missing:
- cron triggers will fail when they try to read Vault secrets

### 3) Confirm Edge Functions are deployed
In Supabase dashboard:
- Edge Functions → confirm these exist:
  - `check-in-reminder`
  - `missed-check-in-auto-fold`
  - `generate-weekly-recap`
  - `send-notification`

If missing:
- cron can “fire” but nothing happens because the endpoint isn’t deployed

### 4) Confirm logs show executions
Check logs for:
- `postgres` (cron trigger SQL runs)
- `edge-function` (function invoked and returns 2xx)

Typical failure patterns:
- 401/403: wrong auth header / verify_jwt mismatch
- 500: function throws (missing env, DB error)
- silent: cron not installed, schedule not created, or not running

## Notes on environments
This repo supports multiple environments, but **cron + vault are per Supabase project**.
- Dev project != Prod project
- A branch DB != the main DB

Always confirm you’re looking at the correct project ref before “fixing” anything.

