import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroups } from '@/hooks/useGroups';
import { haptics } from '@/utils/haptics';

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 30;

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { createGroup, isLoading, error } = useGroups();

  // Validation
  const trimmedName = groupName.trim();
  const isNameValid =
    trimmedName.length >= MIN_NAME_LENGTH && trimmedName.length <= MAX_NAME_LENGTH;
  const showNameError =
    trimmedName.length > 0 && trimmedName.length < MIN_NAME_LENGTH;

  // Handle back navigation
  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  // Handle create group
  const handleCreate = useCallback(async () => {
    if (!isNameValid || isLoading) return;

    Keyboard.dismiss();
    haptics.medium();

    const group = await createGroup(trimmedName);

    if (group) {
      haptics.success();
      // Navigate to the invite screen for this group
      router.replace(`/group/${group.id}/invite`);
    } else {
      haptics.error();
    }
  }, [isNameValid, isLoading, trimmedName, createGroup]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-m py-s">
        <Pressable
          onPress={handleBack}
          className="w-11 h-11 items-center justify-center -ml-s"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text className="text-text-primary text-h2">←</Text>
        </Pressable>
        <Text className="text-h2 text-text-primary font-semibold ml-s">
          Create a Group
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 px-m pt-l">
        {/* Group Name Input */}
        <Text className="text-body-sm text-text-secondary mb-xs">
          Group Name
        </Text>
        <View
          className={`flex-row items-center bg-surface border rounded-sm px-m py-3 ${
            showNameError
              ? 'border-danger'
              : isFocused
              ? 'border-primary'
              : 'border-border'
          }`}
        >
          <TextInput
            className="flex-1 text-body text-text-primary"
            placeholder="e.g., Morning Gym Squad"
            placeholderTextColor="#666666"
            value={groupName}
            onChangeText={setGroupName}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={MAX_NAME_LENGTH}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isLoading}
            accessibilityLabel="Group name"
            accessibilityHint={`Enter 2 to 30 characters. Currently ${trimmedName.length} characters.`}
          />
          <Text
            className={`text-body-sm ml-s ${
              trimmedName.length >= MIN_NAME_LENGTH
                ? 'text-text-secondary'
                : 'text-text-muted'
            }`}
          >
            {trimmedName.length}/{MAX_NAME_LENGTH}
          </Text>
        </View>

        {/* Name validation error */}
        {showNameError && (
          <Text
            className="text-danger text-body-sm mt-xs"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            Group name must be at least {MIN_NAME_LENGTH} characters
          </Text>
        )}

        {/* API Error */}
        {error && (
          <Text
            className="text-danger text-body-sm mt-m text-center"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {error}
          </Text>
        )}

        {/* Helper Text */}
        <Text className="text-body-sm text-text-muted mt-m">
          You'll be the admin of this group. Invite at least 2 friends to start
          cooking!
        </Text>

        {/* Create Button */}
        <Pressable
          onPress={handleCreate}
          disabled={!isNameValid || isLoading}
          className={`mt-xl py-4 rounded-sm items-center ${
            isNameValid && !isLoading ? 'bg-primary' : 'bg-surface'
          }`}
          accessibilityLabel="Create group"
          accessibilityRole="button"
          accessibilityState={{ disabled: !isNameValid || isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className={`text-body font-semibold ${
                isNameValid ? 'text-white' : 'text-text-muted'
              }`}
            >
              Create Group
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
