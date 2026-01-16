import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useNotificationContext } from '@/providers';
import { haptics } from '@/utils/haptics';
import type { NotificationPreferences } from '@/types';

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, value, onValueChange, disabled }: ToggleRowProps) {
  const handleChange = (newValue: boolean) => {
    haptics.light();
    onValueChange(newValue);
  };

  return (
    <View className="flex-row items-center py-m border-b border-border">
      <View className="flex-1 mr-m">
        <Text className="text-body text-text-primary">{label}</Text>
        <Text className="text-body-sm text-text-muted mt-xs">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        trackColor={{ false: '#333333', true: 'rgb(255, 77, 0)' }}
        thumbColor="#FFFFFF"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

interface TimePickerRowProps {
  label: string;
  startTime: string;
  endTime: string;
  onStartChange: (time: string) => void;
  onEndChange: (time: string) => void;
  disabled?: boolean;
}

function TimePickerRow({ label, startTime, endTime, onStartChange, onEndChange, disabled }: TimePickerRowProps) {
  // Simple time selection - in production would use a proper time picker
  const timeOptions = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
  ];

  const formatTime = (time: string): string => {
    const [hour] = time.split(':');
    const hourNum = parseInt(hour, 10);
    if (hourNum === 0) return '12:00 AM';
    if (hourNum === 12) return '12:00 PM';
    if (hourNum < 12) return `${hourNum}:00 AM`;
    return `${hourNum - 12}:00 PM`;
  };

  return (
    <View className="py-m border-b border-border">
      <Text className="text-body text-text-primary mb-s">{label}</Text>
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="text-caption text-text-muted mb-xs">From</Text>
          <Pressable
            className="bg-surface border border-border rounded-sm px-m py-s"
            onPress={() => {
              if (disabled) return;
              haptics.light();
              // Cycle through times
              const currentIndex = timeOptions.indexOf(startTime);
              const nextIndex = (currentIndex + 1) % timeOptions.length;
              onStartChange(timeOptions[nextIndex]);
            }}
            disabled={disabled}
            accessibilityLabel="Start time"
          >
            <Text className="text-body text-text-primary text-center">
              {formatTime(startTime)}
            </Text>
          </Pressable>
        </View>
        <Text className="text-body text-text-muted mx-m">to</Text>
        <View className="flex-1">
          <Text className="text-caption text-text-muted mb-xs">To</Text>
          <Pressable
            className="bg-surface border border-border rounded-sm px-m py-s"
            onPress={() => {
              if (disabled) return;
              haptics.light();
              // Cycle through times
              const currentIndex = timeOptions.indexOf(endTime);
              const nextIndex = (currentIndex + 1) % timeOptions.length;
              onEndChange(timeOptions[nextIndex]);
            }}
            disabled={disabled}
            accessibilityLabel="End time"
          >
            <Text className="text-body text-text-primary text-center">
              {formatTime(endTime)}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const { preferences, isLoading, error, updatePreference } = useNotificationPreferences();
  const {
    permissionStatus,
    isLoading: isRegisteringPush,
    requestPermissions,
  } = useNotificationContext();

  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  const handleToggle = useCallback(
    (key: keyof NotificationPreferences) => async (value: boolean) => {
      await updatePreference(key, value);
    },
    [updatePreference]
  );

  const handleTimeChange = useCallback(
    (key: 'quiet_hours_start' | 'quiet_hours_end') => async (time: string) => {
      await updatePreference(key, time);
    },
    [updatePreference]
  );

  const handleEnablePushNotifications = useCallback(async () => {
    haptics.light();
    const granted = await requestPermissions();
    if (!granted && permissionStatus === 'denied') {
      // If denied, open app settings
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    }
  }, [requestPermissions, permissionStatus]);

  const handleOpenSettings = useCallback(() => {
    haptics.light();
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  const isPushEnabled = permissionStatus === 'granted';
  const isPushDenied = permissionStatus === 'denied';
  const isPushNotSupported = permissionStatus === 'not_supported';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-m py-s border-b border-border">
        <Pressable
          onPress={handleBack}
          className="w-11 h-11 items-center justify-center -ml-s"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text className="text-text-primary text-h2">{'\u2190'}</Text>
        </Pressable>
        <Text className="text-h2 text-text-primary font-semibold ml-s">
          Notifications
        </Text>
      </View>

      {error && (
        <View className="px-m py-s bg-danger/10">
          <Text className="text-danger text-body-sm text-center">{error}</Text>
        </View>
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Push Notification Status */}
        <Text className="text-h3 text-text-primary font-semibold mb-s">
          Push Notifications
        </Text>
        <View className="bg-surface border border-border rounded-md px-m py-m mb-m">
          {isPushNotSupported ? (
            <View>
              <Text className="text-body text-text-primary">Not Available</Text>
              <Text className="text-body-sm text-text-muted mt-xs">
                Push notifications require a physical device. They are not available in the simulator.
              </Text>
            </View>
          ) : isPushEnabled ? (
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-body text-text-primary">Enabled</Text>
                <Text className="text-body-sm text-text-muted mt-xs">
                  You'll receive push notifications for activity below.
                </Text>
              </View>
              <View className="w-3 h-3 rounded-full bg-success" />
            </View>
          ) : isPushDenied ? (
            <View>
              <View className="flex-row items-center justify-between mb-s">
                <Text className="text-body text-text-primary">Disabled</Text>
                <View className="w-3 h-3 rounded-full bg-danger" />
              </View>
              <Text className="text-body-sm text-text-muted mb-m">
                Push notifications are disabled. Enable them in your device settings to stay accountable.
              </Text>
              <Pressable
                onPress={handleOpenSettings}
                className="bg-primary rounded-sm py-s px-m self-start"
                accessibilityLabel="Open settings"
                accessibilityRole="button"
              >
                <Text className="text-body text-text-primary font-medium">Open Settings</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text className="text-body text-text-primary mb-s">Enable Push Notifications</Text>
              <Text className="text-body-sm text-text-muted mb-m">
                Get notified when it's time to check in, when someone folds, or when you get roasted.
              </Text>
              <Pressable
                onPress={handleEnablePushNotifications}
                disabled={isRegisteringPush}
                className="bg-primary rounded-sm py-s px-m self-start"
                accessibilityLabel="Enable notifications"
                accessibilityRole="button"
              >
                {isRegisteringPush ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-body text-text-primary font-medium">Enable Notifications</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Activity Notifications */}
        <Text className="text-h3 text-text-primary font-semibold mb-s">
          Activity
        </Text>
        <View className="bg-surface border border-border rounded-md px-m mb-m">
          <ToggleRow
            label="Check-in Reminders"
            description="Daily reminder to complete your check-ins"
            value={preferences.check_in_reminder}
            onValueChange={handleToggle('check_in_reminder')}
          />
          <ToggleRow
            label="Fold Alerts"
            description="When someone in your group folds"
            value={preferences.fold_alert}
            onValueChange={handleToggle('fold_alert')}
          />
          <ToggleRow
            label="Tagged in Roast"
            description="When you're mentioned in a roast thread"
            value={preferences.tagged_in_roast}
            onValueChange={handleToggle('tagged_in_roast')}
          />
          <ToggleRow
            label="New Roast Responses"
            description="When someone roasts you in your thread"
            value={preferences.new_roast_response}
            onValueChange={handleToggle('new_roast_response')}
          />
        </View>

        {/* Updates */}
        <Text className="text-h3 text-text-primary font-semibold mb-s">
          Updates
        </Text>
        <View className="bg-surface border border-border rounded-md px-m mb-m">
          <ToggleRow
            label="Weekly Recap"
            description="Your receipts are ready!"
            value={preferences.weekly_recap_ready}
            onValueChange={handleToggle('weekly_recap_ready')}
          />
          <ToggleRow
            label="New Members"
            description="When someone joins your group"
            value={preferences.member_joined}
            onValueChange={handleToggle('member_joined')}
          />
          <ToggleRow
            label="Pact Reminders"
            description="When pacts are starting or ending"
            value={preferences.pact_starting}
            onValueChange={handleToggle('pact_starting')}
          />
        </View>

        {/* Quiet Hours */}
        <Text className="text-h3 text-text-primary font-semibold mb-s">
          Quiet Hours
        </Text>
        <View className="bg-surface border border-border rounded-md px-m mb-m">
          <ToggleRow
            label="Enable Quiet Hours"
            description="Pause notifications during set hours"
            value={preferences.quiet_hours_enabled}
            onValueChange={handleToggle('quiet_hours_enabled')}
          />
          {preferences.quiet_hours_enabled && (
            <TimePickerRow
              label="Quiet Hours"
              startTime={preferences.quiet_hours_start}
              endTime={preferences.quiet_hours_end}
              onStartChange={handleTimeChange('quiet_hours_start')}
              onEndChange={handleTimeChange('quiet_hours_end')}
            />
          )}
        </View>

        {/* Info */}
        <View className="bg-surface-elevated rounded-md p-m">
          <Text className="text-body-sm text-text-muted text-center">
            {'\u{1F514}'} Notifications help keep you accountable with your group.
            Disable specific types if you find them too frequent.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
