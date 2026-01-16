import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app';
import type { SubscriptionInfo, SubscriptionStatus, PremiumFeature, Group } from '@/types';
import { FREE_TIER_LIMITS } from '@/types';

interface UseSubscriptionReturn {
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  error: string | null;
  isPremium: boolean;
  canCreatePact: boolean;
  canJoinGroup: boolean;
  canAccessFeature: (feature: PremiumFeature) => boolean;
  getRecapHistoryLimit: () => number;
  refetch: () => Promise<void>;
}

export function useSubscription(groupId?: string | null): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = useAppStore((state) => state.user);
  const currentGroup = useAppStore((state) => state.currentGroup);
  const targetGroupId = groupId || currentGroup?.id;

  // Fetch subscription status for the group
  const fetchSubscription = useCallback(async () => {
    if (!targetGroupId) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('subscription_status, subscription_expires_at, created_by')
        .eq('id', targetGroupId)
        .single();

      if (fetchError) {
        console.error('Fetch subscription error:', fetchError);
        setError('Failed to load subscription');
        return;
      }

      const status = (group.subscription_status || 'free') as SubscriptionStatus;
      const isExpired = group.subscription_expires_at
        ? new Date(group.subscription_expires_at) < new Date()
        : false;

      setSubscription({
        status: isExpired ? 'free' : status,
        expires_at: group.subscription_expires_at,
        plan: status === 'premium' ? 'monthly' : null, // Default assumption
        is_admin_subscriber: group.created_by === user?.id,
      });
    } catch (err) {
      console.error('Fetch subscription exception:', err);
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [targetGroupId, user?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Computed values
  const isPremium = useMemo(() => {
    if (!subscription) return false;
    return subscription.status === 'premium' || subscription.status === 'trial';
  }, [subscription]);

  // Check if user can create a new pact (within limits)
  const canCreatePact = useMemo(() => {
    if (isPremium) return true;
    // Would need to check current pact count - for now, assume true
    // This would be more accurately checked in the create pact flow
    return true;
  }, [isPremium]);

  // Check if user can join another group
  const canJoinGroup = useMemo(() => {
    if (isPremium) return true;
    // Would need to check current group count
    // For free tier, limit is 1 group
    return true;
  }, [isPremium]);

  // Check if a specific feature is accessible
  const canAccessFeature = useCallback(
    (feature: PremiumFeature): boolean => {
      if (isPremium) return true;

      // Free tier feature access
      switch (feature) {
        case 'unlimited_groups':
        case 'unlimited_pacts':
        case 'full_recap_history':
        case 'advanced_polls':
        case 'custom_roast_prompts':
        case 'group_analytics':
        case 'priority_support':
          return false;
        default:
          return false;
      }
    },
    [isPremium]
  );

  // Get recap history limit in weeks
  const getRecapHistoryLimit = useCallback((): number => {
    if (isPremium) return Infinity;
    return FREE_TIER_LIMITS.recap_history_weeks;
  }, [isPremium]);

  return {
    subscription,
    isLoading,
    error,
    isPremium,
    canCreatePact,
    canJoinGroup,
    canAccessFeature,
    getRecapHistoryLimit,
    refetch: fetchSubscription,
  };
}

// Helper hook to check pact count limit
export function usePactLimit(groupId: string | null): {
  currentCount: number;
  maxCount: number;
  canCreate: boolean;
  isLoading: boolean;
} {
  const [currentCount, setCurrentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isPremium } = useSubscription(groupId);

  useEffect(() => {
    async function fetchPactCount() {
      if (!groupId) {
        setIsLoading(false);
        return;
      }

      try {
        const { count, error } = await supabase
          .from('pacts')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .eq('status', 'active');

        if (!error) {
          setCurrentCount(count || 0);
        }
      } catch (err) {
        console.error('Fetch pact count error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPactCount();
  }, [groupId]);

  const maxCount = isPremium ? Infinity : FREE_TIER_LIMITS.max_pacts_per_group;
  const canCreate = currentCount < maxCount;

  return {
    currentCount,
    maxCount,
    canCreate,
    isLoading,
  };
}

// Helper hook to check group count limit
export function useGroupLimit(): {
  currentCount: number;
  maxCount: number;
  canJoin: boolean;
  isLoading: boolean;
} {
  const [currentCount, setCurrentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAppStore((state) => state.user);

  // Check if any of user's groups are premium
  const [hasPremiumGroup, setHasPremiumGroup] = useState(false);

  useEffect(() => {
    async function fetchGroupCount() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get all groups user is a member of
        const { data: memberships, error } = await supabase
          .from('group_members')
          .select('group_id, groups:group_id(subscription_status)')
          .eq('user_id', user.id);

        if (!error && memberships) {
          setCurrentCount(memberships.length);
          // Check if any group is premium
          const hasPremium = memberships.some(
            (m) => (m.groups as unknown as { subscription_status: string })?.subscription_status === 'premium'
          );
          setHasPremiumGroup(hasPremium);
        }
      } catch (err) {
        console.error('Fetch group count error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGroupCount();
  }, [user]);

  const maxCount = hasPremiumGroup ? Infinity : FREE_TIER_LIMITS.max_groups;
  const canJoin = currentCount < maxCount;

  return {
    currentCount,
    maxCount,
    canJoin,
    isLoading,
  };
}
