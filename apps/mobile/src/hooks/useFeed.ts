import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { FeedItem, CheckInFeedItem } from '@/types';

interface UseFeedReturn {
  feedItems: FeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

// Type for Supabase joined data
interface CheckInWithRelations {
  id: string;
  pact_id: string;
  user_id: string;
  status: string;
  excuse: string | null;
  proof_url: string | null;
  check_in_date: string;
  created_at: string;
  users: { id: string; display_name: string; avatar_url: string | null } | null;
  pacts: { id: string; name: string; group_id: string } | null;
}

const PAGE_SIZE = 20;

export function useFeed(groupId: string | null): UseFeedReturn {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Fetch feed items
  const fetchFeed = useCallback(
    async (isRefresh = false) => {
      if (!groupId) {
        setFeedItems([]);
        setIsLoading(false);
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
        setOffset(0);
      } else if (!isLoading && !isRefreshing) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const currentOffset = isRefresh ? 0 : offset;

        // Fetch check-ins with user and pact data
        const { data: checkIns, error: checkInsError } = await supabase
          .from('check_ins')
          .select(`
            id,
            pact_id,
            user_id,
            status,
            excuse,
            proof_url,
            check_in_date,
            created_at,
            users:user_id (id, display_name, avatar_url),
            pacts:pact_id (id, name, group_id)
          `)
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + PAGE_SIZE - 1);

        if (checkInsError) {
          console.error('Fetch check-ins error:', checkInsError);
          setError('Failed to load feed');
          return;
        }

        // Cast and filter check-ins to only include those from the current group
        const typedCheckIns = (checkIns || []) as unknown as CheckInWithRelations[];
        const groupCheckIns = typedCheckIns.filter(
          (checkIn) => checkIn.pacts?.group_id === groupId
        );

        // Transform to feed items
        const items: CheckInFeedItem[] = groupCheckIns
          .filter((checkIn) => checkIn.users && checkIn.pacts)
          .map((checkIn) => {
          const user = checkIn.users!;
          const pact = checkIn.pacts!;

          return {
            id: checkIn.id,
            type: 'check_in' as const,
            group_id: groupId,
            created_at: checkIn.created_at,
            check_in: {
              id: checkIn.id,
              pact_id: checkIn.pact_id,
              user_id: checkIn.user_id,
              status: checkIn.status as 'success' | 'fold',
              excuse: checkIn.excuse,
              proof_url: checkIn.proof_url,
              check_in_date: checkIn.check_in_date,
              created_at: checkIn.created_at,
            },
            user: {
              id: user.id,
              display_name: user.display_name,
              avatar_url: user.avatar_url,
            },
            pact: {
              id: pact.id,
              name: pact.name,
            },
          };
        });

        if (isRefresh) {
          setFeedItems(items);
          setOffset(PAGE_SIZE);
        } else {
          setFeedItems((prev) => [...prev, ...items]);
          setOffset((prev) => prev + PAGE_SIZE);
        }

        setHasMore(items.length === PAGE_SIZE);
      } catch (err) {
        console.error('Fetch feed exception:', err);
        setError('Failed to load feed');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [groupId, offset, isLoading, isRefreshing]
  );

  // Initial fetch
  useEffect(() => {
    setFeedItems([]);
    setOffset(0);
    setHasMore(true);
    setIsLoading(true);
    fetchFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Real-time subscription
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`feed:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'check_ins',
        },
        async (payload) => {
          // Fetch the new check-in with user and pact data
          const { data: newCheckIn } = await supabase
            .from('check_ins')
            .select(`
              id,
              pact_id,
              user_id,
              status,
              excuse,
              proof_url,
              check_in_date,
              created_at,
              users:user_id (id, display_name, avatar_url),
              pacts:pact_id (id, name, group_id)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newCheckIn) {
            const typedCheckIn = newCheckIn as unknown as CheckInWithRelations;
            if (typedCheckIn.pacts?.group_id === groupId && typedCheckIn.users) {
              const user = typedCheckIn.users;
              const pact = typedCheckIn.pacts;

              const newItem: CheckInFeedItem = {
                id: typedCheckIn.id,
                type: 'check_in',
                group_id: groupId,
                created_at: typedCheckIn.created_at,
                check_in: {
                  id: typedCheckIn.id,
                  pact_id: typedCheckIn.pact_id,
                  user_id: typedCheckIn.user_id,
                  status: typedCheckIn.status as 'success' | 'fold',
                  excuse: typedCheckIn.excuse,
                  proof_url: typedCheckIn.proof_url,
                  check_in_date: typedCheckIn.check_in_date,
                  created_at: typedCheckIn.created_at,
                },
                user: {
                  id: user.id,
                  display_name: user.display_name,
                  avatar_url: user.avatar_url,
                },
                pact: {
                  id: pact.id,
                  name: pact.name,
                },
              };

              setFeedItems((prev) => [newItem, ...prev]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchFeed(true);
  }, [fetchFeed]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isRefreshing) return;
    await fetchFeed(false);
  }, [fetchFeed, hasMore, isLoading, isRefreshing]);

  return {
    feedItems,
    isLoading,
    isRefreshing,
    error,
    refresh,
    loadMore,
    hasMore,
  };
}
