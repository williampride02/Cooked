'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useFeed } from '@/hooks/useFeed';
import { FeedItemComponent } from '@/components/feed/FeedItem';
import type { Group, FeedItem } from '@cooked/shared';

export const dynamic = 'force-dynamic';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function GroupFeedPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const [group, setGroup] = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const {
    feedItems,
    isLoading,
    isRefreshing,
    error,
    refresh,
    loadMore,
    hasMore,
  } = useFeed(groupId);

  useEffect(() => {
    // Fetch group details
    const fetchGroup = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) {
        console.error('Fetch group error:', error);
        router.push('/dashboard');
        return;
      }

      setGroup(data as Group);
      setLoadingGroup(false);
    };

    if (groupId) {
      fetchGroup();
    }
  }, [groupId, router]);

  const handleCheckIn = () => {
    router.push(`/group/${groupId}/pacts`);
  };

  const handleInvite = () => {
    router.push(`/group/${groupId}/invite`);
  };

  const handleSettings = () => {
    router.push(`/group/${groupId}/settings`);
  };

  const handleCreatePact = () => {
    router.push(`/group/${groupId}/create-pact`);
  };

  if (loadingGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-text-muted/20 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">
            {group?.name || 'Group'}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleCheckIn}
              className="px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              ✅ Check In
            </button>
            <button
              onClick={handleInvite}
              className="w-10 h-10 bg-surface rounded-full flex items-center justify-center border border-text-muted/20 hover:bg-surface-elevated transition-colors"
              title="Invite members"
            >
              <span className="text-text-primary text-xl">+</span>
            </button>
            <button
              onClick={handleSettings}
              className="w-10 h-10 bg-surface rounded-full flex items-center justify-center border border-text-muted/20 hover:bg-surface-elevated transition-colors"
              title="Group settings"
            >
              <span className="text-text-muted text-sm">*</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="max-w-4xl mx-auto px-8 py-4">
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="max-w-4xl mx-auto px-8 py-4">
        {isLoading && feedItems.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-text-secondary">Loading feed...</div>
          </div>
        ) : feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-text-muted/20 mb-4">
              <span className="text-4xl text-text-muted">*</span>
            </div>
            <p className="text-text-secondary text-center mb-2">No activity yet</p>
            <p className="text-sm text-text-muted text-center mb-6 px-8">
              Create a pact and start checking in with your group!
            </p>
            <button
              onClick={handleCreatePact}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Create Pact
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {feedItems.map((item) => (
              <FeedItemComponent key={item.id} item={item} />
            ))}
            {hasMore && (
              <div className="flex justify-center py-4">
                <button
                  onClick={loadMore}
                  disabled={isLoading || isRefreshing}
                  className="px-6 py-2 bg-surface rounded-lg text-text-primary hover:bg-surface-elevated transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB - Create Pact */}
      {feedItems.length > 0 && (
        <button
          onClick={handleCreatePact}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg hover:bg-primary/90 transition-colors"
          title="Create pact"
        >
          +
        </button>
      )}
    </main>
  );
}
