'use client';

import { useEffect, useState } from 'react';
import { usePactStats } from '@/hooks/usePactStats';
import { supabase } from '@/lib/supabase';
import type { PactStats as PactStatsType } from '@/hooks/usePactStats';

interface PactStatsProps {
  pactId: string;
  isLoading: boolean;
}

export function PactStats({ pactId, isLoading: externalLoading }: PactStatsProps) {
  const [stats, setStats] = useState<PactStatsType | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { fetchPactStats, isLoading: isLoadingStats } = usePactStats();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Load stats
  useEffect(() => {
    async function loadStats() {
      const result = await fetchPactStats(pactId);
      setStats(result);
    }
    loadStats();
  }, [pactId, fetchPactStats]);

  if (externalLoading || isLoadingStats) {
    return (
      <div className="py-8 flex items-center justify-center">
        <div className="text-text-secondary">Loading statistics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-8 text-center">
        <p className="text-text-muted text-sm">No statistics available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center p-4 bg-primary/10 rounded-lg">
          <span className="text-3xl font-bold text-primary">{stats.overallCompletionRate}%</span>
          <span className="text-xs text-text-muted mt-1">Completion</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-surface-elevated rounded-lg">
          <span className="text-3xl font-bold text-text-primary">{stats.totalCheckIns}</span>
          <span className="text-xs text-text-muted mt-1">Total Check-ins</span>
        </div>
      </div>

      {/* Per Participant Stats */}
      <div>
        <h4 className="text-sm text-text-secondary mb-3">Per Participant</h4>
        <div className="space-y-3">
          {stats.participantStats.map((p, index) => (
            <div
              key={p.userId}
              className={`pb-3 ${index < stats.participantStats.length - 1 ? 'border-b border-text-muted/20' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-text-primary">
                  {p.displayName}
                  {p.userId === currentUserId && (
                    <span className="text-text-muted font-normal"> (you)</span>
                  )}
                </span>
                <span className="text-sm font-semibold text-primary">{p.completionRate}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-text-muted">
                <div>
                  🔥 Current: {p.currentStreak}
                </div>
                <div>
                  🏆 Best: {p.longestStreak}
                </div>
                <div>
                  ✅ {p.successCount} / ❌ {p.foldCount}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
