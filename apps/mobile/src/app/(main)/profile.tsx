import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/hooks/useProfile';
import { AvatarPicker } from '@/components/auth';
import { uploadAvatar, updateUserProfile } from '@/utils/image';
import { useAppStore } from '@/stores/app';
import { supabase } from '@/lib/supabase';
import { haptics } from '@/utils/haptics';

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 20;

export default function ProfileScreen() {
  const { profile, isLoading, error, refetch } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatarUri, setEditAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const user = useAppStore((state) => state.user);

  // Format phone number for display (mask middle)
  const formatPhoneDisplay = (phone: string): string => {
    if (!phone) return '';
    // E.164 format: +{country_code}{number}
    // Country codes can be 1-3 digits, mask everything except last 4
    if (phone.length > 6) {
      // Find the + sign and keep first few chars, mask middle, show last 4
      const prefix = phone.slice(0, 3); // e.g., "+1 " or "+44"
      const last4 = phone.slice(-4);
      return `${prefix} ****${last4}`;
    }
    return phone;
  };

  // Format member since date
  const formatMemberSince = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `Member since ${month} ${year}`;
  };

  // Handle back navigation
  const handleBack = useCallback(() => {
    haptics.light();
    if (isEditing) {
      // Cancel editing
      setIsEditing(false);
      setEditName('');
      setEditAvatarUri(null);
      setSaveError(null);
    } else {
      router.back();
    }
  }, [isEditing]);

  // Start editing mode
  const handleStartEdit = useCallback(() => {
    haptics.light();
    setEditName(profile?.display_name || '');
    setEditAvatarUri(null);
    setIsEditing(true);
    setSaveError(null);
  }, [profile?.display_name]);

  // Handle avatar selection in edit mode
  const handleAvatarSelected = useCallback((uri: string) => {
    setEditAvatarUri(uri);
    setSaveError(null);
  }, []);

  // Save profile changes
  const handleSave = useCallback(async () => {
    if (!user || !profile) return;

    const trimmedName = editName.trim();
    if (trimmedName.length < MIN_NAME_LENGTH || trimmedName.length > MAX_NAME_LENGTH) {
      setSaveError(`Name must be ${MIN_NAME_LENGTH}-${MAX_NAME_LENGTH} characters`);
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);
    setSaveError(null);

    try {
      let avatarUrl = profile.avatar_url;

      // Upload new avatar if selected
      if (editAvatarUri) {
        const uploadResult = await uploadAvatar(user.id, editAvatarUri);
        if (uploadResult.error) {
          setSaveError(uploadResult.error);
          setIsSaving(false);
          haptics.error();
          return;
        }
        avatarUrl = uploadResult.url;
      }

      // Update profile
      const updateResult = await updateUserProfile(user.id, trimmedName, avatarUrl);
      if (!updateResult.success) {
        setSaveError(updateResult.error);
        setIsSaving(false);
        haptics.error();
        return;
      }

      // Refresh profile data
      await refetch();
      haptics.success();
      setIsEditing(false);
      setEditAvatarUri(null);
    } catch (err) {
      console.error('Profile save error:', err);
      setSaveError('Something went wrong. Please try again.');
      haptics.error();
    } finally {
      setIsSaving(false);
    }
  }, [user, profile, editName, editAvatarUri, refetch]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    haptics.light();
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/phone');
          },
        },
      ]
    );
  }, []);

  // Handle account deletion
  const handleDeleteAccount = useCallback(async () => {
    haptics.light();
    Alert.alert(
      'Delete Account?',
      'This will permanently delete your account and all your data. You will be removed from all groups and your check-in history will be anonymized. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;

            try {
              // Soft delete - mark account as deleted
              const { error: deleteError } = await supabase
                .from('users')
                .update({
                  display_name: 'Deleted User',
                  avatar_url: null,
                })
                .eq('id', user.id);

              if (deleteError) {
                console.error('Delete account error:', deleteError);
                Alert.alert('Error', 'Failed to delete account. Please try again.');
                haptics.error();
                return;
              }

              // Sign out
              await supabase.auth.signOut();
              haptics.success();
              router.replace('/phone');
            } catch (err) {
              console.error('Delete account exception:', err);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
              haptics.error();
            }
          },
        },
      ]
    );
  }, [user]);

  // Validation
  const trimmedEditName = editName.trim();
  const isNameValid = trimmedEditName.length >= MIN_NAME_LENGTH && trimmedEditName.length <= MAX_NAME_LENGTH;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-m py-s">
          <Pressable
            onPress={handleBack}
            className="w-11 h-11 items-center justify-center -ml-s"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text className="text-text-primary text-h2">←</Text>
          </Pressable>
          <Text className="text-h2 text-text-primary font-semibold ml-s">Profile</Text>
        </View>
        <View className="flex-1 items-center justify-center px-m">
          <Text className="text-danger text-body text-center">{error}</Text>
          <Pressable
            onPress={refetch}
            className="mt-m py-3 px-l bg-primary rounded-sm"
          >
            <Text className="text-white text-body font-semibold">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-m py-s">
        <Pressable
          onPress={handleBack}
          className="w-11 h-11 items-center justify-center -ml-s"
          accessibilityLabel={isEditing ? 'Cancel editing' : 'Go back'}
          accessibilityRole="button"
        >
          <Text className="text-text-primary text-h2">{isEditing ? '×' : '←'}</Text>
        </Pressable>
        <Text className="text-h2 text-text-primary font-semibold ml-s flex-1">
          {isEditing ? 'Edit Profile' : 'Profile'}
        </Text>
        {isEditing && (
          <Pressable
            onPress={handleSave}
            disabled={!isNameValid || isSaving}
            accessibilityLabel="Save changes"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isNameValid || isSaving }}
          >
            <Text
              className={`text-body font-semibold ${
                isNameValid && !isSaving ? 'text-primary' : 'text-text-muted'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-m py-l">
        {/* Avatar */}
        <View className="items-center mb-l">
          {isEditing ? (
            <AvatarPicker
              imageUri={editAvatarUri || profile?.avatar_url || null}
              onImageSelected={handleAvatarSelected}
              disabled={isSaving}
            />
          ) : (
            <View className="w-24 h-24 rounded-full overflow-hidden bg-surface border border-border">
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Text className="text-h1 text-text-muted">
                    {profile?.display_name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Display Name */}
        {isEditing ? (
          <View className="mb-m">
            <View className="flex-row items-center bg-surface border border-border rounded-sm px-m py-3">
              <TextInput
                className="flex-1 text-body text-text-primary text-center"
                value={editName}
                onChangeText={setEditName}
                maxLength={MAX_NAME_LENGTH}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Display name"
                placeholderTextColor="#666666"
                editable={!isSaving}
                accessibilityLabel="Display name"
              />
            </View>
            <Text className="text-body-sm text-text-muted text-center mt-xs">
              {trimmedEditName.length}/{MAX_NAME_LENGTH}
            </Text>
          </View>
        ) : (
          <Text className="text-h1 text-text-primary font-bold text-center mb-xs">
            {profile?.display_name || 'No name set'}
          </Text>
        )}

        {/* Phone (not editable) */}
        {!isEditing && (
          <Text className="text-body text-text-secondary text-center mb-xs">
            {formatPhoneDisplay(profile?.phone || '')}
          </Text>
        )}

        {/* Member Since */}
        {!isEditing && (
          <Text className="text-body-sm text-text-muted text-center mb-xl">
            {formatMemberSince(profile?.created_at || '')}
          </Text>
        )}

        {/* Error Message */}
        {saveError && (
          <Text
            className="text-danger text-body-sm text-center mb-m"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {saveError}
          </Text>
        )}

        {/* Edit Button */}
        {!isEditing && (
          <Pressable
            onPress={handleStartEdit}
            className="py-3 bg-surface border border-border rounded-sm items-center mb-m"
            accessibilityLabel="Edit profile"
            accessibilityRole="button"
          >
            <Text className="text-body text-text-primary font-semibold">
              Edit Profile
            </Text>
          </Pressable>
        )}

        {/* Achievements */}
        {!isEditing && (
          <Pressable
            onPress={() => {
              haptics.light();
              router.push('/(main)/achievements');
            }}
            className="py-3 bg-surface border border-border rounded-sm items-center mb-m flex-row justify-center"
            accessibilityLabel="View achievements"
            accessibilityRole="button"
          >
            <Text className="text-body mr-xs">{'\u{1F3C6}'}</Text>
            <Text className="text-body text-text-primary font-semibold">
              Achievements
            </Text>
          </Pressable>
        )}

        {/* Notification Preferences */}
        {!isEditing && (
          <Pressable
            onPress={() => {
              haptics.light();
              router.push('/notifications');
            }}
            className="py-3 bg-surface border border-border rounded-sm items-center mb-xl flex-row justify-center"
            accessibilityLabel="Notification settings"
            accessibilityRole="button"
          >
            <Text className="text-body mr-xs">{'\u{1F514}'}</Text>
            <Text className="text-body text-text-primary font-semibold">
              Notifications
            </Text>
          </Pressable>
        )}

        {/* Log Out Button */}
        {!isEditing && (
          <Pressable
            onPress={handleLogout}
            className="py-3 items-center mt-xl"
            accessibilityLabel="Log out"
            accessibilityRole="button"
          >
            <Text className="text-text-secondary text-body font-semibold">Log Out</Text>
          </Pressable>
        )}

        {/* Delete Account Button */}
        {!isEditing && (
          <Pressable
            onPress={handleDeleteAccount}
            className="py-3 items-center mt-l"
            accessibilityLabel="Delete account"
            accessibilityRole="button"
          >
            <Text className="text-danger text-body-sm">Delete Account</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
