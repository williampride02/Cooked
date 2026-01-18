'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRecaps } from '@/hooks/useRecaps';
import type { WeeklyRecap } from '@cooked/shared';

export const dynamic = 'force-dynamic';

function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
}

export default function GroupRecapsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const { fetchRecapHistory, isLoading, error } = useRecaps();
  const [recaps, setRecaps] = useState<WeeklyRecap[]>([]);

  const load = useCallback(async () => {
    if (!groupId) return;
    const data = await fetchRecapHistory(groupId, 12);
    setRecaps(data);
  }, [fetchRecapHistory, groupId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-text-muted/20 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center text-text-primary hover:bg-surface rounded-full transition-colors"
              title="Go back"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-text-primary">Weekly Recaps</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-6 space-y-6">
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading && recaps.length === 0 ? (
          <div className="text-text-secondary">Loading recaps...</div>
        ) : recaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-text-muted/20 mb-4">
              <span className="text-4xl">📊</span>
            </div>
            <p className="text-text-secondary text-center mb-2">No recaps yet</p>
            <p className="text-sm text-text-muted text-center mb-6 px-8">
              Recaps are generated weekly. Once your group has activity, you’ll start seeing them here.
            </p>
            <Link
              href={`/group/${groupId}`}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Back to Group
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recaps.map((recap) => (
              <Link
                key={recap.id}
                href={`/group/${groupId}/recaps/${recap.id}`}
                className="block bg-surface border border-text-muted/20 rounded-lg p-4 hover:bg-surface-elevated transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-text-primary font-semibold">
                      Week {formatRange(recap.week_start, recap.week_end)}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {Math.round(recap.data.stats.group_completion_rate)}% completion •{' '}
                      {recap.data.stats.total_check_ins} check-ins • {recap.data.stats.total_folds} folds
                    </div>
                  </div>
                  <div className="text-text-muted">→</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

