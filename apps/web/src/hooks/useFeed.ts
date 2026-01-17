import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { FeedItem, CheckInFeedItem } from '@cooked/shared';

interface UseFeedReturn {
  feedItems: FeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

interface CheckInWithRelations {
  id: string;
  pact_id: string;
  user_id: string;
  status: 'success' | 'fold';
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

      // Get current offset
      const currentOffset = isRefresh ? 0 : offset;
      
      try {

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
          .map((checkIn) => ({
            id: checkIn.id,
            type: 'check_in' as const,
            group_id: groupId,
            created_at: checkIn.created_at,
            check_in: {
              id: checkIn.id,
              pact_id: checkIn.pact_id,
              user_id: checkIn.user_id,
              status: checkIn.status,
              excuse: checkIn.excuse,
              proof_url: checkIn.proof_url,
              check_in_date: checkIn.check_in_date,
              created_at: checkIn.created_at,
            },
            user: {
              id: checkIn.users!.id,
              display_name: checkIn.users!.display_name,
              avatar_url: checkIn.users!.avatar_url,
            },
            pact: {
              id: checkIn.pacts!.id,
              name: checkIn.pacts!.name,
            },
          }));

        if (isRefresh || currentOffset === 0) {
          setFeedItems(items);
        } else {
          setFeedItems((prev) => [...prev, ...items]);
        }

        setHasMore(items.length === PAGE_SIZE);
        const newOffset = currentOffset + items.length;
        setOffset(newOffset);
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

  // Initial load
  useEffect(() => {
    if (groupId) {
      setIsLoading(true);
      setOffset(0);
      setFeedItems([]);
      setHasMore(true);
      // Use a small delay to ensure state is reset
      setTimeout(() => {
        fetchFeed(false);
      }, 0);
    }
  }, [groupId, fetchFeed]);

  // Refresh
  const refresh = useCallback(async () => {
    await fetchFeed(true);
  }, [fetchFeed]);

  // Load more
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading && !isRefreshing) {
      await fetchFeed(false);
    }
  }, [hasMore, isLoading, isRefreshing, fetchFeed]);

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
