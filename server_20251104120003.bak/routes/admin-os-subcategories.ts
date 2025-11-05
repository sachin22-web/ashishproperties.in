import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";
import { OsSubcategory, ApiResponse } from "@shared/types";

// Get all subcategories
export const getOsSubcategories: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.active !== undefined) {
      filter.active = req.query.active === "true";
    }

    const [subcategories, total] = await Promise.all([
      db
        .collection("os_subcategories")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("os_subcategories").countDocuments(filter),
    ]);

    const response: ApiResponse<{
      subcategories: OsSubcategory[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        subcategories: subcategories as unknown as OsSubcategory[],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching OS subcategories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subcategories",
    });
  }
};

// Create subcategory
export const createOsSubcategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const subcategoryData: Omit<OsSubcategory, "_id"> = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if category exists
    const categoryExists = await db
      .collection("os_categories")
      .findOne({ slug: subcategoryData.category });

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        error: "Parent category not found",
      });
    }

    // Check if slug already exists within this category
    const existing = await db.collection("os_subcategories").findOne({
      category: subcategoryData.category,
      slug: subcategoryData.slug,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Subcategory with this slug already exists in this category",
      });
    }

    const result = await db
      .collection("os_subcategories")
      .insertOne(subcategoryData);

    // Invalidate cache
    // TODO: Add cache invalidation logic here

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating OS subcategory:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create subcategory",
    });
  }
};

// Update subcategory
export const updateOsSubcategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { subcategoryId } = req.params;

    if (!ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid subcategory ID",
      });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    // If category or slug is being updated, validate
    if (updateData.category) {
      const categoryExists = await db
        .collection("os_categories")
        .findOne({ slug: updateData.category });

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: "Parent category not found",
        });
      }
    }

    if (updateData.slug || updateData.category) {
      const existing = await db.collection("os_subcategories").findOne({
        category: updateData.category,
        slug: updateData.slug,
        _id: { $ne: new ObjectId(subcategoryId) },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Subcategory with this slug already exists in this category",
        });
      }
    }

    const result = await db
      .collection("os_subcategories")
      .updateOne({ _id: new ObjectId(subcategoryId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Subcategory not found",
      });
    }

    // Invalidate cache
    // TODO: Add cache invalidation logic here

    const response: ApiResponse<{ updated: boolean }> = {
      success: true,
      data: { updated: true },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating OS subcategory:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update subcategory",
    });
  }
};

// Delete subcategory
export const deleteOsSubcategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { subcategoryId } = req.params;

    if (!ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid subcategory ID",
      });
    }

    // Check if subcategory has listings
    const listingCount = await db
      .collection("os_listings")
      .countDocuments({ subcategory: subcategoryId });

    if (listingCount > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete subcategory with existing listings",
      });
    }

    const result = await db
      .collection("os_subcategories")
      .deleteOne({ _id: new ObjectId(subcategoryId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Subcategory not found",
      });
    }

    // Invalidate cache
    // TODO: Add cache invalidation logic here

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting OS subcategory:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete subcategory",
    });
  }
};
