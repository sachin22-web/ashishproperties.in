import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { Category, Subcategory, ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";
import multer from "multer";
import {
  getCachedCategories,
  clearCategoriesCache,
} from "../utils/categoryCache";

// Configure multer for icon upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for icons
  fileFilter: (req, file, cb) => {
    if (file && file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      // Provide a clear validation error that multer passes to the route
      const e: any = new Error("Only image files are allowed (image/*)");
      e.code = "INVALID_FILE_TYPE";
      cb(e);
    }
  },
});

// Helper function to generate unique slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove multiple hyphens
    .trim();
}

// Helper function to ensure unique slug
async function ensureUniqueSlug(
  db: any,
  name: string,
  excludeId?: string,
): Promise<string> {
  let baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const filter: any = { slug };
    if (excludeId) {
      filter._id = { $ne: new ObjectId(excludeId) };
    }

    const existing = await db.collection("categories").findOne(filter);
    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// PUBLIC: Get active categories with optional subcategories
export const getCategories: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { active, withSub } = req.query;

    // If client only wants active categories without subcategories, use simple in-memory cache
    if (String(active) === "true" && String(withSub) !== "true") {
      const cached = await getCachedCategories(db as any);
      // Add ETag based on cache timestamp
      const etag = `"${Date.now()}"`;
      res.set("ETag", etag);
      res.set("Cache-Control", "public, max-age=60");

      const response: ApiResponse<any[]> = {
        success: true,
        data: cached.data,
        meta: {
          updatedAt: new Date().toISOString(),
          etag,
          fromCache: cached.fromCache,
        },
      };

      return res.json(response);
    }

    // Fallback to full query (no cache) when subcategories requested or active not explicitly true
    // Build filter
    const filter: any = {};
    if (active === "true") {
      filter.isActive = true;
    }

    // Get categories sorted by sortOrder
    const categories = await db
      .collection("categories")
      .find(filter)
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray();

    let result = categories;

    // Include subcategories if requested
    if (withSub === "true") {
      result = await Promise.all(
        categories.map(async (category: any) => {
          const subcategories = await db
            .collection("subcategories")
            .find({
              categoryId: category._id.toString(),
              ...(active === "true" ? { isActive: true } : {}),
            })
            .sort({ sortOrder: 1, createdAt: 1 })
            .toArray();

          return {
            ...category,
            subcategories,
          };
        }),
      );
    }

    // Add ETag for caching
    const etag = `"${Date.now()}"`;
    res.set("ETag", etag);
    res.set("Cache-Control", "public, max-age=300"); // 5 minutes

    const response: ApiResponse<any[]> = {
      success: true,
      data: result,
      meta: {
        updatedAt: new Date().toISOString(),
        etag,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
};

// PUBLIC: Get category by slug with subcategories
export const getCategoryBySlug: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { slug } = req.params;

    const category = await db
      .collection("categories")
      .findOne({ slug, isActive: true });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    // Get subcategories
    const subcategories = await db
      .collection("subcategories")
      .find({ categoryId: category._id.toString(), isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray();

    const response: ApiResponse<any> = {
      success: true,
      data: {
        ...category,
        subcategories,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch category",
    });
  }
};

// PUBLIC: Get subcategories by category slug
export const getSubcategoriesByCategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { categorySlug } = req.params;

    // Find category first
    const category = await db
      .collection("categories")
      .findOne({ slug: categorySlug, isActive: true });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    // Get subcategories
    const subcategories = await db
      .collection("subcategories")
      .find({ categoryId: category._id.toString(), isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray();

    const response: ApiResponse<Subcategory[]> = {
      success: true,
      data: subcategories as Subcategory[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subcategories",
    });
  }
};

// ADMIN: Get all categories with search and pagination
export const getAllCategories: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      search = "",
      page = "1",
      limit = "10",
      withSub = "false",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build search filter
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const [categories, total] = await Promise.all([
      db
        .collection("categories")
        .find(filter)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      db.collection("categories").countDocuments(filter),
    ]);

    // For each category, compute counts and include subcategories array (if requested)
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category: any) => {
        // Ensure subcategories array exists
        let subcategories: any[] = [];
        if (withSub === "true") {
          subcategories = await db
            .collection("subcategories")
            .find({ categoryId: category._id.toString() })
            .sort({ sortOrder: 1, createdAt: 1 })
            .toArray();
        }

        // Count subcategories
        const subcategoryCount = Array.isArray(subcategories)
          ? subcategories.length
          : await db
              .collection("subcategories")
              .countDocuments({ categoryId: category._id.toString() });

        // Count properties linked to this category
        // Match by propertyType === category.slug OR subCategory in subcategory slugs
        const subSlugs = (subcategories || [])
          .map((s: any) => s.slug)
          .filter(Boolean);
        const propFilter: any = {
          $or: [{ propertyType: category.slug }],
        };
        if (subSlugs.length > 0) {
          propFilter.$or.push({ subCategory: { $in: subSlugs } });
        }
        const propertiesCount = await db
          .collection("properties")
          .countDocuments(propFilter);

        return {
          ...category,
          subcategories: subcategories || [],
          // Backwards-compatible counts used by various admin components
          subcategoryCount: subcategoryCount,
          propertiesCount: propertiesCount,
          counts: {
            subcategories: subcategoryCount,
            properties: propertiesCount,
          },
        };
      }),
    );

    const response: ApiResponse<{
      categories: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        categories: categoriesWithCounts,
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
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
};

