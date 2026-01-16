// App constants
export const APP_NAME = 'Cooked';

// Feature limits for free tier
export const FREE_TIER_LIMITS = {
  max_groups: 1,
  max_pacts_per_group: 3,
  recap_history_weeks: 1,
} as const;

// Colors (NativeWind/Tailwind compatible)
export const COLORS = {
  primary: '#FF4D00',
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
  success: '#00C853',
  warning: '#FF9800',
  error: '#FF5252',
} as const;

// Tier colors for achievements
export const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
} as const;

// Achievement category names
export const CATEGORY_NAMES = {
  streak: 'Streaks',
  checkin: 'Check-ins',
  roast: 'Roasts',
  social: 'Social',
  comeback: 'Comebacks',
} as const;
