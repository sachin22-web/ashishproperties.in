import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Home,
  Eye,
  MessageSquare,
  Settings,
  LogOut,
  Edit,
  Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";
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

interface Property {
  _id: string;
  title: string;
  price: number;
  priceType: "sale" | "rent";
  location: {
    address: string;
  };
  images: string[];
  coverImageUrl?: string;
  status: "active" | "pending" | "rejected" | "sold" | "rented";
  approvalStatus: "pending" | "approved" | "rejected";
  views: number;
  inquiries: number;
  createdAt: string;
}

interface SellerStats {
  totalProperties: number;
  activeProperties: number;
  pendingProperties: number;
  totalViews: number;
  totalInquiries: number;
}

export default function Seller() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<SellerStats>({
    totalProperties: 0,
    activeProperties: 0,
    pendingProperties: 0,
    totalViews: 0,
    totalInquiries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.userType !== "seller") {
      navigate("/login");
      return;
    }
    fetchSellerData();
  }, [user, navigate]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fetch seller properties
      const propertiesResponse = await fetch("/api/seller/properties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const propertiesData = await propertiesResponse.json();

      if (propertiesData.success) {
        setProperties(propertiesData.data);

        // Calculate stats
        const totalProperties = propertiesData.data.length;
        const activeProperties = propertiesData.data.filter(
          (p: Property) => p.status === "active",
        ).length;
        const pendingProperties = propertiesData.data.filter(
          (p: Property) => p.approvalStatus === "pending",
        ).length;
        const totalViews = propertiesData.data.reduce(
          (sum: number, p: Property) => sum + (p.views || 0),
          0,
        );
        const totalInquiries = propertiesData.data.reduce(
          (sum: number, p: Property) => sum + (p.inquiries || 0),
          0,
        );

        setStats({
          totalProperties,
          activeProperties,
          pendingProperties,
          totalViews,
          totalInquiries,
        });
      }
    } catch (error) {
      console.error("Error fetching seller data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "sold":
        return "bg-blue-100 text-blue-800";
      case "rented":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSubmitProperty = () => {
    navigate("/post-property");
  };

  const handleEditProperty = (propertyId: string) => {
    navigate(`/post-property?edit=${propertyId}`);
  };

  const handleViewProperty = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
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
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />

      <main className="pb-16">
        <div className="px-4 py-6">
          {/* Seller Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Seller Dashboard
              </h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSubmitProperty}
                className="bg-[#C70000] hover:bg-[#A60000]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit Property
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Home className="h-8 w-8 text-[#C70000] mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalProperties}
                </div>
                <div className="text-xs text-gray-600">Total Properties</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.activeProperties}
                </div>
                <div className="text-xs text-gray-600">Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendingProperties}
                </div>
                <div className="text-xs text-gray-600">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalViews}
                </div>
                <div className="text-xs text-gray-600">Total Views</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalInquiries}
                </div>
                <div className="text-xs text-gray-600">Inquiries</div>
              </CardContent>
            </Card>
          </div>

          {/* Properties List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                My Properties
                <Badge variant="outline">{properties.length} properties</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No properties yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start by submitting your first property
                  </p>
                  <Button
                    onClick={handleSubmitProperty}
                    className="bg-[#C70000] hover:bg-[#A60000]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Property
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {properties.map((property) => (
                    <div
                      key={property._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex">
                        <div className="w-24 h-20 flex-shrink-0 mr-4">
                          <img
                            src={
                              property.coverImageUrl ??
                              property.images?.[0]?.url ??
                              property.images?.[0] ??
                              "/placeholder.png"
                            }
                            alt={property.title}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.png";
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {property.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Badge
                                className={getStatusColor(property.status)}
                              >
                                {property.status}
                              </Badge>
                              <Badge
                                className={getApprovalStatusColor(
                                  property.approvalStatus,
                                )}
                              >
                                {property.approvalStatus}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {property.location.address}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="text-lg font-bold text-[#C70000]">
                                ₹{property.price.toLocaleString()}
                                {property.priceType === "rent" && "/month"}
                              </span>
                              <span className="flex items-center">
                                <Eye className="h-4 w-4 mr-1" />
                                {property.views || 0}
                              </span>
                              <span className="flex items-center">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {property.inquiries || 0}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewProperty(property._id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProperty(property._id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
