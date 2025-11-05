import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Home,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  MapPin,
  Plus,
  Star,
  StarOff,
  X,
  Camera,
  Upload,
  Save,
  Phone,
  Mail,
  Calendar,
  Check,
  AlertCircle,
  Crown,
  Zap,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { withAdminErrorBoundary } from "./AdminErrorBoundary";

interface Property {
  _id: string;
  title: string;
  description: string;
  propertyType: string;
  subCategory: string;
  price: number;
  priceType: "sale" | "rent";
  location: {
    city: string;
    state: string;
    address: string;
    area?: string;
  };
  contactInfo: {
    name: string;
    phone: string;
    whatsappNumber?: string;
    email: string;
  };
  images: string[];
  status: "active" | "inactive" | "sold" | "rented";
  approvalStatus: "pending" | "approved" | "rejected";
  featured: boolean;
  premium: boolean;
  promotionType: "free" | "paid";
  views: number;
  inquiries: number;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
}

function CompletePropertyManagement() {
  const { token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPromotion, setSelectedPromotion] = useState("all");
  const [selectedApproval, setSelectedApproval] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<string>("");
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionPropertyId, setRejectionPropertyId] = useState<string | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    priceType: "sale" as "sale" | "rent",
    propertyType: "residential",
    subCategory: "1bhk",
    location: {
      city: "Rohtak",
      state: "Haryana",
      address: "",
      area: "",
    },
    contactInfo: {
      name: "",
      phone: "",
      whatsappNumber: "",
      email: "",
    },
    amenities: [] as string[],
    specifications: {
      bedrooms: 1,
      bathrooms: 1,
      area: "",
      floor: "",
      totalFloors: "",
      parking: false,
      furnished: "unfurnished" as
        | "furnished"
        | "semi-furnished"
        | "unfurnished",
    },
    featured: false,
    premium: false,
    promotionType: "free" as "free" | "paid",
    status: "active" as "active" | "inactive" | "sold" | "rented",
  });

  useEffect(() => {
    fetchProperties();
  }, [
    token,
    pagination.page,
    selectedStatus,
    selectedPromotion,
    selectedApproval,
  ]);

  const fetchProperties = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedPromotion !== "all")
        params.append("promotionType", selectedPromotion);
      if (selectedApproval !== "all")
        params.append("approvalStatus", selectedApproval);
      if (searchTerm) params.append("search", searchTerm);

      const { api } = await import("../../lib/api");
      const response = await api.get(`admin/properties?${params}`, token);
      if (response.data.success) {
        console.log("📊 Properties fetched:", response.data.data.properties);
        console.log(
          "📊 First property structure:",
          response.data.data.properties[0],
        );
        setProperties(response.data.data.properties);
        setPagination(response.data.data.pagination);
      } else {
        setError(response.data.error || "Failed to fetch properties");
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setError("Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token) return;

    try {
      setSaving(true);

      const formDataObj = new FormData();

      // Add all form fields with safe undefined handling
      Object.keys(formData).forEach((key) => {
        const value = formData[key];

        // Skip undefined or null values
        if (value === undefined || value === null) {
          return;
        }

        if (
          key === "location" ||
          key === "contactInfo" ||
          key === "specifications"
        ) {
          formDataObj.append(key, JSON.stringify(value));
        } else if (key === "amenities") {
          formDataObj.append(key, JSON.stringify(value));
        } else {
          // Convert to string safely
          formDataObj.append(key, String(value));
        }
      });

      // Add images safely
      if (selectedImages && Array.isArray(selectedImages)) {
        selectedImages.forEach((image, index) => {
          if (image) {
            formDataObj.append(`images`, image);
          }
        });
      }

      const { createApiUrl } = await import("../../lib/api");
      const url = createApiUrl("admin/properties");
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataObj,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchProperties();
          resetForm();
          setShowCreateDialog(false);
        } else {
          setError(data.error || "Failed to create property");
        }
      } else {
        setError("Failed to create property");
      }
    } catch (error) {
      console.error("Error creating property:", error);
      setError("Failed to create property");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!token || !selectedProperty) return;

    try {
      setSaving(true);

      const formDataObj = new FormData();

      // Add all form fields with safe undefined handling
      Object.keys(formData).forEach((key) => {
        const value = formData[key];

        // Skip undefined or null values
        if (value === undefined || value === null) {
          return;
        }

        if (
          key === "location" ||
          key === "contactInfo" ||
          key === "specifications"
        ) {
          formDataObj.append(key, JSON.stringify(value));
        } else if (key === "amenities") {
          formDataObj.append(key, JSON.stringify(value));
        } else {
          // Convert to string safely
          formDataObj.append(key, String(value));
        }
      });

      // Add new images safely
      if (selectedImages && Array.isArray(selectedImages)) {
        selectedImages.forEach((image, index) => {
          if (image) {
            formDataObj.append(`images`, image);
          }
        });
      }

      const { createApiUrl } = await import("../../lib/api");
      const url = createApiUrl(`admin/properties/${selectedProperty._id}`);
      const response = await fetch(url, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataObj,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchProperties();
          resetForm();
          setShowEditDialog(false);
          setSelectedProperty(null);
        } else {
          setError(data.error || "Failed to update property");
        }
      } else {
        setError("Failed to update property");
      }
    } catch (error) {
      console.error("Error updating property:", error);
      setError("Failed to update property");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (
      !token ||
      !confirm(
        "Are you sure you want to delete this property? This action cannot be undone.",
      )
    )
      return;

    try {
      const { api } = await import("../../lib/api");
      await api.delete(`admin/properties/${propertyId}`, token);
      setProperties(properties.filter((prop) => prop._id !== propertyId));
    } catch (error: any) {
      console.error("Error deleting property:", error);
      setError(error.message || "Failed to delete property");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProperties(properties.map((p) => p._id));
    } else {
      setSelectedProperties([]);
    }
  };

  const handleSelectProperty = (propertyId: string, checked: boolean) => {
    if (checked) {
      setSelectedProperties([...selectedProperties, propertyId]);
    } else {
      setSelectedProperties(
        selectedProperties.filter((id) => id !== propertyId),
      );
    }
  };

  const handleBulkDelete = async () => {
    if (!token || selectedProperties.length === 0) return;

    const confirmMsg = `Are you sure you want to delete ${selectedProperties.length} properties? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    try {
      setSaving(true);
      const { api } = await import("../../lib/api");
      await api.delete("admin/properties/bulk", token, {
        propertyIds: selectedProperties,
      });

      setProperties(
        properties.filter((p) => !selectedProperties.includes(p._id)),
      );
      setSelectedProperties([]);
      setShowBulkActions(false);
    } catch (error: any) {
      console.error("Error bulk deleting properties:", error);
      setError(error.message || "Failed to delete properties");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    if (!token || selectedProperties.length === 0) return;

    try {
      setSaving(true);
      const { api } = await import("../../lib/api");
      await api.put(
        "admin/properties/bulk/status",
        {
          propertyIds: selectedProperties,
          status,
        },
        token,
      );

      fetchProperties();
      setSelectedProperties([]);
      setShowBulkActions(false);
      setBulkActionType("");
    } catch (error: any) {
      console.error("Error bulk updating status:", error);
      setError(error.message || "Failed to update properties");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdateApproval = async (approvalStatus: string) => {
    if (!token || selectedProperties.length === 0) return;

    try {
      setSaving(true);
      const { api } = await import("../../lib/api");
      await api.put(
        "admin/properties/bulk/approval",
        {
          propertyIds: selectedProperties,
          approvalStatus,
        },
        token,
      );

      fetchProperties();
      setSelectedProperties([]);
      setShowBulkActions(false);
      setBulkActionType("");
    } catch (error: any) {
      console.error("Error bulk updating approval:", error);
      setError(error.message || "Failed to update properties");
    } finally {
      setSaving(false);
    }
  };

  const togglePropertyPromotion = async (
    propertyId: string,
    field: "featured" | "premium",
    value: boolean,
  ) => {
    if (!token) return;

    try {
      const { api } = await import("../../lib/api");
      await api.put(
        `admin/properties/${propertyId}/promotion`,
        { [field]: value },
        token,
      );
      fetchProperties();
    } catch (error: any) {
      console.error("Error updating promotion:", error);
      setError(error.message || "Failed to update promotion");
    }
  };

  const updateApprovalStatus = async (
    propertyId: string,
    status: "approved" | "rejected",
    reason?: string,
  ) => {
    if (!token) {
      setError("Authentication required");
      return;
    }

    if (!propertyId || propertyId === "undefined" || propertyId === "null") {
      console.error("❌ Invalid property ID:", propertyId);
      setError("Property ID is required");
      return;
    }

    // Find the property to ensure it exists
    const property = properties.find(
      (p) => p._id === propertyId || p.id === propertyId,
    );
    if (!property) {
      console.error("❌ Property not found in local state:", propertyId);
      setError("Property not found");
      return;
    }

    console.log(
      `�� Updating approval status for property: ${propertyId} -> ${status}`,
    );
    console.log(
      `🔍 Property object:`,
      properties.find((p) => p._id === propertyId),
    );
    console.log(
      `🔗 API endpoint will be: admin/properties/${propertyId}/approval`,
    );

    try {
      const { api } = await import("../../lib/api");
      console.log(
        `📤 Sending PUT request to: admin/properties/${propertyId}/approval`,
      );
      const requestBody: any = { approvalStatus: status };
      if (status === "rejected" && reason) {
        requestBody.rejectionReason = reason;
      }
      const response = await api.put(
        `admin/properties/${propertyId}/approval`,
        requestBody,
        token,
      );

      console.log(`✅ Approval status updated successfully`);

      // Update the local state immediately for better UX
      setProperties((prevProperties) =>
        prevProperties.map((prop) =>
          prop._id === propertyId ? { ...prop, approvalStatus: status } : prop,
        ),
      );

      // Clear any previous errors
      setError("");

      // Refresh the full data from server
      fetchProperties();
    } catch (error: any) {
      console.error("Error updating approval status:", error);
      const errorMessage = error.message || "Failed to update approval status";
      setError(`Failed to ${status} property: ${errorMessage}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      priceType: "sale",
      propertyType: "residential",
      subCategory: "1bhk",
      location: {
        city: "Rohtak",
        state: "Haryana",
        address: "",
        area: "",
      },
      contactInfo: {
        name: "",
        phone: "",
        whatsappNumber: "",
        email: "",
      },
      amenities: [],
      specifications: {
        bedrooms: 1,
        bathrooms: 1,
        area: "",
        floor: "",
        totalFloors: "",
        parking: false,
        furnished: "unfurnished",
      },
      featured: false,
      premium: false,
      promotionType: "free",
      status: "active",
    });
    setSelectedImages([]);
  };

  const populateForm = (property: Property) => {
    setFormData({
      title: property.title,
      description: property.description,
      price: property.price.toString(),
      priceType: property.priceType,
      propertyType: property.propertyType,
      subCategory: property.subCategory,
      location: property.location,
      contactInfo: property.contactInfo,
      amenities: [],
      specifications: {
        bedrooms: 1,
        bathrooms: 1,
        area: "",
        floor: "",
        totalFloors: "",
        parking: false,
        furnished: "unfurnished",
      },
      featured: property.featured,
      premium: property.premium,
      promotionType: property.promotionType,
      status: property.status,
    });
  };

  const getStatusBadge = (status: string | null | undefined) => {
    // Provide fallback for null/undefined status
    const safeStatus = status || "unknown";

    const config = {
      pending: {
        className: "bg-yellow-100 text-yellow-800",
        icon: AlertCircle,
      },
      approved: { className: "bg-green-100 text-green-800", icon: Check },
      rejected: { className: "bg-red-100 text-red-800", icon: X },
      active: { className: "bg-blue-100 text-blue-800", icon: Check },
      inactive: { className: "bg-gray-100 text-gray-800", icon: X },
      sold: { className: "bg-purple-100 text-purple-800", icon: Check },
      rented: { className: "bg-orange-100 text-orange-800", icon: Check },
      unknown: { className: "bg-gray-100 text-gray-600", icon: AlertCircle },
    };

    const { className, icon: Icon } = config[safeStatus] || config.unknown;

    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </Badge>
    );
  };

  const stats = {
    total: properties.length,
    approved: properties.filter((p) => p.approvalStatus === "approved").length,
    pending: properties.filter((p) => p.approvalStatus === "pending").length,
    featured: properties.filter((p) => p.featured).length,
    premium: properties.filter((p) => p.premium).length,
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError("");
              fetchProperties();
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Complete Property Management
          </h3>
          <p className="text-gray-600">
            Full CRUD operations for all property listings with promotion
            controls
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={async () => {
              try {
                const response = await fetch("/api/create-test-properties", {
                  method: "POST",
                });
                const data = await response.json();
                console.log("Test properties created:", data);
                fetchProperties();
              } catch (error) {
                console.error("Error creating test properties:", error);
              }
            }}
            variant="outline"
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            Create Test Properties
          </Button>
          <Button
            onClick={async () => {
              try {
                const response = await fetch("/api/debug-properties");
                const data = await response.json();
                console.log("Database debug:", data);
                alert(`Total properties: ${data.data.totalProperties}`);
              } catch (error) {
                console.error("Error debugging:", error);
              }
            }}
            variant="outline"
          >
            Debug DB
          </Button>
          <Button
            onClick={async () => {
              try {
                if (properties.length > 0) {
                  const testPropertyId = properties[0]._id || properties[0].id;
                  console.log(
                    "🧪 Testing approval with property ID:",
                    testPropertyId,
                  );

                  const response = await fetch(
                    `/api/test-property-approval/${testPropertyId}`,
                    {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ approvalStatus: "approved" }),
                    },
                  );
                  const data = await response.json();
                  console.log("🧪 Test response:", data);
                  alert(`Test result: ${JSON.stringify(data)}`);
                } else {
                  alert("No properties available for testing");
                }
              } catch (error) {
                console.error("Error testing:", error);
              }
            }}
            variant="outline"
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            Test Approval
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#C70000] hover:bg-[#A60000]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Properties
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
            <p className="text-xs text-muted-foreground">Live properties</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.featured}
            </div>
            <p className="text-xs text-muted-foreground">Featured listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.premium}
            </div>
            <p className="text-xs text-muted-foreground">Premium listings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search properties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPromotion} onValueChange={setSelectedPromotion}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Promotion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Promotions</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedApproval} onValueChange={setSelectedApproval}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Approval" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Approvals</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchProperties}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedProperties.length > 0 && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-blue-900">
                  {selectedProperties.length}{" "}
                  {selectedProperties.length === 1 ? "property" : "properties"}{" "}
                  selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
                <Select
                  value={bulkActionType}
                  onValueChange={setBulkActionType}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Bulk Update..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Update Status</SelectItem>
                    <SelectItem value="approval">Update Approval</SelectItem>
                  </SelectContent>
                </Select>
                {bulkActionType === "status" && (
                  <Select onValueChange={handleBulkUpdateStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {bulkActionType === "approval" && (
                  <Select onValueChange={handleBulkUpdateApproval}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select Approval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProperties([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedProperties.length === properties.length &&
                      properties.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Promotion</TableHead>
                <TableHead>Views/Inquiries</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => {
                console.log(`🔍 Rendering property:`, {
                  id: property._id,
                  title: property.title,
                  approvalStatus: property.approvalStatus,
                });
                return (
                  <TableRow key={property._id || property.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProperties.includes(property._id)}
                        onCheckedChange={(checked) =>
                          handleSelectProperty(property._id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-start space-x-3">
                        {property.images && property.images.length > 0 && (
                          <img
                            src={property.images[0]}
                            alt={property.title || "Property"}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <p className="font-semibold">
                            {property.title || "Untitled Property"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {property.propertyType || "Unknown Type"} •{" "}
                            {property.subCategory || "Unknown Category"}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {property.location?.area
                              ? `${property.location.area}, `
                              : ""}
                            {property.location?.city || "Unknown Location"}
                          </p>
                          <p className="text-lg font-bold text-[#C70000]">
                            ₹{(property.price || 0).toLocaleString()}
                            {property.priceType === "rent" && "/month"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {property.ownerName ||
                            property.contactInfo?.name ||
                            "Unknown Owner"}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {property.contactInfo?.phone || "No phone"}
                        </p>
                        {property.contactInfo?.whatsappNumber && (
                          <p className="text-sm text-gray-500">
                            WhatsApp: {property.contactInfo.whatsappNumber}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(property.status)}
                        {getStatusBadge(property.approvalStatus)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={property.featured}
                            onCheckedChange={(checked) =>
                              togglePropertyPromotion(
                                property._id,
                                "featured",
                                checked,
                              )
                            }
                          />
                          <span className="text-sm">Featured</span>
                          {property.featured && (
                            <Star className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={property.premium}
                            onCheckedChange={(checked) =>
                              togglePropertyPromotion(
                                property._id,
                                "premium",
                                checked,
                              )
                            }
                          />
                          <span className="text-sm">Premium</span>
                          {property.premium && (
                            <Crown className="h-4 w-4 text-purple-500" />
                          )}
                        </div>
                        <Badge
                          variant={
                            property.promotionType === "paid"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {property.promotionType === "paid" ? "Paid" : "Free"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {property.views || 0} views
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {property.inquiries || 0} inquiries
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProperty(property);
                            setShowViewDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProperty(property);
                            populateForm(property);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(property._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {property.approvalStatus === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                updateApprovalStatus(
                                  property._id || property.id,
                                  "approved",
                                )
                              }
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setRejectionPropertyId(
                                  property._id || property.id,
                                );
                                setShowRejectionDialog(true);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Property Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter property title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price *
                </label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="Enter price..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter property description..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Property Type
                </label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, propertyType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="plot">Plot/Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Sub Category
                </label>
                <Select
                  value={formData.subCategory}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subCategory: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1bhk">1 BHK</SelectItem>
                    <SelectItem value="2bhk">2 BHK</SelectItem>
                    <SelectItem value="3bhk">3 BHK</SelectItem>
                    <SelectItem value="4bhk">4 BHK</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="plot">Plot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Contact Information
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Contact Name"
                  value={formData.contactInfo.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: {
                        ...formData.contactInfo,
                        name: e.target.value,
                      },
                    })
                  }
                />
                <Input
                  placeholder="Phone Number *"
                  value={formData.contactInfo.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: {
                        ...formData.contactInfo,
                        phone: e.target.value,
                      },
                    })
                  }
                />
                <Input
                  placeholder="WhatsApp Number *"
                  value={formData.contactInfo.whatsappNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: {
                        ...formData.contactInfo,
                        whatsappNumber: e.target.value,
                      },
                    })
                  }
                />
                <Input
                  placeholder="Email"
                  value={formData.contactInfo.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: {
                        ...formData.contactInfo,
                        email: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Area in Rohtak"
                  value={formData.location.area}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, area: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Full Address"
                  value={formData.location.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        address: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Property Images
              </label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setSelectedImages(files);
                }}
              />
              {selectedImages.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedImages.length} image(s) selected
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, featured: checked })
                  }
                />
                <span className="text-sm">Featured</span>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.premium}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, premium: checked })
                  }
                />
                <span className="text-sm">Premium</span>
              </div>
              <Select
                value={formData.promotionType}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, promotionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Promotion</SelectItem>
                  <SelectItem value="paid">Paid Promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-[#C70000] hover:bg-[#A60000]"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Property
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Same form fields as create dialog but with update button */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Property Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter property title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price *
                </label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="Enter price..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                className="bg-[#C70000] hover:bg-[#A60000]"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Property
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Property Details</DialogTitle>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">{selectedProperty.title}</h4>
                  <p className="text-sm text-gray-500">
                    {selectedProperty.description}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#C70000]">
                    ₹{selectedProperty.price.toLocaleString()}
                    {selectedProperty.priceType === "rent" && "/month"}
                  </p>
                </div>
              </div>

              {selectedProperty.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedProperty.images.slice(0, 6).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Property ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold mb-2">Contact Information</h5>
                  <p>{selectedProperty.contactInfo.name}</p>
                  <p className="flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {selectedProperty.contactInfo.phone}
                  </p>
                  {selectedProperty.contactInfo.whatsappNumber && (
                    <p>
                      WhatsApp: {selectedProperty.contactInfo.whatsappNumber}
                    </p>
                  )}
                  <p className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {selectedProperty.contactInfo.email}
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">Statistics</h5>
                  <p>Views: {selectedProperty.views}</p>
                  <p>Inquiries: {selectedProperty.inquiries}</p>
                  <p>
                    Created:{" "}
                    {new Date(selectedProperty.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Property</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Rejection Reason *
              </label>
              <Textarea
                placeholder="Please provide a reason for rejecting this property..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-24"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionDialog(false);
                  setRejectionReason("");
                  setRejectionPropertyId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!rejectionReason.trim()) {
                    setError("Rejection reason is required");
                    return;
                  }
                  if (rejectionPropertyId) {
                    await updateApprovalStatus(
                      rejectionPropertyId,
                      "rejected",
                      rejectionReason,
                    );
                    setShowRejectionDialog(false);
                    setRejectionReason("");
                    setRejectionPropertyId(null);
                  }
                }}
              >
                Reject Property
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAdminErrorBoundary(CompletePropertyManagement);
