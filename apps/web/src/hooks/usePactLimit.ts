'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { FREE_TIER_LIMITS } from '@cooked/shared';

interface UsePactLimitReturn {
  currentCount: number;
  maxCount: number;
  canCreate: boolean;
  isLoading: boolean;
}

export function usePactLimit(groupId: string | null): UsePactLimitReturn {
  const [currentCount, setCurrentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Get current user and check subscription
  const getCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }, []);

  // Check subscription status
  const checkSubscription = useCallback(async (groupId: string) => {
    try {
      const { data: group, error } = await supabase
        .from('groups')
        .select('subscription_status')
        .eq('id', groupId)
        .single();

      if (!error && group) {
        setIsPremium(group.subscription_status === 'premium' || group.subscription_status === 'trial');
      }
    } catch (err) {
      console.error('Check subscription error:', err);
    }
  }, []);

  // Fetch pact count
  const fetchPactCount = useCallback(async () => {
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
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      setIsLoading(true);
      checkSubscription(groupId);
      fetchPactCount();
    }
  }, [groupId, checkSubscription, fetchPactCount]);

  const maxCount = isPremium ? Infinity : FREE_TIER_LIMITS.max_pacts_per_group;
  const canCreate = currentCount < maxCount;

  return {
    currentCount,
    maxCount,
    canCreate,
    isLoading,
  };
}
