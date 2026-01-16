import React, { useState, useCallback } from 'react';
import { View, TextInput, Text, Pressable } from 'react-native';
import { Country, formatPhoneNumber, stripNonNumeric } from '@/utils/phone';

// Generate realistic placeholder like "(555) 123-4567" per AC2 spec
function getPlaceholder(format: string): string {
  const digits = '5551234567890';
  let result = '';
  let digitIndex = 0;

  for (let i = 0; i < format.length; i++) {
    if (format[i] === '#') {
      result += digits[digitIndex % digits.length];
      digitIndex++;
    } else {
      result += format[i];
    }
  }
  return result;
}

interface PhoneInputProps {
  value: string;
  onChangeText: (value: string) => void;
  country: Country;
  onCountryPress: () => void;
  error?: string | null;
  editable?: boolean;
}

export function PhoneInput({
  value,
  onChangeText,
  country,
  onCountryPress,
  error,
  editable = true,
}: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = useCallback(
    (text: string) => {
      const digits = stripNonNumeric(text);
      // Limit to maxLength
      const limitedDigits = digits.slice(0, country.maxLength);
      const formatted = formatPhoneNumber(limitedDigits, country);
      onChangeText(formatted);
    },
    [country, onChangeText]
  );

  const borderColor = error
    ? 'border-danger'
    : isFocused
    ? 'border-primary'
    : 'border-border';

  return (
    <View>
      <View
        className={`flex-row items-center bg-surface rounded-sm border ${borderColor}`}
      >
        {/* Country Code Picker Button - min 44pt touch target */}
        <Pressable
          onPress={onCountryPress}
          disabled={!editable}
          className="flex-row items-center px-m min-h-[44px] border-r border-border"
          accessibilityLabel={`Selected country: ${country.name}, ${country.dialCode}`}
          accessibilityRole="button"
          accessibilityHint="Double tap to change country"
        >
          <Text className="text-body text-text-primary mr-xs">{country.flag}</Text>
          <Text className="text-body text-text-primary">{country.dialCode}</Text>
          <Text className="text-caption text-text-muted ml-xs">▼</Text>
        </Pressable>

        {/* Phone Number Input */}
        <TextInput
          className="flex-1 px-m py-3 text-body text-text-primary"
          value={value}
          onChangeText={handleChangeText}
          placeholder={getPlaceholder(country.format)}
          placeholderTextColor="#666666"
          keyboardType="phone-pad"
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel="Phone number"
          accessibilityHint="Enter your phone number"
          maxLength={country.format.length}
        />
      </View>

      {/* Error Message */}
      {error && (
        <Text
          className="text-danger text-body-sm mt-xs"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

export default PhoneInput;
