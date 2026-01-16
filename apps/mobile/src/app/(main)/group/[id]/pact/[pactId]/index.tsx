import React, { useEffect, useState, useCallback } from 'react';
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
import { usePacts } from '@/hooks/usePacts';
import { usePactStats } from '@/hooks/usePactStats';
import { useAppStore } from '@/stores/app';
import { haptics } from '@/utils/haptics';
import type { PactWithParticipants } from '@/types';

const ROAST_EMOJIS: Record<1 | 2 | 3, string> = {
  1: '\u{1F336}',
  2: '\u{1F336}\u{1F336}',
  3: '\u{1F336}\u{1F336}\u{1F336}',
};

const ROAST_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Mild',
  2: 'Medium',
  3: 'Nuclear',
};

const PACT_TYPE_INFO: Record<string, { emoji: string; label: string }> = {
  individual: { emoji: '\u{1F464}', label: 'Individual' },
  group: { emoji: '\u{1F465}', label: 'Group' },
  relay: { emoji: '\u{1F3C3}', label: 'Relay' },
};

const DAY_LABELS: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

interface PactStatsData {
  pactId: string;
  totalExpected: number;
  totalCheckIns: number;
  overallCompletionRate: number;
  participantStats: Array<{
    userId: string;
    displayName: string;
    totalCheckIns: number;
    successCount: number;
    foldCount: number;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
  }>;
}

