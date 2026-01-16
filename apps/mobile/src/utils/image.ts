import { supabase } from '@/lib/supabase';
import {
  uploadAvatar as uploadAvatarToStorage,
  processImage,
  type UploadResult,
} from '@/lib/storage';

interface ProcessedImage {
  uri: string;
  base64?: string;
}

/**
 * Crop image to square from center and compress
 * Note: expo-image-picker already handles square cropping with allowsEditing + aspect [1,1]
 * This function ensures the final size is correct and applies compression
 */
export async function processAvatarImage(
  uri: string
): Promise<ProcessedImage> {
  const processed = await processImage(uri, 'avatar');
  return {
    uri: processed.uri,
  };
}

/**
 * Upload avatar image to Supabase Storage
 * Uses the centralized storage utility
 */
export async function uploadAvatar(
  userId: string,
  imageUri: string
): Promise<{ url: string | null; error: string | null }> {
  const result = await uploadAvatarToStorage(userId, imageUri);
  return {
    url: result.url,
    error: result.error,
  };
}

/**
 * Update user profile in database
 */
export async function updateUserProfile(
  userId: string,
  displayName: string,
  avatarUrl?: string | null
): Promise<{ success: boolean; error: string | null }> {
  try {
    const updateData: { display_name: string; avatar_url?: string } = {
      display_name: displayName,
    };

    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Failed to save profile. Please try again.' };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Profile update exception:', err);
    return { success: false, error: 'Failed to save profile. Please try again.' };
  }
}
