'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getTodayDate } from '@/utils/pactUtils';

type CheckInStatus = 'success' | 'fold';

interface CreateCheckInParams {
  pactId: string;
  status: CheckInStatus;
  excuse?: string;
  proofFile?: File | null;
}

interface UseCheckInsReturn {
  isLoading: boolean;
  error: string | null;
  createCheckIn: (params: CreateCheckInParams) => Promise<{ id: string } | null>;
}

async function uploadProof(userId: string, pactId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${pactId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('proofs')
    .upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

  if (uploadError) {
    throw uploadError;
  }

  // Store the storage path in DB (we’ll sign it when rendering on web)
  return path;
}

export function useCheckIns(): UseCheckInsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckIn = useCallback(async (params: CreateCheckInParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to check in');
        return null;
      }

      const checkInDate = getTodayDate();

      let proofPath: string | null = null;
      if (params.proofFile) {
        proofPath = await uploadProof(user.id, params.pactId, params.proofFile);
      }

      const { data: checkIn, error: insertError } = await supabase
        .from('check_ins')
        .insert({
          pact_id: params.pactId,
          user_id: user.id,
          status: params.status,
          excuse: params.excuse?.trim() || null,
          proof_url: proofPath,
          check_in_date: checkInDate,
          is_late: false,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Create check-in error:', insertError);
        setError(insertError.message || 'Failed to create check-in');
        return null;
      }

      // Create roast thread for folds
      if (params.status === 'fold') {
        const { error: threadError } = await supabase.from('roast_threads').insert({
          check_in_id: checkIn.id,
          status: 'open',
        });

        if (threadError) {
          console.error('Create roast thread error:', threadError);
          // Non-fatal for the check-in itself
        }
      }

      return { id: checkIn.id as string };
    } catch (err: any) {
      console.error('Create check-in exception:', err);
      setError(err?.message || 'Failed to create check-in');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, createCheckIn };
}

