import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { usePacts } from '@/hooks/usePacts';
import { useCheckIns } from '@/hooks/useCheckIns';
import { useRoastThreads } from '@/hooks/useRoastThreads';
import { useAchievements } from '@/hooks/useAchievements';
import { uploadProof } from '@/lib/storage';
import { useAppStore } from '@/stores/app';
import { haptics } from '@/utils/haptics';
import type { PactWithParticipants } from '@/types';

const PRESET_EXCUSES = [
  { id: 'long_day', label: 'Long day' },
  { id: 'forgot', label: 'Forgot' },
  { id: 'honest', label: "Be honest, I just didn't want to" },
  { id: 'something_came_up', label: 'Something came up' },
];

export default function CheckInScreen() {
  const { id: groupId, pactId, status } = useLocalSearchParams<{
    id: string;
    pactId: string;
    status: 'success' | 'fold';
  }>();

  const [pact, setPact] = useState<PactWithParticipants | null>(null);
  const [selectedExcuse, setSelectedExcuse] = useState<string | null>(null);
  const [customExcuse, setCustomExcuse] = useState('');
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { fetchPact, isLoading: isLoadingPact } = usePacts();
  const { createCheckIn, isLoading: isCheckingIn, error } = useCheckIns();
  const { createRoastThread } = useRoastThreads();
  const { fetchAchievements, checkAndUnlockAchievements } = useAchievements();
  const user = useAppStore((state) => state.user);

  const isFolding = status === 'fold';

  useEffect(() => {
    async function loadPact() {
      if (!pactId) return;
      const result = await fetchPact(pactId);
      setPact(result);
    }
    loadPact();
  }, [pactId, fetchPact]);

  const handleBack = useCallback(() => {
    haptics.light();
    router.back();
  }, []);

  const handleSelectExcuse = useCallback((excuseId: string) => {
    haptics.light();
    setSelectedExcuse(excuseId);
    if (excuseId !== 'custom') {
      setCustomExcuse('');
    }
  }, []);

  const handlePickImage = useCallback(async () => {
    haptics.light();

    const { status: permissionStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionStatus !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to add proof.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setProofUri(result.assets[0].uri);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    haptics.light();

    const { status: permissionStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionStatus !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera to take a proof photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setProofUri(result.assets[0].uri);
    }
  }, []);

  const handleRemoveProof = useCallback(() => {
    haptics.light();
    setProofUri(null);
  }, []);

  const handleUploadProof = useCallback(async (uri: string): Promise<string | null> => {
    if (!user || !pactId) return null;

    const result = await uploadProof(user.id, pactId, uri);
    if (result.error) {
      console.error('Upload error:', result.error);
      return null;
    }

    return result.url;
  }, [user, pactId]);

  const handleSubmit = useCallback(async () => {
    if (!pactId) return;

    Keyboard.dismiss();
    haptics.medium();

    // Validate for fold
    if (isFolding && !selectedExcuse) {
      Alert.alert('Select an excuse', 'Please select why you folded.');
      return;
    }

    setIsUploading(true);

    // Upload proof if provided
    let proofUrl: string | undefined;
    if (proofUri) {
      const uploadedUrl = await handleUploadProof(proofUri);
      if (!uploadedUrl) {
        setIsUploading(false);
        Alert.alert(
          'Upload Failed',
          'Failed to upload proof photo. Would you like to continue without proof?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: () => {
                // Re-trigger submit without proof
                setProofUri(null);
                handleSubmit();
              },
            },
          ]
        );
        return;
      }
      proofUrl = uploadedUrl;
    }

    // Determine excuse text
    let excuseText: string | undefined;
    if (isFolding && selectedExcuse) {
      if (selectedExcuse === 'custom') {
        excuseText = customExcuse.trim() || 'Custom excuse';
      } else {
        const preset = PRESET_EXCUSES.find((e) => e.id === selectedExcuse);
        excuseText = preset?.label;
      }
    }

    const result = await createCheckIn({
      pactId,
      status: isFolding ? 'fold' : 'success',
      excuse: excuseText,
      proofUrl,
    });

    setIsUploading(false);

    if (result) {
      // Create roast thread if folding
      if (isFolding) {
        haptics.warning();
        await createRoastThread(result.id);
      } else {
        // Use celebration pattern for success check-ins
        haptics.celebration();
      }

      // Check for newly unlocked achievements
      // Refresh stats first, then check for unlocks
      await fetchAchievements();
      await checkAndUnlockAchievements();

      // Go back to pacts list
      router.back();
    } else {
      haptics.error();
    }
  }, [pactId, isFolding, selectedExcuse, customExcuse, proofUri, handleUploadProof, createCheckIn, createRoastThread, fetchAchievements, checkAndUnlockAchievements]);

  if (isLoadingPact && !pact) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="rgb(255, 77, 0)" size="large" />
      </SafeAreaView>
    );
  }

  const isFormValid = isFolding ? !!selectedExcuse : true;
  const isProcessing = isCheckingIn || isUploading;

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
        <View className="flex-1 ml-s">
          <Text className="text-h2 text-text-primary font-semibold">
            {isFolding ? 'Fold Check-in' : 'Success Check-in'}
          </Text>
          {pact && (
            <Text className="text-body-sm text-text-muted">{pact.name}</Text>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Status Indicator */}
        <View className={`items-center py-l mb-m rounded-md ${isFolding ? 'bg-danger/10' : 'bg-success/10'}`}>
          <Text className="text-4xl mb-s">
            {isFolding ? '\u{1F614}' : '\u{1F4AA}'}
          </Text>
          <Text className={`text-h2 font-bold ${isFolding ? 'text-danger' : 'text-success'}`}>
            {isFolding ? "It's okay, we all fold sometimes" : "Let's go!"}
          </Text>
        </View>

        {/* Excuse Selection (Fold only) */}
        {isFolding && (
          <>
            <Text className="text-body-sm text-text-secondary mb-xs">
              Why did you fold?
            </Text>
            <View className="mb-m">
              {PRESET_EXCUSES.map((excuse) => (
                <Pressable
                  key={excuse.id}
                  onPress={() => handleSelectExcuse(excuse.id)}
                  className={`flex-row items-center p-m mb-s rounded-sm border ${
                    selectedExcuse === excuse.id
                      ? 'bg-primary/20 border-primary'
                      : 'bg-surface border-border'
                  }`}
                  accessibilityLabel={excuse.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedExcuse === excuse.id }}
                >
                  <View
                    className={`w-6 h-6 rounded-full border items-center justify-center mr-s ${
                      selectedExcuse === excuse.id
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}
                  >
                    {selectedExcuse === excuse.id && (
                      <View className="w-3 h-3 rounded-full bg-white" />
                    )}
                  </View>
                  <Text
                    className={`text-body ${
                      selectedExcuse === excuse.id ? 'text-primary' : 'text-text-primary'
                    }`}
                  >
                    {excuse.label}
                  </Text>
                </Pressable>
              ))}

              {/* Custom Excuse */}
              <Pressable
                onPress={() => handleSelectExcuse('custom')}
                className={`p-m rounded-sm border ${
                  selectedExcuse === 'custom'
                    ? 'bg-primary/20 border-primary'
                    : 'bg-surface border-border'
                }`}
                accessibilityLabel="Custom excuse"
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedExcuse === 'custom' }}
              >
                <View className="flex-row items-center mb-s">
                  <View
                    className={`w-6 h-6 rounded-full border items-center justify-center mr-s ${
                      selectedExcuse === 'custom'
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}
                  >
                    {selectedExcuse === 'custom' && (
                      <View className="w-3 h-3 rounded-full bg-white" />
                    )}
                  </View>
                  <Text
                    className={`text-body ${
                      selectedExcuse === 'custom' ? 'text-primary' : 'text-text-primary'
                    }`}
                  >
                    Custom
                  </Text>
                </View>
                {selectedExcuse === 'custom' && (
                  <TextInput
                    className="text-body text-text-primary bg-background rounded-sm px-m py-s border border-border"
                    placeholder="Type your excuse..."
                    placeholderTextColor="#666666"
                    value={customExcuse}
                    onChangeText={setCustomExcuse}
                    maxLength={100}
                    multiline
                    editable={!isProcessing}
                  />
                )}
              </Pressable>
            </View>
          </>
        )}

        {/* Proof Photo (Success or Optional) */}
        {(!isFolding || pact?.proof_required !== 'none') && (
          <>
            <Text className="text-body-sm text-text-secondary mb-xs">
              Proof Photo{' '}
              {pact?.proof_required === 'required' ? '(Required)' : '(Optional)'}
            </Text>
            <View className="mb-m">
              {proofUri ? (
                <View className="relative">
                  <Image
                    source={{ uri: proofUri }}
                    className="w-full h-48 rounded-md"
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={handleRemoveProof}
                    className="absolute top-s right-s bg-danger rounded-full w-8 h-8 items-center justify-center"
                    accessibilityLabel="Remove proof"
                    accessibilityRole="button"
                  >
                    <Text className="text-white text-body">{'\u00D7'}</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row gap-s">
                  <Pressable
                    onPress={handleTakePhoto}
                    className="flex-1 py-l items-center bg-surface border border-border rounded-sm"
                    accessibilityLabel="Take photo"
                    accessibilityRole="button"
                  >
                    <Text className="text-2xl mb-xs">{'\u{1F4F7}'}</Text>
                    <Text className="text-body-sm text-text-primary">Take Photo</Text>
                  </Pressable>
                  <Pressable
                    onPress={handlePickImage}
                    className="flex-1 py-l items-center bg-surface border border-border rounded-sm"
                    accessibilityLabel="Choose from gallery"
                    accessibilityRole="button"
                  >
                    <Text className="text-2xl mb-xs">{'\u{1F5BC}'}</Text>
                    <Text className="text-body-sm text-text-primary">Gallery</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </>
        )}

        {/* Warning for required proof */}
        {!isFolding && pact?.proof_required === 'required' && !proofUri && (
          <View className="bg-warning/10 border border-warning/30 rounded-sm p-m mb-m">
            <Text className="text-warning text-body-sm">
              {'\u26A0'} Proof is required for this pact. You can still submit without it, but it will be flagged.
            </Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <Text className="text-danger text-body-sm text-center mb-m">
            {error}
          </Text>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!isFormValid || isProcessing}
          className={`py-4 rounded-sm items-center ${
            isFormValid && !isProcessing
              ? isFolding
                ? 'bg-danger'
                : 'bg-success'
              : 'bg-surface'
          }`}
          accessibilityLabel={isFolding ? 'Submit fold' : 'Submit check-in'}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isFormValid || isProcessing }}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className={`text-body font-semibold ${
                isFormValid ? 'text-white' : 'text-text-muted'
              }`}
            >
              {isFolding ? 'Submit Fold' : 'Submit Check-in'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
