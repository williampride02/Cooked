import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFeed } from '@/hooks/useFeed';
import { useRoastThreads } from '@/hooks/useRoastThreads';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useAppStore } from '@/stores/app';
import { FeedItemComponent } from '@/components/feed/FeedItem';
import { haptics } from '@/utils/haptics';
import type { FeedItem, CheckInFeedItem } from '@/types';

export default function GroupFeedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentGroup = useAppStore((state) => state.currentGroup);
  const {
    feedItems,
    isLoading,
    isRefreshing,
    error,
    refresh,
    loadMore,
    hasMore,
  } = useFeed(id || null);
  const { fetchThreadByCheckIn } = useRoastThreads();

  // Subscribe to real-time updates for this group
  // This enhances the existing feed subscription with member joined events
  // and ensures cache invalidation happens properly
  useRealtimeSubscription({
    groupId: id || null,
    enabled: !!id,
    callbacks: {
      // Refresh feed when new check-in arrives (the hook also updates cache)
      onCheckIn: () => {
        // Feed is already updated via cache, but trigger a light haptic
        haptics.light();
      },
      // Refresh when new member joins
      onMemberJoined: () => {
        haptics.light();
        refresh();
      },
    },
  });

  // Handle invite press
  const handleInvite = useCallback(() => {
    haptics.light();
    router.push(`/group/${id}/invite`);
  }, [id]);

  // Handle settings press
  const handleSettings = useCallback(() => {
    haptics.light();
    router.push(`/group/${id}/settings`);
  }, [id]);

  // Handle create pact
  const handleCreatePact = useCallback(() => {
    haptics.light();
    router.push(`/group/${id}/create-pact`);
  }, [id]);

  // Handle view pacts (check-in screen)
  const handleViewPacts = useCallback(() => {
    haptics.light();
    router.push(`/group/${id}/pacts`);
  }, [id]);

  // Handle pact press - navigate to pact detail
  const handlePactPress = useCallback((pactId: string) => {
    haptics.light();
    router.push(`/group/${id}/pact/${pactId}`);
  }, [id]);

  // Handle check-in press - navigate to roast thread for folds, pact detail for success
  const handleCheckInPress = useCallback(async (item: CheckInFeedItem) => {
    haptics.light();
    if (item.check_in.status === 'fold') {
      // Try to find the roast thread
      const thread = await fetchThreadByCheckIn(item.check_in.id);
      if (thread) {
        router.push(`/group/${id}/roast/${thread.id}`);
        return;
      }
    }
    // Default: go to pact detail
    router.push(`/group/${id}/pact/${item.pact.id}`);
  }, [id, fetchThreadByCheckIn]);

  // Handle recap press - navigate to recap screen
  const handleRecapPress = useCallback((recapId: string) => {
    haptics.light();
    router.push(`/group/${id}/recap/${recapId}`);
  }, [id]);

  // Render feed item
  const renderItem = useCallback(({ item }: { item: FeedItem }) => {
    const onPress = item.type === 'pact_created'
      ? () => handlePactPress(item.pact.id)
      : item.type === 'check_in'
      ? () => handleCheckInPress(item)
      : item.type === 'recap'
      ? () => handleRecapPress(item.recap_id)
      : undefined;

    return <FeedItemComponent item={item} onPress={onPress} />;
  }, [handlePactPress, handleCheckInPress, handleRecapPress]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <View className="flex-1 items-center justify-center py-xl">
        <View className="w-20 h-20 bg-surface rounded-full items-center justify-center border border-border mb-m">
          <Text className="text-h1 text-text-muted">*</Text>
        </View>
        <Text className="text-body text-text-secondary text-center mb-s">
          No activity yet
        </Text>
        <Text className="text-body-sm text-text-muted text-center px-l mb-l">
          Create a pact and start checking in with your group!
        </Text>
        <Pressable
          onPress={handleCreatePact}
          className="px-l py-3 bg-primary rounded-sm"
          accessibilityLabel="Create your first pact"
          accessibilityRole="button"
        >
          <Text className="text-body text-white font-semibold">
            Create Pact
          </Text>
        </Pressable>
      </View>
    );
  }, [isLoading, handleCreatePact]);

  // Render footer
  const renderFooter = useCallback(() => {
    if (!hasMore || feedItems.length === 0) return null;

    return (
      <View className="py-m items-center">
        <ActivityIndicator color="rgb(255, 77, 0)" />
      </View>
    );
  }, [hasMore, feedItems.length]);

  // Handle end reached
  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoading && !isRefreshing) {
      loadMore();
    }
  }, [hasMore, isLoading, isRefreshing, loadMore]);

  if (isLoading && feedItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-m py-s border-b border-border">
        <Text className="text-h2 text-text-primary font-bold">
          {currentGroup?.name || 'Group'}
        </Text>
        <View className="flex-row gap-s">
          <Pressable
            onPress={handleViewPacts}
            className="px-m py-s bg-primary rounded-full items-center justify-center"
            accessibilityLabel="Check in"
            accessibilityRole="button"
          >
            <Text className="text-white text-body-sm font-semibold">{'\u2705'} Check In</Text>
          </Pressable>
          <Pressable
            onPress={handleInvite}
            className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-border"
            accessibilityLabel="Invite members"
            accessibilityRole="button"
          >
            <Text className="text-text-primary text-body">+</Text>
          </Pressable>
          <Pressable
            onPress={handleSettings}
            className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-border"
            accessibilityLabel="Group settings"
            accessibilityRole="button"
          >
            <Text className="text-text-muted text-body-sm">*</Text>
          </Pressable>
        </View>
      </View>

      {/* Error state */}
      {error && (
        <View className="px-m py-s bg-danger/10">
          <Text className="text-danger text-body-sm text-center">{error}</Text>
        </View>
      )}

      {/* Feed */}
      <FlatList
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              haptics.pullToRefresh();
              refresh();
            }}
            tintColor="rgb(255, 77, 0)"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - Create Pact */}
      {feedItems.length > 0 && (
        <Pressable
          onPress={handleCreatePact}
          className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
          accessibilityLabel="Create pact"
          accessibilityRole="button"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Text className="text-white text-2xl font-bold">+</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}
