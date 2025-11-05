import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Shield,
  Crown,
  User,
  Settings,
  Check,
  X,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  CheckCircle,
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
import { Checkbox } from "../ui/checkbox";

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role:
    | "super_admin"
    | "content_manager"
    | "sales_manager"
    | "support_executive"
    | "admin";
  permissions: string[];
  status: "active" | "inactive" | "suspended";
  lastLogin?: string;
  createdAt: string;
  createdBy: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  icon: React.ElementType;
  color: string;
}

// Available permissions with categories
const availablePermissions = {
  "User Management": [
    {
      key: "users.view",
      label: "View Users",
      description: "View user profiles and information",
    },
    {
      key: "users.edit",
      label: "Edit Users",
      description: "Edit user profiles and settings",
    },
    {
      key: "users.delete",
      label: "Delete Users",
      description: "Delete user accounts",
    },
    {
      key: "users.support",
      label: "User Support",
      description: "Handle user support queries",
    },
    {
      key: "users.export",
      label: "Export Users",
      description: "Export user data",
    },
  ],
  "Property Management": [
    {
      key: "properties.view",
      label: "View Properties",
      description: "View property listings",
    },
    {
      key: "properties.edit",
      label: "Edit Properties",
      description: "Edit property information",
    },
    {
      key: "properties.delete",
      label: "Delete Properties",
      description: "Delete property listings",
    },
    {
      key: "properties.approve",
      label: "Approve Properties",
      description: "Approve/reject property listings",
    },
    {
      key: "properties.featured",
      label: "Feature Properties",
      description: "Mark properties as featured",
    },
    {
      key: "properties.export",
      label: "Export Properties",
      description: "Export property data",
    },
  ],
  "Content Management": [
    {
      key: "content.view",
      label: "View Content",
      description: "View pages and blog posts",
    },
    {
      key: "content.create",
      label: "Create Content",
      description: "Create pages and blog posts",
    },
    {
      key: "content.edit",
      label: "Edit Content",
      description: "Edit pages and blog posts",
    },
    {
      key: "content.delete",
      label: "Delete Content",
      description: "Delete pages and blog posts",
    },
    {
      key: "content.publish",
      label: "Publish Content",
      description: "Publish/unpublish content",
    },
  ],
  "Category Management": [
    {
      key: "categories.view",
      label: "View Categories",
      description: "View property categories",
    },
    {
      key: "categories.edit",
      label: "Edit Categories",
      description: "Edit property categories",
    },
    {
      key: "categories.create",
      label: "Create Categories",
      description: "Create new categories",
    },
    {
      key: "categories.delete",
      label: "Delete Categories",
      description: "Delete categories",
    },
  ],
  "Payment & Packages": [
    {
      key: "packages.view",
      label: "View Packages",
      description: "View advertisement packages",
    },
    {
      key: "packages.edit",
      label: "Edit Packages",
      description: "Edit advertisement packages",
    },
    {
      key: "transactions.view",
      label: "View Transactions",
      description: "View payment transactions",
    },
    {
      key: "transactions.manage",
      label: "Manage Transactions",
      description: "Approve/reject payments",
    },
    {
      key: "payment.settings",
      label: "Payment Settings",
      description: "Configure payment gateways",
    },
  ],
  "Analytics & Reports": [
    {
      key: "analytics.view",
      label: "View Analytics",
      description: "View dashboard analytics",
    },
    {
      key: "analytics.export",
      label: "Export Analytics",
      description: "Export analytics data",
    },
    {
      key: "reports.view",
      label: "View Reports",
      description: "View system reports",
    },
    {
      key: "reports.generate",
      label: "Generate Reports",
      description: "Generate custom reports",
    },
  ],
  "Chat & Communication": [
    {
      key: "chat.view",
      label: "View Chats",
      description: "View user conversations",
    },
    {
      key: "chat.manage",
      label: "Manage Chats",
      description: "Reply to user conversations",
    },
    {
      key: "notifications.send",
      label: "Send Notifications",
      description: "Send push notifications",
    },
    {
      key: "email.send",
      label: "Send Emails",
      description: "Send bulk emails",
    },
  ],
  "System Settings": [
    {
      key: "settings.view",
      label: "View Settings",
      description: "View system settings",
    },
    {
      key: "settings.edit",
      label: "Edit Settings",
      description: "Modify system settings",
    },
    {
      key: "staff.manage",
      label: "Manage Staff",
      description: "Manage staff members and roles",
    },
    {
      key: "system.backup",
      label: "System Backup",
      description: "Create system backups",
    },
  ],
  "FAQ & Support": [
    { key: "faq.view", label: "View FAQs", description: "View FAQ entries" },
    { key: "faq.edit", label: "Edit FAQs", description: "Edit FAQ entries" },
    {
      key: "support.tickets",
      label: "Support Tickets",
      description: "Handle support tickets",
    },
    {
      key: "support.resolve",
      label: "Resolve Issues",
      description: "Resolve user issues",
    },
  ],
};

