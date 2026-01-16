import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UsePhoneAuthReturn {
  requestOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, token: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function usePhoneAuth(): UsePhoneAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestOtp = useCallback(async (phone: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (otpError) {
        // Handle specific error messages
        if (otpError.message.includes('rate limit')) {
          setError('Too many requests. Please wait a moment and try again.');
        } else if (otpError.message.includes('invalid')) {
          setError('Invalid phone number. Please check and try again.');
        } else {
          setError(otpError.message || 'Failed to send verification code.');
        }
        return false;
      }

      return true;
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token,
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
        return false;
      }

      return true;
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    requestOtp,
    verifyOtp,
    isLoading,
    error,
    clearError,
  };
}

export default usePhoneAuth;
