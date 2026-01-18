---
title: "Accountability System Status"
aliases:
  - "Cron Status"
  - "Accountability Status"
tags:
  - cooked
  - ops
  - accountability
  - status
status: active
created: 2026-01-20
---

# Accountability System Status

> **Last Updated**: 2026-01-20  
> **Status**: Edge Functions Deployed ✅ | Vault Secrets Pending ⏳

## Summary

The accountability system infrastructure is **deployed and ready**, but requires Vault secrets configuration to activate.

## ✅ Completed

### Edge Functions
- ✅ `check-in-reminder` - Deployed and active
- ✅ `missed-check-in-auto-fold` - Deployed and active  
- ✅ `generate-weekly-recap` - Deployed and active

### Cron Jobs
All cron jobs are **scheduled and active**:
- ✅ `check-in-reminder-0900` - Daily at 9 AM UTC
- ✅ `check-in-reminder-1200` - Daily at 12 PM UTC
- ✅ `check-in-reminder-1800` - Daily at 6 PM UTC
- ✅ `missed-check-in-auto-fold-0030` - Daily at 00:30 UTC
- ✅ `generate-weekly-recaps` - Sunday at 11 PM UTC

### Database Functions
- ✅ `trigger_check_in_reminder()` - Created
- ✅ `trigger_missed_check_in_auto_fold()` - Created
- ✅ `trigger_weekly_recap_generation()` - Created

### Documentation
- ✅ `docs/setup-accountability-cron.md` - Setup guide created
- ✅ `docs/ops-supabase-cron-edge-runbook.md` - Operations runbook exists

## ⏳ Pending (Manual Action Required)

### Vault Secrets
**Status**: Not configured  
**Impact**: Cron jobs will fail silently (log NOTICE messages but won't call Edge Functions)

**Required Secrets:**
1. `project_url` = `https://nxnhqtsfugikzykxwkxk.supabase.co`
2. `service_role_key` = [Get from Project Settings → API]

**Setup Instructions**: See `docs/setup-accountability-cron.md` Step 1

## 🔄 Next Steps

1. **Set Vault Secrets** (5 minutes)
   - Go to Supabase Dashboard → Project Settings → Vault
   - Create `project_url` and `service_role_key` secrets
   - See `docs/setup-accountability-cron.md` for details

2. **Test Cron Jobs** (10 minutes)
   ```sql
   -- Test check-in reminder
   SELECT public.trigger_check_in_reminder();
   
   -- Test auto-fold
   SELECT public.trigger_missed_check_in_auto_fold();
   
   -- Test weekly recap
   SELECT public.trigger_weekly_recap_generation();
   ```
   - Check Edge Function logs to verify execution
   - Verify no errors in Postgres logs

3. **Monitor Automatic Execution** (ongoing)
   - Wait for next scheduled run
   - Check Edge Function logs after scheduled time
   - Verify cron job history in `cron.job_run_details`

## 📊 System Architecture

```
┌─────────────────┐
│   pg_cron       │  Scheduled jobs (5 active)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Trigger Functions│  SQL functions that call Edge Functions
│ (3 functions)   │
└────────┬────────┘
         │
         │ Reads Vault secrets
         ▼
┌─────────────────┐
│  Edge Functions │  Deno functions (3 deployed)
│  (check-in-     │
│   reminder,     │
│   auto-fold,    │
│   recap)        │
└─────────────────┘
```

## 🐛 Troubleshooting

### Cron jobs not running
- **Check**: `SELECT active FROM cron.job WHERE jobname LIKE '%check-in%';`
- **Fix**: All should be `active = true`

### Edge Functions return 401/403
- **Cause**: Missing or incorrect `service_role_key` in Vault
- **Fix**: Verify secret matches Project Settings → API → service_role key

### Edge Functions return 500
- **Check**: Edge Function logs in Supabase Dashboard
- **Common causes**: Missing env vars, database errors, logic errors

### Silent failures (no logs)
- **Cause**: Vault secrets missing
- **Check**: Postgres logs for NOTICE messages like "missing project_url"
- **Fix**: Set Vault secrets (see setup guide)

## 📝 Related Documentation

- **Setup Guide**: `docs/setup-accountability-cron.md`
- **Operations Runbook**: `docs/ops-supabase-cron-edge-runbook.md`
- **Sprint Status**: `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Note**: All cron schedules are in UTC. Timezone-aware scheduling can be added later if needed.
