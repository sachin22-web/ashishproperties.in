import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  Crown,
  Edit,
  UserCheck,
  Settings,
  LogOut,
  Bell,
  Calendar,
  Activity,
  Users,
  FileText,
  BarChart3,
  MessageSquare,
  Package,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface StaffStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  todaysActivity: number;
}

export default function StaffDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StaffStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    todaysActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/staff/login");
      return;
    }

    if (user?.userType !== "staff" && user?.role !== "admin") {
      navigate("/staff/login");
      return;
    }

    fetchStaffStats();
  }, [isAuthenticated, user, navigate]);

  const fetchStaffStats = async () => {
    try {
      setLoading(true);
      // Mock stats for now - replace with actual API call
      setStats({
        totalTasks: 25,
        completedTasks: 18,
        pendingTasks: 7,
        todaysActivity: 12,
      });
    } catch (error) {
      console.error("Error fetching staff stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return Crown;
      case "content_manager":
        return Edit;
      case "sales_manager":
        return UserCheck;
      case "support_executive":
        return User;
      default:
        return Shield;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800";
      case "content_manager":
        return "bg-blue-100 text-blue-800";
      case "sales_manager":
        return "bg-green-100 text-green-800";
      case "support_executive":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getQuickActions = (role: string) => {
    const baseActions = [
      { icon: Settings, label: "Admin Panel", path: "/staff-admin" },
    ];

    switch (role) {
      case "super_admin":
        return [
          ...baseActions,
          { icon: Users, label: "Manage Users", path: "/staff-admin" },
          { icon: Settings, label: "System Settings", path: "/staff-admin" },
          { icon: BarChart3, label: "Analytics", path: "/staff-admin" },
          { icon: Shield, label: "Permissions", path: "/staff-admin" },
        ];
      case "content_manager":
        return [
          ...baseActions,
          { icon: FileText, label: "Manage Content", path: "/staff-admin" },
          { icon: Edit, label: "Create Page", path: "/staff-admin" },
          { icon: FileText, label: "Manage Blog", path: "/staff-admin" },
          { icon: MessageSquare, label: "FAQs", path: "/staff-admin" },
        ];
      case "sales_manager":
        return [
          ...baseActions,
          { icon: Users, label: "Manage Leads", path: "/staff-admin" },
          { icon: Package, label: "Properties", path: "/staff-admin" },
          { icon: BarChart3, label: "Sales Analytics", path: "/staff-admin" },
          { icon: CreditCard, label: "Transactions", path: "/staff-admin" },
        ];
      case "support_executive":
        return [
          ...baseActions,
          { icon: MessageSquare, label: "User Queries", path: "/staff-admin" },
          { icon: Users, label: "User Management", path: "/staff-admin" },
          { icon: AlertCircle, label: "Reports", path: "/staff-admin" },
          { icon: MessageSquare, label: "Live Chat", path: "/staff-admin" },
        ];
      default:
        return [
          ...baseActions,
          { icon: FileText, label: "View Content", path: "/staff-admin" },
          { icon: Users, label: "View Users", path: "/staff-admin" },
          { icon: BarChart3, label: "View Analytics", path: "/staff-admin" },
        ];
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/staff/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user?.role || "admin");
  const quickActions = getQuickActions(user?.role || "admin");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#C70000] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">POSTTRR Staff</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Notifications</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section with Role Display */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#C70000] to-red-700 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome back, {user?.name}!
                </h2>
                <p className="text-red-100 mb-4">
                  Here's what's happening with your work today.
                </p>
                
                {/* Role Display */}
                <div className="flex items-center space-x-3">
                  <Badge className={`${getRoleColor(user?.role || "admin")} flex items-center space-x-2 px-3 py-1`}>
                    <RoleIcon className="h-4 w-4" />
                    <span className="font-medium">
                      {user?.roleInfo?.displayName || user?.role || "Staff"}
                    </span>
                  </Badge>
                  
                  {user?.username && (
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                      @{user.username}
                    </Badge>
                  )}
                  
                  {user?.isFirstLogin && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      First Login
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-right space-y-2">
                <div className="text-red-100 text-sm">Today</div>
                <div className="text-2xl font-bold">{new Date().toLocaleDateString()}</div>
                <Button
                  onClick={() => navigate("/staff-admin")}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                All assigned tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                Tasks completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</div>
              <p className="text-xs text-muted-foreground">
                Tasks pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaysActivity}</div>
              <p className="text-xs text-muted-foreground">
                Actions today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Role-based Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RoleIcon className="h-5 w-5 text-[#C70000]" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-red-50 hover:border-red-200"
                    onClick={() => navigate(action.path)}
                  >
                    <action.icon className="h-6 w-6 text-[#C70000]" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-[#C70000]" />
                <span>Role Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <RoleIcon className="h-5 w-5 text-[#C70000]" />
                  <span className="font-semibold">
                    {user?.roleInfo?.displayName || user?.role || "Staff"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {user?.role === "super_admin" && "Full access to all features and settings"}
                  {user?.role === "content_manager" && "Manage pages, blogs, and content"}
                  {user?.role === "sales_manager" && "Manage leads, properties, and sales"}
                  {user?.role === "support_executive" && "Handle user queries and support"}
                  {(!user?.role || user?.role === "admin") && "General admin access"}
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Your Permissions:</h4>
                <div className="flex flex-wrap gap-2">
                  {user?.permissions?.slice(0, 6).map((permission: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {permission.replace(".", " ").replace("_", " ")}
                    </Badge>
                  ))}
                  {(user?.permissions?.length || 0) > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{(user?.permissions?.length || 0) - 6} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Eye className="h-4 w-4" />
                  <span>Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
