import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, Alert, Keyboard, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarPicker } from '@/components/auth';
import { uploadAvatar, updateUserProfile } from '@/utils/image';
import { useAppStore } from '@/stores/app';
import { supabase } from '@/lib/supabase';
import { haptics } from '@/utils/haptics';

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 20;

export default function ProfileSetupScreen() {
  const [displayName, setDisplayName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  // Validation
  const trimmedName = displayName.trim();
  const isNameValid = trimmedName.length >= MIN_NAME_LENGTH && trimmedName.length <= MAX_NAME_LENGTH;
  const showNameError = trimmedName.length > 0 && trimmedName.length < MIN_NAME_LENGTH;

  // Handle back navigation - sign out and return to phone entry
  const handleBack = useCallback(async () => {
    haptics.light();
    Alert.alert(
      'Go Back?',
      'You will need to verify your phone number again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go Back',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/phone');
          },
        },
      ]
    );
  }, []);

  // Handle avatar selection
  const handleAvatarSelected = useCallback((uri: string) => {
    setAvatarUri(uri);
    setError(null);
  }, []);

  // Handle profile save
  const handleSubmit = useCallback(async () => {
    if (!isNameValid || isLoading || !user) return;

    Keyboard.dismiss();
    setIsLoading(true);
    setError(null);

    try {
      let avatarUrl: string | null = null;

      // Upload avatar if selected
      if (avatarUri) {
        const uploadResult = await uploadAvatar(user.id, avatarUri);
        if (uploadResult.error) {
          setError(uploadResult.error);
          setIsLoading(false);
          haptics.error();
          return;
        }
        avatarUrl = uploadResult.url;
      }

      // Update user profile
      const updateResult = await updateUserProfile(user.id, trimmedName, avatarUrl);
      if (!updateResult.success) {
        setError(updateResult.error);
        setIsLoading(false);
        haptics.error();
        return;
      }

      // Update local user state
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }

      haptics.success();
      router.replace('/(main)');
    } catch (err) {
      console.error('Profile setup error:', err);
      setError('Something went wrong. Please try again.');
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  }, [isNameValid, isLoading, user, avatarUri, trimmedName, setUser]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header with Back Button */}
      <View className="flex-row items-center px-m py-s">
        <Pressable
          onPress={handleBack}
          className="w-11 h-11 items-center justify-center -ml-s"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text className="text-text-primary text-h2">←</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View className="flex-1 px-m">
        {/* Avatar Picker */}
        <View className="items-center mt-l mb-xl">
          <AvatarPicker
            imageUri={avatarUri}
            onImageSelected={handleAvatarSelected}
            disabled={isLoading}
          />
        </View>

        {/* Heading */}
        <Text className="text-h1 text-text-primary font-bold mb-m">
          What should we call you?
        </Text>

        {/* Display Name Input */}
        <View className="mb-s">
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
              placeholder="Display name"
              placeholderTextColor="#666666"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                setError(null);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={MAX_NAME_LENGTH}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
              accessibilityLabel="Display name"
              accessibilityHint={`Enter 2 to 20 characters. Currently ${trimmedName.length} characters.`}
            />
            <Text
              className={`text-body-sm ml-s ${
                trimmedName.length > MAX_NAME_LENGTH
                  ? 'text-danger'
                  : trimmedName.length >= MIN_NAME_LENGTH
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
              Name must be at least {MIN_NAME_LENGTH} characters
            </Text>
          )}
        </View>

        {/* Helper Text */}
        <Text className="text-body-sm text-text-muted mb-xl">
          This is how friends will see you in roast threads.
        </Text>

        {/* Error Message */}
        {error && (
          <Text
            className="text-danger text-body-sm text-center mb-m"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {error}
          </Text>
        )}

        {/* Let's Go Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!isNameValid || isLoading}
          className={`py-4 rounded-sm items-center ${
            isNameValid && !isLoading ? 'bg-primary' : 'bg-surface'
          }`}
          accessibilityLabel="Continue to app"
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
              Let's Go
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
