import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse, Category } from "@shared/types";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { clearCategoriesCache } from "../utils/categoryCache";

// Get all users (admin only)
export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    let db;
    try {
      db = getDatabase();
    } catch (dbError) {
      // Database not initialized yet
      return res.status(503).json({
        success: false,
        error:
          "Database connection is being established. Please try again in a moment.",
      });
    }
    const { page = "1", limit = "20", userType, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};
    if (userType && userType !== "all") {
      filter.userType = userType;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await db
      .collection("users")
      .find(filter, { projection: { password: 0 } }) // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("users").countDocuments(filter);

    const response: ApiResponse<{
      users: any[];
      total: number;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        users: users as any[],
        total,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
};

// Get user-specific statistics for user management page
export const getUserManagementStats: RequestHandler = async (req, res) => {
  try {
    let db;
    try {
      db = getDatabase();
    } catch (dbError) {
      // Database not initialized yet
      return res.status(503).json({
        success: false,
        error:
          "Database connection is being established. Please try again in a moment.",
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, activeUsers, newUsers, verifiedUsers] =
      await Promise.all([
        db.collection("users").countDocuments(),
        db.collection("users").countDocuments({ status: "active" }),
        db.collection("users").countDocuments({
          createdAt: { $gte: thirtyDaysAgo },
        }),
        db.collection("users").countDocuments({ isVerified: true }),
      ]);

    const response: ApiResponse<{
      totalUsers: number;
      activeUsers: number;
      newUsers: number;
      verifiedUsers: number;
    }> = {
      success: true,
      data: {
        totalUsers,
        activeUsers,
        newUsers,
        verifiedUsers,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user statistics",
    });
  }
};

// Export users to CSV
export const exportUsers: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { userType, status, search } = req.query;

    // Build filter
    const filter: any = {};
    if (userType && userType !== "all") {
      filter.userType = userType;
    }
    if (status && status !== "all") {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await db
      .collection("users")
      .find(filter, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    // Convert to CSV
    const csvHeaders =
      "Name,Email,Phone,User Type,Status,Join Date,Last Login,Verified\n";
    const csvData = users
      .map((user: any) => {
        return [
          user.name || "",
          user.email || "",
          user.phone || "",
          user.userType || "",
          user.status || "active",
          user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "",
          user.lastLogin
            ? new Date(user.lastLogin).toLocaleDateString()
            : "Never",
          user.isVerified ? "Yes" : "No",
        ]
          .map((field) => `"${field}"`)
          .join(",");
      })
      .join("\n");

    const csv = csvHeaders + csvData;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="users-export.csv"',
    );
    res.send(csv);
  } catch (error) {
    console.error("Error exporting users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export users",
    });
  }
};

// Get user statistics
export const getUserStats: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Test database connection
    await db.admin().ping();
    console.log("✅ Database connection verified for admin stats");

    const stats = await db
      .collection("users")
      .aggregate([
        {
          $group: {
            _id: "$userType",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const totalUsers = await db.collection("users").countDocuments();
    const totalProperties = await db.collection("properties").countDocuments();
    const activeProperties = await db
      .collection("properties")
      .countDocuments({ status: "active" });

    const response: ApiResponse<{
      totalUsers: number;
      totalProperties: number;
      activeProperties: number;
      usersByType: any[];
    }> = {
      success: true,
      data: {
        totalUsers,
        totalProperties,
        activeProperties,
        usersByType: stats,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
};

// Update user status (activate/deactivate)
export const updateUserStatus: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { userId } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          status: status,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "User status updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user status",
    });
  }
};

// Delete user
export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    // Also delete user's properties
    await db.collection("properties").deleteMany({ ownerId: userId });

    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "User deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
    });
  }
};

// Bulk delete users
export const bulkDeleteUsers: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid user IDs array",
      });
    }

    // Validate all IDs are valid ObjectIds
    for (const id of ids) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: `Invalid user ID: ${id}`,
        });
      }
    }

    const objectIds = ids.map((id) => new ObjectId(id));

    // Delete associated properties for all users
    await db.collection("properties").deleteMany({
      ownerId: { $in: ids },
    });

    // Delete the users
    const result = await db
      .collection("users")
      .deleteMany({ _id: { $in: objectIds } });

    const response: ApiResponse<{ message: string; deletedCount: number }> = {
      success: true,
      data: {
        message: `${result.deletedCount} users deleted successfully`,
        deletedCount: result.deletedCount,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error bulk deleting users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to bulk delete users",
    });
  }
};

