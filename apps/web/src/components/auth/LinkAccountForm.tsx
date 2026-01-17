'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PhoneLoginForm } from './PhoneLoginForm';
import { OtpVerificationForm } from './OtpVerificationForm';

type LinkType = 'phone' | 'email';
type PhoneLinkStep = 'input' | 'verify';

interface LinkAccountFormProps {
  type: LinkType;
  currentEmail?: string | null;
  currentPhone?: string | null;
  onSuccess: () => void;
}

export function LinkAccountForm({ type, currentEmail, currentPhone, onSuccess }: LinkAccountFormProps) {
  const [phoneStep, setPhoneStep] = useState<PhoneLinkStep>('input');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLinkPhone = async (phoneNumber: string, otp: string) => {
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Verify OTP first
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms',
      });

      if (verifyError) {
        // If phone already belongs to another account, show error
        if (verifyError.message.includes('already registered') || verifyError.message.includes('already exists')) {
          setError('This phone number is already associated with another account. Please log in to that account first.');
          return;
        }
        throw verifyError;
      }

      // Check if phone already exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phoneNumber)
        .single();

      if (existingUser && existingUser.id !== user.id) {
        setError('This phone number is already associated with another account.');
        return;
      }

      // Link phone identity to current user
      const { error: linkError } = await supabase.auth.linkIdentity({
        provider: 'phone',
        options: {
          phone: phoneNumber,
        },
      });

      if (linkError) {
        if (linkError.message.includes('already linked')) {
          // Phone is already linked, just update users table
        } else {
          throw linkError;
        }
      }

      // Update users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ phone: phoneNumber })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to link phone number');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser && existingUser.id !== user.id) {
        setError('This email is already associated with another account.');
        return;
      }

      // Try to sign up with email (this will create the identity)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        // If email already exists in auth, try to link
        if (signUpError.message.includes('already registered')) {
          // Email exists - need to link
          // Note: Supabase doesn't directly support linking email/password
          // We'll need to use a different approach or show a message
          setError('Email linking requires the user to log in with that email first. Please contact support for assistance.');
          return;
        }
        throw signUpError;
      }

      // If signup created a new user, we need to merge accounts
      // For MVP, we'll prevent this and show an error
      if (signUpData.user && signUpData.user.id !== user.id) {
        setError('This email is already associated with another account. Please log in to that account first.');
        return;
      }

      // Link email identity (if signup was successful and same user)
      if (signUpData.user && signUpData.user.id === user.id) {
        // Update users table
        const { error: updateError } = await supabase
          .from('users')
          .update({ email })
          .eq('id', user.id);

        if (updateError) throw updateError;
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to link email');
    } finally {
      setLoading(false);
    }
  };

  if (type === 'phone') {
    if (phoneStep === 'input') {
      return (
        <div className="space-y-4">
          <PhoneLoginForm
            onOtpSent={(phoneNumber) => {
              setPhone(phoneNumber);
              setPhoneStep('verify');
            }}
          />
          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setPhoneStep('input')}
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          ← Change phone number
        </button>
        <OtpVerificationForm
          phone={phone}
          onSuccess={async (otpCode) => {
            await handleLinkPhone(phone, otpCode);
          }}
          onResend={() => setPhoneStep('input')}
        />
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Email linking form
  return (
    <form className="space-y-4" onSubmit={handleLinkEmail}>
      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="link-email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          id="link-email"
          type="email"
          required
          className="w-full px-4 py-3 bg-background border border-text-muted/20 rounded-lg focus:outline-none focus:border-primary"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="link-password" className="block text-sm font-medium mb-2">
          Password
        </label>
        <input
          id="link-password"
          type="password"
          required
          className="w-full px-4 py-3 bg-background border border-text-muted/20 rounded-lg focus:outline-none focus:border-primary"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1 text-xs text-text-muted">
          Create a password for this email address
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Linking...' : 'Link Email'}
      </button>
    </form>
  );
}
