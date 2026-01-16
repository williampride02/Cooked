// Cooked Type Definitions
// Export shared types from this file

// Database types will be generated from Supabase
// export type { Database } from './database';

// Pact templates (re-export from lib)
export type {
  PactTemplate,
  TemplateCategory,
  TemplateCategoryInfo,
  UserTemplate,
} from '../lib/pactTemplates';

// App-specific types
export interface User {
  id: string;
  phone: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
  subscription_status: 'free' | 'premium' | 'trial';
  subscription_expires_at: string | null;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  settings: Record<string, unknown>;
  joined_at: string;
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
  member_count: number;
}

export interface Pact {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'custom';
  frequency_days: number[] | null; // For custom: [1,3,5] = Mon,Wed,Fri
  roast_level: 1 | 2 | 3;
  proof_required: 'none' | 'optional' | 'required';
  pact_type: 'individual' | 'group' | 'relay';
  created_by: string | null;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'archived';
  created_at: string;
}

export interface PactParticipant {
  pact_id: string;
  user_id: string;
  relay_days: number[] | null; // For relay pacts: assigned days (0=Sun, 1=Mon, etc.)
  joined_at: string;
}

export interface PactWithParticipants extends Pact {
  participants: Array<{
    user_id: string;
    relay_days: number[] | null;
    user: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
  }>;
}

export interface CheckIn {
  id: string;
  pact_id: string;
  user_id: string;
  status: 'success' | 'fold';
  excuse: string | null;
  proof_url: string | null;
  check_in_date: string;
  created_at: string;
}

export type RoastLevel = 1 | 2 | 3;
export type ReactionEmoji = 'skull' | 'cap' | 'clown' | 'salute' | 'fire' | 'clap';

// Feed types
export type FeedItemType = 'check_in' | 'member_joined' | 'pact_created' | 'recap';

export interface FeedItemBase {
  id: string;
  type: FeedItemType;
  group_id: string;
  created_at: string;
}

export interface CheckInFeedItem extends FeedItemBase {
  type: 'check_in';
  check_in: CheckIn;
  user: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
  pact: Pick<Pact, 'id' | 'name'>;
}

export interface MemberJoinedFeedItem extends FeedItemBase {
  type: 'member_joined';
  user: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
}

export interface PactCreatedFeedItem extends FeedItemBase {
  type: 'pact_created';
  pact: Pick<Pact, 'id' | 'name' | 'frequency' | 'roast_level'>;
  user: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
}

export interface RecapFeedItem extends FeedItemBase {
  type: 'recap';
  recap_id: string;
  week_start: string;
  week_end: string;
}

export type FeedItem =
  | CheckInFeedItem
  | MemberJoinedFeedItem
  | PactCreatedFeedItem
  | RecapFeedItem;

// Reaction type
export interface Reaction {
  id: string;
  target_type: 'check_in' | 'roast_response';
  target_id: string;
  user_id: string;
  emoji: ReactionEmoji;
  created_at: string;
}

// Roast thread types
export interface RoastThread {
  id: string;
  check_in_id: string;
  status: 'open' | 'closed';
  is_muted: boolean;
  created_at: string;
  closed_at: string | null;
}

export interface RoastResponse {
  id: string;
  thread_id: string;
  user_id: string;
  content_type: 'text' | 'gif' | 'image' | 'poll';
  content: string; // Text content, URL, or poll_id for polls
  is_pinned: boolean;
  created_at: string;
}

