import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroups } from '@/hooks/useGroups';
import { useAppStore } from '@/stores/app';
import { haptics } from '@/utils/haptics';

export default function MainScreen() {
  const [isCheckingGroups, setIsCheckingGroups] = useState(true);
  const { fetchUserGroups } = useGroups();
  const setCurrentGroup = useAppStore((state) => state.setCurrentGroup);

  // Check if user has groups on mount
  useEffect(() => {
    async function checkGroups() {
      const groups = await fetchUserGroups();
      if (groups.length > 0) {
        // User has groups, set current group and navigate to it
        setCurrentGroup(groups[0]);
        router.replace(`/group/${groups[0].id}`);
      } else {
        setIsCheckingGroups(false);
      }
    }
    checkGroups();
  }, [fetchUserGroups, setCurrentGroup]);

  const handleCreateGroup = useCallback(() => {
    haptics.light();
    router.push('/create-group');
  }, []);

  const handleJoinGroup = useCallback(() => {
    haptics.light();
    router.push('/join-group');
  }, []);

  const handleProfile = useCallback(() => {
    haptics.light();
    router.push('/profile');
  }, []);

  // Show loading while checking groups
  if (isCheckingGroups) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-m py-s">
        <Text className="text-h2 text-text-primary font-bold">Cooked</Text>
        <Pressable
          onPress={handleProfile}
          className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-border"
          accessibilityLabel="Profile"
          accessibilityRole="button"
        >
          <Text className="text-text-muted text-body-sm">P</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View className="flex-1 px-m justify-center">
        {/* Illustration placeholder */}
        <View className="items-center mb-xl">
          <View className="w-24 h-24 bg-surface rounded-full items-center justify-center border border-border">
            <Text className="text-h1 text-text-muted">*</Text>
          </View>
        </View>

        {/* Create Group Option */}
        <Pressable
          onPress={handleCreateGroup}
          className="bg-surface border border-border rounded-md p-m mb-m flex-row items-center justify-between"
          accessibilityLabel="Create a Group"
          accessibilityRole="button"
        >
          <View className="flex-1">
            <Text className="text-body text-text-primary font-semibold">
              Create a Group
            </Text>
            <Text className="text-body-sm text-text-secondary mt-xs">
              Start fresh
            </Text>
          </View>
          <Text className="text-text-muted text-h2">→</Text>
        </Pressable>

        {/* Join Group Option */}
        <Pressable
          onPress={handleJoinGroup}
          className="bg-surface border border-border rounded-md p-m flex-row items-center justify-between"
          accessibilityLabel="Join with Link"
          accessibilityRole="button"
        >
          <View className="flex-1">
            <Text className="text-body text-text-primary font-semibold">
              Join with Link
            </Text>
            <Text className="text-body-sm text-text-secondary mt-xs">
              Got invited?
            </Text>
          </View>
          <Text className="text-text-muted text-h2">→</Text>
        </Pressable>

        {/* Helper text */}
        <Text className="text-body-sm text-text-muted text-center mt-xl">
          You need at least 3 friends to start cooking.
        </Text>
      </View>
    </SafeAreaView>
  );
}
