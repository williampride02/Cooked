'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@cooked/shared';

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);

    // Fetch user profile
    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">
            <span className="text-primary">Cooked</span> Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-surface-elevated rounded-lg hover:bg-surface transition-colors"
          >
            Log Out
          </button>
        </div>

        <div className="bg-surface p-8 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Welcome, {profile?.display_name || user?.email}!</h2>

          <div className="space-y-4">
            <div>
              <p className="text-text-secondary text-sm">Email</p>
              <p className="text-text-primary">{user?.email}</p>
            </div>

            {profile?.phone && (
              <div>
                <p className="text-text-secondary text-sm">Phone</p>
                <p className="text-text-primary">{profile.phone}</p>
              </div>
            )}

            <div>
              <p className="text-text-secondary text-sm">Account Created</p>
              <p className="text-text-primary">
                {new Date(user?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-background rounded-lg border border-text-muted/20">
            <p className="text-text-secondary text-sm">
              🚧 Dashboard coming soon! Groups, pacts, and check-ins will appear here.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
