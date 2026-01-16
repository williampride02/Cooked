import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { usePoll, usePolls } from '@/hooks/usePolls';
import { useAppStore } from '@/stores/app';
import { haptics } from '@/utils/haptics';
import type { PollOption } from '@/types';

interface PollDisplayProps {
  pollId: string;
  isOwn?: boolean;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export function PollDisplay({ pollId, isOwn = false }: PollDisplayProps) {
  const { poll, isLoading, error } = usePoll(pollId);
  const { vote, closePoll, isLoading: isVoting } = usePolls();
  const user = useAppStore((state) => state.user);

  // Calculate vote percentages
  const votesByOption = useMemo(() => {
    if (!poll) return {};
    return poll.votes.reduce((acc, v) => {
      acc[v.option_id] = (acc[v.option_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [poll]);

  const hasVoted = poll?.user_vote !== null;
  const isPollClosed = poll?.status === 'closed';
  const showResults = hasVoted || isPollClosed;
  const isCreator = poll?.created_by === user?.id;

  // Handle vote
  const handleVote = useCallback(
    async (optionId: string) => {
      if (!poll || isPollClosed || isVoting) return;

      haptics.medium();
      await vote(poll.id, optionId);
    },
    [poll, isPollClosed, isVoting, vote]
  );

  // Handle close poll
  const handleClosePoll = useCallback(async () => {
    if (!poll || isPollClosed) return;

    haptics.medium();
    await closePoll(poll.id);
  }, [poll, isPollClosed, closePoll]);

  if (isLoading || !poll) {
    return (
      <View className="bg-surface rounded-md p-m border border-border">
        <ActivityIndicator size="small" color="rgb(255, 77, 0)" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-surface rounded-md p-m border border-border">
        <Text className="text-danger text-body-sm">{error}</Text>
      </View>
    );
  }

  return (
    <View className={`rounded-md border ${isOwn ? 'bg-primary/10 border-primary/30' : 'bg-surface border-border'}`}>
      {/* Poll Header */}
      <View className="p-s border-b border-border/50">
        <View className="flex-row items-center">
          <View className="w-6 h-6 rounded-full bg-surface-elevated items-center justify-center border border-border overflow-hidden">
            {poll.creator.avatar_url ? (
              <Image source={{ uri: poll.creator.avatar_url }} className="w-full h-full" />
            ) : (
              <Text className="text-caption text-text-muted">
                {poll.creator.display_name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text className="text-caption text-text-muted ml-xs">
            {poll.creator.display_name} {'\u2022'} {formatTimeAgo(poll.created_at)}
          </Text>
          {isPollClosed && (
            <View className="ml-auto bg-surface-elevated px-xs py-xs rounded">
              <Text className="text-caption text-text-muted">Closed</Text>
            </View>
          )}
        </View>
      </View>

      {/* Question */}
      <View className="p-s">
        <Text className={`text-body font-medium ${isOwn ? 'text-primary' : 'text-text-primary'}`}>
          {'\u{1F4CA}'} {poll.question}
        </Text>
      </View>

      {/* Options */}
      <View className="px-s pb-s">
        {poll.options.map((option) => (
          <PollOptionItem
            key={option.id}
            option={option}
            voteCount={votesByOption[option.id] || 0}
            totalVotes={poll.total_votes}
            isSelected={poll.user_vote?.option_id === option.id}
            showResults={showResults}
            onVote={() => handleVote(option.id)}
            disabled={isPollClosed || isVoting}
            isOwn={isOwn}
          />
        ))}
      </View>

      {/* Footer */}
      <View className="px-s pb-s flex-row items-center justify-between">
        <Text className="text-caption text-text-muted">
          {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}
        </Text>

        {isCreator && !isPollClosed && (
          <Pressable
            onPress={handleClosePoll}
            className="px-s py-xs bg-surface-elevated rounded"
            accessibilityLabel="Close poll"
            accessibilityRole="button"
          >
            <Text className="text-caption text-text-muted">Close Poll</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface PollOptionItemProps {
  option: PollOption;
  voteCount: number;
  totalVotes: number;
  isSelected: boolean;
  showResults: boolean;
  onVote: () => void;
  disabled: boolean;
  isOwn: boolean;
}

function PollOptionItem({
  option,
  voteCount,
  totalVotes,
  isSelected,
  showResults,
  onVote,
  disabled,
  isOwn,
}: PollOptionItemProps) {
  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  if (showResults) {
    // Results view
    return (
      <View className="mb-xs">
        <View
          className={`rounded-sm overflow-hidden ${
            isSelected ? 'border-2 border-primary' : 'border border-border'
          }`}
        >
          {/* Background progress bar */}
          <View className="absolute inset-0 bg-surface-elevated">
            <View
              className={`h-full ${isSelected ? 'bg-primary/30' : 'bg-surface'}`}
              style={{ width: `${percentage}%` }}
            />
          </View>

          {/* Content */}
          <View className="flex-row items-center justify-between px-s py-s relative">
            <View className="flex-row items-center flex-1">
              {isSelected && (
                <Text className="text-primary mr-xs">{'\u2713'}</Text>
              )}
              <Text
                className={`text-body-sm ${
                  isSelected ? 'text-primary font-medium' : 'text-text-primary'
                }`}
                numberOfLines={2}
              >
                {option.option_text}
              </Text>
            </View>
            <Text
              className={`text-body-sm ml-s ${
                isSelected ? 'text-primary font-semibold' : 'text-text-muted'
              }`}
            >
              {percentage}%
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Voting view
  return (
    <Pressable
      onPress={onVote}
      disabled={disabled}
      className={`mb-xs rounded-sm border ${
        disabled
          ? 'border-border bg-surface opacity-60'
          : 'border-border bg-surface active:bg-surface-elevated'
      }`}
      accessibilityLabel={`Vote for ${option.option_text}`}
      accessibilityRole="button"
    >
      <View className="flex-row items-center px-s py-s">
        <View className={`w-5 h-5 rounded-full border-2 mr-s ${
          isOwn ? 'border-primary/50' : 'border-border'
        }`} />
        <Text className="text-body-sm text-text-primary flex-1" numberOfLines={2}>
          {option.option_text}
        </Text>
      </View>
    </Pressable>
  );
}
