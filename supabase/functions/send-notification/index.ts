/**
 * send-notification Edge Function
 *
 * Core function for sending push notifications via Expo Push API
 * Handles all notification types: check-in reminders, fold alerts, roast tags,
 * new responses, weekly recaps, and member joins.
 *
 * Endpoint: POST /functions/v1/send-notification
 *
 * Request body:
 * {
 *   "type": "fold_alert" | "tagged_in_roast" | "new_roast_response" | "weekly_recap_ready" | "member_joined" | "pact_starting" | "pact_ending" | "check_in_reminder",
 *   "userIds": ["uuid1", "uuid2"], // Users to notify
 *   "data": {
 *     "groupId": "uuid",
 *     "groupName": "string",
 *     "pactId": "uuid",
 *     "pactName": "string",
 *     "userName": "string",
 *     // ... other notification-specific data
 *   }
 * }
 *
 * OR for single user:
 * {
 *   "type": "...",
 *   "userId": "uuid",
 *   "data": { ... }
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
  createSupabaseClient,
  getUserNotificationPreferences,
  isNotificationEnabled,
} from '../_shared/supabase-client.ts';
import {
  createPushMessage,
  sendExpoPushNotifications,
  isExpoPushToken,
  type NotificationType,
  type NotificationData,
} from '../_shared/expo-push.ts';
import {
  corsHeaders,
  handleCorsPreflightRequest,
  createJsonResponse,
  createErrorResponse,
} from '../_shared/cors.ts';

interface SendNotificationRequest {
  type: NotificationType;
  userId?: string;
  userIds?: string[];
  data?: NotificationData;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const body: SendNotificationRequest = await req.json();

    // Validate request
    if (!body.type) {
      return createErrorResponse('Missing notification type');
    }

    // Get user IDs to notify
    const userIds: string[] = [];
    if (body.userId) {
      userIds.push(body.userId);
    }
    if (body.userIds && Array.isArray(body.userIds)) {
      userIds.push(...body.userIds);
    }

    if (userIds.length === 0) {
      return createErrorResponse('No users specified');
    }

    // Deduplicate user IDs
    const uniqueUserIds = [...new Set(userIds)];

    // Create Supabase client
    const supabase = createSupabaseClient();

    // Fetch users with push tokens and settings
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, display_name, push_token, settings')
      .in('id', uniqueUserIds)
      .not('push_token', 'is', null);

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return createErrorResponse('Failed to fetch users', 500);
    }

    if (!users || users.length === 0) {
      return createJsonResponse({
        success: true,
        sent: 0,
        message: 'No users with push tokens found',
      });
    }

    // Filter users based on their notification preferences
    const eligibleUsers = users.filter((user) => {
      // Validate push token
      if (!user.push_token || !isExpoPushToken(user.push_token)) {
        return false;
      }

      // Check notification preferences
      const preferences = getUserNotificationPreferences(user.settings);

      // Map notification type to preference key
      const preferenceKey = body.type as keyof typeof preferences;

      return isNotificationEnabled(preferences, preferenceKey);
    });

    if (eligibleUsers.length === 0) {
      return createJsonResponse({
        success: true,
        sent: 0,
        message: 'No eligible users (preferences or quiet hours)',
      });
    }

    // Create push messages for each eligible user
    const messages = eligibleUsers.map((user) =>
      createPushMessage(user.push_token!, body.type, body.data || {})
    );

    // Send notifications
    const tickets = await sendExpoPushNotifications(messages);

    // Count successes and failures
    const successCount = tickets.filter((t) => t.status === 'ok').length;
    const failureCount = tickets.filter((t) => t.status === 'error').length;

    // Log any failures for debugging
    tickets.forEach((ticket, index) => {
      if (ticket.status === 'error') {
        console.error(
          `Failed to send notification to user ${eligibleUsers[index]?.id}:`,
          ticket.message,
          ticket.details
        );

        // Handle device not registered - should clear the push token
        if (ticket.details?.error === 'DeviceNotRegistered') {
          supabase
            .from('users')
            .update({ push_token: null })
            .eq('id', eligibleUsers[index].id)
            .then(({ error }) => {
              if (error) {
                console.error('Failed to clear invalid push token:', error);
              }
            });
        }
      }
    });

    return createJsonResponse({
      success: true,
      sent: successCount,
      failed: failureCount,
      total: eligibleUsers.length,
    });
  } catch (error) {
    console.error('send-notification error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});
