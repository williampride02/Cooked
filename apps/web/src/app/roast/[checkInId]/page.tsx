'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { ReactionEmoji } from '@cooked/shared';
import { uploadFileToBucket, signProofUrlIfNeeded, signRoastMediaUrlIfNeeded } from '@/utils/storage';
import { REACTION_EMOJI_OPTIONS, emojiKeyToLabel, useReactions } from '@/hooks/useReactions';

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
  pacts?: { name: string; group_id: string; roast_level: 1 | 2 | 3 } | null;
};

export default function RoastThreadPage() {
  const router = useRouter();
  const params = useParams();
  const checkInId = params.checkInId as string;

  const [thread, setThread] = useState<RoastThread | null>(null);
  const [checkIn, setCheckIn] = useState<CheckInDetail | null>(null);
  const [responses, setResponses] = useState<RoastResponse[]>([]);
  const [message, setMessage] = useState('');
  const [gifUrl, setGifUrl] = useState('');
  const [isPostingMedia, setIsPostingMedia] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [reactionByResponseId, setReactionByResponseId] = useState<Record<string, { counts: Record<ReactionEmoji, number>; myReaction: ReactionEmoji | null }>>({});

  const { fetchReactionSummaries, toggleReaction, isLoading: isLoadingReactions, error: reactionsError } = useReactions();

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
          pacts:pact_id (name, group_id, roast_level)
        `
        )
        .eq('id', checkInId)
        .single();

      if (!checkInError && checkInRow) {
        const typed = checkInRow as unknown as CheckInDetail;
        // If proof_url is stored as a storage path, sign it for web image rendering.
        const signedProof = await signProofUrlIfNeeded(typed.proof_url);
        setCheckIn({ ...typed, proof_url: signedProof });
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
        const typed = responseRows as unknown as RoastResponse[];
        // Sign any image paths stored in DB for rendering.
        const signed = await Promise.all(
          typed.map(async (r) => {
            if (r.content_type !== 'image') return r;
            const signedUrl = await signRoastMediaUrlIfNeeded(r.content);
            return { ...r, content: signedUrl || r.content };
          })
        );
        setResponses(signed);

        // Load reactions for responses (best-effort).
        const ids = signed.map((r) => r.id);
        const summaries = await fetchReactionSummaries({ targetType: 'roast_response', targetIds: ids });
        setReactionByResponseId(summaries);
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

  // Realtime updates for responses + reactions
  useEffect(() => {
    if (!thread?.id) return;

    const channel = supabase
      .channel(`roast:${thread.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'roast_responses', filter: `thread_id=eq.${thread.id}` },
        () => {
          // New response: reload thread to get the new response with user info
          loadThread();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions' },
        async (payload) => {
          // New reaction: only refresh reaction summaries for affected response
          const targetId = payload.new?.target_id as string | undefined;
          if (targetId && payload.new?.target_type === 'roast_response') {
            const summaries = await fetchReactionSummaries({ targetType: 'roast_response', targetIds: [targetId] });
            setReactionByResponseId((prev) => ({ ...prev, ...summaries }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'reactions' },
        async (payload) => {
          // Deleted reaction: only refresh reaction summaries for affected response
          const targetId = payload.old?.target_id as string | undefined;
          if (targetId && payload.old?.target_type === 'roast_response') {
            const summaries = await fetchReactionSummaries({ targetType: 'roast_response', targetIds: [targetId] });
            setReactionByResponseId((prev) => ({ ...prev, ...summaries }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadThread, thread?.id, fetchReactionSummaries]);

  const roastLevel = checkIn?.pacts?.roast_level ?? 2;
  const canTextPost = useMemo(
    () => roastLevel >= 2 && message.trim().length > 0 && thread?.status === 'open',
    [message, roastLevel, thread?.status]
  );
  const canMediaPost = useMemo(
    () => roastLevel >= 2 && thread?.status === 'open',
    [roastLevel, thread?.status]
  );

  const handlePost = useCallback(async () => {
    if (!thread) return;
    if (!canTextPost) return;
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
  }, [canTextPost, message, thread]);

  const handlePostGif = useCallback(async () => {
    if (!thread) return;
    if (!canMediaPost) return;
    const url = gifUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setError('GIF URL must start with http(s)://');
      return;
    }

    setIsPostingMedia(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to post');
        return;
      }

      setGifUrl('');
      const { error: insertError } = await supabase.from('roast_responses').insert({
        thread_id: thread.id,
        user_id: user.id,
        content_type: 'gif',
        content: url,
      });
      if (insertError) throw insertError;
    } catch (e: any) {
      console.error('Post gif exception:', e);
      setError(e?.message || 'Failed to post GIF');
    } finally {
      setIsPostingMedia(false);
    }
  }, [canMediaPost, gifUrl, thread]);

  const handlePostImage = useCallback(
    async (file: File) => {
      if (!thread) return;
      if (!canMediaPost) return;
      if (!file) return;

      setIsPostingMedia(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('You must be logged in to post');
          return;
        }

        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${thread.id}/${user.id}/${Date.now()}.${ext}`;
        await uploadFileToBucket({ bucket: 'roasts', path, file, upsert: true });

        const { error: insertError } = await supabase.from('roast_responses').insert({
          thread_id: thread.id,
          user_id: user.id,
          content_type: 'image',
          content: path, // store storage path; we sign when rendering
        });

        if (insertError) throw insertError;
      } catch (e: any) {
        console.error('Post image exception:', e);
        setError(e?.message || 'Failed to post image');
      } finally {
        setIsPostingMedia(false);
      }
    },
    [canMediaPost, thread]
  );

  const handleToggleReaction = useCallback(
    async (responseId: string, emoji: ReactionEmoji) => {
      // Optimistically update local state
      setReactionByResponseId((prev) => {
        const current = prev[responseId] || { counts: { skull: 0, cap: 0, clown: 0, salute: 0, fire: 0, clap: 0 }, myReaction: null };
        const newCounts = { ...current.counts };
        const wasMyReaction = current.myReaction === emoji;

        if (wasMyReaction) {
          // Toggle off: remove reaction
          newCounts[emoji] = Math.max(0, newCounts[emoji] - 1);
          return { ...prev, [responseId]: { counts: newCounts, myReaction: null } };
        } else {
          // Toggle on or change: add/change reaction
          if (current.myReaction) {
            // Remove old reaction count
            newCounts[current.myReaction] = Math.max(0, newCounts[current.myReaction] - 1);
          }
          // Add new reaction count
          newCounts[emoji] = (newCounts[emoji] || 0) + 1;
          return { ...prev, [responseId]: { counts: newCounts, myReaction: emoji } };
        }
      });

      // Apply the change to the database
      try {
        await toggleReaction({ targetType: 'roast_response', targetId: responseId, emoji });
        // Refresh just this response's reaction summary (not the whole thread)
        const summaries = await fetchReactionSummaries({ targetType: 'roast_response', targetIds: [responseId] });
        setReactionByResponseId((prev) => ({ ...prev, ...summaries }));
      } catch (e) {
        // On error, revert optimistic update by refreshing just this response
        const summaries = await fetchReactionSummaries({ targetType: 'roast_response', targetIds: [responseId] });
        setReactionByResponseId((prev) => ({ ...prev, ...summaries }));
      }
    },
    [toggleReaction, fetchReactionSummaries]
  );

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

  const handleMute = useCallback(async () => {
    if (!thread) return;
    try {
      const { error: muteError } = await supabase
        .from('roast_threads')
        .update({ status: 'muted' })
        .eq('id', thread.id);

      if (muteError) {
        setError(muteError.message || 'Failed to mute thread');
        return;
      }

      await loadThread();
    } catch (e) {
      console.error('Mute thread exception:', e);
      setError('Failed to mute thread');
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
        {reactionsError && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
            {reactionsError}
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
                {checkIn.proof_url && (
                  <div className="mt-3 rounded overflow-hidden border border-text-muted/20">
                    <img src={checkIn.proof_url} alt="Proof" className="w-full max-w-sm object-cover" />
                  </div>
                )}
              </div>
              <div className="text-xs text-text-muted">
                {thread?.status === 'open' ? 'Open' : thread?.status === 'muted' ? 'Muted' : 'Closed'}
              </div>
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
                  {r.content_type === 'image' ? (
                    <div className="mt-1 rounded overflow-hidden border border-text-muted/20">
                      <img src={r.content} alt="Roast image" className="w-full max-w-sm object-cover" />
                    </div>
                  ) : r.content_type === 'gif' ? (
                    <div className="mt-1 rounded overflow-hidden border border-text-muted/20">
                      <img src={r.content} alt="GIF" className="w-full max-w-sm object-cover" />
                    </div>
                  ) : (
                    <div className="text-text-primary text-sm">{r.content}</div>
                  )}

                  {/* Reactions */}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {REACTION_EMOJI_OPTIONS.map((opt) => {
                      const summary = reactionByResponseId[r.id];
                      const count = summary?.counts?.[opt.key] ?? 0;
                      const isMine = summary?.myReaction === opt.key;
                      if (count === 0 && !isMine) return null;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleToggleReaction(r.id, opt.key)}
                          disabled={isLoadingReactions}
                          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                            isMine
                              ? 'bg-primary/15 border-primary/30 text-primary'
                              : 'bg-surface-elevated border-text-muted/20 text-text-primary hover:bg-surface'
                          }`}
                          title={opt.key}
                        >
                          {opt.label} {count > 0 ? count : ''}
                        </button>
                      );
                    })}

                    {thread?.status === 'open' && (
                      <div className="flex items-center gap-1">
                        {REACTION_EMOJI_OPTIONS.map((opt) => (
                          <button
                            key={`picker-${r.id}-${opt.key}`}
                            onClick={() => handleToggleReaction(r.id, opt.key)}
                            disabled={isLoadingReactions}
                            className="text-xs px-2 py-1 rounded-full border bg-surface border-text-muted/20 hover:bg-surface-elevated transition-colors"
                            title={`React ${emojiKeyToLabel(opt.key)}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex items-end gap-2">
            {roastLevel === 1 ? (
              <div className="w-full text-sm text-text-secondary bg-surface-elevated border border-text-muted/20 rounded-lg p-3">
                🌶 Mild roast level: reactions only.
              </div>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={thread?.status === 'open' ? 'Write a roast...' : 'Thread is closed'}
                  disabled={thread?.status !== 'open' || isPosting || isPostingMedia}
                  className="flex-1 rounded-md bg-background border border-text-muted/20 p-3 text-sm text-text-primary placeholder:text-text-muted disabled:opacity-60"
                  rows={3}
                />
                <button
                  onClick={handlePost}
                  disabled={!canTextPost || isPosting}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    !canTextPost || isPosting ? 'bg-surface text-text-muted cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </button>
              </>
            )}
          </div>

          {thread?.status === 'open' && roastLevel >= 2 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted">GIF URL</label>
                <input
                  value={gifUrl}
                  onChange={(e) => setGifUrl(e.target.value)}
                  disabled={!canMediaPost || isPostingMedia}
                  placeholder="https://..."
                  className="flex-1 rounded-md bg-background border border-text-muted/20 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted disabled:opacity-60"
                />
                <button
                  onClick={handlePostGif}
                  disabled={!canMediaPost || isPostingMedia || gifUrl.trim().length === 0}
                  className="px-3 py-2 rounded-lg bg-surface border border-text-muted/20 text-text-primary hover:bg-surface-elevated disabled:opacity-60 transition-colors text-sm font-semibold"
                >
                  Post GIF
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs text-text-muted">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!canMediaPost || isPostingMedia}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handlePostImage(file);
                      // allow re-selecting same file
                      e.currentTarget.value = '';
                    }}
                    className="block text-xs text-text-muted mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {thread?.status === 'open' && isOwner && (
            <div className="mt-3 flex justify-end gap-4">
              <button
                onClick={handleMute}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Mute thread
              </button>
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

