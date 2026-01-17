'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface GroupInvitePreview {
  group_id: string;
  name: string;
  member_count: number;
}

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

interface UseInvitesReturn {
  isLoading: boolean;
  error: string | null;
  getInvitePreview: (token: string) => Promise<GroupInvitePreview | null>;
  joinByToken: (token: string) => Promise<{ groupId: string; success: boolean; message: string } | null>;
  requestJoinByCode: (code: string) => Promise<{ requestId: string; groupId: string; success: boolean; message: string } | null>;
  listJoinRequests: (groupId: string) => Promise<JoinRequest[]>;
  reviewJoinRequest: (requestId: string, decision: 'approved' | 'denied') => Promise<boolean>;
  rotateInviteToken: (groupId: string) => Promise<string | null>;
}

export function useInvites(): UseInvitesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get group preview from invite token (public, no auth required)
  const getInvitePreview = useCallback(
    async (token: string): Promise<GroupInvitePreview | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc('get_group_invite_preview', {
          invite_token_param: token,
        });

        if (rpcError) {
          console.error('Get invite preview error:', rpcError);
          setError(rpcError.message || 'Failed to load group preview');
          return null;
        }

        if (!data || data.length === 0) {
          setError('Invalid invite link');
          return null;
        }

        return {
          group_id: data[0].group_id,
          name: data[0].name,
          member_count: Number(data[0].member_count) || 0,
        };
      } catch (err) {
        console.error('Get invite preview exception:', err);
        setError('Failed to load group preview');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Join group by invite token
  const joinByToken = useCallback(
    async (token: string): Promise<{ groupId: string; success: boolean; message: string } | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc('join_group_by_invite_token', {
          invite_token_param: token,
        });

        if (rpcError) {
          console.error('Join by token error:', rpcError);
          setError(rpcError.message || 'Failed to join group');
          return null;
        }

        if (!data || data.length === 0) {
          setError('Failed to join group');
          return null;
        }

        const result = data[0];
        return {
          groupId: result.group_id,
          success: result.success,
          message: result.message,
        };
      } catch (err) {
        console.error('Join by token exception:', err);
        setError('Failed to join group');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Request to join by invite code
  const requestJoinByCode = useCallback(
    async (code: string): Promise<{ requestId: string; groupId: string; success: boolean; message: string } | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc('request_group_join_by_invite_code', {
          invite_code_param: code.toLowerCase(),
        });

        if (rpcError) {
          console.error('Request join by code error:', rpcError);
          setError(rpcError.message || 'Failed to submit join request');
          return null;
        }

        if (!data || data.length === 0) {
          setError('Failed to submit join request');
          return null;
        }

        const result = data[0];
        return {
          requestId: result.request_id,
          groupId: result.group_id,
          success: result.success,
          message: result.message,
        };
      } catch (err) {
        console.error('Request join by code exception:', err);
        setError('Failed to submit join request');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // List join requests for a group (admin only)
  const listJoinRequests = useCallback(
    async (groupId: string): Promise<JoinRequest[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc('list_group_join_requests', {
          group_id_param: groupId,
        });

        if (rpcError) {
          console.error('List join requests error:', rpcError);
          setError(rpcError.message || 'Failed to load join requests');
          return [];
        }

        return (data || []).map((req: any) => ({
          id: req.id,
          requester_id: req.requester_id,
          requester_name: req.requester_name,
          requester_avatar_url: req.requester_avatar_url,
          status: req.status,
          created_at: req.created_at,
          reviewed_at: req.reviewed_at,
          reviewed_by: req.reviewed_by,
        }));
      } catch (err) {
        console.error('List join requests exception:', err);
        setError('Failed to load join requests');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Review join request (approve/deny)
  const reviewJoinRequest = useCallback(
    async (requestId: string, decision: 'approved' | 'denied'): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc('review_group_join_request', {
          request_id_param: requestId,
          decision: decision,
        });

        if (rpcError) {
          console.error('Review join request error:', rpcError);
          setError(rpcError.message || 'Failed to review join request');
          return false;
        }

        if (!data || data.length === 0) {
          setError('Failed to review join request');
          return false;
        }

        return data[0].success;
      } catch (err) {
        console.error('Review join request exception:', err);
        setError('Failed to review join request');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Rotate invite token
  const rotateInviteToken = useCallback(
    async (groupId: string): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc('rotate_group_invite_token', {
          group_id_param: groupId,
        });

        if (rpcError) {
          console.error('Rotate invite token error:', rpcError);
          setError(rpcError.message || 'Failed to rotate invite token');
          return null;
        }

        if (!data || data.length === 0) {
          setError('Failed to rotate invite token');
          return null;
        }

        return data[0].new_token;
      } catch (err) {
        console.error('Rotate invite token exception:', err);
        setError('Failed to rotate invite token');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    getInvitePreview,
    joinByToken,
    requestJoinByCode,
    listJoinRequests,
    reviewJoinRequest,
    rotateInviteToken,
  };
}
