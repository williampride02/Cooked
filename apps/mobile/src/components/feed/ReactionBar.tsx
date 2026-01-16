import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import {
  useReactions,
  REACTION_EMOJIS,
  EMOJI_DISPLAY,
} from '@/hooks/useReactions';
import { haptics } from '@/utils/haptics';
import type { ReactionEmoji } from '@/types';

interface ReactionBarProps {
  targetType: 'check_in' | 'roast_response';
  targetId: string;
}

export function ReactionBar({ targetType, targetId }: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const { reactionCounts, userReaction, addReaction, isLoading } = useReactions(
    targetType,
    targetId
  );

  // Handle reaction press
  const handleReactionPress = useCallback(
    async (emoji: ReactionEmoji) => {
      if (isReacting) return;
      // Use soft haptic for subtle reaction feedback
      haptics.soft();
      setIsReacting(true);
      try {
        await addReaction(emoji);
      } finally {
        setIsReacting(false);
        setShowPicker(false);
      }
    },
    [addReaction, isReacting]
  );

  // Handle add button press
  const handleAddPress = useCallback(() => {
    haptics.light();
    setShowPicker(true);
  }, []);

  // Get reactions with counts > 0
  const activeReactions = REACTION_EMOJIS.filter(
    (emoji) => reactionCounts[emoji] > 0
  );

  // Show minimal loading state
  if (isLoading && activeReactions.length === 0) {
    return (
      <View className="flex-row items-center mt-s h-8">
        <ActivityIndicator size="small" color="#666666" />
      </View>
    );
  }

  return (
    <>
      <View className="flex-row items-center flex-wrap gap-xs mt-s">
        {/* Existing reactions */}
        {activeReactions.map((emoji) => (
          <Pressable
            key={emoji}
            onPress={() => handleReactionPress(emoji)}
            className={`flex-row items-center px-s py-xs rounded-full border ${
              userReaction === emoji
                ? 'bg-primary/20 border-primary'
                : 'bg-surface-elevated border-border'
            }`}
            accessibilityLabel={`${emoji} reaction, ${reactionCounts[emoji]} ${
              reactionCounts[emoji] === 1 ? 'person' : 'people'
            }`}
            accessibilityRole="button"
          >
            <Text className="text-body-sm">{EMOJI_DISPLAY[emoji]}</Text>
            <Text
              className={`text-caption ml-xs ${
                userReaction === emoji ? 'text-primary' : 'text-text-muted'
              }`}
            >
              {reactionCounts[emoji]}
            </Text>
          </Pressable>
        ))}

        {/* Add reaction button */}
        <Pressable
          onPress={handleAddPress}
          className="w-8 h-8 rounded-full bg-surface-elevated border border-border items-center justify-center"
          accessibilityLabel="Add reaction"
          accessibilityRole="button"
        >
          <Text className="text-text-muted text-body-sm">+</Text>
        </Pressable>
      </View>

      {/* Reaction picker modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowPicker(false)}
        >
          <View className="bg-surface rounded-md p-m mx-l border border-border">
            <Text className="text-body text-text-primary font-semibold text-center mb-m">
              React
            </Text>
            <View className="flex-row justify-center gap-m">
              {REACTION_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleReactionPress(emoji)}
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    userReaction === emoji
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-surface-elevated'
                  }`}
                  accessibilityLabel={`React with ${emoji}`}
                  accessibilityRole="button"
                >
                  <Text className="text-h2">{EMOJI_DISPLAY[emoji]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
