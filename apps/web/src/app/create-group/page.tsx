'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGroups } from '@/hooks/useGroups';

export const dynamic = 'force-dynamic';

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 30;

export default function CreateGroupPage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { createGroup, isLoading, error } = useGroups();

  const trimmedName = groupName.trim();
  const isNameValid =
    trimmedName.length >= MIN_NAME_LENGTH && trimmedName.length <= MAX_NAME_LENGTH;
  const showNameError =
    trimmedName.length > 0 && trimmedName.length < MIN_NAME_LENGTH;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid || isLoading) return;

    const group = await createGroup(trimmedName);

    if (group) {
      // Navigate to the invite screen for this group
      router.push(`/group/${group.id}/invite`);
    }
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
            Create a Group
          </h1>
        </div>

        {/* Content */}
        <div className="bg-surface p-8 rounded-lg">
          {/* Group Name Input */}
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label htmlFor="groupName" className="block text-sm text-text-secondary mb-2">
                Group Name
              </label>
              <div
                className={`flex items-center bg-background border rounded-lg px-4 py-3 ${
                  showNameError
                    ? 'border-error'
                    : isFocused
                    ? 'border-primary'
                    : 'border-text-muted/20'
                }`}
              >
                <input
                  id="groupName"
                  type="text"
                  className="flex-1 bg-transparent text-text-primary outline-none"
                  placeholder="e.g., Morning Gym Squad"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  maxLength={MAX_NAME_LENGTH}
                  autoCapitalize="words"
                  autoCorrect="off"
                  disabled={isLoading}
                />
                <span
                  className={`text-sm ml-4 ${
                    trimmedName.length >= MIN_NAME_LENGTH
                      ? 'text-text-secondary'
                      : 'text-text-muted'
                  }`}
                >
                  {trimmedName.length}/{MAX_NAME_LENGTH}
                </span>
              </div>

              {/* Name validation error */}
              {showNameError && (
                <p className="text-error text-sm mt-2">
                  Group name must be at least {MIN_NAME_LENGTH} characters
                </p>
              )}

              {/* API Error */}
              {error && (
                <p className="text-error text-sm mt-4 text-center">{error}</p>
              )}
            </div>

            {/* Helper Text */}
            <p className="text-sm text-text-muted">
              You'll be the admin of this group. Invite at least 2 friends to start
              cooking!
            </p>

            {/* Create Button */}
            <button
              type="submit"
              disabled={!isNameValid || isLoading}
              className={`w-full py-4 rounded-lg font-semibold transition-colors ${
                isNameValid && !isLoading
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-surface-elevated text-text-muted cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
