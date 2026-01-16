import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useAppStore } from '@/stores/app';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type {
  CheckIn,
  RoastResponse,
  Reaction,
  GroupMember,
  User,
  FeedItem,
  CheckInFeedItem,
  MemberJoinedFeedItem,
} from '@/types';

// Query keys for React Query cache invalidation
export const QUERY_KEYS = {
  feed: (groupId: string) => ['feed', groupId],
  checkIns: (pactId: string) => ['checkIns', pactId],
  roastThread: (threadId: string) => ['roastThread', threadId],
  roastResponses: (threadId: string) => ['roastResponses', threadId],
  reactions: (targetType: string, targetId: string) => ['reactions', targetType, targetId],
  groupMembers: (groupId: string) => ['groupMembers', groupId],
  pacts: (groupId: string) => ['pacts', groupId],
} as const;

// Types for realtime events
export type RealtimeEventType =
  | 'check_in'
  | 'roast_response'
  | 'reaction'
  | 'member_joined';

export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: unknown;
}

export interface RealtimeCallbacks {
  onCheckIn?: (checkIn: CheckIn & { user?: Partial<User>; pact?: { id: string; name: string; group_id: string } }) => void;
  onRoastResponse?: (response: RoastResponse & { user?: Partial<User> }) => void;
  onReaction?: (reaction: Reaction, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onMemberJoined?: (member: GroupMember & { user?: Partial<User> }) => void;
}

interface UseRealtimeSubscriptionOptions {
  groupId: string | null;
  threadId?: string | null;
  enabled?: boolean;
  callbacks?: RealtimeCallbacks;
}

interface UseRealtimeSubscriptionReturn {
  isSubscribed: boolean;
  unsubscribe: () => void;
}

/**
 * Hook for subscribing to Supabase Realtime events for a group
 *
 * Subscribes to:
 * - Check-ins (new check-ins in the group)
 * - Roast responses (new responses in threads)
 * - Reactions (reactions on check-ins and roast responses)
 * - Group members (new members joining)
 *
 * Updates React Query cache automatically when events occur
 */
export function useRealtimeSubscription({
  groupId,
  threadId,
  enabled = true,
  callbacks,
}: UseRealtimeSubscriptionOptions): UseRealtimeSubscriptionReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const threadChannelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const user = useAppStore((state) => state.user);

  // Fetch user data for a check-in
  const fetchCheckInWithDetails = useCallback(async (checkInId: string): Promise<CheckInFeedItem | null> => {
    try {
      const { data, error } = await supabase
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
        .eq('id', checkInId)
        .single();

      if (error || !data) return null;

      const typedData = data as unknown as {
        id: string;
        pact_id: string;
        user_id: string;
        status: string;
        excuse: string | null;
        proof_url: string | null;
        check_in_date: string;
        created_at: string;
        users: { id: string; display_name: string; avatar_url: string | null };
        pacts: { id: string; name: string; group_id: string };
      };

      // Only return if it's for the current group
      if (typedData.pacts.group_id !== groupId) return null;

      return {
        id: typedData.id,
        type: 'check_in' as const,
        group_id: typedData.pacts.group_id,
        created_at: typedData.created_at,
        check_in: {
          id: typedData.id,
          pact_id: typedData.pact_id,
          user_id: typedData.user_id,
          status: typedData.status as 'success' | 'fold',
          excuse: typedData.excuse,
          proof_url: typedData.proof_url,
          check_in_date: typedData.check_in_date,
          created_at: typedData.created_at,
        },
        user: {
          id: typedData.users.id,
          display_name: typedData.users.display_name,
          avatar_url: typedData.users.avatar_url,
        },
        pact: {
          id: typedData.pacts.id,
          name: typedData.pacts.name,
        },
      };
    } catch (err) {
      console.error('[Realtime] Error fetching check-in details:', err);
      return null;
    }
  }, [groupId]);

