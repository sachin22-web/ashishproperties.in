import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Eye,
  Edit2,
  Trash2,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Home,
  Star,
  Crown,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface AdminPropertiesProps {
  token: string;
}

interface Property {
  _id: string;
  title: string;
  price: number;
  priceType: "sale" | "rent";
  propertyType: string;
  subCategory: string;
  location: {
    address: string;
    area?: string;
  };
  status: "active" | "sold" | "rented" | "inactive";
  featured: boolean;
  packageId?: string;
  packageExpiry?: string;
  views: number;
  inquiries: number;
  images: string[];
  ownerId: string;
  ownerType: "seller" | "agent";
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminProperties({ token }: AdminPropertiesProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProperties();
  }, [currentPage, statusFilter, typeFilter, searchTerm]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("propertyType", typeFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/properties?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setProperties(data.data.properties);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchProperties();
        alert("Property status updated successfully!");
      } else {
        alert(data.error || "Failed to update property status");
      }
    } catch (error) {
      console.error("Error updating property status:", error);
      alert("Failed to update property status");
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchProperties();
        alert("Property deleted successfully!");
      } else {
        alert(data.error || "Failed to delete property");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      alert("Failed to delete property");
    }
  };

  const handleFeatureToggle = async (propertyId: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ featured }),
      });

      const data = await response.json();

      if (data.success) {
        fetchProperties();
        alert(`Property ${featured ? "featured" : "unfeatured"} successfully!`);
      } else {
        alert(data.error || "Failed to update property");
      }
    } catch (error) {
      console.error("Error updating property:", error);
      alert("Failed to update property");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "sold":
        return "bg-blue-100 text-blue-800";
      case "rented":
        return "bg-purple-100 text-purple-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPackageStatus = (property: Property) => {
    if (!property.packageId) {
      return {
        type: "basic",
        label: "Free",
        color: "bg-gray-100 text-gray-800",
      };
    }

    const expiry = new Date(property.packageExpiry || "");
    const now = new Date();

    if (expiry < now) {
      return {
        type: "expired",
        label: "Expired",
        color: "bg-red-100 text-red-800",
      };
    }

    return {
      type: property.featured ? "featured" : "basic",
      label: property.featured ? "Featured" : "Basic",
      color: property.featured
        ? "bg-orange-100 text-orange-800"
        : "bg-blue-100 text-blue-800",
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Properties Management
        </h1>
        <Button
          onClick={() => (window.location.href = "/post-property")}
          className="bg-[#C70000] hover:bg-[#A60000] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search properties..."
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="plot">Plot/Land</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
                setCurrentPage(1);
              }}
              variant="outline"
              className="w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Properties List */}
      <div className="space-y-4">
        {properties.map((property) => {
          const packageStatus = getPackageStatus(property);
          return (
            <div
              key={property._id}
              className="bg-white rounded-lg shadow border p-6"
            >
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={
                      property.images[0] ||
                      "https://via.placeholder.com/80x80?text=No+Image"
                    }
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {property.title}
                      </h3>
                      <p className="text-gray-600 flex items-center mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.location.address}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span className="font-semibold text-[#C70000]">
                          ₹{(property.price / 100000).toFixed(1)}L
                          {property.priceType === "rent" && "/month"}
                        </span>
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {property.views} views
                        </span>
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {property.inquiries} inquiries
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(property.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(property.status)}>
                          {property.status}
                        </Badge>
                        <Badge className={packageStatus.color}>
                          {packageStatus.label}
                        </Badge>
                      </div>

                      {property.featured && (
                        <div className="flex items-center text-orange-600">
                          <Star className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Featured</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Owner Information */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {property.contactInfo.name}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {property.contactInfo.phone}
                          </span>
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {property.contactInfo.email}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline">{property.ownerType}</Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>

                    {/* Status Change */}
                    <Select
                      value={property.status}
                      onValueChange={(value) =>
                        handleStatusChange(property._id, value)
                      }
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="rented">Rented</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Feature Toggle */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleFeatureToggle(property._id, !property.featured)
                      }
                      className={
                        property.featured
                          ? "text-orange-600 border-orange-600"
                          : ""
                      }
                    >
                      {property.featured ? (
                        <>
                          <Star className="h-4 w-4 mr-1" />
                          Featured
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-1" />
                          Feature
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteProperty(property._id)}
                      className="text-red-600 border-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}

      {properties.length === 0 && (
        <div className="text-center py-12">
          <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Properties Found
          </h3>
          <p className="text-gray-600 mb-4">
            No properties match your current filters or search criteria.
          </p>
          <Button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setTypeFilter("all");
            }}
            variant="outline"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
