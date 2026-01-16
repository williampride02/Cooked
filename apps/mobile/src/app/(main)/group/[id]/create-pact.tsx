import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { usePacts } from '@/hooks/usePacts';
import { useTemplates } from '@/hooks/useTemplates';
import { usePactLimit } from '@/hooks/useSubscription';
import { useAppStore } from '@/stores/app';
import { haptics } from '@/utils/haptics';
import { LimitReached } from '@/components/premium';
import { TemplatePicker } from '@/components/templates';
import type { PactTemplate } from '@/lib/pactTemplates';
import type { User } from '@/types';

const ROAST_LEVELS = [
  { level: 1 as const, label: 'Mild', emoji: '\u{1F336}' },
  { level: 2 as const, label: 'Medium', emoji: '\u{1F336}\u{1F336}' },
  { level: 3 as const, label: 'Nuclear', emoji: '\u{1F336}\u{1F336}\u{1F336}' },
];

const FREQUENCIES = [
  { value: 'daily' as const, label: 'Daily' },
  { value: 'weekly' as const, label: 'Weekly' },
  { value: 'custom' as const, label: 'Custom' },
];

const PROOF_OPTIONS = [
  { value: 'none' as const, label: 'No Proof' },
  { value: 'optional' as const, label: 'Optional' },
  { value: 'required' as const, label: 'Required' },
];

const PACT_TYPES = [
  {
    value: 'individual' as const,
    label: 'Individual',
    emoji: '\u{1F464}',
    description: 'Each person tracks their own progress',
  },
  {
    value: 'group' as const,
    label: 'Group',
    emoji: '\u{1F465}',
    description: 'Everyone must check in for group streak',
  },
  {
    value: 'relay' as const,
    label: 'Relay',
    emoji: '\u{1F3C3}',
    description: 'Take turns on assigned days',
  },
];

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

interface GroupMemberWithUser {
  user_id: string;
  user: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
}

