import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { usePolls } from '@/hooks/usePolls';
import { haptics } from '@/utils/haptics';

interface PollCreatorProps {
  threadId: string;
  visible: boolean;
  onClose: () => void;
  onPollCreated: () => void;
}

const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;

export function PollCreator({
  threadId,
  visible,
  onClose,
  onPollCreated,
}: PollCreatorProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const { createPoll, isLoading, error } = usePolls();

  // Reset form when modal closes
  const handleClose = useCallback(() => {
    setQuestion('');
    setOptions(['', '']);
    onClose();
  }, [onClose]);

  // Add option
  const handleAddOption = useCallback(() => {
    if (options.length >= MAX_OPTIONS) return;
    haptics.light();
    setOptions([...options, '']);
  }, [options]);

  // Remove option
  const handleRemoveOption = useCallback((index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    haptics.light();
    setOptions(options.filter((_, i) => i !== index));
  }, [options]);

  // Update option text
  const handleOptionChange = useCallback((index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  }, [options]);

  // Submit poll
  const handleSubmit = useCallback(async () => {
    // Validate
    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);

    if (trimmedQuestion.length < 5) {
      haptics.error();
      return;
    }

    if (trimmedOptions.length < MIN_OPTIONS) {
      haptics.error();
      return;
    }

    haptics.medium();

    const result = await createPoll({
      threadId,
      question: trimmedQuestion,
      options: trimmedOptions,
    });

    if (result) {
      handleClose();
      onPollCreated();
    } else {
      haptics.error();
    }
  }, [question, options, threadId, createPoll, handleClose, onPollCreated]);

  // Check if form is valid
  const isValid =
    question.trim().length >= 5 &&
    options.filter((o) => o.trim().length > 0).length >= MIN_OPTIONS;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-m py-s border-b border-border">
          <Pressable
            onPress={handleClose}
            className="px-s py-xs"
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Text className="text-body text-text-muted">Cancel</Text>
          </Pressable>

          <Text className="text-body text-text-primary font-semibold">
            Create Poll
          </Text>

          <Pressable
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
            className={`px-m py-xs rounded-full ${
              isValid && !isLoading ? 'bg-primary' : 'bg-surface-elevated'
            }`}
            accessibilityLabel="Create poll"
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text
                className={`text-body-sm font-semibold ${
                  isValid ? 'text-white' : 'text-text-muted'
                }`}
              >
                Create
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question Input */}
          <View className="mb-l">
            <Text className="text-body-sm text-text-muted mb-xs font-medium">
              QUESTION
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-md px-m py-s text-body text-text-primary"
              placeholder="Ask a question..."
              placeholderTextColor="#666666"
              value={question}
              onChangeText={setQuestion}
              maxLength={200}
              multiline
              numberOfLines={2}
              style={{ minHeight: 60 }}
            />
            <Text className="text-caption text-text-muted text-right mt-xs">
              {question.length}/200
            </Text>
          </View>

          {/* Options */}
          <View className="mb-l">
            <Text className="text-body-sm text-text-muted mb-xs font-medium">
              OPTIONS
            </Text>

            {options.map((option, index) => (
              <View
                key={index}
                className="flex-row items-center mb-s"
              >
                <View className="flex-1 flex-row items-center bg-surface border border-border rounded-md">
                  <Text className="text-body-sm text-text-muted px-m">
                    {index + 1}.
                  </Text>
                  <TextInput
                    className="flex-1 py-s pr-m text-body text-text-primary"
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor="#666666"
                    value={option}
                    onChangeText={(text) => handleOptionChange(index, text)}
                    maxLength={100}
                  />
                </View>

                {options.length > MIN_OPTIONS && (
                  <Pressable
                    onPress={() => handleRemoveOption(index)}
                    className="w-10 h-10 items-center justify-center ml-xs"
                    accessibilityLabel={`Remove option ${index + 1}`}
                    accessibilityRole="button"
                  >
                    <Text className="text-danger text-body">{'\u2715'}</Text>
                  </Pressable>
                )}
              </View>
            ))}

            {options.length < MAX_OPTIONS && (
              <Pressable
                onPress={handleAddOption}
                className="flex-row items-center justify-center py-s border border-dashed border-border rounded-md"
                accessibilityLabel="Add option"
                accessibilityRole="button"
              >
                <Text className="text-primary text-body mr-xs">+</Text>
                <Text className="text-primary text-body-sm">Add Option</Text>
              </Pressable>
            )}
          </View>

          {/* Error Display */}
          {error && (
            <View className="bg-danger/10 border border-danger/30 rounded-md p-m mb-l">
              <Text className="text-danger text-body-sm">{error}</Text>
            </View>
          )}

          {/* Info */}
          <View className="bg-surface rounded-md p-m">
            <Text className="text-body-sm text-text-muted">
              {'\u{1F4CA}'} Polls are only available in Nuclear roast level threads.
              Everyone in the group can vote on your poll.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
