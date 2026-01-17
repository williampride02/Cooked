'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useInvites } from '@/hooks/useInvites';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function JoinByTokenPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [groupPreview, setGroupPreview] = useState<{ name: string; member_count: number } | null>(null);
  const { getInvitePreview, joinByToken, isLoading, error } = useInvites();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      // If not authenticated, store token and redirect to signup (default)
      if (!session && token) {
        localStorage.setItem('pendingInviteToken', token);
        router.push(`/signup?next=/join/${token}`);
        return;
      }

      // If authenticated, load group preview
      if (session && token) {
        loadPreview();
      }
    };

    checkAuth();
  }, [token, router]);

  const loadPreview = async () => {
    if (!token) return;

    const preview = await getInvitePreview(token);
    if (preview) {
      setGroupPreview({
        name: preview.name,
        member_count: preview.member_count,
      });
    }
  };

  const handleJoin = async () => {
    if (!token) return;

    const result = await joinByToken(token);
    if (result && result.success) {
      // Clear pending token
      localStorage.removeItem('pendingInviteToken');
      // Redirect to group feed
      router.push(`/group/${result.groupId}`);
    }
  };

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  // If not authenticated, this should have redirected, but show a fallback
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Redirecting to login...</div>
      </div>
    );
  }

  // Show error if preview failed
  if (error && !groupPreview) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="max-w-md w-full text-center">
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
          <Link
            href="/dashboard"
            className="text-primary hover:underline"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // Show confirmation screen
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-primary">Cooked</span>
          </h1>
          <p className="text-text-secondary">Join Group</p>
        </div>

        <div className="bg-surface p-8 rounded-lg space-y-6">
          {isLoading && !groupPreview ? (
            <div className="text-center text-text-secondary">Loading group information...</div>
          ) : groupPreview ? (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  {groupPreview.name}
                </h2>
                <p className="text-text-secondary">
                  {groupPreview.member_count} {groupPreview.member_count === 1 ? 'member' : 'members'}
                </p>
              </div>

              {error && (
                <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Joining...' : 'Join Group'}
              </button>

              <p className="text-center text-text-secondary text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Log in
                </Link>
              </p>

              <p className="text-center text-text-muted text-xs">
                You can link your phone number or email later in Settings
              </p>
            </>
          ) : (
            <div className="text-center text-text-secondary">
              Unable to load group information
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
