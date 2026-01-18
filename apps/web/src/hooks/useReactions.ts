'use client';

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ReactionEmoji } from '@cooked/shared';

export type ReactionTargetType = 'check_in' | 'roast_response';

export const REACTION_EMOJI_OPTIONS: Array<{ key: ReactionEmoji; label: string }> = [
  { key: 'skull', label: '💀' },
  { key: 'cap', label: '🧢' },
  { key: 'clown', label: '🤡' },
  { key: 'salute', label: '🫡' },
  { key: 'fire', label: '🔥' },
  { key: 'clap', label: '👏' },
];

export function emojiKeyToLabel(key: ReactionEmoji): string {
  return REACTION_EMOJI_OPTIONS.find((o) => o.key === key)?.label ?? key;
}

export interface ReactionSummary {
  counts: Record<ReactionEmoji, number>;
  myReaction: ReactionEmoji | null;
}

interface UseReactionsReturn {
  isLoading: boolean;
  error: string | null;
  fetchReactionSummaries: (args: {
    targetType: ReactionTargetType;
    targetIds: string[];
  }) => Promise<Record<string, ReactionSummary>>;
  toggleReaction: (args: {
    targetType: ReactionTargetType;
    targetId: string;
    emoji: ReactionEmoji;
  }) => Promise<void>;
}

function emptyCounts(): Record<ReactionEmoji, number> {
  return {
    skull: 0,
    cap: 0,
    clown: 0,
    salute: 0,
    fire: 0,
    clap: 0,
  };
}

export function useReactions(): UseReactionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReactionSummaries = useCallback(async (args: { targetType: ReactionTargetType; targetIds: string[] }) => {
    const { targetType, targetIds } = args;
    if (targetIds.length === 0) return {};

    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: reactions, error: reactionsError } = await supabase
        .from('reactions')
        .select('target_id,user_id,emoji')
        .eq('target_type', targetType)
        .in('target_id', targetIds);

      if (reactionsError) {
        console.error('Fetch reactions error:', reactionsError);
        setError(reactionsError.message || 'Failed to load reactions');
        return {};
      }

      const byTarget: Record<string, ReactionSummary> = {};
      for (const id of targetIds) {
        byTarget[id] = { counts: emptyCounts(), myReaction: null };
      }

      for (const r of (reactions || []) as any[]) {
        const targetId = r.target_id as string;
        const emoji = r.emoji as ReactionEmoji;
        const userId = r.user_id as string;
        if (!byTarget[targetId]) continue;
        if (byTarget[targetId].counts[emoji] === undefined) continue;
        byTarget[targetId].counts[emoji] += 1;
        if (user && userId === user.id) {
          byTarget[targetId].myReaction = emoji;
        }
      }

      return byTarget;
    } catch (e: any) {
      console.error('Fetch reactions exception:', e);
      setError(e?.message || 'Failed to load reactions');
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleReaction = useCallback(async (args: { targetType: ReactionTargetType; targetId: string; emoji: ReactionEmoji }) => {
    const { targetType, targetId, emoji } = args;
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to react');
        return;
      }

      // Since reactions has UNIQUE (target_type, target_id, user_id) and no UPDATE policy,
      // we implement "change reaction" as delete-then-insert.
      const { data: existing } = await supabase
        .from('reactions')
        .select('id,emoji')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing?.id) {
        // Toggle off if same emoji
        if (existing.emoji === emoji) {
          const { error: delError } = await supabase.from('reactions').delete().eq('id', existing.id);
          if (delError) throw delError;
          return;
        }

        const { error: delError } = await supabase.from('reactions').delete().eq('id', existing.id);
        if (delError) throw delError;
      }

      const { error: insError } = await supabase.from('reactions').insert({
        target_type: targetType,
        target_id: targetId,
        user_id: user.id,
        emoji,
      });
      if (insError) throw insError;
    } catch (e: any) {
      console.error('Toggle reaction exception:', e);
      setError(e?.message || 'Failed to react');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, fetchReactionSummaries, toggleReaction };
}

