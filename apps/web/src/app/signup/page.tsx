'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[SIGNUP] Starting signup for email:', formData.email);
      
      // 1. Sign up with Supabase Auth
      // The database trigger will automatically create the user profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.name,
          },
        },
      });

      console.log('[SIGNUP] Auth response:', {
        hasUser: !!authData?.user,
        userId: authData?.user?.id,
        userEmail: authData?.user?.email,
        hasSession: !!authData?.session,
        error: authError?.message,
      });

      if (authError) {
        console.error('[SIGNUP] Auth error:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
        });
        
        // If user already exists error, suggest login
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          setError('An account with this email already exists. Please log in instead.');
          return;
        }
        throw authError;
      }

      if (!authData.user) {
        console.warn('[SIGNUP] No user returned - email confirmation may be required');
        setError('Please check your email to confirm your account before logging in.');
        return;
      }

      // 3. Profile is automatically created by database trigger
      // Wait a moment for trigger to execute, then verify
      console.log('[SIGNUP] Waiting for trigger to create profile...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify profile was created
      const { data: profileData, error: profileCheckError } = await supabase
        .from('users')
        .select('id, email, phone, display_name')
        .eq('id', authData.user.id)
        .single();

      console.log('[SIGNUP] Profile check:', {
        found: !!profileData,
        profileData,
        error: profileCheckError?.message,
        errorCode: profileCheckError?.code,
      });

      if (profileCheckError) {
        if (profileCheckError.code === 'PGRST116') {
          console.error('[SIGNUP] Profile not found after signup! Auth user ID:', authData.user.id);
          setError('Account created but profile setup failed. Please contact support.');
          return;
        } else {
          console.error('[SIGNUP] Profile check error:', profileCheckError);
          // Don't fail - might be a timing issue, but log it
        }
      }

      console.log('[SIGNUP] Signup successful! Redirecting to login...');
      // 4. Redirect to login
      router.push('/login?success=Account created! Please log in.');
    } catch (err: any) {
      // Handle specific error cases
      if (err.message?.includes('already registered') || err.message?.includes('already exists')) {
        setError('An account with this email already exists. Please log in instead.');
      } else if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        setError('This email is already associated with an account. Please log in instead.');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-primary">Cooked</span>
          </h1>
          <p className="text-text-secondary">Create your account</p>
        </div>

        <div className="bg-surface p-8 rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Display Name
              </label>
              <input
                id="name"
                type="text"
                required
                className="w-full px-4 py-3 bg-background border border-text-muted/20 rounded-lg focus:outline-none focus:border-primary"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-background border border-text-muted/20 rounded-lg focus:outline-none focus:border-primary"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-background border border-text-muted/20 rounded-lg focus:outline-none focus:border-primary"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-text-secondary text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
