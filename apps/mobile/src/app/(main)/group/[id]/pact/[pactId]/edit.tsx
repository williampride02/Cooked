import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { usePacts } from '@/hooks/usePacts';
import { useAppStore } from '@/stores/app';
import { haptics } from '@/utils/haptics';
import type { PactWithParticipants, User } from '@/types';

const PROOF_OPTIONS = [
  { value: 'none' as const, label: 'No Proof' },
  { value: 'optional' as const, label: 'Optional' },
  { value: 'required' as const, label: 'Required' },
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

export default function EditPactScreen() {
  const { id: groupId, pactId } = useLocalSearchParams<{ id: string; pactId: string }>();
  const [pact, setPact] = useState<PactWithParticipants | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [proofRequired, setProofRequired] = useState<'none' | 'optional' | 'required'>('optional');
  const [newParticipants, setNewParticipants] = useState<string[]>([]);
  const [relayAssignments, setRelayAssignments] = useState<Record<string, number[]>>({});
  const [members, setMembers] = useState<GroupMemberWithUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  const { fetchPact, updatePact, isLoading, error } = usePacts();
  const user = useAppStore((state) => state.user);

  // Fetch pact and group members
  useEffect(() => {
    async function loadData() {
      if (!pactId || !groupId) return;

      const [pactResult, membersResult] = await Promise.all([
        fetchPact(pactId),
        supabase
          .from('group_members')
          .select(`
            user_id,
            users:user_id (id, display_name, avatar_url)
          `)
          .eq('group_id', groupId),
      ]);

      if (pactResult) {
        setPact(pactResult);
        setName(pactResult.name);
        setDescription(pactResult.description || '');
        setProofRequired(pactResult.proof_required);

        // Initialize relay assignments from existing participants
        if (pactResult.pact_type === 'relay') {
          const assignments: Record<string, number[]> = {};
          pactResult.participants.forEach((p) => {
            if (p.relay_days) {
              assignments[p.user_id] = p.relay_days;
            }
          });
          setRelayAssignments(assignments);
        }
      }

      if (!membersResult.error && membersResult.data) {
        const typedMembers = membersResult.data.map((m) => ({
          user_id: m.user_id,
          user: m.users as unknown as Pick<User, 'id' | 'display_name' | 'avatar_url'>,
        }));
        setMembers(typedMembers);
      }

      setIsLoadingData(false);
    }

    loadData();
  }, [pactId, groupId, fetchPact]);

  // Get existing participant IDs
  const existingParticipantIds = pact?.participants.map((p) => p.user_id) || [];

  // Validation
  const trimmedName = name.trim();
  const isNameValid = trimmedName.length >= 2 && trimmedName.length <= 50;

  // For relay pacts with new participants, ensure each has days assigned
  const isRelayValid = pact?.pact_type !== 'relay' || newParticipants.every(
    (userId) => relayAssignments[userId] && relayAssignments[userId].length > 0
  );

  const isFormValid = isNameValid && isRelayValid;

  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  // Toggle new participant selection
  const toggleNewParticipant = useCallback((userId: string) => {
    haptics.light();
    setNewParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  // Toggle relay day assignment
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

  const handleSave = useCallback(async () => {
    if (!isFormValid || isLoading || !pactId) return;

    Keyboard.dismiss();
    haptics.medium();

    const success = await updatePact({
      pactId,
      name: trimmedName !== pact?.name ? trimmedName : undefined,
      description: description.trim() !== (pact?.description || '') ? description.trim() : undefined,
      proofRequired: proofRequired !== pact?.proof_required ? proofRequired : undefined,
      newParticipantIds: newParticipants.length > 0 ? newParticipants : undefined,
      relayAssignments: pact?.pact_type === 'relay' ? relayAssignments : undefined,
    });

    if (success) {
      haptics.success();
      router.back();
    } else {
      haptics.error();
    }
  }, [
    isFormValid,
    isLoading,
    pactId,
    trimmedName,
    description,
    proofRequired,
    newParticipants,
    relayAssignments,
    pact,
    updatePact,
  ]);

  if (isLoadingData) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  if (!pact) {
    return (
      <SafeAreaView className="flex-1 bg-background">
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
            Edit Pact
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-danger text-body">Pact not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if user is creator
  if (pact.created_by !== user?.id) {
    return (
      <SafeAreaView className="flex-1 bg-background">
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
            Edit Pact
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-danger text-body">Only the pact creator can edit</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get non-participant members for adding
  const availableMembers = members.filter(
    (m) => !existingParticipantIds.includes(m.user_id)
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
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
          Edit Pact
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
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

        {/* Description */}
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

        {/* Proof Required (editable) */}
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

        {/* Non-editable: Frequency and Type */}
        <View className="bg-surface border border-border rounded-md p-m mb-m">
          <Text className="text-caption text-text-muted mb-xs">
            The following cannot be changed for active pacts:
          </Text>
          <Text className="text-body-sm text-text-secondary">
            Frequency: <Text className="text-text-primary capitalize">{pact.frequency}</Text>
          </Text>
          <Text className="text-body-sm text-text-secondary">
            Type: <Text className="text-text-primary capitalize">{pact.pact_type}</Text>
          </Text>
        </View>

        {/* Current Participants (read-only) */}
        <Text className="text-body-sm text-text-secondary mb-xs">
          Current Participants ({pact.participants.length})
        </Text>
        <View className="bg-surface border border-border rounded-md mb-m">
          {pact.participants.map((participant, index) => (
            <View
              key={participant.user_id}
              className={`flex-row items-center p-m ${
                index < pact.participants.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <View className="w-8 h-8 rounded-full bg-surface-elevated items-center justify-center border border-border">
                <Text className="text-text-muted text-body-sm">
                  {participant.user.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="text-body text-text-primary ml-s flex-1">
                {participant.user.display_name}
                {participant.user_id === user?.id && (
                  <Text className="text-text-muted"> (you)</Text>
                )}
              </Text>

              {/* Relay Day Assignment for existing participants */}
              {pact.pact_type === 'relay' && (
                <View className="flex-row flex-wrap gap-xs ml-s">
                  {DAYS.map((day) => {
                    const days = relayAssignments[participant.user_id] || [];
                    return (
                      <Pressable
                        key={day.value}
                        onPress={() => toggleRelayDay(participant.user_id, day.value)}
                        className={`px-xs py-xs rounded-sm border ${
                          days.includes(day.value)
                            ? 'bg-primary/20 border-primary'
                            : 'bg-background border-border'
                        }`}
                        accessibilityLabel={`${day.label}`}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: days.includes(day.value) }}
                      >
                        <Text
                          className={`text-caption ${
                            days.includes(day.value) ? 'text-primary' : 'text-text-muted'
                          }`}
                        >
                          {day.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Add Participants */}
        {availableMembers.length > 0 && (
          <>
            <Text className="text-body-sm text-text-secondary mb-xs">
              Add New Participants
            </Text>
            <View className="bg-surface border border-border rounded-md mb-m">
              {availableMembers.map((member, index) => {
                const isSelected = newParticipants.includes(member.user_id);
                const memberRelayDays = relayAssignments[member.user_id] || [];

                return (
                  <View
                    key={member.user_id}
                    className={index < availableMembers.length - 1 ? 'border-b border-border' : ''}
                  >
                    <Pressable
                      onPress={() => toggleNewParticipant(member.user_id)}
                      className="flex-row items-center p-m"
                      accessibilityLabel={`Add ${member.user.display_name}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                    >
                      <View
                        className={`w-6 h-6 rounded-sm border items-center justify-center mr-s ${
                          isSelected ? 'bg-primary border-primary' : 'border-border'
                        }`}
                      >
                        {isSelected && (
                          <Text className="text-white text-caption">{'\u2713'}</Text>
                        )}
                      </View>
                      <View className="w-8 h-8 rounded-full bg-surface-elevated items-center justify-center border border-border">
                        <Text className="text-text-muted text-body-sm">
                          {member.user.display_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text className="text-body text-text-primary ml-s flex-1">
                        {member.user.display_name}
                      </Text>
                    </Pressable>

                    {/* Relay Day Assignment for new participants */}
                    {pact.pact_type === 'relay' && isSelected && (
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
          </>
        )}

        {/* Error */}
        {error && (
          <Text className="text-danger text-body-sm text-center mb-m">
            {error}
          </Text>
        )}

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={!isFormValid || isLoading}
          className={`py-4 rounded-sm items-center ${
            isFormValid && !isLoading ? 'bg-primary' : 'bg-surface'
          }`}
          accessibilityLabel="Save changes"
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
              Save Changes
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
