'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PhoneLoginFormProps {
  onOtpSent: (phone: string) => void;
}

export function PhoneLoginForm({ onOtpSent }: PhoneLoginFormProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const toE164 = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits[0] === '1') {
      return `+${digits}`;
    }
    return phone.startsWith('+') ? phone : `+${digits}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const e164Phone = toE164(phone);
      
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: e164Phone,
      });

      if (otpError) {
        if (otpError.message.includes('rate limit')) {
          setError('Too many requests. Please wait a moment and try again.');
        } else if (otpError.message.includes('invalid')) {
          setError('Invalid phone number. Please check and try again.');
        } else {
          setError(otpError.message || 'Failed to send verification code.');
        }
        return;
      }

      // Success - show OTP input
      onOtpSent(e164Phone);
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-2">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          required
          className="w-full px-4 py-3 bg-background border border-text-muted/20 rounded-lg focus:outline-none focus:border-primary"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={handlePhoneChange}
          maxLength={14} // (XXX) XXX-XXXX
        />
        <p className="mt-1 text-xs text-text-muted">
          We'll send you a verification code via SMS
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || phone.length < 10}
        className="w-full px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending Code...' : 'Send Verification Code'}
      </button>
    </form>
  );
}
