'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePacts } from '@/hooks/usePacts';
import { usePactStats } from '@/hooks/usePactStats';
import { supabase } from '@/lib/supabase';
import type { PactWithParticipants } from '@cooked/shared';
import { PactStats } from '@/components/pacts/PactStats';

export const dynamic = 'force-dynamic';

const ROAST_EMOJIS: Record<1 | 2 | 3, string> = {
  1: '🌶️',
  2: '🌶️🌶️',
  3: '🌶️🌶️🌶️',
};

const ROAST_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Mild',
  2: 'Medium',
  3: 'Nuclear',
};

const PACT_TYPE_INFO: Record<string, { emoji: string; label: string }> = {
  individual: { emoji: '👤', label: 'Individual' },
  group: { emoji: '👥', label: 'Group' },
  relay: { emoji: '🏃', label: 'Relay' },
};

const DAY_LABELS: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

export default function PactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const pactId = params.pactId as string;
  const [pact, setPact] = useState<PactWithParticipants | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { fetchPact, archivePact, isLoading, error } = usePacts();
  const { fetchPactStats, isLoading: isLoadingStats } = usePactStats();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    async function loadPact() {
      if (!pactId) return;
      const result = await fetchPact(pactId);
      setPact(result);
    }
    loadPact();
  }, [pactId, fetchPact]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEdit = useCallback(() => {
    if (!pactId || !groupId) return;
    router.push(`/group/${groupId}/pact/${pactId}/edit`);
  }, [pactId, groupId, router]);

  const handleArchive = useCallback(async () => {
    if (!pactId) return;
    if (!confirm('Are you sure you want to archive this pact? No new check-ins will be accepted, but history will be preserved.')) {
      return;
    }
    const success = await archivePact(pactId);
    if (success) {
      router.back();
    }
  }, [pactId, archivePact, router]);

  const isCreator = pact?.created_by === currentUserId;

  if (isLoading && !pact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Loading pact...</div>
      </div>
    );
  }

  if (error || !pact) {
    return (
      <main className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-text-muted/20 px-8 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center text-text-primary hover:bg-surface rounded-full transition-colors"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-text-primary">Pact</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-8 py-12 flex items-center justify-center">
          <div className="text-error text-center">
            {error || 'Pact not found'}
          </div>
        </div>
      </main>
    );
  }

  const typeInfo = PACT_TYPE_INFO[pact.pact_type] || PACT_TYPE_INFO.individual;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-text-muted/20 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center text-text-primary hover:bg-surface rounded-full transition-colors"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-text-primary truncate">{pact.name}</h1>
          </div>
          {isCreator && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-surface rounded-lg border border-text-muted/20 text-text-primary hover:bg-surface-elevated transition-colors text-sm font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-6 space-y-6">
        {/* Pact Type Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-text-muted/20">
            <span>{typeInfo.emoji}</span>
            <span className="text-sm text-text-primary">{typeInfo.label}</span>
          </div>
          <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-text-muted/20">
            <span>{ROAST_EMOJIS[pact.roast_level]}</span>
            <span className="text-sm text-text-primary">{ROAST_LABELS[pact.roast_level]}</span>
          </div>
        </div>

        {/* Description */}
        {pact.description && (
          <div>
            <h3 className="text-sm text-text-secondary mb-2">Description</h3>
            <p className="text-base text-text-primary">{pact.description}</p>
          </div>
        )}

        {/* Frequency */}
        <div>
          <h3 className="text-sm text-text-secondary mb-2">Frequency</h3>
          <p className="text-base text-text-primary capitalize">
            {pact.frequency === 'custom' && pact.frequency_days
              ? pact.frequency_days.map((d) => DAY_LABELS[d]).join(', ')
              : pact.frequency}
          </p>
        </div>

        {/* Proof Requirement */}
        <div>
          <h3 className="text-sm text-text-secondary mb-2">Proof Photo</h3>
          <p className="text-base text-text-primary capitalize">
            {pact.proof_required === 'none' ? 'Not Required' : pact.proof_required}
          </p>
        </div>

        {/* Participants */}
        <div>
          <h3 className="text-sm text-text-secondary mb-2">
            Participants ({pact.participants.length})
          </h3>
          <div className="bg-surface border border-text-muted/20 rounded-lg overflow-hidden">
            {pact.participants.map((participant, index) => (
              <div
                key={participant.user_id}
                className={`flex items-center gap-3 p-4 ${
                  index < pact.participants.length - 1 ? 'border-b border-text-muted/20' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center border border-text-muted/20">
                  <span className="text-text-muted text-sm font-medium">
                    {participant.user.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-base text-text-primary">
                    {participant.user.display_name}
                    {participant.user_id === currentUserId && (
                      <span className="text-text-muted"> (you)</span>
                    )}
                  </p>
                  {pact.pact_type === 'relay' && participant.relay_days && participant.relay_days.length > 0 && (
                    <p className="text-xs text-text-muted">
                      {participant.relay_days.map((d) => DAY_LABELS[d]).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics Section */}
        <div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full flex items-center justify-between bg-surface border border-text-muted/20 rounded-lg p-4 hover:bg-surface-elevated transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span className="text-base font-semibold text-text-primary">Statistics</span>
            </div>
            <span className="text-text-muted">{showStats ? '▲' : '▼'}</span>
          </button>

          {showStats && (
            <div className="bg-surface border border-text-muted/20 border-t-0 rounded-b-lg p-4">
              <PactStats pactId={pactId} isLoading={isLoadingStats} />
            </div>
          )}
        </div>

        {/* Archive Button (Creator only) */}
        {isCreator && (
          <button
            onClick={handleArchive}
            className="w-full py-4 rounded-lg bg-error/10 border border-error/30 text-error font-semibold hover:bg-error/20 transition-colors"
          >
            Archive Pact
          </button>
        )}
      </div>
    </main>
  );
}
