'use client';

import { useRouter } from 'next/navigation';
import type { Group, User } from '@cooked/shared';

interface EmptyFeedStateProps {
  group: Group;
  memberCount: number;
  members?: Array<Pick<User, 'id' | 'display_name' | 'avatar_url'>>;
  hasPacts: boolean;
  pactCount?: number;
  hasCheckInsToday: boolean;
  isNewMember?: boolean;
}

export function EmptyFeedState({
  group,
  memberCount,
  members = [],
  hasPacts,
  pactCount = 0,
  hasCheckInsToday,
  isNewMember = false,
}: EmptyFeedStateProps) {
  const router = useRouter();

  const handleCreatePact = () => {
    router.push(`/group/${group.id}/create-pact`);
  };

  const handleCheckIn = () => {
    router.push(`/group/${group.id}/pacts`);
  };

  const handleInvite = () => {
    router.push(`/group/${group.id}/invite`);
  };

  const handleViewPacts = () => {
    router.push(`/group/${group.id}/pacts`);
  };

  // Determine the state and messaging
  let title: string;
  let description: string;
  let primaryAction: { label: string; onClick: () => void };
  let secondaryActions: Array<{ label: string; onClick: () => void }> = [];

  if (isNewMember) {
    title = `Welcome to ${group.name}!`;
    description = 'Get started by creating a pact with your group or invite friends to join.';
    primaryAction = { label: 'Create Your First Pact', onClick: handleCreatePact };
    secondaryActions = [{ label: 'Invite Friends', onClick: handleInvite }];
  } else if (!hasPacts) {
    title = 'No pacts yet';
    description = 'Create your first pact to start holding each other accountable!';
    primaryAction = { label: 'Create Pact', onClick: handleCreatePact };
    secondaryActions = [{ label: 'Invite Friends', onClick: handleInvite }];
  } else if (!hasCheckInsToday) {
    title = pactCount === 1 ? 'You have 1 pact ready to check in' : `You have ${pactCount} pacts ready to check in`;
    description = 'Start your accountability journey today!';
    primaryAction = { label: 'Check In', onClick: handleCheckIn };
    secondaryActions = [
      { label: 'View Pacts', onClick: handleViewPacts },
      { label: 'Invite Friends', onClick: handleInvite },
    ];
  } else {
    title = 'No activity yet';
    description = 'Create a pact and start checking in with your group!';
    primaryAction = { label: 'Create Pact', onClick: handleCreatePact };
    secondaryActions = [
      { label: 'View Pacts', onClick: handleViewPacts },
      { label: 'Invite Friends', onClick: handleInvite },
    ];
  }

  // Show up to 4 member avatars
  const memberPreview = members.slice(0, 4);
  const remainingCount = memberCount - memberPreview.length;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Icon */}
      <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center border border-text-muted/20 mb-6">
        <span className="text-5xl text-text-muted">🔥</span>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-text-primary text-center mb-2">
        {title}
      </h2>

      {/* Description */}
      <p className="text-text-secondary text-center mb-6 max-w-md">
        {description}
      </p>

      {/* Member Preview */}
      {memberCount > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <div className="flex -space-x-2">
            {memberPreview.map((member) => (
              <div
                key={member.id}
                className="w-10 h-10 rounded-full bg-surface border-2 border-background overflow-hidden flex items-center justify-center"
                title={member.display_name}
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-text-primary font-semibold">
                    {member.display_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            ))}
          </div>
          <span className="text-sm text-text-muted">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      )}

      {/* Primary Action */}
      <button
        onClick={primaryAction.onClick}
        className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors mb-4"
      >
        {primaryAction.label}
      </button>

      {/* Secondary Actions */}
      {secondaryActions.length > 0 && (
        <div className="flex items-center gap-4">
          {secondaryActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors underline"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
