// DEV ONLY - Remove before production
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '@/stores/app';
import type { User } from '@supabase/supabase-js';

// Demo users with all the data we need (no DB fetch required)
const DEMO_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', display_name: 'Alex', phone: '+15551234567', avatar_url: null, created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222222', display_name: 'Jordan', phone: '+15552345678', avatar_url: null, created_at: new Date().toISOString() },
  { id: '33333333-3333-3333-3333-333333333333', display_name: 'Sam', phone: '+15553456789', avatar_url: null, created_at: new Date().toISOString() },
  { id: '44444444-4444-4444-4444-444444444444', display_name: 'Taylor', phone: '+15554567890', avatar_url: null, created_at: new Date().toISOString() },
  { id: '55555555-5555-5555-5555-555555555555', display_name: 'Casey', phone: '+15555678901', avatar_url: null, created_at: new Date().toISOString() },
];

export function DevLogin() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAppStore((state) => state.setUser);

  // Only show in development
  if (!__DEV__) return null;

  const handleDevLogin = (demoUser: typeof DEMO_USERS[0]) => {
    setIsLoading(true);

    // Create a mock Supabase User object for dev (bypassing auth entirely)
    const mockUser: User = {
      id: demoUser.id,
      app_metadata: {},
      user_metadata: {
        display_name: demoUser.display_name,
        avatar_url: demoUser.avatar_url,
        phone: demoUser.phone,
      },
      aud: 'authenticated',
      created_at: demoUser.created_at,
      phone: demoUser.phone,
    };

    setUser(mockUser);
    setIsVisible(false);
    setIsLoading(false);

    // Navigate to main app
    router.replace('/(main)');
  };

  return (
    <>
      {/* Dev Login Button */}
      <Pressable
        testID="dev-login-button"
        accessibilityLabel="DEV LOGIN"
        onPress={() => setIsVisible(true)}
        className="absolute bottom-8 right-4 bg-yellow-500 px-4 py-2 rounded-full"
      >
        <Text className="text-black font-bold text-sm">DEV LOGIN</Text>
      </Pressable>

      {/* User Selection Modal */}
      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-xl p-4 pb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text testID="dev-login-modal-title" className="text-text-primary text-lg font-semibold">
                Dev Login - Select User
              </Text>
              <Pressable onPress={() => setIsVisible(false)}>
                <Text className="text-text-muted text-lg">✕</Text>
              </Pressable>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color="#FF4D00" className="py-8" />
            ) : (
              <View className="gap-2">
                {DEMO_USERS.map((user) => (
                  <Pressable
                    key={user.id}
                    testID={`dev-user-${user.display_name.toLowerCase()}`}
                    accessibilityLabel={user.display_name}
                    onPress={() => handleDevLogin(user)}
                    className="bg-surface-elevated p-4 rounded-lg flex-row items-center"
                  >
                    <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                      <Text className="text-primary font-bold">
                        {user.display_name.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-text-primary font-semibold">
                        {user.display_name}
                      </Text>
                      <Text className="text-text-muted text-sm">
                        {user.phone}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            <Text className="text-text-muted text-xs text-center mt-4">
              ⚠️ DEV ONLY - This bypasses authentication
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
