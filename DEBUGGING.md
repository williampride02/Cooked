# Debugging Guide for Cooked App Authentication

## Quick Diagnostic Queries

Run these in Supabase SQL Editor to check the state of your database:

### 1. Check Auth Users vs Profiles
```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.users) as total_public_users,
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as confirmed_auth_users;
```

### 2. Find Auth Users Without Profiles
```sql
SELECT 
  au.id,
  au.email,
  au.created_at,
  'MISSING PROFILE' as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;
```

### 3. Find Profiles Without Auth Users
```sql
SELECT 
  pu.id,
  pu.email,
  pu.display_name,
  pu.created_at,
  'ORPHANED PROFILE' as status
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL
ORDER BY pu.created_at DESC;
```

### 4. Check for Email Conflicts
```sql
SELECT 
  email,
  COUNT(*) as count,
  array_agg(id ORDER BY created_at) as user_ids
FROM public.users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;
```

### 5. Recent Signup Attempts
```sql
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  CASE 
    WHEN pu.id IS NOT NULL THEN 'HAS PROFILE'
    ELSE 'NO PROFILE'
  END as profile_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;
```

## Full Diagnostic Script

See `diagnostics.sql` in the project root for a comprehensive set of diagnostic queries.

## Checking Logs

### Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Logs** > **Postgres Logs**
3. Filter for `handle_new_user` to see trigger execution logs
4. Look for `RAISE LOG` messages from the trigger function

### Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `[SIGNUP]` prefixed log messages
4. These show the signup flow step-by-step

## Common Issues

### Issue: Auth user created but no profile
**Symptoms:**
- User appears in `auth.users` but not in `public.users`
- Signup succeeds but user can't access app

**Debug:**
```sql
-- Check if trigger is active
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check trigger function
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

**Solution:**
- Check Postgres logs for trigger errors
- Verify trigger is enabled (`tgenabled = 'O'`)
- Check for unique constraint violations

### Issue: Profile created but no auth user
**Symptoms:**
- Profile exists in `public.users` but no matching `auth.users` record
- Usually indicates seed data or manual inserts

**Debug:**
```sql
-- Find orphaned profiles
SELECT * FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;
```

**Solution:**
- These are likely seed data users
- They won't be able to authenticate
- Consider cleaning them up or creating matching auth users

### Issue: Duplicate email errors
**Symptoms:**
- Signup fails with "duplicate key value violates unique constraint"
- Error in browser console or Supabase logs

**Debug:**
```sql
-- Find duplicate emails
SELECT email, COUNT(*) as count, array_agg(id) as ids
FROM public.users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;
```

**Solution:**
- The trigger should handle this automatically
- If it doesn't, check Postgres logs for trigger execution
- May need to clean up duplicate profiles

## Testing Signup Flow

1. **Clear browser console** before testing
2. **Open Network tab** in DevTools to see API calls
3. **Try signing up** with a new email
4. **Check console logs** for `[SIGNUP]` messages
5. **Check Supabase logs** for trigger execution
6. **Run diagnostic queries** to verify state

## Trigger Logging

The trigger function now logs:
- When it's triggered
- What user data it receives
- Whether conflicts are detected
- What action it takes
- Any errors encountered

Look for these in Postgres logs:
- `handle_new_user triggered for auth user: ...`
- `Profile already exists for id=...`
- `Email ... already exists for user id=...`
- `Profile created successfully for id=...`
- `Unique violation caught for id=...`

## Getting Help

When reporting issues, include:
1. Browser console logs (especially `[SIGNUP]` messages)
2. Supabase Postgres logs (filtered for `handle_new_user`)
3. Results of diagnostic queries
4. What you expected vs what happened
