'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useGroups } from '@/hooks/useGroups';
import type { Group } from '@cooked/shared';

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { fetchUserGroups, isLoading: groupsLoading } = useGroups();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);

    // Fetch user groups
    const userGroups = await fetchUserGroups();
    setGroups(userGroups);

    // If user has groups, redirect to first group
    if (userGroups.length > 0) {
      router.replace(`/group/${userGroups[0].id}`);
      return;
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading || groupsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">
            <span className="text-primary">Cooked</span>
          </h1>
          <div className="flex gap-4">
            <Link
              href="/settings"
              className="px-4 py-2 bg-surface-elevated rounded-lg hover:bg-surface transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-surface-elevated rounded-lg hover:bg-surface transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Illustration placeholder */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center border border-text-muted/20">
                <span className="text-4xl text-text-muted">*</span>
              </div>
            </div>

            {/* Create Group Option */}
            <Link
              href="/create-group"
              className="block bg-surface border border-text-muted/20 rounded-lg p-6 mb-4 hover:bg-surface-elevated transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    Create a Group
                  </h3>
                  <p className="text-sm text-text-secondary">Start fresh</p>
                </div>
                <span className="text-text-muted text-xl">→</span>
              </div>
            </Link>

            {/* Join Group Option */}
            <Link
              href="/join-group"
              className="block bg-surface border border-text-muted/20 rounded-lg p-6 hover:bg-surface-elevated transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    Join with Link
                  </h3>
                  <p className="text-sm text-text-secondary">Got invited?</p>
                </div>
                <span className="text-text-muted text-xl">→</span>
              </div>
            </Link>

            {/* Helper text */}
            <p className="text-sm text-text-muted text-center mt-8">
              You need at least 3 friends to start cooking.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
