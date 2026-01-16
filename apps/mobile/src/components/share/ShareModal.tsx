/**
 * ShareModal Component
 * Modal for previewing and sharing content as images
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { haptics } from '@/utils/haptics';
import {
  captureAndShare,
  ShareType,
  getShareMessage,
  type ShareResult,
} from '@/utils/share';
import {
  RecapCard,
  AchievementCard,
  StreakCard,
  RoastCard,
  InviteCard,
  type RecapCardProps,
  type AchievementCardProps,
  type StreakCardProps,
  type RoastCardProps,
  type InviteCardProps,
} from './ShareableCards';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_SCALE = Math.min((SCREEN_WIDTH - 64) / 360, 1);

/**
 * Share modal card types
 */
export type ShareCardData =
  | { type: 'recap'; props: RecapCardProps }
  | { type: 'achievement'; props: AchievementCardProps }
  | { type: 'streak'; props: StreakCardProps }
  | { type: 'roast'; props: RoastCardProps }
  | { type: 'invite'; props: InviteCardProps };

export interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  cardData: ShareCardData;
  shareUrl?: string;
}

export function ShareModal({
  visible,
  onClose,
  cardData,
  shareUrl,
}: ShareModalProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setError(null);
      setIsSharing(false);
    }
  }, [visible]);

  // Handle share
  const handleShare = useCallback(async () => {
    setError(null);
    setIsSharing(true);
    haptics.medium();

    try {
      const result = await captureAndShare(viewShotRef, {
        dialogTitle: 'Share to',
      });

      if (!result.success && result.error) {
        setError(result.error);
        haptics.error();
      } else {
        // Success - close modal after short delay
        haptics.success();
        setTimeout(() => {
          onClose();
        }, 300);
      }
    } catch (err) {
      console.error('[ShareModal] Share error:', err);
      setError('Something went wrong');
      haptics.error();
    } finally {
      setIsSharing(false);
    }
  }, [onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    haptics.light();
    onClose();
  }, [onClose]);

  // Render the appropriate card based on type
  const renderCard = () => {
    switch (cardData.type) {
      case 'recap':
        return <RecapCard ref={viewShotRef} {...cardData.props} />;
      case 'achievement':
        return <AchievementCard ref={viewShotRef} {...cardData.props} />;
      case 'streak':
        return <StreakCard ref={viewShotRef} {...cardData.props} />;
      case 'roast':
        return <RoastCard ref={viewShotRef} {...cardData.props} />;
      case 'invite':
        return <InviteCard ref={viewShotRef} {...cardData.props} />;
      default:
        return null;
    }
  };

  // Get share message for clipboard/text sharing
  const getMessageData = (): Record<string, string | number> => {
    switch (cardData.type) {
      case 'recap':
        return { completionRate: cardData.props.completionRate };
      case 'achievement':
        return { achievementName: cardData.props.achievementName };
      case 'streak':
        return {
          streakDays: cardData.props.streakDays,
          pactName: cardData.props.pactName,
        };
      case 'roast':
        return { roastContent: cardData.props.roastContent };
      case 'invite':
        return { groupName: cardData.props.groupName };
      default:
        return {};
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-m py-s border-b border-border">
          <Pressable
            onPress={handleClose}
            className="w-11 h-11 items-center justify-center -ml-s"
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Text className="text-text-primary text-h2">{'\u00D7'}</Text>
          </Pressable>
          <Text className="text-h3 text-text-primary font-semibold">
            Share
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Preview */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            alignItems: 'center',
            paddingVertical: 32,
          }}
        >
          <View
            style={{
              transform: [{ scale: PREVIEW_SCALE }],
              shadowColor: '#FF4D00',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
            }}
          >
            {renderCard()}
          </View>

          {/* Share URL hint */}
          {shareUrl && (
            <View className="mt-l px-m">
              <Text className="text-caption text-text-muted text-center">
                Link will be included when sharing
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Error */}
        {error && (
          <View className="px-m py-s">
            <Text
              className="text-danger text-body-sm text-center"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {error}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View className="px-m pb-l pt-s border-t border-border">
          <Pressable
            onPress={handleShare}
            disabled={isSharing}
            className={`py-4 rounded-sm items-center justify-center ${
              isSharing ? 'bg-primary/50' : 'bg-primary'
            }`}
            accessibilityLabel="Share image"
            accessibilityRole="button"
            accessibilityState={{ disabled: isSharing }}
          >
            {isSharing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white text-body font-semibold">
                {'\u{1F4E4}'} Share Image
              </Text>
            )}
          </Pressable>

          <Text className="text-caption text-text-muted text-center mt-s">
            Saves image and opens share sheet
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
