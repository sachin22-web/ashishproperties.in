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
  X,
  Camera,
  Upload,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
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

interface Property {
  _id: string;
  title: string;
  propertyType: string;
  subCategory: string;
  price: number;
  status: string;
  location: {
    city: string;
    state: string;
    address: string;
  };
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export default function PropertyManagement() {
  const { token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPromotion, setSelectedPromotion] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [saving, setSaving] = useState(false);
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
    },
    contactInfo: {
      name: "",
      phone: "",
      email: "",
    },
    status: "active",
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  useEffect(() => {
    fetchProperties();
  }, [token, pagination.page, selectedStatus, selectedPromotion]);

  const fetchProperties = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: selectedStatus,
        promotion: selectedPromotion,
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/properties?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProperties(data.data.properties);
          setPagination(data.data.pagination);
        } else {
          setError(data.error || "Failed to fetch properties");
        }
      } else {
        setError("Failed to fetch properties");
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setError("Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  };

  const updatePropertyStatus = async (propertyId: string, status: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setProperties(
          properties.map((property) =>
            property._id === propertyId ? { ...property, status } : property,
          ),
        );
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update property status");
      }
    } catch (error) {
      console.error("Error updating property status:", error);
      setError("Failed to update property status");
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!token || !confirm("Are you sure you want to delete this property?"))
      return;

    try {
      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setProperties(
          properties.filter((property) => property._id !== propertyId),
        );
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete property");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      setError("Failed to delete property");
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchProperties();
  };

  const handleViewProperty = (property: any) => {
    setSelectedProperty(property);
    setShowViewDialog(true);
  };

  const handleEditProperty = (property: any) => {
    setSelectedProperty(property);
    setFormData({
      title: property.title || "",
      description: property.description || "",
      price: (property.price || 0).toString(),
      priceType: property.priceType || "sale",
      propertyType: property.propertyType || "",
      subCategory: property.subCategory || "",
      location: property.location || {
        address: "",
        city: "",
        state: "",
        pincode: "",
      },
      contactInfo: property.contactInfo || { name: "", phone: "", email: "" },
      status: property.status || "pending",
    });
    setSelectedImages([]);
    setShowEditDialog(true);
  };

  const handleUpdateProperty = async () => {
    if (!token || !selectedProperty) return;

    try {
      setSaving(true);
      setError("");

      // Create FormData for file upload
      const submitData = new FormData();

      // Add property data
      Object.keys(formData).forEach((key) => {
        if (key === "location" || key === "contactInfo") {
          submitData.append(
            key,
            JSON.stringify(formData[key as keyof typeof formData]),
          );
        } else {
          submitData.append(
            key,
            formData[key as keyof typeof formData] as string,
          );
        }
      });

      // Add new images if any
      selectedImages.forEach((image, index) => {
        submitData.append("images", image);
      });

      const response = await fetch(
        `/api/admin/properties/${selectedProperty._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: submitData,
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchProperties();
        setShowEditDialog(false);
        setSelectedProperty(null);
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
          },
          contactInfo: {
            name: "",
            phone: "",
            email: "",
          },
          status: "active",
        });
        setSelectedImages([]);
        alert("Property updated successfully!");
      } else {
        setError(data.error || "Failed to update property");
      }
    } catch (error) {
      console.error("Error updating property:", error);
      setError("Failed to update property");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!token || !confirm("Are you sure you want to delete this property?"))
      return;

    try {
      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setProperties(
          properties.filter((property) => property._id !== propertyId),
        );
        alert("Property deleted successfully!");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete property");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      setError("Failed to delete property");
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (selectedImages.length + files.length <= 10) {
      setSelectedImages([...selectedImages, ...files]);
    } else {
      alert("Maximum 10 images allowed");
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleCreateProperty = async () => {
    if (!token) return;

    try {
      setSaving(true);
      setError("");

      // Create FormData for file upload
      const submitData = new FormData();

      // Add property data
      Object.keys(formData).forEach((key) => {
        if (key === "location" || key === "contactInfo") {
          submitData.append(
            key,
            JSON.stringify(formData[key as keyof typeof formData]),
          );
        } else {
          submitData.append(
            key,
            formData[key as keyof typeof formData] as string,
          );
        }
      });

      // Add images
      selectedImages.forEach((image, index) => {
        submitData.append("images", image);
      });

      const response = await fetch("/api/admin/properties", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchProperties();
        setShowCreateDialog(false);
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
          },
          contactInfo: {
            name: "",
            phone: "",
            email: "",
          },
          status: "active",
        });
        setSelectedImages([]);
      } else {
        setError(data.error || "Failed to create property");
      }
    } catch (error) {
      console.error("Error creating property:", error);
      setError("Failed to create property");
    } finally {
      setSaving(false);
    }
  };

  const filteredProperties = properties.filter((property) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (property.title?.toLowerCase() || "").includes(searchLower) ||
      (property.location?.address?.toLowerCase() || "").includes(searchLower) ||
      (property.contactInfo?.name?.toLowerCase() || "").includes(searchLower);

    let matchesPromotion = true;
    if (selectedPromotion === "paid") {
      matchesPromotion = property.premium === true;
    } else if (selectedPromotion === "free") {
      matchesPromotion = !property.premium || property.premium === false;
    } else if (selectedPromotion === "featured") {
      matchesPromotion = property.featured === true;
    }

    return matchesSearch && matchesPromotion;
  });

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
            Property Management
          </h3>
          <p className="text-gray-600">
            Manage all property listings and advertisements
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#C70000] hover:bg-[#A60000]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Properties
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">All listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Properties
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {properties.filter((p) => p.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Live listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {properties.filter((p) => p.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sold Properties
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {properties.filter((p) => p.status === "sold").length}
            </div>
            <p className="text-xs text-muted-foreground">Completed sales</p>
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPromotion} onValueChange={setSelectedPromotion}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Promotion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            <SelectItem value="paid">Paid Promotion Only</SelectItem>
            <SelectItem value="free">Free Listings Only</SelectItem>
            <SelectItem value="featured">Featured Properties</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Properties Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Home className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {property.title || "Untitled Property"}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {property._id?.slice(-6) || "N/A"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium capitalize">
                        {property.propertyType || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {property.subCategory || "N/A"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      ₹
                      {property.price
                        ? (property.price / 100000).toFixed(1)
                        : "0"}
                      L
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {property.location?.city || "N/A"},{" "}
                        {property.location?.state || "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {property.contactInfo?.name || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {property.contactInfo?.phone || "N/A"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        property.status === "active"
                          ? "bg-green-100 text-green-800"
                          : property.status === "sold"
                            ? "bg-blue-100 text-blue-800"
                            : property.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }
                    >
                      {property.status || "unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewProperty(property)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProperty(property)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updatePropertyStatus(
                            property._id,
                            property.status === "active"
                              ? "inactive"
                              : "active",
                          )
                        }
                        className={
                          property.status === "active"
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProperty(property._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProperties.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-500 py-8"
                  >
                    No properties found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page - 1 })
              }
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page + 1 })
              }
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Property Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter property title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter property description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="Enter price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Type *
                </label>
                <Select
                  value={formData.priceType}
                  onValueChange={(value: "sale" | "rent") =>
                    setFormData({ ...formData, priceType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <Textarea
                value={formData.location.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value },
                  })
                }
                placeholder="Enter complete address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name *
                </label>
                <Input
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
                  placeholder="Enter contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <Input
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
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
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
                  placeholder="Enter email"
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Images (Max 10)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-4">
                  Upload property images (JPG, PNG)
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="admin-image-upload"
                />
                <label
                  htmlFor="admin-image-upload"
                  className="bg-[#C70000] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-[#A60000] inline-flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Images
                </label>
              </div>

              {selectedImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected Images ({selectedImages.length}/10)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Property ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProperty}
                disabled={
                  saving ||
                  !formData.title ||
                  !formData.description ||
                  !formData.price
                }
                className="bg-[#C70000] hover:bg-[#A50000]"
              >
                {saving ? "Creating..." : "Create Property"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Property Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Property Details</DialogTitle>
          </DialogHeader>

          {selectedProperty && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Title:
                  </label>
                  <p className="text-gray-900">{selectedProperty.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Type:
                  </label>
                  <p className="text-gray-900 capitalize">
                    {selectedProperty.propertyType} -{" "}
                    {selectedProperty.subCategory}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Description:
                </label>
                <p className="text-gray-900">{selectedProperty.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Price:
                  </label>
                  <p className="text-gray-900">
                    ₹{selectedProperty.price?.toLocaleString()} (
                    {selectedProperty.priceType})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Status:
                  </label>
                  <Badge
                    className={
                      selectedProperty.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {selectedProperty.status}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Location:
                </label>
                <p className="text-gray-900">
                  {selectedProperty.location?.address}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Contact Information:
                </label>
                <div className="mt-1 space-y-1">
                  <p>Name: {selectedProperty.contactInfo?.name}</p>
                  <p>Phone: {selectedProperty.contactInfo?.phone}</p>
                  <p>Email: {selectedProperty.contactInfo?.email}</p>
                </div>
              </div>

              {selectedProperty.images &&
                selectedProperty.images.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Images:
                    </label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {selectedProperty.images.map(
                        (image: string, index: number) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Property ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter property title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter property description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="Enter price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Type *
                </label>
                <Select
                  value={formData.priceType}
                  onValueChange={(value: "sale" | "rent") =>
                    setFormData({ ...formData, priceType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <Textarea
                value={formData.location.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value },
                  })
                }
                placeholder="Enter complete address"
                rows={2}
              />
            </div>

            {/* Image Upload Section for Edit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add New Images (Max 10 total)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="edit-image-upload"
                />
                <label
                  htmlFor="edit-image-upload"
                  className="bg-[#C70000] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-[#A60000] inline-flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Images
                </label>
              </div>

              {selectedImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    New Images ({selectedImages.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`New ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedProperty(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProperty}
                disabled={
                  saving ||
                  !formData.title ||
                  !formData.description ||
                  !formData.price
                }
                className="bg-[#C70000] hover:bg-[#A50000]"
              >
                {saving ? "Updating..." : "Update Property"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
