import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OtpInput } from '@/components/auth';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { useAppStore } from '@/stores/app';
import { supabase } from '@/lib/supabase';
import { haptics } from '@/utils/haptics';

const RESEND_COOLDOWN = 60; // seconds

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const { verifyOtp, requestOtp, error, clearError } = usePhoneAuth();
  const setUser = useAppStore((state) => state.setUser);
  const setSession = useAppStore((state) => state.setSession);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Clear resend message after 3 seconds
  useEffect(() => {
    if (resendMessage) {
      const timer = setTimeout(() => {
        setResendMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [resendMessage]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  // Format phone for display (mask middle digits)
  const formatPhoneDisplay = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    if (phoneNumber.length > 8) {
      const start = phoneNumber.slice(0, 6);
      const end = phoneNumber.slice(-4);
      return `${start}****${end}`;
    }
    return phoneNumber;
  };

  // Check if user is new or existing
  const checkUserProfile = async (userId: string): Promise<boolean> => {
    const { data, error: profileError } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', userId)
      .single();

    // PGRST116 = no rows found = new user
    if (profileError?.code === 'PGRST116') {
      return true;
    }

    // Other errors - log and treat as new user to allow profile setup
    if (profileError) {
      console.warn('Profile check error:', profileError.message);
      return true;
    }

    return !data?.display_name;
  };

  // Handle OTP verification
  const handleVerify = useCallback(
    async (otpCode: string) => {
      if (!phone || isVerifying) return;

      setIsVerifying(true);
      clearError();

      const success = await verifyOtp(phone, otpCode);

      if (success) {
        haptics.success();

        // Get the session and user
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          setSession(session);

          // Check if new or existing user
          const isNewUser = await checkUserProfile(session.user.id);

          if (isNewUser) {
            router.replace('/profile-setup');
          } else {
            router.replace('/(main)');
          }
        }
      } else {
        haptics.error();
        setCode(''); // Clear code on error
      }

      setIsVerifying(false);
    },
    [phone, isVerifying, verifyOtp, clearError, setUser, setSession]
  );

  // Handle code change
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      clearError();
    },
    [clearError]
  );

  // Handle resend code
  const handleResend = useCallback(async () => {
    if (resendCountdown > 0 || !phone) return;

    haptics.medium();
    const success = await requestOtp(phone);

    if (success) {
      haptics.success();
      setResendCountdown(RESEND_COOLDOWN);
      setResendMessage('Code sent!');
      setCode('');
    } else {
      haptics.error();
    }
  }, [resendCountdown, phone, requestOtp]);

  const canResend = resendCountdown === 0;

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
        {/* Heading */}
        <Text className="text-h1 text-text-primary font-bold mb-xs">
          Enter the code
        </Text>

        {/* Subtitle */}
        <Text className="text-body text-text-secondary mb-xl">
          Sent to {formatPhoneDisplay(phone || '')}
        </Text>

        {/* OTP Input */}
        <OtpInput
          value={code}
          onChange={handleCodeChange}
          onComplete={handleVerify}
          disabled={isVerifying}
          error={!!error}
        />

        {/* Error Message */}
        {error && (
          <Text
            className="text-danger text-body-sm text-center mt-m"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {error}
          </Text>
        )}

        {/* Success Message */}
        {resendMessage && (
          <Text
            className="text-success text-body-sm text-center mt-m"
            accessibilityLiveRegion="polite"
          >
            {resendMessage}
          </Text>
        )}

        {/* Loading Indicator */}
        {isVerifying && (
          <View className="items-center mt-l">
            <ActivityIndicator color="rgb(255, 77, 0)" />
            <Text className="text-text-secondary text-body-sm mt-s">
              Verifying...
            </Text>
          </View>
        )}

        {/* Resend Link */}
        <View className="items-center mt-xl">
          <Pressable
            onPress={handleResend}
            disabled={!canResend || isVerifying}
            accessibilityLabel={
              canResend ? 'Resend code' : `Resend available in ${resendCountdown} seconds`
            }
            accessibilityRole="button"
          >
            <Text className="text-body-sm">
              <Text className="text-text-secondary">Didn't get it? </Text>
              {canResend ? (
                <Text className="text-primary">Resend</Text>
              ) : (
                <Text className="text-text-muted">
                  Resend in {resendCountdown}s
                </Text>
              )}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
