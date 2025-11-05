// client/src/components/GoogleAuth.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

// ✅ Real Firebase helper import (adjust path if needed)
import { signInWithGoogle } from '../lib/firebase';

interface GoogleAuthProps {
  buttonText?: string;
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
}

export default function GoogleAuth({
  buttonText = 'Continue with Google',
  onSuccess,
  onError
}: GoogleAuthProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // 1) Firebase popup → real idToken + profile
      const { idToken, profile } = await signInWithGoogle();
      console.log('[GOOGLE][STEP1] profile:', profile);
      console.log('[GOOGLE][STEP1] idToken head:', idToken.slice(0, 18), 'len:', idToken.length);

      // 2) Backend ko bhejo — Authorization header + body fallback
      const resp = await fetch('/api/auth/google', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,   // 🔑 most servers expect this
        },
        body: JSON.stringify({
          idToken,
          provider: 'google',
          email: profile.email,
          name: profile.name,
          photoURL: profile.photoURL,
          userType: 'seller', // default (change if needed)
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        console.warn('[GOOGLE][STEP1] non-200:', resp.status, t);
        throw new Error(t || `Server ${resp.status}`);
      }

      const data = await resp.json();
      console.log('[GOOGLE][STEP1] server response:', data);

      // Accept either { success, data: { token, user } } or { token, user }
      const ok = data?.success ?? true;
      const payload = data?.data ?? data;

      if (ok && payload?.token && payload?.user) {
        const { token, user } = payload;
        login(token, user);

        if (onSuccess) onSuccess(user);
        else {
          const t = String(user?.userType || 'seller').toLowerCase();
          if (t === 'seller') navigate('/seller-dashboard');
          else if (t === 'agent') navigate('/agent-dashboard');
          else if (t === 'buyer') navigate('/buyer-dashboard');
          else navigate('/user-dashboard');
        }
      } else {
        const msg = data?.error || data?.message || 'Google authentication failed';
        setError(msg);
        onError?.(msg);
      }
    } catch (err: any) {
      console.error('[GOOGLE][STEP1] login error:', err);
      const msg = err?.message || 'Sign-in failed';
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        variant="outline"
        className="w-full border-gray-300 hover:bg-gray-50"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? 'Connecting...' : buttonText}
      </Button>

      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500">
          By continuing with Google, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
