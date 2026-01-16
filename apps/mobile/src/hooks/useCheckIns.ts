import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app';
import type { CheckIn } from '@/types';

interface CreateCheckInParams {
  pactId: string;
  status: 'success' | 'fold';
  excuse?: string;
  proofUrl?: string;
}

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
}

interface UseCheckInsReturn {
  isLoading: boolean;
  error: string | null;
  createCheckIn: (params: CreateCheckInParams) => Promise<CheckIn | null>;
  getTodayCheckIn: (pactId: string) => Promise<CheckIn | null>;
  fetchUserPactsWithStatus: (groupId: string) => Promise<PactWithCheckInStatus[]>;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Check if a pact is due today based on frequency
function isPactDueToday(
  frequency: 'daily' | 'weekly' | 'custom',
  frequencyDays: number[] | null,
  pactType: string,
  relayDays?: number[] | null
): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  if (frequency === 'daily') {
    // For relay pacts, check if today is user's assigned day
    if (pactType === 'relay' && relayDays) {
      return relayDays.includes(dayOfWeek);
    }
    return true;
  }

  if (frequency === 'weekly') {
    // Weekly pacts are due on Monday (day 1)
    if (pactType === 'relay' && relayDays) {
      return relayDays.includes(dayOfWeek);
    }
    return dayOfWeek === 1;
  }

  if (frequency === 'custom' && frequencyDays) {
    // For relay pacts, check if today is user's assigned day
    if (pactType === 'relay' && relayDays) {
      return relayDays.includes(dayOfWeek);
    }
    return frequencyDays.includes(dayOfWeek);
  }

  return false;
}

export function useCheckIns(): UseCheckInsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAppStore((state) => state.user);

  // Create a new check-in
  const createCheckIn = useCallback(
    async (params: CreateCheckInParams): Promise<CheckIn | null> => {
      if (!user) {
        setError('You must be logged in to check in');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const todayDate = getTodayDate();

        // Check if already checked in today
        const { data: existing } = await supabase
          .from('check_ins')
          .select('id')
          .eq('pact_id', params.pactId)
          .eq('user_id', user.id)
          .eq('check_in_date', todayDate)
          .single();

        if (existing) {
          setError('You already checked in today');
          return null;
        }

        // Create the check-in
        const { data: checkIn, error: createError } = await supabase
          .from('check_ins')
          .insert({
            pact_id: params.pactId,
            user_id: user.id,
            status: params.status,
            excuse: params.excuse || null,
            proof_url: params.proofUrl || null,
            check_in_date: todayDate,
          })
          .select()
          .single();

        if (createError) {
          console.error('Create check-in error:', createError);
          setError('Failed to save check-in');
          return null;
        }

        return checkIn as CheckIn;
      } catch (err) {
        console.error('Create check-in exception:', err);
        setError('Something went wrong');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Get today's check-in for a pact
  const getTodayCheckIn = useCallback(
    async (pactId: string): Promise<CheckIn | null> => {
      if (!user) return null;

      try {
        const todayDate = getTodayDate();

        const { data, error: fetchError } = await supabase
          .from('check_ins')
          .select('*')
          .eq('pact_id', pactId)
          .eq('user_id', user.id)
          .eq('check_in_date', todayDate)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Fetch check-in error:', fetchError);
        }

        return data as CheckIn | null;
      } catch (err) {
        console.error('Fetch check-in exception:', err);
        return null;
      }
    },
    [user]
  );

  // Fetch user's pacts with check-in status for a group
  const fetchUserPactsWithStatus = useCallback(
    async (groupId: string): Promise<PactWithCheckInStatus[]> => {
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
    [user]
  );

  return {
    isLoading,
    error,
    createCheckIn,
    getTodayCheckIn,
    fetchUserPactsWithStatus,
  };
}