  // Fetch member data
  const fetchMemberWithDetails = useCallback(async (
    memberGroupId: string,
    memberId: string
  ): Promise<MemberJoinedFeedItem | null> => {
    if (memberGroupId !== groupId) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, avatar_url')
        .eq('id', memberId)
        .single();

      if (error || !data) return null;

      return {
        id: `member_${memberId}_${Date.now()}`,
        type: 'member_joined' as const,
        group_id: memberGroupId,
        created_at: new Date().toISOString(),
        user: {
          id: data.id,
          display_name: data.display_name,
          avatar_url: data.avatar_url,
        },
      };
    } catch (err) {
      console.error('[Realtime] Error fetching member details:', err);
      return null;
    }
  }, [groupId]);

  // Fetch roast response with user details
  const fetchResponseWithDetails = useCallback(async (responseId: string) => {
    try {
      const { data, error } = await supabase
        .from('roast_responses')
        .select(`
          *,
          users:user_id (id, display_name, avatar_url)
        `)
        .eq('id', responseId)
        .single();

      if (error || !data) return null;

      return {
        ...data,
        user: data.users as unknown as Pick<User, 'id' | 'display_name' | 'avatar_url'>,
      };
    } catch (err) {
      console.error('[Realtime] Error fetching response details:', err);
      return null;
    }
  }, []);

  // Handle check-in events
  const handleCheckInEvent = useCallback(async (
    payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>
  ) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      const checkInId = payload.new.id as string;
      const feedItem = await fetchCheckInWithDetails(checkInId);

      if (feedItem) {
        // Update feed cache by prepending the new item
        queryClient.setQueryData<FeedItem[]>(
          QUERY_KEYS.feed(groupId!),
          (oldData) => {
            if (!oldData) return [feedItem];
            // Avoid duplicates
            if (oldData.some((item) => item.id === feedItem.id)) return oldData;
            return [feedItem, ...oldData];
          }
        );

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.checkIns(feedItem.pact.id) });

        // Call custom callback if provided
        if (callbacks?.onCheckIn) {
          callbacks.onCheckIn({
            ...feedItem.check_in,
            user: feedItem.user,
            pact: { ...feedItem.pact, group_id: groupId! },
          });
        }
      }
    }
  }, [groupId, fetchCheckInWithDetails, callbacks]);

  // Handle roast response events
  const handleRoastResponseEvent = useCallback(async (
    payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>
  ) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      const responseId = payload.new.id as string;
      const responseThreadId = payload.new.thread_id as string;

      // Invalidate thread query to trigger refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roastThread(responseThreadId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roastResponses(responseThreadId) });

      // Call custom callback if provided
      if (callbacks?.onRoastResponse) {
        const responseWithDetails = await fetchResponseWithDetails(responseId);
        if (responseWithDetails) {
          callbacks.onRoastResponse(responseWithDetails);
        }
      }
    }
  }, [callbacks, fetchResponseWithDetails]);

  // Handle reaction events
  const handleReactionEvent = useCallback((
    payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>
  ) => {
    const reaction = (payload.eventType === 'DELETE' ? payload.old : payload.new) as unknown as Reaction;

    if (reaction) {
      // Invalidate reactions query
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reactions(reaction.target_type, reaction.target_id),
      });

      // Call custom callback if provided
      if (callbacks?.onReaction) {
        callbacks.onReaction(reaction, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
      }
    }
  }, [callbacks]);

  // Handle group member events
  const handleMemberEvent = useCallback(async (
    payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>
  ) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      const memberGroupId = payload.new.group_id as string;
      const memberId = payload.new.user_id as string;

      // Only process if it's for the current group
      if (memberGroupId !== groupId) return;

      // Invalidate group members query
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupMembers(memberGroupId) });

      const feedItem = await fetchMemberWithDetails(memberGroupId, memberId);

      if (feedItem) {
        // Update feed cache by prepending the new member joined item
        queryClient.setQueryData<FeedItem[]>(
          QUERY_KEYS.feed(groupId!),
          (oldData) => {
            if (!oldData) return [feedItem];
            return [feedItem, ...oldData];
          }
        );

        // Call custom callback if provided
        if (callbacks?.onMemberJoined) {
          callbacks.onMemberJoined({
            group_id: memberGroupId,
            user_id: memberId,
            role: payload.new.role as 'admin' | 'member',
            settings: {},
            joined_at: new Date().toISOString(),
            user: feedItem.user,
          });
        }
      }
    }
  }, [groupId, fetchMemberWithDetails, callbacks]);

  // Set up group-level subscriptions
  useEffect(() => {
    if (!enabled || !groupId || !user) {
      return;
    }

    // Create channel for group-level events
    const channelName = `group_realtime:${groupId}`;
    const channel = supabase.channel(channelName);

    // Subscribe to check-ins
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins',
      },
      handleCheckInEvent
    );

    // Subscribe to group members
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_members',
        filter: `group_id=eq.${groupId}`,
      },
      handleMemberEvent
    );

    // Subscribe to reactions (for check-ins in this group)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reactions',
      },
      handleReactionEvent
    );

    // Subscribe to roast responses (general - filtered in handler)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'roast_responses',
      },
      handleRoastResponseEvent
    );

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
        console.log(`[Realtime] Subscribed to group ${groupId}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Error subscribing to group ${groupId}`);
        isSubscribedRef.current = false;
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount or when dependencies change
    return () => {
      if (channelRef.current) {
        console.log(`[Realtime] Unsubscribing from group ${groupId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [
    enabled,
    groupId,
    user,
    handleCheckInEvent,
    handleMemberEvent,
    handleReactionEvent,
    handleRoastResponseEvent,
  ]);

  // Set up thread-specific subscriptions
  useEffect(() => {
    if (!enabled || !threadId || !user) {
      return;
    }

    // Create channel for thread-specific events
    const threadChannelName = `roast_thread_realtime:${threadId}`;
    const threadChannel = supabase.channel(threadChannelName);

    // Subscribe to roast responses for this specific thread
    threadChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'roast_responses',
        filter: `thread_id=eq.${threadId}`,
      },
      handleRoastResponseEvent
    );

    // Subscribe to reactions for responses in this thread
    threadChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `target_type=eq.roast_response`,
      },
      handleReactionEvent
    );

    // Subscribe to the channel
    threadChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Subscribed to thread ${threadId}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Error subscribing to thread ${threadId}`);
      }
    });

    threadChannelRef.current = threadChannel;

    // Cleanup on unmount or when dependencies change
    return () => {
      if (threadChannelRef.current) {
        console.log(`[Realtime] Unsubscribing from thread ${threadId}`);
        supabase.removeChannel(threadChannelRef.current);
        threadChannelRef.current = null;
      }
    };
  }, [enabled, threadId, user, handleRoastResponseEvent, handleReactionEvent]);

  // Manual unsubscribe function
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (threadChannelRef.current) {
      supabase.removeChannel(threadChannelRef.current);
      threadChannelRef.current = null;
    }
    isSubscribedRef.current = false;
  }, []);

  return {
    isSubscribed: isSubscribedRef.current,
    unsubscribe,
  };
}

