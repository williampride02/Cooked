/**
 * Expo Push Notification Utilities
 * Shared utilities for sending push notifications via Expo Push API
 */

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoPushMessage {
  to: string | string[];
  title?: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  ttl?: number;
  expiration?: number;
  priority?: 'default' | 'normal' | 'high';
  badge?: number;
  channelId?: string;
  categoryId?: string;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'MessageTooBig' | 'MessageRateExceeded' | 'InvalidCredentials';
  };
}

export interface ExpoPushReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
  };
}

/**
 * Check if a push token is a valid Expo push token
 */
export function isExpoPushToken(token: string): boolean {
  return (
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
  );
}

/**
 * Chunk an array into smaller arrays of specified size
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Send push notifications via Expo Push API
 * Automatically handles chunking for large batches
 */
export async function sendExpoPushNotifications(
  messages: ExpoPushMessage[]
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) {
    return [];
  }

  // Expo recommends batches of 100 or less
  const chunks = chunkArray(messages, 100);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        console.error('Expo Push API error:', response.status, await response.text());
        // Add error tickets for all messages in this chunk
        for (const _ of chunk) {
          tickets.push({
            status: 'error',
            message: `HTTP ${response.status}`,
          });
        }
        continue;
      }

      const result = await response.json();

      if (result.data) {
        tickets.push(...result.data);
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
      // Add error tickets for all messages in this chunk
      for (const _ of chunk) {
        tickets.push({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  return tickets;
}

/**
 * Send a single push notification
 */
export async function sendExpoPushNotification(
  message: ExpoPushMessage
): Promise<ExpoPushTicket> {
  const tickets = await sendExpoPushNotifications([message]);
  return tickets[0] || { status: 'error', message: 'No ticket returned' };
}

/**
 * Create a push message for a notification type
 */
export function createPushMessage(
  pushToken: string,
  type: NotificationType,
  data: NotificationData
): ExpoPushMessage {
  const { title, body } = getNotificationContent(type, data);

  return {
    to: pushToken,
    title,
    body,
    sound: 'default',
    priority: 'high',
    channelId: 'default',
    data: {
      type,
      ...data,
    },
  };
}

// Notification types supported by the app
export type NotificationType =
  | 'check_in_reminder'
  | 'fold_alert'
  | 'tagged_in_roast'
  | 'new_roast_response'
  | 'weekly_recap_ready'
  | 'member_joined'
  | 'pact_starting'
  | 'pact_ending';

// Data that can be passed with notifications
export interface NotificationData {
  // Common
  groupId?: string;
  groupName?: string;

  // Pact related
  pactId?: string;
  pactName?: string;

  // User related
  userId?: string;
  userName?: string;

  // Roast related
  threadId?: string;
  checkInId?: string;
  responseId?: string;

  // Recap related
  recapId?: string;
  weekStart?: string;
  weekEnd?: string;

  // Any additional data
  [key: string]: unknown;
}

/**
 * Get notification title and body for each notification type
 */
function getNotificationContent(
  type: NotificationType,
  data: NotificationData
): { title: string; body: string } {
  switch (type) {
    case 'check_in_reminder':
      return {
        title: 'Time to check in!',
        body: data.pactName
          ? `Don't forget to check in for "${data.pactName}"`
          : 'You have pacts waiting for your check-in today',
      };

    case 'fold_alert':
      return {
        title: 'Someone folded!',
        body: data.userName && data.pactName
          ? `${data.userName} folded on "${data.pactName}". Time to roast!`
          : 'A group member folded. Time to roast!',
      };

    case 'tagged_in_roast':
      return {
        title: 'You got tagged!',
        body: data.userName
          ? `${data.userName} mentioned you in a roast`
          : 'Someone mentioned you in a roast thread',
      };

    case 'new_roast_response':
      return {
        title: 'New roast dropped!',
        body: data.userName
          ? `${data.userName} replied to a roast thread you're in`
          : 'New reply in a roast thread',
      };

    case 'weekly_recap_ready':
      return {
        title: 'Weekly Recap is ready!',
        body: data.groupName
          ? `Check out this week's highlights for ${data.groupName}`
          : 'Your weekly recap is ready to view',
      };

    case 'member_joined':
      return {
        title: 'New member joined!',
        body: data.userName && data.groupName
          ? `${data.userName} joined ${data.groupName}`
          : 'A new member joined your group',
      };

    case 'pact_starting':
      return {
        title: 'Pact starting soon!',
        body: data.pactName
          ? `"${data.pactName}" starts tomorrow. Get ready!`
          : 'A new pact starts tomorrow',
      };

    case 'pact_ending':
      return {
        title: 'Pact ending soon!',
        body: data.pactName
          ? `"${data.pactName}" ends tomorrow. Final push!`
          : 'A pact ends tomorrow. Keep it up!',
      };

    default:
      return {
        title: 'Cooked',
        body: 'You have a new notification',
      };
  }
}
