/**
 * notify-fold Edge Function
 *
 * Sends push notifications when a user folds (fails to check in)
 * Can be called from a database trigger or directly from the app
 *
 * Endpoint: POST /functions/v1/notify-fold
 *
 * Request body:
 * {
 *   "checkInId": "uuid",     // Required: The check-in record
 *   "folderId": "uuid",      // Required: The user who folded
 *   "pactId": "uuid",        // Required: The pact they folded on
 *   "groupId": "uuid"        // Optional: If not provided, will be fetched from pact
 * }
 *
 * Database trigger example:
 * CREATE OR REPLACE FUNCTION notify_fold_trigger()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   IF NEW.status = 'fold' THEN
 *     PERFORM net.http_post(
 *       url := 'https://<project-ref>.supabase.co/functions/v1/notify-fold',
 *       headers := '{"Authorization": "Bearer <service-role-key>", "Content-Type": "application/json"}'::jsonb,
 *       body := json_build_object(
 *         'checkInId', NEW.id,
 *         'folderId', NEW.user_id,
 *         'pactId', NEW.pact_id
 *       )::jsonb
 *     );
 *   END IF;
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * CREATE TRIGGER on_fold_insert
 *   AFTER INSERT ON check_ins
 *   FOR EACH ROW
 *   EXECUTE FUNCTION notify_fold_trigger();
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

interface NotifyFoldRequest {
  checkInId: string;
  folderId: string;
  pactId: string;
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
    const body: NotifyFoldRequest = await req.json();

    // Validate required fields
    if (!body.checkInId || !body.folderId || !body.pactId) {
      return createErrorResponse('Missing required fields: checkInId, folderId, pactId');
    }

    const supabase = createSupabaseClient();

    // Fetch the folder's info
    const { data: folder, error: folderError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', body.folderId)
      .single();

    if (folderError || !folder) {
      console.error('Error fetching folder:', folderError);
      return createErrorResponse('Failed to fetch folder user', 500);
    }

    // Fetch the pact with group info and all participants
    const { data: pact, error: pactError } = await supabase
      .from('pacts')
      .select(`
        id,
        name,
        group_id,
        groups!inner (
          id,
          name
        ),
        pact_participants!inner (
          user_id,
          users!inner (
            id,
            display_name,
            push_token,
            settings
          )
        )
      `)
      .eq('id', body.pactId)
      .single();

    if (pactError || !pact) {
      console.error('Error fetching pact:', pactError);
      return createErrorResponse('Failed to fetch pact', 500);
    }

    const group = pact.groups;

    // Get all group members (not just pact participants) who should be notified
    // This allows group members to see folds even if they're not in the pact
    const { data: groupMembers, error: membersError } = await supabase
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
      .eq('group_id', pact.group_id);

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return createErrorResponse('Failed to fetch group members', 500);
    }

    if (!groupMembers || groupMembers.length === 0) {
      return createJsonResponse({
        success: true,
        notifications_sent: 0,
        message: 'No group members found',
      });
    }

    // Filter eligible recipients (exclude the folder, check preferences)
    const messages: ReturnType<typeof createPushMessage>[] = [];

    for (const member of groupMembers) {
      const user = member.users;

      // Don't notify the person who folded
      if (user.id === body.folderId) {
        continue;
      }

      // Skip if no valid push token
      if (!user.push_token || !isExpoPushToken(user.push_token)) {
        continue;
      }

      // Check notification preferences
      const preferences = getUserNotificationPreferences(user.settings);
      if (!isNotificationEnabled(preferences, 'fold_alert')) {
        continue;
      }

      // Create the notification message
      const message = createPushMessage(user.push_token, 'fold_alert', {
        groupId: group.id,
        groupName: group.name,
        pactId: pact.id,
        pactName: pact.name,
        userId: folder.id,
        userName: folder.display_name,
        checkInId: body.checkInId,
      });

      messages.push(message);
    }

    if (messages.length === 0) {
      return createJsonResponse({
        success: true,
        notifications_sent: 0,
        message: 'No eligible recipients (preferences or no tokens)',
      });
    }

    // Send notifications
    const tickets = await sendExpoPushNotifications(messages);

    // Count results
    const successCount = tickets.filter((t) => t.status === 'ok').length;
    const failureCount = tickets.filter((t) => t.status === 'error').length;

    // Log failures and handle invalid tokens
    tickets.forEach((ticket, index) => {
      if (ticket.status === 'error') {
        console.error(`Failed to send fold notification:`, ticket.message, ticket.details);

        if (ticket.details?.error === 'DeviceNotRegistered') {
          // Find the user for this message and clear their token
          const recipientToken = messages[index].to;
          const recipient = groupMembers.find((m) => m.users.push_token === recipientToken);
          if (recipient) {
            supabase
              .from('users')
              .update({ push_token: null })
              .eq('id', recipient.user_id);
          }
        }
      }
    });

    return createJsonResponse({
      success: true,
      notifications_sent: successCount,
      failed: failureCount,
      folder: folder.display_name,
      pact: pact.name,
    });
  } catch (error) {
    console.error('notify-fold error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});
