import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";
import { OsCategory, ApiResponse } from "@shared/types";

// Get all categories
export const getOsCategories: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.active !== undefined) {
      filter.active = req.query.active === "true";
    }

    const [categories, total] = await Promise.all([
      db
        .collection("os_categories")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("os_categories").countDocuments(filter),
    ]);

    const response: ApiResponse<{
      categories: OsCategory[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        categories: categories as unknown as OsCategory[],
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
    console.error("Error fetching OS categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
};

// Create category
export const createOsCategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const categoryData: Omit<OsCategory, "_id"> = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if slug already exists
    const existing = await db
      .collection("os_categories")
      .findOne({ slug: categoryData.slug });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Category with this slug already exists",
      });
    }

    const result = await db.collection("os_categories").insertOne(categoryData);

    // Invalidate cache
    // TODO: Add cache invalidation logic here

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating OS category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create category",
    });
  }
};

// Update category
export const updateOsCategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { categoryId } = req.params;

    if (!ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid category ID",
      });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    // If slug is being updated, check if it already exists
    if (updateData.slug) {
      const existing = await db.collection("os_categories").findOne({
        slug: updateData.slug,
        _id: { $ne: new ObjectId(categoryId) },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Category with this slug already exists",
        });
      }
    }

    const result = await db
      .collection("os_categories")
      .updateOne({ _id: new ObjectId(categoryId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
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
    console.error("Error updating OS category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update category",
    });
  }
};

// Delete category
export const deleteOsCategory: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { categoryId } = req.params;

    if (!ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid category ID",
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await db
      .collection("os_subcategories")
      .countDocuments({ category: categoryId });

    if (subcategoryCount > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete category with existing subcategories",
      });
    }

    const result = await db
      .collection("os_categories")
      .deleteOne({ _id: new ObjectId(categoryId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
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
    console.error("Error deleting OS category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete category",
    });
  }
};
