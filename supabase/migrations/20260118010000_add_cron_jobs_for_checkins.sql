-- Add cron jobs for check-in reminders and missed check-in auto-fold
-- Requires extensions: pg_cron, pg_net
-- Note: Uses explicit function URLs/settings only where feasible.

-- Enable extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Helper: trigger check-in reminder Edge Function
CREATE OR REPLACE FUNCTION public.trigger_check_in_reminder()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
  vault_project_url TEXT;
  vault_service_role_key TEXT;
BEGIN
  IF to_regclass('vault.decrypted_secrets') IS NOT NULL THEN
    EXECUTE 'select decrypted_secret from vault.decrypted_secrets where name = ''project_url'' limit 1'
      INTO vault_project_url;
    EXECUTE 'select decrypted_secret from vault.decrypted_secrets where name = ''service_role_key'' limit 1'
      INTO vault_service_role_key;
  END IF;

  edge_function_url := COALESCE(
    NULLIF(vault_project_url, ''),
    NULLIF(current_setting('app.settings.edge_function_base_url', true), '')
  ) || '/functions/v1/check-in-reminder';

  service_role_key := COALESCE(
    NULLIF(vault_service_role_key, ''),
    NULLIF(current_setting('app.settings.service_role_key', true), '')
  );

  IF edge_function_url IS NULL OR edge_function_url = '/functions/v1/check-in-reminder' THEN
    RAISE NOTICE 'Check-in reminder: missing project_url. Set Vault secret name=project_url or set app.settings.edge_function_base_url.';
    RETURN;
  END IF;

  IF service_role_key IS NULL OR service_role_key = '' THEN
    RAISE NOTICE 'Check-in reminder: missing service role key. Set Vault secret name=service_role_key or set app.settings.service_role_key.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := '{}'::jsonb
  );
END;
$$;

COMMENT ON FUNCTION public.trigger_check_in_reminder() IS
  'Triggers the check-in-reminder Edge Function via pg_net.http_post. Intended to be called by pg_cron.';

-- Helper: trigger missed-check-in-auto-fold Edge Function
CREATE OR REPLACE FUNCTION public.trigger_missed_check_in_auto_fold()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
  vault_project_url TEXT;
  vault_service_role_key TEXT;
BEGIN
  IF to_regclass('vault.decrypted_secrets') IS NOT NULL THEN
    EXECUTE 'select decrypted_secret from vault.decrypted_secrets where name = ''project_url'' limit 1'
      INTO vault_project_url;
    EXECUTE 'select decrypted_secret from vault.decrypted_secrets where name = ''service_role_key'' limit 1'
      INTO vault_service_role_key;
  END IF;

  edge_function_url := COALESCE(
    NULLIF(vault_project_url, ''),
    NULLIF(current_setting('app.settings.edge_function_base_url', true), '')
  ) || '/functions/v1/missed-check-in-auto-fold';

  service_role_key := COALESCE(
    NULLIF(vault_service_role_key, ''),
    NULLIF(current_setting('app.settings.service_role_key', true), '')
  );

  IF edge_function_url IS NULL OR edge_function_url = '/functions/v1/missed-check-in-auto-fold' THEN
    RAISE NOTICE 'Auto-fold: missing project_url. Set Vault secret name=project_url or set app.settings.edge_function_base_url.';
    RETURN;
  END IF;

  IF service_role_key IS NULL OR service_role_key = '' THEN
    RAISE NOTICE 'Auto-fold: missing service role key. Set Vault secret name=service_role_key or set app.settings.service_role_key.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := '{}'::jsonb
  );
END;
$$;

COMMENT ON FUNCTION public.trigger_missed_check_in_auto_fold() IS
  'Triggers the missed-check-in-auto-fold Edge Function via pg_net.http_post. Intended to be called by pg_cron.';

-- Schedules
-- Reminders: 3 times a day (UTC) - adjust later for per-user timezone windows
SELECT cron.schedule('check-in-reminder-0900', '0 9 * * *', $$SELECT public.trigger_check_in_reminder()$$);
SELECT cron.schedule('check-in-reminder-1200', '0 12 * * *', $$SELECT public.trigger_check_in_reminder()$$);
SELECT cron.schedule('check-in-reminder-1800', '0 18 * * *', $$SELECT public.trigger_check_in_reminder()$$);

-- Auto-fold: run daily at 00:30 UTC for "yesterday" in UTC (timezone-aware enhancement later)
SELECT cron.schedule('missed-check-in-auto-fold-0030', '30 0 * * *', $$SELECT public.trigger_missed_check_in_auto_fold()$$);

-- Permissions
GRANT EXECUTE ON FUNCTION public.trigger_check_in_reminder() TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_missed_check_in_auto_fold() TO service_role;

