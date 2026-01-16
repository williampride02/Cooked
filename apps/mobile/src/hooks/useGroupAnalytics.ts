import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

// Analytics data types
export interface CompletionRateDataPoint {
  date: string;
  rate: number;
  checkIns: number;
  expectedCheckIns: number;
}

export interface MemberPerformance {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  completionRate: number;
  totalCheckIns: number;
  totalFolds: number;
  currentStreak: number;
}

export interface PactActivity {
  pactId: string;
  pactName: string;
  totalCheckIns: number;
  totalFolds: number;
  participantCount: number;
  completionRate: number;
}

export interface PeakCheckInTime {
  hour: number;
  count: number;
  percentage: number;
}

export interface FoldPattern {
  dayOfWeek: number;
  dayName: string;
  foldCount: number;
  percentage: number;
  topPact: string | null;
}

export interface RoastEngagement {
  totalThreads: number;
  totalResponses: number;
  avgResponsesPerThread: number;
  mostActiveRoaster: {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    responseCount: number;
  } | null;
  topReactions: { emoji: string; count: number }[];
}

export interface GroupAnalyticsData {
  completionOverTime: CompletionRateDataPoint[];
  memberPerformance: MemberPerformance[];
  mostActivePacts: PactActivity[];
  peakCheckInTimes: PeakCheckInTime[];
  foldPatterns: FoldPattern[];
  roastEngagement: RoastEngagement;
  summary: {
    overallCompletionRate: number;
    totalCheckIns: number;
    totalFolds: number;
    activePacts: number;
    activeMembers: number;
  };
}

