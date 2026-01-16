// Cooked Custom Hooks
// Export custom hooks from this file

export { usePhoneAuth } from './usePhoneAuth';
export { usePushNotifications, getExpoPushToken } from './usePushNotifications';
export {
  useNotificationListener,
  getLastNotificationResponse,
  clearAllNotifications,
  getBadgeCount,
  setBadgeCount,
} from './useNotificationListener';
export type { NotificationData } from './useNotificationListener';
export type { PushNotificationStatus } from './usePushNotifications';

// Polls
export { usePolls, usePoll } from './usePolls';

// Deep Linking
export {
  useDeepLinking,
  parseDeepLink,
  createDeepLink,
} from './useDeepLinking';
export type { ParsedDeepLink, DeepLinkRoute, DeepLinkConfig } from './useDeepLinking';

// Templates
export { useTemplates } from './useTemplates';
export type { UserPactTemplate } from './useTemplates';

// Group Analytics
export { useGroupAnalytics } from './useGroupAnalytics';
export type {
  CompletionRateDataPoint,
  MemberPerformance,
  PactActivity,
  PeakCheckInTime,
  FoldPattern,
  RoastEngagement,
  GroupAnalyticsData,
} from './useGroupAnalytics';

// Achievements
export { useAchievements } from './useAchievements';

// Social Sharing
export { useShare } from './useShare';

// Realtime Subscriptions
export {
  useRealtimeSubscription,
  useRoastThreadRealtime,
  useFeedRealtime,
  QUERY_KEYS,
} from './useRealtimeSubscription';
export type {
  RealtimeEventType,
  RealtimeEvent,
  RealtimeCallbacks,
} from './useRealtimeSubscription';

// Future hooks (to be implemented in upcoming stories):
// export { useAuth } from './useAuth';
// export { useGroup } from './useGroup';
// export { usePacts } from './usePacts';
