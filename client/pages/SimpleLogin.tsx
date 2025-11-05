import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle } from 'lucide-react';
import OLXStyleHeader from '../components/OLXStyleHeader';
import GoogleAuth from '../components/GoogleAuth';
import EmailVerification from '../components/EmailVerification';

export default function SimpleLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationLink, setVerificationLink] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    userType: 'seller' as 'seller' | 'buyer' | 'agent',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { 
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            password: formData.password,
          }
        : formData;

      console.log('Making request to:', endpoint);
      console.log('Payload:', payload);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        const { token, user, verificationLink } = data.data;
        login(token, user);

        if (!isLogin && verificationLink) {
          // Show email verification for new registrations
          setVerificationLink(verificationLink);
          setShowEmailVerification(true);
          setSuccess('Registration successful! Please verify your email to complete your account setup.');
        } else {
          setSuccess(`${isLogin ? 'Login' : 'Registration'} successful! Redirecting...`);

          // Redirect based on user type
          setTimeout(() => {
            switch (user.userType) {
              case 'seller':
                navigate('/seller-dashboard');
                break;
              case 'agent':
                navigate('/agent-dashboard');
                break;
              case 'buyer':
                navigate('/buyer-dashboard');
                break;
              default:
                navigate('/user-dashboard');
            }
          }, 1000);
        }
      } else {
        setError(data.error || `${isLogin ? 'Login' : 'Registration'} failed`);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {showEmailVerification ? (
            <div>
              <EmailVerification
                email={formData.email}
                onVerificationSent={(link) => {
                  console.log('Verification link:', link);
                }}
              />

              {verificationLink && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    📧 Demo: Email Verification
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

              <div className="mt-6 text-center">
                <Button
                  onClick={() => {
                    setShowEmailVerification(false);
                    setVerificationLink('');
                  }}
                  variant="outline"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-[#C70000]">
                {isLogin ? 'Login' : 'Register'}
              </CardTitle>
              <p className="text-gray-600">
                {isLogin ? 'Welcome back!' : 'Create your account'}
              </p>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4 bg-red-50 border-red-200">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="pl-10"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className="pl-10"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      I am a
                    </label>
                    <select
                      name="userType"
                      value={formData.userType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C70000] focus:border-transparent"
                      required={!isLogin}
                    >
                      <option value="seller">Property Seller</option>
                      <option value="buyer">Property Buyer</option>
                      <option value="agent">Real Estate Agent</option>
                    </select>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C70000] hover:bg-[#A60000] text-white"
                >
                  {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6">
                  <GoogleAuth
                    buttonText="Continue with Google"
                    onSuccess={(user) => {
                      setSuccess(`Welcome ${user.name}! Redirecting to your dashboard...`);
                    }}
                    onError={(error) => {
                      setError(error);
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-[#C70000] font-medium hover:underline"
                  >
                    {isLogin ? 'Register here' : 'Login here'}
                  </button>
                </p>
              </div>

              {/* Test Credentials */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Test Credentials:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>Seller: seller@test.com / password123</div>
                  <div>Buyer: buyer@test.com / password123</div>
                  <div>Agent: agent@test.com / password123</div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}
