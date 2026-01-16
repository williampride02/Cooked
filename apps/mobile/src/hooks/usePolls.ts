import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app';
import type { Poll, PollOption, PollVote, PollWithDetails, User } from '@/types';

interface CreatePollParams {
  threadId: string;
  question: string;
  options: string[];
  closesAt?: Date;
}

interface UsePollsReturn {
  isLoading: boolean;
  error: string | null;
  createPoll: (params: CreatePollParams) => Promise<Poll | null>;
  fetchPoll: (pollId: string) => Promise<PollWithDetails | null>;
  vote: (pollId: string, optionId: string) => Promise<boolean>;
  closePoll: (pollId: string) => Promise<boolean>;
}

export function usePolls(): UsePollsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAppStore((state) => state.user);

  // Create a new poll
  const createPoll = useCallback(
    async (params: CreatePollParams): Promise<Poll | null> => {
      if (!user) {
        setError('You must be logged in');
        return null;
      }

      if (params.options.length < 2) {
        setError('A poll must have at least 2 options');
        return null;
      }

      if (params.options.length > 6) {
        setError('A poll can have at most 6 options');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create the poll
        const { data: poll, error: pollError } = await supabase
          .from('polls')
          .insert({
            thread_id: params.threadId,
            created_by: user.id,
            question: params.question,
            status: 'open',
            closes_at: params.closesAt?.toISOString() || null,
          })
          .select()
          .single();

        if (pollError) {
          console.error('Create poll error:', pollError);
          setError('Failed to create poll');
          return null;
        }

        // Create options
        const optionsToInsert = params.options.map((text, index) => ({
          poll_id: poll.id,
          option_text: text.trim(),
          sort_order: index,
        }));

        const { error: optionsError } = await supabase
          .from('poll_options')
          .insert(optionsToInsert);

        if (optionsError) {
          console.error('Create options error:', optionsError);
          // Clean up the poll if options failed
          await supabase.from('polls').delete().eq('id', poll.id);
          setError('Failed to create poll options');
          return null;
        }

        // Create roast response of type 'poll' to include in thread
        const { error: responseError } = await supabase
          .from('roast_responses')
          .insert({
            thread_id: params.threadId,
            user_id: user.id,
            content_type: 'poll',
            content: poll.id,
            is_pinned: false,
          });

        if (responseError) {
          console.error('Create poll response error:', responseError);
        }

        return poll as Poll;
      } catch (err) {
        console.error('Create poll exception:', err);
        setError('Something went wrong');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Fetch a poll with all details
  const fetchPoll = useCallback(
    async (pollId: string): Promise<PollWithDetails | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch poll
        const { data: poll, error: pollError } = await supabase
          .from('polls')
          .select(`
            *,
            users:created_by (id, display_name, avatar_url)
          `)
          .eq('id', pollId)
          .single();

        if (pollError || !poll) {
          setError('Poll not found');
          return null;
        }

        // Fetch options
        const { data: options, error: optionsError } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', pollId)
          .order('sort_order', { ascending: true });

        if (optionsError) {
          console.error('Fetch options error:', optionsError);
        }

        // Fetch votes
        const { data: votes, error: votesError } = await supabase
          .from('poll_votes')
          .select('*')
          .eq('poll_id', pollId);

        if (votesError) {
          console.error('Fetch votes error:', votesError);
        }

        // Find user's vote
        const userVote = user
          ? (votes || []).find((v) => v.user_id === user.id) || null
          : null;

        const pollWithDetails: PollWithDetails = {
          id: poll.id,
          thread_id: poll.thread_id,
          created_by: poll.created_by,
          question: poll.question,
          status: poll.status,
          closes_at: poll.closes_at,
          created_at: poll.created_at,
          closed_at: poll.closed_at,
          options: (options || []) as PollOption[],
          votes: (votes || []) as PollVote[],
          user_vote: userVote as PollVote | null,
          total_votes: (votes || []).length,
          creator: poll.users as unknown as Pick<User, 'id' | 'display_name' | 'avatar_url'>,
        };

        return pollWithDetails;
      } catch (err) {
        console.error('Fetch poll exception:', err);
        setError('Failed to load poll');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Vote on a poll
  const vote = useCallback(
    async (pollId: string, optionId: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if poll is open
        const { data: poll } = await supabase
          .from('polls')
          .select('status')
          .eq('id', pollId)
          .single();

        if (!poll || poll.status !== 'open') {
          setError('This poll is closed');
          return false;
        }

        // Check for existing vote
        const { data: existingVote } = await supabase
          .from('poll_votes')
          .select('id')
          .eq('poll_id', pollId)
          .eq('user_id', user.id)
          .single();

        if (existingVote) {
          // Update existing vote
          const { error: updateError } = await supabase
            .from('poll_votes')
            .update({ option_id: optionId })
            .eq('id', existingVote.id);

          if (updateError) {
            console.error('Update vote error:', updateError);
            setError('Failed to update vote');
            return false;
          }
        } else {
          // Create new vote
          const { error: insertError } = await supabase
            .from('poll_votes')
            .insert({
              poll_id: pollId,
              option_id: optionId,
              user_id: user.id,
            });

          if (insertError) {
            console.error('Insert vote error:', insertError);
            setError('Failed to cast vote');
            return false;
          }
        }

        return true;
      } catch (err) {
        console.error('Vote exception:', err);
        setError('Something went wrong');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Close a poll
  const closePoll = useCallback(
    async (pollId: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { error: updateError } = await supabase
          .from('polls')
          .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
          })
          .eq('id', pollId)
          .eq('created_by', user.id); // Only creator can close

        if (updateError) {
          console.error('Close poll error:', updateError);
          setError('Failed to close poll');
          return false;
        }

        return true;
      } catch (err) {
        console.error('Close poll exception:', err);
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
    createPoll,
    fetchPoll,
    vote,
    closePoll,
  };
}

// Standalone hook to fetch a single poll with real-time updates
export function usePoll(pollId: string | null) {
  const [poll, setPoll] = useState<PollWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAppStore((state) => state.user);

  // Fetch poll
  useEffect(() => {
    if (!pollId) {
      setIsLoading(false);
      return;
    }

    async function fetchPollData() {
      setIsLoading(true);

      try {
        // Fetch poll
        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .select(`
            *,
            users:created_by (id, display_name, avatar_url)
          `)
          .eq('id', pollId)
          .single();

        if (pollError || !pollData) {
          setError('Poll not found');
          setIsLoading(false);
          return;
        }

        // Fetch options
        const { data: options } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', pollId)
          .order('sort_order', { ascending: true });

        // Fetch votes
        const { data: votes } = await supabase
          .from('poll_votes')
          .select('*')
          .eq('poll_id', pollId);

        const userVote = user
          ? (votes || []).find((v) => v.user_id === user.id) || null
          : null;

        setPoll({
          id: pollData.id,
          thread_id: pollData.thread_id,
          created_by: pollData.created_by,
          question: pollData.question,
          status: pollData.status,
          closes_at: pollData.closes_at,
          created_at: pollData.created_at,
          closed_at: pollData.closed_at,
          options: (options || []) as PollOption[],
          votes: (votes || []) as PollVote[],
          user_vote: userVote as PollVote | null,
          total_votes: (votes || []).length,
          creator: pollData.users as unknown as Pick<User, 'id' | 'display_name' | 'avatar_url'>,
        });
      } catch (err) {
        console.error('Fetch poll exception:', err);
        setError('Failed to load poll');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPollData();
  }, [pollId, user]);

  // Real-time subscription for votes
  useEffect(() => {
    if (!pollId) return;

    const channel = supabase
      .channel(`poll_votes:${pollId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_votes',
          filter: `poll_id=eq.${pollId}`,
        },
        async () => {
          // Refetch votes on any change
          const { data: votes } = await supabase
            .from('poll_votes')
            .select('*')
            .eq('poll_id', pollId);

          setPoll((prev) => {
            if (!prev) return prev;
            const userVote = user
              ? (votes || []).find((v) => v.user_id === user.id) || null
              : null;
            return {
              ...prev,
              votes: (votes || []) as PollVote[],
              user_vote: userVote as PollVote | null,
              total_votes: (votes || []).length,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId, user]);

  return { poll, isLoading, error };
}
