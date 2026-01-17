import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Group } from '@cooked/shared';

interface UseGroupsReturn {
  isLoading: boolean;
  error: string | null;
  createGroup: (name: string) => Promise<Group | null>;
  fetchUserGroups: () => Promise<Group[]>;
  joinGroup: (inviteCode: string) => Promise<Group | null>;
}

export function useGroups(): UseGroupsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current user
  const getCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }, []);

  // Create a new group
  const createGroup = useCallback(
    async (name: string): Promise<Group | null> => {
      const user = await getCurrentUser();
      if (!user) {
        setError('You must be logged in to create a group');
        return null;
      }

      const trimmedName = name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 30) {
        setError('Group name must be 2-30 characters');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create the group
        const { data: group, error: createError } = await supabase
          .from('groups')
          .insert({
            name: trimmedName,
            created_by: user.id,
          })
          .select()
          .single();

        if (createError) {
          console.error('Create group error:', createError);
          setError('Failed to create group. Please try again.');
          return null;
        }

        // Add creator as admin member
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({
            group_id: group.id,
            user_id: user.id,
            role: 'admin',
          });

        if (memberError) {
          console.error('Add member error:', memberError);
          // Group was created but member wasn't added - try to clean up
          await supabase.from('groups').delete().eq('id', group.id);
          setError('Failed to create group. Please try again.');
          return null;
        }

        return group as Group;
      } catch (err) {
        console.error('Create group exception:', err);
        setError('Something went wrong. Please try again.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getCurrentUser]
  );

  // Fetch groups the user is a member of
  const fetchUserGroups = useCallback(async (): Promise<Group[]> => {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get group IDs the user is a member of
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Fetch memberships error:', memberError);
        setError('Failed to load groups');
        return [];
      }

      if (!memberships || memberships.length === 0) {
        return [];
      }

      // Get the groups
      const groupIds = memberships.map((m) => m.group_id);
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) {
        console.error('Fetch groups error:', groupsError);
        setError('Failed to load groups');
        return [];
      }

      return (groups as Group[]) || [];
    } catch (err) {
      console.error('Fetch groups exception:', err);
      setError('Failed to load groups');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentUser]);

  // Join a group by invite code
  const joinGroup = useCallback(
    async (inviteCode: string): Promise<Group | null> => {
      const user = await getCurrentUser();
      if (!user) {
        setError('You must be logged in to join a group');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Find the group by invite code
        const { data: group, error: findError } = await supabase
          .from('groups')
          .select('*')
          .eq('invite_code', inviteCode.toLowerCase())
          .single();

        if (findError || !group) {
          console.error('Find group error:', findError);
          setError('Invalid invite code');
          return null;
        }

        // Check if user is already a member
        const { data: existingMember } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', group.id)
          .eq('user_id', user.id)
          .single();

        if (existingMember) {
          setError('You are already a member of this group');
          return group as Group;
        }

        // Check member count (max 10)
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        if (count !== null && count >= 10) {
          setError('This group is full (max 10 members)');
          return null;
        }

        // Add user as member
        const { error: joinError } = await supabase
          .from('group_members')
          .insert({
            group_id: group.id,
            user_id: user.id,
            role: 'member',
          });

        if (joinError) {
          console.error('Join group error:', joinError);
          setError('Failed to join group. Please try again.');
          return null;
        }

        return group as Group;
      } catch (err) {
        console.error('Join group exception:', err);
        setError('Something went wrong. Please try again.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getCurrentUser]
  );

  return {
    isLoading,
    error,
    createGroup,
    fetchUserGroups,
    joinGroup,
  };
}
