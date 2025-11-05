import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  Users,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Crown,
  Phone,
  Mail,
  Calendar,
  MapPin,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { cn } from "../lib/utils";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  userType: "buyer" | "seller" | "agent" | "admin";
  status?: "active" | "inactive" | "suspended" | "pending";
  createdAt: string;
  lastLogin?: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
  isVerified?: boolean;
  profileComplete?: boolean;
  propertiesCount?: number;
}

export default function AllUsersManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    verifiedUsers: 0,
  });

  const usersPerPage = 10;

  useEffect(() => {
    console.log("AllUsersManagement component mounted, token:", !!token);
    if (token) {
      fetchUsers();
      fetchStats();
    }
  }, [currentPage, selectedUserType, selectedStatus, searchTerm, token]);

  const fetchUsers = async () => {
    if (!token) {
      console.log("No token available for fetchUsers");
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log("Fetching users with token:", token.substring(0, 20) + "...");

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        userType: selectedUserType !== "all" ? selectedUserType : "",
        status: selectedStatus !== "all" ? selectedStatus : "",
        search: searchTerm,
      });

      const url = `/api/admin/users?${params}`;
      console.log("Fetching from URL:", url);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Users API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Users API response data:", data);

        if (data.success) {
          setUsers(data.data.users || []);
          setTotalUsers(data.data.total || 0);
          console.log("Set users:", data.data.users?.length || 0);
        } else {
          console.error("API returned success: false", data.error);
          setError(data.error || "Failed to fetch users");
        }
      } else {
        const errorData = await response.text();
        console.error("API request failed:", response.status, errorData);
        setError(`Failed to fetch users (${response.status})`);
      }
    } catch (err) {
      console.error("Network error in fetchUsers:", err);
      setError("Network error while fetching users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) {
      console.log("No token available for fetchStats");
      return;
    }

    try {
      console.log("Fetching user stats...");
      const response = await fetch("/api/admin/user-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Stats API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Stats API response data:", data);

        if (data.success) {
          setStats(data.data);
        } else {
          console.error("Stats API returned success: false", data.error);
        }
      } else {
        console.error("Stats API request failed:", response.status);
      }
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh users list
          fetchUsers();
          fetchStats();
        } else {
          setError(data.error || "Failed to update user status");
        }
      } else {
        setError("Failed to update user status");
      }
    } catch (err) {
      setError("Network error while updating user status");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!token) return;

    try {
      setDeletingUserId(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh users list
          fetchUsers();
          fetchStats();
          setConfirmDeleteUser(null);
        } else {
          setError(data.error || "Failed to delete user");
        }
      } else {
        setError("Failed to delete user");
      }
    } catch (err) {
      setError("Network error while deleting user");
    } finally {
      setDeletingUserId(null);
    }
  };

  const bulkDeleteUsers = async () => {
    if (!token || selectedUserIds.size === 0) return;

    try {
      setBulkDeleting(true);
      const response = await fetch("/api/admin/users/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: Array.from(selectedUserIds) }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh users list and clear selection
          fetchUsers();
          fetchStats();
          setSelectedUserIds(new Set());
          setShowBulkDeleteConfirm(false);
        } else {
          setError(data.error || "Failed to delete selected users");
        }
      } else {
        setError("Failed to delete selected users");
      }
    } catch (err) {
      setError("Network error while deleting users");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map((user) => user._id)));
    }
  };

  const exportUsers = async () => {
    if (!token) return;

    try {
      const params = new URLSearchParams({
        userType: selectedUserType !== "all" ? selectedUserType : "",
        status: selectedStatus !== "all" ? selectedStatus : "",
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/users/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "users-export.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        setError("Failed to export users");
      }
    } catch (err) {
      setError("Network error while exporting users");
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case "admin":
        return <Crown className="h-4 w-4" />;
      case "agent":
        return <Shield className="h-4 w-4" />;
      case "seller":
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const normalizedStatus = status || "active";
    const statusConfig = {
      active: {
        variant: "default" as const,
        className: "bg-green-100 text-green-800",
      },
      inactive: {
        variant: "secondary" as const,
        className: "bg-gray-100 text-gray-800",
      },
      suspended: {
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800",
      },
      pending: {
        variant: "outline" as const,
        className: "bg-yellow-100 text-yellow-800",
      },
    };

    const config =
      statusConfig[normalizedStatus as keyof typeof statusConfig] ||
      statusConfig.active;

    return (
      <Badge variant={config.variant} className={config.className}>
        {normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)}
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError("");
              fetchUsers();
            }}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsers}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verified Users
            </CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedUsers}</div>
            <p className="text-xs text-muted-foreground">Email verified</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">User Management</h3>
          <p className="text-sm text-gray-600">
            Manage all registered users on your platform
          </p>
        </div>
        <div className="flex space-x-2">
          {selectedUserIds.size > 0 && (
            <Button
              onClick={() => setShowBulkDeleteConfirm(true)}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedUserIds.size})
            </Button>
          )}
          <Button onClick={exportUsers} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedUserType} onValueChange={setSelectedUserType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="User Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="buyer">Buyer</SelectItem>
            <SelectItem value="seller">Seller</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm("");
            setSelectedUserType("all");
            setSelectedStatus("all");
            setCurrentPage(1);
          }}
        >
          <Filter className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        users.length > 0 &&
                        selectedUserIds.size === users.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-[#C70000] border-gray-300 rounded focus:ring-[#C70000]"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow
                      key={user._id}
                      className={
                        selectedUserIds.has(user._id) ? "bg-blue-50" : ""
                      }
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user._id)}
                          onChange={() => toggleUserSelection(user._id)}
                          className="w-4 h-4 text-[#C70000] border-gray-300 rounded focus:ring-[#C70000]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#C70000] rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.name?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                            {user.phone && (
                              <p className="text-xs text-gray-400">
                                {user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getUserTypeIcon(user.userType)}
                          <span className="capitalize">{user.userType}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.isVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.propertiesCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateUserStatus(
                                  user._id,
                                  user.status === "active"
                                    ? "inactive"
                                    : "active",
                                )
                              }
                            >
                              {user.status === "active" ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateUserStatus(user._id, "suspended")
                              }
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setConfirmDeleteUser(user)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-gray-500 py-8"
                    >
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * usersPerPage + 1} to{" "}
            {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers}{" "}
            users
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[#C70000] rounded-full flex items-center justify-center">
                  <span className="text-xl font-medium text-white">
                    {selectedUser.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <div className="flex items-center space-x-2">
                    {getUserTypeIcon(selectedUser.userType)}
                    <span className="capitalize">{selectedUser.userType}</span>
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedUser.email}</span>
                  </div>
                </div>
                {selectedUser.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Phone
                    </label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Joined
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {selectedUser.lastLogin && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Last Login
                    </label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {new Date(selectedUser.lastLogin).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {selectedUser.address && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Location
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>
                      {[
                        selectedUser.address.city,
                        selectedUser.address.state,
                        selectedUser.address.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    updateUserStatus(
                      selectedUser._id,
                      selectedUser.status === "active" ? "inactive" : "active",
                    )
                  }
                >
                  {selectedUser.status === "active" ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600"
                  onClick={() =>
                    updateUserStatus(selectedUser._id, "suspended")
                  }
                >
                  Suspend User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!confirmDeleteUser}
        onOpenChange={() => setConfirmDeleteUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          {confirmDeleteUser && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700 font-medium">
                    Warning: This action cannot be undone!
                  </p>
                </div>
                <p className="text-red-600 text-sm mt-2">
                  Deleting this user will also permanently remove all their
                  properties and associated data.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">User to be deleted:</p>
                <div className="mt-2 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#C70000] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {confirmDeleteUser.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{confirmDeleteUser.name}</p>
                    <p className="text-sm text-gray-500">
                      {confirmDeleteUser.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getUserTypeIcon(confirmDeleteUser.userType)}
                      <span className="text-xs capitalize">
                        {confirmDeleteUser.userType}
                      </span>
                      {getStatusBadge(confirmDeleteUser.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteUser(confirmDeleteUser._id)}
                  disabled={deletingUserId === confirmDeleteUser._id}
                >
                  {deletingUserId === confirmDeleteUser._id ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={showBulkDeleteConfirm}
        onOpenChange={() => setShowBulkDeleteConfirm(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Users</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <p className="text-red-700 font-medium">
                  Warning: This action cannot be undone!
                </p>
              </div>
              <p className="text-red-600 text-sm mt-2">
                Deleting these users will also permanently remove all their
                properties and associated data.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">
                You are about to delete {selectedUserIds.size} user
                {selectedUserIds.size > 1 ? "s" : ""}:
              </p>
              <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                {users
                  .filter((user) => selectedUserIds.has(user._id))
                  .map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center space-x-3 p-2 bg-white rounded border"
                    >
                      <div className="w-8 h-8 bg-[#C70000] rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {user.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <span className="text-xs capitalize px-2 py-1 bg-gray-100 rounded">
                        {user.userType}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowBulkDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={bulkDeleteUsers}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {selectedUserIds.size} User
                    {selectedUserIds.size > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Management Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-500" />
            <span>User Management Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  Suspend/Activate Toggle: Active
                </span>
              </div>
              <p className="text-sm text-green-700">
                Admin can suspend, activate, and deactivate users through the
                dropdown menu. Status changes are immediately saved to database
                and reflected in the interface.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800">
                  User Analytics: Active
                </span>
              </div>
              <p className="text-sm text-blue-700">
                User analytics module tracks user growth, activity, and type
                distribution. All data is dynamically calculated from the
                database.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
