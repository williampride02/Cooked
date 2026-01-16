/**
 * useShare Hook
 * Provides convenient methods for sharing different types of content
 */

import { useState, useCallback } from 'react';
import { Share } from 'react-native';
import { useShareableLink } from '@/providers';
import { getShareMessage, ShareType, buildShareUrl } from '@/utils/share';
import type { ShareCardData } from '@/components/share/ShareModal';
import type {
  WeeklyRecap,
  RecapLeaderboardEntry,
  RoastResponse,
  User,
} from '@/types';

interface UseShareReturn {
  /**
   * Whether the share modal is visible
   */
  isShareModalVisible: boolean;

  /**
   * Data for the share modal card
   */
  shareCardData: ShareCardData | null;

  /**
   * URL to include with the share
   */
  shareUrl: string | null;

  /**
   * Open share modal for recap
   */
  shareRecap: (recap: WeeklyRecap, topMember?: RecapLeaderboardEntry) => void;

  /**
   * Open share modal for streak milestone
   */
  shareStreak: (
    streakDays: number,
    pactName: string,
    userName: string,
    userAvatar?: string | null
  ) => void;

  /**
   * Open share modal for roast
   */
  shareRoast: (
    roastContent: string,
    roaster: Pick<User, 'display_name' | 'avatar_url'>,
    victimName: string,
    pactName: string,
    reactionCount?: number
  ) => void;

  /**
   * Open share modal for group invite
   */
  shareInvite: (
    groupName: string,
    memberCount: number,
    inviteCode: string
  ) => void;

  /**
   * Open share modal for achievement
   */
  shareAchievement: (
    achievementName: string,
    achievementDescription: string,
    emoji: string,
    userName: string,
    userAvatar?: string | null
  ) => void;

  /**
   * Close the share modal
   */
  closeShareModal: () => void;

  /**
   * Quick text share (no image)
   */
  quickShare: (
    type: ShareType,
    data: Record<string, string | number>,
    url?: string
  ) => Promise<void>;
}

/**
 * Format date range for recap
 */
function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}

/**
 * Hook for sharing content from the Cooked app
 */
export function useShare(): UseShareReturn {
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [shareCardData, setShareCardData] = useState<ShareCardData | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const { createRecapLink, createGroupInviteLink } = useShareableLink();

  // Share recap
  const shareRecap = useCallback(
    (recap: WeeklyRecap, topMember?: RecapLeaderboardEntry) => {
      const dateRange = formatDateRange(recap.week_start, recap.week_end);

      setShareCardData({
        type: 'recap',
        props: {
          dateRange,
          completionRate: recap.data.stats.group_completion_rate,
          totalCheckIns: recap.data.stats.total_check_ins,
          totalFolds: recap.data.stats.total_folds,
          topMember: topMember || recap.data.stats.leaderboard[0],
        },
      });

      setShareUrl(createRecapLink(recap.id));
      setIsShareModalVisible(true);
    },
    [createRecapLink]
  );

  // Share streak milestone
  const shareStreak = useCallback(
    (
      streakDays: number,
      pactName: string,
      userName: string,
      userAvatar?: string | null
    ) => {
      // Determine milestone
      let milestone: number | undefined;
      if (streakDays >= 100) milestone = 100;
      else if (streakDays >= 60) milestone = 60;
      else if (streakDays >= 30) milestone = 30;
      else if (streakDays >= 14) milestone = 14;
      else if (streakDays >= 7) milestone = 7;

      setShareCardData({
        type: 'streak',
        props: {
          streakDays,
          pactName,
          userName,
          userAvatar,
          milestone,
        },
      });

      setShareUrl(null);
      setIsShareModalVisible(true);
    },
    []
  );

  // Share roast
  const shareRoast = useCallback(
    (
      roastContent: string,
      roaster: Pick<User, 'display_name' | 'avatar_url'>,
      victimName: string,
      pactName: string,
      reactionCount?: number
    ) => {
      setShareCardData({
        type: 'roast',
        props: {
          roastContent,
          roasterName: roaster.display_name,
          roasterAvatar: roaster.avatar_url,
          victimName,
          pactName,
          reactionCount,
        },
      });

      setShareUrl(null);
      setIsShareModalVisible(true);
    },
    []
  );

  // Share group invite
  const shareInvite = useCallback(
    (groupName: string, memberCount: number, inviteCode: string) => {
      const inviteUrl = createGroupInviteLink(inviteCode);

      setShareCardData({
        type: 'invite',
        props: {
          groupName,
          memberCount,
          inviteCode,
          inviteUrl,
        },
      });

      setShareUrl(inviteUrl);
      setIsShareModalVisible(true);
    },
    [createGroupInviteLink]
  );

  // Share achievement
  const shareAchievement = useCallback(
    (
      achievementName: string,
      achievementDescription: string,
      emoji: string,
      userName: string,
      userAvatar?: string | null
    ) => {
      const unlockedDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      setShareCardData({
        type: 'achievement',
        props: {
          achievementName,
          achievementDescription,
          emoji,
          userName,
          userAvatar,
          unlockedDate,
        },
      });

      setShareUrl(null);
      setIsShareModalVisible(true);
    },
    []
  );

  // Close modal
  const closeShareModal = useCallback(() => {
    setIsShareModalVisible(false);
    // Delay clearing data for animation
    setTimeout(() => {
      setShareCardData(null);
      setShareUrl(null);
    }, 300);
  }, []);

  // Quick text share (no image)
  const quickShare = useCallback(
    async (
      type: ShareType,
      data: Record<string, string | number>,
      url?: string
    ) => {
      const message = getShareMessage(type, data);
      const fullMessage = url ? `${message}\n\n${url}` : message;

      try {
        await Share.share({
          message: fullMessage,
          url: url,
        });
      } catch (err) {
        console.error('[useShare] Quick share error:', err);
      }
    },
    []
  );

  return {
    isShareModalVisible,
    shareCardData,
    shareUrl,
    shareRecap,
    shareStreak,
    shareRoast,
    shareInvite,
    shareAchievement,
    closeShareModal,
    quickShare,
  };
}
