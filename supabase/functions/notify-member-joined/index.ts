/**
 * notify-member-joined Edge Function
 *
 * Sends push notifications when a new member joins a group
 * Notifies all existing members of the group
 *
 * Endpoint: POST /functions/v1/notify-member-joined
 *
 * Request body:
 * {
 *   "newMemberId": "uuid",  // The user who just joined
 *   "groupId": "uuid"       // The group they joined
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

interface NotifyMemberJoinedRequest {
  newMemberId: string;
  groupId: string;
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
    const body: NotifyMemberJoinedRequest = await req.json();

    // Validate required fields
    if (!body.newMemberId || !body.groupId) {
      return createErrorResponse('Missing required fields: newMemberId, groupId');
    }

    const supabase = createSupabaseClient();

    // Fetch new member info
    const { data: newMember, error: memberError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', body.newMemberId)
      .single();

    if (memberError || !newMember) {
      console.error('Error fetching new member:', memberError);
      return createErrorResponse('Failed to fetch new member', 500);
    }

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

    // Fetch all other group members (excluding the new member)
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
      .eq('group_id', body.groupId)
      .neq('user_id', body.newMemberId);

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return createErrorResponse('Failed to fetch group members', 500);
    }

    if (!members || members.length === 0) {
      return createJsonResponse({
        success: true,
        notifications_sent: 0,
        message: 'No other group members to notify',
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
      if (!isNotificationEnabled(preferences, 'member_joined')) {
        continue;
      }

      // Create the notification message
      const message = createPushMessage(user.push_token, 'member_joined', {
        groupId: group.id,
        groupName: group.name,
        userId: newMember.id,
        userName: newMember.display_name,
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
      new_member: newMember.display_name,
      group: group.name,
    });
  } catch (error) {
    console.error('notify-member-joined error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});
