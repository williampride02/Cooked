import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utilities for Cooked
 * Use these for tactile feedback on user interactions
 */

export const haptics = {
  /**
   * Light tap - for button presses, toggles, reactions
   */
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /**
   * Medium tap - for significant actions, sends, confirmations
   */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /**
   * Heavy tap - for destructive or important actions
   */
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /**
   * Success feedback - for completed actions, check-ins
   */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /**
   * Warning feedback - for fold confirmations
   */
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  /**
   * Error feedback - for failed actions
   */
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /**
   * Selection changed - for pickers, tab changes, toggles
   */
  selection: () => Haptics.selectionAsync(),

  /**
   * Celebration pattern - for achievements, streak milestones
   * Triple success pulse pattern
   */
  celebration: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Streak celebration - for streak achievements
   * Escalating pattern: light -> medium -> heavy -> success
   */
  streakCelebration: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Soft tap - for reactions, subtle interactions
   */
  soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),

  /**
   * Rigid tap - for confirmations, firm feedback
   */
  rigid: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),

  /**
   * Pull-to-refresh haptic
   */
  pullToRefresh: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
};

export default haptics;
