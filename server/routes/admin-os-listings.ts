import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";
import { OsListing, ApiResponse } from "@shared/types";

// Get all listings
export const getOsListings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.subcategory) filter.subcategory = req.query.subcategory;
    if (req.query.active !== undefined)
      filter.active = req.query.active === "true";

    const [listings, total] = await Promise.all([
      db
        .collection("os_listings")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("os_listings").countDocuments(filter),
    ]);

    const response: ApiResponse<{
      listings: OsListing[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        listings: listings as unknown as OsListing[],
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
    console.error("Error fetching OS listings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch listings",
    });
  }
};

// Create listing
export const createOsListing: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const listingData: Omit<OsListing, "_id"> = {
      ...req.body,
      photos: req.body.photos || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate category and subcategory exist
    const [categoryExists, subcategoryExists] = await Promise.all([
      db.collection("os_categories").findOne({ slug: listingData.category }),
      db.collection("os_subcategories").findOne({
        category: listingData.category,
        slug: listingData.subcategory,
      }),
    ]);

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        error: "Category not found",
      });
    }

    if (!subcategoryExists) {
      return res.status(400).json({
        success: false,
        error: "Subcategory not found",
      });
    }

    const result = await db.collection("os_listings").insertOne(listingData);

    // Invalidate cache
    // TODO: Add cache invalidation logic here

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating OS listing:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create listing",
    });
  }
};

// Update listing
export const updateOsListing: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { listingId } = req.params;

    if (!ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid listing ID",
      });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    // Validate category and subcategory if being updated
    if (updateData.category || updateData.subcategory) {
      const [categoryExists, subcategoryExists] = await Promise.all([
        updateData.category
          ? db
              .collection("os_categories")
              .findOne({ slug: updateData.category })
          : Promise.resolve(true),
        updateData.subcategory && updateData.category
          ? db.collection("os_subcategories").findOne({
              category: updateData.category,
              slug: updateData.subcategory,
            })
          : Promise.resolve(true),
      ]);

      if (updateData.category && !categoryExists) {
        return res.status(400).json({
          success: false,
          error: "Category not found",
        });
      }

      if (updateData.subcategory && !subcategoryExists) {
        return res.status(400).json({
          success: false,
          error: "Subcategory not found",
        });
      }
    }

    const result = await db
      .collection("os_listings")
      .updateOne({ _id: new ObjectId(listingId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Listing not found",
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
    console.error("Error updating OS listing:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update listing",
    });
  }
};

// Delete listing
export const deleteOsListing: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { listingId } = req.params;

    if (!ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid listing ID",
      });
    }

    const result = await db
      .collection("os_listings")
      .deleteOne({ _id: new ObjectId(listingId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Listing not found",
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
    console.error("Error deleting OS listing:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete listing",
    });
  }
};

// Bulk import listings from CSV
export const bulkImportOsListings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Parse CSV data from request body
    const csvData = JSON.parse(req.body.csvData || "[]");
    const results = {
      created: 0,
      errors: [] as string[],
    };

    for (const row of csvData) {
      try {
        // Auto-create category if it doesn't exist
        if (row.catSlug) {
          const existingCategory = await db
            .collection("os_categories")
            .findOne({
              slug: row.catSlug,
            });

          if (!existingCategory) {
            await db.collection("os_categories").insertOne({
              slug: row.catSlug,
              name: row.catSlug
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase()),
              active: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        // Auto-create subcategory if it doesn't exist
        if (row.subSlug && row.catSlug) {
          const existingSubcategory = await db
            .collection("os_subcategories")
            .findOne({
              category: row.catSlug,
              slug: row.subSlug,
            });

          if (!existingSubcategory) {
            await db.collection("os_subcategories").insertOne({
              category: row.catSlug,
              slug: row.subSlug,
              name: row.subSlug
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase()),
              active: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        // Create listing
        const listing: Omit<OsListing, "_id"> = {
          category: row.catSlug,
          subcategory: row.subSlug,
          name: row.name,
          phone: row.phone,
          address: row.address,
          photos: [row.photo1, row.photo2, row.photo3, row.photo4].filter(
            Boolean,
          ),
          geo: {
            lat: parseFloat(row.lat) || 0,
            lng: parseFloat(row.lng) || 0,
          },
          open: row.open || "09:00",
          close: row.close || "18:00",
          active: row.active !== "false",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.collection("os_listings").insertOne(listing);
        results.created++;
      } catch (error: any) {
        results.errors.push(`Error processing row: ${error.message}`);
      }
    }

    // Invalidate cache
    // TODO: Add cache invalidation logic here

    const response: ApiResponse<typeof results> = {
      success: true,
      data: results,
    };

    res.json(response);
  } catch (error) {
    console.error("Error bulk importing OS listings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to bulk import listings",
    });
  }
};
