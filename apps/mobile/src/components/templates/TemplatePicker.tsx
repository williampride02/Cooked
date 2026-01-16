import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TEMPLATE_CATEGORIES,
  BUILT_IN_TEMPLATES,
  getTemplatesByCategory,
  type PactTemplate,
  type TemplateCategory,
} from '@/lib/pactTemplates';
import { useTemplates } from '@/hooks/useTemplates';
import { haptics } from '@/utils/haptics';

interface TemplatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: PactTemplate) => void;
}

export function TemplatePicker({
  visible,
  onClose,
  onSelectTemplate,
}: TemplatePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('fitness');
  const { userTemplates, isLoading } = useTemplates();

  const handleSelectCategory = useCallback((category: TemplateCategory) => {
    haptics.light();
    setSelectedCategory(category);
  }, []);

  const handleSelectTemplate = useCallback((template: PactTemplate) => {
    haptics.medium();
    onSelectTemplate(template);
    onClose();
  }, [onSelectTemplate, onClose]);

  const handleStartFromScratch = useCallback(() => {
    haptics.light();
    onClose();
  }, [onClose]);

  // Get templates for selected category
  const displayTemplates = selectedCategory === 'custom'
    ? userTemplates
    : getTemplatesByCategory(selectedCategory);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-m py-s border-b border-border">
          <Pressable
            onPress={onClose}
            className="w-11 h-11 items-center justify-center -ml-s"
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Text className="text-text-primary text-h2">{'\u2715'}</Text>
          </Pressable>
          <Text className="text-h2 text-text-primary font-semibold">
            Choose Template
          </Text>
          <View className="w-11" />
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-border"
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
        >
          {TEMPLATE_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <Pressable
                key={category.id}
                onPress={() => handleSelectCategory(category.id)}
                className={`flex-row items-center px-m py-s rounded-full mr-s ${
                  isSelected ? 'bg-primary/20' : 'bg-surface'
                }`}
                accessibilityLabel={category.name}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Text className="mr-xs">{category.icon}</Text>
                <Text
                  className={`text-body-sm font-medium ${
                    isSelected ? 'text-primary' : 'text-text-primary'
                  }`}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Templates Grid */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
        >
          {isLoading && selectedCategory === 'custom' ? (
            <View className="flex-1 items-center justify-center py-xl">
              <ActivityIndicator color="rgb(255, 77, 0)" />
            </View>
          ) : displayTemplates.length === 0 ? (
            <View className="items-center justify-center py-xl">
              <Text className="text-h1 mb-m">{'\u{2B50}'}</Text>
              <Text className="text-text-secondary text-body text-center mb-s">
                No saved templates yet
              </Text>
              <Text className="text-text-muted text-body-sm text-center">
                Create a pact and save it as a template{'\n'}for quick access later
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {displayTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onPress={() => handleSelectTemplate(template)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Start from scratch button */}
        <View className="px-m pb-m border-t border-border pt-m">
          <Pressable
            onPress={handleStartFromScratch}
            className="py-4 rounded-sm items-center bg-surface border border-border"
            accessibilityLabel="Start from scratch"
            accessibilityRole="button"
          >
            <Text className="text-body text-text-primary font-medium">
              Start from Scratch
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

interface TemplateCardProps {
  template: PactTemplate;
  onPress: () => void;
}

function TemplateCard({ template, onPress }: TemplateCardProps) {
  const frequencyLabel = template.suggestedFrequency === 'custom'
    ? `${template.suggestedFrequencyDays?.length || 0}x/week`
    : template.suggestedFrequency;

  const roastEmoji = template.suggestedRoastLevel === 1
    ? '\u{1F336}'
    : template.suggestedRoastLevel === 2
    ? '\u{1F336}\u{1F336}'
    : '\u{1F336}\u{1F336}\u{1F336}';

  return (
    <Pressable
      onPress={onPress}
      className="w-[48%] bg-surface border border-border rounded-md p-m mb-m"
      accessibilityLabel={template.name}
      accessibilityRole="button"
    >
      {/* Icon */}
      <Text className="text-3xl mb-s">{template.icon}</Text>

      {/* Name */}
      <Text className="text-body font-semibold text-text-primary mb-xs" numberOfLines={1}>
        {template.name}
      </Text>

      {/* Description */}
      <Text className="text-caption text-text-muted mb-s" numberOfLines={2}>
        {template.description}
      </Text>

      {/* Tags */}
      <View className="flex-row flex-wrap gap-xs">
        <View className="bg-background rounded-sm px-xs py-[2px]">
          <Text className="text-caption text-text-secondary capitalize">
            {frequencyLabel}
          </Text>
        </View>
        <View className="bg-background rounded-sm px-xs py-[2px]">
          <Text className="text-caption">{roastEmoji}</Text>
        </View>
        {template.suggestedProofRequired === 'required' && (
          <View className="bg-background rounded-sm px-xs py-[2px]">
            <Text className="text-caption text-text-secondary">{'\u{1F4F7}'}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default TemplatePicker;