// Get all properties (admin view)
export const getAllProperties: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "20", status, search, promotion } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};
    // Exclude deleted properties by default
    filter.isDeleted = { $ne: true };

    if (status && status !== "all") {
      filter.status = status;
    }
    if (promotion && promotion !== "all") {
      if (promotion === "paid") {
        filter.premium = true;
      } else if (promotion === "free") {
        filter.$or = [{ premium: { $exists: false } }, { premium: false }];
      } else if (promotion === "featured") {
        filter.featured = true;
      }
    }
    if (search) {
      const searchConditions = [
        { title: { $regex: search, $options: "i" } },
        { "location.address": { $regex: search, $options: "i" } },
        { "contactInfo.name": { $regex: search, $options: "i" } },
      ];

      if (filter.$or) {
        // If promotion filter already added $or, combine with search
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const properties = await db
      .collection("properties")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("properties").countDocuments(filter);

    console.log(
      `📊 Found ${properties.length} properties out of ${total} total`,
    );
    if (properties.length > 0) {
      console.log(`📊 First property:`, {
        _id: properties[0]._id,
        title: properties[0].title,
        approvalStatus: properties[0].approvalStatus,
      });
    }

    const response: ApiResponse<{
      properties: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        properties: properties as any[],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch properties",
    });
  }
};

// Initialize admin user
export const initializeAdmin: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Check if admin already exists
    const existingAdmin = await db
      .collection("users")
      .findOne({ userType: "admin" });

    if (existingAdmin) {
      return res.json({
        success: true,
        message: "Admin user already exists",
      });
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = {
      name: "Administrator",
      email: "admin@aashishproperty.com",
      phone: "+91 9876543210",
      password: hashedPassword,
      userType: "admin",
      preferences: {
        propertyTypes: [],
        priceRange: { min: 0, max: 10000000 },
        locations: [],
      },
      favorites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("users").insertOne(adminUser);

    res.json({
      success: true,
      message: "Admin user created successfully",
      data: {
        email: "admin@aashishproperty.com",
        password: "admin123",
      },
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create admin user",
    });
  }
};

// Get all categories (admin view)
export const getAdminCategories: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const categories = await db
      .collection("categories")
      .find({})
      .sort({ order: 1 })
      .toArray();

    // Get property counts for each category and subcategory
    const propertiesAgg = await db
      .collection("properties")
      .aggregate([
        {
          $group: {
            _id: {
              propertyType: "$propertyType",
              subCategory: "$subCategory",
            },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Map counts to categories
    const categoriesWithCounts = categories.map((category: any) => {
      const categoryCount = propertiesAgg
        .filter((p) => p._id.propertyType === category.slug)
        .reduce((sum, p) => sum + p.count, 0);

      const subcategoriesWithCounts = category.subcategories.map((sub: any) => {
        const subCount =
          propertiesAgg.find(
            (p) =>
              p._id.propertyType === category.slug &&
              p._id.subCategory === sub.slug,
          )?.count || 0;

        return { ...sub, count: subCount };
      });

      return {
        ...category,
        count: categoryCount,
        subcategories: subcategoriesWithCounts,
      };
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: categoriesWithCounts,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching admin categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
};

// Create new category
export const createCategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      name,
      slug,
      icon,
      description,
      subcategories = [],
      order,
    } = req.body;

    // Check if slug already exists
    const existingCategory = await db
      .collection("categories")
      .findOne({ slug });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: "Category with this slug already exists",
      });
    }

    const newCategory: Omit<Category, "_id"> = {
      name,
      slug,
      icon,
      description,
      subcategories,
      order: order || 999,
      active: true,
    };

    const result = await db.collection("categories").insertOne(newCategory);

    // Clear public categories cache so changes appear to users immediately
    try {
      clearCategoriesCache();
    } catch (e) {}

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create category",
    });
  }
};

// Update category
export const updateCategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { categoryId } = req.params;
    const updateData = req.body;

    delete updateData._id; // Remove _id from update data

    const result = await db
      .collection("categories")
      .updateOne({ _id: new ObjectId(categoryId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    // Clear public categories cache so changes appear to users immediately
    try {
      clearCategoriesCache();
    } catch (e) {}

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Category updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update category",
    });
  }
};

