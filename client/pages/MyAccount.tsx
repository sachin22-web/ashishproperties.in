import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import { Button } from "../components/ui/button";
import { User, LogOut, Settings, Heart, Home } from "lucide-react";

export default function MyAccount() {
  const { user, isAuthenticated, logout, loading } = useAuth();

  useEffect(() => {
    // Wait for loading to complete before checking authentication
    if (loading) return;

    // Only redirect if not authenticated, don't auto-redirect authenticated users
    if (!isAuthenticated) {
      window.location.href = "/auth";
      return;
    }
  }, [isAuthenticated, loading]);

  // Show loading while auth context is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="w-16 h-16 bg-[#C70000] rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">My Account</h1>
              <p className="text-gray-600 mb-6">
                Please sign in to access your account and dashboard
              </p>
              <Button
                onClick={() => (window.location.href = "/auth")}
                className="w-full bg-[#C70000] hover:bg-[#A50000] text-white mb-4"
              >
                Sign In / Sign Up
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // If authenticated, show account page
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-[#C70000] to-[#A50000] p-6 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user?.name}</h1>
                  <p className="text-red-100">{user?.email}</p>
                  <p className="text-red-100 capitalize">{user?.userType}</p>
                </div>
              </div>
            </div>

            {/* Account Options */}
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Options</h2>

              {/* Dashboard Link */}
              <Button
                onClick={() => {
                  const dashboardRoutes = {
                    admin: "/admin",
                    seller: "/seller-dashboard",
                    buyer: "/buyer-dashboard",
                    agent: "/agent-dashboard"
                  };
                  const targetRoute = dashboardRoutes[user?.userType as keyof typeof dashboardRoutes];
                  if (targetRoute) {
                    window.location.href = targetRoute;
                  }
                }}
                className="w-full justify-start bg-[#C70000] hover:bg-[#A50000] text-white"
              >
                <Settings className="h-5 w-5 mr-3" />
                Go to My Dashboard
              </Button>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Button
                  onClick={() => window.location.href = "/post-property"}
                  variant="outline"
                  className="justify-start h-12"
                >
                  <Home className="h-5 w-5 mr-3" />
                  Post Property
                </Button>

                <Button
                  onClick={() => window.location.href = "/chat"}
                  variant="outline"
                  className="justify-start h-12"
                >
                  <Heart className="h-5 w-5 mr-3" />
                  My Messages
                </Button>

                <Button
                  onClick={() => window.location.href = "/properties?owner=" + user?.id}
                  variant="outline"
                  className="justify-start h-12"
                >
                  <Heart className="h-5 w-5 mr-3" />
                  My Properties
                </Button>

                <Button
                  onClick={() => window.location.href = "/"}
                  variant="outline"
                  className="justify-start h-12"
                >
                  <Home className="h-5 w-5 mr-3" />
                  Browse Properties
                </Button>
              </div>

              {/* Account Info */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Account Information</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Phone:</strong> {user?.phone}</p>
                  <p><strong>Account Type:</strong> {user?.userType?.toUpperCase()}</p>
                  <p><strong>Member Since:</strong> Recent</p>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                onClick={() => {
                  logout();
                  window.location.href = "/";
                }}
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 mt-6"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
