import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { router } from 'expo-router';
import { AchievementToast } from '@/components/achievements';
import { useAchievements } from '@/hooks/useAchievements';
import type { AchievementDefinition, AchievementProgress, UserStats } from '@/types';

interface AchievementsContextValue {
  // Achievement state
  achievements: AchievementProgress[];
  stats: UserStats | null;
  unlockedCount: number;
  totalCount: number;
  totalXp: number;
  isLoading: boolean;

  // Actions
  refreshAchievements: () => Promise<void>;
  checkForNewAchievements: () => Promise<void>;
  showAchievementToast: (achievement: AchievementDefinition) => void;
}

const AchievementsContext = createContext<AchievementsContextValue | null>(null);

interface AchievementsProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages achievements state and toasts
 *
 * Wrap your app with this provider to enable achievement tracking and notifications:
 *
 * ```tsx
 * <AchievementsProvider>
 *   <App />
 * </AchievementsProvider>
 * ```
 */
export function AchievementsProvider({ children }: AchievementsProviderProps) {
  const {
    isLoading,
    achievements,
    stats,
    unlockedCount,
    totalCount,
    totalXp,
    newlyUnlocked,
    fetchAchievements,
    checkAndUnlockAchievements,
    markAchievementNotified,
  } = useAchievements();

  // Toast queue state
  const [toastQueue, setToastQueue] = useState<AchievementDefinition[]>([]);
  const [currentToast, setCurrentToast] = useState<AchievementDefinition | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Process toast queue
  useEffect(() => {
    if (!currentToast && toastQueue.length > 0) {
      const [next, ...rest] = toastQueue;
      setCurrentToast(next);
      setToastQueue(rest);
      setToastVisible(true);
    }
  }, [currentToast, toastQueue]);

  // Show newly unlocked achievements
  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      // Add to queue (avoiding duplicates)
      setToastQueue((prev) => {
        const existingIds = new Set([
          ...prev.map((a) => a.id),
          currentToast?.id,
        ].filter(Boolean));

        const newOnes = newlyUnlocked.filter((a) => !existingIds.has(a.id));
        return [...prev, ...newOnes];
      });
    }
  }, [newlyUnlocked, currentToast]);

  // Handle toast dismiss
  const handleToastDismiss = useCallback(async () => {
    if (currentToast) {
      await markAchievementNotified(currentToast.id);
    }
    setToastVisible(false);
    // Small delay before showing next toast
    setTimeout(() => {
      setCurrentToast(null);
    }, 300);
  }, [currentToast, markAchievementNotified]);

  // Handle toast press (navigate to achievements)
  const handleToastPress = useCallback(() => {
    router.push('/(main)/achievements');
  }, []);

  // Manual toast trigger
  const showAchievementToast = useCallback((achievement: AchievementDefinition) => {
    setToastQueue((prev) => {
      if (prev.some((a) => a.id === achievement.id) || currentToast?.id === achievement.id) {
        return prev;
      }
      return [...prev, achievement];
    });
  }, [currentToast]);

  // Refresh achievements
  const refreshAchievements = useCallback(async () => {
    await fetchAchievements();
  }, [fetchAchievements]);

  // Check for new achievements (call after actions that might unlock achievements)
  const checkForNewAchievements = useCallback(async () => {
    const newUnlocks = await checkAndUnlockAchievements();
    // Toast queue will be updated via the effect watching newlyUnlocked
    return;
  }, [checkAndUnlockAchievements]);

  const contextValue: AchievementsContextValue = {
    achievements,
    stats,
    unlockedCount,
    totalCount,
    totalXp,
    isLoading,
    refreshAchievements,
    checkForNewAchievements,
    showAchievementToast,
  };

  return (
    <AchievementsContext.Provider value={contextValue}>
      {children}
      {currentToast && (
        <AchievementToast
          achievement={currentToast}
          visible={toastVisible}
          onDismiss={handleToastDismiss}
          onPress={handleToastPress}
        />
      )}
    </AchievementsContext.Provider>
  );
}

/**
 * Hook to access achievements context
 * Must be used within an AchievementsProvider
 */
export function useAchievementsContext(): AchievementsContextValue {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievementsContext must be used within an AchievementsProvider');
  }
  return context;
}
