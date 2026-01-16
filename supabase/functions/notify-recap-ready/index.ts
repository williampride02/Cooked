/**
 * notify-recap-ready Edge Function
 *
 * Sends push notifications when a weekly recap is ready for a group
 * Typically called after the weekly recap generation job completes
 *
 * Endpoint: POST /functions/v1/notify-recap-ready
 *
 * Request body:
 * {
 *   "recapId": "uuid",      // The weekly recap record
 *   "groupId": "uuid",      // The group
 *   "weekStart": "date",    // Start of the recap week (YYYY-MM-DD)
 *   "weekEnd": "date"       // End of the recap week (YYYY-MM-DD)
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
} from '../_shared/expo-push.ts';
import {
  handleCorsPreflightRequest,
  createJsonResponse,
  createErrorResponse,
} from '../_shared/cors.ts';

interface NotifyRecapReadyRequest {
  recapId: string;
  groupId: string;
  weekStart: string;
  weekEnd: string;
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
    const body: NotifyRecapReadyRequest = await req.json();

    // Validate required fields
    if (!body.recapId || !body.groupId) {
      return createErrorResponse('Missing required fields: recapId, groupId');
    }

    const supabase = createSupabaseClient();

    // Fetch group info
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name')
      .eq('id', body.groupId)
      .single();

    if (groupError || !group) {
      console.error('Error fetching group:', groupError);
      return createErrorResponse('Failed to fetch group', 500);
    }

    // Fetch all group members
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        users!inner (
          id,
          display_name,
          push_token,
          settings
        )
      `)
      .eq('group_id', body.groupId);

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return createErrorResponse('Failed to fetch group members', 500);
    }

    if (!members || members.length === 0) {
      return createJsonResponse({
        success: true,
        notifications_sent: 0,
        message: 'No group members found',
      });
    }

    // Build messages for eligible recipients
    const messages: ReturnType<typeof createPushMessage>[] = [];

    for (const member of members) {
      const user = member.users;

      // Skip if no valid push token
      if (!user.push_token || !isExpoPushToken(user.push_token)) {
        continue;
      }

      // Check notification preferences
      const preferences = getUserNotificationPreferences(user.settings);
      if (!isNotificationEnabled(preferences, 'weekly_recap_ready')) {
        continue;
      }

      // Create the notification message
      const message = createPushMessage(user.push_token, 'weekly_recap_ready', {
        groupId: group.id,
        groupName: group.name,
        recapId: body.recapId,
        weekStart: body.weekStart,
        weekEnd: body.weekEnd,
      });

      messages.push(message);
    }

    if (messages.length === 0) {
      return createJsonResponse({
        success: true,
        notifications_sent: 0,
        message: 'No eligible recipients',
      });
    }

    // Send notifications
    const tickets = await sendExpoPushNotifications(messages);

    // Count results
    const successCount = tickets.filter((t) => t.status === 'ok').length;
    const failureCount = tickets.filter((t) => t.status === 'error').length;

    return createJsonResponse({
      success: true,
      notifications_sent: successCount,
      failed: failureCount,
      group: group.name,
      total_members: members.length,
    });
  } catch (error) {
    console.error('notify-recap-ready error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});
