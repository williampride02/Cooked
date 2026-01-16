import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRoastThreads } from '@/hooks/useRoastThreads';
import { useRoastThreadRealtime } from '@/hooks/useRealtimeSubscription';
import { useShare } from '@/hooks/useShare';
import { ReactionBar } from '@/components/feed/ReactionBar';
import { GifPicker } from '@/components/gif/GifPicker';
import { PollCreator, PollDisplay } from '@/components/polls';
import { ShareModal } from '@/components/share';
import { uploadRoastImage } from '@/lib/storage';
import { useAppStore } from '@/stores/app';
import { haptics } from '@/utils/haptics';
import type { RoastThreadWithDetails, RoastResponse, User } from '@/types';

const ROAST_LEVEL_INFO: Record<1 | 2 | 3, { features: string[]; label: string }> = {
  1: {
    label: 'Mild',
    features: ['reactions'],
  },
  2: {
    label: 'Medium',
    features: ['reactions', 'text', 'gif', 'image'],
  },
  3: {
    label: 'Nuclear',
    features: ['reactions', 'text', 'gif', 'image', 'polls', 'pin'],
  },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export default function RoastThreadScreen() {
  const { id: groupId, threadId } = useLocalSearchParams<{ id: string; threadId: string }>();
  const [thread, setThread] = useState<RoastThreadWithDetails | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { fetchThread, addResponse, muteThread, pinResponse, isLoading, error } = useRoastThreads();
  const user = useAppStore((state) => state.user);
  const {
    isShareModalVisible,
    shareCardData,
    shareUrl,
    shareRoast,
    closeShareModal,
  } = useShare();

  const loadThread = useCallback(async () => {
    if (!threadId) return;
    const result = await fetchThread(threadId);
    setThread(result);
  }, [threadId, fetchThread]);

  // Load thread on mount
  useEffect(() => {
    loadThread();
  }, [loadThread]);

  // Subscribe to real-time updates for this roast thread
  // This handles new responses and automatically reloads the thread
  useRoastThreadRealtime(threadId || null, (newResponse) => {
    // Reload thread to get the new response with full details
    loadThread();
    // Trigger haptic feedback for new responses from others
    if (newResponse.user_id !== user?.id) {
      haptics.light();
    }
    // Auto-scroll to the new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  });

  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !threadId || isLoading) return;

    Keyboard.dismiss();
    haptics.medium();

    const result = await addResponse({
      threadId,
      contentType: 'text',
      content: newMessage.trim(),
    });

    if (result) {
      haptics.success();
      setNewMessage('');
      loadThread();
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else {
      haptics.error();
    }
  }, [newMessage, threadId, isLoading, addResponse, loadThread]);

  const handlePickImage = useCallback(async () => {
    if (!threadId || !user) return;

    haptics.light();

    const { status: permissionStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionStatus !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setIsUploading(true);

      try {
        // Upload image using storage utility
        const uploadResult = await uploadRoastImage(user.id, threadId, result.assets[0].uri);

        if (uploadResult.error || !uploadResult.url) {
          console.error('Upload error:', uploadResult.error);
          Alert.alert('Upload failed', 'Could not upload image.');
          return;
        }

        // Add response
        await addResponse({
          threadId,
          contentType: 'image',
          content: uploadResult.url,
        });

        loadThread();
      } catch (err) {
        console.error('Upload exception:', err);
        Alert.alert('Upload failed', 'Something went wrong.');
      } finally {
        setIsUploading(false);
      }
    }
  }, [threadId, user, addResponse, loadThread]);

  const handleOpenGifPicker = useCallback(() => {
    haptics.light();
    Keyboard.dismiss();
    setShowGifPicker(true);
  }, []);

  const handleSelectGif = useCallback(async (gifUrl: string) => {
    if (!threadId) return;

    haptics.medium();

    const result = await addResponse({
      threadId,
      contentType: 'gif',
      content: gifUrl,
    });

    if (result) {
      haptics.success();
      loadThread();
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else {
      haptics.error();
    }
  }, [threadId, addResponse, loadThread]);

  const handleMute = useCallback(async () => {
    if (!threadId || !thread) return;

    haptics.medium();

    Alert.alert(
      'Mute Thread',
      'You will stop receiving notifications for this thread. The group will see that you muted it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mute',
          onPress: async () => {
            await muteThread(threadId);
            loadThread();
          },
        },
      ]
    );
  }, [threadId, thread, muteThread, loadThread]);

  const handlePin = useCallback(async (responseId: string) => {
    if (!threadId) return;

    haptics.light();
    await pinResponse(responseId, threadId);
    loadThread();
  }, [threadId, pinResponse, loadThread]);

  // Handle share roast
  const handleShareRoast = useCallback(
    (response: RoastResponse & { user: Pick<User, 'id' | 'display_name' | 'avatar_url'> }) => {
      if (!thread || response.content_type !== 'text') return;

      haptics.medium();
      shareRoast(
        response.content,
        response.user,
        thread.user.display_name,
        thread.pact.name,
        // We could add reaction count here if available
        undefined
      );
    },
    [thread, shareRoast]
  );

  // Derive values from thread (safe even when null)
  const roastLevel = thread?.pact.roast_level ?? 2;
  const features = ROAST_LEVEL_INFO[roastLevel].features;
  const canText = features.includes('text');
  const canImage = features.includes('image');
  const canGif = features.includes('gif');
  const canPoll = features.includes('polls');
  const canPin = features.includes('pin');
  const isSubject = thread?.check_in.user_id === user?.id;
  const isThreadOpen = thread?.status === 'open';

  // Define renderResponse BEFORE any returns to satisfy hooks rules
  const renderResponse = useCallback(({ item }: { item: RoastResponse & { user: Pick<User, 'id' | 'display_name' | 'avatar_url'> } }) => {
    const isOwn = item.user_id === user?.id;

    return (
      <View className={`mb-m ${isOwn ? 'items-end' : 'items-start'}`}>
        {item.is_pinned && (
          <View className="bg-primary/20 px-s py-xs rounded-full mb-xs">
            <Text className="text-primary text-caption font-semibold">
              {'\u{1F4CC}'} BEST ROAST
            </Text>
          </View>
        )}
        <View className={`max-w-[80%] ${isOwn ? 'bg-primary' : 'bg-surface'} rounded-md p-s border ${isOwn ? 'border-primary' : 'border-border'}`}>
          {/* User Info */}
          <View className="flex-row items-center mb-xs">
            <View className="w-6 h-6 rounded-full bg-surface-elevated items-center justify-center border border-border overflow-hidden">
              {item.user.avatar_url ? (
                <Image source={{ uri: item.user.avatar_url }} className="w-full h-full" />
              ) : (
                <Text className={`text-caption ${isOwn ? 'text-white' : 'text-text-muted'}`}>
                  {item.user.display_name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text className={`text-caption ml-xs ${isOwn ? 'text-white/80' : 'text-text-muted'}`}>
              {item.user.display_name}
            </Text>
          </View>

          {/* Content */}
          {item.content_type === 'text' && (
            <Text className={`text-body ${isOwn ? 'text-white' : 'text-text-primary'}`}>
              {item.content}
            </Text>
          )}
          {(item.content_type === 'image' || item.content_type === 'gif') && (
            <Image
              source={{ uri: item.content }}
              className="w-full h-40 rounded-sm"
              resizeMode="cover"
            />
          )}
          {item.content_type === 'poll' && (
            <PollDisplay pollId={item.content} isOwn={isOwn} />
          )}

          {/* Time, Pin, and Share */}
          <View className="flex-row items-center justify-between mt-xs">
            <Text className={`text-caption ${isOwn ? 'text-white/60' : 'text-text-muted'}`}>
              {formatTimeAgo(item.created_at)}
            </Text>
            <View className="flex-row items-center">
              {/* Share button for text roasts */}
              {item.content_type === 'text' && (
                <Pressable
                  onPress={() => handleShareRoast(item)}
                  className="px-xs py-xs mr-xs"
                  accessibilityLabel="Share roast"
                  accessibilityRole="button"
                >
                  <Text className={`text-caption ${isOwn ? 'text-white/60' : 'text-text-muted'}`}>
                    {'\u{1F4E4}'}
                  </Text>
                </Pressable>
              )}
              {canPin && (isSubject || roastLevel === 3) && !item.is_pinned && (
                <Pressable
                  onPress={() => handlePin(item.id)}
                  className="px-xs py-xs"
                  accessibilityLabel="Pin roast"
                  accessibilityRole="button"
                >
                  <Text className={`text-caption ${isOwn ? 'text-white/60' : 'text-text-muted'}`}>
                    {'\u{1F4CC}'} Pin
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Reactions */}
        <View className={`mt-xs ${isOwn ? 'items-end' : 'items-start'}`}>
          <ReactionBar targetType="roast_response" targetId={item.id} />
        </View>
      </View>
    );
  }, [user, canPin, isSubject, roastLevel, handlePin, handleShareRoast]);

  // Early returns AFTER all hooks are defined
  if (isLoading && !thread) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="rgb(255, 77, 0)" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['top']}>
        <Text className="text-danger text-body">{error}</Text>
        <Pressable onPress={handleBack} className="mt-m px-m py-s bg-surface rounded-md">
          <Text className="text-text-primary">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!thread) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['top']}>
        <Text className="text-text-muted text-body">Thread not found</Text>
        <Pressable onPress={handleBack} className="mt-m px-m py-s bg-surface rounded-md">
          <Text className="text-text-primary">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-m py-s border-b border-border">
        <View className="flex-row items-center flex-1">
          <Pressable
            onPress={handleBack}
            className="w-11 h-11 items-center justify-center -ml-s"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text className="text-text-primary text-h2">{'\u2190'}</Text>
          </Pressable>
          <View className="ml-s flex-1">
            <Text className="text-body text-text-primary font-semibold" numberOfLines={1}>
              {thread.pact.name}
            </Text>
            <Text className="text-caption text-text-muted">
              {thread.user.display_name} folded
            </Text>
          </View>
        </View>
        {isSubject && !thread.is_muted && (
          <Pressable
            onPress={handleMute}
            className="px-m py-xs bg-surface rounded-full border border-border"
            accessibilityLabel="Mute thread"
            accessibilityRole="button"
          >
            <Text className="text-body-sm text-text-muted">{'\u{1F507}'} Mute</Text>
          </Pressable>
        )}
      </View>

      {/* Thread Subject Info */}
      <View className="bg-danger/10 p-m border-b border-danger/20">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-surface items-center justify-center border border-border">
            {thread.user.avatar_url ? (
              <Image source={{ uri: thread.user.avatar_url }} className="w-full h-full rounded-full" />
            ) : (
              <Text className="text-text-muted text-h2">
                {thread.user.display_name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View className="ml-s flex-1">
            <Text className="text-body text-text-primary font-semibold">
              {thread.user.display_name} folded on {thread.pact.name}
            </Text>
            {thread.check_in.excuse && (
              <Text className="text-body-sm text-text-secondary italic mt-xs">
                "{thread.check_in.excuse}"
              </Text>
            )}
          </View>
        </View>
        {thread.is_muted && (
          <View className="mt-s bg-surface rounded-sm p-s">
            <Text className="text-body-sm text-text-muted">
              {'\u{1F507}'} {thread.user.display_name} muted this thread
            </Text>
          </View>
        )}
      </View>

      {/* Responses */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={thread.responses}
          renderItem={renderResponse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-xl">
              <Text className="text-text-muted text-body-sm">
                {roastLevel === 1
                  ? 'Only reactions are allowed for Mild pacts'
                  : 'No roasts yet. Be the first to roast!'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        {isThreadOpen && canText && (
          <View className="border-t border-border bg-surface px-m py-s">
            <View className="flex-row items-end">
              {canImage && (
                <Pressable
                  onPress={handlePickImage}
                  disabled={isUploading}
                  className="w-10 h-10 items-center justify-center mr-xs"
                  accessibilityLabel="Add image"
                  accessibilityRole="button"
                >
                  {isUploading ? (
                    <ActivityIndicator color="rgb(255, 77, 0)" size="small" />
                  ) : (
                    <Text className="text-text-muted text-h2">{'\u{1F5BC}'}</Text>
                  )}
                </Pressable>
              )}
              {canGif && (
                <Pressable
                  onPress={handleOpenGifPicker}
                  disabled={isUploading}
                  className="w-10 h-10 items-center justify-center mr-xs"
                  accessibilityLabel="Add GIF"
                  accessibilityRole="button"
                >
                  <Text className="text-text-muted text-body-sm font-bold">GIF</Text>
                </Pressable>
              )}
              {canPoll && (
                <Pressable
                  onPress={() => {
                    haptics.light();
                    Keyboard.dismiss();
                    setShowPollCreator(true);
                  }}
                  disabled={isUploading}
                  className="w-10 h-10 items-center justify-center mr-xs"
                  accessibilityLabel="Create poll"
                  accessibilityRole="button"
                >
                  <Text className="text-text-muted text-body-sm">{'\u{1F4CA}'}</Text>
                </Pressable>
              )}
              <View className="flex-1 bg-background border border-border rounded-md px-m py-s mr-xs">
                <TextInput
                  className="text-body text-text-primary max-h-24"
                  placeholder="Write a roast..."
                  placeholderTextColor="#666666"
                  value={newMessage}
                  onChangeText={setNewMessage}
                  maxLength={280}
                  multiline
                  editable={!isLoading}
                />
              </View>
              <Pressable
                onPress={handleSend}
                disabled={!newMessage.trim() || isLoading}
                className={`w-10 h-10 items-center justify-center rounded-full ${
                  newMessage.trim() ? 'bg-primary' : 'bg-surface-elevated'
                }`}
                accessibilityLabel="Send roast"
                accessibilityRole="button"
              >
                <Text className={`text-body ${newMessage.trim() ? 'text-white' : 'text-text-muted'}`}>
                  {'\u2191'}
                </Text>
              </Pressable>
            </View>
            <Text className="text-caption text-text-muted text-right mt-xs">
              {newMessage.length}/280
            </Text>
          </View>
        )}

        {isThreadOpen && !canText && (
          <View className="border-t border-border bg-surface px-m py-m">
            <Text className="text-body-sm text-text-muted text-center">
              {'\u{1F336}'} Mild - Only reactions are allowed
            </Text>
          </View>
        )}

        {!isThreadOpen && (
          <View className="border-t border-border bg-surface px-m py-m">
            <Text className="text-body-sm text-text-muted text-center">
              {'\u{1F512}'} This thread is closed
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* GIF Picker Modal */}
      <GifPicker
        visible={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={handleSelectGif}
      />

      {/* Poll Creator Modal */}
      {threadId && (
        <PollCreator
          threadId={threadId}
          visible={showPollCreator}
          onClose={() => setShowPollCreator(false)}
          onPollCreated={() => {
            loadThread();
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        />
      )}

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
