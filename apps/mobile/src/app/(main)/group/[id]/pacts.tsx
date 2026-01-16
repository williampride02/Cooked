import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCheckIns } from '@/hooks/useCheckIns';
import { useAppStore } from '@/stores/app';
import { haptics } from '@/utils/haptics';

const ROAST_EMOJIS: Record<1 | 2 | 3, string> = {
  1: '\u{1F336}',
  2: '\u{1F336}\u{1F336}',
  3: '\u{1F336}\u{1F336}\u{1F336}',
};

interface PactItem {
  id: string;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'custom';
  frequency_days: number[] | null;
  roast_level: 1 | 2 | 3;
  proof_required: 'none' | 'optional' | 'required';
  pact_type: 'individual' | 'group' | 'relay';
  group_id: string;
  hasCheckedInToday: boolean;
  isDueToday: boolean;
  todayCheckIn: { id: string; status: string } | null;
}

export default function PactsScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const [pacts, setPacts] = useState<PactItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const { fetchUserPactsWithStatus, createCheckIn, isLoading, error } = useCheckIns();
  const currentGroup = useAppStore((state) => state.currentGroup);

  const loadPacts = useCallback(async () => {
    if (!groupId) return;
    const result = await fetchUserPactsWithStatus(groupId);
    setPacts(result);
  }, [groupId, fetchUserPactsWithStatus]);

  useEffect(() => {
    loadPacts();
  }, [loadPacts]);

  const handleRefresh = useCallback(async () => {
    haptics.pullToRefresh();
    setIsRefreshing(true);
    await loadPacts();
    setIsRefreshing(false);
  }, [loadPacts]);

  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  const handleCheckIn = useCallback(async (pactId: string, needsExcuse: boolean) => {
    if (checkingIn) return;

    setCheckingIn(pactId);
    haptics.medium();

    if (needsExcuse) {
      // Navigate to excuse selection screen
      setCheckingIn(null);
      router.push(`/group/${groupId}/pact/${pactId}/check-in?status=fold`);
      return;
    }

    // Success check-in
    const pact = pacts.find((p) => p.id === pactId);

    // If proof is required or optional, navigate to check-in screen
    if (pact?.proof_required !== 'none') {
      setCheckingIn(null);
      router.push(`/group/${groupId}/pact/${pactId}/check-in?status=success`);
      return;
    }

    // Direct success check-in
    const result = await createCheckIn({
      pactId,
      status: 'success',
    });

    if (result) {
      // Use celebration pattern for successful check-ins
      haptics.celebration();
      // Reload pacts to update UI
      await loadPacts();
    } else {
      haptics.error();
    }

    setCheckingIn(null);
  }, [checkingIn, groupId, pacts, createCheckIn, loadPacts]);

  const handlePactPress = useCallback((pactId: string) => {
    haptics.light();
    router.push(`/group/${groupId}/pact/${pactId}`);
  }, [groupId]);

  const renderPact = useCallback(({ item }: { item: PactItem }) => {
    const isCheckingIn = checkingIn === item.id;

    return (
      <Pressable
        onPress={() => handlePactPress(item.id)}
        className="bg-surface border border-border rounded-md p-m mb-s"
        accessibilityLabel={`View ${item.name}`}
        accessibilityRole="button"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-s">
          <View className="flex-1">
            <Text className="text-body text-text-primary font-semibold">
              {item.name}
            </Text>
            <Text className="text-caption text-text-muted">
              {item.frequency === 'daily' ? 'Daily' : item.frequency === 'weekly' ? 'Weekly' : 'Custom'}{' '}
              {ROAST_EMOJIS[item.roast_level]}
            </Text>
          </View>

          {/* Status Badge */}
          {item.hasCheckedInToday ? (
            <View className="bg-success/20 px-m py-xs rounded-full">
              <Text className="text-success text-body-sm">
                {item.todayCheckIn?.status === 'success' ? '\u2705 Done' : '\u274C Folded'}
              </Text>
            </View>
          ) : !item.isDueToday ? (
            <View className="bg-surface-elevated px-m py-xs rounded-full border border-border">
              <Text className="text-text-muted text-body-sm">Not due today</Text>
            </View>
          ) : null}
        </View>

        {/* Check-in Buttons */}
        {item.isDueToday && !item.hasCheckedInToday && (
          <View className="flex-row gap-s mt-s">
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleCheckIn(item.id, false);
              }}
              disabled={isCheckingIn}
              className={`flex-1 py-3 rounded-sm items-center ${
                isCheckingIn ? 'bg-success/50' : 'bg-success'
              }`}
              accessibilityLabel="I did it"
              accessibilityRole="button"
            >
              {isCheckingIn ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-white text-body font-semibold">
                  {'\u2705'} I did it
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleCheckIn(item.id, true);
              }}
              disabled={isCheckingIn}
              className="flex-1 py-3 rounded-sm items-center bg-danger/20 border border-danger/30"
              accessibilityLabel="I folded"
              accessibilityRole="button"
            >
              <Text className="text-danger text-body font-semibold">
                {'\u274C'} I folded
              </Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  }, [checkingIn, handleCheckIn, handlePactPress]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <View className="flex-1 items-center justify-center py-xl">
        <View className="w-20 h-20 bg-surface rounded-full items-center justify-center border border-border mb-m">
          <Text className="text-h1 text-text-muted">{'\u{1F4CB}'}</Text>
        </View>
        <Text className="text-body text-text-secondary text-center mb-s">
          No pacts yet
        </Text>
        <Text className="text-body-sm text-text-muted text-center px-l">
          Join or create a pact to start checking in!
        </Text>
      </View>
    );
  }, [isLoading]);

  if (isLoading && pacts.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  // Separate due and not due pacts
  const duePacts = pacts.filter((p) => p.isDueToday && !p.hasCheckedInToday);
  const completedPacts = pacts.filter((p) => p.hasCheckedInToday);
  const notDuePacts = pacts.filter((p) => !p.isDueToday && !p.hasCheckedInToday);

  const sections = [
    ...duePacts.map((p) => ({ ...p, section: 'due' })),
    ...completedPacts.map((p) => ({ ...p, section: 'completed' })),
    ...notDuePacts.map((p) => ({ ...p, section: 'notDue' })),
  ];

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
          My Pacts
        </Text>
      </View>

      {/* Error */}
      {error && (
        <View className="px-m py-s bg-danger/10">
          <Text className="text-danger text-body-sm text-center">{error}</Text>
        </View>
      )}

      {/* Pacts List */}
      <FlatList
        data={sections}
        renderItem={renderPact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="rgb(255, 77, 0)"
          />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          duePacts.length > 0 ? (
            <View className="mb-m">
              <Text className="text-body-sm text-primary font-semibold mb-xs">
                {'\u{1F525}'} Due Today ({duePacts.length})
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
