'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePacts } from '@/hooks/usePacts';
import type { User, PactWithParticipants } from '@cooked/shared';

export const dynamic = 'force-dynamic';

const PROOF_OPTIONS = [
  { value: 'none' as const, label: 'No Proof' },
  { value: 'optional' as const, label: 'Optional' },
  { value: 'required' as const, label: 'Required' },
];

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

interface GroupMemberWithUser {
  user_id: string;
  user: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
}

export default function EditPactPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const pactId = params.pactId as string;
  const [pact, setPact] = useState<PactWithParticipants | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [proofRequired, setProofRequired] = useState<'none' | 'optional' | 'required'>('optional');
  const [relayAssignments, setRelayAssignments] = useState<Record<string, number[]>>({});
  const [availableMembers, setAvailableMembers] = useState<GroupMemberWithUser[]>([]);
  const [newParticipantIds, setNewParticipantIds] = useState<string[]>([]);
  const [isLoadingPact, setIsLoadingPact] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { fetchPact, updatePact, isLoading, error } = usePacts();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Load pact data
  useEffect(() => {
    async function loadPact() {
      if (!pactId) return;
      const result = await fetchPact(pactId);
      if (result) {
        setPact(result);
        setName(result.name);
        setDescription(result.description || '');
        setProofRequired(result.proof_required);
        
        // Initialize relay assignments from existing participants
        if (result.pact_type === 'relay') {
          const assignments: Record<string, number[]> = {};
          result.participants.forEach((p) => {
            if (p.relay_days) {
              assignments[p.user_id] = p.relay_days;
            }
          });
          setRelayAssignments(assignments);
        }
      }
      setIsLoadingPact(false);
    }
    loadPact();
  }, [pactId, fetchPact]);

  // Fetch available members (those not already in the pact)
  useEffect(() => {
    async function fetchMembers() {
      if (!groupId || !pact) return;

      const { data, error: fetchError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          users:user_id (id, display_name, avatar_url)
        `)
        .eq('group_id', groupId);

      if (fetchError) {
        console.error('Fetch members error:', fetchError);
      } else {
        const typedMembers = (data || []).map((m) => ({
          user_id: m.user_id,
          user: m.users as unknown as Pick<User, 'id' | 'display_name' | 'avatar_url'>,
        }));
        
        // Filter out existing participants
        const existingParticipantIds = pact.participants.map((p) => p.user_id);
        const available = typedMembers.filter((m) => !existingParticipantIds.includes(m.user_id));
        setAvailableMembers(available);
      }
    }

    if (pact) {
      fetchMembers();
    }
  }, [groupId, pact]);

  // Track changes
  useEffect(() => {
    if (!pact) return;
    
    const nameChanged = name !== pact.name;
    const descChanged = description !== (pact.description || '');
    const proofChanged = proofRequired !== pact.proof_required;
    const hasNewParticipants = newParticipantIds.length > 0;
    
    setHasChanges(nameChanged || descChanged || proofChanged || hasNewParticipants);
  }, [pact, name, description, proofRequired, newParticipantIds]);

  // Toggle new participant selection
  const toggleNewParticipant = useCallback((userId: string) => {
    setNewParticipantIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  // Toggle relay day assignment
  const toggleRelayDay = useCallback((userId: string, day: number) => {
    setRelayAssignments((prev) => {
      const currentDays = prev[userId] || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day].sort();
      return { ...prev, [userId]: newDays };
    });
  }, []);

  // Validation
  const trimmedName = name.trim();
  const isNameValid = trimmedName.length >= 2 && trimmedName.length <= 50;
  const isRelayValid = !pact || pact.pact_type !== 'relay' || 
    [...(pact.participants.map(p => p.user_id)), ...newParticipantIds].every(
      (userId) => relayAssignments[userId] && relayAssignments[userId].length > 0
    );

  const isFormValid = isNameValid && isRelayValid;

  // Handle save
  const handleSave = useCallback(async () => {
    if (!isFormValid || isLoading || !pactId) return;

    const success = await updatePact({
      pactId,
      name: trimmedName,
      description: description.trim() || undefined,
      proofRequired,
      newParticipantIds: newParticipantIds.length > 0 ? newParticipantIds : undefined,
      relayAssignments: pact?.pact_type === 'relay' ? relayAssignments : undefined,
    });

    if (success) {
      router.push(`/group/${groupId}/pact/${pactId}`);
    }
  }, [
    isFormValid,
    isLoading,
    pactId,
    trimmedName,
    description,
    proofRequired,
    newParticipantIds,
    relayAssignments,
    pact,
    updatePact,
    router,
    groupId,
  ]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return;
      }
    }
    router.back();
  }, [hasChanges, router]);

  if (isLoadingPact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Loading pact...</div>
      </div>
    );
  }

  if (!pact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-error">Pact not found</div>
      </div>
    );
  }

  const allParticipantIds = [...pact.participants.map(p => p.user_id), ...newParticipantIds];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-text-muted/20 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="w-10 h-10 flex items-center justify-center text-text-primary hover:bg-surface rounded-full transition-colors"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Edit Pact</h1>
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

      {/* Form */}
      <div className="max-w-4xl mx-auto px-8 py-6 space-y-6">
        {/* Pact Name */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            Pact Name * ({trimmedName.length}/50)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="w-full bg-surface border border-text-muted/20 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-primary"
          />
          {!isNameValid && trimmedName.length > 0 && (
            <p className="text-xs text-error mt-1">Pact name must be 2-50 characters</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            rows={3}
            className="w-full bg-surface border border-text-muted/20 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Proof Required */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">Proof Photo</label>
          <div className="grid grid-cols-3 gap-3">
            {PROOF_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setProofRequired(p.value)}
                className={`py-3 rounded-lg border transition-colors ${
                  proofRequired === p.value
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface border-text-muted/20 text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Existing Participants (read-only) */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            Current Participants ({pact.participants.length})
          </label>
          <div className="space-y-2">
            {pact.participants.map((participant) => (
              <div
                key={participant.user_id}
                className="flex items-center gap-3 p-3 bg-surface border border-text-muted/20 rounded-lg"
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Participants */}
        {availableMembers.length > 0 && (
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Add Participants ({newParticipantIds.length} selected)
            </label>
            <div className="space-y-2">
              {availableMembers.map((member) => (
                <button
                  key={member.user_id}
                  onClick={() => toggleNewParticipant(member.user_id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    newParticipantIds.includes(member.user_id)
                      ? 'bg-primary/20 border-primary'
                      : 'bg-surface border-text-muted/20 hover:bg-surface-elevated'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center border border-text-muted/20">
                    <span className="text-text-muted text-sm font-medium">
                      {member.user.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base text-text-primary">{member.user.display_name}</p>
                  </div>
                  {newParticipantIds.includes(member.user_id) && (
                    <span className="text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Relay Day Assignments */}
        {pact.pact_type === 'relay' && allParticipantIds.length > 0 && (
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Assign Days to Participants
            </label>
            <div className="space-y-4">
              {allParticipantIds.map((userId) => {
                const participant = pact.participants.find((p) => p.user_id === userId) ||
                  availableMembers.find((m) => m.user_id === userId);
                if (!participant) return null;
                const assignedDays = relayAssignments[userId] || [];

                return (
                  <div key={userId} className="bg-surface border border-text-muted/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-text-primary mb-2">
                      {participant.user.display_name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => (
                        <button
                          key={day.value}
                          onClick={() => toggleRelayDay(userId, day.value)}
                          className={`px-3 py-1.5 rounded-lg border transition-colors ${
                            assignedDays.includes(day.value)
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-surface-elevated border-text-muted/20 text-text-primary hover:bg-surface'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    {assignedDays.length === 0 && (
                      <p className="text-xs text-error mt-2">
                        This participant needs at least one day assigned
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {!isRelayValid && (
              <p className="text-xs text-error mt-2">
                All participants must have at least one day assigned
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleCancel}
            className="flex-1 py-4 bg-surface border border-text-muted/20 text-text-primary rounded-lg font-semibold hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid || isLoading || !hasChanges}
            className="flex-1 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </main>
  );
}