// ADMIN: Create category
export const createCategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Backward-compatible payload parsing
    const raw = req.body || {};
    const name: string | undefined = (raw.name || "").toString();
    const iconUrlRaw: any = raw.iconUrl ?? raw.icon; // accept legacy 'icon'
    const sortOrderRaw: any = raw.sortOrder ?? raw.order; // accept legacy 'order'
    const isActiveRaw: any = raw.isActive ?? raw.active; // accept legacy 'active'

    // Normalize types
    const iconUrl: string | undefined =
      typeof iconUrlRaw === "string" ? iconUrlRaw : undefined;
    const sortOrder: number | undefined =
      typeof sortOrderRaw === "number"
        ? sortOrderRaw
        : typeof sortOrderRaw === "string"
          ? parseInt(sortOrderRaw, 10)
          : undefined;
    const isActive: boolean = Boolean(
      typeof isActiveRaw === "boolean"
        ? isActiveRaw
        : typeof isActiveRaw === "string"
          ? isActiveRaw.toLowerCase() !== "false"
          : true,
    );

    // Validate required fields
    if (!name || !iconUrl || !Number.isFinite(sortOrder as number)) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, iconUrl, sortOrder",
      });
    }

    // Generate unique slug
    const slug = await ensureUniqueSlug(db, name);

    const categoryData: Omit<Category, "_id"> = {
      name: name.trim(),
      slug,
      iconUrl: iconUrl.trim(),
      sortOrder: sortOrder as number,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("categories").insertOne(categoryData);

    // Clear categories cache so public endpoints reflect new category immediately
    try {
      clearCategoriesCache();
    } catch (e) {}

    const response: ApiResponse<{ _id: string; category: Category }> = {
      success: true,
      data: {
        _id: result.insertedId.toString(),
        category: {
          ...categoryData,
          _id: result.insertedId.toString(),
        } as Category,
      },
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

// ADMIN: Update category
export const updateCategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid category ID",
      });
    }

    const raw = req.body || {};

    // Build update object with backward compatibility for legacy fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (raw.name !== undefined) {
      const name = String(raw.name);
      updateData.name = name.trim();
      // Regenerate slug if name changed
      updateData.slug = await ensureUniqueSlug(db, name, id);
    }

    const iconUrlRaw = raw.iconUrl ?? raw.icon; // accept legacy 'icon'
    if (iconUrlRaw !== undefined) {
      updateData.iconUrl = String(iconUrlRaw).trim();
    }

    const sortOrderRaw = raw.sortOrder ?? raw.order; // accept legacy 'order'
    if (sortOrderRaw !== undefined) {
      updateData.sortOrder =
        typeof sortOrderRaw === "number"
          ? sortOrderRaw
          : parseInt(String(sortOrderRaw), 10);
    }

    const isActiveRaw = raw.isActive ?? raw.active; // accept legacy 'active'
    if (isActiveRaw !== undefined) {
      updateData.isActive = Boolean(
        typeof isActiveRaw === "boolean"
          ? isActiveRaw
          : String(isActiveRaw).toLowerCase() !== "false",
      );
    }

    const result = await db
      .collection("categories")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    // Clear categories cache so public endpoints reflect updated category immediately
    try {
      clearCategoriesCache();
    } catch (e) {}

    // Get updated category
    const updatedCategory = await db
      .collection("categories")
      .findOne({ _id: new ObjectId(id) });

    const response: ApiResponse<{ category: Category }> = {
      success: true,
      data: { category: updatedCategory as Category },
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

// ADMIN: Delete category
export const deleteCategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid category ID",
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await db
      .collection("subcategories")
      .countDocuments({ categoryId: id });

    if (subcategoryCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It has ${subcategoryCount} subcategories. Delete subcategories first.`,
      });
    }

    // Check if category is linked to items (properties, etc.) - you can add this check based on your needs
    // For now, we'll allow deletion if no subcategories

    const result = await db
      .collection("categories")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    // Clear in-memory categories cache so public endpoints reflect changes immediately
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

// ADMIN: Toggle category active status
export const toggleCategoryActive: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid category ID",
      });
    }

    // Get current category
    const category = await db
      .collection("categories")
      .findOne({ _id: new ObjectId(id) });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    // Toggle active status
    const result = await db.collection("categories").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isActive: !category.isActive,
          updatedAt: new Date(),
        },
      },
    );

    const updatedCategory = await db
      .collection("categories")
      .findOne({ _id: new ObjectId(id) });

    const response: ApiResponse<{ category: Category }> = {
      success: true,
      data: { category: updatedCategory as Category },
    };

    res.json(response);
  } catch (error) {
    console.error("Error toggling category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle category",
    });
  }
};

// ADMIN: Update category sort order (for drag-and-drop)
export const updateCategorySortOrder: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { updates } = req.body; // Array of {id, sortOrder}

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: "Updates must be an array",
      });
    }

    // Update all categories in batch
    const bulkOps = updates.map((update: any) => ({
      updateOne: {
        filter: { _id: new ObjectId(update.id) },
        update: {
          $set: {
            sortOrder: update.sortOrder,
            updatedAt: new Date(),
          },
        },
      },
    }));

    await db.collection("categories").bulkWrite(bulkOps);

    // Clear categories cache since sort order changed
    try {
      clearCategoriesCache();
    } catch (e) {}

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Sort order updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating sort order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update sort order",
    });
  }
};

// Icon upload handlers
export const uploadCategoryIcon = upload.single("icon");

export const handleIconUpload: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    // In a real implementation, upload to cloud storage
    // For now, simulate with a placeholder URL
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const extension = req.file.originalname.split(".").pop();
    const iconUrl = `/uploads/category-icons/${timestamp}-${random}.${extension}`;

    const response: ApiResponse<{ iconUrl: string }> = {
      success: true,
      data: { iconUrl },
    };

    res.json(response);
  } catch (error) {
    console.error("Error uploading icon:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload icon",
    });
  }
};
