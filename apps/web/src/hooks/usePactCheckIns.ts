'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { signProofUrlIfNeeded } from '@/utils/storage';

export interface PactCheckInItem {
  id: string;
  pact_id: string;
  user_id: string;
  status: 'success' | 'fold';
  excuse: string | null;
  proof_url: string | null;
  check_in_date: string;
  created_at: string;
  user: { id: string; display_name: string; avatar_url: string | null };
}

interface UsePactCheckInsReturn {
  items: PactCheckInItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

const PAGE_SIZE = 20;

export function usePactCheckIns(pactId: string | null): UsePactCheckInsReturn {
  const [items, setItems] = useState<PactCheckInItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const offsetRef = useRef(0);

  const fetchPage = useCallback(
    async (isRefresh: boolean) => {
      if (!pactId) {
        setItems([]);
        setIsLoading(false);
        setIsRefreshing(false);
        setHasMore(false);
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
        offsetRef.current = 0;
      } else {
        setIsLoading(true);
      }
      setError(null);

      const offset = isRefresh ? 0 : offsetRef.current;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setItems([]);
          setHasMore(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('check_ins')
          .select(
            `
            id,pact_id,user_id,status,excuse,proof_url,check_in_date,created_at,
            users:user_id (id, display_name, avatar_url)
          `
          )
          .eq('pact_id', pactId)
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (fetchError) {
          console.error('Fetch pact check-ins error:', fetchError);
          setError(fetchError.message || 'Failed to load check-ins');
          return;
        }

        const raw = (data || []) as unknown as Array<{
          id: string;
          pact_id: string;
          user_id: string;
          status: 'success' | 'fold';
          excuse: string | null;
          proof_url: string | null;
          check_in_date: string;
          created_at: string;
          users: { id: string; display_name: string; avatar_url: string | null } | null;
        }>;

        const signed = await Promise.all(
          raw
            .filter((r) => r.users)
            .map(async (r) => {
              const signedProof = await signProofUrlIfNeeded(r.proof_url);
              return {
                id: r.id,
                pact_id: r.pact_id,
                user_id: r.user_id,
                status: r.status,
                excuse: r.excuse,
                proof_url: signedProof,
                check_in_date: r.check_in_date,
                created_at: r.created_at,
                user: r.users!,
              } satisfies PactCheckInItem;
            })
        );

        if (isRefresh || offset === 0) {
          setItems(signed);
        } else {
          setItems((prev) => [...prev, ...signed]);
        }

        setHasMore(signed.length === PAGE_SIZE);
        offsetRef.current = offset + signed.length;
      } catch (e) {
        console.error('Fetch pact check-ins exception:', e);
        setError('Failed to load check-ins');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [pactId]
  );

  useEffect(() => {
    setIsLoading(true);
    setItems([]);
    setHasMore(true);
    setError(null);
    offsetRef.current = 0;
    fetchPage(true);
  }, [fetchPage]);

  const refresh = useCallback(async () => {
    await fetchPage(true);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isRefreshing) return;
    await fetchPage(false);
  }, [fetchPage, hasMore, isLoading, isRefreshing]);

  return { items, isLoading, isRefreshing, error, hasMore, refresh, loadMore };
}

