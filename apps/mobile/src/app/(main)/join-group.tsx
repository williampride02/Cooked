import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroups } from '@/hooks/useGroups';
import { useGroupLimit } from '@/hooks/useSubscription';
import { usePendingInviteCode } from '@/providers';
import { haptics } from '@/utils/haptics';

const CODE_LENGTH = 6;

export default function JoinGroupScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { joinGroup, isLoading, error } = useGroups();
  const { currentCount, maxCount, canJoin, isLoading: isLoadingLimit } = useGroupLimit();

  // Get invite code from deep link or URL params
  const { code: urlCode } = useLocalSearchParams<{ code?: string }>();
  const { inviteCode: deepLinkCode, clearInviteCode } = usePendingInviteCode();

  // Pre-fill invite code from deep link or URL params
  useEffect(() => {
    if (deepLinkCode) {
      setInviteCode(deepLinkCode);
      clearInviteCode();
    } else if (urlCode) {
      setInviteCode(urlCode);
    }
  }, [deepLinkCode, urlCode, clearInviteCode]);

  // Validation
  const trimmedCode = inviteCode.trim().toLowerCase();
  const isCodeValid = trimmedCode.length === CODE_LENGTH && canJoin;

  // Handle back navigation
  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  // Handle join group
  const handleJoin = useCallback(async () => {
    if (!isCodeValid || isLoading) return;

    Keyboard.dismiss();
    haptics.medium();

    const group = await joinGroup(trimmedCode);

    if (group) {
      haptics.success();
      // Navigate to main for now. Later this will go to group feed
      router.replace('/(main)');
    } else {
      haptics.error();
    }
  }, [isCodeValid, isLoading, trimmedCode, joinGroup]);

  // Handle text change - allow only alphanumeric
  const handleChangeText = useCallback((text: string) => {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').slice(0, CODE_LENGTH);
    setInviteCode(cleaned);
  }, []);

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
          Join a Group
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 px-m pt-l">
        {/* Invite Code Input */}
        <Text className="text-body-sm text-text-secondary mb-xs">
          Invite Code
        </Text>
        <View
          className={`flex-row items-center bg-surface border rounded-sm px-m py-3 ${
            isFocused ? 'border-primary' : 'border-border'
          }`}
        >
          <TextInput
            className="flex-1 text-body text-text-primary font-mono tracking-widest text-center"
            placeholder="XXXXXX"
            placeholderTextColor="#666666"
            value={inviteCode.toUpperCase()}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={CODE_LENGTH}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isLoading}
            accessibilityLabel="Invite code"
            accessibilityHint={`Enter ${CODE_LENGTH} character invite code`}
          />
        </View>

        {/* Group Limit Warning */}
        {!canJoin && !isLoadingLimit && (
          <View className="mt-m p-m bg-warning/10 border border-warning/30 rounded-sm">
            <Text className="text-warning text-body-sm text-center">
              {'\u26A0'} You've reached the free tier limit of {maxCount} group{maxCount !== 1 ? 's' : ''}.
              Upgrade to Premium for unlimited groups.
            </Text>
            <Pressable
              onPress={() => router.push('/(main)/profile')}
              className="mt-s py-xs"
              accessibilityLabel="Upgrade to premium"
              accessibilityRole="button"
            >
              <Text className="text-primary text-body-sm font-semibold text-center">
                Learn More
              </Text>
            </Pressable>
          </View>
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
          Enter the 6-character invite code shared by your friend.
        </Text>

        {/* Join Button */}
        <Pressable
          onPress={handleJoin}
          disabled={!isCodeValid || isLoading}
          className={`mt-xl py-4 rounded-sm items-center ${
            isCodeValid && !isLoading ? 'bg-primary' : 'bg-surface'
          }`}
          accessibilityLabel="Join group"
          accessibilityRole="button"
          accessibilityState={{ disabled: !isCodeValid || isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className={`text-body font-semibold ${
                isCodeValid ? 'text-white' : 'text-text-muted'
              }`}
            >
              Join Group
            </Text>
          )}
        </Pressable>

        {/* Or Divider */}
        <View className="flex-row items-center mt-xl">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-body-sm text-text-muted mx-m">or</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        {/* Paste Link Helper */}
        <Text className="text-body-sm text-text-secondary text-center mt-l">
          Click an invite link from your friend to join automatically.
        </Text>
      </View>
    </SafeAreaView>
  );
}
