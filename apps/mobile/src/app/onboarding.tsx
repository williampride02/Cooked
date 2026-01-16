import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_COMPLETE_KEY = '@cooked_onboarding_complete';

interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: '\u{1F91D}', // Handshake
    title: 'Hold your friends accountable',
    description:
      'Create groups with your friends and make pacts to build better habits together.',
  },
  {
    id: '2',
    icon: '\u{2705}', // Check mark
    title: 'Create pacts and check in daily',
    description:
      'Set goals, track progress, and keep each other honest with daily check-ins.',
  },
  {
    id: '3',
    icon: '\u{1F525}', // Fire
    title: 'Get roasted when you fold',
    description:
      'Miss a check-in? Your friends will let you know. Friendly roasts keep everyone motivated.',
  },
  {
    id: '4',
    icon: '\u{1F3C6}', // Trophy
    title: 'Compete with weekly recaps',
    description:
      'See who crushed it and who got cooked with AI-generated weekly summaries.',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      haptics.success();
      router.replace('/(auth)');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      // Still navigate even if storage fails
      router.replace('/(auth)');
    }
  };

  const handleSkip = () => {
    haptics.light();
    completeOnboarding();
  };

  const handleNext = () => {
    haptics.light();
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  };

  const handleGetStarted = () => {
    haptics.medium();
    completeOnboarding();
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View
      style={{ width: SCREEN_WIDTH }}
      className="flex-1 items-center justify-center px-l"
    >
      <View className="w-32 h-32 bg-surface-elevated rounded-full items-center justify-center mb-xl">
        <Text style={{ fontSize: 64 }}>{item.icon}</Text>
      </View>
      <Text className="text-h1 text-text-primary font-bold text-center mb-m">
        {item.title}
      </Text>
      <Text className="text-body text-text-secondary text-center px-m">
        {item.description}
      </Text>
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header with Skip button */}
      <View className="flex-row justify-end px-m py-s">
        {!isLastSlide && (
          <Pressable
            testID="skip-onboarding"
            onPress={handleSkip}
            className="py-2 px-m"
            accessibilityLabel="Skip onboarding"
            accessibilityRole="button"
          >
            <Text className="text-body text-text-secondary">Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Progress Dots */}
      <View className="flex-row justify-center items-center py-l">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              index === currentIndex ? 'bg-primary' : 'bg-surface-elevated'
            }`}
          />
        ))}
      </View>

      {/* Bottom Button */}
      <View className="px-m pb-l">
        {isLastSlide ? (
          <Pressable
            onPress={handleGetStarted}
            className="bg-primary py-4 rounded-md items-center"
            accessibilityLabel="Get started"
            accessibilityRole="button"
          >
            <Text className="text-white text-body font-semibold">
              Get Started
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            className="bg-surface border border-border py-4 rounded-md items-center"
            accessibilityLabel="Next slide"
            accessibilityRole="button"
          >
            <Text className="text-text-primary text-body font-semibold">
              Next
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// Export the key for use in index.tsx
export { ONBOARDING_COMPLETE_KEY };
