/**
 * notify-roast-response Edge Function
 *
 * Sends push notifications when a new response is added to a roast thread
 * Notifies all participants in the thread (people who have responded or were roasted)
 *
 * Endpoint: POST /functions/v1/notify-roast-response
 *
 * Request body:
 * {
 *   "responseId": "uuid",    // The new roast response
 *   "threadId": "uuid",      // The roast thread
 *   "responderId": "uuid"    // User who created the response
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

interface NotifyRoastResponseRequest {
  responseId: string;
  threadId: string;
  responderId: string;
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
    const body: NotifyRoastResponseRequest = await req.json();

    // Validate required fields
    if (!body.responseId || !body.threadId || !body.responderId) {
      return createErrorResponse('Missing required fields');
    }

    const supabase = createSupabaseClient();

    // Fetch responder info
    const { data: responder, error: responderError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', body.responderId)
      .single();

    if (responderError || !responder) {
      console.error('Error fetching responder:', responderError);
      return createErrorResponse('Failed to fetch responder', 500);
    }

    // Fetch thread with check-in (to get the roasted user), pact, and group
    const { data: thread, error: threadError } = await supabase
      .from('roast_threads')
      .select(`
        id,
        check_ins!inner (
          id,
          user_id,
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

    // Get all users who have participated in this thread
    // This includes: the person who was roasted + everyone who has responded
    const { data: responses, error: responsesError } = await supabase
      .from('roast_responses')
      .select('user_id')
      .eq('thread_id', body.threadId);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return createErrorResponse('Failed to fetch thread participants', 500);
    }

    // Collect unique participant IDs (exclude the current responder)
    const participantIds = new Set<string>();

    // Add the person who was roasted (owner of the check-in)
    participantIds.add(checkIn.user_id);

    // Add all responders
    for (const response of responses || []) {
      participantIds.add(response.user_id);
    }

    // Remove the current responder
    participantIds.delete(body.responderId);

    if (participantIds.size === 0) {
      return createJsonResponse({
        success: true,
        notifications_sent: 0,
        message: 'No other participants in thread',
      });
    }

    // Fetch participant details
    const { data: participants, error: participantsError } = await supabase
      .from('users')
      .select('id, display_name, push_token, settings')
      .in('id', Array.from(participantIds));

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return createErrorResponse('Failed to fetch participants', 500);
    }

    if (!participants || participants.length === 0) {
      return createJsonResponse({
        success: true,
        notifications_sent: 0,
        message: 'No participants found',
      });
    }

    // Build messages for eligible recipients
    const messages: ReturnType<typeof createPushMessage>[] = [];

    for (const user of participants) {
      // Skip if no valid push token
      if (!user.push_token || !isExpoPushToken(user.push_token)) {
        continue;
      }

      // Check notification preferences
      const preferences = getUserNotificationPreferences(user.settings);
      if (!isNotificationEnabled(preferences, 'new_roast_response')) {
        continue;
      }

      // Create the notification message
      const message = createPushMessage(user.push_token, 'new_roast_response', {
        groupId: group.id,
        groupName: group.name,
        pactId: pact.id,
        pactName: pact.name,
        threadId: thread.id,
        checkInId: checkIn.id,
        responseId: body.responseId,
        userId: responder.id,
        userName: responder.display_name,
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
      responder: responder.display_name,
      thread_participants: participantIds.size,
    });
  } catch (error) {
    console.error('notify-roast-response error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});
