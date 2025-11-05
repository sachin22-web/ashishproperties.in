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
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Home,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Star,
  Crown,
  RefreshCw,
  MoreHorizontal,
  Copy,
  Share,
  Download,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  DollarSign,
  BarChart3,
  Users,
} from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";

interface PropertyStats {
  views: number;
  inquiries: number;
  favorites: number;
  shares: number;
  clicks: number;
}

export default function MyProperties() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "premium" | "regular">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price" | "views">(
    "newest",
  );
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [propertyStats, setPropertyStats] = useState<PropertyStats | null>(
    null,
  );

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    premium: 0,
    totalViews: 0,
    totalInquiries: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchProperties();
  }, [user, navigate]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.get("/user/properties", token);
      if (response.data.success) {
        const propertiesData = response.data.data as Property[];
        setProperties(propertiesData);
        calculateStats(propertiesData);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (properties: Property[]) => {
    const totalViews = properties.reduce((sum, prop) => sum + prop.views, 0);
    const totalInquiries = properties.reduce(
      (sum, prop) => sum + prop.inquiries,
      0,
    );

    setStats({
      total: properties.length,
      pending: properties.filter((p) => p.approvalStatus === "pending").length,
      approved: properties.filter((p) => p.approvalStatus === "approved")
        .length,
      rejected: properties.filter((p) => p.approvalStatus === "rejected")
        .length,
      premium: properties.filter((p) => p.isPremium).length,
      totalViews,
      totalInquiries,
    });
  };

  const fetchPropertyStats = async (propertyId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.get(`/properties/${propertyId}/stats`, token);
      if (response.data.success) {
        setPropertyStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching property stats:", error);
    }
  };

  const deleteProperty = async (propertyId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.delete(`/properties/${propertyId}`, token);
      if (response.data.success) {
        fetchProperties(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  };

  const togglePropertyStatus = async (
    propertyId: string,
    currentStatus: string,
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const response = await api.put(
        `/properties/${propertyId}/status`,
        { status: newStatus },
        token,
      );

      if (response.data.success) {
        fetchProperties();
      }
    } catch (error) {
      console.error("Error updating property status:", error);
    }
  };

  const makePropertyPremium = async (propertyId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.put(
        `/properties/${propertyId}/premium`,
        {},
        token,
      );
      if (response.data.success) {
        fetchProperties();
        // Redirect to payment or show success
      }
    } catch (error) {
      console.error("Error making property premium:", error);
    }
  };

  const resubmitProperty = async (propertyId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to resubmit your property");
        return;
      }

      const confirmed = confirm(
        "Are you sure you want to resubmit this property for review? Make sure you have addressed all the issues mentioned in the rejection reason."
      );
      
      if (!confirmed) return;

      const response = await api.post(
        `/seller/properties/${propertyId}/resubmit`,
        {},
        token,
      );
      
      if (response.data.success) {
        alert("Property resubmitted successfully! It will be reviewed by our team.");
        fetchProperties();
      } else {
        alert(response.data.error || "Failed to resubmit property");
      }
    } catch (error: any) {
      console.error("Error resubmitting property:", error);
      alert(error.message || "Network error occurred while resubmitting property");
    }
  };

  const getFilteredProperties = () => {
    let filtered = properties;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.location.address
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          property.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (property) => property.approvalStatus === statusFilter,
      );
    }

    // Apply type filter
    if (typeFilter === "premium") {
      filtered = filtered.filter((property) => property.isPremium);
    } else if (typeFilter === "regular") {
      filtered = filtered.filter((property) => !property.isPremium);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "price":
          return b.price - a.price;
        case "views":
          return b.views - a.views;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const copyPropertyLink = (propertyId: string) => {
    const link = `${window.location.origin}/property/${propertyId}`;
    navigator.clipboard.writeText(link);
    // Show toast notification
  };

  const shareProperty = (property: Property) => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description,
        url: `${window.location.origin}/property/${property._id}`,
      });
    } else {
      copyPropertyLink(property._id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your properties...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Home className="h-6 w-6" />
              <span>My Properties</span>
            </h1>
            <p className="text-gray-600">
              Manage and track your property listings
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchProperties} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link to="/post-property">
              <Button className="bg-[#C70000] hover:bg-[#A60000]">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#C70000]">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Total Properties</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.approved}
              </div>
              <div className="text-sm text-gray-600">Approved</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.rejected}
              </div>
              <div className="text-sm text-gray-600">Rejected</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">
                {stats.premium}
              </div>
              <div className="text-sm text-gray-600">Premium</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalViews}
              </div>
              <div className="text-sm text-gray-600">Total Views</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalInquiries}
              </div>
              <div className="text-sm text-gray-600">Inquiries</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="all">All Types</option>
                <option value="premium">Premium</option>
                <option value="regular">Regular</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price">Price High to Low</option>
                <option value="views">Most Viewed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Properties Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Property Listings ({getFilteredProperties().length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getFilteredProperties().length === 0 ? (
              <div className="text-center py-12">
                <Home className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {properties.length === 0
                    ? "No properties yet"
                    : "No properties match your filters"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {properties.length === 0
                    ? "Start by posting your first property listing"
                    : "Try adjusting your search criteria"}
                </p>
                {properties.length === 0 && (
                  <Link to="/post-property">
                    <Button className="bg-[#C70000] hover:bg-[#A60000]">
                      <Plus className="h-4 w-4 mr-2" />
                      Post Your First Property
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Inquiries</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredProperties().map((property) => (
                      <TableRow key={property._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                              {property.images && property.images.length > 0 ? (
                                <img
                                  data-wm="1"
                                  src={property.images[0]}
                                  alt={property.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Home className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {property.title}
                                {property.isPremium && (
                                  <Crown className="inline h-4 w-4 text-amber-500 ml-2" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500 max-w-[200px] truncate">
                                {property.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-bold text-[#C70000]">
                            ₹{property.price.toLocaleString()}
                            {property.priceType === "rent" && "/month"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            {property.location.address}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2">
                            {getStatusBadge(property.approvalStatus)}
                            {property.approvalStatus === "rejected" && (
                              <>
                                {property.rejectionReason && (
                                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                    <strong>Reason:</strong> {property.rejectionReason}
                                  </div>
                                )}
                                <Link to={`/post-property?edit=${property._id}`}>
                                  <Button size="sm" variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit & Resubmit
                                  </Button>
                                </Link>
                              </>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3 text-gray-400" />
                            <span>{property.views}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-3 w-3 text-gray-400" />
                            <span>{property.inquiries}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm text-gray-500">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {new Date(property.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/property/${property._id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Property
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild>
                                <Link to={`/property/${property._id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Property
                                </Link>
                              </DropdownMenuItem>
                              
                              {property.approvalStatus === "rejected" && (
                                <DropdownMenuItem
                                  onClick={() => resubmitProperty(property._id)}
                                  className="text-blue-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Resubmit for Review
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProperty(property);
                                  fetchPropertyStats(property._id);
                                  setShowStatsDialog(true);
                                }}
                              >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Analytics
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => copyPropertyLink(property._id)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => shareProperty(property)}
                              >
                                <Share className="h-4 w-4 mr-2" />
                                Share Property
                              </DropdownMenuItem>

                              {!property.isPremium && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    makePropertyPremium(property._id)
                                  }
                                >
                                  <Crown className="h-4 w-4 mr-2" />
                                  Make Premium
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() =>
                                  togglePropertyStatus(
                                    property._id,
                                    property.status,
                                  )
                                }
                              >
                                {property.status === "active" ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Property
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Property
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "
                                      {property.title}"? This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteProperty(property._id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Dialog */}
        <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Property Analytics</DialogTitle>
            </DialogHeader>

            {selectedProperty && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                    {selectedProperty.images &&
                    selectedProperty.images.length > 0 ? (
                      <img
                        data-wm="1"
                        src={selectedProperty.images[0]}
                        alt={selectedProperty.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedProperty.title}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedProperty.location.address}
                    </p>
                  </div>
                </div>

                {propertyStats && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {propertyStats.views}
                      </div>
                      <div className="text-sm text-blue-700">Total Views</div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {propertyStats.inquiries}
                      </div>
                      <div className="text-sm text-green-700">Inquiries</div>
                    </div>

                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {propertyStats.favorites}
                      </div>
                      <div className="text-sm text-red-700">Favorites</div>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {propertyStats.shares}
                      </div>
                      <div className="text-sm text-purple-700">Shares</div>
                    </div>

                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {propertyStats.clicks}
                      </div>
                      <div className="text-sm text-orange-700">
                        Profile Clicks
                      </div>
                    </div>

                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">
                        {(
                          (propertyStats.inquiries / propertyStats.views) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="text-sm text-amber-700">
                        Conversion Rate
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={() => copyPropertyLink(selectedProperty._id)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>

                  <Button
                    onClick={() => shareProperty(selectedProperty)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>

                  <Button
                    asChild
                    className="flex-1 bg-[#C70000] hover:bg-[#A60000]"
                  >
                    <Link to={`/property/${selectedProperty._id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Live
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <BottomNavigation />
    </div>
  );
}
