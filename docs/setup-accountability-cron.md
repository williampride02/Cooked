---
title: "Setup Accountability Cron Jobs"
aliases:
  - "Cron Setup Guide"
tags:
  - cooked
  - ops
  - accountability
  - cron
status: guide
created: 2026-01-20
---

# Setup Accountability Cron Jobs

This guide walks you through setting up Vault secrets so the accountability cron jobs can run automatically.

## Current Status

✅ **Cron Jobs Scheduled** (all active):
- `check-in-reminder-0900`: Daily at 9 AM UTC
- `check-in-reminder-1200`: Daily at 12 PM UTC  
- `check-in-reminder-1800`: Daily at 6 PM UTC
- `missed-check-in-auto-fold-0030`: Daily at 00:30 UTC
- `generate-weekly-recaps`: Sunday at 11 PM UTC

✅ **Edge Functions Deployed**:
- `check-in-reminder` ✅
- `missed-check-in-auto-fold` ✅
- `generate-weekly-recap` ✅

❌ **Vault Secrets Missing**:
- `project_url` (needed for cron triggers)
- `service_role_key` (needed for cron triggers)

## Step 1: Set Up Vault Secrets

The cron trigger functions need these secrets to call Edge Functions. You can set them via:

### Option A: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Vault**
3. Click **"Create new secret"**
4. Add these two secrets:

   **Secret 1:**
   - Name: `project_url`
   - Value: `https://nxnhqtsfugikzykxwkxk.supabase.co`
   - Description: "Supabase project URL for Edge Function calls"

   **Secret 2:**
   - Name: `service_role_key`
   - Value: `[Your service role key from Project Settings → API]`
   - Description: "Service role key for Edge Function authentication"

### Option B: Supabase CLI

```bash
# Set project URL
supabase secrets set project_url=https://nxnhqtsfugikzykxwkxk.supabase.co

# Set service role key (get it from Project Settings → API)
supabase secrets set service_role_key=your-service-role-key-here
```

## Step 2: Verify Secrets Are Set

Run this SQL query in Supabase SQL Editor:

```sql
SELECT name, created_at 
FROM vault.decrypted_secrets 
WHERE name IN ('project_url', 'service_role_key')
ORDER BY name;
```

You should see both secrets listed.

## Step 3: Test Cron Jobs Manually

### Test Check-in Reminder

```sql
-- Manually trigger the reminder function
SELECT public.trigger_check_in_reminder();
```

Check Edge Function logs for `check-in-reminder` to see if it executed successfully.

### Test Auto-Fold

```sql
-- Manually trigger auto-fold (for testing, you can pass a date)
SELECT public.trigger_missed_check_in_auto_fold();
```

Check Edge Function logs for `missed-check-in-auto-fold` to see if it executed successfully.

### Test Weekly Recap

```sql
-- Manually trigger weekly recap generation
SELECT public.trigger_weekly_recap_generation();
```

Check Edge Function logs for `generate-weekly-recap` to see if it executed successfully.

## Step 4: Monitor Cron Execution

### Check Cron Job History

```sql
-- View recent cron job executions
SELECT 
  jobid,
  jobname,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### Check Edge Function Logs

In Supabase Dashboard:
1. Go to **Edge Functions** → Select function (e.g., `check-in-reminder`)
2. Click **"Logs"** tab
3. Look for recent executions and any errors

### Check Postgres Logs

```sql
-- View recent NOTICE messages from cron triggers
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%trigger_%'
ORDER BY calls DESC;
```

Or check Supabase Dashboard → **Logs** → **Postgres** for NOTICE messages.

## Troubleshooting

### Issue: Cron jobs not running

**Check:**
1. Are cron jobs active? Run:
   ```sql
   SELECT jobid, jobname, active FROM cron.job;
   ```
   All should have `active = true`

2. Are Vault secrets set? (See Step 2)

3. Check Postgres logs for NOTICE messages:
   - "missing project_url" → Vault secret not set
   - "missing service role key" → Vault secret not set

### Issue: Edge Functions return 401/403

**Cause:** Service role key is incorrect or missing

**Fix:** Verify `service_role_key` in Vault matches the one from Project Settings → API

### Issue: Edge Functions return 500

**Check Edge Function logs** for:
- Missing environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- Database errors
- Logic errors in function code

## Expected Behavior

### Check-in Reminders
- **When:** 9 AM, 12 PM, 6 PM UTC daily
- **What:** Sends push notifications to users with active pacts due today who haven't checked in
- **Logs:** Check `check-in-reminder` Edge Function logs

### Auto-fold
- **When:** 00:30 UTC daily (for "yesterday" in UTC)
- **What:** Creates fold check-ins with "Ghosted 👻" excuse for missed check-ins, creates roast threads
- **Logs:** Check `missed-check-in-auto-fold` Edge Function logs

### Weekly Recaps
- **When:** Sunday 11 PM UTC
- **What:** Generates weekly recap data for all groups with activity
- **Logs:** Check `generate-weekly-recap` Edge Function logs

## Next Steps

After setting up Vault secrets:
1. ✅ Test each cron job manually (Step 3)
2. ✅ Verify logs show successful execution
3. ✅ Wait for next scheduled run and verify it executes automatically
4. ✅ Monitor for any errors in logs

---

**Note:** All cron schedules are in UTC. Consider timezone-aware scheduling in the future if needed.
