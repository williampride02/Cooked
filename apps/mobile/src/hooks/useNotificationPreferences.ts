import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app';
import type { NotificationPreferences } from '@/types';

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

interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;
  updatePreference: (key: keyof NotificationPreferences, value: boolean | string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAppStore((state) => state.user);

  // Fetch preferences from user settings
  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('settings')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Fetch preferences error:', fetchError);
        setError('Failed to load preferences');
        return;
      }

      // Merge with defaults to ensure all keys exist
      const userSettings = data?.settings || {};
      const notificationSettings = userSettings.notifications || {};
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...notificationSettings,
      });
    } catch (err) {
      console.error('Fetch preferences exception:', err);
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Update a single preference
  const updatePreference = useCallback(
    async (key: keyof NotificationPreferences, value: boolean | string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in');
        return false;
      }

      // Optimistic update
      const prevPreferences = { ...preferences };
      setPreferences((prev) => ({ ...prev, [key]: value }));
      setError(null);

      try {
        // Get current settings
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('settings')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Fetch settings error:', fetchError);
          setPreferences(prevPreferences);
          setError('Failed to update preference');
          return false;
        }

        // Merge new preference into existing settings
        const currentSettings = userData?.settings || {};
        const currentNotifications = currentSettings.notifications || {};
        const updatedSettings = {
          ...currentSettings,
          notifications: {
            ...currentNotifications,
            [key]: value,
          },
        };

        // Update settings
        const { error: updateError } = await supabase
          .from('users')
          .update({ settings: updatedSettings })
          .eq('id', user.id);

        if (updateError) {
          console.error('Update preference error:', updateError);
          setPreferences(prevPreferences);
          setError('Failed to update preference');
          return false;
        }

        return true;
      } catch (err) {
        console.error('Update preference exception:', err);
        setPreferences(prevPreferences);
        setError('Something went wrong');
        return false;
      }
    },
    [user, preferences]
  );

  return {
    preferences,
    isLoading,
    error,
    updatePreference,
    refetch: fetchPreferences,
  };
}
