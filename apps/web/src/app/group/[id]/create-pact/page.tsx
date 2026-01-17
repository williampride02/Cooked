'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePacts } from '@/hooks/usePacts';
import { usePactLimit } from '@/hooks/usePactLimit';
import type { User } from '@cooked/shared';

export const dynamic = 'force-dynamic';

const ROAST_LEVELS = [
  { level: 1 as const, label: 'Mild', emoji: '🌶️' },
  { level: 2 as const, label: 'Medium', emoji: '🌶️🌶️' },
  { level: 3 as const, label: 'Nuclear', emoji: '🌶️🌶️🌶️' },
];

const FREQUENCIES = [
  { value: 'daily' as const, label: 'Daily' },
  { value: 'weekly' as const, label: 'Weekly' },
  { value: 'custom' as const, label: 'Custom' },
];

const PROOF_OPTIONS = [
  { value: 'none' as const, label: 'No Proof' },
  { value: 'optional' as const, label: 'Optional' },
  { value: 'required' as const, label: 'Required' },
];

const PACT_TYPES = [
  {
    value: 'individual' as const,
    label: 'Individual',
    emoji: '👤',
    description: 'Each person tracks their own progress',
  },
  {
    value: 'group' as const,
    label: 'Group',
    emoji: '👥',
    description: 'Everyone must check in for group streak',
  },
  {
    value: 'relay' as const,
    label: 'Relay',
    emoji: '🏃',
    description: 'Take turns on assigned days',
  },
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

export default function CreatePactPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>([1, 3, 5]);
  const [roastLevel, setRoastLevel] = useState<1 | 2 | 3>(2);
  const [proofRequired, setProofRequired] = useState<'none' | 'optional' | 'required'>('optional');
  const [pactType, setPactType] = useState<'individual' | 'group' | 'relay'>('individual');
  const [relayAssignments, setRelayAssignments] = useState<Record<string, number[]>>({});
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [members, setMembers] = useState<GroupMemberWithUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { createPact, isLoading, error } = usePacts();
  const { currentCount, maxCount, canCreate, isLoading: isLoadingLimit } = usePactLimit(groupId);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      if (user) {
        setSelectedParticipants([user.id]);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch group members
  useEffect(() => {
    async function fetchMembers() {
      if (!groupId) return;

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
        setMembers(typedMembers);
      }
      setIsLoadingMembers(false);
    }

    fetchMembers();
  }, [groupId]);

  // Toggle participant selection
  const toggleParticipant = useCallback((userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  // Toggle day selection
  const toggleDay = useCallback((day: number) => {
    setFrequencyDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort()
    );
  }, []);

  // Toggle relay day assignment for a participant
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
  const hasParticipants = selectedParticipants.length > 0;
  const isRelayValid = pactType !== 'relay' || selectedParticipants.every(
    (userId) => relayAssignments[userId] && relayAssignments[userId].length > 0
  );

  const isFormValid = isNameValid && hasParticipants && isRelayValid && canCreate;

  // Handle create
  const handleCreate = useCallback(async () => {
    if (!isFormValid || isLoading || !groupId) return;

    const pact = await createPact({
      groupId,
      name: trimmedName,
      description: description.trim() || undefined,
      frequency,
      frequencyDays: frequency === 'custom' ? frequencyDays : undefined,
      roastLevel,
      proofRequired,
      pactType,
      participantIds: selectedParticipants,
      relayAssignments: pactType === 'relay' ? relayAssignments : undefined,
    });

    if (pact) {
      router.push(`/group/${groupId}/pact/${pact.id}`);
    }
  }, [
    isFormValid,
    isLoading,
    groupId,
    trimmedName,
    description,
    frequency,
    frequencyDays,
    roastLevel,
    proofRequired,
    pactType,
    relayAssignments,
    selectedParticipants,
    createPact,
    router,
  ]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (isLoadingMembers || isLoadingLimit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-text-muted/20 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center text-text-primary hover:bg-surface rounded-full transition-colors"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Create Pact</h1>
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

      {/* Pact Limit Warning */}
      {!canCreate && (
        <div className="max-w-4xl mx-auto px-8 py-4">
          <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-lg text-sm text-center">
            You've reached the limit of {maxCount} pacts per group. Upgrade to Premium for unlimited pacts.
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
            placeholder="e.g., Morning Workout"
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
            placeholder="What's this pact about?"
            maxLength={200}
            rows={3}
            className="w-full bg-surface border border-text-muted/20 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">Frequency</label>
          <div className="grid grid-cols-3 gap-3">
            {FREQUENCIES.map((f) => (
              <button
                key={f.value}
                onClick={() => setFrequency(f.value)}
                className={`py-3 rounded-lg border transition-colors ${
                  frequency === f.value
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface border-text-muted/20 text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Days */}
        {frequency === 'custom' && (
          <div>
            <label className="block text-sm text-text-secondary mb-2">Select Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    frequencyDays.includes(day.value)
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-surface border-text-muted/20 text-text-primary hover:bg-surface-elevated'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Roast Level */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">Roast Level</label>
          <div className="grid grid-cols-3 gap-3">
            {ROAST_LEVELS.map((r) => (
              <button
                key={r.level}
                onClick={() => setRoastLevel(r.level)}
                className={`py-3 rounded-lg border transition-colors ${
                  roastLevel === r.level
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface border-text-muted/20 text-text-primary hover:bg-surface-elevated'
                }`}
              >
                <div className="text-2xl mb-1">{r.emoji}</div>
                <div className="text-xs">{r.label}</div>
              </button>
            ))}
          </div>
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

        {/* Pact Type */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">Pact Type</label>
          <div className="grid grid-cols-3 gap-3">
            {PACT_TYPES.map((pt) => (
              <button
                key={pt.value}
                onClick={() => setPactType(pt.value)}
                className={`py-3 rounded-lg border transition-colors ${
                  pactType === pt.value
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface border-text-muted/20 text-text-primary hover:bg-surface-elevated'
                }`}
              >
                <div className="text-2xl mb-1">{pt.emoji}</div>
                <div className="text-xs font-medium">{pt.label}</div>
                <div className="text-xs text-text-muted mt-1">{pt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            Participants * ({selectedParticipants.length})
          </label>
          <div className="space-y-2">
            {members.map((member) => (
              <button
                key={member.user_id}
                onClick={() => toggleParticipant(member.user_id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  selectedParticipants.includes(member.user_id)
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
                  <p className="text-base text-text-primary">
                    {member.user.display_name}
                    {member.user_id === currentUserId && (
                      <span className="text-text-muted"> (you)</span>
                    )}
                  </p>
                </div>
                {selectedParticipants.includes(member.user_id) && (
                  <span className="text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
          {!hasParticipants && (
            <p className="text-xs text-error mt-1">At least one participant is required</p>
          )}
        </div>

        {/* Relay Day Assignments */}
        {pactType === 'relay' && selectedParticipants.length > 0 && (
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Assign Days to Participants
            </label>
            <div className="space-y-4">
              {selectedParticipants.map((userId) => {
                const member = members.find((m) => m.user_id === userId);
                if (!member) return null;
                const assignedDays = relayAssignments[userId] || [];

                return (
                  <div key={userId} className="bg-surface border border-text-muted/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-text-primary mb-2">
                      {member.user.display_name}
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

        {/* Create Button */}
        <div className="pt-4">
          <button
            onClick={handleCreate}
            disabled={!isFormValid || isLoading}
            className="w-full py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Pact'}
          </button>
        </div>
      </div>
    </main>
  );
}
