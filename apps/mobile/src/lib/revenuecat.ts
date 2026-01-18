import Purchases, { LOG_LEVEL, STOREKIT_VERSION } from 'react-native-purchases';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';

let configured = false;

/**
 * Configure RevenueCat Purchases SDK once.
 * Safe no-op if API key is missing (keeps app functional without billing configured).
 */
export function ensureRevenueCatConfigured() {
  if (configured) return;
  if (!REVENUECAT_API_KEY) return;

  // Enable logs in dev only (must be before configure)
  if (process.env.NODE_ENV !== 'production') {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({
    apiKey: REVENUECAT_API_KEY,
    appUserID: null, // we'll logIn with a stable ID per group during purchase flow
    useAmazon: false,
    storeKitVersion: STOREKIT_VERSION.STOREKIT_2,
  });

  configured = true;
}

export async function logInRevenueCatGroup(groupId: string) {
  ensureRevenueCatConfigured();
  if (!REVENUECAT_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_REVENUECAT_API_KEY');
  }

  // We use a group-scoped app_user_id so a group admin purchase maps to a group subscription.
  const appUserId = `group:${groupId}`;
  await Purchases.logIn(appUserId);
  return appUserId;
}