// Delete category
export const deleteCategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { categoryId } = req.params;

    // Check if category has associated properties
    const category = await db
      .collection("categories")
      .findOne({ _id: new ObjectId(categoryId) });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    const propertiesCount = await db
      .collection("properties")
      .countDocuments({ propertyType: category.slug });

    if (propertiesCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It has ${propertiesCount} associated properties.`,
      });
    }

    await db
      .collection("categories")
      .deleteOne({ _id: new ObjectId(categoryId) });

    // Clear public categories cache so changes appear to users immediately
    try {
      clearCategoriesCache();
    } catch (e) {}

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Category deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete category",
    });
  }
};

// Update property (admin only)
export const updateProperty: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyId } = req.params;

    // Handle new image uploads
    const newImages: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: any) => {
        newImages.push(`/uploads/properties/${file.filename}`);
      });
    }

    // Parse JSON fields if they come as strings
    const location =
      typeof req.body.location === "string"
        ? JSON.parse(req.body.location)
        : req.body.location;

    const contactInfo =
      typeof req.body.contactInfo === "string"
        ? JSON.parse(req.body.contactInfo)
        : req.body.contactInfo;

    // Get existing property to preserve existing images
    const existingProperty = await db
      .collection("properties")
      .findOne({ _id: new ObjectId(propertyId) });

    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    // Combine existing images with new images
    const combinedImages = [...(existingProperty.images || []), ...newImages];

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      price: parseInt(req.body.price),
      priceType: req.body.priceType,
      propertyType: req.body.propertyType,
      subCategory: req.body.subCategory,
      location,
      contactInfo,
      status: req.body.status,
      images: combinedImages,
      updatedAt: new Date(),
    };

    const result = await db
      .collection("properties")
      .updateOne({ _id: new ObjectId(propertyId) }, { $set: updateData });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Property updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating property:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update property",
    });
  }
};

// Create property (admin only)
export const createProperty: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Handle image uploads
    const images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: any) => {
        images.push(`/uploads/properties/${file.filename}`);
      });
    }

    // Parse JSON fields if they come as strings
    const location =
      typeof req.body.location === "string"
        ? JSON.parse(req.body.location)
        : req.body.location;

    const contactInfo =
      typeof req.body.contactInfo === "string"
        ? JSON.parse(req.body.contactInfo)
        : req.body.contactInfo;

    const propertyData = {
      title: req.body.title,
      description: req.body.description,
      price: parseInt(req.body.price),
      priceType: req.body.priceType,
      propertyType: req.body.propertyType,
      subCategory: req.body.subCategory,
      location,
      specifications: {
        bedrooms: "",
        bathrooms: "",
        area: req.body.area || "",
        facing: "",
        floor: "",
        totalFloors: "",
        parking: "",
        furnished: "",
      },
      images,
      amenities: [],
      ownerId: "admin",
      ownerType: "admin",
      contactInfo,
      status: req.body.status || "active",
      approvalStatus: "approved", // Admin added properties are auto-approved
      featured: false,
      premium: false,
      contactVisible: true,
      views: 0,
      inquiries: 0,
      phoneClicks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("properties").insertOne(propertyData);

    // Get the created property
    const createdProperty = await db
      .collection("properties")
      .findOne({ _id: result.insertedId });

    const response: ApiResponse<any> = {
      success: true,
      data: createdProperty,
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating property:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create property",
    });
  }
};

// Get premium properties for approval (admin only)
export const getPremiumProperties: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const premiumProperties = await db
      .collection("properties")
      .find({ premium: true })
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<any[]> = {
      success: true,
      data: premiumProperties,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching premium properties:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch premium properties",
    });
  }
};

// Approve or reject premium property (admin only)
export const approvePremiumProperty: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyId } = req.params;
    const { action, adminComments } = req.body;
    const adminId = (req as any).userId;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action. Must be 'approve' or 'reject'",
      });
    }

    const updateData: any = {
      premiumApprovalStatus: action === "approve" ? "approved" : "rejected",
      updatedAt: new Date(),
    };

    if (action === "approve") {
      updateData.premiumApprovedAt = new Date();
      updateData.premiumApprovedBy = adminId;
      updateData.contactVisible = true; // Show contact info once approved
      updateData.status = "active"; // Make property visible on frontend
      updateData.approvalStatus = "approved"; // Also update general approval status
      updateData.isApproved = true;
    } else if (action === "reject") {
      updateData.status = "rejected";
      updateData.approvalStatus = "rejected";
      updateData.isApproved = false;
    }

    if (adminComments) {
      updateData.adminComments = adminComments;
    }

    const result = await db
      .collection("properties")
      .updateOne({ _id: new ObjectId(propertyId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: `Premium property ${action}d successfully` },
    };

    res.json(response);
  } catch (error) {
    console.error("Error approving premium property:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve premium property",
    });
  }
};

// Delete property (admin only) - Soft delete
export const deleteProperty: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyId } = req.params;
    const adminId = (req as any).user?.userId;

    const result = await db.collection("properties").updateOne(
      { _id: new ObjectId(propertyId) },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: adminId,
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Property deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete property",
    });
  }
};

// Bulk delete properties (admin only) - Soft delete
export const bulkDeleteProperties: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyIds } = req.body;
    const adminId = (req as any).user?.userId;

    console.log("🗑️ Bulk delete request received");
    console.log("📋 Property IDs:", propertyIds);
    console.log("📋 Admin ID:", adminId);

    if (
      !propertyIds ||
      !Array.isArray(propertyIds) ||
      propertyIds.length === 0
    ) {
      console.error("❌ Invalid propertyIds:", propertyIds);
      return res.status(400).json({
        success: false,
        error: "Property IDs array is required",
      });
    }

    const objectIds: ObjectId[] = [];
    for (const id of propertyIds) {
      const idString = String(id);
      if (!ObjectId.isValid(idString)) {
        console.error(`❌ Invalid ObjectId: ${idString}`);
        return res.status(400).json({
          success: false,
          error: `Invalid property ID format: ${idString}`,
        });
      }
      try {
        objectIds.push(new ObjectId(idString));
      } catch (err) {
        console.error(`❌ Error creating ObjectId from ${idString}:`, err);
        return res.status(400).json({
          success: false,
          error: `Failed to process property ID: ${idString}`,
        });
      }
    }

    console.log(
      `✅ Valid ObjectIds created:`,
      objectIds.map((id) => id.toString()),
    );

    const result = await db.collection("properties").updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: adminId,
        },
      },
    );

    const response: ApiResponse<{ message: string; deletedCount: number }> = {
      success: true,
      data: {
        message: `${result.modifiedCount} properties deleted successfully`,
        deletedCount: result.modifiedCount,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error("❌ Error bulk deleting properties:", error);
    console.error("📋 Error stack:", error?.stack);
    console.error("📋 Request body:", req.body);
    res.status(500).json({
      success: false,
      error: "Failed to bulk delete properties",
      details: error?.message,
    });
  }
};

// Get deleted properties (admin only)
export const getDeletedProperties: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const deletedProperties = await db
      .collection("properties")
      .find({ isDeleted: true })
      .sort({ deletedAt: -1 })
      .toArray();

    const response: ApiResponse<Property[]> = {
      success: true,
      data: deletedProperties as Property[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching deleted properties:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch deleted properties",
    });
  }
};

// Restore deleted property (admin only)
export const restoreProperty: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyId } = req.params;

    const result = await db.collection("properties").updateOne(
      { _id: new ObjectId(propertyId), isDeleted: true },
      {
        $unset: { isDeleted: "", deletedAt: "", deletedBy: "" },
        $set: { updatedAt: new Date() },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Deleted property not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Property restored successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error restoring property:", error);
    res.status(500).json({
      success: false,
      error: "Failed to restore property",
    });
  }
};

// Bulk restore properties (admin only)
export const restoreProperties: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyIds } = req.body;

    if (
      !propertyIds ||
      !Array.isArray(propertyIds) ||
      propertyIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Property IDs array is required",
      });
    }

    const objectIds: ObjectId[] = [];
    for (const id of propertyIds) {
      const idString = String(id);
      if (!ObjectId.isValid(idString)) {
        return res.status(400).json({
          success: false,
          error: `Invalid property ID format: ${idString}`,
        });
      }
      objectIds.push(new ObjectId(idString));
    }

    const result = await db.collection("properties").updateMany(
      { _id: { $in: objectIds }, isDeleted: true },
      {
        $unset: { isDeleted: "", deletedAt: "", deletedBy: "" },
        $set: { updatedAt: new Date() },
      },
    );

    const response: ApiResponse<{ message: string; restoredCount: number }> = {
      success: true,
      data: {
        message: `${result.modifiedCount} properties restored successfully`,
        restoredCount: result.modifiedCount,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error bulk restoring properties:", error);
    console.error("📋 Error details:", error?.message);
    res.status(500).json({
      success: false,
      error: "Failed to bulk restore properties",
    });
  }
};

// Permanently delete property (admin only)
export const permanentDeleteProperty: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyId } = req.params;

    const result = await db
      .collection("properties")
      .deleteOne({ _id: new ObjectId(propertyId), isDeleted: true });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Deleted property not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Property permanently deleted" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error permanently deleting property:", error);
    res.status(500).json({
      success: false,
      error: "Failed to permanently delete property",
    });
  }
};

// Bulk permanently delete properties (admin only)
export const permanentDeleteProperties: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyIds } = req.body;

    if (
      !propertyIds ||
      !Array.isArray(propertyIds) ||
      propertyIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Property IDs array is required",
      });
    }

    const objectIds: ObjectId[] = [];
    for (const id of propertyIds) {
      const idString = String(id);
      if (!ObjectId.isValid(idString)) {
        return res.status(400).json({
          success: false,
          error: `Invalid property ID format: ${idString}`,
        });
      }
      objectIds.push(new ObjectId(idString));
    }

    const result = await db
      .collection("properties")
      .deleteMany({ _id: { $in: objectIds }, isDeleted: true });

    const response: ApiResponse<{ message: string; deletedCount: number }> = {
      success: true,
      data: {
        message: `${result.deletedCount} properties permanently deleted`,
        deletedCount: result.deletedCount,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error bulk permanently deleting properties:", error);
    console.error("📋 Error details:", error?.message);
    res.status(500).json({
      success: false,
      error: "Failed to bulk permanently delete properties",
    });
  }
};

// Bulk update properties status (admin only)
export const bulkUpdatePropertiesStatus: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyIds, status } = req.body;

    if (
      !propertyIds ||
      !Array.isArray(propertyIds) ||
      propertyIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Property IDs array is required",
      });
    }

    if (!status || !["active", "inactive", "sold", "rented"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Valid status is required (active, inactive, sold, rented)",
      });
    }

    const objectIds: ObjectId[] = [];
    for (const id of propertyIds) {
      const idString = String(id);
      if (!ObjectId.isValid(idString)) {
        return res.status(400).json({
          success: false,
          error: `Invalid property ID format: ${idString}`,
        });
      }
      objectIds.push(new ObjectId(idString));
    }
    const result = await db
      .collection("properties")
      .updateMany(
        { _id: { $in: objectIds } },
        { $set: { status, updatedAt: new Date() } },
      );

    const response: ApiResponse<{ message: string; updatedCount: number }> = {
      success: true,
      data: {
        message: `${result.modifiedCount} properties updated successfully`,
        updatedCount: result.modifiedCount,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error bulk updating properties status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to bulk update properties status",
    });
  }
};

// Bulk update properties approval status (admin only)
export const bulkUpdatePropertiesApproval: RequestHandler = async (
  req,
  res,
) => {
  try {
    const db = getDatabase();
    const { propertyIds, approvalStatus } = req.body;

    if (
      !propertyIds ||
      !Array.isArray(propertyIds) ||
      propertyIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Property IDs array is required",
      });
    }

    if (
      !approvalStatus ||
      !["pending", "approved", "rejected"].includes(approvalStatus)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Valid approval status is required (pending, approved, rejected)",
      });
    }

    const objectIds: ObjectId[] = [];
    for (const id of propertyIds) {
      const idString = String(id);
      if (!ObjectId.isValid(idString)) {
        return res.status(400).json({
          success: false,
          error: `Invalid property ID format: ${idString}`,
        });
      }
      objectIds.push(new ObjectId(idString));
    }
    const result = await db
      .collection("properties")
      .updateMany(
        { _id: { $in: objectIds } },
        { $set: { approvalStatus, updatedAt: new Date() } },
      );

    const response: ApiResponse<{ message: string; updatedCount: number }> = {
      success: true,
      data: {
        message: `${result.modifiedCount} properties approval updated successfully`,
        updatedCount: result.modifiedCount,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error bulk updating properties approval:", error);
    res.status(500).json({
      success: false,
      error: "Failed to bulk update properties approval",
    });
  }
};

// Upload category icon
export const uploadCategoryIcon: RequestHandler = async (req, res) => {
  try {
    // In a real implementation, you would handle file upload here using multer
    // For now, we'll return a placeholder URL
    const iconUrl = `/uploads/category-icons/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;

    const response: ApiResponse<{ iconUrl: string }> = {
      success: true,
      data: { iconUrl },
    };

    res.json(response);
  } catch (error) {
    console.error("Error uploading category icon:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload category icon",
    });
  }
};

