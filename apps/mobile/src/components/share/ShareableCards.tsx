/**
 * Shareable Card Templates
 * Pre-styled cards optimized for social sharing
 */

import React, { forwardRef } from 'react';
import { View, Text, Image } from 'react-native';
import ViewShot from 'react-native-view-shot';
import type {
  RecapData,
  RecapAwardWinner,
  RecapRoastAward,
  RecapLeaderboardEntry,
} from '@/types';

const CARD_WIDTH = 360;
const CARD_PADDING = 24;

/**
 * Base card wrapper with dark gradient background
 */
interface CardWrapperProps {
  children: React.ReactNode;
  width?: number;
}

const CardWrapper = forwardRef<ViewShot, CardWrapperProps>(
  ({ children, width = CARD_WIDTH }, ref) => (
    <ViewShot
      ref={ref}
      options={{ format: 'png', quality: 1, result: 'tmpfile' }}
      style={{
        width,
        backgroundColor: '#0D0D0D',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Gradient overlay effect */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          backgroundColor: 'rgba(255, 77, 0, 0.15)',
        }}
      />
      <View style={{ padding: CARD_PADDING }}>
        {children}
      </View>
      {/* Branding footer */}
      <View
        style={{
          paddingVertical: 12,
          paddingHorizontal: CARD_PADDING,
          borderTopWidth: 1,
          borderTopColor: '#333333',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#FF4D00', fontSize: 14, fontWeight: '700' }}>
          COOKED
        </Text>
        <Text style={{ color: '#666666', fontSize: 12, marginLeft: 8 }}>
          Accountability that roasts you
        </Text>
      </View>
    </ViewShot>
  )
);

CardWrapper.displayName = 'CardWrapper';

/**
 * Weekly Recap Summary Card
 */
interface RecapCardProps {
  dateRange: string;
  completionRate: number;
  totalCheckIns: number;
  totalFolds: number;
  topMember?: RecapLeaderboardEntry;
}

export const RecapCard = forwardRef<ViewShot, RecapCardProps>(
  ({ dateRange, completionRate, totalCheckIns, totalFolds, topMember }, ref) => (
    <CardWrapper ref={ref}>
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#FF4D00', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
          WEEKLY RECAP
        </Text>
        <Text style={{ color: '#A0A0A0', fontSize: 14, marginTop: 4 }}>
          {dateRange}
        </Text>
      </View>

      {/* Big Stat */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 64, fontWeight: '700' }}>
          {Math.round(completionRate)}%
        </Text>
        <Text style={{ color: '#A0A0A0', fontSize: 16 }}>
          Completion Rate
        </Text>
      </View>

      {/* Stats Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#00D26A', fontSize: 24, fontWeight: '700' }}>
            {totalCheckIns}
          </Text>
          <Text style={{ color: '#666666', fontSize: 12 }}>Check-ins</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#FF3B3B', fontSize: 24, fontWeight: '700' }}>
            {totalFolds}
          </Text>
          <Text style={{ color: '#666666', fontSize: 12 }}>Folds</Text>
        </View>
      </View>

      {/* MVP */}
      {topMember && (
        <View
          style={{
            backgroundColor: '#1A1A1A',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#262626',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              overflow: 'hidden',
            }}
          >
            {topMember.avatar_url ? (
              <Image
                source={{ uri: topMember.avatar_url }}
                style={{ width: 40, height: 40 }}
              />
            ) : (
              <Text style={{ color: '#666666', fontSize: 16 }}>
                {topMember.display_name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FF8A00', fontSize: 10, fontWeight: '600' }}>
              MVP OF THE WEEK
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
              {topMember.display_name}
            </Text>
          </View>
          <Text style={{ color: '#00D26A', fontSize: 18, fontWeight: '700' }}>
            {Math.round(topMember.completion_rate)}%
          </Text>
        </View>
      )}
    </CardWrapper>
  )
);

RecapCard.displayName = 'RecapCard';

/**
 * Achievement Unlocked Card
 */
interface AchievementCardProps {
  achievementName: string;
  achievementDescription: string;
  emoji: string;
  userName: string;
  userAvatar?: string | null;
  unlockedDate: string;
}

export const AchievementCard = forwardRef<ViewShot, AchievementCardProps>(
  ({ achievementName, achievementDescription, emoji, userName, userAvatar, unlockedDate }, ref) => (
    <CardWrapper ref={ref}>
      {/* Badge */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FF4D00',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#FF4D00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
          }}
        >
          <Text style={{ fontSize: 40 }}>{emoji}</Text>
        </View>
      </View>

      {/* Achievement Info */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ color: '#FF8A00', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8 }}>
          ACHIEVEMENT UNLOCKED
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700', textAlign: 'center' }}>
          {achievementName}
        </Text>
        <Text style={{ color: '#A0A0A0', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
          {achievementDescription}
        </Text>
      </View>

      {/* User */}
      <View
        style={{
          backgroundColor: '#1A1A1A',
          borderRadius: 12,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#262626',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            overflow: 'hidden',
          }}
        >
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={{ width: 36, height: 36 }} />
          ) : (
            <Text style={{ color: '#666666', fontSize: 14 }}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
            {userName}
          </Text>
          <Text style={{ color: '#666666', fontSize: 12 }}>
            {unlockedDate}
          </Text>
        </View>
      </View>
    </CardWrapper>
  )
);

AchievementCard.displayName = 'AchievementCard';

/**
 * Streak Milestone Card
 */
interface StreakCardProps {
  streakDays: number;
  pactName: string;
  userName: string;
  userAvatar?: string | null;
  milestone?: number; // e.g., 7, 14, 30, 60, 100
}

export const StreakCard = forwardRef<ViewShot, StreakCardProps>(
  ({ streakDays, pactName, userName, userAvatar, milestone }, ref) => {
    // Determine streak level color
    const streakColor = streakDays >= 100 ? '#FFD700' : streakDays >= 30 ? '#FF4D00' : '#FF8A00';

    return (
      <CardWrapper ref={ref}>
        {/* Streak Counter */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 32 }}>{'\u{1F525}'}</Text>
          <Text
            style={{
              color: streakColor,
              fontSize: 72,
              fontWeight: '700',
              lineHeight: 80,
            }}
          >
            {streakDays}
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
            DAY STREAK
          </Text>
        </View>

        {/* Pact Name */}
        <View
          style={{
            backgroundColor: '#1A1A1A',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: '#666666', fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>
            PACT
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginTop: 4 }}>
            {pactName}
          </Text>
        </View>

        {/* User */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#262626',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
              overflow: 'hidden',
            }}
          >
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={{ width: 32, height: 32 }} />
            ) : (
              <Text style={{ color: '#666666', fontSize: 12 }}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={{ color: '#A0A0A0', fontSize: 14 }}>
            {userName}
          </Text>
        </View>

        {/* Milestone Badge */}
        {milestone && streakDays >= milestone && (
          <View
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: streakColor,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
              {milestone}+ DAYS!
            </Text>
          </View>
        )}
      </CardWrapper>
    );
  }
);

StreakCard.displayName = 'StreakCard';

/**
 * Roast Card - Share the best roasts
 */
interface RoastCardProps {
  roastContent: string;
  roasterName: string;
  roasterAvatar?: string | null;
  victimName: string;
  pactName: string;
  reactionCount?: number;
}

export const RoastCard = forwardRef<ViewShot, RoastCardProps>(
  ({ roastContent, roasterName, roasterAvatar, victimName, pactName, reactionCount }, ref) => (
    <CardWrapper ref={ref}>
      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#FF3B3B', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
          {'\u{1F525}'} ROAST OF THE DAY
        </Text>
      </View>

      {/* Quote */}
      <View
        style={{
          backgroundColor: '#1A1A1A',
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: '#FF4D00',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '500', fontStyle: 'italic', lineHeight: 26 }}>
          "{roastContent}"
        </Text>
      </View>

      {/* Context */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Roaster */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#262626',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
              overflow: 'hidden',
            }}
          >
            {roasterAvatar ? (
              <Image source={{ uri: roasterAvatar }} style={{ width: 32, height: 32 }} />
            ) : (
              <Text style={{ color: '#666666', fontSize: 12 }}>
                {roasterName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
              {roasterName}
            </Text>
            <Text style={{ color: '#666666', fontSize: 12 }}>
              roasted {victimName}
            </Text>
          </View>
        </View>

        {/* Reactions */}
        {reactionCount !== undefined && reactionCount > 0 && (
          <View
            style={{
              backgroundColor: '#262626',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14 }}>{'\u{1F480}'}</Text>
            <Text style={{ color: '#A0A0A0', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>
              {reactionCount}
            </Text>
          </View>
        )}
      </View>

      {/* Pact Context */}
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: '#666666', fontSize: 12 }}>
          on {pactName}
        </Text>
      </View>
    </CardWrapper>
  )
);

RoastCard.displayName = 'RoastCard';

/**
 * Invite Card - Share group invite
 */
interface InviteCardProps {
  groupName: string;
  memberCount: number;
  inviteCode: string;
  inviteUrl: string;
}

export const InviteCard = forwardRef<ViewShot, InviteCardProps>(
  ({ groupName, memberCount, inviteCode, inviteUrl }, ref) => (
    <CardWrapper ref={ref}>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 8 }}>{'\u{1F44B}'}</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700', textAlign: 'center' }}>
          Join {groupName}
        </Text>
        <Text style={{ color: '#A0A0A0', fontSize: 14, marginTop: 4 }}>
          {memberCount} member{memberCount !== 1 ? 's' : ''} and counting
        </Text>
      </View>

      {/* Invite Code */}
      <View
        style={{
          backgroundColor: '#1A1A1A',
          borderRadius: 12,
          padding: 20,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={{ color: '#666666', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
          INVITE CODE
        </Text>
        <Text
          style={{
            color: '#FF4D00',
            fontSize: 32,
            fontWeight: '700',
            letterSpacing: 4,
            marginTop: 8,
            fontFamily: 'monospace',
          }}
        >
          {inviteCode.toUpperCase()}
        </Text>
      </View>

      {/* URL */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: '#666666', fontSize: 12 }}>
          or scan / tap link
        </Text>
        <Text style={{ color: '#A0A0A0', fontSize: 14, marginTop: 4 }}>
          {inviteUrl}
        </Text>
      </View>
    </CardWrapper>
  )
);

InviteCard.displayName = 'InviteCard';

export {
  CardWrapper,
  type RecapCardProps,
  type AchievementCardProps,
  type StreakCardProps,
  type RoastCardProps,
  type InviteCardProps,
};
