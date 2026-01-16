/**
 * notify-roast-tag Edge Function
 *
 * Sends push notifications when a user is tagged/mentioned in a roast thread
 * Typically called from the app when a user submits a roast response with @mentions
 *
 * Endpoint: POST /functions/v1/notify-roast-tag
 *
 * Request body:
 * {
 *   "responseId": "uuid",           // The roast response containing the tag
 *   "threadId": "uuid",             // The roast thread
 *   "taggerId": "uuid",             // User who created the tag
 *   "taggedUserIds": ["uuid", ...], // Users who were tagged
 *   "groupId": "uuid"               // The group (optional, fetched if not provided)
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

interface NotifyRoastTagRequest {
  responseId: string;
  threadId: string;
  taggerId: string;
  taggedUserIds: string[];
  groupId?: string;
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
    const body: NotifyRoastTagRequest = await req.json();

    // Validate required fields
    if (!body.responseId || !body.threadId || !body.taggerId || !body.taggedUserIds) {
      return createErrorResponse('Missing required fields');
    }

    if (!Array.isArray(body.taggedUserIds) || body.taggedUserIds.length === 0) {
      return createJsonResponse({
        success: true,
        notifications_sent: 0,
        message: 'No users to tag',
      });
    }

    const supabase = createSupabaseClient();

    // Fetch tagger info
    const { data: tagger, error: taggerError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', body.taggerId)
      .single();

    if (taggerError || !tagger) {
      console.error('Error fetching tagger:', taggerError);
      return createErrorResponse('Failed to fetch tagger', 500);
    }

    // Fetch thread with check-in, pact, and group info
    const { data: thread, error: threadError } = await supabase
      .from('roast_threads')
      .select(`
        id,
        check_ins!inner (
          id,
          pacts!inner (
            id,
            name,
            group_id,
            groups!inner (
              id,
              name
            )
          )
        )
      `)
      .eq('id', body.threadId)
      .single();

    if (threadError || !thread) {
      console.error('Error fetching thread:', threadError);
      return createErrorResponse('Failed to fetch thread', 500);
    }

    const checkIn = thread.check_ins;
    const pact = checkIn.pacts;
    const group = pact.groups;

    // Fetch tagged users
    const { data: taggedUsers, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, push_token, settings')
      .in('id', body.taggedUserIds);

    if (usersError) {
      console.error('Error fetching tagged users:', usersError);
      return createErrorResponse('Failed to fetch tagged users', 500);
    }

    if (!taggedUsers || taggedUsers.length === 0) {
      return createJsonResponse({
        success: true,
        notifications_sent: 0,
        message: 'No valid tagged users found',
      });
    }

    // Build messages for eligible recipients
    const messages: ReturnType<typeof createPushMessage>[] = [];

    for (const user of taggedUsers) {
      // Don't notify the tagger if they tagged themselves
      if (user.id === body.taggerId) {
        continue;
      }

      // Skip if no valid push token
      if (!user.push_token || !isExpoPushToken(user.push_token)) {
        continue;
      }

      // Check notification preferences
      const preferences = getUserNotificationPreferences(user.settings);
      if (!isNotificationEnabled(preferences, 'tagged_in_roast')) {
        continue;
      }

      // Create the notification message
      const message = createPushMessage(user.push_token, 'tagged_in_roast', {
        groupId: group.id,
        groupName: group.name,
        pactId: pact.id,
        pactName: pact.name,
        threadId: thread.id,
        checkInId: checkIn.id,
        responseId: body.responseId,
        userId: tagger.id,
        userName: tagger.display_name,
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
      tagged_by: tagger.display_name,
    });
  } catch (error) {
    console.error('notify-roast-tag error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});