export default function CreatePactScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>([1, 3, 5]);
  const [roastLevel, setRoastLevel] = useState<1 | 2 | 3>(2);
  const [proofRequired, setProofRequired] = useState<'none' | 'optional' | 'required'>('optional');
  const [pactType, setPactType] = useState<'individual' | 'group' | 'relay'>('individual');
  const [relayAssignments, setRelayAssignments] = useState<Record<string, number[]>>({});
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [members, setMembers] = useState<GroupMemberWithUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(true); // Show on first load
  const [selectedTemplate, setSelectedTemplate] = useState<PactTemplate | null>(null);

  const { createPact, isLoading, error } = usePacts();
  const { saveAsTemplate, isLoading: isSavingTemplate } = useTemplates();
  const { currentCount, maxCount, canCreate, isLoading: isLoadingLimit } = usePactLimit(groupId || null);
  const user = useAppStore((state) => state.user);

  // Fetch group members
  useEffect(() => {
    async function fetchMembers() {
      if (!groupId) return;

      const { data, error: fetchError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          users:user_id (id, display_name, avatar_url)
        `)
        .eq('group_id', groupId);

      if (fetchError) {
        console.error('Fetch members error:', fetchError);
      } else {
        const typedMembers = (data || []).map((m) => ({
          user_id: m.user_id,
          user: m.users as unknown as Pick<User, 'id' | 'display_name' | 'avatar_url'>,
        }));
        setMembers(typedMembers);
        // Auto-select current user
        if (user) {
          setSelectedParticipants([user.id]);
        }
      }
      setIsLoadingMembers(false);
    }

    fetchMembers();
  }, [groupId, user]);

  // Apply template settings
  const handleSelectTemplate = useCallback((template: PactTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setFrequency(template.suggestedFrequency);
    if (template.suggestedFrequencyDays) {
      setFrequencyDays(template.suggestedFrequencyDays);
    }
    setRoastLevel(template.suggestedRoastLevel);
    setProofRequired(template.suggestedProofRequired);
    setPactType(template.suggestedPactType);
    haptics.success();
  }, []);

  // Handle save as template
  const handleSaveAsTemplate = useCallback(async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Please enter a valid pact name first.');
      return;
    }

    haptics.medium();
    const template = await saveAsTemplate({
      name: trimmedName,
      description: description.trim() || undefined,
      frequency,
      frequencyDays: frequency === 'custom' ? frequencyDays : undefined,
      roastLevel,
      proofRequired,
      pactType,
    });

    if (template) {
      haptics.success();
      Alert.alert('Template Saved', 'Your pact has been saved as a template for quick access later.');
    } else {
      haptics.error();
      Alert.alert('Error', 'Failed to save template. Please try again.');
    }
  }, [name, description, frequency, frequencyDays, roastLevel, proofRequired, pactType, saveAsTemplate]);

  // Validation
  const trimmedName = name.trim();
  const isNameValid = trimmedName.length >= 2 && trimmedName.length <= 50;
  const hasParticipants = selectedParticipants.length > 0;

  // For relay pacts, ensure each participant has at least one day assigned
  const isRelayValid = pactType !== 'relay' || selectedParticipants.every(
    (userId) => relayAssignments[userId] && relayAssignments[userId].length > 0
  );

  const isFormValid = isNameValid && hasParticipants && isRelayValid && canCreate;

  // Handle back
  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  // Toggle participant selection
  const toggleParticipant = useCallback((userId: string) => {
    haptics.light();
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  // Toggle day selection
  const toggleDay = useCallback((day: number) => {
    haptics.light();
    setFrequencyDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort()
    );
  }, []);

  // Toggle relay day assignment for a participant
  const toggleRelayDay = useCallback((userId: string, day: number) => {
    haptics.light();
    setRelayAssignments((prev) => {
      const currentDays = prev[userId] || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day].sort();
      return { ...prev, [userId]: newDays };
    });
  }, []);

  // Handle create
  const handleCreate = useCallback(async () => {
    if (!isFormValid || isLoading || !groupId) return;

    Keyboard.dismiss();
    haptics.medium();

    const pact = await createPact({
      groupId,
      name: trimmedName,
      description: description.trim() || undefined,
      frequency,
      frequencyDays: frequency === 'custom' ? frequencyDays : undefined,
      roastLevel,
      proofRequired,
      pactType,
      participantIds: selectedParticipants,
      relayAssignments: pactType === 'relay' ? relayAssignments : undefined,
    });

    if (pact) {
      haptics.success();
      router.back();
    } else {
      haptics.error();
    }
  }, [
    isFormValid,
    isLoading,
    groupId,
    trimmedName,
    description,
    frequency,
    frequencyDays,
    roastLevel,
    proofRequired,
    pactType,
    relayAssignments,
    selectedParticipants,
    createPact,
  ]);

  if (isLoadingMembers || isLoadingLimit) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Template Picker Modal */}
      <TemplatePicker
        visible={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-m py-s border-b border-border">
        <View className="flex-row items-center">
          <Pressable
            onPress={handleBack}
            className="w-11 h-11 items-center justify-center -ml-s"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text className="text-text-primary text-h2">{'\u2190'}</Text>
          </Pressable>
          <Text className="text-h2 text-text-primary font-semibold ml-s">
            Create Pact
          </Text>
        </View>
        <Pressable
          onPress={() => setShowTemplatePicker(true)}
          className="px-s py-xs bg-surface border border-border rounded-sm"
          accessibilityLabel="Browse templates"
          accessibilityRole="button"
        >
          <Text className="text-body-sm text-text-secondary">
            {'\u{1F4CB}'} Templates
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Selected Template Banner */}
        {selectedTemplate && (
          <View className="bg-primary/10 border border-primary/30 rounded-md p-m mb-m flex-row items-center">
            <Text className="text-xl mr-s">{selectedTemplate.icon}</Text>
            <View className="flex-1">
              <Text className="text-body-sm text-primary font-medium">
                Using template
              </Text>
              <Text className="text-caption text-text-secondary">
                {selectedTemplate.name}
              </Text>
            </View>
            <Pressable
              onPress={() => setSelectedTemplate(null)}
              className="p-xs"
              accessibilityLabel="Clear template"
            >
              <Text className="text-text-muted">{'\u2715'}</Text>
            </Pressable>
          </View>
        )}

        {/* Pact Limit Warning */}
        {!canCreate && (
          <View className="mb-m">
            <LimitReached limitType="pacts" current={currentCount} max={maxCount} />
          </View>
        )}

        {/* Pact Name */}
        <Text className="text-body-sm text-text-secondary mb-xs">
          Pact Name *
        </Text>
        <View
          className={`bg-surface border rounded-sm px-m py-3 mb-m ${
            isFocused ? 'border-primary' : 'border-border'
          }`}
        >
          <TextInput
            className="text-body text-text-primary"
            placeholder="e.g., Morning Workout"
            placeholderTextColor="#666666"
            value={name}
            onChangeText={setName}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={50}
            autoCapitalize="words"
            editable={!isLoading}
            accessibilityLabel="Pact name"
          />
        </View>

        {/* Description (optional) */}
        <Text className="text-body-sm text-text-secondary mb-xs">
          Description (optional)
        </Text>
        <View className="bg-surface border border-border rounded-sm px-m py-3 mb-m">
          <TextInput
            className="text-body text-text-primary"
            placeholder="What's this pact about?"
            placeholderTextColor="#666666"
            value={description}
            onChangeText={setDescription}
            maxLength={200}
            multiline
            numberOfLines={2}
            editable={!isLoading}
            accessibilityLabel="Pact description"
          />
        </View>

        {/* Frequency */}
        <Text className="text-body-sm text-text-secondary mb-xs">
          Frequency
        </Text>
        <View className="flex-row gap-s mb-m">
          {FREQUENCIES.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => {
                haptics.light();
                setFrequency(f.value);
              }}
              className={`flex-1 py-3 rounded-sm items-center border ${
                frequency === f.value
                  ? 'bg-primary/20 border-primary'
                  : 'bg-surface border-border'
              }`}
              accessibilityLabel={f.label}
              accessibilityRole="button"
              accessibilityState={{ selected: frequency === f.value }}
            >
              <Text
                className={`text-body-sm font-semibold ${
                  frequency === f.value ? 'text-primary' : 'text-text-primary'
                }`}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Custom Days (if custom frequency) */}
        {frequency === 'custom' && (
          <>
            <Text className="text-body-sm text-text-secondary mb-xs">
              Select Days
            </Text>
            <View className="flex-row flex-wrap gap-xs mb-m">
              {DAYS.map((day) => (
                <Pressable
                  key={day.value}
                  onPress={() => toggleDay(day.value)}
                  className={`px-m py-s rounded-sm border ${
                    frequencyDays.includes(day.value)
                      ? 'bg-primary/20 border-primary'
                      : 'bg-surface border-border'
                  }`}
                  accessibilityLabel={day.label}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: frequencyDays.includes(day.value) }}
                >
                  <Text
                    className={`text-body-sm ${
                      frequencyDays.includes(day.value)
                        ? 'text-primary'
                        : 'text-text-primary'
                    }`}
                  >
                    {day.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Roast Level */}
        <Text className="text-body-sm text-text-secondary mb-xs">
          Roast Level
        </Text>
        <View className="flex-row gap-s mb-m">
          {ROAST_LEVELS.map((r) => (
            <Pressable
              key={r.level}
              onPress={() => {
                haptics.light();
                setRoastLevel(r.level);
              }}
              className={`flex-1 py-3 rounded-sm items-center border ${
                roastLevel === r.level
                  ? 'bg-primary/20 border-primary'
                  : 'bg-surface border-border'
              }`}
              accessibilityLabel={`${r.label} roast level`}
              accessibilityRole="button"
              accessibilityState={{ selected: roastLevel === r.level }}
            >
              <Text className="text-body mb-xs">{r.emoji}</Text>
              <Text
                className={`text-caption ${
                  roastLevel === r.level ? 'text-primary' : 'text-text-muted'
                }`}
              >
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Proof Required */}
        <Text className="text-body-sm text-text-secondary mb-xs">
          Proof Photo
        </Text>
        <View className="flex-row gap-s mb-m">
          {PROOF_OPTIONS.map((p) => (
            <Pressable
              key={p.value}
              onPress={() => {
                haptics.light();
                setProofRequired(p.value);
              }}
              className={`flex-1 py-3 rounded-sm items-center border ${
                proofRequired === p.value
                  ? 'bg-primary/20 border-primary'
                  : 'bg-surface border-border'
              }`}
              accessibilityLabel={p.label}
              accessibilityRole="button"
              accessibilityState={{ selected: proofRequired === p.value }}
            >
              <Text
                className={`text-body-sm ${
                  proofRequired === p.value ? 'text-primary' : 'text-text-primary'
                }`}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Pact Type */}
        <Text className="text-body-sm text-text-secondary mb-xs">
          Pact Type
        </Text>
        <View className="gap-s mb-m">
          {PACT_TYPES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => {
                haptics.light();
                setPactType(t.value);
              }}
              className={`flex-row items-center p-m rounded-sm border ${
                pactType === t.value
                  ? 'bg-primary/20 border-primary'
                  : 'bg-surface border-border'
              }`}
              accessibilityLabel={t.label}
              accessibilityRole="button"
              accessibilityState={{ selected: pactType === t.value }}
            >
              <Text className="text-h2 mr-s">{t.emoji}</Text>
              <View className="flex-1">
                <Text
                  className={`text-body font-semibold ${
                    pactType === t.value ? 'text-primary' : 'text-text-primary'
                  }`}
                >
                  {t.label}
                </Text>
                <Text className="text-caption text-text-muted">
                  {t.description}
                </Text>
              </View>
              {pactType === t.value && (
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                  <Text className="text-white text-caption">{'\u2713'}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Participants */}
        <Text className="text-body-sm text-text-secondary mb-xs">
          Participants *{pactType === 'relay' && ' (assign days for each)'}
        </Text>
        <View className="bg-surface border border-border rounded-md mb-m">
          {members.map((member, index) => {
            const isSelected = selectedParticipants.includes(member.user_id);
            const isCurrentUser = member.user_id === user?.id;
            const memberRelayDays = relayAssignments[member.user_id] || [];

            return (
              <View
                key={member.user_id}
                className={index < members.length - 1 ? 'border-b border-border' : ''}
              >
                <Pressable
                  onPress={() => toggleParticipant(member.user_id)}
                  className="flex-row items-center p-m"
                  accessibilityLabel={`Select ${member.user.display_name}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  {/* Checkbox */}
                  <View
                    className={`w-6 h-6 rounded-sm border items-center justify-center mr-s ${
                      isSelected ? 'bg-primary border-primary' : 'border-border'
                    }`}
                  >
                    {isSelected && (
                      <Text className="text-white text-caption">{'\u2713'}</Text>
                    )}
                  </View>

                  {/* Avatar */}
                  <View className="w-8 h-8 rounded-full bg-surface-elevated items-center justify-center border border-border">
                    <Text className="text-text-muted text-body-sm">
                      {member.user.display_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  {/* Name */}
                  <Text className="text-body text-text-primary ml-s flex-1">
                    {member.user.display_name}
                    {isCurrentUser && (
                      <Text className="text-text-muted"> (you)</Text>
                    )}
                  </Text>
                </Pressable>

                {/* Relay Day Assignment */}
                {pactType === 'relay' && isSelected && (
                  <View className="px-m pb-m">
                    <Text className="text-caption text-text-muted mb-xs">
                      Assigned days:
                    </Text>
                    <View className="flex-row flex-wrap gap-xs">
                      {DAYS.map((day) => (
                        <Pressable
                          key={day.value}
                          onPress={() => toggleRelayDay(member.user_id, day.value)}
                          className={`px-s py-xs rounded-sm border ${
                            memberRelayDays.includes(day.value)
                              ? 'bg-primary/20 border-primary'
                              : 'bg-background border-border'
                          }`}
                          accessibilityLabel={`${day.label} for ${member.user.display_name}`}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: memberRelayDays.includes(day.value) }}
                        >
                          <Text
                            className={`text-caption ${
                              memberRelayDays.includes(day.value)
                                ? 'text-primary'
                                : 'text-text-muted'
                            }`}
                          >
                            {day.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    {memberRelayDays.length === 0 && (
                      <Text className="text-caption text-danger mt-xs">
                        Select at least one day
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Error */}
        {error && (
          <Text className="text-danger text-body-sm text-center mb-m">
            {error}
          </Text>
        )}

        {/* Save as Template Button */}
        {isNameValid && !selectedTemplate?.isBuiltIn && (
          <Pressable
            onPress={handleSaveAsTemplate}
            disabled={isSavingTemplate}
            className="py-3 rounded-sm items-center border border-border bg-surface mb-s"
            accessibilityLabel="Save as template"
            accessibilityRole="button"
          >
            {isSavingTemplate ? (
              <ActivityIndicator color="#666666" size="small" />
            ) : (
              <Text className="text-body-sm text-text-secondary">
                {'\u{2B50}'} Save as Template
              </Text>
            )}
          </Pressable>
        )}

        {/* Create Button */}
        <Pressable
          onPress={handleCreate}
          disabled={!isFormValid || isLoading}
          className={`py-4 rounded-sm items-center ${
            isFormValid && !isLoading ? 'bg-primary' : 'bg-surface'
          }`}
          accessibilityLabel="Create pact"
          accessibilityRole="button"
          accessibilityState={{ disabled: !isFormValid || isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className={`text-body font-semibold ${
                isFormValid ? 'text-white' : 'text-text-muted'
              }`}
            >
              Create Pact
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
