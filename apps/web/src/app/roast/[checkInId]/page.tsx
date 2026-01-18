'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type RoastThread = {
  id: string;
  status: 'open' | 'closed' | 'muted';
  check_in_id: string;
  created_at: string;
};

type RoastResponse = {
  id: string;
  thread_id: string;
  user_id: string;
  content_type: 'text' | 'gif' | 'image';
  content: string;
  is_pinned: boolean;
  created_at: string;
  users?: { display_name: string; avatar_url: string | null } | null;
};

type CheckInDetail = {
  id: string;
  status: 'success' | 'fold';
  excuse: string | null;
  proof_url: string | null;
  created_at: string;
  pact_id: string;
  user_id: string;
  users?: { display_name: string; avatar_url: string | null } | null;
  pacts?: { name: string; group_id: string } | null;
};

export default function RoastThreadPage() {
  const router = useRouter();
  const params = useParams();
  const checkInId = params.checkInId as string;

  const [thread, setThread] = useState<RoastThread | null>(null);
  const [checkIn, setCheckIn] = useState<CheckInDetail | null>(null);
  const [responses, setResponses] = useState<RoastResponse[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const loadThread = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: threadRow, error: threadError } = await supabase
        .from('roast_threads')
        .select('id,status,check_in_id,created_at')
        .eq('check_in_id', checkInId)
        .single();

      if (threadError || !threadRow) {
        setError('Roast thread not found');
        return;
      }

      setThread(threadRow as RoastThread);

      // Fetch check-in details
      const { data: checkInRow, error: checkInError } = await supabase
        .from('check_ins')
        .select(
          `
          id,status,excuse,proof_url,created_at,pact_id,user_id,
          users:user_id (display_name, avatar_url),
          pacts:pact_id (name, group_id)
        `
        )
        .eq('id', checkInId)
        .single();

      if (!checkInError && checkInRow) {
        setCheckIn(checkInRow as unknown as CheckInDetail);
      }

      // Fetch responses
      const { data: responseRows, error: responseError } = await supabase
        .from('roast_responses')
        .select(
          `
          id,thread_id,user_id,content_type,content,is_pinned,created_at,
          users:user_id (display_name, avatar_url)
        `
        )
        .eq('thread_id', (threadRow as any).id)
        .order('created_at', { ascending: true });

      if (!responseError && responseRows) {
        setResponses(responseRows as unknown as RoastResponse[]);
      }
    } catch (e) {
      console.error('Load roast thread exception:', e);
      setError('Failed to load roast thread');
    } finally {
      setIsLoading(false);
    }
  }, [checkInId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  // Determine ownership (only thread owner can close)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setIsOwner(!!(user && checkIn && user.id === checkIn.user_id));
    })();
    return () => {
      mounted = false;
    };
  }, [checkIn]);

  // Realtime updates for responses
  useEffect(() => {
    if (!thread?.id) return;

    const channel = supabase
      .channel(`roast:${thread.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'roast_responses', filter: `thread_id=eq.${thread.id}` },
        () => {
          loadThread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadThread, thread?.id]);

  const canPost = useMemo(() => message.trim().length > 0 && thread?.status === 'open', [message, thread?.status]);

  const handlePost = useCallback(async () => {
    if (!thread) return;
    if (!canPost) return;
    setIsPosting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to post');
        return;
      }

      const content = message.trim();
      setMessage('');

      const { error: insertError } = await supabase.from('roast_responses').insert({
        thread_id: thread.id,
        user_id: user.id,
        content_type: 'text',
        content,
      });

      if (insertError) {
        console.error('Post roast response error:', insertError);
        setError(insertError.message || 'Failed to post');
        setMessage(content);
        return;
      }
    } catch (e) {
      console.error('Post roast response exception:', e);
      setError('Failed to post');
    } finally {
      setIsPosting(false);
    }
  }, [canPost, message, thread]);

  const handleClose = useCallback(async () => {
    if (!thread) return;
    try {
      const { error: closeError } = await supabase
        .from('roast_threads')
        .update({ status: 'closed' })
        .eq('id', thread.id);

      if (closeError) {
        setError(closeError.message || 'Failed to close thread');
        return;
      }

      await loadThread();
    } catch (e) {
      console.error('Close thread exception:', e);
      setError('Failed to close thread');
    }
  }, [loadThread, thread]);

  const handleBack = useCallback(() => {
    if (checkIn?.pacts?.group_id) {
      router.push(`/group/${checkIn.pacts.group_id}`);
    } else {
      router.back();
    }
  }, [checkIn?.pacts?.group_id, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Loading roast thread...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-text-muted/20 px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center text-text-primary hover:bg-surface rounded-full transition-colors"
          >
            ←
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-text-primary">Roast Thread</h1>
            {checkIn?.pacts?.name && (
              <p className="text-xs text-text-muted">{checkIn.pacts.name}</p>
            )}
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-6 space-y-6">
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {checkIn && (
          <div className="bg-surface border border-text-muted/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-text-primary font-semibold">
                  {checkIn.users?.display_name || 'Someone'} folded
                </div>
                {checkIn.excuse && (
                  <div className="text-sm text-text-muted mt-1">&quot;{checkIn.excuse}&quot;</div>
                )}
              </div>
              <div className="text-xs text-text-muted">{thread?.status === 'open' ? 'Open' : 'Closed'}</div>
            </div>
          </div>
        )}

        <div className="bg-surface border border-text-muted/20 rounded-lg p-4">
          <div className="space-y-3">
            {responses.length === 0 ? (
              <div className="text-text-muted text-sm">No roasts yet. Be the first.</div>
            ) : (
              responses.map((r) => (
                <div key={r.id} className="border-b border-text-muted/20 pb-3 last:border-b-0 last:pb-0">
                  <div className="text-xs text-text-muted mb-1">
                    {r.users?.display_name || 'Member'}
                  </div>
                  <div className="text-text-primary text-sm">{r.content}</div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex items-end gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={thread?.status === 'open' ? 'Write a roast...' : 'Thread is closed'}
              disabled={thread?.status !== 'open' || isPosting}
              className="flex-1 rounded-md bg-background border border-text-muted/20 p-3 text-sm text-text-primary placeholder:text-text-muted disabled:opacity-60"
              rows={3}
            />
            <button
              onClick={handlePost}
              disabled={!canPost || isPosting}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                !canPost || isPosting ? 'bg-surface text-text-muted cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>

          {thread?.status === 'open' && isOwner && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleClose}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Close thread
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

