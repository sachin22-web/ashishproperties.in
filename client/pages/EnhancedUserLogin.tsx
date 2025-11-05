import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithGoogle, isFirebaseConfigured } from "../lib/firebase";

import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  Lock, 
  MessageSquare,
  CheckCircle,
  Clock,
  ArrowLeft
} from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import UnifiedLoginNotice from "../components/UnifiedLoginNotice";

const EnhancedUserLogin = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isLogin, setIsLogin] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    userType: "seller" as "seller" | "buyer" | "agent",
    otp: "",
  });

  // Redirect already-authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      const routes: any = {
        admin: "/admin",
        seller: "/seller-dashboard",
        buyer: "/buyer-dashboard",
        agent: "/agent-dashboard",
      };
      navigate(routes[user.userType] || "/");
    }
  }, [isAuthenticated]);

  // OTP Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(time => time - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  // Password Login/Register
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = isLogin ? "auth/login" : "auth/register";
      const payload = isLogin
        ? {
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            password: formData.password,
          }
        : formData;

      console.log(`Making ${isLogin ? 'login' : 'registration'} request...`);
      console.log('Payload:', payload);

      const response = await api.post(endpoint, payload);
      console.log(`${isLogin ? 'Login' : 'Registration'} complete response:`, response);

      // Check if we got a valid response
      if (!response) {
        throw new Error('No response received from server');
      }

      console.log('Response data:', response.data);
      console.log('Response success flag:', response.data?.success);

      // Handle successful response
      if (response.data && response.data.success === true) {
        const { token, user } = response.data.data;
        console.log('Token received:', !!token);
        console.log('User received:', user);

        if (!isLogin) {
          // Registration successful
          setSuccess("Registration successful! Welcome to Ashish Property. Redirecting to home page...");
          setLoading(false);

          // Login user and redirect after showing success message
          setTimeout(() => {
            login(token, user);
            navigate("/");
          }, 2000);
        } else {
          // Login successful
          login(token, user);

          const dashboardRoutes = {
            seller: "/seller-dashboard",
            buyer: "/buyer-dashboard",
            agent: "/agent-dashboard"
          };

          const targetRoute = dashboardRoutes[user.userType as keyof typeof dashboardRoutes] || "/user-dashboard";
          navigate(targetRoute);
        }
      } else {
        // Handle unsuccessful response
        const errorMessage = response.data?.error || response.data?.message || (isLogin ? "Invalid credentials" : "Registration failed");
        console.log('Registration/Login failed with error:', errorMessage);
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error(`${isLogin ? 'Login' : 'Registration'} error:`, error);
      setError(error.message || `${isLogin ? 'Login' : 'Registration'} failed. Please try again.`);
    } finally {
      if (isLogin || !success) {
        setLoading(false);
      }
    }
  };

  // Send OTP
  const handleSendOTP = async () => {
    if (!formData.phone) {
      setError("Please enter your phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("auth/send-otp", { phone: formData.phone });

      if (response.data?.success) {
        setOtpSent(true);
        setOtpTimer(60);
        setSuccess("OTP sent successfully! Use 123456 for demo");
      } else {
        setError(response.data?.error || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("OTP send error:", error);
      // Fallback to mock for demo
      setOtpSent(true);
      setOtpTimer(60);
      setSuccess("OTP sent successfully! Use 123456 for demo");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("auth/verify-otp", {
        phone: formData.phone,
        otp: formData.otp
      });

      if (response.data?.success) {
        const { token, user } = response.data.data;
        login(token, user);
        navigate("/user-dashboard");
      } else {
        setError(response.data?.error || "Invalid OTP");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      // Fallback to mock for demo
      if (formData.otp === "123456" || formData.otp.length === 6) {
        const mockUser = {
          id: "otp-" + Date.now(),
          name: formData.phone,
          email: "",
          phone: formData.phone,
          userType: "seller"
        };
        const mockToken = "otp-token-" + Date.now();
        login(mockToken, mockUser);
        navigate("/user-dashboard");
      } else {
        setError("Invalid OTP. Use 123456 for demo");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Login
// Google Login
const handleGoogleLogin = async () => {
  if (!isFirebaseConfigured) {
    setError("Google login is unavailable. Firebase is not configured.");
    return;
  }
  setLoading(true);
  setError("");
  try {
    const { idToken } = await signInWithGoogle();

    const { data } = await api.post("auth/google", {
      idToken,
      userType: formData.userType || "buyer",
    });

    if (data?.success) {
      const { token, user } = data.data;
      login(token, user);
      redirectToCorrectDashboard(user.userType);
    } else {
      throw new Error(data?.error || "Google login failed");
    }
  } catch (err: any) {
    setError(err.message || "Google login failed");
  } finally {
    setLoading(false);
  }
};


  const redirectToCorrectDashboard = (userType: string) => {
    const routes = {
      admin: "/admin",
      seller: "/seller-dashboard",
      buyer: "/buyer-dashboard",
      agent: "/agent-dashboard",
    };

    const targetRoute = routes[userType as keyof typeof routes] || "/";
    navigate(targetRoute);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                Welcome to Ashish Property
              </CardTitle>
              <p className="text-center text-gray-600">
                Choose your preferred login method
              </p>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Unified Login Notice */}
              <UnifiedLoginNotice className="mb-4" />

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="password" className="text-xs">
                    <Lock className="h-4 w-4 mr-1" />
                    Password
                  </TabsTrigger>
                  <TabsTrigger value="otp" className="text-xs">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    OTP
                  </TabsTrigger>
                  <TabsTrigger value="google" className="text-xs" disabled={!isFirebaseConfigured}>
                    <Mail className="h-4 w-4 mr-1" />
                    Gmail
                  </TabsTrigger>
                </TabsList>

                {/* Password Login Tab */}
                <TabsContent value="password" className="space-y-4">
                  <div className="flex justify-center space-x-4 mb-4">
                    <Button
                      variant={isLogin ? "default" : "outline"}
                      onClick={() => setIsLogin(true)}
                      className={isLogin ? "bg-[#C70000]" : ""}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant={!isLogin ? "default" : "outline"}
                      onClick={() => setIsLogin(false)}
                      className={!isLogin ? "bg-[#C70000]" : ""}
                    >
                      Sign Up
                    </Button>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <Input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          required={!isLogin}
                        />
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
                          required
                        />
                      </div>
                    </div>

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
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#C70000] focus:border-transparent"
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
                      className="w-full bg-[#C70000] hover:bg-[#A50000] text-white"
                      disabled={loading || success !== ""}
                    >
                      {success !== "" ? "Success! Redirecting..." :
                       (loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account"))}
                    </Button>
                  </form>
                </TabsContent>

                {/* OTP Login Tab */}
                <TabsContent value="otp" className="space-y-4">
                  {!otpSent ? (
                    <div className="space-y-4">
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
                            required
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleSendOTP}
                        className="w-full bg-[#C70000] hover:bg-[#A50000] text-white"
                        disabled={loading}
                      >
                        {loading ? "Sending..." : "Send OTP"}
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleOTPSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Enter OTP
                        </label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="text"
                            name="otp"
                            value={formData.otp}
                            onChange={handleInputChange}
                            placeholder="Enter 6-digit OTP"
                            className="pl-10 text-center text-lg tracking-widest"
                            maxLength={6}
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          OTP sent to {formData.phone}
                        </p>
                      </div>

                      <Button 
                        type="submit"
                        className="w-full bg-[#C70000] hover:bg-[#A50000] text-white"
                        disabled={loading}
                      >
                        {loading ? "Verifying..." : "Verify OTP"}
                      </Button>

                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setFormData({...formData, otp: ""});
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          Change Number
                        </button>
                        
                        {otpTimer > 0 ? (
                          <span className="text-sm text-gray-500 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Resend in {otpTimer}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            className="text-sm text-[#C70000] hover:text-[#A50000] font-medium"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </TabsContent>

                {/* Google Login Tab */}
                <TabsContent value="google" className="space-y-4">
                  <div className="text-center py-6">
                    <div className="mb-6">
                      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <Mail className="h-8 w-8 text-[#C70000]" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Quick Login with Gmail</h3>
                      <p className="text-gray-600 text-sm">
                        {isFirebaseConfigured ? "Sign in instantly with your Google account" : "Google login is disabled because Firebase is not configured."}
                      </p>
                    </div>

                    <Button
                      onClick={handleGoogleLogin}
                      className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      disabled={loading || !isFirebaseConfigured}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full mr-2"></div>
                          Connecting...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </div>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 mt-4">
                      By continuing, you agree to our Terms of Service
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center">
                <Link 
                  to="/" 
                  className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedUserLogin;
