/**
 * missed-check-in-auto-fold Edge Function
 *
 * Scheduled function to automatically mark missed check-ins as folds.
 *
 * Goal:
 * - For each active pact that is due "yesterday" for a participant, if they did not check in,
 *   create a fold check-in with excuse "Ghosted 👻" and create a roast thread.
 *
 * Endpoint: POST /functions/v1/missed-check-in-auto-fold
 *
 * Request body (optional):
 * {
 *   "date": "YYYY-MM-DD" // If specified, treat this as "today" and auto-fold for (date - 1 day).
 * }
 *
 * Notes:
 * - Initial implementation uses a single UTC "yesterday" date to keep it simple and reliable.
 * - Timezone-aware processing can be layered on later by grouping users by timezone from settings.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import {
  handleCorsPreflightRequest,
  createJsonResponse,
  createErrorResponse,
} from '../_shared/cors.ts';

interface AutoFoldRequest {
  date?: string; // YYYY-MM-DD
}

type PactRow = {
  id: string;
  name: string;
  pact_type: 'individual' | 'group' | 'relay';
  frequency: 'daily' | 'weekly' | 'custom';
  frequency_days: number[] | null;
  start_date: string;
  end_date: string | null;
  group_id: string;
};

type ParticipantRow = {
  user_id: string;
  relay_days: number[] | null;
};

function formatDateYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDateYYYYMMDD(s: string): Date {
  // Treat as UTC date
  return new Date(`${s}T00:00:00.000Z`);
}

function isPactDueOnDate(
  pact: Pick<PactRow, 'frequency' | 'frequency_days'>,
  date: Date
): boolean {
  const dayOfWeek = date.getUTCDay(); // 0=Sun..6=Sat

  if (pact.frequency === 'daily') return true;

  if (pact.frequency === 'weekly') {
    // Weekly due Sunday by default (matches check-in-reminder)
    return dayOfWeek === 0;
  }

  if (pact.frequency === 'custom' && pact.frequency_days) {
    // Custom uses ISO days where 1=Mon..7=Sun
    const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    return pact.frequency_days.includes(isoDay);
  }

  return false;
}

function isParticipantDueOnDate(
  pact: Pick<PactRow, 'pact_type'>,
  participant: Pick<ParticipantRow, 'relay_days'>,
  date: Date
): boolean {
  if (pact.pact_type !== 'relay') return true;
  if (!participant.relay_days || participant.relay_days.length === 0) return false;
  const isoDay = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  return participant.relay_days.includes(isoDay);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    let body: AutoFoldRequest = {};
    try {
      body = await req.json();
    } catch {
      // ok
    }

    const supabase = createSupabaseClient();

    const today = body.date ? parseDateYYYYMMDD(body.date) : new Date();
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const todayStr = formatDateYYYYMMDD(today);
    const yesterdayStr = formatDateYYYYMMDD(yesterday);

    // Fetch active pacts that were active yesterday (start_date <= yesterday <= end_date or end_date null)
    const { data: pacts, error: pactsError } = await supabase
      .from('pacts')
      .select(
        'id,name,pact_type,frequency,frequency_days,start_date,end_date,group_id'
      )
      .eq('status', 'active')
      .lte('start_date', yesterdayStr)
      .or(`end_date.is.null,end_date.gte.${yesterdayStr}`);

    if (pactsError) {
      console.error('Error fetching pacts:', pactsError);
      return createErrorResponse('Failed to fetch pacts', 500);
    }

    const typedPacts = (pacts || []) as PactRow[];
    const pactsDue = typedPacts.filter((p) => isPactDueOnDate(p, yesterday));

    if (pactsDue.length === 0) {
      return createJsonResponse({
        success: true,
        date: todayStr,
        folded_for_date: yesterdayStr,
        pacts_processed: 0,
        folds_created: 0,
        message: 'No pacts due yesterday',
      });
    }

    // Fetch participants for due pacts
    const pactIds = pactsDue.map((p) => p.id);
    const { data: participants, error: participantsError } = await supabase
      .from('pact_participants')
      .select('pact_id,user_id,relay_days')
      .in('pact_id', pactIds);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return createErrorResponse('Failed to fetch participants', 500);
    }

    type ParticipantWithPactId = ParticipantRow & { pact_id: string };
    const typedParticipants = (participants || []) as ParticipantWithPactId[];

    // Fetch check-ins already recorded for yesterday
    const { data: existingCheckIns, error: checkInsError } = await supabase
      .from('check_ins')
      .select('pact_id,user_id')
      .in('pact_id', pactIds)
      .eq('check_in_date', yesterdayStr);

    if (checkInsError) {
      console.error('Error fetching existing check-ins:', checkInsError);
      return createErrorResponse('Failed to fetch existing check-ins', 500);
    }

    const checkedInSet = new Set(
      (existingCheckIns || []).map((ci) => `${ci.pact_id}:${ci.user_id}`)
    );

    let foldsCreated = 0;
    let threadsCreated = 0;
    const errors: Array<{ pact_id: string; user_id: string; error: unknown }> = [];

    for (const pact of pactsDue) {
      const pactParticipants = typedParticipants.filter((pp) => pp.pact_id === pact.id);

      for (const participant of pactParticipants) {
        if (!isParticipantDueOnDate(pact, participant, yesterday)) {
          continue;
        }

        const key = `${pact.id}:${participant.user_id}`;
        if (checkedInSet.has(key)) {
          continue;
        }

        try {
          // Insert fold check-in (unique constraint will prevent duplicates)
          const { data: inserted, error: insertError } = await supabase
            .from('check_ins')
            .insert({
              pact_id: pact.id,
              user_id: participant.user_id,
              status: 'fold',
              excuse: 'Ghosted 👻',
              proof_url: null,
              check_in_date: yesterdayStr,
              is_late: true,
            })
            .select('id')
            .single();

          if (insertError) {
            // If duplicate due to race, ignore; otherwise record error
            console.error('Insert fold check-in error:', insertError);
            errors.push({ pact_id: pact.id, user_id: participant.user_id, error: insertError });
            continue;
          }

          foldsCreated++;
          const checkInId = inserted.id as string;

          // Create roast thread for this fold check-in
          const { error: threadError } = await supabase.from('roast_threads').insert({
            check_in_id: checkInId,
            status: 'open',
          });

          if (threadError) {
            console.error('Create roast thread error:', threadError);
            errors.push({ pact_id: pact.id, user_id: participant.user_id, error: threadError });
          } else {
            threadsCreated++;
          }
        } catch (e) {
          console.error('Auto-fold exception:', e);
          errors.push({ pact_id: pact.id, user_id: participant.user_id, error: e });
        }
      }
    }

    return createJsonResponse({
      success: errors.length === 0,
      date: todayStr,
      folded_for_date: yesterdayStr,
      pacts_processed: pactsDue.length,
      folds_created: foldsCreated,
      roast_threads_created: threadsCreated,
      errors_count: errors.length,
      errors: errors.slice(0, 50), // cap
    });
  } catch (error) {
    console.error('missed-check-in-auto-fold error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});

