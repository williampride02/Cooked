-- ============================================
-- COOKED APP DIAGNOSTIC QUERIES
-- ============================================
-- Run these queries in Supabase SQL Editor to debug authentication issues
-- ============================================

-- ============================================
-- 1. AUTH USERS vs PUBLIC USERS OVERVIEW
-- ============================================
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.users) as total_public_users,
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as confirmed_auth_users,
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL) as unconfirmed_auth_users;

-- ============================================
-- 2. AUTH USERS WITHOUT PROFILES
-- ============================================
SELECT 
  au.id,
  au.email,
  au.phone,
  au.email_confirmed_at,
  au.created_at,
  'MISSING PROFILE' as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- ============================================
-- 3. PROFILES WITHOUT AUTH USERS
-- ============================================
SELECT 
  pu.id,
  pu.email,
  pu.phone,
  pu.display_name,
  pu.created_at,
  'ORPHANED PROFILE' as status
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL
ORDER BY pu.created_at DESC;

-- ============================================
-- 4. EMAIL CONFLICTS (same email, different IDs)
-- ============================================
SELECT 
  pu1.id as profile_id_1,
  pu1.email,
  pu1.display_name as name_1,
  pu1.created_at as created_1,
  au1.id as auth_id_1,
  au1.email_confirmed_at as confirmed_1,
  pu2.id as profile_id_2,
  pu2.display_name as name_2,
  pu2.created_at as created_2,
  au2.id as auth_id_2,
  au2.email_confirmed_at as confirmed_2
FROM public.users pu1
JOIN public.users pu2 ON pu1.email = pu2.email AND pu1.id != pu2.id
LEFT JOIN auth.users au1 ON pu1.id = au1.id
LEFT JOIN auth.users au2 ON pu2.id = au2.id
WHERE pu1.email IS NOT NULL
ORDER BY pu1.email, pu1.created_at;

-- ============================================
-- 5. PHONE CONFLICTS (same phone, different IDs)
-- ============================================
SELECT 
  pu1.id as profile_id_1,
  pu1.phone,
  pu1.display_name as name_1,
  pu1.created_at as created_1,
  au1.id as auth_id_1,
  pu2.id as profile_id_2,
  pu2.display_name as name_2,
  pu2.created_at as created_2,
  au2.id as auth_id_2
FROM public.users pu1
JOIN public.users pu2 ON pu1.phone = pu2.phone AND pu1.id != pu2.id
LEFT JOIN auth.users au1 ON pu1.id = au1.id
LEFT JOIN auth.users au2 ON pu2.id = au2.id
WHERE pu1.phone IS NOT NULL
ORDER BY pu1.phone, pu1.created_at;

-- ============================================
-- 6. RECENT AUTH USERS (last 10)
-- ============================================
SELECT 
  au.id,
  au.email,
  au.phone,
  au.email_confirmed_at,
  au.phone_confirmed_at,
  au.created_at,
  CASE 
    WHEN pu.id IS NOT NULL THEN 'HAS PROFILE'
    ELSE 'NO PROFILE'
  END as profile_status,
  pu.display_name,
  pu.email as profile_email,
  pu.phone as profile_phone
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;

-- ============================================
-- 7. RECENT PROFILES (last 10)
-- ============================================
SELECT 
  pu.id,
  pu.email,
  pu.phone,
  pu.display_name,
  pu.created_at,
  CASE 
    WHEN au.id IS NOT NULL THEN 'HAS AUTH USER'
    ELSE 'NO AUTH USER'
  END as auth_status,
  au.email_confirmed_at,
  au.created_at as auth_created_at
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
ORDER BY pu.created_at DESC
LIMIT 10;

-- ============================================
-- 8. CHECK TRIGGER EXISTS AND IS ACTIVE
-- ============================================
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  t.tgenabled as is_enabled,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created'
  AND t.tgrelid = 'auth.users'::regclass;

-- ============================================
-- 9. CHECK TRIGGER FUNCTION DEFINITION
-- ============================================
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'handle_new_user';

-- ============================================
-- 10. RECENT DATABASE LOGS (if accessible)
-- ============================================
-- Note: This might not work in Supabase SQL Editor
-- Check Supabase Dashboard > Logs > Postgres Logs instead
SELECT 
  log_time,
  error_severity,
  message
FROM pg_stat_statements
WHERE query LIKE '%handle_new_user%'
ORDER BY log_time DESC
LIMIT 20;

-- ============================================
-- 11. CHECK FOR DUPLICATE EMAILS IN PUBLIC.USERS
-- ============================================
SELECT 
  email,
  COUNT(*) as count,
  array_agg(id ORDER BY created_at) as user_ids,
  array_agg(display_name ORDER BY created_at) as names
FROM public.users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- ============================================
-- 12. CHECK FOR DUPLICATE PHONES IN PUBLIC.USERS
-- ============================================
SELECT 
  phone,
  COUNT(*) as count,
  array_agg(id ORDER BY created_at) as user_ids,
  array_agg(display_name ORDER BY created_at) as names
FROM public.users
WHERE phone IS NOT NULL
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- ============================================
-- 13. TEST TRIGGER MANUALLY (use with caution!)
-- ============================================
-- Uncomment and modify to test the trigger function directly
/*
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test@example.com';
BEGIN
  -- Simulate a new auth user
  INSERT INTO auth.users (id, email, instance_id, aud, role)
  VALUES (
    test_user_id,
    test_email,
    (SELECT id FROM auth.instances LIMIT 1),
    'authenticated',
    'authenticated'
  );
  
  -- The trigger should fire automatically
  -- Check if profile was created
  SELECT 
    id,
    email,
    display_name
  FROM public.users
  WHERE id = test_user_id;
  
  -- Clean up
  DELETE FROM public.users WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
END $$;
*/
