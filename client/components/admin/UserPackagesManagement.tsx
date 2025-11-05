import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Users,
  Package,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
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

interface UserPackage {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  packageType: string;
  price: number;
  duration: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled" | "pending";
  autoRenewal: boolean;
  featuresUsed: {
    listings: number;
    maxListings: number;
    views: number;
    inquiries: number;
  };
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  createdAt: string;
  updatedAt: string;
}

export default function UserPackagesManagement() {
  const { token } = useAuth();
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPackageType, setSelectedPackageType] = useState("all");
  const [selectedUserPackage, setSelectedUserPackage] = useState<UserPackage | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchUserPackages();
  }, [token, pagination.page, selectedStatus, selectedPackageType]);

  const fetchUserPackages = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: selectedStatus,
        packageType: selectedPackageType,
      });

      const response = await fetch(`/api/admin/user-packages?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserPackages(data.data.userPackages);
          setPagination(data.data.pagination);
        } else {
          // Fallback to mock data if API fails
          const mockUserPackages: UserPackage[] = [
            {
              _id: "1",
              userId: "user1",
              userName: "Rajesh Kumar",
              userEmail: "rajesh@example.com",
              packageId: "pkg1",
              packageName: "Premium Listing Package",
              packageType: "premium",
              price: 999,
              duration: 30,
              startDate: "2024-01-15",
              endDate: "2024-02-14",
              status: "active",
              autoRenewal: true,
              featuresUsed: {
                listings: 3,
                maxListings: 10,
                views: 245,
                inquiries: 18,
              },
              paymentStatus: "paid",
              createdAt: "2024-01-15T10:00:00Z",
              updatedAt: "2024-01-15T10:00:00Z",
            },
            {
              _id: "2",
              userId: "user2",
              userName: "Priya Sharma",
              userEmail: "priya@example.com",
              packageId: "pkg2",
              packageName: "Featured Advertisement Package",
              packageType: "featured",
              price: 599,
              duration: 30,
              startDate: "2024-01-10",
              endDate: "2024-02-09",
              status: "active",
              autoRenewal: false,
              featuresUsed: {
                listings: 2,
                maxListings: 5,
                views: 156,
                inquiries: 12,
              },
              paymentStatus: "paid",
              createdAt: "2024-01-10T10:00:00Z",
              updatedAt: "2024-01-10T10:00:00Z",
            },
            {
              _id: "3",
              userId: "user3",
              userName: "Amit Singh",
              userEmail: "amit@example.com",
              packageId: "pkg3",
              packageName: "Basic Listing Package",
              packageType: "basic",
              price: 0,
              duration: 30,
              startDate: "2024-01-05",
              endDate: "2024-02-04",
              status: "expired",
              autoRenewal: false,
              featuresUsed: {
                listings: 1,
                maxListings: 1,
                views: 89,
                inquiries: 5,
              },
              paymentStatus: "paid",
              createdAt: "2024-01-05T10:00:00Z",
              updatedAt: "2024-01-05T10:00:00Z",
            },
          ];
          setUserPackages(mockUserPackages);
          setPagination({
            page: 1,
            limit: 20,
            total: mockUserPackages.length,
            pages: 1,
          });
        }
      } else {
        setError("Failed to fetch user packages");
      }

    } catch (error) {
      console.error("Error fetching user packages:", error);
      setError("Failed to fetch user packages");
    } finally {
      setLoading(false);
    }
  };

  const updatePackageStatus = async (packageId: string, status: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/user-packages/${packageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setUserPackages(userPackages.map(pkg =>
          pkg._id === packageId ? { ...pkg, status: status as any } : pkg
        ));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update package status");
      }
    } catch (error) {
      console.error("Error updating package status:", error);
      setError("Failed to update package status");
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "expired": return <XCircle className="h-4 w-4 text-red-600" />;
      case "cancelled": return <XCircle className="h-4 w-4 text-gray-600" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "expired": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPackageTypeColor = (type: string) => {
    switch (type) {
      case "premium": return "bg-purple-100 text-purple-800";
      case "featured": return "bg-blue-100 text-blue-800";
      case "basic": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredPackages = userPackages.filter(pkg => {
    const matchesSearch = pkg.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.packageName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || pkg.status === selectedStatus;
    const matchesType = selectedPackageType === "all" || pkg.packageType === selectedPackageType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    totalSubscriptions: userPackages.length,
    activeSubscriptions: userPackages.filter(p => p.status === "active").length,
    totalRevenue: userPackages.reduce((sum, pkg) => sum + pkg.price, 0),
    expiringThisWeek: userPackages.filter(p => {
      const daysRemaining = getDaysRemaining(p.endDate);
      return daysRemaining >= 0 && daysRemaining <= 7 && p.status === "active";
    }).length,
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading user packages...</p>
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
              fetchUserPackages();
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
          <h3 className="text-2xl font-bold text-gray-900">User Packages Management</h3>
          <p className="text-gray-600">Monitor and manage user package subscriptions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground">All time subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From packages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiringThisWeek}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search users or packages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPackageType} onValueChange={setSelectedPackageType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Package Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* User Packages Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Duration & Price</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.map((pkg) => {
                const daysRemaining = getDaysRemaining(pkg.endDate);
                return (
                  <TableRow key={pkg._id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{pkg.userName}</p>
                        <p className="text-sm text-gray-500">{pkg.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pkg.packageName}</p>
                        <Badge
                          variant="outline"
                          className={getPackageTypeColor(pkg.packageType)}
                        >
                          {pkg.packageType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">
                          {pkg.price === 0 ? "Free" : `₹${pkg.price}`}
                        </p>
                        <p className="text-sm text-gray-500">{pkg.duration} days</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Listings:</span>
                          <span>{pkg.featuresUsed.listings}/{pkg.featuresUsed.maxListings}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Views:</span>
                          <span>{pkg.featuresUsed.views}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Inquiries:</span>
                          <span>{pkg.featuresUsed.inquiries}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(pkg.status)}
                        <Badge
                          variant="outline"
                          className={getStatusColor(pkg.status)}
                        >
                          {pkg.status}
                        </Badge>
                      </div>
                      {pkg.autoRenewal && (
                        <p className="text-xs text-green-600 mt-1">Auto-renewal</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(pkg.endDate).toLocaleDateString()}
                        </p>
                        <p className={`text-xs ${
                          daysRemaining < 0 ? "text-red-600" : 
                          daysRemaining <= 7 ? "text-orange-600" : "text-gray-500"
                        }`}>
                          {daysRemaining < 0 ? 
                            `Expired ${Math.abs(daysRemaining)} days ago` :
                            `${daysRemaining} days left`
                          }
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedUserPackage(pkg)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Package Details</DialogTitle>
                            </DialogHeader>
                            {selectedUserPackage && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="font-semibold">User:</label>
                                    <p>{selectedUserPackage.userName}</p>
                                    <p className="text-sm text-gray-500">{selectedUserPackage.userEmail}</p>
                                  </div>
                                  <div>
                                    <label className="font-semibold">Package:</label>
                                    <p>{selectedUserPackage.packageName}</p>
                                    <Badge className={getPackageTypeColor(selectedUserPackage.packageType)}>
                                      {selectedUserPackage.packageType}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="font-semibold">Price:</label>
                                    <p>{selectedUserPackage.price === 0 ? "Free" : `₹${selectedUserPackage.price}`}</p>
                                  </div>
                                  <div>
                                    <label className="font-semibold">Duration:</label>
                                    <p>{selectedUserPackage.duration} days</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="font-semibold">Usage Statistics:</label>
                                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>Listings Used: {selectedUserPackage.featuresUsed.listings}/{selectedUserPackage.featuresUsed.maxListings}</div>
                                      <div>Total Views: {selectedUserPackage.featuresUsed.views}</div>
                                      <div>Inquiries: {selectedUserPackage.featuresUsed.inquiries}</div>
                                      <div>Auto Renewal: {selectedUserPackage.autoRenewal ? "Yes" : "No"}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {pkg.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updatePackageStatus(pkg._id, "cancelled")}
                            className="text-red-600"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPackages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No user packages found
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
