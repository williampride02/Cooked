'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PhoneLoginForm } from '@/components/auth/PhoneLoginForm';
import { OtpVerificationForm } from '@/components/auth/OtpVerificationForm';

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic';

type AuthMethod = 'email' | 'phone';
type PhoneStep = 'input' | 'verify';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<AuthMethod>('email');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input');
  const [phone, setPhone] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract success message from query params
    const successMessage = searchParams.get('success');
    if (successMessage) {
      setSuccess(successMessage);
    }
  }, [searchParams]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOtpSent = (phoneNumber: string) => {
    setPhone(phoneNumber);
    setPhoneStep('verify');
  };

  const handlePhoneVerifySuccess = async (_otpCode: string) => {
    router.push('/dashboard');
  };

  const handlePhoneResend = () => {
    setPhoneStep('input');
    setPhone('');
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-primary">Cooked</span>
          </h1>
          <p className="text-text-secondary">Log in to your account</p>
        </div>

        <div className="bg-surface p-8 rounded-lg">
          {/* Tab Selector */}
          {phoneStep === 'input' && (
            <div className="flex gap-2 mb-6 border-b border-text-muted/20">
              <button
                type="button"
                onClick={() => setMethod('email')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  method === 'email'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setMethod('phone')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  method === 'phone'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Phone
              </button>
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg text-sm mb-6">
              {success}
            </div>
          )}

          {/* Email Login */}
          {method === 'email' && phoneStep === 'input' && (
            <form className="space-y-6" onSubmit={handleEmailSubmit}>
              {error && (
                <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

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
                {loading ? 'Logging In...' : 'Log In'}
              </button>
            </form>
          )}

          {/* Phone Login - Input */}
          {method === 'phone' && phoneStep === 'input' && (
            <PhoneLoginForm onOtpSent={handlePhoneOtpSent} />
          )}

          {/* Phone Login - OTP Verification */}
          {method === 'phone' && phoneStep === 'verify' && (
            <div>
              <button
                type="button"
                onClick={handlePhoneResend}
                className="mb-4 text-sm text-text-secondary hover:text-text-primary"
              >
                ← Change phone number
              </button>
              <OtpVerificationForm
                phone={phone}
                onSuccess={handlePhoneVerifySuccess}
                onResend={handlePhoneResend}
              />
            </div>
          )}

          {phoneStep === 'input' && (
            <p className="mt-6 text-center text-text-secondary text-sm">
              Don't have an account?{' '}
              <a href="/signup" className="text-primary hover:underline">
                Sign up
              </a>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
