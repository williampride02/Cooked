import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscription } from '@/hooks/useSubscription';
import { useAppStore } from '@/stores/app';
import { haptics } from '@/utils/haptics';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$4.99',
    period: '/month',
    description: 'Billed monthly. Cancel anytime.',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$49.99',
    period: '/year',
    description: 'Save $9.89! Billed annually.',
    badge: '2 months free',
  },
];

const FEATURES = [
  { icon: '\u{267E}', label: 'Unlimited pacts', description: 'Create as many pacts as you want' },
  { icon: '\u{1F4CA}', label: 'Full recap history', description: 'Access all past weekly recaps' },
  { icon: '\u{1F3E0}', label: 'Multiple groups', description: 'Join unlimited accountability groups' },
  { icon: '\u{1F4CA}', label: 'Group analytics', description: 'Track trends and insights' },
  { icon: '\u{1F525}', label: 'Custom roast prompts', description: 'Personalize your roast experience' },
  { icon: '\u{2728}', label: 'Priority support', description: 'Get help when you need it' },
];

export default function UpgradeScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  const { subscription, isPremium, isLoading, refetch } = useSubscription(groupId);
  const currentGroup = useAppStore((state) => state.currentGroup);

  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  const handleSelectPlan = useCallback((planId: string) => {
    haptics.light();
    setSelectedPlan(planId);
  }, []);

  const handleSubscribe = useCallback(async () => {
    haptics.medium();
    setIsProcessing(true);

    // In a real implementation, this would:
    // 1. Initialize in-app purchase with App Store / Play Store
    // 2. Present native payment sheet
    // 3. Verify receipt on server
    // 4. Update group subscription status

    // For now, show a placeholder
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Coming Soon',
        'In-app purchases will be available in the next app update. Stay tuned!',
        [{ text: 'OK' }]
      );
    }, 1500);
  }, [selectedPlan]);

  const handleManageSubscription = useCallback(() => {
    haptics.light();
    // In production, this would open the native subscription management
    Alert.alert(
      'Manage Subscription',
      'To manage your subscription, go to your device Settings > [Your Name] > Subscriptions.',
      [{ text: 'OK' }]
    );
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  // Already premium - show management options
  if (isPremium) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row items-center px-m py-s border-b border-border">
          <Pressable
            onPress={handleBack}
            className="w-11 h-11 items-center justify-center -ml-s"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text className="text-text-primary text-h2">{'\u2190'}</Text>
          </Pressable>
          <Text className="text-h2 text-text-primary font-semibold ml-s">
            Premium
          </Text>
        </View>

        <View className="flex-1 items-center justify-center p-m">
          <View className="w-24 h-24 bg-primary/20 rounded-full items-center justify-center mb-m">
            <Text className="text-4xl">{'\u{1F451}'}</Text>
          </View>
          <Text className="text-h1 text-primary font-bold mb-xs">Premium Active</Text>
          <Text className="text-body text-text-secondary text-center mb-m">
            {currentGroup?.name || 'This group'} has premium features unlocked!
          </Text>
          {subscription?.expires_at && (
            <Text className="text-body-sm text-text-muted mb-l">
              Renews: {new Date(subscription.expires_at).toLocaleDateString()}
            </Text>
          )}
          <Pressable
            onPress={handleManageSubscription}
            className="py-3 px-l bg-surface border border-border rounded-sm"
            accessibilityLabel="Manage subscription"
            accessibilityRole="button"
          >
            <Text className="text-body text-text-primary font-semibold">
              Manage Subscription
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-m py-s border-b border-border">
        <Pressable
          onPress={handleBack}
          className="w-11 h-11 items-center justify-center -ml-s"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text className="text-text-primary text-h2">{'\u2190'}</Text>
        </Pressable>
        <Text className="text-h2 text-text-primary font-semibold ml-s">
          Upgrade to Premium
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Hero */}
        <View className="items-center py-l mb-m">
          <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-m">
            <Text className="text-3xl">{'\u{1F451}'}</Text>
          </View>
          <Text className="text-h1 text-text-primary font-bold text-center mb-xs">
            Unlock Full Access
          </Text>
          <Text className="text-body text-text-secondary text-center">
            Get unlimited features for your accountability group
          </Text>
        </View>

        {/* Plan Selection */}
        <Text className="text-h3 text-text-primary font-semibold mb-s">
          Choose Your Plan
        </Text>
        <View className="mb-m">
          {PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => handleSelectPlan(plan.id)}
              className={`p-m rounded-md border mb-s ${
                selectedPlan === plan.id
                  ? 'bg-primary/20 border-primary'
                  : 'bg-surface border-border'
              }`}
              accessibilityLabel={`${plan.name} plan`}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedPlan === plan.id }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View
                    className={`w-6 h-6 rounded-full border items-center justify-center mr-s ${
                      selectedPlan === plan.id
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}
                  >
                    {selectedPlan === plan.id && (
                      <View className="w-3 h-3 rounded-full bg-white" />
                    )}
                  </View>
                  <View>
                    <Text
                      className={`text-body font-semibold ${
                        selectedPlan === plan.id ? 'text-primary' : 'text-text-primary'
                      }`}
                    >
                      {plan.name}
                    </Text>
                    <Text className="text-body-sm text-text-muted">{plan.description}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text
                    className={`text-h3 font-bold ${
                      selectedPlan === plan.id ? 'text-primary' : 'text-text-primary'
                    }`}
                  >
                    {plan.price}
                  </Text>
                  <Text className="text-caption text-text-muted">{plan.period}</Text>
                </View>
              </View>
              {plan.badge && (
                <View className="absolute top-0 right-0 bg-success px-s py-xs rounded-tr-md rounded-bl-md">
                  <Text className="text-white text-caption font-semibold">{plan.badge}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Features */}
        <Text className="text-h3 text-text-primary font-semibold mb-s">
          What You Get
        </Text>
        <View className="bg-surface border border-border rounded-md p-m mb-l">
          {FEATURES.map((feature, index) => (
            <View
              key={feature.label}
              className={`flex-row items-center ${
                index < FEATURES.length - 1 ? 'mb-m pb-m border-b border-border' : ''
              }`}
            >
              <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mr-s">
                <Text className="text-body">{feature.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-body text-text-primary font-semibold">
                  {feature.label}
                </Text>
                <Text className="text-body-sm text-text-muted">{feature.description}</Text>
              </View>
              <Text className="text-success text-body">{'\u2713'}</Text>
            </View>
          ))}
        </View>

        {/* Subscribe Button */}
        <Pressable
          onPress={handleSubscribe}
          disabled={isProcessing}
          className={`py-4 rounded-sm items-center mb-m ${
            isProcessing ? 'bg-surface' : 'bg-primary'
          }`}
          accessibilityLabel="Subscribe to premium"
          accessibilityRole="button"
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-body font-semibold">
              Subscribe Now
            </Text>
          )}
        </Pressable>

        {/* Terms */}
        <Text className="text-caption text-text-muted text-center">
          Payment will be charged to your App Store or Google Play account.
          Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
