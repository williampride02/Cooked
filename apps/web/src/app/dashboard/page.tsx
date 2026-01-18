'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useGroups } from '@/hooks/useGroups';
import { useFeed } from '@/hooks/useFeed';
import { GroupFilter } from '@/components/feed/GroupFilter';
import { FeedItemComponent } from '@/components/feed/FeedItem';
import type { Group } from '@cooked/shared';

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { fetchUserGroups, isLoading: groupsLoading } = useGroups();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const {
    feedItems,
    isLoading: feedLoading,
    isRefreshing,
    error: feedError,
    hasNewActivity,
    reactionByCheckInId,
    toggleCheckInReaction,
    refresh,
    loadMore,
    hasMore,
  } = useFeed(selectedGroupId);

  const handleFeedItemClick = useCallback(
    (item: any) => {
      if (!item?.type) return;
      if (item.type === 'check_in') {
        if (item.check_in?.status === 'fold') {
          router.push(`/roast/${item.check_in.id}`);
          return;
        }
        router.push(`/group/${item.group_id}/pact/${item.check_in.pact_id}`);
        return;
      }
      if (item.type === 'pact_created') {
        router.push(`/group/${item.group_id}/pact/${item.pact.id}`);
        return;
      }
      if (item.type === 'recap') {
        router.push(`/group/${item.group_id}/recaps/${item.recap_id}`);
        return;
      }
    },
    [router]
  );

  // Create a map of group IDs to group names for displaying in feed items
  const groupMap = new Map<string, string>();
  groups.forEach((group) => {
    groupMap.set(group.id, group.name);
  });

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

  // If user has no groups, show empty state
  if (groups.length === 0) {
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

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-text-muted/20 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-text-primary">
            <span className="text-primary">Cooked</span>
          </h1>
          <div className="flex gap-4">
            <Link
              href="/settings"
              className="px-4 py-2 bg-surface rounded-lg hover:bg-surface-elevated transition-colors text-sm"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-surface rounded-lg hover:bg-surface-elevated transition-colors text-sm"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Group Filter */}
        <div className="max-w-4xl mx-auto px-8">
          <GroupFilter
            groups={groups}
            selectedGroupId={selectedGroupId}
            onGroupChange={(groupId) => {
              setSelectedGroupId(groupId);
              if (groupId) {
                router.push(`/group/${groupId}`);
              } else {
                // Already on dashboard, just update state
                setSelectedGroupId(null);
              }
            }}
          />
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-4xl mx-auto px-8 py-4">
        {hasNewActivity && (
          <div className="mb-3 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg text-sm text-center">
            New activity
          </div>
        )}
        {feedLoading && feedItems.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-text-secondary">Loading feed...</div>
          </div>
        ) : feedError ? (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm text-center">
            {feedError}
          </div>
        ) : feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-text-muted/20 mb-4">
              <span className="text-4xl text-text-muted">🔥</span>
            </div>
            <p className="text-text-secondary text-center mb-2">No activity yet</p>
            <p className="text-sm text-text-muted text-center mb-6 px-8">
              {selectedGroupId
                ? 'Create a pact and start checking in with your group!'
                : 'Create a group and start checking in with your friends!'}
            </p>
            {selectedGroupId ? (
              <Link
                href={`/group/${selectedGroupId}/create-pact`}
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Create Pact
              </Link>
            ) : (
              <Link
                href="/create-group"
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Create Group
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {feedItems.map((item) => (
              <FeedItemComponent
                key={item.id}
                item={item}
                showGroupName={!selectedGroupId}
                groupName={groupMap.get(item.group_id)}
                onPress={() => handleFeedItemClick(item)}
                reactions={item.type === 'check_in' ? reactionByCheckInId[item.check_in.id] : undefined}
                onToggleReaction={
                  item.type === 'check_in'
                    ? (emoji) => toggleCheckInReaction(item.check_in.id, emoji)
                    : undefined
                }
              />
            ))}
            {hasMore && (
              <div className="flex justify-center py-4">
                <button
                  onClick={loadMore}
                  disabled={feedLoading || isRefreshing}
                  className="px-6 py-2 bg-surface rounded-lg text-text-primary hover:bg-surface-elevated transition-colors disabled:opacity-50"
                >
                  {feedLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
