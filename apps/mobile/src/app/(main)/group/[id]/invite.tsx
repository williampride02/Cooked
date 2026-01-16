import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/lib/supabase';
import { useShareableLink } from '@/providers';
import { useShare } from '@/hooks/useShare';
import { ShareModal } from '@/components/share';
import { haptics } from '@/utils/haptics';
import type { Group } from '@/types';

export default function GroupInviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [memberCount, setMemberCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const { createGroupInviteLink } = useShareableLink();
  const {
    isShareModalVisible,
    shareCardData,
    shareUrl,
    shareInvite,
    closeShareModal,
  } = useShare();

  // Fetch group data and member count
  useEffect(() => {
    async function fetchGroup() {
      if (!id) return;

      // Fetch group details
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Fetch group error:', error);
        Alert.alert('Error', 'Failed to load group');
        router.back();
        return;
      }

      setGroup(data as Group);

      // Fetch member count
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', id);

      setMemberCount(count || 1);
      setIsLoading(false);
    }

    fetchGroup();
  }, [id]);

  // Generate invite URL using deep link helper
  const inviteUrl = group?.invite_code
    ? createGroupInviteLink(group.invite_code)
    : '';

  // Handle copy link
  const handleCopyLink = useCallback(async () => {
    if (!inviteUrl) return;

    haptics.medium();
    await Clipboard.setStringAsync(inviteUrl);
    haptics.success();
    setCopySuccess(true);

    // Reset copy success after 2 seconds
    setTimeout(() => setCopySuccess(false), 2000);
  }, [inviteUrl]);

  // Handle quick share (text only)
  const handleQuickShare = useCallback(async () => {
    if (!group || !inviteUrl) return;

    haptics.medium();
    try {
      await Share.share({
        message: `Join my group "${group.name}" on Cooked! ${inviteUrl}`,
        url: inviteUrl,
      });
      haptics.success();
    } catch (err) {
      console.error('Share error:', err);
    }
  }, [group, inviteUrl]);

  // Handle share as image card
  const handleShareImage = useCallback(() => {
    if (!group) return;
    haptics.medium();
    shareInvite(group.name, memberCount, group.invite_code);
  }, [group, memberCount, shareInvite]);

  // Handle continue to group
  const handleContinue = useCallback(() => {
    haptics.light();
    // For now, go back to main. Later this will go to group feed
    router.replace('/(main)');
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Content */}
      <View className="flex-1 px-m justify-center">
        {/* Success Icon */}
        <View className="items-center mb-xl">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center">
            <Text className="text-white text-h1">+</Text>
          </View>
        </View>

        {/* Heading */}
        <Text className="text-h1 text-text-primary font-bold text-center mb-xs">
          Group Created!
        </Text>
        <Text className="text-body text-text-secondary text-center mb-xl">
          {group?.name}
        </Text>

        {/* Invite Code Display */}
        <View className="bg-surface border border-border rounded-md p-l mb-l">
          <Text className="text-body-sm text-text-muted text-center mb-s">
            Invite Code
          </Text>
          <Text className="text-h2 text-text-primary font-mono text-center tracking-widest">
            {group?.invite_code.toUpperCase()}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="gap-s">
          {/* Copy Link */}
          <Pressable
            onPress={handleCopyLink}
            className="py-4 bg-surface border border-border rounded-sm items-center"
            accessibilityLabel="Copy invite link"
            accessibilityRole="button"
          >
            <Text className="text-body text-text-primary font-semibold">
              {copySuccess ? 'Link Copied!' : 'Copy Invite Link'}
            </Text>
          </Pressable>

          {/* Share as Image */}
          <Pressable
            onPress={handleShareImage}
            className="py-4 bg-primary rounded-sm items-center"
            accessibilityLabel="Share as image"
            accessibilityRole="button"
          >
            <Text className="text-body text-white font-semibold">
              Share as Card
            </Text>
          </Pressable>

          {/* Quick Share (Text) */}
          <Pressable
            onPress={handleQuickShare}
            className="py-4 bg-surface border border-primary rounded-sm items-center"
            accessibilityLabel="Share invite link"
            accessibilityRole="button"
          >
            <Text className="text-body text-primary font-semibold">
              Share Link
            </Text>
          </Pressable>
        </View>

        {/* Helper Text */}
        <Text className="text-body-sm text-text-muted text-center mt-xl">
          You need at least 3 members to start cooking. Invite your friends now!
        </Text>

        {/* Continue Button */}
        <Pressable
          onPress={handleContinue}
          className="py-3 items-center mt-l"
          accessibilityLabel="Continue to app"
          accessibilityRole="button"
        >
          <Text className="text-body text-text-secondary">
            Continue to App →
          </Text>
        </Pressable>
      </View>

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
