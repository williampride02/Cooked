/**
 * Supabase Client for Edge Functions
 * Creates a Supabase client with service role for server-side operations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Create a Supabase client with service role privileges
 * This should only be used in Edge Functions, never in client code
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get user's notification preferences from settings
 */
export interface NotificationPreferences {
  check_in_reminder: boolean;
  fold_alert: boolean;
  tagged_in_roast: boolean;
  new_roast_response: boolean;
  weekly_recap_ready: boolean;
  member_joined: boolean;
  pact_starting: boolean;
  pact_ending: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  check_in_reminder: true,
  fold_alert: true,
  tagged_in_roast: true,
  new_roast_response: true,
  weekly_recap_ready: true,
  member_joined: true,
  pact_starting: true,
  pact_ending: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
};

/**
 * Check if current time is within quiet hours for a user
 */
export function isInQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quiet_hours_enabled) {
    return false;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const start = preferences.quiet_hours_start;
  const end = preferences.quiet_hours_end;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }

  // Same-day quiet hours (e.g., 14:00 to 16:00)
  return currentTime >= start && currentTime < end;
}

/**
 * Get user's notification preferences
 */
export function getUserNotificationPreferences(
  settings: Record<string, unknown> | null
): NotificationPreferences {
  if (!settings?.notifications) {
    return DEFAULT_PREFERENCES;
  }

  return {
    ...DEFAULT_PREFERENCES,
    ...(settings.notifications as Partial<NotificationPreferences>),
  };
}

/**
 * Check if a notification type is enabled for a user
 */
export function isNotificationEnabled(
  preferences: NotificationPreferences,
  notificationType: keyof NotificationPreferences
): boolean {
  // First check quiet hours
  if (isInQuietHours(preferences)) {
    return false;
  }

  // Then check the specific notification type
  const preference = preferences[notificationType];
  return typeof preference === 'boolean' ? preference : true;
}
