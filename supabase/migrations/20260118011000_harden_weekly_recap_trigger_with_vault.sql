-- Harden weekly recap cron trigger to support Supabase Vault secrets (recommended)
-- This updates the existing trigger function without requiring re-running the original cron migration.

CREATE OR REPLACE FUNCTION public.trigger_weekly_recap_generation()
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
  -- Prefer Supabase Vault if available
  IF to_regclass('vault.decrypted_secrets') IS NOT NULL THEN
    EXECUTE 'select decrypted_secret from vault.decrypted_secrets where name = ''project_url'' limit 1'
      INTO vault_project_url;
    EXECUTE 'select decrypted_secret from vault.decrypted_secrets where name = ''service_role_key'' limit 1'
      INTO vault_service_role_key;
  END IF;

  -- Fallback to app.settings.* for local/dev environments
  edge_function_url := COALESCE(
    NULLIF(vault_project_url, ''),
    NULLIF(current_setting('app.settings.edge_function_base_url', true), '')
  ) || '/functions/v1/generate-weekly-recap';

  service_role_key := COALESCE(
    NULLIF(vault_service_role_key, ''),
    NULLIF(current_setting('app.settings.service_role_key', true), '')
  );

  IF edge_function_url IS NULL OR edge_function_url = '/functions/v1/generate-weekly-recap' THEN
    RAISE NOTICE 'Weekly recap: missing project_url. Set Vault secret name=project_url (value=https://<project-ref>.supabase.co) or set app.settings.edge_function_base_url.';
    RETURN;
  END IF;

  IF service_role_key IS NULL OR service_role_key = '' THEN
    RAISE NOTICE 'Weekly recap: missing service role key. Set Vault secret name=service_role_key or set app.settings.service_role_key.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object('week_offset', 1)
  );
END;
$$;

COMMENT ON FUNCTION public.trigger_weekly_recap_generation() IS
  'Triggers the weekly recap Edge Function. Uses Vault secrets (project_url, service_role_key) if available; falls back to app.settings.*.';

