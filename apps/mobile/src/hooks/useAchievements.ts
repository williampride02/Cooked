import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app';
import type {
  AchievementDefinition,
  UserAchievement,
  UserStats,
  AchievementProgress,
  AchievementCategory,
} from '@/types';

interface NewlyUnlockedAchievement extends AchievementDefinition {
  unlockedAt: string;
}

interface UseAchievementsReturn {
  isLoading: boolean;
  error: string | null;
  achievements: AchievementProgress[];
  stats: UserStats | null;
  unlockedCount: number;
  totalCount: number;
  totalXp: number;
  newlyUnlocked: NewlyUnlockedAchievement[];
  fetchAchievements: () => Promise<void>;
  checkAndUnlockAchievements: () => Promise<NewlyUnlockedAchievement[]>;
  markAchievementNotified: (achievementId: string) => Promise<void>;
  getAchievementsByCategory: (category: AchievementCategory) => AchievementProgress[];
}

// Map requirement types to stats fields
const REQUIREMENT_TO_STAT: Record<string, keyof UserStats> = {
  streak_days: 'current_streak',
  total_checkins: 'total_checkins',
  total_roasts: 'total_roasts',
  roast_reactions: 'total_roast_reactions_received',
  invites_sent: 'invites_sent',
  group_created: 'groups_created',
  group_filled: 'groups_filled',
  comeback_streak: 'comeback_count',
};

export function useAchievements(): UseAchievementsReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<NewlyUnlockedAchievement[]>([]);

  const user = useAppStore((state) => state.user);

  // Fetch all achievements and user progress
  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch achievement definitions
      const { data: definitions, error: defError } = await supabase
        .from('achievement_definitions')
        .select('*')
        .order('sort_order', { ascending: true });

      if (defError) {
        console.error('Fetch achievement definitions error:', defError);
        setError('Failed to load achievements');
        return;
      }

      // Fetch user's unlocked achievements
      const { data: userAchievements, error: uaError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (uaError) {
        console.error('Fetch user achievements error:', uaError);
        setError('Failed to load your achievements');
        return;
      }

      // Fetch user stats
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Stats might not exist yet, that's okay
      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Fetch user stats error:', statsError);
      }

      // Create default stats if none exist
      const currentStats: UserStats = userStats || {
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        total_checkins: 0,
        total_folds: 0,
        total_roasts: 0,
        total_roast_reactions_received: 0,
        invites_sent: 0,
        groups_created: 0,
        groups_filled: 0,
        comeback_count: 0,
        last_checkin_date: null,
        last_fold_date: null,
        updated_at: new Date().toISOString(),
      };

      setStats(currentStats);

      // Create achievement progress map
      const unlockedMap = new Map(
        (userAchievements || []).map((ua: UserAchievement) => [ua.achievement_id, ua])
      );

      // Build achievement progress list
      const progress: AchievementProgress[] = (definitions as AchievementDefinition[]).map(
        (def) => {
          const unlocked = unlockedMap.get(def.id) as UserAchievement | undefined;
          const statField = REQUIREMENT_TO_STAT[def.requirement_type];
          const currentProgress =
            statField && currentStats[statField] !== null
              ? (currentStats[statField] as number)
              : 0;
          const percentComplete = Math.min(
            100,
            Math.round((currentProgress / def.requirement_value) * 100)
          );

          return {
            achievement: def,
            isUnlocked: !!unlocked,
            currentProgress,
            percentComplete: unlocked ? 100 : percentComplete,
            unlockedAt: unlocked?.unlocked_at || null,
          };
        }
      );

      setAchievements(progress);
    } catch (err) {
      console.error('Fetch achievements exception:', err);
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Check for newly unlocked achievements and unlock them
  const checkAndUnlockAchievements = useCallback(async (): Promise<NewlyUnlockedAchievement[]> => {
    if (!user || !stats) {
      return [];
    }

    const newUnlocks: NewlyUnlockedAchievement[] = [];

    try {
      // Find achievements that should be unlocked but aren't
      for (const progress of achievements) {
        if (progress.isUnlocked) continue;

        const { achievement } = progress;
        const statField = REQUIREMENT_TO_STAT[achievement.requirement_type];
        if (!statField) continue;

        const currentValue = stats[statField] as number;
        if (currentValue >= achievement.requirement_value) {
          // Unlock this achievement
          const { error: insertError } = await supabase.from('user_achievements').insert({
            user_id: user.id,
            achievement_id: achievement.id,
            progress: currentValue,
            notified: false,
          });

          if (insertError) {
            // Might already exist (race condition)
            if (insertError.code !== '23505') {
              console.error('Unlock achievement error:', insertError);
            }
          } else {
            newUnlocks.push({
              ...achievement,
              unlockedAt: new Date().toISOString(),
            });
          }
        }
      }

      // Update local state if we unlocked anything
      if (newUnlocks.length > 0) {
        setNewlyUnlocked((prev) => [...prev, ...newUnlocks]);
        await fetchAchievements(); // Refresh to get updated state
      }

      return newUnlocks;
    } catch (err) {
      console.error('Check achievements exception:', err);
      return [];
    }
  }, [user, stats, achievements, fetchAchievements]);

  // Mark an achievement as notified (clear toast)
  const markAchievementNotified = useCallback(
    async (achievementId: string) => {
      if (!user) return;

      try {
        await supabase
          .from('user_achievements')
          .update({ notified: true })
          .eq('user_id', user.id)
          .eq('achievement_id', achievementId);

        // Remove from newly unlocked list
        setNewlyUnlocked((prev) =>
          prev.filter((a) => a.id !== achievementId)
        );
      } catch (err) {
        console.error('Mark notified error:', err);
      }
    },
    [user]
  );

  // Get achievements by category
  const getAchievementsByCategory = useCallback(
    (category: AchievementCategory): AchievementProgress[] => {
      return achievements.filter((a) => a.achievement.category === category);
    },
    [achievements]
  );

  // Calculate totals
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const totalXp = achievements
    .filter((a) => a.isUnlocked)
    .reduce((sum, a) => sum + a.achievement.xp_reward, 0);

  // Initial fetch
  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Check for unnotified achievements on load
  useEffect(() => {
    async function checkUnnotified() {
      if (!user) return;

      const { data } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement_definitions (*)
        `)
        .eq('user_id', user.id)
        .eq('notified', false);

      if (data && data.length > 0) {
        const unnotified = data.map((ua) => ({
          ...(ua.achievement_definitions as AchievementDefinition),
          unlockedAt: ua.unlocked_at,
        }));
        setNewlyUnlocked(unnotified);
      }
    }

    checkUnnotified();
  }, [user]);

  return {
    isLoading,
    error,
    achievements,
    stats,
    unlockedCount,
    totalCount,
    totalXp,
    newlyUnlocked,
    fetchAchievements,
    checkAndUnlockAchievements,
    markAchievementNotified,
    getAchievementsByCategory,
  };
}
