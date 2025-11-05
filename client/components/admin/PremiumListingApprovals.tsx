import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Crown,
  Eye,
  Check,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  MessageSquare,
  IndianRupee,
} from "lucide-react";
import { Button } from "../ui/button";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

interface PremiumProperty {
  _id: string;
  title: string;
  description: string;
  price: number;
  priceType: "sale" | "rent";
  propertyType: string;
  subCategory: string;
  location: {
    area?: string;
    address: string;
  };
  contactInfo: {
    name: string;
    phone: string;
    alternativePhone?: string;
    whatsappNumber?: string;
    email?: string;
  };
  images: string[];
  premium: boolean;
  premiumApprovalStatus: "pending" | "approved" | "rejected";
  premiumApprovedAt?: Date;
  premiumApprovedBy?: string;
  createdAt: string;
  packageId?: string;
  paidAmount?: number;
  paidCurrency?: string;
  package?: {
    name?: string;
    type?: string;
    price?: number;
  };
}

export default function PremiumListingApprovals() {
  const { token } = useAuth();
  const [properties, setProperties] = useState<PremiumProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<PremiumProperty | null>(null);
  const [adminComments, setAdminComments] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPremiumProperties();
  }, [token]);

  const fetchPremiumProperties = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/premium-properties", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProperties(data.data);
        } else {
          setError(data.error || "Failed to fetch premium properties");
        }
      } else {
        setError("Failed to fetch premium properties");
      }
    } catch (error) {
      console.error("Error fetching premium properties:", error);
      setError("Failed to fetch premium properties");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (propertyId: string, action: "approve" | "reject") => {
    if (!token) return;

    try {
      setProcessingId(propertyId);
      
      const response = await fetch(`/api/admin/premium-properties/${propertyId}/approval`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          adminComments: adminComments || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the property in the list
        setProperties(properties.map(prop => 
          prop._id === propertyId 
            ? { ...prop, premiumApprovalStatus: action === "approve" ? "approved" : "rejected" }
            : prop
        ));
        
        setAdminComments("");
        setSelectedProperty(null);
        alert(`Premium listing ${action}d successfully!`);
      } else {
        setError(data.error || `Failed to ${action} premium listing`);
      }
    } catch (error) {
      console.error(`Error ${action}ing premium listing:`, error);
      setError(`Failed to ${action} premium listing`);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingProperties = properties.filter(p => p.premiumApprovalStatus === "pending");
  const approvedProperties = properties.filter(p => p.premiumApprovalStatus === "approved");
  const rejectedProperties = properties.filter(p => p.premiumApprovalStatus === "rejected");

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading premium listings...</p>
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
              fetchPremiumProperties();
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
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Crown className="h-7 w-7 text-[#C70000] mr-3" />
            Premium Listing Approvals
          </h3>
          <p className="text-gray-600">Review and approve premium property listings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingProperties.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedProperties.length}</div>
            <p className="text-xs text-muted-foreground">Live premium listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedProperties.length}</div>
            <p className="text-xs text-muted-foreground">Rejected listings</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="h-5 w-5 text-yellow-600 mr-2" />
            Pending Premium Approvals ({pendingProperties.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Owner Contact</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingProperties.map((property) => (
                <TableRow key={property._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                        <Crown className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{property.title}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {property.propertyType} • {property.subCategory}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">
                      ₹{(property.price / 100000).toFixed(1)}L
                    </div>
                    <div className="text-sm text-gray-500">
                      For {property.priceType}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-semibold text-green-600">
                          {property.paidAmount 
                            ? `₹${property.paidAmount.toLocaleString()}` 
                            : property.package?.price 
                            ? `₹${property.package.price.toLocaleString()}` 
                            : "N/A"}
                        </div>
                        {property.package?.name && (
                          <div className="text-xs text-gray-500 capitalize">
                            {property.package.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{property.location.area || "Rohtak"}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {property.location.address.substring(0, 50)}...
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{property.contactInfo.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{property.contactInfo.phone}</span>
                      </div>
                      {property.contactInfo.whatsappNumber && (
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{property.contactInfo.whatsappNumber}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(property.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedProperty(property)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center">
                              <Crown className="h-5 w-5 text-yellow-600 mr-2" />
                              Review Premium Listing
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedProperty && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">{selectedProperty.title}</h4>
                                <p className="text-gray-600">{selectedProperty.description}</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Price:</label>
                                  <p>₹{selectedProperty.price.toLocaleString()} ({selectedProperty.priceType})</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Type:</label>
                                  <p className="capitalize">{selectedProperty.propertyType} - {selectedProperty.subCategory}</p>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-gray-700">Contact Information:</label>
                                <div className="mt-1 space-y-1">
                                  <p>Name: {selectedProperty.contactInfo.name}</p>
                                  <p>Phone: {selectedProperty.contactInfo.phone}</p>
                                  {selectedProperty.contactInfo.alternativePhone && (
                                    <p>Alternative: {selectedProperty.contactInfo.alternativePhone}</p>
                                  )}
                                  {selectedProperty.contactInfo.whatsappNumber && (
                                    <p>WhatsApp: {selectedProperty.contactInfo.whatsappNumber}</p>
                                  )}
                                  {selectedProperty.contactInfo.email && (
                                    <p>Email: {selectedProperty.contactInfo.email}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Admin Comments (Optional)
                                </label>
                                <Textarea
                                  value={adminComments}
                                  onChange={(e) => setAdminComments(e.target.value)}
                                  placeholder="Add any comments about this approval/rejection..."
                                  rows={3}
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => handleApproval(selectedProperty._id, "reject")}
                                  disabled={processingId === selectedProperty._id}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => handleApproval(selectedProperty._id, "approve")}
                                  disabled={processingId === selectedProperty._id}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        size="sm"
                        onClick={() => handleApproval(property._id, "approve")}
                        disabled={processingId === property._id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval(property._id, "reject")}
                        disabled={processingId === property._id}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pendingProperties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No pending premium approvals
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