/**
 * Simplified hook for subscribing to a specific roast thread
 * Use this in the roast thread screen for targeted updates
 */
export function useRoastThreadRealtime(
  threadId: string | null,
  onNewResponse?: (response: RoastResponse & { user?: Pick<User, 'id' | 'display_name' | 'avatar_url'> }) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    if (!threadId || !user) return;

    const channelName = `thread_${threadId}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'roast_responses',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          if (payload.new) {
            // Invalidate the thread query
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roastThread(threadId) });

            // Fetch details and call callback
            if (onNewResponse) {
              const { data } = await supabase
                .from('roast_responses')
                .select(`
                  *,
                  users:user_id (id, display_name, avatar_url)
                `)
                .eq('id', payload.new.id)
                .single();

              if (data) {
                onNewResponse({
                  ...data,
                  user: data.users as unknown as Pick<User, 'id' | 'display_name' | 'avatar_url'>,
                } as RoastResponse & { user: Pick<User, 'id' | 'display_name' | 'avatar_url'> });
              }
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [threadId, user, onNewResponse]);
}

/**
 * Hook for subscribing to group feed updates only
 * Simpler alternative when you only need feed updates
 */
export function useFeedRealtime(
  groupId: string | null,
  onNewFeedItem?: (item: FeedItem) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    if (!groupId || !user) return;

    const channelName = `feed_${groupId}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'check_ins',
        },
        async (payload) => {
          if (payload.new) {
            // Fetch the check-in with details
            const { data } = await supabase
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

            if (data) {
              const typedData = data as unknown as {
                id: string;
                pact_id: string;
                user_id: string;
                status: string;
                excuse: string | null;
                proof_url: string | null;
                check_in_date: string;
                created_at: string;
                users: { id: string; display_name: string; avatar_url: string | null };
                pacts: { id: string; name: string; group_id: string };
              };

              // Only process if it's for the current group
              if (typedData.pacts.group_id === groupId) {
                const feedItem: CheckInFeedItem = {
                  id: typedData.id,
                  type: 'check_in',
                  group_id: typedData.pacts.group_id,
                  created_at: typedData.created_at,
                  check_in: {
                    id: typedData.id,
                    pact_id: typedData.pact_id,
                    user_id: typedData.user_id,
                    status: typedData.status as 'success' | 'fold',
                    excuse: typedData.excuse,
                    proof_url: typedData.proof_url,
                    check_in_date: typedData.check_in_date,
                    created_at: typedData.created_at,
                  },
                  user: {
                    id: typedData.users.id,
                    display_name: typedData.users.display_name,
                    avatar_url: typedData.users.avatar_url,
                  },
                  pact: {
                    id: typedData.pacts.id,
                    name: typedData.pacts.name,
                  },
                };

                // Invalidate feed query
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.feed(groupId) });

                if (onNewFeedItem) {
                  onNewFeedItem(feedItem);
                }
              }
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId, user, onNewFeedItem]);
}
