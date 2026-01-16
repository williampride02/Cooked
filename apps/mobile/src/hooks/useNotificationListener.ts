import { useEffect, useRef } from 'react';
import { router, Href } from 'expo-router';

// Dynamic import for native module that may not be available
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // Native module not available
}

// Type for notification data payload
export interface NotificationData {
  type?: string;
  groupId?: string;
  pactId?: string;
  checkInId?: string;
  threadId?: string;
  recapId?: string;
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotificationType = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotificationResponseType = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SubscriptionType = any;

interface UseNotificationListenerOptions {
  /**
   * Callback when a notification is received while app is foregrounded
   */
  onNotificationReceived?: (notification: NotificationType) => void;
  /**
   * Callback when user taps on a notification
   */
  onNotificationResponse?: (response: NotificationResponseType) => void;
  /**
   * Whether to auto-navigate based on notification data
   * @default true
   */
  autoNavigate?: boolean;
}

/**
 * Hook to listen for incoming notifications and handle user interactions
 *
 * Usage:
 * ```tsx
 * useNotificationListener({
 *   onNotificationReceived: (notification) => {
 *     console.log('Received notification:', notification);
 *   },
 *   onNotificationResponse: (response) => {
 *     console.log('User tapped notification:', response);
 *   },
 * });
 * ```
 */
export function useNotificationListener(options: UseNotificationListenerOptions = {}) {
  const {
    onNotificationReceived,
    onNotificationResponse,
    autoNavigate = true,
  } = options;

  const notificationListener = useRef<SubscriptionType | null>(null);
  const responseListener = useRef<SubscriptionType | null>(null);

  useEffect(() => {
    // Skip if notifications module not available
    if (!Notifications) return;

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification: NotificationType) => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: NotificationResponseType) => {
      console.log('Notification response:', response);
      onNotificationResponse?.(response);

      if (autoNavigate) {
        handleNotificationNavigation(response);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [onNotificationReceived, onNotificationResponse, autoNavigate]);
}

/**
 * Handle navigation based on notification data
 * Uses type assertion for dynamic routes since these routes may not exist in typed routes yet
 *
 * Note: All routes require groupId context since the app structure is:
 * - /(main)/group/[id]/roast/[threadId]
 * - /(main)/group/[id]/pact/[pactId]
 * - /(main)/group/[id]/recap/[recapId]
 */
function handleNotificationNavigation(response: NotificationResponseType) {
  const data = response.notification.request.content.data as NotificationData;

  if (!data?.type) {
    console.log('No notification type, skipping navigation');
    return;
  }

  switch (data.type) {
    case 'check_in_reminder':
      // Navigate to the check-in flow (requires group context)
      if (data.groupId && data.pactId) {
        router.push(`/(main)/group/${data.groupId}/pact/${data.pactId}/check-in` as Href);
      } else if (data.groupId) {
        // Fallback to group pacts list
        router.push(`/(main)/group/${data.groupId}/pacts` as Href);
      }
      break;

    case 'fold_alert':
      // Navigate to the feed to see the fold
      if (data.groupId) {
        router.push(`/(main)/group/${data.groupId}` as Href);
      }
      break;

    case 'tagged_in_roast':
    case 'new_roast_response':
      // Navigate to the roast thread (requires group context)
      if (data.groupId && data.threadId) {
        router.push(`/(main)/group/${data.groupId}/roast/${data.threadId}` as Href);
      } else if (data.groupId) {
        // Fallback to group feed
        router.push(`/(main)/group/${data.groupId}` as Href);
      }
      break;

    case 'weekly_recap_ready':
      // Navigate to the recap (requires group context)
      if (data.groupId && data.recapId) {
        router.push(`/(main)/group/${data.groupId}/recap/${data.recapId}` as Href);
      } else if (data.groupId) {
        router.push(`/(main)/group/${data.groupId}` as Href);
      }
      break;

    case 'member_joined':
      // Navigate to the group
      if (data.groupId) {
        router.push(`/(main)/group/${data.groupId}` as Href);
      }
      break;

    case 'pact_starting':
    case 'pact_ending':
      // Navigate to the pact (requires group context)
      if (data.groupId && data.pactId) {
        router.push(`/(main)/group/${data.groupId}/pact/${data.pactId}` as Href);
      } else if (data.groupId) {
        router.push(`/(main)/group/${data.groupId}/pacts` as Href);
      }
      break;

    default:
      console.log('Unknown notification type:', data.type);
      // Navigate to home/feed as fallback
      router.push('/(main)');
  }
}

/**
 * Get the last notification response that launched the app
 * Useful for handling cold-start from notification tap
 */
export async function getLastNotificationResponse(): Promise<NotificationResponseType | null> {
  if (!Notifications) return null;
  return await Notifications.getLastNotificationResponseAsync();
}

/**
 * Clear all delivered notifications
 */
export async function clearAllNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get the current badge count
 */
export async function getBadgeCount(): Promise<number> {
  if (!Notifications) return 0;
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set the badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (!Notifications) return;
  await Notifications.setBadgeCountAsync(count);
}
