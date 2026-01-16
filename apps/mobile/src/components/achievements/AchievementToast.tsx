import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Pressable, Dimensions } from 'react-native';
import { haptics } from '@/utils/haptics';
import type { AchievementDefinition, AchievementTier } from '@/types';
import { TIER_COLORS } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_DURATION = 4000; // 4 seconds

interface AchievementToastProps {
  achievement: AchievementDefinition;
  visible: boolean;
  onDismiss: () => void;
  onPress?: () => void;
}

// Tier glow colors for the toast border
const TIER_GLOW: Record<AchievementTier, string> = {
  bronze: 'border-amber-600',
  silver: 'border-gray-400',
  gold: 'border-yellow-400',
  platinum: 'border-purple-400',
};

export function AchievementToast({
  achievement,
  visible,
  onDismiss,
  onPress,
}: AchievementToastProps) {
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const dismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Trigger celebration haptic feedback for achievement unlocks
      haptics.celebration();

      // Clear any existing timeout
      if (dismissTimeout.current) {
        clearTimeout(dismissTimeout.current);
      }

      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after duration
      dismissTimeout.current = setTimeout(() => {
        handleDismiss();
      }, TOAST_DURATION);
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -150,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (dismissTimeout.current) {
        clearTimeout(dismissTimeout.current);
      }
    };
  }, [visible]);

  const handleDismiss = () => {
    // Animate out then call onDismiss
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    haptics.light();
    if (dismissTimeout.current) {
      clearTimeout(dismissTimeout.current);
    }
    onPress?.();
    handleDismiss();
  };

  const tierColor = TIER_COLORS[achievement.tier];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        opacity: opacityAnim,
      }}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Pressable
        onPress={handlePress}
        className={`flex-row items-center p-m rounded-md bg-surface border-2 ${TIER_GLOW[achievement.tier]}`}
        style={{
          shadowColor: tierColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Confetti-like decoration */}
        <View
          className="absolute top-0 left-0 right-0 h-1 rounded-t-sm"
          style={{ backgroundColor: tierColor }}
        />

        {/* Icon */}
        <View
          className="w-14 h-14 rounded-full items-center justify-center mr-m"
          style={{ backgroundColor: tierColor + '30' }}
        >
          <Text className="text-h1">{achievement.icon}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-body-sm text-success font-semibold mb-xs">
            Achievement Unlocked!
          </Text>
          <Text className="text-body text-text-primary font-bold">
            {achievement.name}
          </Text>
          <Text className="text-body-sm text-text-secondary">
            +{achievement.xp_reward} XP
          </Text>
        </View>

        {/* Tier badge */}
        <View
          className="px-s py-xs rounded-sm"
          style={{ backgroundColor: tierColor + '40' }}
        >
          <Text
            className="text-body-sm font-bold capitalize"
            style={{ color: tierColor }}
          >
            {achievement.tier}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
