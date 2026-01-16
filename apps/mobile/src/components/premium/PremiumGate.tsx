import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { haptics } from '@/utils/haptics';
import type { PremiumFeature } from '@/types';

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const FEATURE_LABELS: Record<PremiumFeature, { title: string; description: string }> = {
  unlimited_groups: {
    title: 'Unlimited Groups',
    description: 'Join more accountability groups',
  },
  unlimited_pacts: {
    title: 'Unlimited Pacts',
    description: 'Create as many pacts as you want',
  },
  full_recap_history: {
    title: 'Full Recap History',
    description: 'Access all past weekly recaps',
  },
  advanced_polls: {
    title: 'Advanced Polls',
    description: 'Create custom polls in roast threads',
  },
  custom_roast_prompts: {
    title: 'Custom Roast Prompts',
    description: 'Personalize your roast experience',
  },
  group_analytics: {
    title: 'Group Analytics',
    description: 'Track trends and insights',
  },
  priority_support: {
    title: 'Priority Support',
    description: 'Get help when you need it',
  },
};

export function PremiumGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: PremiumGateProps) {
  const { canAccessFeature, isLoading } = useSubscription();
  const params = useLocalSearchParams<{ id: string }>();
  const groupId = params.id;

  // Show children while loading to avoid flash
  if (isLoading) {
    return <>{children}</>;
  }

  // User has access to feature
  if (canAccessFeature(feature)) {
    return <>{children}</>;
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt
  if (!showUpgradePrompt) {
    return null;
  }

  const featureInfo = FEATURE_LABELS[feature];

  const handleUpgrade = () => {
    haptics.light();
    if (groupId) {
      router.push(`/group/${groupId}/upgrade`);
    }
  };

  return (
    <View className="bg-surface border border-primary/30 rounded-md p-m">
      <View className="flex-row items-center mb-s">
        <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mr-s">
          <Text className="text-body">{'\u{1F451}'}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-body text-text-primary font-semibold">
            {featureInfo.title}
          </Text>
          <Text className="text-body-sm text-text-muted">{featureInfo.description}</Text>
        </View>
      </View>
      <Pressable
        onPress={handleUpgrade}
        className="py-s bg-primary rounded-sm items-center"
        accessibilityLabel="Upgrade to premium"
        accessibilityRole="button"
      >
        <Text className="text-white text-body-sm font-semibold">
          Upgrade to Premium
        </Text>
      </Pressable>
    </View>
  );
}

// Simple locked badge for inline use
interface PremiumBadgeProps {
  size?: 'sm' | 'md';
  onPress?: () => void;
}

export function PremiumBadge({ size = 'sm', onPress }: PremiumBadgeProps) {
  const params = useLocalSearchParams<{ id: string }>();
  const groupId = params.id;

  const handlePress = () => {
    haptics.light();
    if (onPress) {
      onPress();
    } else if (groupId) {
      router.push(`/group/${groupId}/upgrade`);
    }
  };

  if (size === 'sm') {
    return (
      <Pressable
        onPress={handlePress}
        className="flex-row items-center bg-primary/20 px-xs py-xs rounded-full"
        accessibilityLabel="Premium feature"
        accessibilityRole="button"
      >
        <Text className="text-caption">{'\u{1F451}'}</Text>
        <Text className="text-primary text-caption font-semibold ml-xs">PRO</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center bg-primary/20 px-s py-xs rounded-full"
      accessibilityLabel="Premium feature"
      accessibilityRole="button"
    >
      <Text className="text-body-sm">{'\u{1F451}'}</Text>
      <Text className="text-primary text-body-sm font-semibold ml-xs">Premium</Text>
    </Pressable>
  );
}

// Limit reached component
interface LimitReachedProps {
  limitType: 'pacts' | 'groups';
  current: number;
  max: number;
}

export function LimitReached({ limitType, current, max }: LimitReachedProps) {
  const params = useLocalSearchParams<{ id: string }>();
  const groupId = params.id;

  const handleUpgrade = () => {
    haptics.light();
    if (groupId) {
      router.push(`/group/${groupId}/upgrade`);
    }
  };

  const title = limitType === 'pacts' ? 'Pact Limit Reached' : 'Group Limit Reached';
  const description =
    limitType === 'pacts'
      ? `You've created ${current}/${max} pacts. Upgrade to create unlimited pacts.`
      : `You're in ${current}/${max} groups. Upgrade to join unlimited groups.`;

  return (
    <View className="bg-warning/10 border border-warning/30 rounded-md p-m">
      <View className="flex-row items-center mb-s">
        <View className="w-10 h-10 bg-warning/20 rounded-full items-center justify-center mr-s">
          <Text className="text-body">{'\u26A0'}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-body text-warning font-semibold">{title}</Text>
          <Text className="text-body-sm text-text-muted">{description}</Text>
        </View>
      </View>
      <Pressable
        onPress={handleUpgrade}
        className="py-s bg-primary rounded-sm items-center"
        accessibilityLabel="Upgrade to premium"
        accessibilityRole="button"
      >
        <Text className="text-white text-body-sm font-semibold">
          Upgrade for Unlimited
        </Text>
      </Pressable>
    </View>
  );
}
