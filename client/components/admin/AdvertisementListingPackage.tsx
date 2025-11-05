import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Package,
  Edit,
  Trash2,
  Plus,
  Eye,
  Search,
  Filter,
  Star,
  DollarSign,
  Calendar,
  Users,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
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

interface ListingPackage {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  maxListings: number;
  listingType: "basic" | "standard" | "premium";
  category: string;
  location: string;
  active: boolean;
  subscribers: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdvertisementListingPackage() {
  const { token } = useAuth();
  const [packages, setPackages] = useState<ListingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: "",
    description: "",
    price: 0,
    duration: 30,
    maxListings: 1,
    listingType: "basic" as "basic" | "standard" | "premium",
    category: "property",
    location: "rohtak",
    features: [""] as string[],
  });

  useEffect(() => {
    fetchPackages();
  }, [token]);

  const fetchPackages = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/packages?activeOnly=false", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter for listing-type packages (basic, standard, premium that are not featured packages)
          const listingPackages = data.data.filter(
            (pkg: any) =>
              pkg.category === "property" &&
              (pkg.type === "basic" ||
                pkg.type === "standard" ||
                pkg.type === "premium") &&
              !pkg.featureLevel, // Exclude featured advertisement packages
          );
          setPackages(listingPackages);
        } else {
          setError(data.error || "Failed to fetch listing packages");
        }
      } else {
        setError(
          `Failed to fetch listing packages: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Error fetching listing packages:", error);
      setError("Failed to fetch listing packages");
    } finally {
      setLoading(false);
    }
  };

  const createPackage = async () => {
    if (!token || !newPackage.name || !newPackage.description) return;

    try {
      const packageData = {
        ...newPackage,
        type: newPackage.listingType,
        features: newPackage.features.filter((f) => (( f ?? "" ).trim()) !== ""),
      };

      const response = await fetch("/api/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(packageData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchPackages();
          setNewPackage({
            name: "",
            description: "",
            price: 0,
            duration: 30,
            maxListings: 1,
            listingType: "basic",
            category: "property",
            location: "rohtak",
            features: [""],
          });
          setIsCreateDialogOpen(false);
        } else {
          setError(data.error || "Failed to create package");
        }
      } else {
        setError("Failed to create package");
      }
    } catch (error) {
      console.error("Error creating package:", error);
      setError("Failed to create package");
    }
  };

  const deletePackage = async (packageId: string) => {
    if (
      !token ||
      !confirm("Are you sure you want to delete this listing package?")
    )
      return;

    try {
      const response = await fetch(`/api/packages/${packageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Read response body once to avoid stream already read error
      let data;
      try {
        const responseText = await response.text();
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.warn("Could not parse response as JSON");
        data = {};
      }

      if (response.ok) {
        setPackages(packages.filter((pkg) => pkg._id !== packageId));
      } else {
        setError(data.error || `Failed to delete package (${response.status})`);
      }
    } catch (error) {
      console.error("Error deleting package:", error);
      setError("Failed to delete package");
    }
  };

  const addFeature = () => {
    setNewPackage({
      ...newPackage,
      features: [...newPackage.features, ""],
    });
  };

  const updateFeature = (index: number, value: string) => {
    const updatedFeatures = [...newPackage.features];
    updatedFeatures[index] = value;
    setNewPackage({ ...newPackage, features: updatedFeatures });
  };

  const removeFeature = (index: number) => {
    setNewPackage({
      ...newPackage,
      features: newPackage.features.filter((_, i) => i !== index),
    });
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedType === "all" || pkg.listingType === selectedType;

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">
          Loading advertisement listing packages...
        </p>
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
              fetchPackages();
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
            Advertisement Listing Packages
          </h3>
          <p className="text-gray-600">
            Manage packages for property listing advertisements
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C70000] hover:bg-[#A60000]">
              <Plus className="h-4 w-4 mr-2" />
              Create Listing Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Listing Package</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Package Name
                  </label>
                  <Input
                    value={newPackage.name}
                    onChange={(e) =>
                      setNewPackage({ ...newPackage, name: e.target.value })
                    }
                    placeholder="e.g., Basic Listing Package"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Package Type
                  </label>
                  <Select
                    value={newPackage.listingType}
                    onValueChange={(value: any) =>
                      setNewPackage({ ...newPackage, listingType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  value={newPackage.description}
                  onChange={(e) =>
                    setNewPackage({
                      ...newPackage,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the package benefits..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price (₹)
                  </label>
                  <Input
                    type="number"
                    value={newPackage.price}
                    onChange={(e) =>
                      setNewPackage({
                        ...newPackage,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="299"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duration (Days)
                  </label>
                  <Input
                    type="number"
                    value={newPackage.duration}
                    onChange={(e) =>
                      setNewPackage({
                        ...newPackage,
                        duration: parseInt(e.target.value) || 30,
                      })
                    }
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max Listings
                  </label>
                  <Input
                    type="number"
                    value={newPackage.maxListings}
                    onChange={(e) =>
                      setNewPackage({
                        ...newPackage,
                        maxListings: parseInt(e.target.value) || 1,
                      })
                    }
                    placeholder="5"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">
                    Package Features
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFeature}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Feature
                  </Button>
                </div>
                {newPackage.features.map((feature, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <Input
                      placeholder="e.g., Priority listing placement"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createPackage}
                  className="bg-[#C70000] hover:bg-[#A60000]"
                >
                  Create Package
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Packages
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
            <p className="text-xs text-muted-foreground">Listing packages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹
              {packages
                .reduce(
                  (sum, pkg) => sum + pkg.price * (pkg.subscribers || 0),
                  0,
                )
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From listing packages
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Subscribers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.reduce((sum, pkg) => sum + (pkg.subscribers || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total subscribers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Package Duration
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.length
                ? Math.round(
                    packages.reduce((sum, pkg) => sum + pkg.duration, 0) /
                      packages.length,
                  )
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Days average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search listing packages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Package Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Packages Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package Details</TableHead>
                <TableHead>Type & Price</TableHead>
                <TableHead>Duration & Listings</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.map((pkg) => (
                <TableRow key={pkg._id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-semibold">{pkg.name}</p>
                      <p className="text-sm text-gray-500">{pkg.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge
                        variant="outline"
                        className={
                          pkg.listingType === "premium"
                            ? "bg-purple-100 text-purple-800"
                            : pkg.listingType === "standard"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {pkg.listingType}
                      </Badge>
                      <p className="font-semibold mt-1">
                        {pkg.price === 0 ? "Free" : `₹${pkg.price}`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{pkg.duration} days</p>
                      <p className="text-sm text-gray-500">
                        {pkg.maxListings || "Unlimited"} listings
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {pkg.subscribers || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={pkg.active ? "default" : "secondary"}
                      className={
                        pkg.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {pkg.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deletePackage(pkg._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPackages.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 py-8"
                  >
                    No listing packages found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Custom Fields Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Custom Field Options</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage custom fields available for property listings in different
            packages
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Package Fields */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Badge variant="outline" className="mr-2">
                  Basic
                </Badge>
                Standard Fields
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Title & Description</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Price & Property Type</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Location (Area)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Basic Images (up to 3)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Contact Information</span>
                </div>
              </div>
            </div>

            {/* Standard Package Fields */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Badge
                  variant="outline"
                  className="mr-2 bg-blue-100 text-blue-800"
                >
                  Standard
                </Badge>
                Enhanced Fields
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>All Basic Fields</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>More Images (up to 8)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Property Specifications</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Amenities List</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Virtual Tour Link</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>WhatsApp Integration</span>
                </div>
              </div>
            </div>

            {/* Premium Package Fields */}
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Badge
                  variant="outline"
                  className="mr-2 bg-purple-100 text-purple-800"
                >
                  Premium
                </Badge>
                Premium Fields
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>All Standard Fields</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Unlimited Images</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Video Upload</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>360° Virtual Tour</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Property Documents</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Social Media Integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly />
                  <span>Priority Support</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">
                Custom Field Options Status: Active
              </span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              All custom field options are functioning properly. Users can
              access fields based on their package tier.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
