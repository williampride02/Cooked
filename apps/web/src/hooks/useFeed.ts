import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { FeedItem, CheckInFeedItem, PactCreatedFeedItem, MemberJoinedFeedItem, RecapFeedItem } from '@cooked/shared';
import { signProofUrlIfNeeded } from '@/utils/storage';

interface UseFeedReturn {
  feedItems: FeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasNewActivity: boolean;
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
  groups?: { id: string; name: string } | null;
}

interface PactCreatedWithRelations {
  id: string;
  group_id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'custom';
  roast_level: 1 | 2 | 3;
  created_at: string;
  users: { id: string; display_name: string; avatar_url: string | null } | null;
}

interface MemberJoinedWithRelations {
  group_id: string;
  user_id: string;
  joined_at: string;
  users: { id: string; display_name: string; avatar_url: string | null } | null;
}

interface RecapWithRelations {
  id: string;
  group_id: string;
  week_start: string;
  week_end: string;
  created_at: string;
}

const PAGE_SIZE = 20;

export function useFeed(groupId: string | null): UseFeedReturn {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const realtimeDebounceRef = useRef<number | null>(null);
  const newActivityTimeoutRef = useRef<number | null>(null);
  const [hasNewActivity, setHasNewActivity] = useState(false);

  const bumpNewActivity = useCallback(() => {
    setHasNewActivity(true);
    if (newActivityTimeoutRef.current) {
      window.clearTimeout(newActivityTimeoutRef.current);
    }
    newActivityTimeoutRef.current = window.setTimeout(() => {
      setHasNewActivity(false);
      newActivityTimeoutRef.current = null;
    }, 2500);
  }, []);

  // Fetch feed items
  const fetchFeed = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else if (!isLoading && !isRefreshing) {
        setIsLoading(true);
      }
      setError(null);

      // We paginate by increasing the number of merged items shown (stable ordering across multiple tables).
      const desiredCount = isRefresh ? PAGE_SIZE : offsetRef.current + PAGE_SIZE;
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setFeedItems([]);
          setIsLoading(false);
          setIsRefreshing(false);
          setHasMore(false);
          return;
        }

        // Determine which groups are in-scope for the feed.
        let groupIdsForFeed: string[] = [];
        if (groupId) {
          groupIdsForFeed = [groupId];
        } else {
          const { data: memberships, error: memberError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', user.id);

          if (memberError) {
            console.error('Fetch memberships error:', memberError);
            setError('Failed to load groups');
            return;
          }

          if (!memberships || memberships.length === 0) {
            setFeedItems([]);
            setHasMore(false);
            return;
          }

          groupIdsForFeed = memberships.map((m) => m.group_id);
        }

        // Fetch pact IDs for these groups so we can filter check_ins properly.
        const { data: pactIdRows, error: pactIdsError } = await supabase
          .from('pacts')
          .select('id')
          .in('group_id', groupIdsForFeed);

        if (pactIdsError) {
          console.error('Fetch pact IDs error:', pactIdsError);
          setError('Failed to load feed');
          return;
        }

        const pactIds = (pactIdRows || []).map((p) => p.id);

        // If no pacts, we can still show member joins / recaps / pact creations.
        const checkInsPromise = pactIds.length
          ? supabase
              .from('check_ins')
              .select(
                `
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
              `
              )
              .in('pact_id', pactIds)
              .order('created_at', { ascending: false })
              .range(0, desiredCount - 1)
          : Promise.resolve({ data: [], error: null } as any);

        const pactCreatedPromise = supabase
          .from('pacts')
          .select(
            `
            id, group_id, name, frequency, roast_level, created_at,
            users:created_by (id, display_name, avatar_url)
          `
          )
          .in('group_id', groupIdsForFeed)
          .order('created_at', { ascending: false })
          .range(0, desiredCount - 1);

        const memberJoinedPromise = supabase
          .from('group_members')
          .select(
            `
            group_id, user_id, joined_at,
            users:user_id (id, display_name, avatar_url)
          `
          )
          .in('group_id', groupIdsForFeed)
          .order('joined_at', { ascending: false })
          .range(0, desiredCount - 1);

        const recapsPromise = supabase
          .from('weekly_recaps')
          .select('id, group_id, week_start, week_end, created_at')
          .in('group_id', groupIdsForFeed)
          .order('created_at', { ascending: false })
          .range(0, desiredCount - 1);

        const [
          { data: checkIns, error: checkInsError },
          { data: pactCreated, error: pactCreatedError },
          { data: memberJoined, error: memberJoinedError },
          { data: recaps, error: recapsError },
        ] = await Promise.all([checkInsPromise, pactCreatedPromise, memberJoinedPromise, recapsPromise]);

        if (checkInsError) {
          console.error('Fetch check-ins error:', checkInsError);
          setError('Failed to load feed');
          return;
        }

        if (pactCreatedError) {
          console.error('Fetch pacts error:', pactCreatedError);
          setError('Failed to load feed');
          return;
        }

        if (memberJoinedError) {
          console.error('Fetch group members error:', memberJoinedError);
          setError('Failed to load feed');
          return;
        }

        if (recapsError) {
          console.error('Fetch recaps error:', recapsError);
          setError('Failed to load feed');
          return;
        }

        // If proof_url is stored as a storage path, sign it for web image rendering.
        const checkInsWithSignedProof = await Promise.all(
          ((checkIns || []) as unknown as CheckInWithRelations[]).map(async (checkIn) => {
            const signedProof = await signProofUrlIfNeeded(checkIn.proof_url);
            if (!signedProof || signedProof === checkIn.proof_url) return checkIn;
            return { ...checkIn, proof_url: signedProof };
          })
        );

        const checkInItems: CheckInFeedItem[] = checkInsWithSignedProof
          .filter((checkIn) => checkIn.users && checkIn.pacts)
          .map((checkIn) => ({
            id: checkIn.id,
            type: 'check_in' as const,
            group_id: checkIn.pacts!.group_id,
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

        const pactCreatedItems: PactCreatedFeedItem[] = ((pactCreated || []) as unknown as PactCreatedWithRelations[])
          .filter((p) => !!p.users)
          .map((p) => ({
            id: `pact_created:${p.id}`,
            type: 'pact_created' as const,
            group_id: p.group_id,
            created_at: p.created_at,
            pact: {
              id: p.id,
              name: p.name,
              frequency: p.frequency,
              roast_level: p.roast_level,
            },
            user: {
              id: p.users!.id,
              display_name: p.users!.display_name,
              avatar_url: p.users!.avatar_url,
            },
          }));

        const memberJoinedItems: MemberJoinedFeedItem[] = ((memberJoined || []) as unknown as MemberJoinedWithRelations[])
          .filter((m) => !!m.users)
          .map((m) => ({
            id: `member_joined:${m.group_id}:${m.user_id}`,
            type: 'member_joined' as const,
            group_id: m.group_id,
            created_at: m.joined_at,
            user: {
              id: m.users!.id,
              display_name: m.users!.display_name,
              avatar_url: m.users!.avatar_url,
            },
          }));

        const recapItems: RecapFeedItem[] = ((recaps || []) as unknown as RecapWithRelations[]).map((r) => ({
          id: `recap:${r.id}`,
          type: 'recap' as const,
          group_id: r.group_id,
          created_at: r.created_at,
          recap_id: r.id,
          week_start: r.week_start,
          week_end: r.week_end,
        }));

        const mergedAll = [...checkInItems, ...pactCreatedItems, ...memberJoinedItems, ...recapItems]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const merged = mergedAll.slice(0, desiredCount);
        setFeedItems(merged);

        // Heuristic: if any table returned desiredCount, there's likely more.
        const checkInsCount = (checkInsWithSignedProof || []).length;
        const pactsCount = (pactCreated || []).length;
        const membersCount = (memberJoined || []).length;
        const recapsCount = (recaps || []).length;
        setHasMore(
          checkInsCount === desiredCount ||
            pactsCount === desiredCount ||
            membersCount === desiredCount ||
            recapsCount === desiredCount
        );

        offsetRef.current = desiredCount;
        setOffset(desiredCount);
      } catch (err) {
        console.error('Fetch feed exception:', err);
        setError('Failed to load feed');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [groupId]
  );

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    setOffset(0);
    offsetRef.current = 0;
    setFeedItems([]);
    setHasMore(true);
    setHasNewActivity(false);
    // Use a small delay to ensure state is reset
    setTimeout(() => {
      fetchFeed(false);
    }, 0);
  }, [groupId, fetchFeed]);

  // Realtime: refresh feed when new events are inserted
  useEffect(() => {
    const channel = supabase.channel(`feed:${groupId ?? 'all'}`);

    const scheduleRefresh = () => {
      bumpNewActivity();
      if (realtimeDebounceRef.current) {
        window.clearTimeout(realtimeDebounceRef.current);
      }
      realtimeDebounceRef.current = window.setTimeout(() => {
        fetchFeed(true);
      }, 500);
    };

    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'check_ins' }, scheduleRefresh);

    // These tables have group_id, so we can filter when a specific group is selected.
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'pacts',
        ...(groupId ? { filter: `group_id=eq.${groupId}` } : {}),
      },
      scheduleRefresh
    );

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_members',
        ...(groupId ? { filter: `group_id=eq.${groupId}` } : {}),
      },
      scheduleRefresh
    );

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'weekly_recaps',
        ...(groupId ? { filter: `group_id=eq.${groupId}` } : {}),
      },
      scheduleRefresh
    );

    channel.subscribe();

    return () => {
      if (realtimeDebounceRef.current) {
        window.clearTimeout(realtimeDebounceRef.current);
        realtimeDebounceRef.current = null;
      }
      if (newActivityTimeoutRef.current) {
        window.clearTimeout(newActivityTimeoutRef.current);
        newActivityTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [groupId, fetchFeed, bumpNewActivity]);

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
    hasNewActivity,
    refresh,
    loadMore,
    hasMore,
  };
}
