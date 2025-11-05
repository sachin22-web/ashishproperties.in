import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { createApiUrl } from "../lib/api";
import AdminLayout from "../components/AdminLayout";
import {
  BarChart3,
  Users,
  Package,
  CreditCard,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Check,
  X,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import PackageManagement from "../components/admin/PackageManagement";
import TestimonialManagement from "../components/admin/TestimonialManagement";
import FAQManagement from "../components/admin/FAQManagement";
import UserManagement from "../components/admin/UserManagement";
import AllUsersManagement from "../components/AllUsersManagement";
import PropertyManagement from "../components/admin/PropertyManagement";
import CompletePropertyManagement from "../components/admin/CompletePropertyManagement";
import DeletedPropertiesManagement from "../components/admin/DeletedPropertiesManagement";
import CustomFieldsManagement from "../components/admin/CustomFieldsManagement";
import CategoryManagement from "../components/admin/CategoryManagement";
import EnhancedCategoryManagement from "../components/admin/EnhancedCategoryManagement";
import CompleteCategoryManagement from "../components/admin/CompleteCategoryManagement";
import SellerVerificationManagement from "../components/admin/SellerVerificationManagement";
import ReportsManagement from "../components/admin/ReportsManagement";
import AdminSettings from "../components/admin/AdminSettings";
import AdminTestingDashboard from "../components/admin/AdminTestingDashboard";
import TestSellerNotification from "../components/admin/TestSellerNotification";
import UserAnalytics from "../components/admin/UserAnalytics";
import NotificationManagement from "../components/admin/NotificationManagement";
import SystemUpdate from "../components/admin/SystemUpdate";
import AdvertisementListingPackage from "../components/admin/AdvertisementListingPackage";
import FeatureAdvertisementPackage from "../components/admin/FeatureAdvertisementPackage";
import ContentManagement from "../components/admin/ContentManagement";
import DatabaseDiagnostics from "../components/admin/DatabaseDiagnostics";
import QuickCreatePage from "../components/admin/QuickCreatePage";
import FooterManagement from "../components/admin/FooterManagement";
import HomepageSliderManagement from "../components/admin/HomepageSliderManagement";
import StaffManagement from "../components/admin/StaffManagement";
import AdminBanners from "../components/AdminBanners";
import NewProjectsManagement from "../components/admin/NewProjectsManagement";
import MapsManagement from "../components/admin/MapsManagement";

import PropertyImageManager from "../components/admin/PropertyImageManager";
import PaymentTransactions from "../components/admin/PaymentTransactions";
import BankTransferManagement from "../components/admin/BankTransferManagement";
import ManualPaymentApproval from "../components/admin/ManualPaymentApproval";
import PremiumListingApprovals from "../components/admin/PremiumListingApprovals";
import AuthDebug from "../components/AuthDebug";
import SystemStatus from "../components/admin/SystemStatus";
import SellerVerificationFields from "../components/admin/SellerVerificationFields";
import PendingPropertiesApproval from "../components/admin/PendingPropertiesApproval";
import OtherServicesManagement from "../components/admin/OtherServicesManagement";
import SupportInbox from "../components/admin/SupportInbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export default function Admin() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  // Check if we're on the support route and set initial section accordingly
  const initialSection =
    window.location.pathname === "/admin/support"
      ? "support-inbox"
      : "dashboard";
  const [activeSection, setActiveSection] = useState(initialSection);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalProperties: 0,
    activeProperties: 0,
    usersByType: [],
  });
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [skipDataLoading, setSkipDataLoading] = useState(false);
  const [forceOfflineMode, setForceOfflineMode] = useState(false);
  const [networkDiagnostics, setNetworkDiagnostics] = useState<string[]>([]);

  const runNetworkDiagnostics = async () => {
    const diagnostics: string[] = [];

    try {
      // Check current environment
      const environment = window.location.hostname.includes(".fly.dev")
        ? "fly.dev"
        : window.location.hostname.includes(".netlify.app")
          ? "netlify"
          : window.location.hostname === "localhost"
            ? "localhost"
            : "unknown";

      diagnostics.push(`Environment: ${environment}`);
      diagnostics.push(`URL: ${window.location.href}`);

      // Check if we can reach the base domain
      try {
        const healthCheck = await fetch(window.location.origin + "/api/ping", {
          method: "GET",
          cache: "no-cache",
          timeout: 5000,
        });
        diagnostics.push(
          `Health check: ${healthCheck.status} ${healthCheck.statusText}`,
        );
      } catch (healthError) {
        diagnostics.push(`Health check failed: ${healthError.message}`);
      }

      // Check browser capabilities
      diagnostics.push(
        `Fetch API: ${typeof fetch !== "undefined" ? "Available" : "Not available"}`,
      );
      diagnostics.push(
        `Online status: ${navigator.onLine ? "Online" : "Offline"}`,
      );
    } catch (error) {
      diagnostics.push(`Diagnostics error: ${error.message}`);
    }

    setNetworkDiagnostics(diagnostics);
    return diagnostics;
  };

  const loadMockData = () => {
    setStats({
      totalUsers: 150,
      totalProperties: 85,
      activeProperties: 72,
      usersByType: [
        { _id: "buyer", count: 80 },
        { _id: "seller", count: 45 },
        { _id: "agent", count: 20 },
        { _id: "admin", count: 5 },
      ],
    });

    setUsers([
      {
        _id: "1",
        name: "John Doe",
        email: "john@example.com",
        userType: "buyer",
        status: "active",
      },
      {
        _id: "2",
        name: "Jane Smith",
        email: "jane@example.com",
        userType: "seller",
        status: "active",
      },
      {
        _id: "3",
        name: "Mike Johnson",
        email: "mike@example.com",
        userType: "agent",
        status: "active",
      },
    ]);

    setProperties([
      {
        _id: "1",
        title: "Modern Apartment",
        location: { city: "Mumbai" },
        price: 5000000,
        status: "active",
      },
      {
        _id: "2",
        title: "Villa in Suburbs",
        location: { city: "Delhi" },
        price: 8000000,
        status: "active",
      },
      {
        _id: "3",
        title: "Commercial Space",
        location: { city: "Bangalore" },
        price: 12000000,
        status: "pending",
      },
    ]);

    setLoading(false);
    setOfflineMode(true);
    setApiErrors([]);
  };

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to admin login");
      window.location.href = "/admin/login";
      return;
    }

    // Check if user is admin
    if (user?.userType !== "admin") {
      console.log(
        "User is not admin:",
        user?.userType,
        "redirecting to admin login",
      );
      window.location.href = "/admin/login";
      return;
    }

    console.log("Admin user authenticated, checking data loading mode");

    // Check if force offline mode is enabled
    if (forceOfflineMode) {
      console.log("Force offline mode enabled, loading mock data");
      loadMockData();
      return;
    }

    // Enhanced connectivity test with better error handling
    const testConnectivity = async () => {
      try {
        console.log("🔍 Starting connectivity test...");
        console.log("📍 Current environment:", window.location.href);

        // Log API configuration for debugging
        const testUrl = createApiUrl("ping");
        console.log("🎯 Testing API endpoint:", testUrl);

        // Try a simple fetch to public health endpoint with a reasonable timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("⏰ Request timeout after 10 seconds");
          controller.abort();
        }, 10000);

        const response = await fetch(testUrl, {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          signal: controller.signal,
          cache: "no-cache",
          credentials: "include",
        });

        clearTimeout(timeoutId);

        console.log("📡 Response received:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // If we get here, connectivity is working
        console.log("✅ Connectivity test passed (ping)");
        if (!skipDataLoading) {
          if (token) {
            await fetchAdminData();
          } else {
            console.log(
              "No token present; loading mock admin data (safe mode)",
            );
            loadMockData();
          }
        } else {
          setLoading(false);
          setOfflineMode(true);
        }
      } catch (error: any) {
        const detail = {
          message: error?.message || String(error),
          name: error?.name,
          stack:
            typeof error?.stack === "string"
              ? error.stack.split("\n")[0]
              : undefined,
          url: createApiUrl("admin/stats"),
          type: typeof error,
        };
        console.error("⚠️ Connectivity test failed: " + JSON.stringify(detail));

        // Determine the type of error and respond accordingly
        if (error.name === "AbortError") {
          console.log("🔄 Request timed out, enabling offline mode");
        } else if (error.message?.includes("Failed to fetch")) {
          console.log("🌐 Network connectivity issue detected");
        } else {
          console.log("❌ Unknown connectivity error");
        }

        console.log("🔄 Enabling graceful offline mode with retry capability");
        setOfflineMode(true);

        // Run network diagnostics
        await runNetworkDiagnostics();

        // For any fetch failures, immediately switch to mock data in production
        if (
          error.message?.includes("Failed to fetch") ||
          error.name === "TypeError"
        ) {
          console.log(
            "🏭 Network error detected, switching to mock data immediately",
          );
          loadMockData();
          return;
        }

        // For production environments, go straight to mock data on network errors
        if (
          window.location.hostname.includes(".fly.dev") ||
          window.location.hostname.includes(".netlify.app") ||
          window.location.hostname !== "localhost"
        ) {
          console.log("🏭 Production environment detected, using mock data");
          loadMockData();
        } else {
          // Try to load real data anyway for development
          if (!skipDataLoading) {
            try {
              await fetchAdminData();
            } catch (dataError) {
              console.log("📡 Data fetch also failed, using mock data");
              loadMockData();
            }
          } else {
            setLoading(false);
          }
        }
      }
    };

    testConnectivity();
  }, [
    isAuthenticated,
    user,
    token,
    authLoading,
    forceOfflineMode,
    skipDataLoading,
  ]);

  const fetchAdminData = async () => {
    if (!token) {
      console.log("No token available - switching to safe offline mode");
      loadMockData();
      return;
    }

    setLoading(true);
    setError("");
    setApiErrors([]);
    const errors: string[] = [];

    console.log(
      "Fetching admin data with token:",
      token.substring(0, 20) + "...",
    );

    // Fetch stats with enhanced error handling
    try {
      console.log("Fetching admin stats...");
      const statsUrl = createApiUrl("admin/stats");
      console.log("📊 Stats URL:", statsUrl);

      const statsResponse = await fetch(statsUrl, {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache",
        credentials: "include",
      });

      console.log("📊 Stats response:", {
        status: statsResponse.status,
        statusText: statsResponse.statusText,
        ok: statsResponse.ok,
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log("Stats data received:", statsData);
        if (statsData.success) {
          setStats(statsData.data);
        } else {
          console.error("Stats fetch failed:", statsData.error);
          errors.push("Stats API failed");
        }
      } else if (statsResponse.status === 401 || statsResponse.status === 403) {
        console.warn("Stats unauthorized; switching to safe mode");
        loadMockData();
        return;
      } else if (statsResponse.status === 503) {
        console.log("Database still connecting, will retry...");
        errors.push("Database connecting");
      } else {
        console.error(
          "Stats response not ok:",
          statsResponse.status,
          statsResponse.statusText,
        );
        errors.push(`Stats API error: ${statsResponse.status}`);
      }
    } catch (error) {
      console.error("Error fetching stats:", {
        error: error.message || error,
        name: error.name,
        stack: error.stack,
      });

      if (
        error.name === "TypeError" &&
        error.message?.includes("Failed to fetch")
      ) {
        errors.push("Network connectivity issue");
      } else {
        errors.push("Stats API unreachable");
      }
    }

    // Fetch users with individual error handling
    try {
      console.log("Fetching admin users...");
      const usersResponse = await fetch(createApiUrl("admin/users?limit=10"), {
        credentials: "include",
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log("Users data received:", usersData);
        if (usersData.success) {
          setUsers(usersData.data.users);
        } else {
          console.error("Users fetch failed:", usersData.error);
          errors.push("Users API failed");
        }
      } else if (usersResponse.status === 401 || usersResponse.status === 403) {
        console.warn("Users unauthorized; switching to safe mode");
        loadMockData();
        return;
      } else if (usersResponse.status === 503) {
        console.log("Database still connecting for users API, will retry...");
        errors.push("Database connecting");
      } else {
        console.error(
          "Users response not ok:",
          usersResponse.status,
          usersResponse.statusText,
        );
        errors.push(`Users API error: ${usersResponse.status}`);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      errors.push("Users API unreachable");
    }

    // Fetch properties with individual error handling
    try {
      console.log("Fetching admin properties...");
      const propertiesResponse = await fetch(
        createApiUrl("admin/properties?limit=10"),
        {
          credentials: "include",
        },
      );

      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        console.log("Properties data received:", propertiesData);
        if (propertiesData.success) {
          setProperties(propertiesData.data.properties);
        } else {
          console.error("Properties fetch failed:", propertiesData.error);
          errors.push("Properties API failed");
        }
      } else if (
        propertiesResponse.status === 401 ||
        propertiesResponse.status === 403
      ) {
        console.warn("Properties unauthorized; switching to safe mode");
        loadMockData();
        return;
      } else {
        console.error(
          "Properties response not ok:",
          propertiesResponse.status,
          propertiesResponse.statusText,
        );
        errors.push(`Properties API error: ${propertiesResponse.status}`);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      errors.push("Properties API unreachable");
    }

    setApiErrors(errors);

    // Check if errors are database connection related
    const hasDbConnectionErrors = errors.some((error) =>
      error.includes("Database connecting"),
    );

    if (hasDbConnectionErrors) {
      console.log("Database still connecting, retrying in 3 seconds...");
      setTimeout(() => {
        if (!loading) {
          // Only retry if not already loading
          console.log("Retrying admin data fetch...");
          fetchAdminData();
        }
      }, 3000);
      setLoading(false);
      return;
    }

    // Auto-enable force offline mode if all APIs are failing
    if (errors.length >= 3) {
      console.log("All APIs failing, auto-enabling force offline mode");
      setForceOfflineMode(true);
      loadMockData();
      return;
    }

    // Enable offline mode if most APIs are failing
    if (errors.length >= 2) {
      setOfflineMode(true);
      console.log("Enabling offline mode due to API failures");
    }

    setLoading(false);
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, enter Safe Mode (no token)
  if (!isAuthenticated || user?.userType !== "admin") {
    if (!offlineMode && loading) {
      loadMockData();
    }
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                forceOfflineMode
                  ? "bg-blue-500"
                  : offlineMode || apiErrors.length > 0
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              {forceOfflineMode
                ? "Force Offline (Mock Data)"
                : offlineMode
                  ? "Offline Mode"
                  : apiErrors.length > 0
                    ? "Limited Connectivity"
                    : "Online"}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {offlineMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOfflineMode(false);
                setApiErrors([]);
                fetchAdminData();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reconnect
            </Button>
          )}
          {!offlineMode && apiErrors.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOfflineMode(true)}
            >
              Offline Mode
            </Button>
          )}
          {apiErrors.length > 0 && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setForceOfflineMode(true);
                  loadMockData();
                }}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                Force Offline Mode
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSkipDataLoading(true);
                  setOfflineMode(true);
                  setApiErrors([]);
                  setLoading(false);
                }}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                Skip Data Loading
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError("");
              fetchAdminData();
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}
      {apiErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <p className="text-yellow-700 font-medium">
              Some services are unavailable
            </p>
          </div>
          <ul className="text-sm text-yellow-600 ml-7">
            {apiErrors.map((err, index) => (
              <li key={index}>• {err}</li>
            ))}
          </ul>
          {networkDiagnostics.length > 0 && (
            <details className="mt-3">
              <summary className="text-sm text-yellow-700 cursor-pointer hover:text-yellow-800">
                Show Network Diagnostics
              </summary>
              <ul className="text-xs text-yellow-600 ml-4 mt-2">
                {networkDiagnostics.map((diagnostic, index) => (
                  <li key={index}>• {diagnostic}</li>
                ))}
              </ul>
            </details>
          )}
          <div className="flex space-x-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setApiErrors([]);
                fetchAdminData();
              }}
            >
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const diagnostics = await runNetworkDiagnostics();
                console.log("Network diagnostics:", diagnostics);
              }}
            >
              Run Diagnostics
            </Button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          <div className="mt-6">
            <Button
              onClick={() => {
                setForceOfflineMode(true);
                loadMockData();
              }}
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              Load Dashboard Now (Mock Data)
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Use this if loading takes too long
            </p>
          </div>
        </div>
      ) : offlineMode || apiErrors.length > 2 ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Dashboard - Safe Mode
          </h2>
          <p className="text-gray-600 mb-6">
            Some services are temporarily unavailable. You can still access
            admin functions using the sidebar menu.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Button
              onClick={() => setActiveSection("users")}
              className="bg-[#C70000] hover:bg-[#A60000] p-6 h-auto flex flex-col"
            >
              <Users className="h-8 w-8 mb-2" />
              <span>Manage Users</span>
            </Button>
            <Button
              onClick={() => setActiveSection("properties")}
              className="bg-[#C70000] hover:bg-[#A60000] p-6 h-auto flex flex-col"
            >
              <Package className="h-8 w-8 mb-2" />
              <span>Manage Properties</span>
            </Button>
            <Button
              onClick={() => setActiveSection("content-management")}
              className="bg-[#C70000] hover:bg-[#A60000] p-6 h-auto flex flex-col"
            >
              <Edit className="h-8 w-8 mb-2" />
              <span>Manage Content</span>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Listings
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.activeProperties || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active properties
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Properties
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalProperties || 0}
                </div>
                <p className="text-xs text-muted-foreground">All properties</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  User Types
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.usersByType?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Different user types
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.slice(0, 5).map((user, i) => (
                <div key={user._id} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-[#C70000] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">
                      {user.email} • {user.userType}
                    </p>
                  </div>
                  <Badge
                    variant={user.status === "active" ? "default" : "outline"}
                    className={
                      user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : ""
                    }
                  >
                    {user.status || "New"}
                  </Badge>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-gray-500 text-sm">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Create New Page</p>
                  <p className="text-xs text-gray-500">
                    Add About Us, Privacy Policy, etc.
                  </p>
                </div>
                <QuickCreatePage />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-sm font-medium">Seed System Data</p>
                  <p className="text-xs text-gray-500">
                    Initialize default admin, categories and packages in the DB
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={async () => {
                      setLoading(true);
                      setError("");
                      try {
                        const resp = await fetch("/api/fix/initialize-system", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                        });
                        const json = await resp.json();
                        if (json.success) {
                          // use simple alert/toast
                          window.alert(
                            "Initialization completed: " +
                              (json.message || "success"),
                          );
                        } else {
                          window.alert(
                            "Initialization returned errors: " +
                              JSON.stringify(json.data || json.error || json),
                          );
                        }
                      } catch (err: any) {
                        console.error("Initialization failed:", err);
                        window.alert(
                          "Initialization failed: " + (err?.message || err),
                        );
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="bg-[#C70000] hover:bg-[#A60000]"
                  >
                    Initialize System
                  </Button>

                  <Button
                    onClick={() => {
                      // provide admin quick link to categories management
                      setActiveSection("categories");
                    }}
                    variant="outline"
                  >
                    Manage Categories
                  </Button>
                </div>
              </div>
              {[
                { type: "Seller Verification", count: 12 },
                { type: "Advertisement Request", count: 5 },
                { type: "User Reports", count: 3 },
                { type: "Bank Transfers", count: 8 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.type}</p>
                  <Badge variant="destructive">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAdsListing = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Advertisement Listings</h3>
        <Button className="bg-[#C70000] hover:bg-[#A60000]">
          <Plus className="h-4 w-4 mr-2" />
          Add Advertisement
        </Button>
      </div>

      <div className="flex space-x-4">
        <Input placeholder="Search advertisements..." className="max-w-sm" />
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.slice(0, 10).map((property) => (
            <TableRow key={property._id}>
              <TableCell className="font-medium">{property.title}</TableCell>
              <TableCell className="capitalize">
                {property.propertyType}
              </TableCell>
              <TableCell>{property.contactInfo?.name || "Unknown"}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    property.status === "active"
                      ? "bg-green-100 text-green-800"
                      : property.status === "sold"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                  }
                >
                  {property.status}
                </Badge>
              </TableCell>
              <TableCell>₹{(property.price / 100000).toFixed(1)}L</TableCell>
              <TableCell>
                {new Date(property.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {properties.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500">
                No properties found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderContent = () => {
    try {
      switch (activeSection) {
        case "dashboard":
          return renderDashboard();
        case "all-users":
          return <AllUsersManagement />;
        case "user-analytics":
          return <UserAnalytics />;
        case "ads-listing":
          return <CompletePropertyManagement />;
        case "deleted-ads":
          return <DeletedPropertiesManagement />;
        case "seller-verification":
          return <SellerVerificationManagement />;
        case "user-reports":
          return <ReportsManagement />;
        case "categories":
          return <EnhancedCategoryManagement />;
        case "custom-fields":
          return <CustomFieldsManagement />;
        case "ad-management":
          return <PropertyImageManager />;
        case "ad-requested":
          return <PendingPropertiesApproval />;
        case "pending-approval":
          return <PendingPropertiesApproval />;
        case "premium-approvals":
          return <PremiumListingApprovals />;
        case "ad-tips":
          return <FAQManagement />;
        case "package-management":
          return <PackageManagement />;
        case "listing-package":
          return <AdvertisementListingPackage />;
        case "feature-package":
          return <FeatureAdvertisementPackage />;
        case "transactions":
          return <PaymentTransactions />;
        case "manual-payment-approval":
          return <ManualPaymentApproval />;
        case "bank-transfer":
          return <BankTransferManagement />;
        case "seller-management":
          return <UserManagement />;
        case "verification-fields":
          return <SellerVerificationFields />;
        case "seller-review":
          return <TestimonialManagement />;
        case "seller-review-report":
          return <TestimonialManagement />;
        case "slider":
          return <HomepageSliderManagement />;
        case "new-projects":
          return <NewProjectsManagement />;
        case "maps":
          return <MapsManagement />;
        case "banners":
          return <AdminBanners token={token} />;
        case "feature-section":
          return <PropertyManagement />;
        case "countries":
          return (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Countries</h3>
              <p className="text-sm text-gray-600 mb-4">
                This section moved to dedicated page.
              </p>
              <a
                className="text-[#C70000] underline"
                href="/admin/locations/countries"
              >
                Go to Countries
              </a>
            </div>
          );
        case "states":
          return <CategoryManagement />;
        case "cities":
          return <CategoryManagement />;
        case "areas":
          return <CategoryManagement />;
        case "report-reasons":
          return <ReportsManagement />;
        case "send-notification":
          return <NotificationManagement />;
        case "customers":
          return <AllUsersManagement />;
        case "role":
          return <StaffManagement />;
        case "staff-management":
          return <StaffManagement />;
        case "blog-management":
          return <FAQManagement />;
        case "blogs":
          return <FAQManagement />;
        case "faq":
          return <FAQManagement />;
        case "faqs":
          return <FAQManagement />;
        case "web-queries":
          return <TestimonialManagement />;
        case "settings":
          return <AdminSettings />;
        case "testing":
          return <AdminTestingDashboard />;
        case "test-seller-notifications":
          return <TestSellerNotification />;
        case "system-update":
          return <SystemUpdate />;
        case "auth-debug":
          return <AuthDebug />;
        case "system-status":
          return <SystemStatus />;
        case "content-management":
          return <ContentManagement />;
        case "pages":
          return <ContentManagement />;
        case "static-pages":
          return <ContentManagement />;
        case "footer-management":
          return <FooterManagement />;
        case "database-diagnostics":
          return <DatabaseDiagnostics />;
        case "db-test":
          return <DatabaseDiagnostics />;
        case "other-services":
          return <OtherServicesManagement />;
        case "service-categories":
          return <OtherServicesManagement activeTab="categories" />;
        case "service-subcategories":
          return <OtherServicesManagement activeTab="subcategories" />;
        case "service-listings":
          return <OtherServicesManagement activeTab="listings" />;
        case "bulk-import":
          return <OtherServicesManagement activeTab="bulk-import" />;
        case "support-inbox":
          return <SupportInbox />;
        default:
          return renderDashboard();
      }
    } catch (error) {
      console.error("Error rendering admin section:", error);
      return (
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">
            There was an error loading this admin section.
          </p>
          <Button
            onClick={() => setActiveSection("dashboard")}
            className="bg-[#C70000] hover:bg-[#A60000]"
          >
            Go to Dashboard
          </Button>
        </div>
      );
    }
  };

  try {
    return (
      <AdminLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      >
        {renderContent()}
      </AdminLayout>
    );
  } catch (error) {
    console.error("Error rendering admin page:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Error Loading Admin Panel
          </h2>
          <p className="text-gray-600 mb-4">
            An error occurred while loading the admin panel.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#C70000] hover:bg-[#A60000] text-white"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }
}
