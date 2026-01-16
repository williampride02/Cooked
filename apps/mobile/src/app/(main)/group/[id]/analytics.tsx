import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscription } from '@/hooks/useSubscription';
import { useGroupAnalytics, type GroupAnalyticsData } from '@/hooks/useGroupAnalytics';
import { haptics } from '@/utils/haptics';
import { LineChart } from '@/components/charts/LineChart';
import { EMOJI_DISPLAY } from '@/hooks/useReactions';
import type { ReactionEmoji } from '@/types';

type TimeRange = 'week' | 'month' | 'all';

export default function GroupAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isPremium, isLoading: isLoadingSubscription } = useSubscription(id);
  const { data, isLoading, error, fetchAnalytics } = useGroupAnalytics(id || null);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch analytics on mount and when time range changes
  useEffect(() => {
    if (id && isPremium) {
      fetchAnalytics(timeRange);
    }
  }, [id, isPremium, timeRange, fetchAnalytics]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    haptics.pullToRefresh();
    setIsRefreshing(true);
    await fetchAnalytics(timeRange);
    setIsRefreshing(false);
  }, [fetchAnalytics, timeRange]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  // Handle upgrade press
  const handleUpgrade = useCallback(() => {
    haptics.light();
    if (id) {
      router.push(`/group/${id}/upgrade`);
    }
  }, [id]);

  // Handle time range change
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    haptics.selection();
    setTimeRange(range);
  }, []);

  // Show loading state while checking subscription
  if (isLoadingSubscription) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  // Show premium teaser for free users
  if (!isPremium) {
    return (
      <SafeAreaView className="flex-1 bg-background">
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
            Group Analytics
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Premium Teaser Hero */}
          <View className="bg-gradient-to-b from-primary/20 to-transparent rounded-lg p-l mb-m items-center">
            <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-m">
              <Text className="text-4xl">{'\u{1F4CA}'}</Text>
            </View>
            <Text className="text-h2 text-text-primary font-bold text-center mb-s">
              Unlock Group Analytics
            </Text>
            <Text className="text-body text-text-secondary text-center mb-l">
              Get deep insights into your group's performance, identify patterns, and track progress over time.
            </Text>
            <Pressable
              onPress={handleUpgrade}
              className="w-full py-4 bg-primary rounded-md items-center"
              accessibilityLabel="Upgrade to Premium"
              accessibilityRole="button"
            >
              <Text className="text-white text-body font-semibold">
                Upgrade to Premium
              </Text>
            </Pressable>
          </View>

          {/* Feature Preview Cards */}
          <Text className="text-body text-text-primary font-semibold mb-s">
            What you'll get:
          </Text>

          <PreviewCard
            icon={'\u{1F4C8}'}
            title="Completion Trends"
            description="Track your group's check-in success rate over time"
          />
          <PreviewCard
            icon={'\u{1F3C6}'}
            title="Member Leaderboard"
            description="See who's crushing it and who needs a nudge"
          />
          <PreviewCard
            icon={'\u{1F525}'}
            title="Most Active Pacts"
            description="Discover which pacts drive the most engagement"
          />
          <PreviewCard
            icon={'\u{23F0}'}
            title="Peak Check-in Times"
            description="Learn when your group is most active"
          />
          <PreviewCard
            icon={'\u{1F4C9}'}
            title="Fold Patterns"
            description="Identify weak spots - which days and pacts see the most folds"
          />
          <PreviewCard
            icon={'\u{1F480}'}
            title="Roast Engagement"
            description="Track roast thread activity and top reactions"
          />

          {/* Blurred Preview */}
          <View className="mt-m rounded-lg overflow-hidden">
            <View className="bg-surface border border-border rounded-lg p-m opacity-50">
              <Text className="text-body-sm text-text-muted mb-s">Sample Chart</Text>
              <View className="h-40 bg-surface-elevated rounded items-center justify-center">
                <Text className="text-text-muted text-body-sm">Chart Preview</Text>
              </View>
            </View>
            <View className="absolute inset-0 bg-background/80 items-center justify-center">
              <View className="bg-surface border border-primary/30 rounded-md px-m py-s">
                <Text className="text-primary text-body-sm font-semibold">
                  {'\u{1F512}'} Premium Only
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main analytics view for premium users
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
          <Text className="text-h2 text-text-primary font-semibold ml-s">
            Analytics
          </Text>
        </View>
        <View className="flex-row items-center bg-primary/20 px-s py-xs rounded-full">
          <Text className="text-caption">{'\u{1F451}'}</Text>
          <Text className="text-primary text-caption font-semibold ml-xs">PRO</Text>
        </View>
      </View>

      {/* Time Range Selector */}
      <View className="flex-row px-m py-s border-b border-border">
        <TimeRangeButton
          label="Week"
          isActive={timeRange === 'week'}
          onPress={() => handleTimeRangeChange('week')}
        />
        <TimeRangeButton
          label="Month"
          isActive={timeRange === 'month'}
          onPress={() => handleTimeRangeChange('month')}
        />
        <TimeRangeButton
          label="All Time"
          isActive={timeRange === 'all'}
          onPress={() => handleTimeRangeChange('all')}
        />
      </View>

      {/* Content */}
      {isLoading && !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
          <Text className="text-text-muted text-body-sm mt-m">Loading analytics...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-l">
          <Text className="text-danger text-body text-center mb-m">{error}</Text>
          <Pressable
            onPress={() => fetchAnalytics(timeRange)}
            className="px-l py-s bg-surface border border-border rounded-sm"
          >
            <Text className="text-text-primary text-body-sm">Try Again</Text>
          </Pressable>
        </View>
      ) : data ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="rgb(255, 77, 0)"
            />
          }
        >
          {/* Summary Stats */}
          <SummaryStats data={data} />

          {/* Completion Rate Over Time */}
          <AnalyticsCard title="Completion Rate Over Time" icon={'\u{1F4C8}'}>
            <LineChart
              data={data.completionOverTime.map((d) => ({
                label: d.date,
                value: d.rate,
              }))}
              height={200}
              yAxisSuffix="%"
              emptyMessage="No check-in data yet"
            />
          </AnalyticsCard>

          {/* Member Performance */}
          <AnalyticsCard title="Member Leaderboard" icon={'\u{1F3C6}'}>
            <MemberLeaderboard members={data.memberPerformance} />
          </AnalyticsCard>

          {/* Most Active Pacts */}
          <AnalyticsCard title="Pact Activity Breakdown" icon={'\u{1F525}'}>
            <PactActivityBreakdown pacts={data.mostActivePacts} />
          </AnalyticsCard>

          {/* Peak Check-in Times */}
          <AnalyticsCard title="Peak Check-in Times" icon={'\u{23F0}'}>
            <PeakTimesChart times={data.peakCheckInTimes} />
          </AnalyticsCard>

          {/* Fold Patterns */}
          <AnalyticsCard title="Fold Patterns" icon={'\u{1F4C9}'}>
            <FoldPatternsView patterns={data.foldPatterns} />
          </AnalyticsCard>

          {/* Roast Engagement */}
          <AnalyticsCard title="Roast Engagement" icon={'\u{1F480}'}>
            <RoastEngagementView engagement={data.roastEngagement} />
          </AnalyticsCard>

          <View className="h-8" />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

