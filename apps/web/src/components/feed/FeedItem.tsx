'use client';

import type {
  FeedItem as FeedItemType,
  CheckInFeedItem,
  MemberJoinedFeedItem,
  PactCreatedFeedItem,
  RecapFeedItem,
} from '@cooked/shared';
import type { ReactionEmoji } from '@cooked/shared';
import { REACTION_EMOJI_OPTIONS } from '@/hooks/useReactions';

interface FeedItemProps {
  item: FeedItemType;
  onPress?: () => void;
  showGroupName?: boolean;
  groupName?: string;
  reactions?: {
    counts: Record<ReactionEmoji, number>;
    myReaction: ReactionEmoji | null;
  };
  onToggleReaction?: (emoji: ReactionEmoji) => void;
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

function CheckInItem({ 
  item, 
  showGroupName = false, 
  groupName,
  reactions,
  onToggleReaction,
}: { 
  item: CheckInFeedItem;
  showGroupName?: boolean;
  groupName?: string;
  reactions?: FeedItemProps['reactions'];
  onToggleReaction?: FeedItemProps['onToggleReaction'];
}) {
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
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-text-primary">
              {item.user.display_name}
            </p>
            {showGroupName && groupName && (
              <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-full">
                {groupName}
              </span>
            )}
          </div>
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

        {/* Reactions */}
        {reactions && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {REACTION_EMOJI_OPTIONS.map((opt) => {
              const count = reactions.counts[opt.key] || 0;
              const isMine = reactions.myReaction === opt.key;
              if (count === 0 && !isMine) return null;
              return (
                <button
                  key={opt.key}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReaction?.(opt.key);
                  }}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    isMine
                      ? 'bg-primary/15 border-primary/30 text-primary'
                      : 'bg-surface-elevated border-text-muted/20 text-text-primary hover:bg-surface'
                  }`}
                >
                  {opt.label} {count > 0 ? count : ''}
                </button>
              );
            })}

            {/* Quick picker */}
            <div className="flex items-center gap-1">
              {REACTION_EMOJI_OPTIONS.map((opt) => (
                <button
                  key={`picker-${item.check_in.id}-${opt.key}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReaction?.(opt.key);
                  }}
                  className="text-xs px-2 py-1 rounded-full border bg-surface border-text-muted/20 hover:bg-surface-elevated transition-colors"
                  title="React"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MemberJoinedItem({
  item,
  showGroupName = false,
  groupName,
}: {
  item: MemberJoinedFeedItem;
  showGroupName?: boolean;
  groupName?: string;
}) {
  return (
    <div className="bg-surface border border-text-muted/20 rounded-lg p-4">
      <div className="flex items-center">
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

        <div className="flex-1 ml-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-text-primary">
              {item.user.display_name}
            </p>
            {showGroupName && groupName && (
              <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-full">
                {groupName}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted">{formatTimeAgo(item.created_at)}</p>
        </div>

        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20">
          <span className="text-lg">👋</span>
        </div>
      </div>

      <div className="ml-[52px] mt-2">
        <p className="text-sm text-text-primary">
          joined the group
        </p>
      </div>
    </div>
  );
}

function PactCreatedItem({
  item,
  showGroupName = false,
  groupName,
}: {
  item: PactCreatedFeedItem;
  showGroupName?: boolean;
  groupName?: string;
}) {
  const roastEmoji = item.pact.roast_level === 1 ? '🌶️' : item.pact.roast_level === 2 ? '🌶️🌶️' : '🌶️🌶️🌶️';
  return (
    <div className="bg-surface border border-text-muted/20 rounded-lg p-4">
      <div className="flex items-center mb-3">
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

        <div className="flex-1 ml-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-text-primary">
              {item.user.display_name}
            </p>
            {showGroupName && groupName && (
              <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-full">
                {groupName}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted">{formatTimeAgo(item.created_at)}</p>
        </div>

        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-elevated border border-text-muted/20">
          <span className="text-lg">📋</span>
        </div>
      </div>

      <div className="ml-[52px]">
        <p className="text-sm text-text-primary">
          created a new pact <span className="font-semibold">{item.pact.name}</span>
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
          <span className="bg-surface-elevated px-2 py-0.5 rounded-full border border-text-muted/20 capitalize">
            {item.pact.frequency}
          </span>
          <span className="bg-surface-elevated px-2 py-0.5 rounded-full border border-text-muted/20">
            {roastEmoji}
          </span>
        </div>
      </div>
    </div>
  );
}

function RecapItem({
  item,
  showGroupName = false,
  groupName,
}: {
  item: RecapFeedItem;
  showGroupName?: boolean;
  groupName?: string;
}) {
  return (
    <div className="bg-surface border border-text-muted/20 rounded-lg p-4">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center border border-text-muted/20">
          <span className="text-lg">📊</span>
        </div>

        <div className="flex-1 ml-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-text-primary">Weekly recap</p>
            {showGroupName && groupName && (
              <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-full">
                {groupName}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted">
            {new Date(item.week_start).toLocaleDateString()} – {new Date(item.week_end).toLocaleDateString()}
          </p>
        </div>

        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20">
          <span className="text-lg">🧾</span>
        </div>
      </div>

      <div className="ml-[52px] mt-2">
        <p className="text-sm text-text-primary text-primary font-semibold">
          Tap to view recap
        </p>
      </div>
    </div>
  );
}

export function FeedItemComponent({ 
  item, 
  onPress, 
  showGroupName = false,
  groupName,
  reactions,
  onToggleReaction,
}: FeedItemProps) {
  if (item.type === 'check_in') {
    return (
      <div onClick={onPress} className="cursor-pointer">
        <CheckInItem
          item={item}
          showGroupName={showGroupName}
          groupName={groupName}
          reactions={reactions}
          onToggleReaction={onToggleReaction}
        />
      </div>
    );
  }

  if (item.type === 'member_joined') {
    return (
      <div onClick={onPress} className={onPress ? 'cursor-pointer' : ''}>
        <MemberJoinedItem item={item} showGroupName={showGroupName} groupName={groupName} />
      </div>
    );
  }

  if (item.type === 'pact_created') {
    return (
      <div onClick={onPress} className={onPress ? 'cursor-pointer' : ''}>
        <PactCreatedItem item={item} showGroupName={showGroupName} groupName={groupName} />
      </div>
    );
  }

  if (item.type === 'recap') {
    return (
      <div onClick={onPress} className={onPress ? 'cursor-pointer' : ''}>
        <RecapItem item={item} showGroupName={showGroupName} groupName={groupName} />
      </div>
    );
  }

  return null;
}
