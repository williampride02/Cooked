import React, { useCallback } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { ReactionBar } from './ReactionBar';
import { haptics } from '@/utils/haptics';
import type {
  FeedItem as FeedItemType,
  CheckInFeedItem,
  MemberJoinedFeedItem,
  PactCreatedFeedItem,
  RecapFeedItem,
} from '@/types';

interface FeedItemProps {
  item: FeedItemType;
  onPress?: () => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function CheckInItem({ item }: { item: CheckInFeedItem }) {
  const isSuccess = item.check_in.status === 'success';

  return (
    <View className="bg-surface border border-border rounded-md p-m mb-s">
      {/* Header */}
      <View className="flex-row items-center mb-s">
        {/* Avatar */}
        <View className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center overflow-hidden border border-border">
          {item.user.avatar_url ? (
            <Image
              source={{ uri: item.user.avatar_url }}
              className="w-full h-full"
              accessibilityLabel={`${item.user.display_name}'s avatar`}
            />
          ) : (
            <Text className="text-text-muted text-body">
              {item.user.display_name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* User and Action */}
        <View className="flex-1 ml-s">
          <Text className="text-body text-text-primary font-semibold">
            {item.user.display_name}
          </Text>
          <Text className="text-body-sm text-text-muted">
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>

        {/* Status Icon */}
        <View
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isSuccess ? 'bg-success/20' : 'bg-danger/20'
          }`}
        >
          <Text className="text-body">{isSuccess ? '\u2705' : '\u274C'}</Text>
        </View>
      </View>

      {/* Content */}
      <View className="ml-12">
        <Text className="text-body text-text-primary">
          {isSuccess ? 'Crushed' : 'Folded on'}{' '}
          <Text className="font-semibold">{item.pact.name}</Text>
        </Text>

        {/* Excuse for folds */}
        {!isSuccess && item.check_in.excuse && (
          <View className="mt-s bg-surface-elevated rounded-sm p-s">
            <Text className="text-body-sm text-text-secondary italic">
              "{item.check_in.excuse}"
            </Text>
          </View>
        )}

        {/* Roast thread indicator for folds */}
        {!isSuccess && (
          <View className="mt-s">
            <Text className="text-primary text-body-sm font-semibold">
              {'\u{1F525}'} Tap to view roast thread
            </Text>
          </View>
        )}

        {/* Proof image */}
        {item.check_in.proof_url && (
          <View className="mt-s rounded-md overflow-hidden">
            <Image
              source={{ uri: item.check_in.proof_url }}
              className="w-full h-40"
              resizeMode="cover"
              accessibilityLabel="Proof photo"
            />
          </View>
        )}

        {/* Reactions */}
        <ReactionBar targetType="check_in" targetId={item.check_in.id} />
      </View>
    </View>
  );
}

function MemberJoinedItem({ item }: { item: MemberJoinedFeedItem }) {
  return (
    <View className="bg-surface border border-border rounded-md p-m mb-s">
      {/* Header */}
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center overflow-hidden border border-border">
          {item.user.avatar_url ? (
            <Image
              source={{ uri: item.user.avatar_url }}
              className="w-full h-full"
              accessibilityLabel={`${item.user.display_name}'s avatar`}
            />
          ) : (
            <Text className="text-text-muted text-body">
              {item.user.display_name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 ml-s">
          <Text className="text-body text-text-primary">
            <Text className="font-semibold">{item.user.display_name}</Text>
            {' joined the group'}
          </Text>
          <Text className="text-body-sm text-text-muted">
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>

        {/* Icon */}
        <View className="w-10 h-10 rounded-full items-center justify-center bg-primary/20">
          <Text className="text-body">{'\u{1F44B}'}</Text>
        </View>
      </View>
    </View>
  );
}

function PactCreatedItem({ item }: { item: PactCreatedFeedItem }) {
  const roastLevelEmoji =
    item.pact.roast_level === 1
      ? '\u{1F336}'
      : item.pact.roast_level === 2
      ? '\u{1F336}\u{1F336}'
      : '\u{1F336}\u{1F336}\u{1F336}';

  return (
    <View className="bg-surface border border-border rounded-md p-m mb-s">
      {/* Header */}
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center overflow-hidden border border-border">
          {item.user.avatar_url ? (
            <Image
              source={{ uri: item.user.avatar_url }}
              className="w-full h-full"
              accessibilityLabel={`${item.user.display_name}'s avatar`}
            />
          ) : (
            <Text className="text-text-muted text-body">
              {item.user.display_name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 ml-s">
          <Text className="text-body text-text-primary">
            <Text className="font-semibold">{item.user.display_name}</Text>
            {' created '}
            <Text className="font-semibold">{item.pact.name}</Text>
          </Text>
          <Text className="text-body-sm text-text-muted">
            {item.pact.frequency} {roastLevelEmoji} {'\u00B7'}{' '}
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>

        {/* Icon */}
        <View className="w-10 h-10 rounded-full items-center justify-center bg-secondary/20">
          <Text className="text-body">{'\u{1F4CB}'}</Text>
        </View>
      </View>
    </View>
  );
}

function formatRecapDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}

function RecapItem({ item }: { item: RecapFeedItem }) {
  return (
    <View className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-md p-m mb-s">
      {/* Header */}
      <View className="flex-row items-center">
        {/* Icon */}
        <View className="w-12 h-12 rounded-full items-center justify-center bg-primary/30">
          <Text className="text-h2">{'\u{1F9FE}'}</Text>
        </View>

        {/* Content */}
        <View className="flex-1 ml-s">
          <Text className="text-body text-text-primary font-bold">
            Weekly Recap Ready!
          </Text>
          <Text className="text-body-sm text-text-muted">
            {formatRecapDateRange(item.week_start, item.week_end)}
          </Text>
        </View>

        {/* Arrow */}
        <View className="w-8 h-8 items-center justify-center">
          <Text className="text-primary text-body">{'\u2192'}</Text>
        </View>
      </View>

      {/* Call to action */}
      <View className="mt-s pt-s border-t border-primary/20">
        <Text className="text-primary text-body-sm font-semibold text-center">
          Tap to see awards, stats, and highlights
        </Text>
      </View>
    </View>
  );
}

export function FeedItemComponent({ item, onPress }: FeedItemProps) {
  const handlePress = useCallback(() => {
    haptics.light();
    onPress?.();
  }, [onPress]);

  if (item.type === 'check_in') {
    return (
      <Pressable onPress={handlePress} accessibilityRole="button">
        <CheckInItem item={item} />
      </Pressable>
    );
  }

  if (item.type === 'member_joined') {
    return <MemberJoinedItem item={item} />;
  }

  if (item.type === 'pact_created') {
    return (
      <Pressable onPress={handlePress} accessibilityRole="button">
        <PactCreatedItem item={item} />
      </Pressable>
    );
  }

  if (item.type === 'recap') {
    return (
      <Pressable onPress={handlePress} accessibilityRole="button">
        <RecapItem item={item} />
      </Pressable>
    );
  }

  // All types are handled above, this is a type-safe fallback
  const _exhaustiveCheck: never = item;
  return null;
}
