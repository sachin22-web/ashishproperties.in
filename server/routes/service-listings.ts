import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";
import { ServiceListing, ApiResponse } from "@shared/types";

// Get service listings by subcategory
export const getServiceListings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { subSlug } = req.query;

    if (!subSlug) {
      return res.status(400).json({
        success: false,
        error: "subSlug parameter is required",
      });
    }

    // Build query filter
    const filter: any = { subcategory: subSlug };

    // Filter by active status
    if (req.query.active === "true") {
      filter.active = true;
    }

    const listings = await db
      .collection("service_listings")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<ServiceListing[]> = {
      success: true,
      data: listings as unknown as ServiceListing[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching service listings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch service listings",
    });
  }
};

// Admin: Get all service listings
export const getAllServiceListings: RequestHandler = async (req, res) => {
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
        .collection("service_listings")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("service_listings").countDocuments(filter),
    ]);

    const response: ApiResponse<{
      listings: ServiceListing[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        listings: listings as unknown as ServiceListing[],
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
    console.error("Error fetching service listings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch service listings",
    });
  }
};

// Admin: Create service listing
export const createServiceListing: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const listingData: Omit<ServiceListing, "_id"> = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection("service_listings")
      .insertOne(listingData);

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating service listing:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create service listing",
    });
  }
};

// Admin: Update service listing
export const updateServiceListing: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { listingId } = req.params;

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    const result = await db
      .collection("service_listings")
      .updateOne({ _id: new ObjectId(listingId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Service listing not found",
      });
    }

    const response: ApiResponse<{ updated: boolean }> = {
      success: true,
      data: { updated: true },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating service listing:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update service listing",
    });
  }
};

// Admin: Delete service listing
export const deleteServiceListing: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { listingId } = req.params;

    const result = await db.collection("service_listings").deleteOne({
      _id: new ObjectId(listingId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Service listing not found",
      });
    }

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting service listing:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete service listing",
    });
  }
};

// Admin: Bulk import service listings
export const bulkImportServiceListings: RequestHandler = async (req, res) => {
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
        if (row.categorySlug) {
          const existingCategory = await db.collection("categories").findOne({
            slug: row.categorySlug,
            type: "service",
          });

          if (!existingCategory) {
            await db.collection("categories").insertOne({
              name: row.categorySlug
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase()),
              slug: row.categorySlug,
              type: "service",
              icon: "🔧",
              description: `${row.categorySlug} services`,
              subcategories: [],
              order: 999,
              active: true,
            });
          }
        }

        // Auto-create subcategory if it doesn't exist
        if (row.subSlug && row.categorySlug) {
          const category = await db.collection("categories").findOne({
            slug: row.categorySlug,
            type: "service",
          });

          if (category) {
            const hasSubcategory = category.subcategories?.some(
              (sub: any) => sub.slug === row.subSlug,
            );

            if (!hasSubcategory) {
              await db.collection("categories").updateOne(
                { slug: row.categorySlug, type: "service" },
                {
                  $push: {
                    subcategories: {
                      id: row.subSlug,
                      name: row.subSlug
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l: string) => l.toUpperCase()),
                      slug: row.subSlug,
                      description: `${row.subSlug} services`,
                    },
                  },
                },
              );
            }
          }
        }

        // Create service listing
        const listing: Omit<ServiceListing, "_id"> = {
          category: row.categorySlug,
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

        await db.collection("service_listings").insertOne(listing);
        results.created++;
      } catch (error: any) {
        results.errors.push(`Error processing row: ${error.message}`);
      }
    }

    const response: ApiResponse<typeof results> = {
      success: true,
      data: results,
    };

    res.json(response);
  } catch (error) {
    console.error("Error bulk importing service listings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to bulk import service listings",
    });
  }
};
