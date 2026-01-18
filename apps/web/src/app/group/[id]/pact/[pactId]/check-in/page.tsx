'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePacts } from '@/hooks/usePacts';
import { useCheckIns } from '@/hooks/useCheckIns';

type CheckInStatus = 'success' | 'fold';

const PRESET_EXCUSES = [
  { id: 'long_day', label: 'Long day' },
  { id: 'forgot', label: 'Forgot' },
  { id: 'honest', label: "Be honest, I just didn't want to" },
  { id: 'something_came_up', label: 'Something came up' },
  { id: 'custom', label: 'Custom...' },
];

export const dynamic = 'force-dynamic';

export default function PactCheckInPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const groupId = params.id as string;
  const pactId = params.pactId as string;

  const statusParam = (searchParams.get('status') || 'success') as CheckInStatus;
  const status: CheckInStatus = statusParam === 'fold' ? 'fold' : 'success';
  const isFolding = status === 'fold';

  const [pactName, setPactName] = useState<string>('');
  const [proofRequired, setProofRequired] = useState<'none' | 'optional' | 'required'>('none');
  const [selectedExcuse, setSelectedExcuse] = useState<string | null>(null);
  const [customExcuse, setCustomExcuse] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [localProofPreview, setLocalProofPreview] = useState<string | null>(null);

  const { fetchPact, isLoading: isLoadingPact, error: pactError } = usePacts();
  const { createCheckIn, isLoading: isSubmitting, error: submitError } = useCheckIns();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!pactId) return;
      const pact = await fetchPact(pactId);
      if (!isMounted) return;
      setPactName(pact?.name || '');
      setProofRequired((pact as any)?.proof_required || 'none');
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchPact, pactId]);

  const excuseText = useMemo(() => {
    if (!isFolding) return undefined;
    if (!selectedExcuse) return undefined;
    if (selectedExcuse === 'custom') return customExcuse.trim() || 'Custom excuse';
    return PRESET_EXCUSES.find((e) => e.id === selectedExcuse)?.label;
  }, [customExcuse, isFolding, selectedExcuse]);

  const isValid = useMemo(() => {
    if (isFolding && !selectedExcuse) return false;
    if (proofRequired === 'required' && !proofFile) return false;
    return true;
  }, [isFolding, proofFile, proofRequired, selectedExcuse]);

  const handleBack = useCallback(() => router.back(), [router]);

  const handleSelectExcuse = useCallback((id: string) => {
    setSelectedExcuse(id);
    if (id !== 'custom') setCustomExcuse('');
  }, []);

  const handleProofChange = useCallback((file: File | null) => {
    setProofFile(file);
    if (localProofPreview) URL.revokeObjectURL(localProofPreview);
    setLocalProofPreview(file ? URL.createObjectURL(file) : null);
  }, [localProofPreview]);

  useEffect(() => {
    return () => {
      if (localProofPreview) URL.revokeObjectURL(localProofPreview);
    };
  }, [localProofPreview]);

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;
    const result = await createCheckIn({
      pactId,
      status,
      excuse: excuseText,
      proofFile,
    });

    if (result) {
      router.push(`/group/${groupId}/pacts?checkedIn=1`);
    }
  }, [createCheckIn, excuseText, groupId, isValid, pactId, proofFile, router, status]);

  return (
    <main className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-text-muted/20 px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center text-text-primary hover:bg-surface rounded-full transition-colors"
            title="Go back"
          >
            ←
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-text-primary">
              {isFolding ? 'Fold Check-in' : 'Success Check-in'}
            </h1>
            {pactName && <p className="text-xs text-text-muted">{pactName}</p>}
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-6 space-y-6">
        {(pactError || submitError) && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
            {submitError || pactError}
          </div>
        )}

        {isLoadingPact ? (
          <div className="text-text-secondary">Loading...</div>
        ) : (
          <div className={`rounded-lg border p-4 ${isFolding ? 'border-error/20 bg-error/10' : 'border-success/20 bg-success/10'}`}>
            <div className="text-3xl mb-2">{isFolding ? '😔' : '💪'}</div>
            <div className={`font-semibold ${isFolding ? 'text-error' : 'text-success'}`}>
              {isFolding ? "It's okay, we all fold sometimes" : "Let's go!"}
            </div>
            <div className="text-sm text-text-muted mt-1">
              {isFolding ? 'Pick an excuse and submit your fold.' : 'Submit your check-in for today.'}
            </div>
          </div>
        )}

        {isFolding && (
          <div className="bg-surface border border-text-muted/20 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Why did you fold?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_EXCUSES.map((e) => (
                <button
                  key={e.id}
                  onClick={() => handleSelectExcuse(e.id)}
                  className={`text-left px-3 py-2 rounded-md border transition-colors ${
                    selectedExcuse === e.id ? 'border-primary bg-primary/10' : 'border-text-muted/20 hover:bg-surface-elevated'
                  }`}
                >
                  <div className="text-sm text-text-primary">{e.label}</div>
                </button>
              ))}
            </div>

            {selectedExcuse === 'custom' && (
              <textarea
                value={customExcuse}
                onChange={(e) => setCustomExcuse(e.target.value)}
                placeholder="Type your excuse..."
                className="mt-3 w-full rounded-md bg-background border border-text-muted/20 p-3 text-sm text-text-primary placeholder:text-text-muted"
                rows={3}
              />
            )}
          </div>
        )}

        {proofRequired !== 'none' && (
          <div className="bg-surface border border-text-muted/20 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-2">
              Proof {proofRequired === 'required' ? '(required)' : '(optional)'}
            </h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleProofChange(e.target.files?.[0] || null)}
              className="block w-full text-sm text-text-secondary"
            />
            {localProofPreview && (
              <img
                src={localProofPreview}
                alt="Proof preview"
                className="mt-3 w-full max-w-sm rounded-md border border-text-muted/20"
              />
            )}
            {proofRequired === 'required' && !proofFile && (
              <p className="mt-2 text-xs text-error">This pact requires proof.</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/group/${groupId}/pacts`}
            className="px-4 py-2 rounded-lg border border-text-muted/20 text-text-secondary hover:bg-surface transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={`px-5 py-2 rounded-lg font-semibold transition-colors ${
              !isValid || isSubmitting
                ? 'bg-surface text-text-muted cursor-not-allowed'
                : isFolding
                ? 'bg-error text-white hover:bg-error/90'
                : 'bg-success text-white hover:bg-success/90'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Check-in'}
          </button>
        </div>
      </div>
    </main>
  );
}

