import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@cooked/shared';

interface GroupMember {
  user_id: string;
  user: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
  joined_at: string;
}

interface GroupContext {
  memberCount: number;
  members: Array<Pick<User, 'id' | 'display_name' | 'avatar_url'>>;
  pactCount: number;
  hasCheckInsToday: boolean;
  isNewMember: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useGroupContext(groupId: string | null, currentUserId: string | null): GroupContext {
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState<Array<Pick<User, 'id' | 'display_name' | 'avatar_url'>>>([]);
  const [memberJoinDates, setMemberJoinDates] = useState<Map<string, string>>(new Map());
  const [pactCount, setPactCount] = useState(0);
  const [hasCheckInsToday, setHasCheckInsToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    if (!groupId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch members with user data
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          joined_at,
          users:user_id (id, display_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (membersError) {
        console.error('Fetch members error:', membersError);
        setError('Failed to load group members');
      } else {
        const typedMembers = (membersData || []).map((m) => ({
          user_id: m.user_id,
          user: m.users as unknown as Pick<User, 'id' | 'display_name' | 'avatar_url'>,
          joined_at: m.joined_at,
        }));

        setMemberCount(typedMembers.length);
        setMembers(typedMembers.map((m) => m.user).filter((u) => u !== null));
        
        // Store join dates for isNewMember calculation
        const joinDatesMap = new Map<string, string>();
        typedMembers.forEach((m) => {
          if (m.user) {
            joinDatesMap.set(m.user.id, m.joined_at);
          }
        });
        setMemberJoinDates(joinDatesMap);
      }

      // Fetch pact count
      const { count: pactCountData, error: pactsError } = await supabase
        .from('pacts')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (pactsError) {
        console.error('Fetch pact count error:', pactsError);
      } else {
        setPactCount(pactCountData || 0);
      }

      // Check if there are any check-ins today
      const today = new Date().toISOString().split('T')[0];
      const { count: checkInsCount, error: checkInsError } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('check_in_date', today);

      if (checkInsError) {
        console.error('Fetch check-ins error:', checkInsError);
      } else {
        // We need to check if any of today's check-ins belong to this group
        // Get all pacts for this group
        const { data: groupPacts, error: groupPactsError } = await supabase
          .from('pacts')
          .select('id')
          .eq('group_id', groupId)
          .eq('status', 'active');

        if (!groupPactsError && groupPacts && groupPacts.length > 0) {
          const pactIds = groupPacts.map((p) => p.id);
          const { count: groupCheckInsCount, error: groupCheckInsError } = await supabase
            .from('check_ins')
            .select('*', { count: 'exact', head: true })
            .eq('check_in_date', today)
            .in('pact_id', pactIds);

          if (!groupCheckInsError) {
            setHasCheckInsToday((groupCheckInsCount || 0) > 0);
          }
        } else {
          setHasCheckInsToday(false);
        }
      }
    } catch (err) {
      console.error('Fetch group context exception:', err);
      setError('Failed to load group context');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // Determine if user is a new member (joined in last 24 hours)
  const isNewMember = (() => {
    if (!currentUserId) return false;
    const joinedAt = memberJoinDates.get(currentUserId);
    if (!joinedAt) return false;
    const joinedDate = new Date(joinedAt);
    const now = new Date();
    const hoursSinceJoined = (now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceJoined < 24;
  })();

  return {
    memberCount,
    members,
    pactCount,
    hasCheckInsToday,
    isNewMember,
    isLoading,
    error,
  };
}
