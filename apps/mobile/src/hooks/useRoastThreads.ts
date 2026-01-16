import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app';
import type { RoastThread, RoastResponse, RoastThreadWithDetails, User, Pact, CheckIn } from '@/types';

interface CreateRoastResponseParams {
  threadId: string;
  contentType: 'text' | 'gif' | 'image';
  content: string;
}

interface UseRoastThreadsReturn {
  isLoading: boolean;
  error: string | null;
  createRoastThread: (checkInId: string) => Promise<RoastThread | null>;
  fetchThread: (threadId: string) => Promise<RoastThreadWithDetails | null>;
  fetchThreadByCheckIn: (checkInId: string) => Promise<RoastThread | null>;
  addResponse: (params: CreateRoastResponseParams) => Promise<RoastResponse | null>;
  pinResponse: (responseId: string, threadId: string) => Promise<boolean>;
  muteThread: (threadId: string) => Promise<boolean>;
}

export function useRoastThreads(): UseRoastThreadsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAppStore((state) => state.user);

  // Create a new roast thread for a check-in
  const createRoastThread = useCallback(
    async (checkInId: string): Promise<RoastThread | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if thread already exists
        const { data: existing } = await supabase
          .from('roast_threads')
          .select('*')
          .eq('check_in_id', checkInId)
          .single();

        if (existing) {
          return existing as RoastThread;
        }

        // Create new thread
        const { data: thread, error: createError } = await supabase
          .from('roast_threads')
          .insert({
            check_in_id: checkInId,
            status: 'open',
            is_muted: false,
          })
          .select()
          .single();

        if (createError) {
          console.error('Create roast thread error:', createError);
          setError('Failed to create roast thread');
          return null;
        }

        return thread as RoastThread;
      } catch (err) {
        console.error('Create roast thread exception:', err);
        setError('Something went wrong');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch a thread with all details
  const fetchThread = useCallback(
    async (threadId: string): Promise<RoastThreadWithDetails | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch thread
        const { data: thread, error: threadError } = await supabase
          .from('roast_threads')
          .select('*')
          .eq('id', threadId)
          .single();

        if (threadError || !thread) {
          setError('Thread not found');
          return null;
        }

        // Fetch check-in with user and pact
        const { data: checkIn, error: checkInError } = await supabase
          .from('check_ins')
          .select(`
            *,
            users:user_id (id, display_name, avatar_url),
            pacts:pact_id (id, name, roast_level)
          `)
          .eq('id', thread.check_in_id)
          .single();

        if (checkInError || !checkIn) {
          setError('Check-in not found');
          return null;
        }

        // Fetch responses
        const { data: responses, error: responsesError } = await supabase
          .from('roast_responses')
          .select(`
            *,
            users:user_id (id, display_name, avatar_url)
          `)
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true });

        if (responsesError) {
          console.error('Fetch responses error:', responsesError);
        }

        const threadWithDetails: RoastThreadWithDetails = {
          ...(thread as RoastThread),
          check_in: {
            id: checkIn.id,
            pact_id: checkIn.pact_id,
            user_id: checkIn.user_id,
            status: checkIn.status,
            excuse: checkIn.excuse,
            proof_url: checkIn.proof_url,
            check_in_date: checkIn.check_in_date,
            created_at: checkIn.created_at,
          },
          user: checkIn.users as unknown as Pick<User, 'id' | 'display_name' | 'avatar_url'>,
          pact: checkIn.pacts as unknown as Pick<Pact, 'id' | 'name' | 'roast_level'>,
          responses: (responses || []).map((r) => ({
            id: r.id,
            thread_id: r.thread_id,
            user_id: r.user_id,
            content_type: r.content_type,
            content: r.content,
            is_pinned: r.is_pinned,
            created_at: r.created_at,
            user: r.users as unknown as Pick<User, 'id' | 'display_name' | 'avatar_url'>,
          })),
        };

        return threadWithDetails;
      } catch (err) {
        console.error('Fetch thread exception:', err);
        setError('Failed to load thread');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch thread by check-in ID
  const fetchThreadByCheckIn = useCallback(
    async (checkInId: string): Promise<RoastThread | null> => {
      try {
        const { data, error: fetchError } = await supabase
          .from('roast_threads')
          .select('*')
          .eq('check_in_id', checkInId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Fetch thread error:', fetchError);
        }

        return data as RoastThread | null;
      } catch (err) {
        console.error('Fetch thread exception:', err);
        return null;
      }
    },
    []
  );

  // Add a response to a thread
  const addResponse = useCallback(
    async (params: CreateRoastResponseParams): Promise<RoastResponse | null> => {
      if (!user) {
        setError('You must be logged in');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if thread is open
        const { data: thread } = await supabase
          .from('roast_threads')
          .select('status')
          .eq('id', params.threadId)
          .single();

        if (!thread || thread.status !== 'open') {
          setError('This thread is closed');
          return null;
        }

        // Create response
        const { data: response, error: createError } = await supabase
          .from('roast_responses')
          .insert({
            thread_id: params.threadId,
            user_id: user.id,
            content_type: params.contentType,
            content: params.content,
            is_pinned: false,
          })
          .select()
          .single();

        if (createError) {
          console.error('Create response error:', createError);
          setError('Failed to post response');
          return null;
        }

        return response as RoastResponse;
      } catch (err) {
        console.error('Create response exception:', err);
        setError('Something went wrong');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Pin a response (toggle)
  const pinResponse = useCallback(
    async (responseId: string, threadId: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get current pin status
        const { data: response } = await supabase
          .from('roast_responses')
          .select('is_pinned')
          .eq('id', responseId)
          .single();

        if (!response) {
          setError('Response not found');
          return false;
        }

        // Unpin all other responses if pinning
        if (!response.is_pinned) {
          await supabase
            .from('roast_responses')
            .update({ is_pinned: false })
            .eq('thread_id', threadId);
        }

        // Toggle pin
        const { error: updateError } = await supabase
          .from('roast_responses')
          .update({ is_pinned: !response.is_pinned })
          .eq('id', responseId);

        if (updateError) {
          console.error('Pin response error:', updateError);
          setError('Failed to pin response');
          return false;
        }

        return true;
      } catch (err) {
        console.error('Pin response exception:', err);
        setError('Something went wrong');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Mute a thread (for the thread subject)
  const muteThread = useCallback(
    async (threadId: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { error: updateError } = await supabase
          .from('roast_threads')
          .update({ is_muted: true })
          .eq('id', threadId);

        if (updateError) {
          console.error('Mute thread error:', updateError);
          setError('Failed to mute thread');
          return false;
        }

        return true;
      } catch (err) {
        console.error('Mute thread exception:', err);
        setError('Something went wrong');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    isLoading,
    error,
    createRoastThread,
    fetchThread,
    fetchThreadByCheckIn,
    addResponse,
    pinResponse,
    muteThread,
  };
}
