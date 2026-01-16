import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app';
import type { Reaction, ReactionEmoji } from '@/types';

interface UseReactionsReturn {
  reactions: Reaction[];
  reactionCounts: Record<ReactionEmoji, number>;
  userReaction: ReactionEmoji | null;
  isLoading: boolean;
  addReaction: (emoji: ReactionEmoji) => Promise<void>;
  removeReaction: () => Promise<void>;
}

export const REACTION_EMOJIS: ReactionEmoji[] = [
  'skull',
  'cap',
  'clown',
  'salute',
  'fire',
  'clap',
];

export const EMOJI_DISPLAY: Record<ReactionEmoji, string> = {
  skull: '\u{1F480}',
  cap: '\u{1F9E2}',
  clown: '\u{1F921}',
  salute: '\u{1FAE1}',
  fire: '\u{1F525}',
  clap: '\u{1F44F}',
};

export function useReactions(
  targetType: 'check_in' | 'roast_response',
  targetId: string
): UseReactionsReturn {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAppStore((state) => state.user);

  // Fetch reactions
  useEffect(() => {
    async function fetchReactions() {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (error) {
        console.error('Fetch reactions error:', error);
      } else {
        setReactions((data as Reaction[]) || []);
      }

      setIsLoading(false);
    }

    fetchReactions();
  }, [targetType, targetId]);

  // Real-time subscription for reactions
  useEffect(() => {
    const channel = supabase
      .channel(`reactions:${targetType}:${targetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `target_type=eq.${targetType}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReaction = payload.new as Reaction;
            if (newReaction.target_id === targetId) {
              setReactions((prev) => [...prev, newReaction]);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedReaction = payload.old as Reaction;
            if (deletedReaction.target_id === targetId) {
              setReactions((prev) =>
                prev.filter((r) => r.id !== deletedReaction.id)
              );
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedReaction = payload.new as Reaction;
            if (updatedReaction.target_id === targetId) {
              setReactions((prev) =>
                prev.map((r) =>
                  r.id === updatedReaction.id ? updatedReaction : r
                )
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetType, targetId]);

  // Calculate reaction counts
  const reactionCounts = reactions.reduce(
    (acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    },
    {} as Record<ReactionEmoji, number>
  );

  // Get user's current reaction
  const userReaction = user
    ? reactions.find((r) => r.user_id === user.id)?.emoji || null
    : null;

  // Add or update reaction
  const addReaction = useCallback(
    async (emoji: ReactionEmoji) => {
      if (!user) return;

      // If user has same reaction, remove it
      if (userReaction === emoji) {
        await removeReaction();
        return;
      }

      // If user has different reaction, update it
      const existingReaction = reactions.find((r) => r.user_id === user.id);
      if (existingReaction) {
        const { error } = await supabase
          .from('reactions')
          .update({ emoji })
          .eq('id', existingReaction.id);

        if (error) {
          console.error('Update reaction error:', error);
        }
      } else {
        // Create new reaction
        const { error } = await supabase.from('reactions').insert({
          target_type: targetType,
          target_id: targetId,
          user_id: user.id,
          emoji,
        });

        if (error) {
          console.error('Add reaction error:', error);
        }
      }
    },
    [user, userReaction, reactions, targetType, targetId]
  );

  // Remove reaction
  const removeReaction = useCallback(async () => {
    if (!user) return;

    const existingReaction = reactions.find((r) => r.user_id === user.id);
    if (existingReaction) {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) {
        console.error('Remove reaction error:', error);
      }
    }
  }, [user, reactions]);

  return {
    reactions,
    reactionCounts,
    userReaction,
    isLoading,
    addReaction,
    removeReaction,
  };
}
