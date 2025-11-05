import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Users,
  Home,
  Package,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  MessageSquare,
  Shield,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface DashboardStats {
  users: {
    total: number;
    active: number;
    sellers: number;
    buyers: number;
    newThisMonth: number;
  };
  properties: {
    total: number;
    active: number;
    pending: number;
    sold: number;
    featured: number;
  };
  packages: {
    total: number;
    activeSubscriptions: number;
    revenue: number;
    pendingPayments: number;
  };
  verifications: {
    pendingSellerVerifications: number;
    pendingBankTransfers: number;
    pendingReports: number;
  };
}

export default function AdminDashboardSummary() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    users: { total: 0, active: 0, sellers: 0, buyers: 0, newThisMonth: 0 },
    properties: { total: 0, active: 0, pending: 0, sold: 0, featured: 0 },
    packages: { total: 0, activeSubscriptions: 0, revenue: 0, pendingPayments: 0 },
    verifications: { pendingSellerVerifications: 0, pendingBankTransfers: 0, pendingReports: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchDashboardStats();
  }, [token]);

  const fetchDashboardStats = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      // Mock comprehensive dashboard stats
      const mockStats: DashboardStats = {
        users: {
          total: 1247,
          active: 1089,
          sellers: 342,
          buyers: 905,
          newThisMonth: 68,
        },
        properties: {
          total: 856,
          active: 723,
          pending: 45,
          sold: 88,
          featured: 156,
        },
        packages: {
          total: 8,
          activeSubscriptions: 423,
          revenue: 275400,
          pendingPayments: 12,
        },
        verifications: {
          pendingSellerVerifications: 23,
          pendingBankTransfers: 8,
          pendingReports: 5,
        },
      };

      setStats(mockStats);

    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setError("Failed to fetch dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setError("");
            fetchDashboardStats();
          }}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#C70000] to-red-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to Admin Dashboard</h2>
        <p className="text-red-100">Manage your property platform efficiently</p>
      </div>

      {/* User Statistics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          User Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All registered users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.users.active.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Active accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sellers</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.users.sellers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Seller accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Buyers</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.users.buyers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Buyer accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.users.newThisMonth}</div>
              <p className="text-xs text-muted-foreground">New registrations</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Property Statistics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Home className="h-5 w-5 mr-2" />
          Property Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.properties.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All listings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.properties.active.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Live properties</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.properties.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sold Properties</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.properties.sold}</div>
              <p className="text-xs text-muted-foreground">Successful sales</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured Listings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.properties.featured}</div>
              <p className="text-xs text-muted-foreground">Premium listings</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue & Packages */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Revenue & Packages
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{stats.packages.revenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.packages.total}</div>
              <p className="text-xs text-muted-foreground">Available packages</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.packages.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Current subscribers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.packages.pendingPayments}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Pending Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seller Verifications</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.verifications.pendingSellerVerifications}
              </div>
              <p className="text-xs text-muted-foreground mb-2">Awaiting verification</p>
              <Button size="sm" variant="outline" className="w-full">
                Review Now
              </Button>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bank Transfers</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.verifications.pendingBankTransfers}
              </div>
              <p className="text-xs text-muted-foreground mb-2">Pending verification</p>
              <Button size="sm" variant="outline" className="w-full">
                Verify Now
              </Button>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Reports</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.verifications.pendingReports}
              </div>
              <p className="text-xs text-muted-foreground mb-2">Need attention</p>
              <Button size="sm" variant="outline" className="w-full">
                Review Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button className="h-20 flex flex-col space-y-2 bg-[#C70000] hover:bg-[#A60000]">
            <Users className="h-6 w-6" />
            <span className="text-sm">Manage Users</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col space-y-2">
            <Home className="h-6 w-6" />
            <span className="text-sm">View Properties</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col space-y-2">
            <Package className="h-6 w-6" />
            <span className="text-sm">Manage Packages</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col space-y-2">
            <BarChart3 className="h-6 w-6" />
            <span className="text-sm">View Analytics</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
