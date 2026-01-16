import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app';
import type { Pact, PactWithParticipants } from '@/types';

interface CreatePactParams {
  groupId: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  frequencyDays?: number[];
  roastLevel: 1 | 2 | 3;
  proofRequired: 'none' | 'optional' | 'required';
  pactType: 'individual' | 'group' | 'relay';
  participantIds: string[];
  relayAssignments?: Record<string, number[]>; // userId -> assigned days (for relay pacts)
}

interface UpdatePactParams {
  pactId: string;
  name?: string;
  description?: string;
  proofRequired?: 'none' | 'optional' | 'required';
  newParticipantIds?: string[]; // Only adding participants is allowed
  relayAssignments?: Record<string, number[]>; // For updating relay day assignments
}

interface UsePactsReturn {
  isLoading: boolean;
  error: string | null;
  createPact: (params: CreatePactParams) => Promise<Pact | null>;
  updatePact: (params: UpdatePactParams) => Promise<boolean>;
  fetchGroupPacts: (groupId: string) => Promise<PactWithParticipants[]>;
  fetchPact: (pactId: string) => Promise<PactWithParticipants | null>;
  archivePact: (pactId: string) => Promise<boolean>;
}

export function usePacts(): UsePactsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAppStore((state) => state.user);

  // Create a new pact
  const createPact = useCallback(
    async (params: CreatePactParams): Promise<Pact | null> => {
      if (!user) {
        setError('You must be logged in to create a pact');
        return null;
      }

      const trimmedName = params.name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        setError('Pact name must be 2-50 characters');
        return null;
      }

      if (params.participantIds.length === 0) {
        setError('At least one participant is required');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create the pact
        const { data: pact, error: createError } = await supabase
          .from('pacts')
          .insert({
            group_id: params.groupId,
            name: trimmedName,
            description: params.description?.trim() || null,
            frequency: params.frequency,
            frequency_days: params.frequency === 'custom' ? params.frequencyDays : null,
            roast_level: params.roastLevel,
            proof_required: params.proofRequired,
            pact_type: params.pactType,
            created_by: user.id,
            start_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single();

        if (createError) {
          console.error('Create pact error:', createError);
          setError('Failed to create pact. Please try again.');
          return null;
        }

        // Add participants with relay assignments if applicable
        const participantInserts = params.participantIds.map((userId) => ({
          pact_id: pact.id,
          user_id: userId,
          relay_days: params.pactType === 'relay' && params.relayAssignments
            ? params.relayAssignments[userId] || null
            : null,
        }));

        const { error: participantError } = await supabase
          .from('pact_participants')
          .insert(participantInserts);

        if (participantError) {
          console.error('Add participants error:', participantError);
          // Clean up the pact if participants couldn't be added
          await supabase.from('pacts').delete().eq('id', pact.id);
          setError('Failed to add participants. Please try again.');
          return null;
        }

        return pact as Pact;
      } catch (err) {
        console.error('Create pact exception:', err);
        setError('Something went wrong. Please try again.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Update a pact (only creator can update)
  const updatePact = useCallback(
    async (params: UpdatePactParams): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in to update a pact');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Verify user is the creator
        const { data: pact, error: fetchError } = await supabase
          .from('pacts')
          .select('created_by, pact_type')
          .eq('id', params.pactId)
          .single();

        if (fetchError || !pact) {
          setError('Pact not found');
          return false;
        }

        if (pact.created_by !== user.id) {
          setError('Only the pact creator can edit it');
          return false;
        }

        // Build update object
        const updates: Record<string, unknown> = {};

        if (params.name !== undefined) {
          const trimmedName = params.name.trim();
          if (trimmedName.length < 2 || trimmedName.length > 50) {
            setError('Pact name must be 2-50 characters');
            return false;
          }
          updates.name = trimmedName;
        }

        if (params.description !== undefined) {
          updates.description = params.description.trim() || null;
        }

        if (params.proofRequired !== undefined) {
          updates.proof_required = params.proofRequired;
        }

        // Update pact if there are changes
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('pacts')
            .update(updates)
            .eq('id', params.pactId);

          if (updateError) {
            console.error('Update pact error:', updateError);
            setError('Failed to update pact');
            return false;
          }
        }

        // Add new participants if specified
        if (params.newParticipantIds && params.newParticipantIds.length > 0) {
          const participantInserts = params.newParticipantIds.map((userId) => ({
            pact_id: params.pactId,
            user_id: userId,
            relay_days: pact.pact_type === 'relay' && params.relayAssignments
              ? params.relayAssignments[userId] || null
              : null,
          }));

          const { error: participantError } = await supabase
            .from('pact_participants')
            .insert(participantInserts);

          if (participantError) {
            console.error('Add participants error:', participantError);
            setError('Failed to add new participants');
            return false;
          }
        }

        // Update relay assignments for existing participants if specified
        if (pact.pact_type === 'relay' && params.relayAssignments) {
          for (const [userId, days] of Object.entries(params.relayAssignments)) {
            if (!params.newParticipantIds?.includes(userId)) {
              await supabase
                .from('pact_participants')
                .update({ relay_days: days })
                .eq('pact_id', params.pactId)
                .eq('user_id', userId);
            }
          }
        }

        return true;
      } catch (err) {
        console.error('Update pact exception:', err);
        setError('Something went wrong');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Fetch all pacts for a group
  const fetchGroupPacts = useCallback(
    async (groupId: string): Promise<PactWithParticipants[]> => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch pacts
        const { data: pacts, error: pactsError } = await supabase
          .from('pacts')
          .select('*')
          .eq('group_id', groupId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (pactsError) {
          console.error('Fetch pacts error:', pactsError);
          setError('Failed to load pacts');
          return [];
        }

        if (!pacts || pacts.length === 0) {
          return [];
        }

        // Fetch participants for all pacts
        const pactIds = pacts.map((p) => p.id);
        const { data: participants, error: participantsError } = await supabase
          .from('pact_participants')
          .select(`
            pact_id,
            user_id,
            relay_days,
            users:user_id (id, display_name, avatar_url)
          `)
          .in('pact_id', pactIds);

        if (participantsError) {
          console.error('Fetch participants error:', participantsError);
        }

        // Combine pacts with participants
        const pactsWithParticipants: PactWithParticipants[] = pacts.map((pact) => {
          const pactParticipants = (participants || [])
            .filter((p) => p.pact_id === pact.id)
            .map((p) => ({
              user_id: p.user_id,
              relay_days: p.relay_days as number[] | null,
              user: p.users as unknown as { id: string; display_name: string; avatar_url: string | null },
            }));

          return {
            ...(pact as Pact),
            participants: pactParticipants,
          };
        });

        return pactsWithParticipants;
      } catch (err) {
        console.error('Fetch pacts exception:', err);
        setError('Failed to load pacts');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch a single pact with participants
  const fetchPact = useCallback(
    async (pactId: string): Promise<PactWithParticipants | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: pact, error: pactError } = await supabase
          .from('pacts')
          .select('*')
          .eq('id', pactId)
          .single();

        if (pactError) {
          console.error('Fetch pact error:', pactError);
          setError('Failed to load pact');
          return null;
        }

        // Fetch participants
        const { data: participants, error: participantsError } = await supabase
          .from('pact_participants')
          .select(`
            pact_id,
            user_id,
            relay_days,
            users:user_id (id, display_name, avatar_url)
          `)
          .eq('pact_id', pactId);

        if (participantsError) {
          console.error('Fetch participants error:', participantsError);
        }

        const pactParticipants = (participants || []).map((p) => ({
          user_id: p.user_id,
          relay_days: p.relay_days as number[] | null,
          user: p.users as unknown as { id: string; display_name: string; avatar_url: string | null },
        }));

        return {
          ...(pact as Pact),
          participants: pactParticipants,
        };
      } catch (err) {
        console.error('Fetch pact exception:', err);
        setError('Failed to load pact');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Archive a pact
  const archivePact = useCallback(
    async (pactId: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if user is the creator
        const { data: pact } = await supabase
          .from('pacts')
          .select('created_by')
          .eq('id', pactId)
          .single();

        if (!pact || pact.created_by !== user.id) {
          setError('Only the pact creator can archive it');
          return false;
        }

        const { error: archiveError } = await supabase
          .from('pacts')
          .update({ status: 'archived' })
          .eq('id', pactId);

        if (archiveError) {
          console.error('Archive pact error:', archiveError);
          setError('Failed to archive pact');
          return false;
        }

        return true;
      } catch (err) {
        console.error('Archive pact exception:', err);
        setError('Something went wrong');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    isLoading,
    error,
    createPact,
    updatePact,
    fetchGroupPacts,
    fetchPact,
    archivePact,
  };
}
