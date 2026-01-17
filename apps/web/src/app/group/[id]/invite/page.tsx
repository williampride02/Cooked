'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useInvites } from '@/hooks/useInvites';
import type { Group } from '@cooked/shared';

export const dynamic = 'force-dynamic';

interface JoinRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_avatar_url: string | null;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export default function GroupInvitePage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const [group, setGroup] = useState<Group | null>(null);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [inviteLink, setInviteLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { listJoinRequests, reviewJoinRequest, rotateInviteToken, isLoading, error } = useInvites();

  // Get web host for invite link
  const getWebHost = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://cooked.app'; // fallback
  };

  // Load group and check admin status
  useEffect(() => {
    const loadGroup = async () => {
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Fetch group error:', groupError);
        router.push('/dashboard');
        return;
      }

      setGroup(groupData as Group);

      // Build invite link
      if (groupData?.invite_token) {
        setInviteLink(`${getWebHost()}/join/${groupData.invite_token}`);
      }

      // Check if current user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: memberData } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .single();

        setIsAdmin(memberData?.role === 'admin');
      }
    };

    if (groupId) {
      loadGroup();
    }
  }, [groupId, router]);

  // Load join requests (admin only)
  useEffect(() => {
    const loadRequests = async () => {
      if (isAdmin && groupId) {
        const requests = await listJoinRequests(groupId);
        setJoinRequests(requests);
      }
    };

    loadRequests();
  }, [isAdmin, groupId, listJoinRequests]);

  const handleCopyLink = useCallback(async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  }, [inviteLink]);

  const handleRotateToken = useCallback(async () => {
    if (!groupId) return;
    if (!confirm('Are you sure you want to regenerate the invite link? The old link will no longer work.')) {
      return;
    }

    const newToken = await rotateInviteToken(groupId);
    if (newToken) {
      setInviteLink(`${getWebHost()}/join/${newToken}`);
      // Reload group to get updated token
      const { data } = await supabase
        .from('groups')
        .select('invite_token')
        .eq('id', groupId)
        .single();
      if (data) {
        setInviteLink(`${getWebHost()}/join/${data.invite_token}`);
      }
    }
  }, [groupId, rotateInviteToken]);

  const handleReviewRequest = useCallback(async (requestId: string, decision: 'approved' | 'denied') => {
    const success = await reviewJoinRequest(requestId, decision);
    if (success) {
      // Reload requests
      const requests = await listJoinRequests(groupId);
      setJoinRequests(requests);
    }
  }, [reviewJoinRequest, listJoinRequests, groupId]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  const pendingRequests = joinRequests.filter((r) => r.status === 'pending');

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
          <h1 className="text-2xl font-bold text-text-primary">Invite Members</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-6 space-y-6">
        {/* Invite Link Section */}
        <div className="bg-surface border border-text-muted/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Invite Link</h2>
          <p className="text-sm text-text-secondary mb-4">
            Share this link with friends to invite them to join your group. Anyone with this link can join.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 bg-background border border-text-muted/20 rounded-lg px-4 py-2 text-text-primary text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={handleRotateToken}
              disabled={isLoading}
              className="px-4 py-2 bg-surface-elevated border border-text-muted/20 text-text-primary rounded-lg hover:bg-surface transition-colors text-sm disabled:opacity-50"
            >
              {isLoading ? 'Regenerating...' : 'Regenerate Link'}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Join Requests Section (Admin Only) */}
        {isAdmin && (
          <div className="bg-surface border border-text-muted/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Join Requests ({pendingRequests.length})
            </h2>

            {pendingRequests.length === 0 ? (
              <p className="text-text-secondary text-sm">No pending join requests</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-background border border-text-muted/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center border border-text-muted/20">
                        <span className="text-text-muted text-sm font-medium">
                          {request.requester_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-base text-text-primary font-medium">
                          {request.requester_name}
                        </p>
                        <p className="text-xs text-text-muted">
                          Requested {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewRequest(request.id, 'approved')}
                        disabled={isLoading}
                        className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewRequest(request.id, 'denied')}
                        disabled={isLoading}
                        className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info for non-admins */}
        {!isAdmin && (
          <div className="bg-surface border border-text-muted/20 rounded-lg p-6">
            <p className="text-text-secondary text-sm">
              Only group admins can manage invite links and review join requests.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
