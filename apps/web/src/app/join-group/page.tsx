'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useGroups } from '@/hooks/useGroups';

export const dynamic = 'force-dynamic';

const CODE_LENGTH = 6;

export default function JoinGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { joinGroup, isLoading, error } = useGroups();

  // Pre-fill invite code from URL params
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code);
    }
  }, [searchParams]);

  const trimmedCode = inviteCode.trim().toLowerCase();
  const isCodeValid = trimmedCode.length === CODE_LENGTH;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCodeValid || isLoading) return;

    const group = await joinGroup(trimmedCode);

    if (group) {
      // Navigate to the group feed
      router.push(`/group/${group.id}`);
    }
  };

  // Handle text change - allow only alphanumeric
  const handleChangeText = (text: string) => {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').slice(0, CODE_LENGTH);
    setInviteCode(cleaned);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            href="/dashboard"
            className="w-11 h-11 flex items-center justify-center text-text-primary text-xl hover:bg-surface rounded-lg transition-colors"
          >
            ←
          </Link>
          <h1 className="text-2xl font-semibold text-text-primary ml-4">
            Join a Group
          </h1>
        </div>

        {/* Content */}
        <div className="bg-surface p-8 rounded-lg">
          <form onSubmit={handleJoin} className="space-y-6">
            {/* Invite Code Input */}
            <div>
              <label htmlFor="inviteCode" className="block text-sm text-text-secondary mb-2">
                Invite Code
              </label>
              <div
                className={`flex items-center bg-background border rounded-lg px-4 py-3 ${
                  isFocused ? 'border-primary' : 'border-text-muted/20'
                }`}
              >
                <input
                  id="inviteCode"
                  type="text"
                  className="flex-1 bg-transparent text-text-primary outline-none text-center font-mono tracking-widest"
                  placeholder="XXXXXX"
                  value={inviteCode.toUpperCase()}
                  onChange={(e) => handleChangeText(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  maxLength={CODE_LENGTH}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* API Error */}
            {error && (
              <p className="text-error text-sm text-center">{error}</p>
            )}

            {/* Helper Text */}
            <p className="text-sm text-text-muted">
              Enter the 6-character invite code shared by your friend.
            </p>

            {/* Join Button */}
            <button
              type="submit"
              disabled={!isCodeValid || isLoading}
              className={`w-full py-4 rounded-lg font-semibold transition-colors ${
                isCodeValid && !isLoading
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-surface-elevated text-text-muted cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Joining...' : 'Join Group'}
            </button>

            {/* Or Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-text-muted/20" />
              <span className="text-sm text-text-muted mx-4">or</span>
              <div className="flex-1 h-px bg-text-muted/20" />
            </div>

            {/* Paste Link Helper */}
            <p className="text-sm text-text-secondary text-center">
              Click an invite link from your friend to join automatically.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
