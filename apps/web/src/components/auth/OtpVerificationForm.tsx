'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { OtpInput } from './OtpInput';

interface OtpVerificationFormProps {
  phone: string;
  onSuccess: (otpCode: string) => void | Promise<void>;
  onResend: () => void;
}

export function OtpVerificationForm({ phone, onSuccess, onResend }: OtpVerificationFormProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCountdown]);

  const formatPhoneDisplay = (phoneNumber: string): string => {
    if (!phoneNumber) return '';
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phoneNumber;
  };

  const handleVerify = async (otpCode: string) => {
    setError('');
    setLoading(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otpCode,
        type: 'sms',
      });

      if (verifyError) {
        if (verifyError.message.includes('expired')) {
          setError('Code expired. Please request a new one.');
        } else if (verifyError.message.includes('invalid')) {
          setError('Invalid code. Please try again.');
        } else {
          setError(verifyError.message || 'Verification failed.');
        }
        return;
      }

      // Success - check if user profile exists
      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', data.user.id)
          .single();

        // Call onSuccess callback
        await onSuccess(otpCode);
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;

    setError('');
    setLoading(true);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (otpError) {
        setError('Failed to resend code. Please try again.');
        return;
      }

      setResendCountdown(60);
      setResendMessage('Code sent!');
      setTimeout(() => setResendMessage(null), 3000);
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-text-secondary mb-2">
          Enter the code sent to
        </p>
        <p className="text-text-primary font-medium">
          {formatPhoneDisplay(phone)}
        </p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {resendMessage && (
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg text-sm text-center">
          {resendMessage}
        </div>
      )}

      <OtpInput
        length={6}
        onComplete={handleVerify}
        error={!!error}
      />

      {loading && (
        <div className="text-center text-text-secondary text-sm">
          Verifying...
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCountdown > 0 || loading}
          className="text-primary hover:underline disabled:text-text-muted disabled:no-underline disabled:cursor-not-allowed text-sm"
        >
          {resendCountdown > 0
            ? `Resend code in ${resendCountdown}s`
            : 'Resend code'}
        </button>
      </div>
    </div>
  );
}
