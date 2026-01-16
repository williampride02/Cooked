/**
 * check-in-reminder Edge Function
 *
 * Scheduled function to send daily check-in reminders
 * Should be triggered by a cron job (e.g., pg_cron or external scheduler)
 *
 * Finds all active pacts for today and sends reminders to participants
 * who haven't checked in yet.
 *
 * Endpoint: POST /functions/v1/check-in-reminder
 *
 * Request body (optional):
 * {
 *   "pactId": "uuid" // If specified, only send reminders for this pact
 * }
 *
 * Cron setup (run daily at 9 AM, 12 PM, and 6 PM):
 * SELECT cron.schedule('check-in-reminder-morning', '0 9 * * *', $$
 *   SELECT net.http_post(
 *     url := 'https://<project-ref>.supabase.co/functions/v1/check-in-reminder',
 *     headers := '{"Authorization": "Bearer <anon-key>", "Content-Type": "application/json"}'::jsonb,
 *     body := '{}'::jsonb
 *   );
 * $$);
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

interface CheckInReminderRequest {
  pactId?: string;
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
    let body: CheckInReminderRequest = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine
    }

    const supabase = createSupabaseClient();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Build query for active pacts that require check-in today
    let pactsQuery = supabase
      .from('pacts')
      .select(`
        id,
        name,
        frequency,
        frequency_days,
        group_id,
        groups!inner (
          id,
          name
        ),
        pact_participants!inner (
          user_id,
          relay_days,
          users!inner (
            id,
            display_name,
            push_token,
            settings
          )
        )
      `)
      .eq('status', 'active')
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    // Filter by specific pact if provided
    if (body.pactId) {
      pactsQuery = pactsQuery.eq('id', body.pactId);
    }

    const { data: pacts, error: pactsError } = await pactsQuery;

    if (pactsError) {
      console.error('Error fetching pacts:', pactsError);
      return createErrorResponse('Failed to fetch pacts', 500);
    }

    if (!pacts || pacts.length === 0) {
      return createJsonResponse({
        success: true,
        reminders_sent: 0,
        message: 'No active pacts found',
      });
    }

    // Filter pacts that are due today based on frequency
    const pactsDueToday = pacts.filter((pact) => {
      if (pact.frequency === 'daily') {
        return true;
      }

      if (pact.frequency === 'weekly') {
        // Weekly pacts are due on Sunday (day 0) by default
        // Or you could make this configurable
        return dayOfWeek === 0;
      }

      if (pact.frequency === 'custom' && pact.frequency_days) {
        // Custom frequency uses ISO week days where 1 = Monday
        // Convert JS day (0 = Sunday) to ISO (7 = Sunday, 1 = Monday)
        const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;
        return pact.frequency_days.includes(isoDay);
      }

      return false;
    });

    if (pactsDueToday.length === 0) {
      return createJsonResponse({
        success: true,
        reminders_sent: 0,
        message: 'No pacts due today',
      });
    }

    // Get all check-ins for today to filter out users who already checked in
    const pactIds = pactsDueToday.map((p) => p.id);
    const { data: todaysCheckIns, error: checkInsError } = await supabase
      .from('check_ins')
      .select('pact_id, user_id')
      .in('pact_id', pactIds)
      .eq('check_in_date', today);

    if (checkInsError) {
      console.error('Error fetching check-ins:', checkInsError);
      return createErrorResponse('Failed to fetch check-ins', 500);
    }

    // Create a set of pact_id:user_id for quick lookup
    const checkedInSet = new Set(
      (todaysCheckIns || []).map((ci) => `${ci.pact_id}:${ci.user_id}`)
    );

    // Collect messages to send
    const messages: { message: ReturnType<typeof createPushMessage>; pact: any; user: any }[] = [];

    for (const pact of pactsDueToday) {
      const group = pact.groups;

      for (const participant of pact.pact_participants) {
        const user = participant.users;

        // Skip if user already checked in today
        if (checkedInSet.has(`${pact.id}:${user.id}`)) {
          continue;
        }

        // For relay pacts, only notify the user assigned to today
        if (pact.pact_type === 'relay' && participant.relay_days) {
          const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;
          if (!participant.relay_days.includes(isoDay)) {
            continue;
          }
        }

        // Skip if no valid push token
        if (!user.push_token || !isExpoPushToken(user.push_token)) {
          continue;
        }

        // Check notification preferences
        const preferences = getUserNotificationPreferences(user.settings);
        if (!isNotificationEnabled(preferences, 'check_in_reminder')) {
          continue;
        }

        // Create the notification message
        const message = createPushMessage(user.push_token, 'check_in_reminder', {
          groupId: group.id,
          groupName: group.name,
          pactId: pact.id,
          pactName: pact.name,
        });

        messages.push({ message, pact, user });
      }
    }

    if (messages.length === 0) {
      return createJsonResponse({
        success: true,
        reminders_sent: 0,
        message: 'All participants have already checked in or notifications disabled',
      });
    }

    // Send all notifications
    const tickets = await sendExpoPushNotifications(messages.map((m) => m.message));

    // Count successes and handle failures
    let successCount = 0;
    let failureCount = 0;

    tickets.forEach((ticket, index) => {
      if (ticket.status === 'ok') {
        successCount++;
      } else {
        failureCount++;
        console.error(
          `Failed to send reminder to ${messages[index].user.id}:`,
          ticket.message,
          ticket.details
        );

        // Clear invalid push tokens
        if (ticket.details?.error === 'DeviceNotRegistered') {
          supabase
            .from('users')
            .update({ push_token: null })
            .eq('id', messages[index].user.id);
        }
      }
    });

    return createJsonResponse({
      success: true,
      reminders_sent: successCount,
      failed: failureCount,
      pacts_processed: pactsDueToday.length,
    });
  } catch (error) {
    console.error('check-in-reminder error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});
