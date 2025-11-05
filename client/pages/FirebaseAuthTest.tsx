import { useState } from "react";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  User,
  Phone,
  Mail,
  Clock,
  Shield,
  LogOut,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Chrome,
} from "lucide-react";
import { AuthErrorBoundary } from "../components/auth/AuthErrorHandler";
import PhoneOTPAuth from "../components/auth/PhoneOTPAuth";
import GoogleAuth from "../components/auth/GoogleAuth";

const FirebaseAuthTest = () => {
  const { user, firebaseUser, isAuthenticated, loading, logout } =
    useFirebaseAuth();
  const [testMode, setTestMode] = useState<"phone" | "google" | "info">("info");

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication state...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Firebase Authentication Test
            </h1>
            <p className="text-gray-600">
              Test and verify Firebase Phone OTP and Google authentication
            </p>
          </div>

          {/* Authentication Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      isAuthenticated ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {isAuthenticated ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <Badge variant={isAuthenticated ? "default" : "destructive"}>
                    {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                  </Badge>
                </div>

                <div className="text-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      user ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <Badge variant={user ? "default" : "secondary"}>
                    {user ? "User Profile" : "No Profile"}
                  </Badge>
                </div>

                <div className="text-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      firebaseUser ? "bg-orange-100" : "bg-gray-100"
                    }`}
                  >
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                  <Badge variant={firebaseUser ? "default" : "secondary"}>
                    {firebaseUser ? "Firebase User" : "No Firebase"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          {isAuthenticated && user && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    User Information
                  </span>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <p className="text-gray-900">{user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      User Type
                    </label>
                    <Badge className="ml-2">{user.userType}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="text-gray-900">
                      {user.email || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <p className="text-gray-900">
                      {user.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Firebase UID
                    </label>
                    <p className="text-gray-900 font-mono text-sm">
                      {user.firebaseUid || "Not linked"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Last Login
                    </label>
                    <p className="text-gray-900">
                      {formatDate(user.lastLogin)}
                    </p>
                  </div>
                </div>

                {firebaseUser && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Firebase User Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Firebase UID
                        </label>
                        <p className="text-gray-900 font-mono">
                          {firebaseUser.uid}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Provider ID
                        </label>
                        <p className="text-gray-900">
                          {firebaseUser.providerId}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Email Verified
                        </label>
                        <Badge
                          variant={
                            firebaseUser.emailVerified ? "default" : "secondary"
                          }
                        >
                          {firebaseUser.emailVerified
                            ? "Verified"
                            : "Not Verified"}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Creation Time
                        </label>
                        <p className="text-gray-900">
                          {formatDate(firebaseUser.metadata.creationTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Test Authentication Methods */}
          {!isAuthenticated && (
            <div className="space-y-6">
              {/* Method Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Authentication Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={testMode === "phone" ? "default" : "outline"}
                      onClick={() => setTestMode("phone")}
                      className={testMode === "phone" ? "bg-[#C70000]" : ""}
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Phone OTP
                    </Button>
                    <Button
                      variant={testMode === "google" ? "default" : "outline"}
                      onClick={() => setTestMode("google")}
                      className={testMode === "google" ? "bg-[#C70000]" : ""}
                    >
                      <Chrome className="h-4 w-4 mr-2" />
                      Google Auth
                    </Button>
                    <Button
                      variant={testMode === "info" ? "default" : "outline"}
                      onClick={() => setTestMode("info")}
                      className={testMode === "info" ? "bg-[#C70000]" : ""}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Info
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Test Content */}
              {testMode === "phone" && (
                <PhoneOTPAuth
                  userType="buyer"
                  onSuccess={() => console.log("Phone auth successful")}
                  onError={(error) => console.error("Phone auth error:", error)}
                />
              )}

              {testMode === "google" && (
                <GoogleAuth
                  userType="buyer"
                  onSuccess={() => console.log("Google auth successful")}
                  onError={(error) =>
                    console.error("Google auth error:", error)
                  }
                  variant="card"
                />
              )}

              {testMode === "info" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Authentication Test Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Phone OTP Testing
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>
                          • Enter a valid Indian mobile number (10 digits)
                        </li>
                        <li>• Complete the reCAPTCHA verification</li>
                        <li>
                          • Firebase will send a real SMS OTP to your phone
                        </li>
                        <li>
                          • Enter the 6-digit code to complete authentication
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Google Authentication Testing
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Click the Google sign-in button</li>
                        <li>• A popup will open for Google authentication</li>
                        <li>• Sign in with your Google account</li>
                        <li>
                          • The popup will close and you'll be authenticated
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Expected Behavior
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• User profile will be created in Firestore</li>
                        <li>
                          • Authentication state will persist across page
                          reloads
                        </li>
                        <li>
                          • User will be redirected to appropriate dashboard
                        </li>
                        <li>• Error handling will show helpful messages</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Debug Information */}
          {process.env.NODE_ENV === "development" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(
                    {
                      isAuthenticated,
                      user: user
                        ? {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            userType: user.userType,
                            firebaseUid: user.firebaseUid,
                          }
                        : null,
                      firebaseUser: firebaseUser
                        ? {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            phoneNumber: firebaseUser.phoneNumber,
                            displayName: firebaseUser.displayName,
                            emailVerified: firebaseUser.emailVerified,
                          }
                        : null,
                      loading,
                    },
                    null,
                    2,
                  )}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthErrorBoundary>
  );
};

export default FirebaseAuthTest;
