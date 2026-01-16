import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { router, Href } from 'expo-router';
import {
  usePushNotifications,
  useNotificationListener,
  getLastNotificationResponse,
} from '@/hooks';
import type { PushNotificationStatus, NotificationData } from '@/hooks';

interface NotificationContextValue {
  expoPushToken: string | null;
  permissionStatus: PushNotificationStatus;
  isLoading: boolean;
  error: string | null;
  requestPermissions: () => Promise<boolean>;
  registerForPushNotifications: () => Promise<string | null>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Provider component that initializes push notifications and handles notification events
 *
 * Wrap your app with this provider in the root layout to enable push notifications:
 *
 * ```tsx
 * <NotificationProvider>
 *   <App />
 * </NotificationProvider>
 * ```
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const pushNotifications = usePushNotifications();

  // Set up notification listeners
  useNotificationListener({
    onNotificationReceived: (notification) => {
      // You can add custom handling here, like showing an in-app toast
      console.log('Notification received in foreground:', notification.request.content.title);
    },
    onNotificationResponse: (response) => {
      // Custom handling when user taps a notification
      console.log('User tapped notification:', response.notification.request.content.title);
    },
    autoNavigate: true,
  });

  // Handle cold-start from notification tap
  useEffect(() => {
    const handleInitialNotification = async () => {
      const lastResponse = await getLastNotificationResponse();
      if (lastResponse) {
        const data = lastResponse.notification.request.content.data as NotificationData;
        console.log('App launched from notification:', data);

        // Navigate based on notification data
        if (data?.type && data?.groupId) {
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            handleColdStartNavigation(data);
          }, 100);
        }
      }
    };

    handleInitialNotification();
  }, []);

  return (
    <NotificationContext.Provider value={pushNotifications}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification context
 * Must be used within a NotificationProvider
 */
export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}

/**
 * Handle navigation when app is cold-started from a notification tap
 * Uses type assertion for dynamic routes since these routes may not exist in typed routes yet
 *
 * Note: All routes require groupId context since the app structure is:
 * - /(main)/group/[id]/roast/[threadId]
 * - /(main)/group/[id]/pact/[pactId]
 * - /(main)/group/[id]/recap/[recapId]
 */
function handleColdStartNavigation(data: NotificationData) {
  switch (data.type) {
    case 'check_in_reminder':
      // Navigate to pact check-in (requires group context)
      if (data.groupId && data.pactId) {
        router.replace(`/(main)/group/${data.groupId}/pact/${data.pactId}/check-in` as Href);
      } else if (data.groupId) {
        // Fallback to group pacts list
        router.replace(`/(main)/group/${data.groupId}/pacts` as Href);
      }
      break;

    case 'fold_alert':
    case 'member_joined':
      if (data.groupId) {
        router.replace(`/(main)/group/${data.groupId}` as Href);
      }
      break;

    case 'tagged_in_roast':
    case 'new_roast_response':
      // Navigate to roast thread (requires group context)
      if (data.groupId && data.threadId) {
        router.replace(`/(main)/group/${data.groupId}/roast/${data.threadId}` as Href);
      } else if (data.groupId) {
        // Fallback to group feed
        router.replace(`/(main)/group/${data.groupId}` as Href);
      }
      break;

    case 'weekly_recap_ready':
      // Navigate to recap (requires group context)
      if (data.groupId && data.recapId) {
        router.replace(`/(main)/group/${data.groupId}/recap/${data.recapId}` as Href);
      } else if (data.groupId) {
        router.replace(`/(main)/group/${data.groupId}` as Href);
      }
      break;

    case 'pact_starting':
    case 'pact_ending':
      // Navigate to pact (requires group context)
      if (data.groupId && data.pactId) {
        router.replace(`/(main)/group/${data.groupId}/pact/${data.pactId}` as Href);
      } else if (data.groupId) {
        router.replace(`/(main)/group/${data.groupId}/pacts` as Href);
      }
      break;

    default:
      // Navigate to main screen
      router.replace('/(main)');
  }
}
