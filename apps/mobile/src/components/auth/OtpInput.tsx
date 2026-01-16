import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { haptics } from '@/utils/haptics';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
}: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Split value into array of digits
  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  // Focus first empty input on mount
  useEffect(() => {
    if (!disabled) {
      const firstEmptyIndex = digits.findIndex((d) => d === '');
      const indexToFocus = firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex;
      inputRefs.current[indexToFocus]?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, length]);

  // Auto-submit when complete
  useEffect(() => {
    if (value.length === length) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const handleChange = (text: string, index: number) => {
    // Only accept single digit
    const digit = text.replace(/\D/g, '').slice(-1);

    if (digit) {
      // Light haptic on each digit entry
      haptics.light();

      // Update value
      const newDigits = [...digits];
      newDigits[index] = digit;
      const newValue = newDigits.join('');
      onChange(newValue);

      // Move to next input
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        // Current box empty, move to previous and clear it
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      } else if (digits[index] !== '') {
        // Clear current box
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handlePress = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const getBorderColor = (index: number) => {
    if (error) return 'border-danger';
    if (focusedIndex === index) return 'border-primary';
    if (digits[index]) return 'border-border';
    return 'border-border';
  };

  return (
    <View className="flex-row justify-center gap-s">
      {digits.map((digit, index) => (
        <Pressable
          key={index}
          onPress={() => handlePress(index)}
          disabled={disabled}
        >
          <View
            className={`w-11 h-14 bg-surface border rounded-sm items-center justify-center ${getBorderColor(index)}`}
          >
            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              className="text-h1 text-text-primary text-center w-full h-full"
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => handleFocus(index)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!disabled}
              selectTextOnFocus
              accessibilityLabel={`Digit ${index + 1} of ${length}`}
              accessibilityHint={digit ? `Current value: ${digit}` : 'Empty'}
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export default OtpInput;
