// Utility functions for pact-related logic

/**
 * Check if a pact is due today based on frequency
 */
export function isPactDueToday(
  frequency: 'daily' | 'weekly' | 'custom',
  frequencyDays: number[] | null,
  pactType: string,
  relayDays?: number[] | null
): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  if (frequency === 'daily') {
    // For relay pacts, check if today is user's assigned day
    if (pactType === 'relay' && relayDays) {
      return relayDays.includes(dayOfWeek);
    }
    return true;
  }

  if (frequency === 'weekly') {
    // Weekly pacts are due on Monday (day 1)
    if (pactType === 'relay' && relayDays) {
      return relayDays.includes(dayOfWeek);
    }
    return dayOfWeek === 1;
  }

  if (frequency === 'custom' && frequencyDays) {
    // For relay pacts, check if today is user's assigned day
    if (pactType === 'relay' && relayDays) {
      return relayDays.includes(dayOfWeek);
    }
    return frequencyDays.includes(dayOfWeek);
  }

  return false;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}