// Get user analytics
export const getUserAnalytics: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { days = "30" } = req.query;
    const daysNum = parseInt(days as string);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysNum);

    // Get basic user counts
    const totalUsers = await db.collection("users").countDocuments();
    const activeUsers = await db
      .collection("users")
      .countDocuments({ status: "active" });
    const verifiedUsers = await db
      .collection("users")
      .countDocuments({ isVerified: true });
    const newUsers = await db.collection("users").countDocuments({
      createdAt: { $gte: fromDate },
    });

    // Get users by type
    const usersByType = await db
      .collection("users")
      .aggregate([
        {
          $group: {
            _id: "$userType",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Get user growth over time (last 30 days)
    const userGrowth = await db
      .collection("users")
      .aggregate([
        {
          $match: {
            createdAt: { $gte: fromDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Generate user activity data (mock for now - could track login data)
    const userActivity = userGrowth.map((item) => ({
      date: item._id,
      active: Math.floor(item.count * 0.7), // Mock active users
      new: item.count,
    }));

    const response: ApiResponse<{
      totalUsers: number;
      newUsers: number;
      activeUsers: number;
      verifiedUsers: number;
      usersByType: any[];
      userGrowth: any[];
      userActivity: any[];
    }> = {
      success: true,
      data: {
        totalUsers,
        newUsers,
        activeUsers,
        verifiedUsers,
        usersByType,
        userGrowth: userGrowth.map((item) => ({
          date: item._id,
          count: item.count,
        })),
        userActivity,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user analytics",
    });
  }
};

// Update property promotion status
export const updatePropertyPromotion: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyId } = req.params;
    const updates = req.body;

    const result = await db.collection("properties").updateOne(
      { _id: new ObjectId(propertyId) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Property promotion updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating property promotion:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update property promotion",
    });
  }
};

// Debug endpoint to check database properties
export const debugProperties: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    console.log("🔍 Debugging database properties...");

    const totalProperties = await db.collection("properties").countDocuments();
    const properties = await db
      .collection("properties")
      .find({})
      .limit(5)
      .toArray();

    console.log(`📊 Total properties in database: ${totalProperties}`);
    console.log(
      `📊 Sample properties:`,
      properties.map((p) => ({
        _id: p._id,
        title: p.title,
        approvalStatus: p.approvalStatus,
      })),
    );

    res.json({
      success: true,
      data: {
        totalProperties,
        sampleProperties: properties.map((p) => ({
          _id: p._id,
          title: p.title,
          approvalStatus: p.approvalStatus,
          hasAllFields: !!(p._id && p.title && p.approvalStatus),
        })),
      },
    });
  } catch (error) {
    console.error("Error debugging properties:", error);
    res.status(500).json({
      success: false,
      error: "Failed to debug properties",
    });
  }
};

// Create test property with pending approval
export const createTestProperty: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    console.log("🏗️ Creating test property...");

    const testProperty = {
      title: "Test Property for Approval - " + new Date().toLocaleString(),
      description:
        "This is a test property created to test the approval system",
      price: 2500000,
      priceType: "sale",
      propertyType: "residential",
      subCategory: "2bhk",
      location: {
        sector: "Sector 14",
        area: "Sector 14",
        city: "Rohtak",
        state: "Haryana",
        address: "Sector 14, Rohtak, Haryana",
        coordinates: { lat: 28.8955, lng: 76.6066 },
      },
      specifications: {
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        facing: "North",
        floor: 3,
        totalFloors: 5,
        parking: true,
        furnished: "semi-furnished",
      },
      images: ["/placeholder.svg"],
      amenities: ["Power Backup", "Lift", "Security", "Parking"],
      ownerId: "687546eb215b93d0cdf0f552", // Admin user ID
      ownerType: "admin",
      contactInfo: {
        name: "Admin Test",
        phone: "9876543210",
        email: "admin@rohtakolx.com",
      },
      status: "active",
      featured: false,
      views: 0,
      approvalStatus: "pending",
      approvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("properties").insertOne(testProperty);
    console.log("�� Test property created with ID:", result.insertedId);

    // Also create a few more test properties for testing
    const moreTestProperties = [
      {
        ...testProperty,
        title: "Second Test Property - Pending Approval",
        price: 3500000,
        subCategory: "3bhk",
        approvalStatus: "pending",
      },
      {
        ...testProperty,
        title: "Third Test Property - Already Approved",
        price: 4500000,
        subCategory: "4bhk",
        approvalStatus: "approved",
        approvedAt: new Date(),
      },
    ];

    const moreResults = await db
      .collection("properties")
      .insertMany(moreTestProperties);
    console.log(
      "✅ Additional test properties created:",
      moreResults.insertedIds,
    );

    res.json({
      success: true,
      data: {
        message: `${moreTestProperties.length + 1} test properties created successfully`,
        propertyIds: [
          result.insertedId,
          ...Object.values(moreResults.insertedIds),
        ],
        mainProperty: { ...testProperty, _id: result.insertedId },
      },
    });
  } catch (error) {
    console.error("Error creating test property:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create test property",
    });
  }
};

