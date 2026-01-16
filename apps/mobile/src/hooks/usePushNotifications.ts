import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app';

// Dynamic imports for native modules that may not be available
let Device: typeof import('expo-device') | null = null;
let Notifications: typeof import('expo-notifications') | null = null;

try {
  Device = require('expo-device');
  Notifications = require('expo-notifications');
} catch {
  // Native modules not available (development build may need rebuild)
  console.warn('Push notification native modules not available');
}

// Configure how notifications should be handled when app is in foreground
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export type PushNotificationStatus =
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'not_supported';

interface UsePushNotificationsReturn {
  expoPushToken: string | null;
  permissionStatus: PushNotificationStatus;
  isLoading: boolean;
  error: string | null;
  requestPermissions: () => Promise<boolean>;
  registerForPushNotifications: () => Promise<string | null>;
}

/**
 * Hook to manage push notification registration and permissions
 *
 * This hook handles:
 * - Requesting notification permissions
 * - Getting the Expo push token
 * - Saving the token to Supabase user profile
 * - Re-registering when app becomes active (in case token changed)
 */
// Check if modules are available
const modulesAvailable = !!(Device && Notifications);

export function usePushNotifications(): UsePushNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PushNotificationStatus>(
    modulesAvailable ? 'undetermined' : 'not_supported'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    modulesAvailable ? null : 'Push notification modules not available. Rebuild the app.'
  );

  const user = useAppStore((state) => state.user);
  const appState = useRef(AppState.currentState);
  const hasRegisteredRef = useRef(false);

  /**
   * Check if the device supports push notifications
   */
  const checkDeviceSupport = useCallback((): boolean => {
    if (!modulesAvailable || !Device) {
      console.log('Push notification modules not available');
      return false;
    }
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return false;
    }
    return true;
  }, []);

  /**
   * Get the project ID from Expo Constants
   */
  const getProjectId = useCallback((): string | undefined => {
    return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  }, []);

  /**
   * Request permission to send push notifications
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!modulesAvailable || !checkDeviceSupport() || !Notifications) {
      setPermissionStatus('not_supported');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        setPermissionStatus('granted');
        return true;
      } else if (finalStatus === 'denied') {
        setPermissionStatus('denied');
        return false;
      }

      setPermissionStatus('undetermined');
      return false;
    } catch (err) {
      console.error('Error requesting notification permissions:', err);
      setError('Failed to request notification permissions');
      return false;
    }
  }, [checkDeviceSupport]);

  /**
   * Save the push token to Supabase user profile
   */
  const savePushTokenToSupabase = useCallback(async (token: string): Promise<boolean> => {
    if (!user?.id) {
      console.log('No user logged in, skipping token save');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ push_token: token })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving push token to Supabase:', updateError);
        setError('Failed to save push token');
        return false;
      }

      console.log('Push token saved successfully');
      return true;
    } catch (err) {
      console.error('Exception saving push token:', err);
      setError('Failed to save push token');
      return false;
    }
  }, [user?.id]);

  /**
   * Register for push notifications and get the Expo push token
   */
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check device support
      if (!checkDeviceSupport()) {
        setPermissionStatus('not_supported');
        return null;
      }

      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications!.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications!.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF4D00', // Cooked brand color
        });
      }

      // Get the project ID
      const projectId = getProjectId();
      if (!projectId) {
        console.error('No project ID found. Ensure EAS is configured.');
        setError('Push notification configuration error');
        return null;
      }

      // Get the push token
      const tokenResponse = await Notifications!.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenResponse.data;
      console.log('Expo push token:', token);

      setExpoPushToken(token);

      // Save to Supabase
      await savePushTokenToSupabase(token);

      hasRegisteredRef.current = true;
      return token;
    } catch (err) {
      console.error('Error registering for push notifications:', err);
      setError('Failed to register for push notifications');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkDeviceSupport, requestPermissions, getProjectId, savePushTokenToSupabase]);

  // Check existing permission status on mount
  useEffect(() => {
    if (!modulesAvailable || !Device || !Notifications) return;

    const checkPermissions = async () => {
      if (!Device!.isDevice) {
        setPermissionStatus('not_supported');
        return;
      }

      const { status } = await Notifications!.getPermissionsAsync();
      if (status === 'granted') {
        setPermissionStatus('granted');
      } else if (status === 'denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('undetermined');
      }
    };

    checkPermissions();
  }, []);

  // Auto-register when user logs in and permissions are granted
  useEffect(() => {
    if (user?.id && permissionStatus === 'granted' && !hasRegisteredRef.current) {
      registerForPushNotifications();
    }
  }, [user?.id, permissionStatus, registerForPushNotifications]);

  // Re-register when app becomes active (token might have changed)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        user?.id &&
        permissionStatus === 'granted'
      ) {
        // Re-register to ensure token is up to date
        registerForPushNotifications();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user?.id, permissionStatus, registerForPushNotifications]);

  // Clear push token when user logs out
  useEffect(() => {
    if (!user?.id && expoPushToken) {
      setExpoPushToken(null);
      hasRegisteredRef.current = false;
    }
  }, [user?.id, expoPushToken]);

  return {
    expoPushToken,
    permissionStatus,
    isLoading,
    error,
    requestPermissions,
    registerForPushNotifications,
  };
}

/**
 * Utility function to get push token outside of React context
 * Use this for one-off token retrieval when you don't need the full hook
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!modulesAvailable || !Device || !Notifications) {
    console.log('Push notification modules not available');
    return null;
  }

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.error('No project ID found');
    return null;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResponse.data;
  } catch (err) {
    console.error('Error getting push token:', err);
    return null;
  }
}
