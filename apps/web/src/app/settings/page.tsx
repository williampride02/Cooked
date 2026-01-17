'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LinkAccountForm } from '@/components/auth/LinkAccountForm';
import type { User } from '@cooked/shared';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLinkPhone, setShowLinkPhone] = useState(false);
  const [showLinkEmail, setShowLinkEmail] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      router.push('/login');
      return;
    }

    setUser(authUser);

    // Fetch user profile
    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    setProfile(profileData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleLinkSuccess = async () => {
    // Refresh profile data
    await checkUser();
    setShowLinkPhone(false);
    setShowLinkEmail(false);
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
            <span className="text-primary">Settings</span>
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-surface-elevated rounded-lg hover:bg-surface transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-surface p-8 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <p className="text-text-secondary text-sm">Display Name</p>
                <p className="text-text-primary">{profile?.display_name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-text-secondary text-sm">Account Created</p>
                <p className="text-text-primary">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Account & Security Section */}
          <div className="bg-surface p-8 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Account & Security</h2>
            
            <div className="space-y-6">
              {/* Email Account */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-text-primary font-medium">Email</p>
                    {profile?.email ? (
                      <p className="text-text-secondary text-sm">{profile.email}</p>
                    ) : (
                      <p className="text-text-secondary text-sm">Not linked</p>
                    )}
                  </div>
                  {!profile?.email && !showLinkEmail && (
                    <button
                      onClick={() => setShowLinkEmail(true)}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
                    >
                      Link Email
                    </button>
                  )}
                </div>
                {showLinkEmail && (
                  <div className="mt-4 p-4 bg-background rounded-lg border border-text-muted/20">
                    <LinkAccountForm
                      type="email"
                      currentEmail={profile?.email}
                      currentPhone={profile?.phone}
                      onSuccess={handleLinkSuccess}
                    />
                    <button
                      onClick={() => setShowLinkEmail(false)}
                      className="mt-2 text-sm text-text-secondary hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Phone Account */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-text-primary font-medium">Phone</p>
                    {profile?.phone ? (
                      <p className="text-text-secondary text-sm">{profile.phone}</p>
                    ) : (
                      <p className="text-text-secondary text-sm">Not linked</p>
                    )}
                  </div>
                  {!profile?.phone && !showLinkPhone && (
                    <button
                      onClick={() => setShowLinkPhone(true)}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
                    >
                      Link Phone
                    </button>
                  )}
                </div>
                {showLinkPhone && (
                  <div className="mt-4 p-4 bg-background rounded-lg border border-text-muted/20">
                    <LinkAccountForm
                      type="phone"
                      currentEmail={profile?.email}
                      currentPhone={profile?.phone}
                      onSuccess={handleLinkSuccess}
                    />
                    <button
                      onClick={() => setShowLinkPhone(false)}
                      className="mt-2 text-sm text-text-secondary hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="bg-surface p-8 rounded-lg">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-error/10 text-error rounded-lg font-semibold hover:bg-error/20 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
