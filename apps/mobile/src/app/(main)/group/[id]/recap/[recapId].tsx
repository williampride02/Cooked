import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecaps } from '@/hooks/useRecaps';
import { useShare } from '@/hooks/useShare';
import { useShareableLink } from '@/providers';
import { ShareModal } from '@/components/share';
import { haptics } from '@/utils/haptics';
import type { WeeklyRecap, RecapAwardWinner, RecapExcuseAward, RecapRoastAward, RecapLeaderboardEntry } from '@/types';

const AWARD_INFO = {
  most_consistent: { emoji: '\u{1F3C6}', label: 'Most Consistent', description: 'Highest check-in rate' },
  biggest_fold: { emoji: '\u{1F921}', label: 'Biggest Fold', description: 'Most folds this week' },
  excuse_hall_of_fame: { emoji: '\u{1F9E2}', label: 'Excuse Hall of Fame', description: 'Most creative excuse' },
  comeback_player: { emoji: '\u{1F525}', label: 'Comeback Player', description: 'Most improved' },
  best_roast: { emoji: '\u{1F480}', label: 'Best Roast', description: 'Most-reacted roast' },
};

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}

function AwardCard({
  type,
  winner
}: {
  type: keyof typeof AWARD_INFO;
  winner: RecapAwardWinner | RecapExcuseAward | RecapRoastAward | null;
}) {
  if (!winner) return null;

  const info = AWARD_INFO[type];

  return (
    <View className="bg-surface border border-border rounded-md p-m mb-s">
      <View className="flex-row items-center mb-s">
        <Text className="text-2xl mr-s">{info.emoji}</Text>
        <View className="flex-1">
          <Text className="text-body text-text-primary font-semibold">{info.label}</Text>
          <Text className="text-caption text-text-muted">{info.description}</Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center border border-border overflow-hidden">
          {winner.avatar_url ? (
            <Image source={{ uri: winner.avatar_url }} className="w-full h-full" />
          ) : (
            <Text className="text-text-muted text-body">
              {winner.display_name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View className="flex-1 ml-s">
          <Text className="text-body text-text-primary font-semibold">
            {winner.display_name}
          </Text>
          {type === 'most_consistent' && 'value' in winner && (
            <Text className="text-body-sm text-success">{Math.round(winner.value)}% check-in rate</Text>
          )}
          {type === 'biggest_fold' && 'value' in winner && (
            <Text className="text-body-sm text-danger">{winner.value} folds</Text>
          )}
          {type === 'excuse_hall_of_fame' && 'excuse' in winner && (
            <Text className="text-body-sm text-text-muted italic">"{winner.excuse}"</Text>
          )}
          {type === 'comeback_player' && 'value' in winner && (
            <Text className="text-body-sm text-primary">+{Math.round(winner.value)}% improvement</Text>
          )}
          {type === 'best_roast' && 'content' in winner && (
            <Text className="text-body-sm text-text-secondary" numberOfLines={2}>
              "{winner.content}"
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function LeaderboardRow({ entry, rank }: { entry: RecapLeaderboardEntry; rank: number }) {
  const rankEmoji = rank === 1 ? '\u{1F947}' : rank === 2 ? '\u{1F948}' : rank === 3 ? '\u{1F949}' : `${rank}`;

  return (
    <View className="flex-row items-center py-s border-b border-border">
      <Text className="text-body w-8 text-center">{rankEmoji}</Text>
      <View className="w-8 h-8 rounded-full bg-surface-elevated items-center justify-center border border-border overflow-hidden">
        {entry.avatar_url ? (
          <Image source={{ uri: entry.avatar_url }} className="w-full h-full" />
        ) : (
          <Text className="text-text-muted text-caption">
            {entry.display_name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <Text className="flex-1 text-body text-text-primary ml-s" numberOfLines={1}>
        {entry.display_name}
      </Text>
      <Text className="text-body-sm text-success w-16 text-right">
        {Math.round(entry.completion_rate)}%
      </Text>
      <Text className="text-caption text-text-muted w-20 text-right">
        {entry.check_ins}W / {entry.folds}L
      </Text>
    </View>
  );
}

export default function RecapScreen() {
  const { id: groupId, recapId } = useLocalSearchParams<{ id: string; recapId: string }>();
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const { createRecapLink } = useShareableLink();

  const { fetchRecap, isLoading, error } = useRecaps();
  const {
    isShareModalVisible,
    shareCardData,
    shareUrl,
    shareRecap,
    closeShareModal,
  } = useShare();

  const loadRecap = useCallback(async () => {
    if (!recapId) return;
    const result = await fetchRecap(recapId);
    setRecap(result);
  }, [recapId, fetchRecap]);

  useEffect(() => {
    loadRecap();
  }, [loadRecap]);

  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  // Share as text (quick share)
  const handleQuickShare = useCallback(async () => {
    if (!recap || !recapId || !groupId) return;
    haptics.medium();

    try {
      // Use groupId for better deep link navigation
      const recapLink = createRecapLink(recapId, groupId);
      const message = `Check out our weekly recap! ${formatDateRange(recap.week_start, recap.week_end)}\n\n` +
        `Group completion: ${Math.round(recap.data.stats.group_completion_rate)}%\n` +
        `Most consistent: ${recap.data.awards.most_consistent?.display_name || 'N/A'}\n\n` +
        `${recapLink}`;

      await Share.share({
        message,
        title: 'Weekly Recap',
        url: recapLink,
      });
      haptics.success();
    } catch (err) {
      console.error('Share error:', err);
      haptics.error();
    }
  }, [recap, recapId, groupId, createRecapLink]);

  // Share as image (opens modal)
  const handleShareImage = useCallback(() => {
    if (!recap) return;
    haptics.medium();
    shareRecap(recap);
  }, [recap, shareRecap]);

  if (isLoading && !recap) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  if (!recap) {
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
            Weekly Recap
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-danger text-body">{error || 'Recap not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { awards, stats, highlights } = recap.data;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-m py-s border-b border-border">
        <View className="flex-row items-center flex-1">
          <Pressable
            onPress={handleBack}
            className="w-11 h-11 items-center justify-center -ml-s"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text className="text-text-primary text-h2">{'\u2190'}</Text>
          </Pressable>
          <View className="ml-s">
            <Text className="text-h2 text-text-primary font-semibold">Weekly Recap</Text>
            <Text className="text-caption text-text-muted">
              {formatDateRange(recap.week_start, recap.week_end)}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-s">
          <Pressable
            onPress={handleQuickShare}
            className="px-m py-s bg-surface border border-border rounded-full"
            accessibilityLabel="Share as text"
            accessibilityRole="button"
          >
            <Text className="text-text-primary text-body-sm font-semibold">{'\u{1F517}'}</Text>
          </Pressable>
          <Pressable
            onPress={handleShareImage}
            className="px-m py-s bg-primary rounded-full"
            accessibilityLabel="Share as image"
            accessibilityRole="button"
          >
            <Text className="text-white text-body-sm font-semibold">{'\u{1F4E4}'} Share</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Overall Stats Banner */}
        <View className="bg-primary/20 border border-primary/30 rounded-md p-m mb-m">
          <Text className="text-center text-h1 text-primary font-bold mb-xs">
            {Math.round(stats.group_completion_rate)}%
          </Text>
          <Text className="text-center text-body text-text-primary">
            Group Completion Rate
          </Text>
          <View className="flex-row justify-center mt-s gap-l">
            <View className="items-center">
              <Text className="text-body text-success font-semibold">{stats.total_check_ins}</Text>
              <Text className="text-caption text-text-muted">Check-ins</Text>
            </View>
            <View className="items-center">
              <Text className="text-body text-danger font-semibold">{stats.total_folds}</Text>
              <Text className="text-caption text-text-muted">Folds</Text>
            </View>
            <View className="items-center">
              <Text className="text-body text-text-primary font-semibold">{stats.active_pacts}</Text>
              <Text className="text-caption text-text-muted">Active Pacts</Text>
            </View>
            <View className="items-center">
              <Text className="text-body text-warning font-semibold">{stats.roast_threads_opened}</Text>
              <Text className="text-caption text-text-muted">Roasts</Text>
            </View>
          </View>
        </View>

        {/* Awards Section */}
        <Text className="text-h3 text-text-primary font-semibold mb-s">
          {'\u{1F3C6}'} Awards
        </Text>
        {awards.most_consistent || awards.biggest_fold || awards.excuse_hall_of_fame || awards.comeback_player || awards.best_roast ? (
          <>
            <AwardCard type="most_consistent" winner={awards.most_consistent} />
            <AwardCard type="biggest_fold" winner={awards.biggest_fold} />
            <AwardCard type="excuse_hall_of_fame" winner={awards.excuse_hall_of_fame} />
            <AwardCard type="comeback_player" winner={awards.comeback_player} />
            <AwardCard type="best_roast" winner={awards.best_roast} />
          </>
        ) : (
          <View className="bg-surface border border-border rounded-md p-m mb-s">
            <Text className="text-text-muted text-body-sm text-center py-m">
              No awards this week. Keep checking in to earn awards!
            </Text>
          </View>
        )}

        {/* Leaderboard Section */}
        <Text className="text-h3 text-text-primary font-semibold mb-s mt-m">
          {'\u{1F4CA}'} Leaderboard
        </Text>
        <View className="bg-surface border border-border rounded-md p-m mb-m">
          {stats.leaderboard.length > 0 ? (
            stats.leaderboard.map((entry, index) => (
              <LeaderboardRow key={entry.user_id} entry={entry} rank={index + 1} />
            ))
          ) : (
            <Text className="text-text-muted text-body-sm text-center py-m">
              No leaderboard data available
            </Text>
          )}
        </View>

        {/* Highlights Section */}
        <Text className="text-h3 text-text-primary font-semibold mb-s">
          {'\u2728'} Highlights
        </Text>
        <View className="bg-surface border border-border rounded-md p-m mb-l">
          {highlights.longest_streak && (
            <View className="mb-s pb-s border-b border-border">
              <Text className="text-body-sm text-text-muted">Longest Active Streak</Text>
              <Text className="text-body text-text-primary">
                {highlights.longest_streak.display_name} - {highlights.longest_streak.streak_days} days on{' '}
                <Text className="font-semibold">{highlights.longest_streak.pact_name}</Text>
              </Text>
            </View>
          )}
          {highlights.biggest_improvement && (
            <View className="mb-s pb-s border-b border-border">
              <Text className="text-body-sm text-text-muted">Biggest Improvement</Text>
              <Text className="text-body text-text-primary">
                {highlights.biggest_improvement.display_name}{' '}
                <Text className="text-success">+{Math.round(highlights.biggest_improvement.value)}%</Text>
              </Text>
            </View>
          )}
          {highlights.top_roasts.length > 0 && (
            <View>
              <Text className="text-body-sm text-text-muted mb-xs">Top Roasts</Text>
              {highlights.top_roasts.slice(0, 3).map((roast, index) => (
                <View key={roast.response_id} className="flex-row items-start mb-xs">
                  <Text className="text-body mr-xs">{index + 1}.</Text>
                  <View className="flex-1">
                    <Text className="text-body-sm text-text-primary" numberOfLines={2}>
                      "{roast.content}"
                    </Text>
                    <Text className="text-caption text-text-muted">
                      - {roast.display_name} ({roast.reaction_count} reactions)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          {!highlights.longest_streak && !highlights.biggest_improvement && highlights.top_roasts.length === 0 && (
            <Text className="text-text-muted text-body-sm text-center py-m">
              No highlights this week
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Share Modal */}
      {shareCardData && (
        <ShareModal
          visible={isShareModalVisible}
          onClose={closeShareModal}
          cardData={shareCardData}
          shareUrl={shareUrl || undefined}
        />
      )}
    </SafeAreaView>
  );
}
