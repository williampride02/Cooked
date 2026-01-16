/**
 * Supabase Storage utility for handling image uploads
 * Supports avatars, proofs, and roast images with compression
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

// Storage bucket names
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  PROOFS: 'proofs',
  ROASTS: 'roasts',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

// Image configuration
const IMAGE_CONFIG = {
  avatar: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.8,
    maxSizeBytes: 1024 * 1024, // 1MB
  },
  proof: {
    maxWidth: 1200,
    maxHeight: 900,
    quality: 0.7,
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
  },
  roast: {
    maxWidth: 1200,
    maxHeight: 900,
    quality: 0.7,
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
  },
} as const;

export type ImageType = keyof typeof IMAGE_CONFIG;

export interface UploadResult {
  url: string | null;
  path: string | null;
  error: string | null;
}

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
}

/**
 * Compress and resize an image for upload
 */
export async function processImage(
  uri: string,
  type: ImageType
): Promise<ProcessedImage> {
  const config = IMAGE_CONFIG[type];

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        resize: {
          width: config.maxWidth,
          height: config.maxHeight,
        },
      },
    ],
    {
      compress: config.quality,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}

/**
 * Convert a local URI to a Blob for upload
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

/**
 * Generate a unique filename with path structure
 */
function generateFilePath(
  bucket: StorageBucket,
  userId: string,
  contextId?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  switch (bucket) {
    case STORAGE_BUCKETS.AVATARS:
      // avatars/{userId}/{timestamp}.jpg
      return `${userId}/${timestamp}_${random}.jpg`;

    case STORAGE_BUCKETS.PROOFS:
      // proofs/{userId}/{pactId}/{timestamp}.jpg
      if (!contextId) throw new Error('Pact ID required for proof uploads');
      return `${userId}/${contextId}/${timestamp}_${random}.jpg`;

    case STORAGE_BUCKETS.ROASTS:
      // roasts/{threadId}/{userId}/{timestamp}.jpg
      if (!contextId) throw new Error('Thread ID required for roast uploads');
      return `${contextId}/${userId}/${timestamp}_${random}.jpg`;

    default:
      throw new Error(`Unknown bucket: ${bucket}`);
  }
}

/**
 * Upload an image to Supabase Storage
 * @param uri - Local file URI
 * @param bucket - Storage bucket name
 * @param userId - Current user ID
 * @param contextId - Optional context (pactId for proofs, threadId for roasts)
 * @param type - Image type for compression settings
 */
export async function uploadImage(
  uri: string,
  bucket: StorageBucket,
  userId: string,
  contextId?: string,
  type?: ImageType
): Promise<UploadResult> {
  try {
    // Determine image type from bucket if not provided
    const imageType: ImageType = type || (bucket === 'avatars' ? 'avatar' : bucket === 'proofs' ? 'proof' : 'roast');

    // Process/compress the image
    const processed = await processImage(uri, imageType);

    // Convert to blob
    const blob = await uriToBlob(processed.uri);

    // Check file size
    const config = IMAGE_CONFIG[imageType];
    if (blob.size > config.maxSizeBytes) {
      return {
        url: null,
        path: null,
        error: `Image too large. Maximum size is ${config.maxSizeBytes / (1024 * 1024)}MB.`,
      };
    }

    // Generate file path
    const filePath = generateFilePath(bucket, userId, contextId);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error(`[Storage] Upload error for ${bucket}:`, uploadError);
      return {
        url: null,
        path: null,
        error: 'Failed to upload image. Please try again.',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
      error: null,
    };
  } catch (err) {
    console.error(`[Storage] Exception during upload to ${bucket}:`, err);
    return {
      url: null,
      path: null,
      error: 'Failed to upload image. Please try again.',
    };
  }
}

/**
 * Upload an avatar image
 */
export async function uploadAvatar(
  userId: string,
  imageUri: string
): Promise<UploadResult> {
  return uploadImage(imageUri, STORAGE_BUCKETS.AVATARS, userId, undefined, 'avatar');
}

/**
 * Upload a proof image
 */
export async function uploadProof(
  userId: string,
  pactId: string,
  imageUri: string
): Promise<UploadResult> {
  return uploadImage(imageUri, STORAGE_BUCKETS.PROOFS, userId, pactId, 'proof');
}

/**
 * Upload a roast thread image
 */
export async function uploadRoastImage(
  userId: string,
  threadId: string,
  imageUri: string
): Promise<UploadResult> {
  return uploadImage(imageUri, STORAGE_BUCKETS.ROASTS, userId, threadId, 'roast');
}

/**
 * Delete an image from storage
 */
export async function deleteImage(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error(`[Storage] Delete error for ${bucket}:`, error);
      return {
        success: false,
        error: 'Failed to delete image.',
      };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error(`[Storage] Delete exception for ${bucket}:`, err);
    return {
      success: false,
      error: 'Failed to delete image.',
    };
  }
}

/**
 * Get the public URL for a storage file
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
