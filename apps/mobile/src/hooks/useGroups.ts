import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app';
import type { Group, GroupMember } from '@/types';

interface UseGroupsReturn {
  isLoading: boolean;
  error: string | null;
  createGroup: (name: string) => Promise<Group | null>;
  fetchUserGroups: () => Promise<Group[]>;
  joinGroup: (inviteCode: string) => Promise<Group | null>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  checkIsOnlyAdmin: (groupId: string) => Promise<boolean>;
  removeMember: (groupId: string, userId: string) => Promise<boolean>;
  makeAdmin: (groupId: string, userId: string) => Promise<boolean>;
  removeAdmin: (groupId: string, userId: string) => Promise<boolean>;
}

export function useGroups(): UseGroupsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAppStore((state) => state.user);

  // Create a new group
  const createGroup = useCallback(
    async (name: string): Promise<Group | null> => {
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
    [user]
  );

  // Fetch groups the user is a member of
  const fetchUserGroups = useCallback(async (): Promise<Group[]> => {
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
        .in('id', groupIds);

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
  }, [user]);

  // Join a group by invite code
  const joinGroup = useCallback(
    async (inviteCode: string): Promise<Group | null> => {
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
    [user]
  );

  // Check if user is the only admin in a group
  const checkIsOnlyAdmin = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        // Check if user is an admin
        const { data: membership } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .single();

        if (!membership || membership.role !== 'admin') {
          return false;
        }

        // Count other admins
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .eq('role', 'admin')
          .neq('user_id', user.id);

        return count === 0;
      } catch (err) {
        console.error('Check admin status exception:', err);
        return false;
      }
    },
    [user]
  );

  // Leave a group
  const leaveGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in to leave a group');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if user is the only admin
        const isOnlyAdmin = await checkIsOnlyAdmin(groupId);
        if (isOnlyAdmin) {
          setError('You must transfer admin role to another member first');
          return false;
        }

        // Remove user from group
        const { error: leaveError } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id);

        if (leaveError) {
          console.error('Leave group error:', leaveError);
          setError('Failed to leave group. Please try again.');
          return false;
        }

        return true;
      } catch (err) {
        console.error('Leave group exception:', err);
        setError('Something went wrong. Please try again.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, checkIsOnlyAdmin]
  );

  // Remove a member from group (admin only)
  const removeMember = useCallback(
    async (groupId: string, userId: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in');
        return false;
      }

      // Can't remove yourself
      if (userId === user.id) {
        setError('Use leave group to remove yourself');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if current user is admin
        const { data: currentMember } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .single();

        if (!currentMember || currentMember.role !== 'admin') {
          setError('Only admins can remove members');
          return false;
        }

        // Remove the member
        const { error: removeError } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', userId);

        if (removeError) {
          console.error('Remove member error:', removeError);
          setError('Failed to remove member');
          return false;
        }

        return true;
      } catch (err) {
        console.error('Remove member exception:', err);
        setError('Something went wrong');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Make a member an admin
  const makeAdmin = useCallback(
    async (groupId: string, userId: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if current user is admin
        const { data: currentMember } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .single();

        if (!currentMember || currentMember.role !== 'admin') {
          setError('Only admins can promote members');
          return false;
        }

        // Update the member's role
        const { error: updateError } = await supabase
          .from('group_members')
          .update({ role: 'admin' })
          .eq('group_id', groupId)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Make admin error:', updateError);
          setError('Failed to make admin');
          return false;
        }

        return true;
      } catch (err) {
        console.error('Make admin exception:', err);
        setError('Something went wrong');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Remove admin role (demote to member)
  const removeAdmin = useCallback(
    async (groupId: string, userId: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if current user is admin
        const { data: currentMember } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .single();

        if (!currentMember || currentMember.role !== 'admin') {
          setError('Only admins can demote members');
          return false;
        }

        // Check if target is the only admin (can't demote)
        if (userId === user.id) {
          const isOnlyAdmin = await checkIsOnlyAdmin(groupId);
          if (isOnlyAdmin) {
            setError('Cannot remove your admin role - you are the only admin');
            return false;
          }
        }

        // Update the member's role
        const { error: updateError } = await supabase
          .from('group_members')
          .update({ role: 'member' })
          .eq('group_id', groupId)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Remove admin error:', updateError);
          setError('Failed to remove admin role');
          return false;
        }

        return true;
      } catch (err) {
        console.error('Remove admin exception:', err);
        setError('Something went wrong');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, checkIsOnlyAdmin]
  );

  return {
    isLoading,
    error,
    createGroup,
    fetchUserGroups,
    joinGroup,
    leaveGroup,
    checkIsOnlyAdmin,
    removeMember,
    makeAdmin,
    removeAdmin,
  };
}
