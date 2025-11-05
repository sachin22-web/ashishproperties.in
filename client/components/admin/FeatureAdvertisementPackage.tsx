import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Star,
  Edit,
  Trash2,
  Plus,
  Eye,
  Search,
  Filter,
  Crown,
  DollarSign,
  Calendar,
  Users,
  Zap,
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

interface FeaturePackage {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  featureLevel: "featured" | "premium" | "spotlight";
  priority: number;
  bannerPlacement: boolean;
  socialPromotion: boolean;
  category: string;
  location: string;
  active: boolean;
  subscribers: number;
  createdAt: string;
  updatedAt: string;
}

export default function FeatureAdvertisementPackage() {
  const { token } = useAuth();
  const [packages, setPackages] = useState<FeaturePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: "",
    description: "",
    price: 0,
    duration: 30,
    featureLevel: "featured" as "featured" | "premium" | "spotlight",
    priority: 1,
    bannerPlacement: false,
    socialPromotion: false,
    category: "property",
    location: "rohtak",
    features: [""] as string[],
  });

  useEffect(() => {
    fetchFeaturePackages();
  }, [token]);

  const fetchFeaturePackages = async () => {
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
          // Filter for featured/premium packages and exclude basic listing packages
          const featurePackages = data.data.filter(
            (pkg: any) =>
              (pkg.type === "featured" || pkg.type === "premium") &&
              pkg.category === "property" &&
              pkg.featureLevel, // Only packages with feature levels
          );
          setPackages(featurePackages);
        } else {
          setError(data.error || "Failed to fetch feature packages");
        }
      } else {
        setError(
          `Failed to fetch feature packages: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Error fetching feature packages:", error);
      setError("Failed to fetch feature packages");
    } finally {
      setLoading(false);
    }
  };

  const createFeaturePackage = async () => {
    if (!token || !newPackage.name || !newPackage.description) return;

    try {
      const packageData = {
        ...newPackage,
        type: newPackage.featureLevel, // Keep type for backwards compatibility
        featureLevel: newPackage.featureLevel, // Add featureLevel for identification
        features: newPackage.features.filter((f) => (( f ?? "" ).trim()) !== ""),
        active: true, // Make sure new packages are active by default
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
          fetchFeaturePackages();
          setNewPackage({
            name: "",
            description: "",
            price: 0,
            duration: 30,
            featureLevel: "featured",
            priority: 1,
            bannerPlacement: false,
            socialPromotion: false,
            category: "property",
            location: "rohtak",
            features: [""],
          });
          setIsCreateDialogOpen(false);
        } else {
          setError(data.error || "Failed to create feature package");
        }
      } else {
        setError("Failed to create feature package");
      }
    } catch (error) {
      console.error("Error creating feature package:", error);
      setError("Failed to create feature package");
    }
  };

  const deleteFeaturePackage = async (packageId: string) => {
    if (
      !token ||
      !confirm("Are you sure you want to delete this feature package?")
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
        setError(
          data.error || `Failed to delete feature package (${response.status})`,
        );
      }
    } catch (error) {
      console.error("Error deleting feature package:", error);
      setError("Failed to delete feature package");
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
    const matchesLevel =
      selectedLevel === "all" || pkg.featureLevel === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  const getFeatureLevelIcon = (level: string) => {
    switch (level) {
      case "spotlight":
        return <Crown className="h-4 w-4" />;
      case "premium":
        return <Zap className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getFeatureLevelColor = (level: string) => {
    switch (level) {
      case "spotlight":
        return "bg-yellow-100 text-yellow-800";
      case "premium":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">
          Loading feature advertisement packages...
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
              fetchFeaturePackages();
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
            Feature Advertisement Packages
          </h3>
          <p className="text-gray-600">
            Manage premium featured advertisement packages
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C70000] hover:bg-[#A60000]">
              <Plus className="h-4 w-4 mr-2" />
              Create Feature Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Feature Package</DialogTitle>
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
                    placeholder="e.g., Premium Featured Package"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Feature Level
                  </label>
                  <Select
                    value={newPackage.featureLevel}
                    onValueChange={(value: any) =>
                      setNewPackage({ ...newPackage, featureLevel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="spotlight">Spotlight</SelectItem>
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
                  placeholder="Describe the premium features..."
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
                    placeholder="599"
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
                    Priority Level
                  </label>
                  <Input
                    type="number"
                    value={newPackage.priority}
                    onChange={(e) =>
                      setNewPackage({
                        ...newPackage,
                        priority: parseInt(e.target.value) || 1,
                      })
                    }
                    placeholder="1"
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              {/* Premium Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="bannerPlacement"
                    checked={newPackage.bannerPlacement}
                    onChange={(e) =>
                      setNewPackage({
                        ...newPackage,
                        bannerPlacement: e.target.checked,
                      })
                    }
                  />
                  <label htmlFor="bannerPlacement" className="text-sm">
                    Banner Placement
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="socialPromotion"
                    checked={newPackage.socialPromotion}
                    onChange={(e) =>
                      setNewPackage({
                        ...newPackage,
                        socialPromotion: e.target.checked,
                      })
                    }
                  />
                  <label htmlFor="socialPromotion" className="text-sm">
                    Social Media Promotion
                  </label>
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">
                    Premium Features
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
                      placeholder="e.g., Homepage banner placement"
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
                  onClick={createFeaturePackage}
                  className="bg-[#C70000] hover:bg-[#A60000]"
                >
                  Create Feature Package
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
              Feature Packages
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
            <p className="text-xs text-muted-foreground">Premium packages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Premium Revenue
            </CardTitle>
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
              From feature packages
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Ads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.reduce((sum, pkg) => sum + (pkg.subscribers || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Active featured</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Premium Price
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹
              {packages.length
                ? Math.round(
                    packages.reduce((sum, pkg) => sum + pkg.price, 0) /
                      packages.length,
                  )
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Average price</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search feature packages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Feature Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="spotlight">Spotlight</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Feature Packages Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package Details</TableHead>
                <TableHead>Feature Level</TableHead>
                <TableHead>Price & Duration</TableHead>
                <TableHead>Premium Features</TableHead>
                <TableHead>Subscribers</TableHead>
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
                    <Badge
                      variant="outline"
                      className={getFeatureLevelColor(pkg.featureLevel)}
                    >
                      <span className="flex items-center space-x-1">
                        {getFeatureLevelIcon(pkg.featureLevel)}
                        <span className="capitalize">{pkg.featureLevel}</span>
                      </span>
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      Priority: {pkg.priority}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">₹{pkg.price}</p>
                      <p className="text-sm text-gray-500">
                        {pkg.duration} days
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {pkg.bannerPlacement && (
                        <Badge variant="outline" className="mr-1 mb-1">
                          Banner Placement
                        </Badge>
                      )}
                      {pkg.socialPromotion && (
                        <Badge variant="outline" className="mr-1 mb-1">
                          Social Promotion
                        </Badge>
                      )}
                      <p className="text-xs text-gray-500">
                        {pkg.features.length} features
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
                        onClick={() => deleteFeaturePackage(pkg._id)}
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
                    No feature packages found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Frontend Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-500" />
            <span>Frontend Integration Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  Auto-Sync: Active
                </span>
              </div>
              <p className="text-sm text-green-700">
                Feature Advertisement Packages created here are automatically
                available on the frontend for users to select when posting
                properties.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800">
                  User Packages: Removed
                </span>
              </div>
              <p className="text-sm text-blue-700">
                The separate "User Packages" management section has been
                removed. All package management is now handled through this
                unified system.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              How It Works:
            </h4>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>
                Admin creates feature packages with specific feature levels
                (Featured, Premium, Spotlight)
              </li>
              <li>
                Packages are instantly available on frontend package selection
                page
              </li>
              <li>Users can select packages when posting new properties</li>
              <li>
                Package features automatically apply to user listings based on
                selection
              </li>
              <li>
                Payment integration handles package purchases and activations
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
