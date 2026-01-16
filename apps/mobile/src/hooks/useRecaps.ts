import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { WeeklyRecap, RecapData } from '@/types';

interface UseRecapsReturn {
  isLoading: boolean;
  error: string | null;
  fetchRecap: (recapId: string) => Promise<WeeklyRecap | null>;
  fetchLatestRecap: (groupId: string) => Promise<WeeklyRecap | null>;
  fetchRecapHistory: (groupId: string, limit?: number) => Promise<WeeklyRecap[]>;
}

export function useRecaps(): UseRecapsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch a specific recap by ID
  const fetchRecap = useCallback(
    async (recapId: string): Promise<WeeklyRecap | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('weekly_recaps')
          .select('*')
          .eq('id', recapId)
          .single();

        if (fetchError) {
          console.error('Fetch recap error:', fetchError);
          setError('Failed to load recap');
          return null;
        }

        return {
          id: data.id,
          group_id: data.group_id,
          week_start: data.week_start,
          week_end: data.week_end,
          data: data.data as RecapData,
          created_at: data.created_at,
        };
      } catch (err) {
        console.error('Fetch recap exception:', err);
        setError('Something went wrong');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch the most recent recap for a group
  const fetchLatestRecap = useCallback(
    async (groupId: string): Promise<WeeklyRecap | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('weekly_recaps')
          .select('*')
          .eq('group_id', groupId)
          .order('week_end', { ascending: false })
          .limit(1)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Fetch latest recap error:', fetchError);
          setError('Failed to load recap');
          return null;
        }

        if (!data) {
          return null;
        }

        return {
          id: data.id,
          group_id: data.group_id,
          week_start: data.week_start,
          week_end: data.week_end,
          data: data.data as RecapData,
          created_at: data.created_at,
        };
      } catch (err) {
        console.error('Fetch latest recap exception:', err);
        setError('Something went wrong');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch recap history for a group
  const fetchRecapHistory = useCallback(
    async (groupId: string, limit: number = 10): Promise<WeeklyRecap[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('weekly_recaps')
          .select('*')
          .eq('group_id', groupId)
          .order('week_end', { ascending: false })
          .limit(limit);

        if (fetchError) {
          console.error('Fetch recap history error:', fetchError);
          setError('Failed to load recaps');
          return [];
        }

        return (data || []).map((d) => ({
          id: d.id,
          group_id: d.group_id,
          week_start: d.week_start,
          week_end: d.week_end,
          data: d.data as RecapData,
          created_at: d.created_at,
        }));
      } catch (err) {
        console.error('Fetch recap history exception:', err);
        setError('Something went wrong');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    fetchRecap,
    fetchLatestRecap,
    fetchRecapHistory,
  };
}
