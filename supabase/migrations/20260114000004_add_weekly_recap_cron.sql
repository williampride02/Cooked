-- Weekly Recap Cron Job
-- This migration sets up a cron job to generate weekly recaps every Sunday at 11 PM UTC
-- Uses pg_cron extension (available on Supabase)

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net for HTTP requests to Edge Functions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions for cron jobs
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create a function to call the Edge Function
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
  -- Prefer Supabase Vault if available (recommended by Supabase docs).
  IF to_regclass('vault.decrypted_secrets') IS NOT NULL THEN
    EXECUTE $$select decrypted_secret from vault.decrypted_secrets where name = 'project_url' limit 1$$
      INTO vault_project_url;
    EXECUTE $$select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1$$
      INTO vault_service_role_key;
  END IF;

  -- Fallback to app.settings.* for local/dev environments where Vault may not be configured.
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

  -- Make HTTP POST request to the Edge Function
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object(
      'week_offset', 1  -- Generate recap for the previous week
    )
  );

  RAISE NOTICE 'Weekly recap generation triggered at %', NOW();
END;
$$;

-- Alternative approach: Direct database function that generates recaps
-- This can be used if Edge Functions are not available or as a backup
CREATE OR REPLACE FUNCTION public.generate_weekly_recap_direct(
  p_group_id UUID DEFAULT NULL,
  p_week_offset INTEGER DEFAULT 1
)
RETURNS TABLE (
  group_id UUID,
  status TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_group RECORD;
  v_recap_data JSONB;
  v_total_check_ins INTEGER;
  v_total_folds INTEGER;
  v_active_pacts INTEGER;
BEGIN
  -- Calculate week dates (Monday to Sunday)
  v_week_start := date_trunc('week', CURRENT_DATE - (p_week_offset * 7)::INTEGER)::DATE;
  v_week_end := v_week_start + 6;

  -- Loop through groups
  FOR v_group IN
    SELECT g.id
    FROM groups g
    WHERE p_group_id IS NULL OR g.id = p_group_id
  LOOP
    BEGIN
      -- Count active pacts for this group
      SELECT COUNT(*)
      INTO v_active_pacts
      FROM pacts p
      WHERE p.group_id = v_group.id
        AND p.status = 'active'
        AND p.start_date <= v_week_end
        AND (p.end_date IS NULL OR p.end_date >= v_week_start);

      -- Count check-ins and folds
      SELECT
        COALESCE(SUM(CASE WHEN ci.status = 'success' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN ci.status = 'fold' THEN 1 ELSE 0 END), 0)
      INTO v_total_check_ins, v_total_folds
      FROM check_ins ci
      JOIN pacts p ON ci.pact_id = p.id
      WHERE p.group_id = v_group.id
        AND ci.check_in_date BETWEEN v_week_start AND v_week_end;

      -- Skip if no activity
      IF v_total_check_ins = 0 AND v_total_folds = 0 AND v_active_pacts = 0 THEN
        group_id := v_group.id;
        status := 'skipped';
        message := 'No activity this week';
        RETURN NEXT;
        CONTINUE;
      END IF;

      -- Build basic recap data (Edge Function has full implementation)
      -- This is a simplified fallback that creates minimal recap data
      v_recap_data := jsonb_build_object(
        'awards', jsonb_build_object(
          'most_consistent', NULL,
          'biggest_fold', NULL,
          'excuse_hall_of_fame', NULL,
          'comeback_player', NULL,
          'best_roast', NULL
        ),
        'stats', jsonb_build_object(
          'group_completion_rate', CASE
            WHEN v_total_check_ins + v_total_folds > 0
            THEN ROUND((v_total_check_ins::NUMERIC / (v_total_check_ins + v_total_folds) * 100)::NUMERIC, 1)
            ELSE 0
          END,
          'total_check_ins', v_total_check_ins,
          'total_folds', v_total_folds,
          'active_pacts', v_active_pacts,
          'roast_threads_opened', 0,
          'leaderboard', '[]'::JSONB
        ),
        'highlights', jsonb_build_object(
          'top_roasts', '[]'::JSONB,
          'biggest_improvement', NULL,
          'longest_streak', NULL
        )
      );

      -- Insert or update recap
      INSERT INTO weekly_recaps (group_id, week_start, week_end, data)
      VALUES (v_group.id, v_week_start, v_week_end, v_recap_data)
      ON CONFLICT (group_id, week_start)
      DO UPDATE SET
        data = EXCLUDED.data,
        week_end = EXCLUDED.week_end;

      group_id := v_group.id;
      status := 'success';
      message := format('Recap generated for %s to %s', v_week_start, v_week_end);
      RETURN NEXT;

    EXCEPTION WHEN OTHERS THEN
      group_id := v_group.id;
      status := 'error';
      message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- Schedule the cron job to run every Sunday at 11 PM UTC
-- This gives time for all Sunday check-ins to be recorded before generating the recap
-- The job will call the Edge Function which has the full recap generation logic
SELECT cron.schedule(
  'generate-weekly-recaps',           -- job name
  '0 23 * * 0',                       -- cron expression: 11 PM UTC every Sunday
  $$SELECT public.trigger_weekly_recap_generation()$$
);

-- Add a comment explaining the job
COMMENT ON FUNCTION public.trigger_weekly_recap_generation() IS
  'Triggers the weekly recap Edge Function. Called by pg_cron every Sunday at 11 PM UTC.';

COMMENT ON FUNCTION public.generate_weekly_recap_direct(UUID, INTEGER) IS
  'Fallback function to generate basic weekly recaps directly in the database. Use the Edge Function for full recap generation with all awards and highlights.';

-- Create an index to optimize recap queries
CREATE INDEX IF NOT EXISTS idx_weekly_recaps_group_week
  ON weekly_recaps(group_id, week_start DESC);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.trigger_weekly_recap_generation() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_weekly_recap_direct(UUID, INTEGER) TO service_role;

-- Add RLS policy to allow service role to insert/update recaps
CREATE POLICY "Service role can manage recaps"
  ON weekly_recaps FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
