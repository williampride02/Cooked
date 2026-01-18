'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { usePactsWithStatus } from '@/hooks/usePactsWithStatus';
import type { PactWithCheckInStatus } from '@/hooks/usePactsWithStatus';

export const dynamic = 'force-dynamic';

const ROAST_EMOJIS: Record<1 | 2 | 3, string> = {
  1: '🌶️',
  2: '🌶️🌶️',
  3: '🌶️🌶️🌶️',
};

export default function PactsListPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const [pacts, setPacts] = useState<PactWithCheckInStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { fetchUserPactsWithStatus, isLoading, error } = usePactsWithStatus();

  const loadPacts = useCallback(async () => {
    if (!groupId) return;
    const result = await fetchUserPactsWithStatus(groupId);
    setPacts(result);
  }, [groupId, fetchUserPactsWithStatus]);

  useEffect(() => {
    loadPacts();
  }, [loadPacts]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPacts();
    setIsRefreshing(false);
  }, [loadPacts]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePactClick = useCallback((pactId: string) => {
    router.push(`/group/${groupId}/pact/${pactId}`);
  }, [groupId, router]);

  const handleCreatePact = useCallback(() => {
    router.push(`/group/${groupId}/create-pact`);
  }, [groupId, router]);

  // Separate pacts into sections
  const duePacts = pacts.filter((p) => p.isDueToday && !p.hasCheckedInToday);
  const completedPacts = pacts.filter((p) => p.hasCheckedInToday);
  const notDuePacts = pacts.filter((p) => !p.isDueToday && !p.hasCheckedInToday);

  if (isLoading && pacts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Loading pacts...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-text-muted/20 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center text-text-primary hover:bg-surface rounded-full transition-colors"
              title="Go back"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-text-primary">My Pacts</h1>
          </div>
          <button
            onClick={handleCreatePact}
            className="px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            + Create Pact
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-4xl mx-auto px-8 py-4">
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        </div>
      )}

      {/* Pacts List */}
      <div className="max-w-4xl mx-auto px-8 py-4">
        {pacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-text-muted/20 mb-4">
              <span className="text-4xl">📋</span>
            </div>
            <p className="text-text-secondary text-center mb-2">No pacts yet</p>
            <p className="text-sm text-text-muted text-center mb-6 px-8">
              Join or create a pact to start checking in!
            </p>
            <button
              onClick={handleCreatePact}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Create Pact
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Due Today Section */}
            {duePacts.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-primary mb-3">
                  🔥 Due Today ({duePacts.length})
                </h2>
                <div className="space-y-3">
                  {duePacts.map((pact) => (
                    <DuePactCard
                      key={pact.id}
                      pact={pact}
                      groupId={groupId}
                      onClick={() => handlePactClick(pact.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Today Section */}
            {completedPacts.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-text-secondary mb-3">
                  ✅ Completed Today ({completedPacts.length})
                </h2>
                <div className="space-y-3">
                  {completedPacts.map((pact) => (
                    <PactCard
                      key={pact.id}
                      pact={pact}
                      onClick={() => handlePactClick(pact.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Not Due Today Section */}
            {notDuePacts.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-text-muted mb-3">
                  Not Due Today ({notDuePacts.length})
                </h2>
                <div className="space-y-3">
                  {notDuePacts.map((pact) => (
                    <PactCard
                      key={pact.id}
                      pact={pact}
                      onClick={() => handlePactClick(pact.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

interface PactCardProps {
  pact: PactWithCheckInStatus;
  onClick: () => void;
}

function PactCard({ pact, onClick }: PactCardProps) {
  const frequencyText =
    pact.frequency === 'daily'
      ? 'Daily'
      : pact.frequency === 'weekly'
      ? 'Weekly'
      : 'Custom';

  return (
    <button
      onClick={onClick}
      className="w-full bg-surface border border-text-muted/20 rounded-lg p-4 text-left hover:bg-surface-elevated transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-1">{pact.name}</h3>
          <p className="text-sm text-text-muted">
            {frequencyText} {ROAST_EMOJIS[pact.roast_level]}
          </p>
        </div>

        {/* Status Badge */}
        {pact.hasCheckedInToday ? (
          <div className="bg-success/20 px-3 py-1 rounded-full">
            <span className="text-success text-sm font-medium">
              {pact.todayCheckIn?.status === 'success' ? '✅ Done' : '❌ Folded'}
            </span>
          </div>
        ) : !pact.isDueToday ? (
          <div className="bg-surface-elevated px-3 py-1 rounded-full border border-text-muted/20">
            <span className="text-text-muted text-sm">Not due today</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}

interface DuePactCardProps {
  pact: PactWithCheckInStatus;
  groupId: string;
  onClick: () => void;
}

function DuePactCard({ pact, groupId, onClick }: DuePactCardProps) {
  const router = useRouter();

  const handleSuccess = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/group/${groupId}/pact/${pact.id}/check-in?status=success`);
    },
    [groupId, pact.id, router]
  );

  const handleFold = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/group/${groupId}/pact/${pact.id}/check-in?status=fold`);
    },
    [groupId, pact.id, router]
  );

  return (
    <div className="bg-surface border border-text-muted/20 rounded-lg p-4 hover:bg-surface-elevated transition-colors">
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-1">{pact.name}</h3>
            <p className="text-sm text-text-muted">
              {pact.frequency === 'daily' ? 'Daily' : pact.frequency === 'weekly' ? 'Weekly' : 'Custom'}{' '}
              {ROAST_EMOJIS[pact.roast_level]}
            </p>
          </div>
          <div className="bg-primary/20 px-3 py-1 rounded-full">
            <span className="text-primary text-sm font-medium">Due</span>
          </div>
        </div>
      </button>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleSuccess}
          className="flex-1 px-4 py-2 rounded-lg bg-success text-white text-sm font-semibold hover:bg-success/90 transition-colors"
        >
          ✅ Success
        </button>
        <button
          onClick={handleFold}
          className="flex-1 px-4 py-2 rounded-lg bg-error text-white text-sm font-semibold hover:bg-error/90 transition-colors"
        >
          ❌ Fold
        </button>
      </div>
    </div>
  );
}