// Poll types
export interface Poll {
  id: string;
  thread_id: string;
  created_by: string;
  question: string;
  status: 'open' | 'closed';
  closes_at: string | null;
  created_at: string;
  closed_at: string | null;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  sort_order: number;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface PollWithDetails extends Poll {
  options: PollOption[];
  votes: PollVote[];
  user_vote: PollVote | null;
  total_votes: number;
  creator: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
}

export interface RoastThreadWithDetails extends RoastThread {
  check_in: CheckIn;
  user: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
  pact: Pick<Pact, 'id' | 'name' | 'roast_level'>;
  responses: Array<RoastResponse & {
    user: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
  }>;
}

// Weekly Recap types
export interface WeeklyRecap {
  id: string;
  group_id: string;
  week_start: string;
  week_end: string;
  data: RecapData;
  created_at: string;
}

export interface RecapData {
  awards: RecapAwards;
  stats: RecapStats;
  highlights: RecapHighlights;
}

export interface RecapAwards {
  most_consistent: RecapAwardWinner | null;
  biggest_fold: RecapAwardWinner | null;
  excuse_hall_of_fame: RecapExcuseAward | null;
  comeback_player: RecapAwardWinner | null;
  best_roast: RecapRoastAward | null;
}

export interface RecapAwardWinner {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  value: number; // completion rate, fold count, improvement %, etc.
}

export interface RecapExcuseAward {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  excuse: string;
  count: number;
}

export interface RecapRoastAward {
  response_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  content: string;
  content_type: 'text' | 'gif' | 'image';
  reaction_count: number;
}

export interface RecapStats {
  group_completion_rate: number;
  total_check_ins: number;
  total_folds: number;
  active_pacts: number;
  roast_threads_opened: number;
  leaderboard: RecapLeaderboardEntry[];
}

export interface RecapLeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  completion_rate: number;
  check_ins: number;
  folds: number;
}

export interface RecapHighlights {
  top_roasts: RecapRoastAward[];
  biggest_improvement: RecapAwardWinner | null;
  longest_streak: RecapStreakHighlight | null;
}

export interface RecapStreakHighlight {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  pact_name: string;
  streak_days: number;
}

// Notification types
export type NotificationType =
  | 'check_in_reminder'
  | 'fold_alert'
  | 'tagged_in_roast'
  | 'new_roast_response'
  | 'weekly_recap_ready'
  | 'member_joined'
  | 'pact_starting'
  | 'pact_ending';

export interface NotificationPreferences {
  check_in_reminder: boolean;
  fold_alert: boolean;
  tagged_in_roast: boolean;
  new_roast_response: boolean;
  weekly_recap_ready: boolean;
  member_joined: boolean;
  pact_starting: boolean;
  pact_ending: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string;   // HH:MM format
}

// Subscription types
export type SubscriptionStatus = 'free' | 'premium' | 'trial';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  expires_at: string | null;
  plan: 'monthly' | 'yearly' | null;
  is_admin_subscriber: boolean; // Is the current user the one who subscribed
}

// Feature limits for free tier
export const FREE_TIER_LIMITS = {
  max_groups: 1,
  max_pacts_per_group: 3,
  recap_history_weeks: 1,
} as const;

// Premium features
export type PremiumFeature =
  | 'unlimited_groups'
  | 'unlimited_pacts'
  | 'full_recap_history'
  | 'advanced_polls'
  | 'custom_roast_prompts'
  | 'group_analytics'
  | 'priority_support';

// Achievement types
export type AchievementCategory = 'streak' | 'checkin' | 'roast' | 'social' | 'comeback';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementRequirementType =
  | 'streak_days'
  | 'total_checkins'
  | 'total_roasts'
  | 'roast_reactions'
  | 'invites_sent'
  | 'group_created'
  | 'group_filled'
  | 'comeback_streak';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  requirement_type: AchievementRequirementType;
  requirement_value: number;
  xp_reward: number;
  sort_order: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  notified: boolean;
}

export interface UserAchievementWithDefinition extends UserAchievement {
  achievement: AchievementDefinition;
}

export interface UserStats {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
  total_folds: number;
  total_roasts: number;
  total_roast_reactions_received: number;
  invites_sent: number;
  groups_created: number;
  groups_filled: number;
  comeback_count: number;
  last_checkin_date: string | null;
  last_fold_date: string | null;
  updated_at: string;
}

export interface AchievementProgress {
  achievement: AchievementDefinition;
  isUnlocked: boolean;
  currentProgress: number;
  percentComplete: number;
  unlockedAt: string | null;
}

// Tier colors for UI
export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
} as const;

// Category display names
export const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  streak: 'Streaks',
  checkin: 'Check-ins',
  roast: 'Roasts',
  social: 'Social',
  comeback: 'Comebacks',
} as const;
