import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/lib/supabase';
import { useGroups } from '@/hooks/useGroups';
import { useSubscription } from '@/hooks/useSubscription';
import { useAppStore } from '@/stores/app';
import { useShareableLink } from '@/providers';
import { haptics } from '@/utils/haptics';
import type { Group, GroupMember, User } from '@/types';

interface MemberWithUser extends GroupMember {
  user: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
}

export default function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const {
    leaveGroup,
    checkIsOnlyAdmin,
    removeMember,
    makeAdmin,
    removeAdmin,
    isLoading,
    error,
  } = useGroups();
  const user = useAppStore((state) => state.user);
  const setCurrentGroup = useAppStore((state) => state.setCurrentGroup);
  const { subscription, isPremium } = useSubscription(id);
  const { createGroupInviteLink } = useShareableLink();

  // Generate invite URL
  const inviteUrl = group?.invite_code
    ? createGroupInviteLink(group.invite_code)
    : '';

  // Fetch group and members
  useEffect(() => {
    async function fetchGroupData() {
      if (!id) return;

      setIsLoadingData(true);

      // Fetch group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) {
        console.error('Fetch group error:', groupError);
        router.back();
        return;
      }

      setGroup(groupData as Group);

      // Fetch members with user data
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          user_id,
          role,
          settings,
          joined_at,
          users:user_id (id, display_name, avatar_url)
        `)
        .eq('group_id', id);

      if (membersError) {
        console.error('Fetch members error:', membersError);
      } else {
        const typedMembers = (membersData || []).map((m) => ({
          group_id: m.group_id,
          user_id: m.user_id,
          role: m.role as 'admin' | 'member',
          settings: m.settings as Record<string, unknown>,
          joined_at: m.joined_at,
          user: m.users as unknown as Pick<User, 'id' | 'display_name' | 'avatar_url'>,
        }));
        setMembers(typedMembers);
      }

      setIsLoadingData(false);
    }

    fetchGroupData();
  }, [id]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  // Handle copy invite link
  const handleCopyLink = useCallback(async () => {
    if (!inviteUrl) return;

    haptics.medium();
    await Clipboard.setStringAsync(inviteUrl);
    haptics.success();
    setCopySuccess(true);

    setTimeout(() => setCopySuccess(false), 2000);
  }, [inviteUrl]);

  // Handle share invite link
  const handleShareInvite = useCallback(async () => {
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

  // Handle navigate to invite screen
  const handleInviteScreen = useCallback(() => {
    haptics.light();
    router.push(`/group/${id}/invite`);
  }, [id]);

  // Handle leave group
  const handleLeaveGroup = useCallback(async () => {
    if (!id) return;

    haptics.medium();

    // Check if user is only admin
    const isOnlyAdmin = await checkIsOnlyAdmin(id);
    if (isOnlyAdmin) {
      Alert.alert(
        'Cannot Leave',
        'You must transfer admin role to another member first.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Confirm leave
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group?.name}"? Your check-in history will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const success = await leaveGroup(id);
            if (success) {
              haptics.success();
              setCurrentGroup(null);
              router.replace('/(main)');
            } else {
              haptics.error();
            }
          },
        },
      ]
    );
  }, [id, group?.name, checkIsOnlyAdmin, leaveGroup, setCurrentGroup]);

  // Handle remove member
  const handleRemoveMember = useCallback(
    async (member: MemberWithUser) => {
      if (!id) return;

      haptics.medium();
      Alert.alert(
        'Remove Member',
        `Are you sure you want to remove ${member.user.display_name} from the group?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              const success = await removeMember(id, member.user_id);
              if (success) {
                haptics.success();
                setMembers((prev) =>
                  prev.filter((m) => m.user_id !== member.user_id)
                );
              } else {
                haptics.error();
              }
            },
          },
        ]
      );
    },
    [id, removeMember]
  );

  // Handle make admin
  const handleMakeAdmin = useCallback(
    async (member: MemberWithUser) => {
      if (!id) return;

      haptics.medium();
      Alert.alert(
        'Make Admin',
        `Make ${member.user.display_name} an admin of this group?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Make Admin',
            onPress: async () => {
              const success = await makeAdmin(id, member.user_id);
              if (success) {
                haptics.success();
                setMembers((prev) =>
                  prev.map((m) =>
                    m.user_id === member.user_id ? { ...m, role: 'admin' } : m
                  )
                );
              } else {
                haptics.error();
              }
            },
          },
        ]
      );
    },
    [id, makeAdmin]
  );

  // Handle remove admin
  const handleRemoveAdmin = useCallback(
    async (member: MemberWithUser) => {
      if (!id) return;

      haptics.medium();
      Alert.alert(
        'Remove Admin',
        `Remove admin role from ${member.user.display_name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove Admin',
            style: 'destructive',
            onPress: async () => {
              const success = await removeAdmin(id, member.user_id);
              if (success) {
                haptics.success();
                setMembers((prev) =>
                  prev.map((m) =>
                    m.user_id === member.user_id ? { ...m, role: 'member' } : m
                  )
                );
              } else {
                haptics.error();
              }
            },
          },
        ]
      );
    },
    [id, removeAdmin]
  );

  // Get current user's role
  const currentUserMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = currentUserMember?.role === 'admin';
  const adminCount = members.filter((m) => m.role === 'admin').length;

  if (isLoadingData) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

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
          <Text className="text-text-primary text-h2">←</Text>
        </Pressable>
        <Text className="text-h2 text-text-primary font-semibold ml-s">
          Group Settings
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Group Info */}
        <View className="bg-surface border border-border rounded-md p-m mb-m">
          <Text className="text-body-sm text-text-muted mb-xs">Group Name</Text>
          <Text className="text-body text-text-primary font-semibold">
            {group?.name}
          </Text>
        </View>

        {/* Subscription Status */}
        <Pressable
          onPress={() => {
            haptics.light();
            router.push(`/group/${id}/upgrade`);
          }}
          className={`border rounded-md p-m mb-m ${
            isPremium
              ? 'bg-primary/10 border-primary/30'
              : 'bg-surface border-border'
          }`}
          accessibilityLabel={isPremium ? 'Manage subscription' : 'Upgrade to premium'}
          accessibilityRole="button"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className={`w-10 h-10 rounded-full items-center justify-center ${
                isPremium ? 'bg-primary/20' : 'bg-surface-elevated'
              }`}>
                <Text className="text-body">{isPremium ? '\u{1F451}' : '\u{2B50}'}</Text>
              </View>
              <View className="ml-s">
                <Text className={`text-body font-semibold ${
                  isPremium ? 'text-primary' : 'text-text-primary'
                }`}>
                  {isPremium ? 'Premium Active' : 'Free Plan'}
                </Text>
                <Text className="text-body-sm text-text-muted">
                  {isPremium
                    ? 'All features unlocked'
                    : 'Tap to upgrade for unlimited features'}
                </Text>
              </View>
            </View>
            <Text className={`text-body ${isPremium ? 'text-primary' : 'text-text-muted'}`}>
              {'\u2192'}
            </Text>
          </View>
        </Pressable>

        {/* Invite Members Section */}
        <Text className="text-body text-text-primary font-semibold mb-s">
          Invite Members
        </Text>
        <View className="bg-surface border border-border rounded-md p-m mb-m">
          {/* Invite Code Display */}
          <View className="flex-row items-center justify-between mb-m">
            <View>
              <Text className="text-body-sm text-text-muted">Invite Code</Text>
              <Text className="text-body text-text-primary font-mono tracking-widest">
                {group?.invite_code?.toUpperCase() || '------'}
              </Text>
            </View>
            <Pressable
              onPress={handleCopyLink}
              className="px-m py-s bg-surface-elevated border border-border rounded-sm"
              accessibilityLabel="Copy invite link"
              accessibilityRole="button"
            >
              <Text className="text-body-sm text-text-primary">
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </Text>
            </Pressable>
          </View>

          {/* Share Buttons */}
          <View className="flex-row gap-s">
            <Pressable
              onPress={handleShareInvite}
              className="flex-1 py-3 bg-primary rounded-sm items-center"
              accessibilityLabel="Share invite"
              accessibilityRole="button"
            >
              <Text className="text-body-sm text-white font-semibold">
                Share Invite
              </Text>
            </Pressable>
            <Pressable
              onPress={handleInviteScreen}
              className="py-3 px-m bg-surface-elevated border border-border rounded-sm items-center"
              accessibilityLabel="More options"
              accessibilityRole="button"
            >
              <Text className="text-body-sm text-text-primary">More</Text>
            </Pressable>
          </View>
        </View>

        {/* Members Section */}
        <Text className="text-body text-text-primary font-semibold mb-s">
          Members ({members.length})
        </Text>
        <View className="bg-surface border border-border rounded-md mb-m">
          {members.map((member, index) => {
            const isSelf = member.user_id === user?.id;
            const canRemove = isAdmin && !isSelf;
            const canMakeAdmin = isAdmin && !isSelf && member.role !== 'admin';
            const canRemoveAdmin =
              isAdmin && member.role === 'admin' && (isSelf ? adminCount > 1 : true);

            return (
              <View
                key={member.user_id}
                className={`p-m ${
                  index < members.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <View className="flex-row items-center">
                  {/* Avatar */}
                  <View className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center border border-border">
                    <Text className="text-text-muted text-body">
                      {member.user.display_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  {/* Name and Role */}
                  <View className="flex-1 ml-s">
                    <Text className="text-body text-text-primary">
                      {member.user.display_name}
                      {isSelf && (
                        <Text className="text-text-muted"> (you)</Text>
                      )}
                    </Text>
                    {member.role === 'admin' && (
                      <Text className="text-body-sm text-primary">Admin</Text>
                    )}
                  </View>
                </View>

                {/* Admin actions */}
                {isAdmin && !isSelf && (
                  <View className="flex-row gap-s mt-s ml-12">
                    {canMakeAdmin && (
                      <Pressable
                        onPress={() => handleMakeAdmin(member)}
                        className="px-s py-xs bg-surface-elevated rounded-sm"
                        accessibilityLabel={`Make ${member.user.display_name} admin`}
                        accessibilityRole="button"
                      >
                        <Text className="text-body-sm text-primary">
                          Make Admin
                        </Text>
                      </Pressable>
                    )}
                    {canRemoveAdmin && !isSelf && (
                      <Pressable
                        onPress={() => handleRemoveAdmin(member)}
                        className="px-s py-xs bg-surface-elevated rounded-sm"
                        accessibilityLabel={`Remove admin from ${member.user.display_name}`}
                        accessibilityRole="button"
                      >
                        <Text className="text-body-sm text-text-muted">
                          Remove Admin
                        </Text>
                      </Pressable>
                    )}
                    {canRemove && (
                      <Pressable
                        onPress={() => handleRemoveMember(member)}
                        className="px-s py-xs bg-surface-elevated rounded-sm"
                        accessibilityLabel={`Remove ${member.user.display_name}`}
                        accessibilityRole="button"
                      >
                        <Text className="text-body-sm text-danger">Remove</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Error Display */}
        {error && (
          <Text className="text-danger text-body-sm text-center mb-m">
            {error}
          </Text>
        )}

        {/* Leave Group */}
        <Pressable
          onPress={handleLeaveGroup}
          disabled={isLoading}
          className="py-4 bg-surface border border-danger rounded-sm items-center"
          accessibilityLabel="Leave group"
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator color="#FF3B3B" />
          ) : (
            <Text className="text-body text-danger font-semibold">
              Leave Group
            </Text>
          )}
        </Pressable>

        {/* Admin note */}
        {isAdmin && (
          <Text className="text-body-sm text-text-muted text-center mt-s">
            As an admin, you must transfer your role before leaving.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
