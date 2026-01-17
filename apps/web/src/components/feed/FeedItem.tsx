'use client';

import type { FeedItem as FeedItemType, CheckInFeedItem } from '@cooked/shared';

interface FeedItemProps {
  item: FeedItemType;
  onPress?: () => void;
}

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

function CheckInItem({ item }: { item: CheckInFeedItem }) {
  const isSuccess = item.check_in.status === 'success';

  return (
    <div className="bg-surface border border-text-muted/20 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center overflow-hidden border border-text-muted/20">
          {item.user.avatar_url ? (
            <img
              src={item.user.avatar_url}
              alt={`${item.user.display_name}'s avatar`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-text-muted text-sm">
              {item.user.display_name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* User and Action */}
        <div className="flex-1 ml-3">
          <p className="text-sm font-semibold text-text-primary">
            {item.user.display_name}
          </p>
          <p className="text-xs text-text-muted">
            {formatTimeAgo(item.created_at)}
          </p>
        </div>

        {/* Status Icon */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isSuccess ? 'bg-success/20' : 'bg-error/20'
          }`}
        >
          <span className="text-lg">{isSuccess ? '✅' : '❌'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="ml-[52px]">
        <p className="text-sm text-text-primary">
          {isSuccess ? 'Crushed' : 'Folded on'}{' '}
          <span className="font-semibold">{item.pact.name}</span>
        </p>

        {/* Excuse for folds */}
        {!isSuccess && item.check_in.excuse && (
          <div className="mt-2 bg-surface-elevated rounded p-2">
            <p className="text-xs text-text-secondary italic">
              &quot;{item.check_in.excuse}&quot;
            </p>
          </div>
        )}

        {/* Roast thread indicator for folds */}
        {!isSuccess && (
          <div className="mt-2">
            <p className="text-primary text-xs font-semibold">
              🔥 Tap to view roast thread
            </p>
          </div>
        )}

        {/* Proof image */}
        {item.check_in.proof_url && (
          <div className="mt-2 rounded overflow-hidden">
            <img
              src={item.check_in.proof_url}
              alt="Proof"
              className="w-full max-w-xs object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function FeedItemComponent({ item, onPress }: FeedItemProps) {
  if (item.type === 'check_in') {
    return (
      <div onClick={onPress} className="cursor-pointer">
        <CheckInItem item={item} />
      </div>
    );
  }

  // For now, only check-in items are implemented
  // Other types (member_joined, pact_created, recap) can be added later
  return null;
}
