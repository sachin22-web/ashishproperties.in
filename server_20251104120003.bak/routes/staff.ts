import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";

interface StaffMember {
  _id?: ObjectId;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role:
    | "super_admin"
    | "content_manager"
    | "sales_manager"
    | "support_executive"
    | "admin"
    | "property_moderator"
    | "custom_role";
  permissions: string[];
  status: "active" | "inactive" | "suspended";
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const rolePermissions = {
  super_admin: ["*"], // All permissions
  content_manager: [
    "content.view",
    "content.create",
    "content.edit",
    "content.delete",
    "content.publish",
    "categories.view",
    "categories.edit",
    "faq.view",
    "faq.edit",
    "analytics.view",
  ],
  sales_manager: [
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
  support_executive: [
    "users.view",
    "users.support",
    "support.tickets",
    "support.resolve",
    "chat.view",
    "chat.manage",
    "faq.view",
    "notifications.send",
  ],
  property_moderator: [
    "properties.view",
    "properties.edit",
    "properties.approve",
    "users.view",
    "categories.view",
    "analytics.view",
  ],
  admin: [
    "properties.view",
    "properties.edit",
    "users.view",
    "categories.view",
    "analytics.view",
  ],
  custom_role: [], // Will be filled with custom permissions
};

// Get all staff members
export const getAllStaff: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { role, status } = req.query;

    const filter: any = {};
    if (role && role !== "all") filter.role = role;
    if (status && status !== "all") filter.status = status;

    const staff = await db
      .collection("users")
      .find(
        {
          ...filter,
          $or: [{ userType: "admin" }, { role: { $exists: true } }],
        },
        { projection: { password: 0 } },
      )
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<StaffMember[]> = {
      success: true,
      data: staff as StaffMember[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch staff",
    });
  }
};

// Create new staff member with auto-generated credentials
export const createStaff: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      name,
      email,
      phone,
      role = "admin",
      status = "active",
      autoGeneratePassword = true,
    } = req.body;
    const createdBy = (req as any).userId;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Name and email are required",
      });
    }

    // Check if email already exists in users collection
    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: `User with email ${email} already exists. Please use a different email address.`,
      });
    }

    // Generate password if not provided
    let password = req.body.password;
    if (autoGeneratePassword || !password) {
      // Generate a secure random password
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$&";
      password = "";
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get permissions for role
    let permissions = req.body.permissions || [];

    // If not custom role, use predefined permissions
    if (role !== "custom_role") {
      permissions = rolePermissions[role] || rolePermissions.admin;
    } else if (!permissions || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Custom role requires at least one permission",
      });
    }

    // Create username from email (first part before @)
    const username = email.split("@")[0].toLowerCase();

    const newStaff: Omit<StaffMember, "_id"> = {
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      permissions,
      status,
      userType: "staff", // All staff members are userType: "staff"
      username, // Add username for login
      isFirstLogin: true, // Flag to force password change on first login
      loginCredentials: {
        username,
        tempPassword: password, // Store temporarily for email notification
        generatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    const result = await db.collection("users").insertOne(newStaff);

    // Log the credential creation for admin notification
    await db.collection("staff_notifications").insertOne({
      staffId: result.insertedId,
      type: "credentials_created",
      data: {
        name,
        email,
        username,
        role,
        password, // This will be shown to admin and sent via email
      },
      createdAt: new Date(),
      notifiedAt: null,
    });

    // Remove temporary password from response for security
    delete newStaff.loginCredentials.tempPassword;

    const response: ApiResponse<{
      _id: string;
      loginCredentials: {
        username: string;
        password: string;
        email: string;
        role: string;
      };
    }> = {
      success: true,
      data: {
        _id: result.insertedId.toString(),
        loginCredentials: {
          username,
          password, // Send password in response for admin to share
          email,
          role,
        },
      },
      message: `Staff member created successfully! Login credentials: Username: ${username}, Password: ${password}`,
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating staff:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create staff member",
    });
  }
};

