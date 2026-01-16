import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Country, countries, searchCountries } from '@/utils/phone';
import { haptics } from '@/utils/haptics';

interface CountryCodePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
  selectedCountry: Country;
}

export function CountryCodePicker({
  visible,
  onClose,
  onSelect,
  selectedCountry,
}: CountryCodePickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = useMemo(() => {
    return searchCountries(searchQuery);
  }, [searchQuery]);

  const handleSelect = (country: Country) => {
    haptics.selection();
    onSelect(country);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const renderCountryItem = ({ item }: { item: Country }) => {
    const isSelected = item.code === selectedCountry.code;

    return (
      <Pressable
        onPress={() => handleSelect(item)}
        className={`flex-row items-center px-m py-3 border-b border-border ${
          isSelected ? 'bg-surface' : ''
        }`}
        accessibilityLabel={`${item.name}, ${item.dialCode}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <Text className="text-h2 mr-m">{item.flag}</Text>
        <View className="flex-1">
          <Text className="text-body text-text-primary">{item.name}</Text>
          <Text className="text-body-sm text-text-secondary">{item.dialCode}</Text>
        </View>
        {isSelected && (
          <Text className="text-primary text-body">✓</Text>
        )}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Backdrop */}
        <Pressable
          onPress={handleClose}
          className="flex-1 bg-black/50"
          accessibilityLabel="Close country picker"
        />

        {/* Bottom Sheet */}
        <View className="bg-surface-elevated rounded-t-lg max-h-[80%]">
          {/* Handle */}
          <View className="items-center py-s">
            <View className="w-9 h-1 bg-text-muted rounded-full" />
          </View>

          {/* Header */}
          <View className="px-m pb-m">
            <Text className="text-h2 text-text-primary text-center mb-m">
              Select Country
            </Text>

            {/* Search Input */}
            <View className="bg-surface rounded-sm border border-border px-m py-3">
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search countries..."
                placeholderTextColor="#666666"
                className="text-body text-text-primary"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Search countries"
              />
            </View>
          </View>

          {/* Country List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={renderCountryItem}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View className="items-center py-xl">
                <Text className="text-text-secondary text-body">
                  No countries found
                </Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default CountryCodePicker;
