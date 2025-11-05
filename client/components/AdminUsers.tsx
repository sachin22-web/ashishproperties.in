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
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Users,
} from "lucide-react";

interface AdminUsersProps {
  token: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  userType: "buyer" | "seller" | "agent" | "admin";
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  status?: "active" | "blocked" | "pending";
  verified?: boolean;
}

export default function AdminUsers({ token }: AdminUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    buyers: 0,
    sellers: 0,
    agents: 0,
    admins: 0,
  });
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [currentPage, userTypeFilter, statusFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (userTypeFilter !== "all") params.append("userType", userTypeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const userStats = data.data.usersByType.reduce(
          (acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
          },
          {},
        );

        setStats({
          total: data.data.totalUsers,
          buyers: userStats.buyer || 0,
          sellers: userStats.seller || 0,
          agents: userStats.agent || 0,
          admins: userStats.admin || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchUsers();
        alert("User status updated successfully!");
      } else {
        alert(data.error || "Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;

    try {
      setDeletingUserId(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchUsers();
        fetchUserStats();
        setConfirmDeleteUser(null);
      } else {
        setError(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "agent":
        return "bg-purple-100 text-purple-800";
      case "seller":
        return "bg-blue-100 text-blue-800";
      case "buyer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Button
          onClick={() => alert("Add user functionality coming soon!")}
          className="bg-[#C70000] hover:bg-[#A60000] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Buyers</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.buyers}
              </p>
            </div>
            <User className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sellers</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.sellers}
              </p>
            </div>
            <User className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Agents</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.agents}
              </p>
            </div>
            <User className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
            </div>
            <Shield className="h-8 w-8 text-red-400" />
          </div>
        </div>
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
                placeholder="Search users..."
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Type
            </label>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buyer">Buyers</SelectItem>
                <SelectItem value="seller">Sellers</SelectItem>
                <SelectItem value="agent">Agents</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchTerm("");
                setUserTypeFilter("all");
                setStatusFilter("all");
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

      {/* Users List */}
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user._id} className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {user.name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {user.email}
                    </p>
                    <p className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {user.phone}
                    </p>
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    {user.lastLogin && (
                      <p className="flex items-center text-xs">
                        <CheckCircle className="h-3 w-3 mr-2" />
                        Last login:{" "}
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <div className="flex space-x-2">
                  <Badge className={getUserTypeColor(user.userType)}>
                    {user.userType}
                  </Badge>
                  <Badge className={getStatusColor(user.status || "active")}>
                    {user.status || "active"}
                  </Badge>
                </div>

                {user.verified && (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verified
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
              <Button size="sm" variant="outline">
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>

              {/* Status Change */}
              <Select
                value={user.status || "active"}
                onValueChange={(value) => handleStatusChange(user._id, value)}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" variant="outline">
                <Mail className="h-4 w-4 mr-1" />
                Send Email
              </Button>

              {user.userType !== "admin" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDeleteUser(user)}
                  className="text-red-600 border-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
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

      {users.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Users Found
          </h3>
          <p className="text-gray-600 mb-4">
            No users match your current filters or search criteria.
          </p>
          <Button
            onClick={() => {
              setSearchTerm("");
              setUserTypeFilter("all");
              setStatusFilter("all");
            }}
            variant="outline"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <p className="text-red-700 font-medium">Warning: This action cannot be undone!</p>
                </div>
                <p className="text-red-600 text-sm mt-2">
                  Deleting this user will also remove all their properties and associated data.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">User to be deleted:</p>
                <div className="mt-2 flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{confirmDeleteUser.name}</p>
                    <p className="text-sm text-gray-500">{confirmDeleteUser.email}</p>
                    <p className="text-sm text-gray-500">{confirmDeleteUser.phone}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getUserTypeColor(confirmDeleteUser.userType)}>
                        {confirmDeleteUser.userType}
                      </Badge>
                      <Badge className={getStatusColor(confirmDeleteUser.status || "active")}>
                        {confirmDeleteUser.status || "active"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteUser(confirmDeleteUser._id)}
                  disabled={deletingUserId === confirmDeleteUser._id}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deletingUserId === confirmDeleteUser._id ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
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
          </div>
        </div>
      )}
    </div>
  );
}
