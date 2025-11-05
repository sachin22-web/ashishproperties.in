import { useState, useEffect } from "react";
import { Property } from "@shared/types";
import { api } from "../../lib/api";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import {
  Check,
  X,
  Eye,
  Home,
  MapPin,
  IndianRupee,
  User,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const REJECTION_REGIONS = [
  { value: "images", label: "Property Images" },
  { value: "description", label: "Description" },
  { value: "location", label: "Location/Address" },
  { value: "price", label: "Price Information" },
  { value: "contact", label: "Contact Details" },
  { value: "specifications", label: "Property Specifications" },
  { value: "amenities", label: "Amenities" },
  { value: "documents", label: "Documents/Verification" },
  { value: "other", label: "Other" },
];

const PendingPropertiesApproval = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [adminComments, setAdminComments] = useState("");
  const [rejectionRegion, setRejectionRegion] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPendingProperties();
  }, []);

  const fetchPendingProperties = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        return;
      }
      const response = await api.get("admin/properties/pending", token);
      if (response.data.success) {
        setProperties(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching pending properties:", error);
      setError("Failed to fetch pending properties");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (
    propertyId: string,
    approvalStatus: "approved" | "rejected",
  ) => {
    if (!selectedProperty) return;

    setProcessing(propertyId);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        approvalStatus,
        adminComments: adminComments.trim() || undefined,
      };

      if (approvalStatus === "rejected") {
        if (!rejectionRegion || !rejectionReason.trim()) {
          setError("Please select a problem region and provide a specific reason for rejection");
          return;
        }
        const regionLabel = REJECTION_REGIONS.find(r => r.value === rejectionRegion)?.label || "General";
        payload.rejectionReason = `${regionLabel}: ${rejectionReason.trim()}`;
        payload.rejectionRegion = rejectionRegion;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        return;
      }
      console.log(`📤 Sending approval request:`, { propertyId, payload });

      const response = await api.put(
        `admin/properties/${propertyId}/approval`,
        payload,
        token,
      );

      console.log(`📨 Approval response received:`, response);

      if (response.data.success) {
        setSuccess(`Property ${approvalStatus} successfully`);
        setProperties(properties.filter((p) => p._id !== propertyId));
        setSelectedProperty(null);
        setAdminComments("");
        setRejectionReason("");
      } else {
        setError(response.data.error || "Failed to update property status");
      }
    } catch (error: any) {
      console.error(`❌ Approval error:`, error);
      setError(error.message || "Network error occurred");
    } finally {
      setProcessing(null);
    }
  };

  const openPropertyDetails = (property: Property) => {
    setSelectedProperty(property);
    setAdminComments("");
    setRejectionRegion("");
    setRejectionReason("");
    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Pending Properties
          </h2>
          <p className="text-gray-600">Review and approve property listings</p>
        </div>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          {properties.length} Pending Review
        </Badge>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {properties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Check className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              All caught up!
            </h3>
            <p className="text-gray-600">
              No properties pending approval at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {properties.map((property) => (
            <Card key={property._id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Property Images */}
                  <div className="w-full lg:w-80 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">
                          {property.title}
                        </h3>
                        {property.approvalStatus === "pending_approval" && (
                          <Badge className="bg-purple-100 text-purple-800 font-medium">
                            💰 Promotional Package
                          </Badge>
                        )}
                        {property.packageId && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Package Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 line-clamp-3">
                        {property.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-lg">
                          ₹{property.price.toLocaleString()}{" "}
                          {property.priceType === "rent" ? "/month" : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{property.location.address}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-500" />
                        <span>
                          {property.propertyType} - {property.subCategory}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>
                          Posted{" "}
                          {new Date(property.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Property Specifications */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      {property.specifications.bedrooms && (
                        <Badge variant="outline">
                          {property.specifications.bedrooms} Bedrooms
                        </Badge>
                      )}
                      {property.specifications.bathrooms && (
                        <Badge variant="outline">
                          {property.specifications.bathrooms} Bathrooms
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {property.specifications.area} sq ft
                      </Badge>
                      {property.specifications.furnished && (
                        <Badge variant="outline">
                          {property.specifications.furnished}
                        </Badge>
                      )}
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Owner Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {property.contactInfo.name}
                          </span>
                          <Badge variant="secondary">
                            {property.ownerType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{property.contactInfo.phone}</span>
                        </div>
                        {property.contactInfo.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{property.contactInfo.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button
                        onClick={() => openPropertyDetails(property)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </Button>

                      <Button
                        onClick={() =>
                          handleApproval(property._id!, "approved")
                        }
                        disabled={processing === property._id}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        {processing === property._id
                          ? "Processing..."
                          : "Approve"}
                      </Button>

                      <Button
                        onClick={() => openPropertyDetails(property)}
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Property Review Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Review Property</h3>
                <Button
                  onClick={() => setSelectedProperty(null)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">
                    {selectedProperty.title}
                  </h4>
                  <p className="text-gray-600">
                    {selectedProperty.description}
                  </p>
                </div>

                {/* Property Images Grid */}
                {selectedProperty.images &&
                  selectedProperty.images.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Property Images</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProperty.images
                          .slice(0, 4)
                          .map((image, index) => (
                            <div
                              key={index}
                              className="h-32 bg-gray-200 rounded overflow-hidden"
                            >
                              <img
                                src={image}
                                alt={`Property ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Comments (Optional)
                  </label>
                  <Textarea
                    value={adminComments}
                    onChange={(e) => setAdminComments(e.target.value)}
                    placeholder="Add any comments about this property..."
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Problem Region/Section
                    </label>
                    <Select value={rejectionRegion} onValueChange={setRejectionRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the section with issues..." />
                      </SelectTrigger>
                      <SelectContent>
                        {REJECTION_REGIONS.map((region) => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specific Rejection Reason
                    </label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide specific details about what needs to be fixed..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    onClick={() => setSelectedProperty(null)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      handleApproval(selectedProperty._id!, "rejected")
                    }
                    disabled={
                      processing === selectedProperty._id ||
                      !rejectionRegion ||
                      !rejectionReason.trim()
                    }
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    {processing === selectedProperty._id
                      ? "Rejecting..."
                      : "Reject"}
                  </Button>
                  <Button
                    onClick={() =>
                      handleApproval(selectedProperty._id!, "approved")
                    }
                    disabled={processing === selectedProperty._id}
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {processing === selectedProperty._id
                      ? "Approving..."
                      : "Approve"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingPropertiesApproval;