export default function PactDetailScreen() {
  const { id: groupId, pactId } = useLocalSearchParams<{ id: string; pactId: string }>();
  const [pact, setPact] = useState<PactWithParticipants | null>(null);
  const [stats, setStats] = useState<PactStatsData | null>(null);
  const [showStats, setShowStats] = useState(false);
  const { fetchPact, archivePact, isLoading, error } = usePacts();
  const { fetchPactStats, isLoading: isLoadingStats } = usePactStats();
  const user = useAppStore((state) => state.user);

  const isCreator = pact?.created_by === user?.id;

  useEffect(() => {
    async function loadPact() {
      if (!pactId) return;
      const result = await fetchPact(pactId);
      setPact(result);
    }
    loadPact();
  }, [pactId, fetchPact]);

  // Load stats when toggled
  useEffect(() => {
    async function loadStats() {
      if (!pactId || !showStats || stats) return;
      const result = await fetchPactStats(pactId);
      if (result) {
        setStats(result);
      }
    }
    loadStats();
  }, [pactId, showStats, stats, fetchPactStats]);

  const handleToggleStats = useCallback(() => {
    haptics.light();
    setShowStats((prev) => !prev);
  }, []);

  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  const handleEdit = useCallback(() => {
    if (!pactId || !groupId) return;
    haptics.light();
    router.push(`/group/${groupId}/pact/${pactId}/edit`);
  }, [pactId, groupId]);

  const handleArchive = useCallback(() => {
    if (!pactId) return;
    haptics.medium();

    Alert.alert(
      'Archive Pact',
      'Are you sure you want to archive this pact? No new check-ins will be accepted, but history will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            const success = await archivePact(pactId);
            if (success) {
              haptics.success();
              router.back();
            } else {
              haptics.error();
            }
          },
        },
      ]
    );
  }, [pactId, archivePact]);

  if (isLoading && !pact) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  if (error || !pact) {
    return (
      <SafeAreaView className="flex-1 bg-background">
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
            Pact
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-m">
          <Text className="text-danger text-body text-center">
            {error || 'Pact not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = PACT_TYPE_INFO[pact.pact_type] || PACT_TYPE_INFO.individual;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-m py-s border-b border-border">
        <View className="flex-row items-center">
          <Pressable
            onPress={handleBack}
            className="w-11 h-11 items-center justify-center -ml-s"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text className="text-text-primary text-h2">{'\u2190'}</Text>
          </Pressable>
          <Text className="text-h2 text-text-primary font-semibold ml-s" numberOfLines={1}>
            {pact.name}
          </Text>
        </View>
        {isCreator && (
          <Pressable
            onPress={handleEdit}
            className="px-m py-s bg-surface rounded-sm border border-border"
            accessibilityLabel="Edit pact"
            accessibilityRole="button"
          >
            <Text className="text-body-sm text-text-primary">Edit</Text>
          </Pressable>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Pact Type Badge */}
        <View className="flex-row items-center mb-m">
          <View className="flex-row items-center bg-surface px-m py-s rounded-full border border-border">
            <Text className="text-body mr-xs">{typeInfo.emoji}</Text>
            <Text className="text-body-sm text-text-primary">{typeInfo.label}</Text>
          </View>
          <View className="flex-row items-center bg-surface px-m py-s rounded-full border border-border ml-s">
            <Text className="text-body mr-xs">{ROAST_EMOJIS[pact.roast_level]}</Text>
            <Text className="text-body-sm text-text-primary">{ROAST_LABELS[pact.roast_level]}</Text>
          </View>
        </View>

        {/* Description */}
        {pact.description && (
          <View className="mb-m">
            <Text className="text-body-sm text-text-secondary mb-xs">Description</Text>
            <Text className="text-body text-text-primary">{pact.description}</Text>
          </View>
        )}

        {/* Frequency */}
        <View className="mb-m">
          <Text className="text-body-sm text-text-secondary mb-xs">Frequency</Text>
          <Text className="text-body text-text-primary capitalize">
            {pact.frequency === 'custom' && pact.frequency_days
              ? pact.frequency_days.map((d) => DAY_LABELS[d]).join(', ')
              : pact.frequency}
          </Text>
        </View>

        {/* Proof Requirement */}
        <View className="mb-m">
          <Text className="text-body-sm text-text-secondary mb-xs">Proof Photo</Text>
          <Text className="text-body text-text-primary capitalize">
            {pact.proof_required === 'none' ? 'Not Required' : pact.proof_required}
          </Text>
        </View>

        {/* Participants */}
        <View className="mb-m">
          <Text className="text-body-sm text-text-secondary mb-xs">
            Participants ({pact.participants.length})
          </Text>
          <View className="bg-surface border border-border rounded-md">
            {pact.participants.map((participant, index) => (
              <View
                key={participant.user_id}
                className={`flex-row items-center p-m ${
                  index < pact.participants.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <View className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center border border-border">
                  <Text className="text-text-muted text-body">
                    {participant.user.display_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="ml-s flex-1">
                  <Text className="text-body text-text-primary">
                    {participant.user.display_name}
                    {participant.user_id === user?.id && (
                      <Text className="text-text-muted"> (you)</Text>
                    )}
                  </Text>
                  {pact.pact_type === 'relay' && participant.relay_days && participant.relay_days.length > 0 && (
                    <Text className="text-caption text-text-muted">
                      {participant.relay_days.map((d) => DAY_LABELS[d]).join(', ')}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Statistics Section */}
        <View className="mb-m">
          <Pressable
            onPress={handleToggleStats}
            className="flex-row items-center justify-between bg-surface border border-border rounded-md p-m"
            accessibilityLabel={showStats ? 'Hide statistics' : 'Show statistics'}
            accessibilityRole="button"
          >
            <View className="flex-row items-center">
              <Text className="text-body mr-xs">{'\u{1F4CA}'}</Text>
              <Text className="text-body text-text-primary font-semibold">Statistics</Text>
            </View>
            <Text className="text-text-muted text-body">
              {showStats ? '\u25B2' : '\u25BC'}
            </Text>
          </Pressable>

          {showStats && (
            <View className="bg-surface border border-border border-t-0 rounded-b-md p-m">
              {isLoadingStats ? (
                <View className="py-m items-center">
                  <ActivityIndicator color="rgb(255, 77, 0)" />
                </View>
              ) : stats ? (
                <>
                  {/* Overall Stats */}
                  <View className="flex-row mb-m">
                    <View className="flex-1 items-center p-s bg-primary/10 rounded-sm mr-xs">
                      <Text className="text-h2 text-primary font-bold">
                        {stats.overallCompletionRate}%
                      </Text>
                      <Text className="text-caption text-text-muted">Completion</Text>
                    </View>
                    <View className="flex-1 items-center p-s bg-surface-elevated rounded-sm ml-xs">
                      <Text className="text-h2 text-text-primary font-bold">
                        {stats.totalCheckIns}
                      </Text>
                      <Text className="text-caption text-text-muted">Total Check-ins</Text>
                    </View>
                  </View>

                  {/* Per Participant Stats */}
                  <Text className="text-body-sm text-text-secondary mb-xs">
                    Per Participant
                  </Text>
                  {stats.participantStats.map((p, index) => (
                    <View
                      key={p.userId}
                      className={`py-s ${
                        index < stats.participantStats.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      <View className="flex-row items-center justify-between mb-xs">
                        <Text className="text-body text-text-primary font-semibold">
                          {p.displayName}
                          {p.userId === user?.id && (
                            <Text className="text-text-muted font-normal"> (you)</Text>
                          )}
                        </Text>
                        <Text className="text-body-sm text-primary font-semibold">
                          {p.completionRate}%
                        </Text>
                      </View>
                      <View className="flex-row">
                        <View className="flex-1">
                          <Text className="text-caption text-text-muted">
                            {'\u{1F525}'} Current: {p.currentStreak}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-caption text-text-muted">
                            {'\u{1F3C6}'} Best: {p.longestStreak}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-caption text-text-muted">
                            {'\u2705'} {p.successCount} / {'\u274C'} {p.foldCount}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <Text className="text-text-muted text-body-sm text-center py-m">
                  No statistics available yet
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Archive Button (Creator only) */}
        {isCreator && (
          <Pressable
            onPress={handleArchive}
            className="py-4 rounded-sm items-center bg-danger/10 border border-danger/30 mt-m"
            accessibilityLabel="Archive pact"
            accessibilityRole="button"
          >
            <Text className="text-body font-semibold text-danger">
              Archive Pact
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