interface UseGroupAnalyticsReturn {
  data: GroupAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  fetchAnalytics: (timeRange?: 'week' | 'month' | 'all') => Promise<void>;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function useGroupAnalytics(groupId: string | null): UseGroupAnalyticsReturn {
  const [data, setData] = useState<GroupAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(
    async (timeRange: 'week' | 'month' | 'all' = 'month') => {
      if (!groupId) {
        setError('No group selected');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Calculate date range
        const now = new Date();
        let startDate: Date;

        if (timeRange === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeRange === 'month') {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else {
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        }

        const startDateStr = startDate.toISOString().split('T')[0];

        // Fetch group members
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select(`
            user_id,
            users:user_id (id, display_name, avatar_url)
          `)
          .eq('group_id', groupId);

        if (membersError) throw new Error('Failed to fetch members');

        const memberMap = new Map<string, Pick<User, 'id' | 'display_name' | 'avatar_url'>>();
        (members || []).forEach((m) => {
          const user = m.users as unknown as Pick<User, 'id' | 'display_name' | 'avatar_url'>;
          if (user) {
            memberMap.set(m.user_id, user);
          }
        });

        // Fetch pacts for this group
        const { data: pacts, error: pactsError } = await supabase
          .from('pacts')
          .select('id, name, frequency, frequency_days, pact_type, status')
          .eq('group_id', groupId)
          .eq('status', 'active');

        if (pactsError) throw new Error('Failed to fetch pacts');

        const pactIds = (pacts || []).map((p) => p.id);

        // Fetch all check-ins for these pacts
        const { data: checkIns, error: checkInsError } = await supabase
          .from('check_ins')
          .select('*')
          .in('pact_id', pactIds.length > 0 ? pactIds : ['none'])
          .gte('check_in_date', startDateStr)
          .order('created_at', { ascending: true });

        if (checkInsError) throw new Error('Failed to fetch check-ins');

        const allCheckIns = checkIns || [];

        // Fetch roast threads and responses
        const checkInIds = allCheckIns.map((c) => c.id);
        const { data: roastThreads, error: threadsError } = await supabase
          .from('roast_threads')
          .select('id, check_in_id')
          .in('check_in_id', checkInIds.length > 0 ? checkInIds : ['none']);

        if (threadsError) throw new Error('Failed to fetch roast threads');

        const threadIds = (roastThreads || []).map((t) => t.id);

        const { data: roastResponses, error: responsesError } = await supabase
          .from('roast_responses')
          .select('*')
          .in('thread_id', threadIds.length > 0 ? threadIds : ['none']);

        if (responsesError) throw new Error('Failed to fetch roast responses');

        // Fetch reactions for roast responses
        const responseIds = (roastResponses || []).map((r) => r.id);
        const { data: reactions, error: reactionsError } = await supabase
          .from('reactions')
          .select('*')
          .eq('target_type', 'roast_response')
          .in('target_id', responseIds.length > 0 ? responseIds : ['none']);

        if (reactionsError) throw new Error('Failed to fetch reactions');

        // Process data

        // 1. Completion rate over time
        const completionOverTime = processCompletionOverTime(
          allCheckIns,
          pacts || [],
          memberMap.size,
          timeRange
        );

        // 2. Member performance
        const memberPerformance = processMemberPerformance(
          allCheckIns,
          memberMap
        );

        // 3. Most active pacts
        const mostActivePacts = processPactActivity(
          allCheckIns,
          pacts || []
        );

        // 4. Peak check-in times
        const peakCheckInTimes = processPeakTimes(allCheckIns);

        // 5. Fold patterns
        const foldPatterns = processFoldPatterns(allCheckIns, pacts || []);

        // 6. Roast engagement
        const roastEngagement = processRoastEngagement(
          roastThreads || [],
          roastResponses || [],
          reactions || [],
          memberMap
        );

        // 7. Summary stats
        const successCount = allCheckIns.filter((c) => c.status === 'success').length;
        const foldCount = allCheckIns.filter((c) => c.status === 'fold').length;
        const totalCheckIns = allCheckIns.length;

        const summary = {
          overallCompletionRate: totalCheckIns > 0 ? Math.round((successCount / totalCheckIns) * 100) : 0,
          totalCheckIns: successCount,
          totalFolds: foldCount,
          activePacts: (pacts || []).length,
          activeMembers: memberMap.size,
        };

        setData({
          completionOverTime,
          memberPerformance,
          mostActivePacts,
          peakCheckInTimes,
          foldPatterns,
          roastEngagement,
          summary,
        });
      } catch (err) {
        console.error('Fetch analytics error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    },
    [groupId]
  );

  return {
    data,
    isLoading,
    error,
    fetchAnalytics,
  };
}

// Helper functions for data processing

function processCompletionOverTime(
  checkIns: any[],
  pacts: any[],
  memberCount: number,
  timeRange: 'week' | 'month' | 'all'
): CompletionRateDataPoint[] {
  const dayCount = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
  const result: CompletionRateDataPoint[] = [];
  const now = new Date();

  for (let i = dayCount - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    const dayCheckIns = checkIns.filter((c) => c.check_in_date === dateStr);
    const successCount = dayCheckIns.filter((c) => c.status === 'success').length;
    const totalCount = dayCheckIns.length;

    // Estimate expected check-ins (simplified: count of daily pacts * member count)
    const dailyPacts = pacts.filter((p) => p.frequency === 'daily').length;
    const expectedCheckIns = dailyPacts * memberCount || 1;

    result.push({
      date: dateStr,
      rate: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0,
      checkIns: successCount,
      expectedCheckIns,
    });
  }

  return result;
}

function processMemberPerformance(
  checkIns: any[],
  memberMap: Map<string, Pick<User, 'id' | 'display_name' | 'avatar_url'>>
): MemberPerformance[] {
  const memberStats = new Map<string, { success: number; fold: number; dates: string[] }>();

  checkIns.forEach((c) => {
    const existing = memberStats.get(c.user_id) || { success: 0, fold: 0, dates: [] };
    if (c.status === 'success') {
      existing.success++;
    } else {
      existing.fold++;
    }
    existing.dates.push(c.check_in_date);
    memberStats.set(c.user_id, existing);
  });

  const result: MemberPerformance[] = [];

  memberMap.forEach((user, userId) => {
    const stats = memberStats.get(userId) || { success: 0, fold: 0, dates: [] };
    const total = stats.success + stats.fold;
    const completionRate = total > 0 ? Math.round((stats.success / total) * 100) : 0;

    // Calculate current streak (simplified)
    const sortedDates = [...new Set(stats.dates)].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = today;

    for (const date of sortedDates) {
      if (date === checkDate || date === getPreviousDay(checkDate)) {
        streak++;
        checkDate = date;
      } else {
        break;
      }
    }

    result.push({
      userId,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      completionRate,
      totalCheckIns: stats.success,
      totalFolds: stats.fold,
      currentStreak: streak,
    });
  });

  return result.sort((a, b) => b.completionRate - a.completionRate);
}

function processPactActivity(checkIns: any[], pacts: any[]): PactActivity[] {
  const pactStats = new Map<string, { success: number; fold: number; users: Set<string> }>();

  checkIns.forEach((c) => {
    const existing = pactStats.get(c.pact_id) || { success: 0, fold: 0, users: new Set() };
    if (c.status === 'success') {
      existing.success++;
    } else {
      existing.fold++;
    }
    existing.users.add(c.user_id);
    pactStats.set(c.pact_id, existing);
  });

  return pacts.map((pact) => {
    const stats = pactStats.get(pact.id) || { success: 0, fold: 0, users: new Set() };
    const total = stats.success + stats.fold;
    return {
      pactId: pact.id,
      pactName: pact.name,
      totalCheckIns: stats.success,
      totalFolds: stats.fold,
      participantCount: stats.users.size,
      completionRate: total > 0 ? Math.round((stats.success / total) * 100) : 0,
    };
  }).sort((a, b) => b.totalCheckIns - a.totalCheckIns);
}

function processPeakTimes(checkIns: any[]): PeakCheckInTime[] {
  const hourCounts = new Array(24).fill(0);

  checkIns.forEach((c) => {
    const hour = new Date(c.created_at).getHours();
    hourCounts[hour]++;
  });

  const total = checkIns.length || 1;

  return hourCounts.map((count, hour) => ({
    hour,
    count,
    percentage: Math.round((count / total) * 100),
  }));
}

function processFoldPatterns(checkIns: any[], pacts: any[]): FoldPattern[] {
  const folds = checkIns.filter((c) => c.status === 'fold');
  const dayStats = new Map<number, { count: number; pactCounts: Map<string, number> }>();

  folds.forEach((f) => {
    const day = new Date(f.check_in_date).getDay();
    const existing = dayStats.get(day) || { count: 0, pactCounts: new Map() };
    existing.count++;
    existing.pactCounts.set(f.pact_id, (existing.pactCounts.get(f.pact_id) || 0) + 1);
    dayStats.set(day, existing);
  });

  const totalFolds = folds.length || 1;
  const pactMap = new Map(pacts.map((p) => [p.id, p.name]));

  return DAY_NAMES.map((name, day) => {
    const stats = dayStats.get(day);
    let topPact: string | null = null;

    if (stats && stats.pactCounts.size > 0) {
      let maxCount = 0;
      stats.pactCounts.forEach((count, pactId) => {
        if (count > maxCount) {
          maxCount = count;
          topPact = pactMap.get(pactId) || null;
        }
      });
    }

    return {
      dayOfWeek: day,
      dayName: name,
      foldCount: stats?.count || 0,
      percentage: stats ? Math.round((stats.count / totalFolds) * 100) : 0,
      topPact,
    };
  });
}

function processRoastEngagement(
  threads: any[],
  responses: any[],
  reactions: any[],
  memberMap: Map<string, Pick<User, 'id' | 'display_name' | 'avatar_url'>>
): RoastEngagement {
  const totalThreads = threads.length;
  const totalResponses = responses.length;
  const avgResponsesPerThread = totalThreads > 0 ? Math.round((totalResponses / totalThreads) * 10) / 10 : 0;

  // Find most active roaster
  const roasterCounts = new Map<string, number>();
  responses.forEach((r) => {
    roasterCounts.set(r.user_id, (roasterCounts.get(r.user_id) || 0) + 1);
  });

  let mostActiveRoaster: RoastEngagement['mostActiveRoaster'] = null;
  let maxResponses = 0;

  roasterCounts.forEach((count, userId) => {
    if (count > maxResponses) {
      maxResponses = count;
      const user = memberMap.get(userId);
      if (user) {
        mostActiveRoaster = {
          userId,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          responseCount: count,
        };
      }
    }
  });

  // Count reactions by type
  const reactionCounts = new Map<string, number>();
  reactions.forEach((r) => {
    reactionCounts.set(r.emoji, (reactionCounts.get(r.emoji) || 0) + 1);
  });

  const topReactions = Array.from(reactionCounts.entries())
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalThreads,
    totalResponses,
    avgResponsesPerThread,
    mostActiveRoaster,
    topReactions,
  };
}

function getPreviousDay(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}
