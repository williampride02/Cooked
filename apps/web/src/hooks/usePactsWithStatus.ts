'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Pact, CheckIn } from '@cooked/shared';
import { isPactDueToday, getTodayDate } from '@/utils/pactUtils';

interface PactWithCheckInStatus {
  id: string;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'custom';
  frequency_days: number[] | null;
  roast_level: 1 | 2 | 3;
  proof_required: 'none' | 'optional' | 'required';
  pact_type: 'individual' | 'group' | 'relay';
  group_id: string;
  hasCheckedInToday: boolean;
  isDueToday: boolean;
  todayCheckIn: CheckIn | null;
  relayDays?: number[] | null; // User's relay days for relay pacts
}

interface UsePactsWithStatusReturn {
  isLoading: boolean;
  error: string | null;
  fetchUserPactsWithStatus: (groupId: string) => Promise<PactWithCheckInStatus[]>;
}

export function usePactsWithStatus(): UsePactsWithStatusReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current user
  const getCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }, []);

  // Fetch user's pacts with check-in status for a group
  const fetchUserPactsWithStatus = useCallback(
    async (groupId: string): Promise<PactWithCheckInStatus[]> => {
      const user = await getCurrentUser();
      if (!user) return [];

      setIsLoading(true);
      setError(null);

      try {
        // Fetch pacts where user is a participant
        const { data: participations, error: participationsError } = await supabase
          .from('pact_participants')
          .select(`
            pact_id,
            relay_days,
            pacts:pact_id (
              id,
              name,
              description,
              frequency,
              frequency_days,
              roast_level,
              proof_required,
              pact_type,
              group_id,
              status
            )
          `)
          .eq('user_id', user.id);

        if (participationsError) {
          console.error('Fetch participations error:', participationsError);
          setError('Failed to load pacts');
          return [];
        }

        // Filter to active pacts in this group
        const pacts = (participations || [])
          .filter((p) => {
            const pact = p.pacts as unknown as { group_id: string; status: string };
            return pact && pact.group_id === groupId && pact.status === 'active';
          })
          .map((p) => ({
            ...(p.pacts as unknown as Omit<PactWithCheckInStatus, 'hasCheckedInToday' | 'isDueToday' | 'todayCheckIn'>),
            relayDays: p.relay_days as number[] | null,
          }));

        if (pacts.length === 0) {
          return [];
        }

        // Fetch today's check-ins for these pacts
        const todayDate = getTodayDate();
        const pactIds = pacts.map((p) => p.id);

        const { data: checkIns, error: checkInsError } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', user.id)
          .eq('check_in_date', todayDate)
          .in('pact_id', pactIds);

        if (checkInsError) {
          console.error('Fetch check-ins error:', checkInsError);
        }

        // Combine pacts with check-in status
        const pactsWithStatus: PactWithCheckInStatus[] = pacts.map((pact) => {
          const todayCheckIn = (checkIns || []).find((c) => c.pact_id === pact.id) || null;
          const isDueToday = isPactDueToday(
            pact.frequency,
            pact.frequency_days,
            pact.pact_type,
            pact.relayDays
          );

          return {
            id: pact.id,
            name: pact.name,
            description: pact.description,
            frequency: pact.frequency,
            frequency_days: pact.frequency_days,
            roast_level: pact.roast_level,
            proof_required: pact.proof_required,
            pact_type: pact.pact_type,
            group_id: pact.group_id,
            hasCheckedInToday: !!todayCheckIn,
            isDueToday,
            todayCheckIn: todayCheckIn as CheckIn | null,
            relayDays: pact.relayDays,
          };
        });

        return pactsWithStatus;
      } catch (err) {
        console.error('Fetch pacts with status exception:', err);
        setError('Failed to load pacts');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [getCurrentUser]
  );

  return {
    isLoading,
    error,
    fetchUserPactsWithStatus,
  };
}
