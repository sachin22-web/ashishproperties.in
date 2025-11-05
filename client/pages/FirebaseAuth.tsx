import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  Home,
  UserCheck,
  Shield,
  Phone,
  Mail,
  Smartphone,
  Chrome,
  CheckCircle,
  Star,
} from "lucide-react";
import PhoneOTPAuth from "../components/auth/PhoneOTPAuth";
import GoogleAuth from "../components/auth/GoogleAuth";

const FirebaseAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, loading } = useFirebaseAuth();

  const [authMethod, setAuthMethod] = useState<"phone" | "google">("phone");
  const [userType, setUserType] = useState("buyer");

  // Get user type from URL or default to buyer
  useEffect(() => {
    const type = searchParams.get("type") || "buyer";
    setUserType(type);
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const dashboardRoutes = {
        seller: "/seller-dashboard",
        buyer: "/buyer-dashboard",
        agent: "/agent-dashboard",
        admin: "/admin",
      };

      const targetRoute =
        dashboardRoutes[user.userType as keyof typeof dashboardRoutes] || "/";
      navigate(targetRoute);
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleAuthSuccess = () => {
    // Navigation will be handled by the useEffect above
    console.log("Authentication successful, redirecting...");
  };

  const handleAuthError = (error: string) => {
    console.error("Authentication error:", error);
  };

  const getUserTypeInfo = (type: string) => {
    const types = {
      buyer: {
        title: "Property Buyer",
        description: "Find your dream home",
        icon: Home,
        color: "bg-blue-500",
        benefits: [
          "Browse properties",
          "Save favorites",
          "Contact sellers directly",
          "Get market insights",
        ],
      },
      seller: {
        title: "Property Seller",
        description: "List and sell properties",
        icon: UserCheck,
        color: "bg-green-500",
        benefits: [
          "List unlimited properties",
          "Manage inquiries",
          "Track performance",
          "Professional tools",
        ],
      },
      agent: {
        title: "Real Estate Agent",
        description: "Grow your business",
        icon: Shield,
        color: "bg-purple-500",
        benefits: [
          "Manage client portfolio",
          "Lead generation",
          "Commission tracking",
          "Professional profile",
        ],
      },
    };

    return types[type as keyof typeof types] || types.buyer;
  };

  const typeInfo = getUserTypeInfo(userType);
  const IconComponent = typeInfo.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-center mb-4">
            <div
              className={`w-16 h-16 ${typeInfo.color} rounded-full flex items-center justify-center mr-4`}
            >
              <IconComponent className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <Badge
                variant="secondary"
                className="mb-2 bg-white/20 text-white"
              >
                {typeInfo.title}
              </Badge>
              <h2 className="text-3xl font-bold">Welcome to Firebase Auth</h2>
              <p className="text-red-100">{typeInfo.description}</p>
            </div>
          </div>

          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Secure authentication powered by Google Firebase
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {typeInfo.benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
              >
                <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Authentication Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Authentication Method Selector */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-center mb-4 text-gray-900">
              Choose your preferred sign-in method
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={authMethod === "phone" ? "default" : "outline"}
                onClick={() => setAuthMethod("phone")}
                className={`${authMethod === "phone" ? "bg-[#C70000] text-white" : "text-gray-700"} flex items-center justify-center space-x-2 py-6`}
              >
                <Smartphone className="h-5 w-5" />
                <span>Phone OTP</span>
              </Button>

              <Button
                variant={authMethod === "google" ? "default" : "outline"}
                onClick={() => setAuthMethod("google")}
                className={`${authMethod === "google" ? "bg-[#C70000] text-white" : "text-gray-700"} flex items-center justify-center space-x-2 py-6`}
              >
                <Chrome className="h-5 w-5" />
                <span>Google</span>
              </Button>
            </div>
          </div>

          {/* Authentication Method Description */}
          <div className="mb-6 text-center">
            {authMethod === "phone" ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-blue-900 mb-1">
                  Phone Number Authentication
                </h4>
                <p className="text-sm text-blue-700">
                  Secure login using SMS OTP verification. Your phone number
                  will be verified via Firebase.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-green-900 mb-1">
                  Google Authentication
                </h4>
                <p className="text-sm text-green-700">
                  Quick and secure sign-in using your Google account. No
                  passwords to remember.
                </p>
              </div>
            )}
          </div>

          {/* Authentication Components */}
          <div className="space-y-6">
            {authMethod === "phone" && (
              <PhoneOTPAuth
                userType={userType}
                onSuccess={handleAuthSuccess}
                onError={handleAuthError}
              />
            )}

            {authMethod === "google" && (
              <GoogleAuth
                userType={userType}
                onSuccess={handleAuthSuccess}
                onError={handleAuthError}
                variant="card"
              />
            )}
          </div>

          {/* Alternative method suggestion */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm mb-4">
              Prefer a different method?
            </p>
            <Button
              variant="ghost"
              onClick={() =>
                setAuthMethod(authMethod === "phone" ? "google" : "phone")
              }
              className="text-[#C70000] hover:text-[#A50000] hover:bg-red-50"
            >
              {authMethod === "phone" ? (
                <>
                  <Chrome className="h-4 w-4 mr-2" />
                  Try Google Sign-In
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Try Phone OTP
                </>
              )}
            </Button>
          </div>

          {/* Security & Trust Indicators */}
          <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              Secure & Trusted
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                <span>Powered by Google Firebase</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                <span>Bank-level security encryption</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                <span>No passwords stored on our servers</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                <span>GDPR compliant data handling</span>
              </div>
            </div>
          </div>

          {/* User Type Selector */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Not a {typeInfo.title.toLowerCase()}?
            </p>
            <div className="flex justify-center space-x-2">
              {["buyer", "seller", "agent"].map((type) => (
                <Link
                  key={type}
                  to={`/firebase-auth?type=${type}`}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    type === userType
                      ? "bg-[#C70000] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {getUserTypeInfo(type).title}
                </Link>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{" "}
              <Link
                to="/terms-conditions"
                className="text-[#C70000] hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy-policy"
                className="text-[#C70000] hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
            <Link
              to="/"
              className="text-[#C70000] hover:text-[#A50000] text-sm flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseAuth;
