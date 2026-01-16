import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhoneInput, CountryCodePicker } from '@/components/auth';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import {
  Country,
  getDefaultCountry,
  stripNonNumeric,
  validatePhoneNumber,
  toE164,
  getPhoneValidationError,
} from '@/utils/phone';
import { haptics } from '@/utils/haptics';
import { DevLogin } from '@/components/dev/DevLogin';

export default function PhoneScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState<Country>(getDefaultCountry());
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [touched, setTouched] = useState(false);

  const { requestOtp, isLoading, error, clearError } = usePhoneAuth();

  // Validation
  const isValid = useMemo(() => {
    return validatePhoneNumber(phoneNumber, country);
  }, [phoneNumber, country]);

  const validationError = useMemo(() => {
    if (!touched) return null;
    return getPhoneValidationError(phoneNumber, country);
  }, [phoneNumber, country, touched]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  // Handle country selection
  const handleCountrySelect = useCallback((selectedCountry: Country) => {
    haptics.selection();
    setCountry(selectedCountry);
    setPhoneNumber(''); // Clear phone when country changes
    clearError();
  }, [clearError]);

  // Handle phone number change
  const handlePhoneChange = useCallback((value: string) => {
    setPhoneNumber(value);
    setTouched(true);
    clearError();
  }, [clearError]);

  // Handle continue
  const handleContinue = useCallback(async () => {
    if (!isValid || isLoading) return;

    Keyboard.dismiss();
    haptics.medium();
    setTouched(true);

    const e164Phone = toE164(phoneNumber, country);
    const success = await requestOtp(e164Phone);

    if (success) {
      haptics.success();
      router.push({
        pathname: '/verify',
        params: { phone: e164Phone },
      });
    } else {
      haptics.error();
    }
  }, [isValid, isLoading, phoneNumber, country, requestOtp]);

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
        <Text className="text-h1 text-text-primary font-bold mb-l">
          What's your number?
        </Text>

        {/* Phone Input */}
        <PhoneInput
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          country={country}
          onCountryPress={() => setShowCountryPicker(true)}
          error={validationError || error}
          editable={!isLoading}
        />

        {/* Helper Text */}
        <Text className="text-body-sm text-text-secondary mt-m">
          We'll text you a code.{'\n'}Standard rates apply.
        </Text>

        {/* Continue Button */}
        <Pressable
          onPress={handleContinue}
          disabled={!isValid || isLoading}
          className={`mt-xl py-3 rounded-sm items-center justify-center ${
            isValid && !isLoading ? 'bg-primary' : 'bg-surface'
          }`}
          accessibilityLabel="Continue"
          accessibilityRole="button"
          accessibilityState={{ disabled: !isValid || isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className={`text-body font-semibold ${
                isValid ? 'text-text-primary' : 'text-text-muted'
              }`}
            >
              Continue
            </Text>
          )}
        </Pressable>
      </View>

      {/* Country Code Picker Modal */}
      <CountryCodePicker
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onSelect={handleCountrySelect}
        selectedCountry={country}
      />

      {/* Dev Login - only shows in __DEV__ mode */}
      <DevLogin />
    </SafeAreaView>
  );
}
