import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app';

export interface UserProfile {
  id: string;
  phone: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = useAppStore((state) => state.user);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, phone, display_name, avatar_url, created_at')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        // PGRST116 means no row found - user might not have a profile yet
        if (fetchError.code === 'PGRST116') {
          setProfile(null);
        } else {
          console.error('Profile fetch error:', fetchError);
          setError('Failed to load profile');
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
