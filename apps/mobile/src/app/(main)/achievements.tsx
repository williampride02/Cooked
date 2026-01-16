import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAchievements } from '@/hooks/useAchievements';
import { haptics } from '@/utils/haptics';
import type {
  AchievementCategory,
  AchievementProgress,
  AchievementTier,
} from '@/types';
import { TIER_COLORS, CATEGORY_NAMES } from '@/types';

// Category order for display
const CATEGORY_ORDER: AchievementCategory[] = [
  'streak',
  'checkin',
  'roast',
  'social',
  'comeback',
];

// Tier badge background styles
const TIER_BG_COLORS: Record<AchievementTier, string> = {
  bronze: 'bg-amber-900/20',
  silver: 'bg-gray-400/20',
  gold: 'bg-yellow-500/20',
  platinum: 'bg-purple-300/20',
};

interface AchievementCardProps {
  progress: AchievementProgress;
}

function AchievementCard({ progress }: AchievementCardProps) {
  const { achievement, isUnlocked, currentProgress, percentComplete } = progress;
  const tierColor = TIER_COLORS[achievement.tier];

  return (
    <View
      className={`flex-row items-center p-m mb-s rounded-sm border ${
        isUnlocked ? 'bg-surface border-primary/30' : 'bg-surface/50 border-border opacity-60'
      }`}
    >
      {/* Icon */}
      <View
        className={`w-14 h-14 rounded-full items-center justify-center mr-m ${
          isUnlocked ? TIER_BG_COLORS[achievement.tier] : 'bg-surface'
        }`}
        style={isUnlocked ? { borderWidth: 2, borderColor: tierColor } : {}}
      >
        <Text className="text-h1">{achievement.icon}</Text>
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center mb-xs">
          <Text
            className={`text-body font-semibold ${
              isUnlocked ? 'text-text-primary' : 'text-text-muted'
            }`}
          >
            {achievement.name}
          </Text>
          {isUnlocked && (
            <View
              className="ml-s px-xs py-0.5 rounded-xs"
              style={{ backgroundColor: tierColor + '40' }}
            >
              <Text
                className="text-body-sm font-semibold capitalize"
                style={{ color: tierColor }}
              >
                {achievement.tier}
              </Text>
            </View>
          )}
        </View>

        <Text className="text-body-sm text-text-secondary mb-xs">
          {achievement.description}
        </Text>

        {/* Progress bar */}
        {!isUnlocked && (
          <View className="flex-row items-center">
            <View className="flex-1 h-1.5 bg-border rounded-full overflow-hidden mr-s">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${percentComplete}%` }}
              />
            </View>
            <Text className="text-body-sm text-text-muted">
              {currentProgress}/{achievement.requirement_value}
            </Text>
          </View>
        )}

        {/* XP reward */}
        {isUnlocked && (
          <Text className="text-body-sm text-success">
            +{achievement.xp_reward} XP earned
          </Text>
        )}
      </View>
    </View>
  );
}

interface CategorySectionProps {
  category: AchievementCategory;
  achievements: AchievementProgress[];
  isExpanded: boolean;
  onToggle: () => void;
}

function CategorySection({
  category,
  achievements,
  isExpanded,
  onToggle,
}: CategorySectionProps) {
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;

  return (
    <View className="mb-m">
      <Pressable
        onPress={() => {
          haptics.light();
          onToggle();
        }}
        className="flex-row items-center justify-between py-s px-m bg-surface rounded-sm mb-s"
        accessibilityRole="button"
        accessibilityLabel={`${CATEGORY_NAMES[category]} section, ${unlockedCount} of ${totalCount} unlocked`}
      >
        <Text className="text-body font-semibold text-text-primary">
          {CATEGORY_NAMES[category]}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-body-sm text-text-secondary mr-s">
            {unlockedCount}/{totalCount}
          </Text>
          <Text className="text-text-muted">{isExpanded ? '\u25B2' : '\u25BC'}</Text>
        </View>
      </Pressable>

      {isExpanded && (
        <View>
          {achievements.map((progress) => (
            <AchievementCard key={progress.achievement.id} progress={progress} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function AchievementsScreen() {
  const {
    isLoading,
    error,
    achievements,
    stats,
    unlockedCount,
    totalCount,
    totalXp,
    fetchAchievements,
    getAchievementsByCategory,
  } = useAchievements();

  const [expandedCategories, setExpandedCategories] = useState<Set<AchievementCategory>>(
    new Set(['streak', 'checkin'])
  );
  const [refreshing, setRefreshing] = useState(false);

  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  const handleRefresh = useCallback(async () => {
    haptics.pullToRefresh();
    setRefreshing(true);
    await fetchAchievements();
    setRefreshing(false);
  }, [fetchAchievements]);

  const toggleCategory = useCallback((category: AchievementCategory) => {
    haptics.selection();
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  if (isLoading && achievements.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  if (error && achievements.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-m py-s">
          <Pressable
            onPress={handleBack}
            className="w-11 h-11 items-center justify-center -ml-s"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text className="text-text-primary text-h2">{'\u2190'}</Text>
          </Pressable>
          <Text className="text-h2 text-text-primary font-semibold ml-s">Achievements</Text>
        </View>
        <View className="flex-1 items-center justify-center px-m">
          <Text className="text-danger text-body text-center">{error}</Text>
          <Pressable
            onPress={fetchAchievements}
            className="mt-m py-3 px-l bg-primary rounded-sm"
          >
            <Text className="text-white text-body font-semibold">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-m py-s">
        <Pressable
          onPress={handleBack}
          className="w-11 h-11 items-center justify-center -ml-s"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text className="text-text-primary text-h2">{'\u2190'}</Text>
        </Pressable>
        <Text className="text-h2 text-text-primary font-semibold ml-s flex-1">
          Achievements
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-m pb-xl"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Summary */}
        <View className="bg-surface rounded-sm p-m mb-l border border-border">
          <View className="flex-row justify-between mb-m">
            <View className="items-center flex-1">
              <Text className="text-h1 text-primary font-bold">{unlockedCount}</Text>
              <Text className="text-body-sm text-text-secondary">Unlocked</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1">
              <Text className="text-h1 text-text-primary font-bold">{totalCount}</Text>
              <Text className="text-body-sm text-text-secondary">Total</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1">
              <Text className="text-h1 text-success font-bold">{totalXp.toLocaleString()}</Text>
              <Text className="text-body-sm text-text-secondary">XP Earned</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View className="mb-xs">
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </View>
          </View>
          <Text className="text-body-sm text-text-muted text-center">
            {Math.round((unlockedCount / totalCount) * 100)}% Complete
          </Text>
        </View>

        {/* Current Streak Highlight */}
        {stats && stats.current_streak > 0 && (
          <View className="bg-primary/10 border border-primary/30 rounded-sm p-m mb-l flex-row items-center">
            <Text className="text-h1 mr-m">{'\u{1F525}'}</Text>
            <View className="flex-1">
              <Text className="text-body font-semibold text-text-primary">
                {stats.current_streak} Day Streak!
              </Text>
              <Text className="text-body-sm text-text-secondary">
                Longest: {stats.longest_streak} days
              </Text>
            </View>
          </View>
        )}

        {/* Achievement Categories */}
        {CATEGORY_ORDER.map((category) => {
          const categoryAchievements = getAchievementsByCategory(category);
          if (categoryAchievements.length === 0) return null;

          return (
            <CategorySection
              key={category}
              category={category}
              achievements={categoryAchievements}
              isExpanded={expandedCategories.has(category)}
              onToggle={() => toggleCategory(category)}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
