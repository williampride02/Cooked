'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { WeeklyRecap, RecapAwards } from '@cooked/shared';
import { useRecaps } from '@/hooks/useRecaps';
import { supabase } from '@/lib/supabase';
import { generateRecapCardPng } from '@/utils/recapCard';

export const dynamic = 'force-dynamic';

const AWARD_LABELS: Record<keyof RecapAwards, { emoji: string; label: string }> = {
  most_consistent: { emoji: '🏆', label: 'Most Consistent' },
  biggest_fold: { emoji: '🤡', label: 'Biggest Fold' },
  excuse_hall_of_fame: { emoji: '🧠', label: 'Excuse Hall of Fame' },
  comeback_player: { emoji: '🔥', label: 'Comeback Player' },
  best_roast: { emoji: '💀', label: 'Best Roast' },
};

function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
}

export default function RecapDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const recapId = params.recapId as string;

  const { fetchRecap, isLoading, error } = useRecaps();
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const load = useCallback(async () => {
    if (!recapId) return;
    const data = await fetchRecap(recapId);
    setRecap(data);
  }, [fetchRecap, recapId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!groupId) return;
      const { data, error } = await supabase.from('groups').select('name').eq('id', groupId).single();
      if (!mounted) return;
      if (error) return;
      setGroupName((data as any)?.name ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, [groupId]);

  const generateCardBlob = useCallback(async (): Promise<Blob> => {
    if (!recap) throw new Error('No recap data');
    return await generateRecapCardPng({ recap, groupName });
  }, [recap, groupName]);

  const handleDownloadCard = useCallback(async () => {
    if (!recap) return;
    setIsDownloading(true);
    setShareError(null);
    try {
      const blob = await generateCardBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cooked-recap-${groupId}-${recap.week_end}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Download recap card error:', e);
      setShareError(e?.message || 'Failed to generate recap card');
    } finally {
      setIsDownloading(false);
    }
  }, [groupId, recap, generateCardBlob]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!recap) return;
    if (!navigator.clipboard || !window.ClipboardItem) {
      setShareError('Clipboard API not supported in this browser');
      return;
    }

    setIsCopying(true);
    setShareError(null);
    setCopySuccess(false);
    try {
      const blob = await generateCardBlob();
      // ClipboardItem may not be in TypeScript types for all browsers
      const ClipboardItemConstructor = (window as any).ClipboardItem as typeof ClipboardItem;
      const item = new ClipboardItemConstructor({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e: any) {
      console.error('Copy to clipboard error:', e);
      setShareError(e?.message || 'Failed to copy to clipboard');
    } finally {
      setIsCopying(false);
    }
  }, [recap, generateCardBlob]);

  const supportsClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard && 'ClipboardItem' in window;

  const awards = recap?.data.awards;
  const stats = recap?.data.stats;

  const awardEntries = useMemo(() => {
    if (!awards) return [];
    return (Object.keys(AWARD_LABELS) as Array<keyof RecapAwards>).map((key) => ({
      key,
      meta: AWARD_LABELS[key],
      value: awards[key],
    }));
  }, [awards]);

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
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Recap</h1>
              {recap && (
                <p className="text-xs text-text-muted">{formatRange(recap.week_start, recap.week_end)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-6 space-y-6">
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {shareError && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
            {shareError}
          </div>
        )}
        {copySuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-lg text-sm">
            Copied to clipboard!
          </div>
        )}

        {isLoading && !recap ? (
          <div className="text-text-secondary">Loading recap...</div>
        ) : !recap ? (
          <div className="text-text-secondary">Recap not found.</div>
        ) : (
          <>
            {/* Share / Download */}
            <div className="bg-surface border border-text-muted/20 rounded-lg p-4">
              <div className="mb-3">
                <div className="text-sm font-semibold text-text-primary">Share recap card</div>
                <div className="text-xs text-text-muted">Download or copy an image you can post or send.</div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadCard}
                  disabled={isDownloading || isCopying}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {isDownloading ? 'Generating…' : 'Download PNG'}
                </button>
                {supportsClipboard && (
                  <button
                    onClick={handleCopyToClipboard}
                    disabled={isDownloading || isCopying}
                    className="flex-1 px-4 py-2 bg-surface-elevated border border-text-muted/20 text-text-primary rounded-lg text-sm font-semibold hover:bg-surface-elevated/80 disabled:opacity-60 transition-colors"
                  >
                    {isCopying ? 'Copying…' : copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Completion" value={`${Math.round(stats.group_completion_rate)}%`} />
                <StatCard label="Check-ins" value={`${stats.total_check_ins}`} />
                <StatCard label="Folds" value={`${stats.total_folds}`} />
                <StatCard label="Active pacts" value={`${stats.active_pacts}`} />
              </div>
            )}

            {/* Awards */}
            <div className="bg-surface border border-text-muted/20 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Awards</h2>
              <div className="space-y-3">
                {awardEntries.map(({ key, meta, value }) => (
                  <div key={key} className="border border-text-muted/20 rounded-md p-3">
                    <div className="text-xs text-text-muted mb-1">
                      {meta.emoji} {meta.label}
                    </div>
                    {!value ? (
                      <div className="text-sm text-text-secondary">No winner</div>
                    ) : 'excuse' in value ? (
                      <div className="text-sm text-text-primary">
                        <span className="font-semibold">{value.display_name}</span> — “{value.excuse}”
                      </div>
                    ) : 'content' in value ? (
                      <div className="text-sm text-text-primary">
                        <span className="font-semibold">{value.display_name}</span> — “{value.content}”
                      </div>
                    ) : (
                      <div className="text-sm text-text-primary">
                        <span className="font-semibold">{value.display_name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            {stats?.leaderboard?.length ? (
              <div className="bg-surface border border-text-muted/20 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-text-primary mb-3">Leaderboard</h2>
                <div className="space-y-2">
                  {stats.leaderboard.map((entry, idx) => (
                    <div key={entry.user_id} className="flex items-center justify-between border-b border-text-muted/20 pb-2 last:border-b-0 last:pb-0">
                      <div className="text-sm text-text-primary">
                        <span className="text-text-muted mr-2">#{idx + 1}</span>
                        {entry.display_name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {Math.round(entry.completion_rate)}% • {entry.check_ins}W/{entry.folds}L
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <button
                onClick={() => router.push(`/group/${groupId}`)}
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Back to Group
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-text-muted/20 rounded-lg p-4">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="text-xl font-bold text-text-primary">{value}</div>
    </div>
  );
}

