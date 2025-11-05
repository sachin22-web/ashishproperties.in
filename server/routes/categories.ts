import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { Category, ApiResponse } from "@shared/types";

// Get all categories
export const getCategories: RequestHandler = async (req, res) => {
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

    // Build query filter
    const filter: any = {};

    // Filter by type if specified
    if (req.query.type) {
      filter.type = req.query.type;
    } else {
      // Default to property type for backward compatibility
      filter.type = { $in: ["property", null, undefined] };
    }

    // Filter by active status
    if (req.query.active !== undefined) {
      filter.active = req.query.active === "true";
    }

    const categories = await db
      .collection("categories")
      .find(filter)
      .sort({ order: 1 })
      .toArray();

    const response: ApiResponse<Category[]> = {
      success: true,
      data: categories as unknown as Category[],
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

// Get category by slug
export const getCategoryBySlug: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { slug } = req.params;

    const category = await db
      .collection("categories")
      .findOne({ slug, active: true });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    const response: ApiResponse<Category> = {
      success: true,
      data: category as unknown as Category,
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

// Get subcategories by category slug
export const getSubcategories: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { categorySlug } = req.query;

    if (!categorySlug) {
      return res.status(400).json({
        success: false,
        error: "categorySlug parameter is required",
      });
    }

    // Find the category first
    const category = await db
      .collection("categories")
      .findOne({ slug: categorySlug });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    // Filter subcategories by active status if specified
    let subcategories = category.subcategories || [];
    if (req.query.active === "true") {
      subcategories = subcategories.filter((sub: any) => sub.active !== false);
    }

    const response: ApiResponse<any[]> = {
      success: true,
      data: subcategories,
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

// Initialize default categories
export const initializeCategories: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Check if categories already exist
    const existingCount = await db.collection("categories").countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: "Categories already initialized",
      });
    }

    const defaultCategories: Omit<Category, "_id">[] = [
      {
        name: "Residential",
        slug: "residential",
        icon: "🏠",
        description: "Houses, apartments, and residential properties",
        subcategories: [
          {
            id: "1bhk",
            name: "1 BHK",
            slug: "1bhk",
            description: "1 bedroom properties",
          },
          {
            id: "2bhk",
            name: "2 BHK",
            slug: "2bhk",
            description: "2 bedroom properties",
          },
          {
            id: "3bhk",
            name: "3 BHK",
            slug: "3bhk",
            description: "3 bedroom properties",
          },
          {
            id: "4bhk",
            name: "4+ BHK",
            slug: "4bhk-plus",
            description: "4 or more bedroom properties",
          },
          {
            id: "independent-house",
            name: "Independent House",
            slug: "independent-house",
            description: "Standalone houses",
          },
        ],
        order: 1,
        active: true,
      },
      {
        name: "Commercial",
        slug: "commercial",
        icon: "🏢",
        description: "Shops, offices, and commercial properties",
        subcategories: [
          {
            id: "shop",
            name: "Shop",
            slug: "shop",
            description: "Retail shops and stores",
          },
          {
            id: "office",
            name: "Office",
            slug: "office",
            description: "Office spaces",
          },
          {
            id: "showroom",
            name: "Showroom",
            slug: "showroom",
            description: "Display and showroom spaces",
          },
          {
            id: "warehouse",
            name: "Warehouse",
            slug: "warehouse",
            description: "Storage and warehouse facilities",
          },
        ],
        order: 2,
        active: true,
      },
      {
        name: "Plot",
        slug: "plot",
        icon: "🏞️",
        description: "Land and plots for development",
        subcategories: [
          {
            id: "residential-plot",
            name: "Residential Plot",
            slug: "residential-plot",
            description: "Plots for residential development",
          },
          {
            id: "commercial-plot",
            name: "Commercial Plot",
            slug: "commercial-plot",
            description: "Plots for commercial development",
          },
          {
            id: "agricultural-land",
            name: "Agricultural Land",
            slug: "agricultural-land",
            description: "Farming and agricultural land",
          },
        ],
        order: 3,
        active: true,
      },
      {
        name: "Flat",
        slug: "flat",
        icon: "🏘️",
        description: "Flats and apartments",
        subcategories: [
          {
            id: "studio",
            name: "Studio Apartment",
            slug: "studio",
            description: "Studio and single room apartments",
          },
          {
            id: "penthouse",
            name: "Penthouse",
            slug: "penthouse",
            description: "Luxury penthouse apartments",
          },
          {
            id: "duplex",
            name: "Duplex",
            slug: "duplex",
            description: "Two-story apartments",
          },
        ],
        order: 4,
        active: true,
      },
      {
        name: "PG",
        slug: "pg",
        icon: "🏨",
        description: "Paying guest accommodations",
        subcategories: [
          {
            id: "boys-pg",
            name: "Boys PG",
            slug: "boys-pg",
            description: "PG accommodation for men",
          },
          {
            id: "girls-pg",
            name: "Girls PG",
            slug: "girls-pg",
            description: "PG accommodation for women",
          },
          {
            id: "co-living",
            name: "Co-living Space",
            slug: "co-living",
            description: "Modern co-living arrangements",
          },
        ],
        order: 5,
        active: true,
      },
      {
        name: "Agricultural Land",
        slug: "agricultural-land",
        icon: "🌾",
        description: "Farming and agricultural properties",
        subcategories: [
          {
            id: "farm-house",
            name: "Farm House",
            slug: "farm-house",
            description: "Farm houses with land",
          },
          {
            id: "crop-land",
            name: "Crop Land",
            slug: "crop-land",
            description: "Land suitable for crops",
          },
        ],
        order: 6,
        active: true,
      },
      {
        name: "Showroom",
        slug: "showroom",
        icon: "🏪",
        description: "Display and retail showrooms",
        subcategories: [
          {
            id: "automobile-showroom",
            name: "Automobile Showroom",
            slug: "automobile-showroom",
            description: "Car and vehicle showrooms",
          },
          {
            id: "furniture-showroom",
            name: "Furniture Showroom",
            slug: "furniture-showroom",
            description: "Furniture display spaces",
          },
        ],
        order: 7,
        active: true,
      },
      {
        name: "Industrial Property",
        slug: "industrial-property",
        icon: "🏭",
        description: "Industrial and manufacturing properties",
        subcategories: [
          {
            id: "factory",
            name: "Factory",
            slug: "factory",
            description: "Manufacturing facilities",
          },
          {
            id: "industrial-shed",
            name: "Industrial Shed",
            slug: "industrial-shed",
            description: "Industrial storage sheds",
          },
        ],
        order: 8,
        active: true,
      },
    ];

    await db.collection("categories").insertMany(defaultCategories);

    res.json({
      success: true,
      message: "Categories initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize categories",
    });
  }
};
