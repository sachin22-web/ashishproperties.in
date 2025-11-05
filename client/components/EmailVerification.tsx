import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Mail, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface EmailVerificationProps {
  email?: string;
  onVerificationSent?: (verificationLink: string) => void;
  showResendOption?: boolean;
}

export default function EmailVerification({ 
  email: propEmail, 
  onVerificationSent,
  showResendOption = false 
}: EmailVerificationProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState(propEmail || user?.email || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [verificationLink, setVerificationLink] = useState('');

  const handleSendVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = showResendOption ? '/api/auth/resend-verification' : '/api/auth/send-verification';
      const token = localStorage.getItem('token');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (showResendOption && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: showResendOption ? undefined : JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Verification email sent successfully!');
        if (data.data?.verificationLink) {
          setVerificationLink(data.data.verificationLink);
          if (onVerificationSent) {
            onVerificationSent(data.data.verificationLink);
          }
        }
      } else {
        setError(data.error || 'Failed to send verification email');
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      setError(error.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Mail className="h-5 w-5 text-[#C70000]" />
          <span>Email Verification</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {!showResendOption && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={loading}
            />
          </div>
        )}

        <Button
          onClick={handleSendVerification}
          disabled={loading || (!email && !showResendOption)}
          className="w-full bg-[#C70000] hover:bg-[#A60000] text-white"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              {showResendOption ? 'Resend Verification Email' : 'Send Verification Email'}
            </>
          )}
        </Button>

        {verificationLink && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              📧 Demo: Verification Link
            </h4>
            <p className="text-xs text-blue-700 mb-3">
              In a real app, this would be sent to your email. For demo purposes, click the link below:
            </p>
            <a
              href={verificationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 underline"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Verify Email Address
            </a>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Check your email inbox and click the verification link to activate your account.
          </p>
        </div>

        {showResendOption && (
          <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Clock className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
            <p className="text-sm text-yellow-700">
              Your email is not verified yet. Click above to resend the verification email.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
