'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ParticipantStats {
  userId: string;
  displayName: string;
  totalCheckIns: number;
  successCount: number;
  foldCount: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
}

interface PactStats {
  pactId: string;
  totalExpected: number;
  totalCheckIns: number;
  overallCompletionRate: number;
  participantStats: ParticipantStats[];
}

interface UsePactStatsReturn {
  isLoading: boolean;
  error: string | null;
  fetchPactStats: (pactId: string) => Promise<PactStats | null>;
}

export function usePactStats(): UsePactStatsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPactStats = useCallback(async (pactId: string): Promise<PactStats | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch pact details
      const { data: pact, error: pactError } = await supabase
        .from('pacts')
        .select('id, frequency, frequency_days, start_date, pact_type')
        .eq('id', pactId)
        .single();

      if (pactError || !pact) {
        setError('Pact not found');
        return null;
      }

      // Fetch participants
      const { data: participants, error: participantsError } = await supabase
        .from('pact_participants')
        .select(`
          user_id,
          relay_days,
          users:user_id (id, display_name)
        `)
        .eq('pact_id', pactId);

      if (participantsError) {
        setError('Failed to fetch participants');
        return null;
      }

      // Fetch all check-ins for this pact
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select('user_id, status, check_in_date')
        .eq('pact_id', pactId)
        .order('check_in_date', { ascending: true });

      if (checkInsError) {
        setError('Failed to fetch check-ins');
        return null;
      }

      // Calculate days since start
      const startDate = new Date(pact.start_date);
      const today = new Date();
      const daysSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1; // Include start day

      // Calculate expected check-ins based on frequency
      const calculateExpectedCheckIns = (userId?: string): number => {
        if (pact.frequency === 'daily') {
          return daysSinceStart;
        } else if (pact.frequency === 'weekly') {
          return Math.ceil(daysSinceStart / 7);
        } else if (pact.frequency === 'custom' && pact.frequency_days) {
          // Count days that match the frequency_days pattern
          let count = 0;
          for (let i = 0; i < daysSinceStart; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dayOfWeek = date.getDay();
            if (pact.frequency_days.includes(dayOfWeek)) {
              // For relay pacts, only count if it's this user's day
              if (pact.pact_type === 'relay' && userId) {
                const participant = participants?.find((p) => p.user_id === userId);
                if (participant?.relay_days?.includes(dayOfWeek)) {
                  count++;
                }
              } else {
                count++;
              }
            }
          }
          return count;
        }
        return daysSinceStart;
      };

      // Calculate streaks - considers consecutive successful check-ins only
      const calculateStreaks = (userCheckIns: { status: string; check_in_date: string }[]): { current: number; longest: number } => {
        if (userCheckIns.length === 0) return { current: 0, longest: 0 };

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastSuccessDate: Date | null = null;

        // Sort by date
        const sorted = [...userCheckIns].sort(
          (a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime()
        );

        // Calculate longest streak - check for consecutive check-in dates
        for (const checkIn of sorted) {
          if (checkIn.status === 'success') {
            const checkInDate = new Date(checkIn.check_in_date);

            if (lastSuccessDate === null) {
              // First success
              tempStreak = 1;
            } else {
              // Check if this is the next expected check-in day
              const daysDiff = Math.floor(
                (checkInDate.getTime() - lastSuccessDate.getTime()) / (1000 * 60 * 60 * 24)
              );

              // For daily/custom pacts, consecutive means the next scheduled day
              // We'll use a simple approach: if within 7 days and no fold between, count it
              if (daysDiff <= 7) {
                tempStreak++;
              } else {
                tempStreak = 1;
              }
            }

            longestStreak = Math.max(longestStreak, tempStreak);
            lastSuccessDate = checkInDate;
          } else {
            // A fold breaks the streak
            tempStreak = 0;
            lastSuccessDate = null;
          }
        }

        // Current streak - count from the end while still consecutive
        const todayStr = new Date().toISOString().split('T')[0];
        let lastDate: string | null = null;

        for (let i = sorted.length - 1; i >= 0; i--) {
          const checkIn = sorted[i];

          if (checkIn.status !== 'success') {
            break;
          }

          if (lastDate === null) {
            // Most recent check-in - verify it's recent (within last 7 days)
            const daysSinceCheckIn = Math.floor(
              (new Date(todayStr).getTime() - new Date(checkIn.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceCheckIn > 7) {
              // Streak has expired
              break;
            }
            currentStreak = 1;
            lastDate = checkIn.check_in_date;
          } else {
            // Check if consecutive
            const daysDiff = Math.floor(
              (new Date(lastDate).getTime() - new Date(checkIn.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysDiff <= 7) {
              currentStreak++;
              lastDate = checkIn.check_in_date;
            } else {
              break;
            }
          }
        }

        return { current: currentStreak, longest: longestStreak };
      };

      // Calculate stats per participant
      const participantStats: ParticipantStats[] = (participants || []).map((p) => {
        const userCheckIns = (checkIns || []).filter((c) => c.user_id === p.user_id);
        const successCount = userCheckIns.filter((c) => c.status === 'success').length;
        const foldCount = userCheckIns.filter((c) => c.status === 'fold').length;
        const expected = calculateExpectedCheckIns(p.user_id);
        const streaks = calculateStreaks(userCheckIns);

        return {
          userId: p.user_id,
          displayName: (p.users as unknown as { display_name: string })?.display_name || 'Unknown',
          totalCheckIns: userCheckIns.length,
          successCount,
          foldCount,
          completionRate: expected > 0 ? Math.round((successCount / expected) * 100) : 0,
          currentStreak: streaks.current,
          longestStreak: streaks.longest,
        };
      });

      // Calculate overall stats
      const totalExpected = participantStats.reduce((sum, p) => {
        const expected = calculateExpectedCheckIns(pact.pact_type === 'relay' ? p.userId : undefined);
        return sum + expected;
      }, 0);

      const totalSuccesses = participantStats.reduce((sum, p) => sum + p.successCount, 0);
      const totalCheckInsCount = participantStats.reduce((sum, p) => sum + p.totalCheckIns, 0);

      return {
        pactId,
        totalExpected,
        totalCheckIns: totalCheckInsCount,
        overallCompletionRate: totalExpected > 0 ? Math.round((totalSuccesses / totalExpected) * 100) : 0,
        participantStats,
      };
    } catch (err) {
      console.error('Fetch pact stats error:', err);
      setError('Failed to load statistics');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    fetchPactStats,
  };
}
