import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithGoogle,
  isFirebaseConfigured,
  phoneAuth, // <- uses Recaptcha v2 invisible internally
} from "@/lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  MessageSquare,
  CheckCircle,
  Clock,
  ArrowLeft,
  Home,
  UserCheck,
  Shield,
} from "lucide-react";
import UnifiedLoginNotice from "../components/UnifiedLoginNotice";

const ComprehensiveAuth = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState("login");
  const [authMode, setAuthMode] = useState<"password" | "otp" | "google">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);     // global button guard
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    userType: "seller" as "seller" | "buyer" | "agent" | "admin",
    otp: "",
  });

  // Clean up reCAPTCHA/confirmation when switching away from OTP mode or unmount
  useEffect(() => {
    return () => {
      try {
        phoneAuth.reset();
      } catch {}
    };
  }, []);
  useEffect(() => {
    if (authMode !== "otp") {
      try {
        phoneAuth.reset();
      } catch {}
      setOtpSent(false);
      setOtpTimer(0);
      setFormData((s) => ({ ...s, otp: "" }));
    }
  }, [authMode]);

  // OTP Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((time) => time - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  // ----------------------------
  // Password Login / Registration
  // ----------------------------
  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const isLogin = activeTab === "login";

      // Basic client-side validation
      if (!isLogin) {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.name?.trim()) throw new Error("Name is required");
        if (!formData.email?.trim() || !emailRe.test(formData.email))
          throw new Error("Enter a valid email address");
        if (!formData.phone?.trim() || formData.phone.trim().replace(/\D/g, "").length < 10)
          throw new Error("Enter a valid 10-digit phone number");
        if (!formData.password || formData.password.length < 6)
          throw new Error("Password must be at least 6 characters");
        if (!["seller", "buyer", "agent", "admin"].includes(formData.userType))
          throw new Error("Select a valid user type");
      }

      const endpoint = isLogin ? "auth/login" : "auth/register";
      const payload = isLogin
        ? {
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            password: formData.password,
            userType: formData.userType === "admin" ? "admin" : undefined,
          }
        : {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            userType: formData.userType,
          };

      const { data } = await api.post(endpoint, payload);

      if (data.success) {
        const { token, user } = data.data;

        if (!isLogin) {
          setSuccess("Registration successful! Welcome to Ashish Property.");
          setTimeout(() => {
            login(token, user);
            redirectToCorrectDashboard(user.userType);
          }, 900);
        } else {
          login(token, user);
          redirectToCorrectDashboard(user.userType);
        }
      } else {
        const errorMessage =
          data.error ||
          data.message ||
          (isLogin ? "Invalid credentials" : "Registration failed");
        setError(errorMessage);
      }
    } catch (error: any) {
      let errorMessage =
        error?.data?.error || error?.data?.message || error.message;

      if (
        error.name === "TypeError" &&
        error.message?.includes("Failed to fetch")
      ) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (error.message?.includes("body stream already read")) {
        errorMessage = "Request processing error. Please try again.";
      } else if (!errorMessage) {
        errorMessage = `${
          activeTab === "login" ? "Login" : "Registration"
        } failed. Please try again.`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // OTP (Firebase Phone Auth)
  // =========================

  // Send OTP via Firebase (client-side)
  const handleSendOTP = async () => {
    if (loading) return;
    if (!formData.phone?.trim()) {
      setError("Please enter your phone number");
      return;
    }
    if (!isFirebaseConfigured) {
      setError("Phone OTP is unavailable: Firebase is not configured.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await phoneAuth.sendOTP(formData.phone); // +91 auto-add handled in helper
      setOtpSent(true);
      setOtpTimer(60);
      setSuccess("OTP sent! Check your phone.");
    } catch (e: any) {
      console.error("OTP send error:", e);
      // Friendly mapping
      const code = e?.code || "";
      if (code === "auth/billing-not-enabled") {
        setError(
          "Billing not enabled for reCAPTCHA Enterprise. Turn OFF Enterprise (use v2) or enable billing."
        );
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a minute and try again.");
      } else if (code === "auth/invalid-phone-number") {
        setError("Invalid phone number. Use format +91XXXXXXXXXX.");
      } else {
        setError(e?.message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP -> get Firebase ID token -> backend session
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.otp || formData.otp.length < 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    if (!isFirebaseConfigured) {
      setError("Phone OTP is unavailable: Firebase is not configured.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1) Verify on client with Firebase
      const { idToken } = await phoneAuth.verifyOTP(formData.otp);

      // 2) Ask backend to create session/JWT
      const { data } = await api.post("auth/firebase-login", {
        idToken,
        role: formData.userType, // buyer/seller/agent/admin
      });

      const ok = data?.success ?? data?.ok;
      const token = data?.data?.token ?? data?.token;
      const u = data?.data?.user ?? data?.user;

      if (!ok || !token || !u) {
        throw new Error(data?.error || data?.message || "Login failed");
      }

      login(token, u);
      redirectToCorrectDashboard(u.userType);
    } catch (err: any) {
      console.error("OTP verification error:", err);
      const code = err?.code || "";
      if (code === "auth/invalid-verification-code") {
        setError("Invalid code. Please check and try again.");
      } else if (code === "auth/code-expired") {
        setError("Code expired. Please request a new OTP.");
      } else {
        setError(err?.message || "OTP verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Login (Firebase popup + backend verify)
  const handleGoogleAuth = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!isFirebaseConfigured) {
        setError(
          "Google authentication is not available: Firebase is not configured."
        );
        return;
      }

      const { idToken } = await signInWithGoogle();

      const { data } = await api.post("auth/google", {
        idToken,
        userType: formData.userType || "buyer",
      });

      if (!data?.success) {
        throw new Error(data?.error || "Google authentication failed");
      }

      const { token, user } = data.data;
      login(token, user);
      redirectToCorrectDashboard(user.userType);
    } catch (err: any) {
      setError(err.message || "Google authentication failed");
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

  // Utility: mask phone for display when OTP sent
  const maskedPhone = formData.phone
    ? formData.phone.replace(/(\d{2})\d{6}(\d{2})/, "$1******$2")
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <div className="bg-[#C70000] text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Home className="h-6 w-6" />
            <h1 className="text-xl font-bold">ASHISH PROPERTY</h1>
          </div>
          <Link to="/" className="text-white hover:text-red-200">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative py-12 bg-gradient-to-r from-[#C70000] to-[#A50000] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Welcome to Ashish Property</h2>
          <p className="text-xl mb-8">Your trusted partner in real estate solutions</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <UserCheck className="h-8 w-8 mx-auto mb-2" />
              <h3 className="font-semibold">For Sellers</h3>
              <p className="text-sm">List and sell your properties</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Home className="h-8 w-8 mx-auto mb-2" />
              <h3 className="font-semibold">For Buyers</h3>
              <p className="text-sm">Find your dream home</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Shield className="h-8 w-8 mx-auto mb-2" />
              <h3 className="font-semibold">For Agents</h3>
              <p className="text-sm">Grow your business</p>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-[#C70000] to-[#A50000] text-white rounded-t-lg">
              <CardTitle className="text-center text-2xl">
                Get Started Today
              </CardTitle>
              <p className="text-center text-red-100">
                Choose your preferred method to continue
              </p>
            </CardHeader>

            <CardContent className="p-6">
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Unified Login Notice */}
              <UnifiedLoginNotice className="mb-4" />

              {/* Tab Selection */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" className="font-medium">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="register" className="font-medium">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="login" />
                <TabsContent value="register" />
              </Tabs>

              {/* Auth Method Selection */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <Button
                  variant={authMode === "password" ? "default" : "outline"}
                  onClick={() => setAuthMode("password")}
                  className={authMode === "password" ? "bg-[#C70000]" : ""}
                  size="sm"
                >
                  <Lock className="h-4 w-4 mr-1" />
                  Password
                </Button>
                <Button
                  variant={authMode === "otp" ? "default" : "outline"}
                  onClick={() => setAuthMode("otp")}
                  className={authMode === "otp" ? "bg-[#C70000]" : ""}
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  OTP
                </Button>
                <Button
                  variant={authMode === "google" ? "default" : "outline"}
                  onClick={() => setAuthMode("google")}
                  className={authMode === "google" ? "bg-[#C70000]" : ""}
                  size="sm"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Gmail
                </Button>
              </div>

              {/* Password Authentication */}
              {authMode === "password" && (
                <form onSubmit={handlePasswordAuth} className="space-y-4">
                  {activeTab === "register" && (
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
                        required={activeTab === "register"}
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

                  <Button
                    type="submit"
                    className="w-full bg-[#C70000] hover:bg-[#A50000] text-white"
                    disabled={loading || success !== ""}
                  >
                    {success !== ""
                      ? "Success! Redirecting..."
                      : loading
                      ? "Please wait..."
                      : activeTab === "login"
                      ? "Sign In"
                      : "Create Account"}
                  </Button>
                </form>
              )}

              {/* OTP Authentication */}
              {authMode === "otp" && (
                <div className="space-y-4">
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
                          OTP sent to {maskedPhone || formData.phone}
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
                            setFormData({ ...formData, otp: "" });
                            try { phoneAuth.reset(); } catch {}
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
                </div>
              )}

              {/* Google Authentication */}
              {authMode === "google" && (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <Mail className="h-8 w-8 text-[#C70000]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Quick Login with Gmail
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Sign in instantly with your Google account
                    </p>

                    <Button
                      type="button"
                      onClick={handleGoogleAuth}
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
                          Continue with Google
                        </div>
                      )}
                    </Button>

                    {!isFirebaseConfigured && (
                      <p className="text-xs text-gray-500 mt-2">
                        Google sign-in is disabled because Firebase is not configured.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Links */}
              <div className="mt-8 text-center space-y-2">
                <p className="text-xs text-gray-500">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
                <Link
                  to="/"
                  className="text-[#C70000] hover:text-[#A50000] text-sm flex items-center justify-center"
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

export default ComprehensiveAuth;