// Update property approval status
export const updatePropertyApproval: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyId } = req.params;
    const { approvalStatus } = req.body;

    console.log(`🔄 Property approval request received:`);
    console.log(`📋 URL path: ${req.path}`);
    console.log(`📋 Route params:`, req.params);
    console.log(`📋 Property ID: ${propertyId}`);
    console.log(`📋 Approval status: ${approvalStatus}`);

    // Validate propertyId format
    if (!propertyId) {
      console.error(`❌ Property ID is missing`);
      return res.status(400).json({
        success: false,
        error: "Property ID is required",
      });
    }

    if (!ObjectId.isValid(propertyId)) {
      console.error(`❌ Invalid property ID format: ${propertyId}`);
      return res.status(400).json({
        success: false,
        error: "Invalid property ID format",
      });
    }

    // Validate approvalStatus
    if (!["approved", "rejected", "pending"].includes(approvalStatus)) {
      console.error(`❌ Invalid approval status: ${approvalStatus}`);
      return res.status(400).json({
        success: false,
        error: "Invalid approval status",
      });
    }

    // First check if property exists
    const existingProperty = await db
      .collection("properties")
      .findOne({ _id: new ObjectId(propertyId) });

    if (!existingProperty) {
      console.error(`❌ Property not found: ${propertyId}`);
      console.log(
        `🔍 Available properties in DB:`,
        await db
          .collection("properties")
          .find({}, { projection: { _id: 1, title: 1 } })
          .limit(5)
          .toArray(),
      );
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    console.log(`✅ Found property: ${existingProperty.title}`);

    const updateData: any = {
      approvalStatus,
      approvedAt: approvalStatus === "approved" ? new Date() : null,
      updatedAt: new Date(),
    };

    // Add admin comments and rejection reason if provided
    if (req.body.adminComments) {
      updateData.adminComments = req.body.adminComments;
    }

    if (approvalStatus === "rejected") {
      if (!req.body.rejectionReason || !req.body.rejectionReason.trim()) {
        return res.status(400).json({
          success: false,
          error: "Rejection reason is required when rejecting a property",
        });
      }
      updateData.rejectionReason = req.body.rejectionReason.trim();
      updateData.rejectionRegion = req.body.rejectionRegion || "general";
      updateData.rejectedAt = new Date();
    }

    // When approving, also set status to active so property shows on frontend
    if (approvalStatus === "approved") {
      updateData.status = "active";
      updateData.isApproved = true;
      // Clear any previous rejection data
      updateData.rejectionReason = null;
      updateData.rejectionRegion = null;
      updateData.rejectedAt = null;
    } else if (approvalStatus === "rejected") {
      updateData.status = "rejected";
      updateData.isApproved = false;
    } else if (approvalStatus === "pending") {
      updateData.status = "pending_approval";
      updateData.isApproved = false;
    }

    const result = await db.collection("properties").updateOne(
      { _id: new ObjectId(propertyId) },
      {
        $set: updateData,
      },
    );

    console.log(
      `✅ Property approval updated: ${result.modifiedCount} documents modified`,
    );

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: `Property ${approvalStatus} successfully` },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating property approval:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update property approval",
    });
  }
};
