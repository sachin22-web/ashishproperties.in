import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Property } from "@shared/types";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Users,
  Home,
  MessageSquare,
  TrendingUp,
  Phone,
  Star,
  Plus,
  Eye,
  Calendar,
  User,
  Settings,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  Briefcase,
  Target,
  Award,
} from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeListings: 0,
    totalClients: 0,
    closedDeals: 0,
    pendingInquiries: 0,
    thisMonthDeals: 0,
    totalCommission: 0,
    rating: 4.5,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.userType !== "agent") {
      // Redirect to appropriate dashboard
      switch (user.userType) {
        case "seller":
          navigate("/seller-dashboard");
          break;
        case "buyer":
          navigate("/buyer-dashboard");
          break;
        default:
          navigate("/user-dashboard");
      }
      return;
    }

    fetchAgentData();
  }, [user, navigate]);

  const fetchAgentData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch agent's properties
      const response = await api.get("/user/properties", token);
      if (response.data.success) {
        const agentProperties = response.data.data as Property[];
        setProperties(agentProperties);

        // Calculate agent-specific stats
        const activeListings = agentProperties.filter(
          (p) => p.status === "active" && p.approvalStatus === "approved",
        ).length;
        const totalViews = agentProperties.reduce(
          (sum, prop) => sum + prop.views,
          0,
        );
        const totalInquiries = agentProperties.reduce(
          (sum, prop) => sum + prop.inquiries,
          0,
        );

        setStats({
          totalProperties: agentProperties.length,
          activeListings,
          totalClients: 25, // Mock data
          closedDeals: 12, // Mock data
          pendingInquiries: totalInquiries,
          thisMonthDeals: 3, // Mock data
          totalCommission: 450000, // Mock data
          rating: 4.5, // Mock data
        });
      }

      // Mock client data for demonstration
      setClients([
        {
          id: 1,
          name: "Rajesh Kumar",
          type: "Buyer",
          status: "Active",
          lastContact: "2024-01-15",
        },
        {
          id: 2,
          name: "Priya Sharma",
          type: "Seller",
          status: "Closed",
          lastContact: "2024-01-14",
        },
        {
          id: 3,
          name: "Amit Singh",
          type: "Buyer",
          status: "Active",
          lastContact: "2024-01-13",
        },
      ]);
    } catch (error: any) {
      console.error("Error fetching agent data:", error);
      if (error.message.includes("401") || error.message.includes("403")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      setError("Failed to load your dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Agent Dashboard
            </h1>
            <p className="text-gray-600">
              Grow your real estate business, {user?.name}!
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchAgentData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Properties
              </CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Listings
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeListings}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Clients
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalClients}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Closed Deals
              </CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.closedDeals}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Award className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.thisMonthDeals}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.rating}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link to="/post-property">
                <Button className="w-full bg-[#C70000] hover:bg-[#A60000] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Listing
                </Button>
              </Link>
              <Link to="/clients">
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Clients
                </Button>
              </Link>
              <Link to="/leads">
                <Button variant="outline" className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  View Leads
                </Button>
              </Link>
              <Link to="/messages">
                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ₹{stats.totalCommission.toLocaleString()}
                </div>
                <p className="text-sm text-green-700">
                  Total Commission Earned
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.pendingInquiries}
                </div>
                <p className="text-sm text-blue-700">Pending Inquiries</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {((stats.closedDeals / stats.totalClients) * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-purple-700">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Your Agent Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{user?.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-800"
                >
                  <Briefcase className="h-3 w-3 mr-1" />
                  Real Estate Agent
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="font-medium">{stats.rating} Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-gray-400" />
                <span>{stats.closedDeals} Deals Closed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Clients</CardTitle>
            <Link to="/clients">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No clients yet</p>
                <Button className="bg-[#C70000] hover:bg-[#A60000] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#C70000] rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {client.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge
                          variant={
                            client.status === "Active" ? "default" : "outline"
                          }
                        >
                          {client.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {client.lastContact}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Listings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Active Listings</CardTitle>
            <Link to="/my-properties">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <div className="text-center py-8">
                <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">
                  You haven't listed any properties yet
                </p>
                <Link to="/post-property">
                  <Button className="bg-[#C70000] hover:bg-[#A60000] text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Listing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.slice(0, 4).map((property) => (
                  <div
                    key={property._id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {property.title}
                      </h3>
                      <Badge
                        variant={
                          property.approvalStatus === "approved"
                            ? "default"
                            : "outline"
                        }
                      >
                        {property.approvalStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      <MapPin className="inline h-3 w-3 mr-1" />
                      {property.location.address}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-[#C70000]">
                        ₹{property.price.toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Eye className="h-3 w-3" />
                        <span>{property.views} views</span>
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