// Update staff member
export const updateStaff: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { staffId } = req.params;
    const updateData = req.body;

    console.log("🔄 UpdateStaff called with:", { staffId, updateData });

    if (!ObjectId.isValid(staffId)) {
      console.error("❌ Invalid staff ID provided:", staffId);
      return res.status(400).json({
        success: false,
        error: "Invalid staff ID",
      });
    }

    // Check if staff member exists first
    const existingStaff = await db.collection("users").findOne({
      _id: new ObjectId(staffId)
    });

    if (!existingStaff) {
      console.error("❌ Staff member not found in database:", staffId);
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    console.log("✅ Found existing staff:", existingStaff._id);

    // Remove sensitive fields from update
    delete updateData._id;
    delete updateData.password; // Password updates should be separate
    delete updateData.createdAt;
    delete updateData.createdBy;

    // Check if email is being updated and if it conflicts with existing users
    if (updateData.email) {
      const existingUser = await db.collection("users").findOne({
        email: updateData.email,
        _id: { $ne: new ObjectId(staffId) }, // Exclude current user
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: `Email ${updateData.email} is already in use by another user. Please use a different email.`,
        });
      }
    }

    // Update permissions if role changed
    if (updateData.role) {
      if (updateData.role === "custom_role") {
        // For custom role, use provided permissions or keep existing
        if (!updateData.permissions || updateData.permissions.length === 0) {
          return res.status(400).json({
            success: false,
            error: "Custom role requires at least one permission",
          });
        }
      } else {
        // For predefined roles, use role-based permissions
        updateData.permissions =
          rolePermissions[updateData.role] || rolePermissions.admin;
      }
    }

    updateData.updatedAt = new Date();

    console.log("🔄 Updating staff with data:", updateData);

    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(staffId) }, { $set: updateData });

    console.log("📊 Update result:", {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      acknowledged: result.acknowledged
    });

    if (result.matchedCount === 0) {
      console.error("❌ Staff member not found during update, staffId:", staffId);
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    console.log("✅ Staff member updated successfully:", staffId);

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Staff member updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update staff member",
    });
  }
};

// Delete staff member
export const deleteStaff: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { staffId } = req.params;

    if (!ObjectId.isValid(staffId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid staff ID",
      });
    }

    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(staffId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Staff member deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete staff member",
    });
  }
};

// Update staff status
export const updateStaffStatus: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { staffId } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(staffId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid staff ID",
      });
    }

    if (!["active", "inactive", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(staffId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Staff status updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating staff status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update staff status",
    });
  }
};

// Update staff password
export const updateStaffPassword: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { staffId } = req.params;
    const { newPassword } = req.body;

    if (!ObjectId.isValid(staffId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid staff ID",
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(staffId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Password updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update password",
    });
  }
};

// Get available roles and permissions
export const getRolesAndPermissions: RequestHandler = async (req, res) => {
  try {
    const roles = [
      {
        id: "super_admin",
        name: "Super Admin",
        description: "Complete system access with all permissions",
        permissions: rolePermissions.super_admin,
      },
      {
        id: "content_manager",
        name: "Content Manager",
        description: "Manage website content, pages, and blogs",
        permissions: rolePermissions.content_manager,
      },
      {
        id: "sales_manager",
        name: "Sales Manager",
        description: "Manage properties, leads, and sales analytics",
        permissions: rolePermissions.sales_manager,
      },
      {
        id: "support_executive",
        name: "Support Executive",
        description: "Handle customer support and user queries",
        permissions: rolePermissions.support_executive,
      },
      {
        id: "property_moderator",
        name: "Property Moderator",
        description: "Review and moderate property listings",
        permissions: rolePermissions.property_moderator,
      },
      {
        id: "custom_role",
        name: "Custom Role",
        description: "Custom role with specific permissions",
        permissions: rolePermissions.custom_role,
      },
    ];

    const response: ApiResponse<any[]> = {
      success: true,
      data: roles,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch roles",
    });
  }
};

// Get available permissions grouped by category
export const getAvailablePermissions: RequestHandler = async (req, res) => {
  try {
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
        {
          key: "faq.view",
          label: "View FAQs",
          description: "View FAQ entries",
        },
        {
          key: "faq.edit",
          label: "Edit FAQs",
          description: "Edit FAQ entries",
        },
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

    const response: ApiResponse<any> = {
      success: true,
      data: availablePermissions,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch permissions",
    });
  }
};

// Check user permissions middleware
export const checkPermission = (permission: string) => {
  return (req: any, res: any, next: any) => {
    const userPermissions = req.userPermissions || [];
    const userRole = req.userRole;

    // Super admin has all permissions
    if (userRole === "super_admin" || userPermissions.includes("*")) {
      return next();
    }

    // Check if user has the specific permission
    if (userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: "Insufficient permissions",
    });
  };
};