const availableRoles: Role[] = [
  {
    id: "super_admin",
    name: "super_admin",
    displayName: "Super Admin",
    description: "Complete system access with all permissions",
    permissions: ["*"], // All permissions
    icon: Crown,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "content_manager",
    name: "content_manager",
    displayName: "Content Manager",
    description: "Manage website content, pages, and blogs",
    permissions: [
      "content.view",
      "content.create",
      "content.edit",
      "content.delete",
      "content.publish",
      "categories.view",
      "categories.edit",
      "faq.view",
      "faq.edit",
    ],
    icon: Edit,
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "sales_manager",
    name: "sales_manager",
    displayName: "Sales Manager",
    description: "Manage properties, leads, and sales analytics",
    permissions: [
      "properties.view",
      "properties.edit",
      "properties.approve",
      "properties.featured",
      "users.view",
      "analytics.view",
      "packages.view",
      "transactions.view",
      "reports.view",
    ],
    icon: UserCheck,
    color: "bg-green-100 text-green-800",
  },
  {
    id: "support_executive",
    name: "support_executive",
    displayName: "Support Executive",
    description: "Handle customer support and user queries",
    permissions: [
      "users.view",
      "users.support",
      "support.tickets",
      "support.resolve",
      "chat.view",
      "chat.manage",
      "faq.view",
      "notifications.send",
    ],
    icon: User,
    color: "bg-orange-100 text-orange-800",
  },
  {
    id: "property_moderator",
    name: "property_moderator",
    displayName: "Property Moderator",
    description: "Review and moderate property listings",
    permissions: [
      "properties.view",
      "properties.edit",
      "properties.approve",
      "users.view",
      "categories.view",
      "analytics.view",
    ],
    icon: Shield,
    color: "bg-cyan-100 text-cyan-800",
  },
  {
    id: "custom_role",
    name: "custom_role",
    displayName: "Custom Role",
    description: "Custom role with specific permissions",
    permissions: [],
    icon: Settings,
    color: "bg-gray-100 text-gray-800",
  },
];

