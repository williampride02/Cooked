/**
 * Social sharing utilities for Cooked app
 * Handles capturing views as images and sharing via system share sheet
 */

import { RefObject } from 'react';

// Dynamic imports for native modules that may not be available
let Sharing: typeof import('expo-sharing') | null = null;
let ViewShot: typeof import('react-native-view-shot').default | null = null;

try {
  Sharing = require('expo-sharing');
  ViewShot = require('react-native-view-shot').default;
} catch {
  console.warn('Sharing native modules not available');
}

/**
 * Result of a share operation
 */
export interface ShareResult {
  success: boolean;
  error: string | null;
}

/**
 * Options for capturing a view as an image
 */
export interface CaptureOptions {
  format?: 'png' | 'jpg';
  quality?: number;
  width?: number;
  height?: number;
}

const DEFAULT_CAPTURE_OPTIONS: CaptureOptions = {
  format: 'png',
  quality: 1,
};

/**
 * Capture a ViewShot ref as an image and return the local URI
 */
export async function captureView(
  viewRef: RefObject<{ capture?: () => Promise<string> } | null>,
  options: CaptureOptions = {}
): Promise<{ uri: string | null; error: string | null }> {
  try {
    if (!viewRef.current) {
      return { uri: null, error: 'View reference not available' };
    }

    const mergedOptions = { ...DEFAULT_CAPTURE_OPTIONS, ...options };

    const uri = await viewRef.current.capture?.();

    if (!uri) {
      return { uri: null, error: 'Failed to capture view' };
    }

    return { uri, error: null };
  } catch (err) {
    console.error('[Share] Capture error:', err);
    return { uri: null, error: 'Failed to capture image' };
  }
}

/**
 * Check if sharing is available on the device
 */
export async function isSharingAvailable(): Promise<boolean> {
  if (!Sharing) return false;
  return Sharing.isAvailableAsync();
}

/**
 * Share an image file via the system share sheet
 */
export async function shareImage(
  imageUri: string,
  options?: { mimeType?: string; dialogTitle?: string }
): Promise<ShareResult> {
  if (!Sharing) {
    return { success: false, error: 'Sharing module not available. Rebuild required.' };
  }

  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      return { success: false, error: 'Sharing is not available on this device' };
    }

    await Sharing.shareAsync(imageUri, {
      mimeType: options?.mimeType || 'image/png',
      dialogTitle: options?.dialogTitle || 'Share',
      UTI: 'public.png',
    });

    return { success: true, error: null };
  } catch (err) {
    console.error('[Share] Share error:', err);
    // User cancelled is not an error
    if ((err as Error)?.message?.includes('cancel')) {
      return { success: true, error: null };
    }
    return { success: false, error: 'Failed to share' };
  }
}

/**
 * Capture a view and share it as an image
 */
export async function captureAndShare(
  viewRef: RefObject<{ capture?: () => Promise<string> } | null>,
  options?: {
    capture?: CaptureOptions;
    dialogTitle?: string;
  }
): Promise<ShareResult> {
  // Capture the view
  const { uri, error: captureError } = await captureView(viewRef, options?.capture);

  if (captureError || !uri) {
    return { success: false, error: captureError || 'Failed to capture image' };
  }

  // Share the captured image
  return shareImage(uri, { dialogTitle: options?.dialogTitle });
}

/**
 * Generate a unique filename for a share image
 */
export function generateShareFilename(prefix: string): string {
  const timestamp = Date.now();
  return `cooked_${prefix}_${timestamp}.png`;
}


/**
 * Share types supported by the app
 */
export type ShareType =
  | 'recap'
  | 'achievement'
  | 'streak'
  | 'roast'
  | 'invite';

/**
 * Get share message text for different share types
 */
export function getShareMessage(
  type: ShareType,
  data: Record<string, string | number>
): string {
  switch (type) {
    case 'recap':
      return `Check out my weekly stats on Cooked! ${data.completionRate}% completion rate this week.`;

    case 'achievement':
      return `Just unlocked "${data.achievementName}" on Cooked!`;

    case 'streak':
      return `${data.streakDays} day streak on "${data.pactName}"! Keeping myself accountable with Cooked.`;

    case 'roast':
      return `Got roasted on Cooked: "${data.roastContent}"`;

    case 'invite':
      return `Join my accountability group "${data.groupName}" on Cooked!`;

    default:
      return 'Check out Cooked - the accountability app that roasts you when you fail!';
  }
}

/**
 * Build a share URL with UTM tracking
 */
export function buildShareUrl(
  baseUrl: string,
  source: ShareType
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', 'share');
  url.searchParams.set('utm_medium', source);
  url.searchParams.set('utm_campaign', 'social_share');
  return url.toString();
}