// Sub-components

function TimeRangeButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-m py-s mr-s rounded-full ${
        isActive ? 'bg-primary' : 'bg-surface border border-border'
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <Text
        className={`text-body-sm font-semibold ${
          isActive ? 'text-white' : 'text-text-muted'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PreviewCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-center bg-surface border border-border rounded-md p-m mb-s">
      <View className="w-10 h-10 bg-surface-elevated rounded-full items-center justify-center mr-s">
        <Text className="text-body">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-body text-text-primary font-semibold">{title}</Text>
        <Text className="text-body-sm text-text-muted">{description}</Text>
      </View>
    </View>
  );
}

function AnalyticsCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-surface border border-border rounded-lg p-m mb-m">
      <View className="flex-row items-center mb-m">
        <Text className="text-body mr-s">{icon}</Text>
        <Text className="text-body text-text-primary font-semibold">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function SummaryStats({ data }: { data: GroupAnalyticsData }) {
  return (
    <View className="flex-row flex-wrap mb-m">
      <StatCard
        label="Completion Rate"
        value={`${data.summary.overallCompletionRate}%`}
        color="text-success"
      />
      <StatCard
        label="Total Check-ins"
        value={data.summary.totalCheckIns.toString()}
        color="text-primary"
      />
      <StatCard
        label="Total Folds"
        value={data.summary.totalFolds.toString()}
        color="text-danger"
      />
      <StatCard
        label="Active Pacts"
        value={data.summary.activePacts.toString()}
        color="text-text-primary"
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View className="w-1/2 p-xs">
      <View className="bg-surface border border-border rounded-md p-m items-center">
        <Text className={`text-h2 font-bold ${color}`}>{value}</Text>
        <Text className="text-body-sm text-text-muted">{label}</Text>
      </View>
    </View>
  );
}

function MemberLeaderboard({
  members,
}: {
  members: GroupAnalyticsData['memberPerformance'];
}) {
  if (members.length === 0) {
    return (
      <Text className="text-text-muted text-body-sm text-center py-m">
        No member data yet
      </Text>
    );
  }

  return (
    <View>
      {members.slice(0, 5).map((member, index) => (
        <View
          key={member.userId}
          className={`flex-row items-center py-s ${
            index < members.length - 1 ? 'border-b border-border' : ''
          }`}
        >
          {/* Rank */}
          <View
            className={`w-7 h-7 rounded-full items-center justify-center mr-s ${
              index === 0
                ? 'bg-yellow-500'
                : index === 1
                ? 'bg-gray-400'
                : index === 2
                ? 'bg-amber-600'
                : 'bg-surface-elevated'
            }`}
          >
            <Text
              className={`text-body-sm font-bold ${
                index < 3 ? 'text-black' : 'text-text-muted'
              }`}
            >
              {index + 1}
            </Text>
          </View>

          {/* Avatar */}
          <View className="w-9 h-9 rounded-full bg-surface-elevated items-center justify-center border border-border mr-s">
            <Text className="text-text-muted text-body-sm">
              {member.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Name and Stats */}
          <View className="flex-1">
            <Text className="text-body text-text-primary">{member.displayName}</Text>
            <Text className="text-body-sm text-text-muted">
              {member.totalCheckIns} check-ins | {member.currentStreak} day streak
            </Text>
          </View>

          {/* Completion Rate */}
          <View className="items-end">
            <Text
              className={`text-body font-bold ${
                member.completionRate >= 80
                  ? 'text-success'
                  : member.completionRate >= 50
                  ? 'text-warning'
                  : 'text-danger'
              }`}
            >
              {member.completionRate}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function PactActivityBreakdown({
  pacts,
}: {
  pacts: GroupAnalyticsData['mostActivePacts'];
}) {
  if (pacts.length === 0) {
    return (
      <Text className="text-text-muted text-body-sm text-center py-m">
        No pact activity yet
      </Text>
    );
  }

  const maxCheckIns = Math.max(...pacts.map((p) => p.totalCheckIns + p.totalFolds), 1);

  return (
    <View>
      {pacts.slice(0, 5).map((pact, index) => {
        const total = pact.totalCheckIns + pact.totalFolds;
        const successWidth = total > 0 ? (pact.totalCheckIns / maxCheckIns) * 100 : 0;
        const foldWidth = total > 0 ? (pact.totalFolds / maxCheckIns) * 100 : 0;

        return (
          <View
            key={pact.pactId}
            className={`py-s ${index < pacts.length - 1 ? 'border-b border-border' : ''}`}
          >
            {/* Pact name and stats */}
            <View className="flex-row justify-between items-center mb-xs">
              <Text className="text-body text-text-primary flex-1" numberOfLines={1}>
                {pact.pactName}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-body-sm text-success mr-s">
                  {pact.totalCheckIns} {'\u2713'}
                </Text>
                <Text className="text-body-sm text-danger">
                  {pact.totalFolds} {'\u2717'}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="h-3 bg-surface-elevated rounded-full overflow-hidden flex-row">
              <View
                style={{ width: `${successWidth}%` }}
                className="h-full bg-success"
              />
              <View
                style={{ width: `${foldWidth}%` }}
                className="h-full bg-danger"
              />
            </View>

            {/* Participant and completion info */}
            <View className="flex-row justify-between mt-xs">
              <Text className="text-caption text-text-muted">
                {pact.participantCount} participant{pact.participantCount !== 1 ? 's' : ''}
              </Text>
              <Text
                className={`text-caption font-semibold ${
                  pact.completionRate >= 80
                    ? 'text-success'
                    : pact.completionRate >= 50
                    ? 'text-warning'
                    : 'text-danger'
                }`}
              >
                {pact.completionRate}% completion
              </Text>
            </View>
          </View>
        );
      })}

      {/* Legend */}
      <View className="flex-row justify-center mt-m pt-m border-t border-border">
        <View className="flex-row items-center mr-l">
          <View className="w-3 h-3 bg-success rounded-full mr-xs" />
          <Text className="text-caption text-text-muted">Check-ins</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 bg-danger rounded-full mr-xs" />
          <Text className="text-caption text-text-muted">Folds</Text>
        </View>
      </View>
    </View>
  );
}

function PeakTimesChart({
  times,
}: {
  times: GroupAnalyticsData['peakCheckInTimes'];
}) {
  // Find the peak hours
  const sortedTimes = [...times].sort((a, b) => b.count - a.count);
  const peakHours = sortedTimes.slice(0, 3);
  const maxCount = Math.max(...times.map((t) => t.count), 1);

  return (
    <View>
      {/* Simplified bar visualization for hours */}
      <View className="flex-row flex-wrap">
        {times.map((time) => {
          const height = (time.count / maxCount) * 60 + 4;
          const isPeak = peakHours.some((p) => p.hour === time.hour);

          return (
            <View key={time.hour} className="items-center" style={{ width: '4.166%' }}>
              <View
                style={{ height }}
                className={`w-2 rounded-t ${isPeak ? 'bg-primary' : 'bg-surface-elevated'}`}
              />
              {time.hour % 6 === 0 && (
                <Text className="text-caption text-text-muted mt-xs">
                  {formatHour(time.hour)}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Peak times summary */}
      <View className="flex-row mt-m pt-m border-t border-border">
        {peakHours.map((peak, i) => (
          <View key={peak.hour} className="flex-1 items-center">
            <Text className="text-body-sm text-text-muted">Peak #{i + 1}</Text>
            <Text className="text-body text-text-primary font-semibold">
              {formatHour(peak.hour)}
            </Text>
            <Text className="text-caption text-text-muted">{peak.count} check-ins</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FoldPatternsView({
  patterns,
}: {
  patterns: GroupAnalyticsData['foldPatterns'];
}) {
  const totalFolds = patterns.reduce((sum, p) => sum + p.foldCount, 0);
  const maxFolds = Math.max(...patterns.map((p) => p.foldCount), 1);
  const worstDay = patterns.reduce((a, b) => (a.foldCount > b.foldCount ? a : b));

  // Find pacts that cause most folds
  const pactFoldCounts = new Map<string, number>();
  patterns.forEach((p) => {
    if (p.topPact) {
      pactFoldCounts.set(p.topPact, (pactFoldCounts.get(p.topPact) || 0) + p.foldCount);
    }
  });
  const troublePacts = Array.from(pactFoldCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (totalFolds === 0) {
    return (
      <View className="items-center py-m">
        <Text className="text-success text-h2 mb-xs">{'\u{1F389}'}</Text>
        <Text className="text-text-primary text-body font-semibold">No folds yet!</Text>
        <Text className="text-text-muted text-body-sm">Your group is crushing it</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Day of week bars */}
      <View className="flex-row justify-between mb-m">
        {patterns.map((pattern) => {
          const height = (pattern.foldCount / maxFolds) * 80 + 8;
          const isWorst = pattern.dayOfWeek === worstDay.dayOfWeek && pattern.foldCount > 0;

          return (
            <View key={pattern.dayOfWeek} className="items-center flex-1">
              <Text className="text-caption text-text-muted mb-xs">
                {pattern.foldCount > 0 ? pattern.foldCount : ''}
              </Text>
              <View
                style={{ height }}
                className={`w-6 rounded-t ${isWorst ? 'bg-danger' : 'bg-surface-elevated'}`}
              />
              <Text
                className={`text-caption mt-xs ${
                  isWorst ? 'text-danger font-semibold' : 'text-text-muted'
                }`}
              >
                {pattern.dayName}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Insights */}
      <View className="space-y-s">
        {/* Worst day insight */}
        {worstDay.foldCount > 0 && (
          <View className="bg-danger/10 border border-danger/30 rounded-md p-s mb-s">
            <Text className="text-body-sm text-danger">
              {'\u26A0'} Most folds happen on {worstDay.dayName}s ({worstDay.percentage}% of all folds)
            </Text>
          </View>
        )}

        {/* Trouble pacts */}
        {troublePacts.length > 0 && (
          <View className="bg-surface-elevated rounded-md p-s">
            <Text className="text-body-sm text-text-muted mb-xs">
              {'\u{1F4A3}'} Pacts that need attention:
            </Text>
            {troublePacts.map(([pactName, count], i) => (
              <View key={pactName} className="flex-row justify-between items-center mt-xs">
                <Text className="text-body-sm text-text-primary" numberOfLines={1}>
                  {i + 1}. {pactName}
                </Text>
                <Text className="text-caption text-danger font-semibold">
                  {count} fold{count !== 1 ? 's' : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function RoastEngagementView({
  engagement,
}: {
  engagement: GroupAnalyticsData['roastEngagement'];
}) {
  if (engagement.totalThreads === 0) {
    return (
      <View className="items-center py-m">
        <Text className="text-text-muted text-h2 mb-xs">{'\u{1F480}'}</Text>
        <Text className="text-text-primary text-body font-semibold">No roasts yet</Text>
        <Text className="text-text-muted text-body-sm text-center">
          When someone folds, the roasting begins!
        </Text>
      </View>
    );
  }

  // Calculate engagement level
  const engagementLevel =
    engagement.avgResponsesPerThread >= 5
      ? 'on fire'
      : engagement.avgResponsesPerThread >= 3
      ? 'heating up'
      : engagement.avgResponsesPerThread >= 1
      ? 'warming up'
      : 'quiet';

  const engagementColor =
    engagement.avgResponsesPerThread >= 5
      ? 'text-danger'
      : engagement.avgResponsesPerThread >= 3
      ? 'text-primary'
      : engagement.avgResponsesPerThread >= 1
      ? 'text-warning'
      : 'text-text-muted';

  return (
    <View>
      {/* Stats cards */}
      <View className="flex-row mb-m">
        <View className="flex-1 bg-surface-elevated rounded-md p-s mr-xs items-center">
          <Text className="text-h2 text-primary font-bold">
            {engagement.totalThreads}
          </Text>
          <Text className="text-caption text-text-muted">Threads</Text>
        </View>
        <View className="flex-1 bg-surface-elevated rounded-md p-s mx-xs items-center">
          <Text className="text-h2 text-text-primary font-bold">
            {engagement.totalResponses}
          </Text>
          <Text className="text-caption text-text-muted">Roasts</Text>
        </View>
        <View className="flex-1 bg-surface-elevated rounded-md p-s ml-xs items-center">
          <Text className={`text-h2 font-bold ${engagementColor}`}>
            {engagement.avgResponsesPerThread}
          </Text>
          <Text className="text-caption text-text-muted">Avg/Thread</Text>
        </View>
      </View>

      {/* Engagement level indicator */}
      <View className="bg-surface-elevated rounded-md p-s mb-m">
        <View className="flex-row items-center justify-between">
          <Text className="text-body-sm text-text-muted">Roast intensity:</Text>
          <View className="flex-row items-center">
            {engagement.avgResponsesPerThread >= 1 && (
              <Text className="text-body mr-xs">{'\u{1F525}'}</Text>
            )}
            {engagement.avgResponsesPerThread >= 3 && (
              <Text className="text-body mr-xs">{'\u{1F525}'}</Text>
            )}
            {engagement.avgResponsesPerThread >= 5 && (
              <Text className="text-body mr-xs">{'\u{1F525}'}</Text>
            )}
            <Text className={`text-body-sm font-semibold ${engagementColor}`}>
              {engagementLevel.charAt(0).toUpperCase() + engagementLevel.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Most active roaster */}
      {engagement.mostActiveRoaster && (
        <View className="bg-primary/10 border border-primary/30 rounded-md p-s mb-m">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-s">
              <Text className="text-body font-semibold text-primary">
                {engagement.mostActiveRoaster.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-caption text-primary">
                {'\u{1F451}'} Top Roaster
              </Text>
              <Text className="text-body text-text-primary font-semibold">
                {engagement.mostActiveRoaster.displayName}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-h3 text-primary font-bold">
                {engagement.mostActiveRoaster.responseCount}
              </Text>
              <Text className="text-caption text-text-muted">roasts</Text>
            </View>
          </View>
        </View>
      )}

      {/* Top reactions */}
      {engagement.topReactions.length > 0 && (
        <View>
          <Text className="text-body-sm text-text-muted mb-s">Popular Reactions</Text>
          <View className="flex-row flex-wrap">
            {engagement.topReactions.map((reaction, i) => {
              const isFirst = i === 0;
              return (
                <View
                  key={reaction.emoji}
                  className={`flex-row items-center rounded-full px-s py-xs mr-s mb-s ${
                    isFirst ? 'bg-primary/20 border border-primary/30' : 'bg-surface-elevated'
                  }`}
                >
                  <Text className={isFirst ? 'text-body' : 'text-body-sm'}>
                    {EMOJI_DISPLAY[reaction.emoji as ReactionEmoji] || reaction.emoji}
                  </Text>
                  <Text
                    className={`ml-xs ${
                      isFirst
                        ? 'text-body-sm text-primary font-semibold'
                        : 'text-caption text-text-muted'
                    }`}
                  >
                    {reaction.count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// Utility functions

function formatHour(hour: number): string {
  if (hour === 0) return '12a';
  if (hour === 12) return '12p';
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}