export default function StaffManagement() {
  const { token, user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    password: string;
    email: string;
    role: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "admin" as any,
    permissions: [] as string[],
    status: "active" as "active" | "inactive" | "suspended",
    password: "",
  });

  useEffect(() => {
    fetchStaff();
  }, [token]);

  const fetchStaff = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStaff(data.data);
        } else {
          setError(data.error || "Failed to fetch staff");
        }
      } else {
        setError(
          `Failed to fetch staff: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      setError("Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token) return;

    // Validate form data
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (formData.role === "custom_role" && formData.permissions.length === 0) {
      setError("Custom role requires at least one permission");
      return;
    }

    try {
      setSaving(true);
      setError(""); // Clear previous errors

      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Show generated credentials if available
          if (data.data.loginCredentials) {
            setGeneratedCredentials(data.data.loginCredentials);
            setSuccess(data.message || "Staff member created successfully!");
          }
          fetchStaff();
          resetForm();
          setShowCreateDialog(false);
          setError(""); // Clear any previous errors
        } else {
          setError(data.error || "Failed to create staff member");
          // Don't close dialog on error so user can fix the issue
        }
      } else {
        setError("Failed to create staff member");
      }
    } catch (error) {
      console.error("Error creating staff:", error);
      setError("Failed to create staff member");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!token || !selectedStaff) return;

    // Validate form data
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (formData.role === "custom_role" && formData.permissions.length === 0) {
      setError("Custom role requires at least one permission");
      return;
    }

    try {
      setSaving(true);
      setError(""); // Clear previous errors

      const response = await fetch(`/api/admin/staff/${selectedStaff._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchStaff();
          resetForm();
          setShowEditDialog(false);
          setSelectedStaff(null);
          setError(""); // Clear any previous errors
          setSuccess("Staff member updated successfully!");
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError(data.error || "Failed to update staff member");
          // Don't close dialog on error so user can fix the issue
        }
      } else {
        setError("Failed to update staff member");
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      setError("Failed to update staff member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staffId: string) => {
    if (
      !token ||
      !confirm("Are you sure you want to delete this staff member?")
    )
      return;

    try {
      const response = await fetch(`/api/admin/staff/${staffId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setStaff(staff.filter((s) => s._id !== staffId));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete staff member");
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      setError("Failed to delete staff member");
    }
  };

  const handleStatusChange = async (staffId: string, newStatus: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/staff/${staffId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchStaff();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "admin",
      permissions: [],
      status: "active",
      password: "",
    });
  };

  const populateForm = (staff: StaffMember) => {
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone || "",
      role: staff.role,
      permissions: staff.permissions,
      status: staff.status,
      password: "", // Don't populate password
    });
  };

  const getRoleInfo = (roleName: string) => {
    return (
      availableRoles.find((role) => role.name === roleName) || availableRoles[4]
    ); // Default to admin
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { className: "bg-green-100 text-green-800", icon: Check },
      inactive: { className: "bg-gray-100 text-gray-800", icon: X },
      suspended: { className: "bg-red-100 text-red-800", icon: Lock },
    };

    const { className, icon: Icon } = config[status] || config.active;

    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
      </Badge>
    );
  };

  const handleRoleChange = (role: string) => {
    const roleInfo = getRoleInfo(role);
    setFormData({
      ...formData,
      role: role as any,
      permissions: roleInfo.permissions,
    });
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      (member.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (member.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    const matchesStatus =
      selectedStatus === "all" || member.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: staff.length,
    active: staff.filter((s) => s.status === "active").length,
    superAdmins: staff.filter((s) => s.role === "super_admin").length,
    contentManagers: staff.filter((s) => s.role === "content_manager").length,
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading staff...</p>
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
              fetchStaff();
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSuccess("")}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Generated Credentials Dialog */}
      {generatedCredentials && (
        <Dialog
          open={!!generatedCredentials}
          onOpenChange={() => setGeneratedCredentials(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Login Credentials Generated</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm mb-3">
                  Staff member has been created successfully! Here are the login
                  credentials:
                </p>

                <div className="space-y-3">
                  <div className="bg-white rounded p-3 border">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Username
                    </label>
                    <code className="text-sm font-mono text-gray-900">
                      {generatedCredentials.username}
                    </code>
                  </div>

                  <div className="bg-white rounded p-3 border">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Password
                    </label>
                    <code className="text-sm font-mono text-gray-900">
                      {generatedCredentials.password}
                    </code>
                  </div>

                  <div className="bg-white rounded p-3 border">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Role
                    </label>
                    <span className="text-sm capitalize">
                      {generatedCredentials.role.replace("_", " ")}
                    </span>
                  </div>

                  <div className="bg-white rounded p-3 border">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Staff Login URL
                    </label>
                    <code className="text-sm font-mono text-blue-600">
                      /staff/login
                    </code>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800 text-xs">
                    ⚠️ <strong>Important:</strong> Please share these
                    credentials securely with the staff member. They will be
                    required to change their password on first login.
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `POSTTRR Staff Login Credentials\n\nUsername: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}\nRole: ${generatedCredentials.role}\nLogin URL: ${window.location.origin}/staff/login\n\nPlease change your password after first login.`,
                    );
                    setSuccess("Credentials copied to clipboard!");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Copy All Details
                </Button>
                <Button
                  onClick={() => setGeneratedCredentials(null)}
                  className="flex-1 bg-[#C70000] hover:bg-[#A60000]"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Staff Management</h3>
          <p className="text-gray-600">
            Manage staff members, roles, and permissions
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#C70000] hover:bg-[#A60000]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All staff members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.superAdmins}
            </div>
            <p className="text-xs text-muted-foreground">Full access</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Content Managers
            </CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.contentManagers}
            </div>
            <p className="text-xs text-muted-foreground">Content access</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search staff..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {availableRoles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {role.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => {
                const roleInfo = getRoleInfo(member.role);
                return (
                  <TableRow key={member._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#C70000] rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {member.name ? member.name.charAt(0) : "U"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">
                            {member.email}
                          </p>
                          {member.phone && (
                            <p className="text-xs text-gray-400">
                              {member.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <roleInfo.icon className="h-4 w-4" />
                        <Badge className={roleInfo.color}>
                          {roleInfo.displayName}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>
                      {member.lastLogin
                        ? new Date(member.lastLogin).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStaff(member);
                            populateForm(member);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(
                              member._id,
                              member.status === "active"
                                ? "suspended"
                                : "active",
                            )
                          }
                        >
                          {member.status === "active" ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(member._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredStaff.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 py-8"
                  >
                    No staff members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter full name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email address..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Enter phone number..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Password *
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter password..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role *</label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      <div className="flex items-center space-x-2">
                        <role.icon className="h-4 w-4" />
                        <span>{role.displayName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.role && (
                <p className="text-sm text-gray-600 mt-1">
                  {getRoleInfo(formData.role).description}
                </p>
              )}
            </div>

            {/* Custom Permissions */}
            {(formData.role === "custom_role" ||
              formData.role === "super_admin") && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-3">
                  Permissions{" "}
                  {formData.role === "super_admin"
                    ? "(All permissions enabled)"
                    : "*"}
                </label>

                {formData.role === "super_admin" ? (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-purple-800 font-medium">
                      Super Admin Access
                    </p>
                    <p className="text-sm text-purple-600">
                      This role has complete access to all system features and
                      permissions.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {Object.entries(availablePermissions).map(
                      ([category, permissions]) => (
                        <div
                          key={category}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <Settings className="h-4 w-4 mr-2" />
                            {category}
                          </h4>
                          <div className="space-y-2">
                            {permissions.map((permission) => (
                              <div
                                key={permission.key}
                                className="flex items-start space-x-2"
                              >
                                <Checkbox
                                  id={permission.key}
                                  checked={formData.permissions.includes(
                                    permission.key,
                                  )}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        permissions: [
                                          ...prev.permissions,
                                          permission.key,
                                        ],
                                      }));
                                    } else {
                                      setFormData((prev) => ({
                                        ...prev,
                                        permissions: prev.permissions.filter(
                                          (p) => p !== permission.key,
                                        ),
                                      }));
                                    }
                                  }}
                                />
                                <div>
                                  <label
                                    htmlFor={permission.key}
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                  >
                                    {permission.label}
                                  </label>
                                  <p className="text-xs text-gray-500">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Permission Summary */}
            {formData.permissions.length > 0 &&
              formData.role !== "super_admin" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Selected Permissions ({formData.permissions.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.permissions.map((permission) => {
                      const permissionInfo = Object.values(availablePermissions)
                        .flat()
                        .find((p) => p.key === permission);
                      return (
                        <span
                          key={permission}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {permissionInfo?.label || permission}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

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
                disabled={
                  saving ||
                  !formData.name ||
                  !formData.email ||
                  !formData.password
                }
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff Member
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
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Same form fields as create dialog but for editing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter full name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email address..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role *</label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      <div className="flex items-center space-x-2">
                        <role.icon className="h-4 w-4" />
                        <span>{role.displayName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.role && (
                <p className="text-sm text-gray-600 mt-1">
                  {getRoleInfo(formData.role).description}
                </p>
              )}
            </div>

            {/* Custom Permissions for Edit */}
            {(formData.role === "custom_role" ||
              formData.role === "super_admin") && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-3">
                  Permissions{" "}
                  {formData.role === "super_admin"
                    ? "(All permissions enabled)"
                    : "*"}
                </label>

                {formData.role === "super_admin" ? (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-purple-800 font-medium">
                      Super Admin Access
                    </p>
                    <p className="text-sm text-purple-600">
                      This role has complete access to all system features and
                      permissions.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {Object.entries(availablePermissions).map(
                      ([category, permissions]) => (
                        <div
                          key={category}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <Settings className="h-4 w-4 mr-2" />
                            {category}
                          </h4>
                          <div className="space-y-2">
                            {permissions.map((permission) => (
                              <div
                                key={permission.key}
                                className="flex items-start space-x-2"
                              >
                                <Checkbox
                                  id={`edit_${permission.key}`}
                                  checked={formData.permissions.includes(
                                    permission.key,
                                  )}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        permissions: [
                                          ...prev.permissions,
                                          permission.key,
                                        ],
                                      }));
                                    } else {
                                      setFormData((prev) => ({
                                        ...prev,
                                        permissions: prev.permissions.filter(
                                          (p) => p !== permission.key,
                                        ),
                                      }));
                                    }
                                  }}
                                />
                                <div>
                                  <label
                                    htmlFor={`edit_${permission.key}`}
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                  >
                                    {permission.label}
                                  </label>
                                  <p className="text-xs text-gray-500">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Permission Summary for Edit */}
            {formData.permissions.length > 0 &&
              formData.role !== "super_admin" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Selected Permissions ({formData.permissions.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.permissions.map((permission) => {
                      const permissionInfo = Object.values(availablePermissions)
                        .flat()
                        .find((p) => p.key === permission);
                      return (
                        <span
                          key={permission}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {permissionInfo?.label || permission}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

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
                    <Edit className="h-4 w-4 mr-2" />
                    Update Staff Member
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
