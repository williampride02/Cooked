import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { processAvatarImage } from '@/utils/image';
import { haptics } from '@/utils/haptics';

interface AvatarPickerProps {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  disabled?: boolean;
}

export function AvatarPicker({
  imageUri,
  onImageSelected,
  disabled = false,
}: AvatarPickerProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const requestPermission = useCallback(async (
    type: 'camera' | 'gallery'
  ): Promise<boolean> => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to take a photo.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library access is needed to select a photo.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  }, []);

  const handleImageSelected = useCallback(async (uri: string) => {
    setIsProcessing(true);
    try {
      const processed = await processAvatarImage(uri);
      onImageSelected(processed.uri);
      haptics.success();
    } catch (error) {
      console.error('Image processing error:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
      haptics.error();
    } finally {
      setIsProcessing(false);
    }
  }, [onImageSelected]);

  const pickFromCamera = useCallback(async () => {
    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageSelected(result.assets[0].uri);
    }
  }, [requestPermission, handleImageSelected]);

  const pickFromGallery = useCallback(async () => {
    const hasPermission = await requestPermission('gallery');
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageSelected(result.assets[0].uri);
    }
  }, [requestPermission, handleImageSelected]);

  const handlePress = useCallback(() => {
    if (disabled || isProcessing) return;
    haptics.light();

    Alert.alert(
      'Add Photo',
      'Choose how to add your profile photo',
      [
        { text: 'Take Photo', onPress: pickFromCamera },
        { text: 'Choose from Library', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }, [disabled, isProcessing, pickFromCamera, pickFromGallery]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isProcessing}
      accessibilityLabel={imageUri ? 'Change profile photo' : 'Add profile photo'}
      accessibilityRole="button"
      accessibilityHint="Opens options to take a photo or choose from gallery"
    >
      <View className="items-center">
        {/* Avatar circle */}
        <View
          className={`w-24 h-24 rounded-full items-center justify-center overflow-hidden ${
            imageUri ? '' : 'border-2 border-dashed border-border bg-surface'
          }`}
        >
          {isProcessing ? (
            <ActivityIndicator color="rgb(255, 77, 0)" />
          ) : imageUri ? (
            <Image
              source={{ uri: imageUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-h1 text-text-muted">+</Text>
          )}
        </View>

        {/* Helper text */}
        <Text className="text-body-sm text-text-muted mt-s">
          {imageUri ? 'tap to change' : 'tap to add photo'}
        </Text>
      </View>
    </Pressable>
  );
}

export default AvatarPicker;
