import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";

// Get subcategories by category - only shows subcategories with approved properties
export const getSubcategories: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { category } = req.query;

    // Set no-cache headers to ensure live data
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Get categories collection
    const categoriesCollection = db.collection("categories");
    const propertiesCollection = db.collection("properties");

    if (category) {
      // Get specific category with its subcategories
      const categoryDoc = await categoriesCollection.findOne({
        slug: category,
        active: true,
      });

      if (!categoryDoc) {
        return res.status(404).json({
          success: false,
          error: "Category not found",
        });
      }

      // Get live subcategory data by checking which subcategories have approved properties
      // For buy/sale categories, filter by priceType, for others use propertyType
      const propertyFilter: any = {
        status: "active",
        approvalStatus: "approved",
        subCategory: { $nin: [null, ""] },
      };

      // Map category to appropriate property field filter
      if (category === "buy" || category === "sale") {
        // Buy category includes both residential and plot types for sale
        propertyFilter.$or = [
          { propertyType: "residential", priceType: "sale" },
          { propertyType: "plot", priceType: "sale" },
        ];
      } else if (category === "rent") {
        propertyFilter.propertyType = "residential";
        propertyFilter.priceType = "rent";
      } else if (category === "lease") {
        propertyFilter.priceType = "lease";
      } else if (category === "pg") {
        propertyFilter.propertyType = "pg";
      } else if (category === "commercial") {
        propertyFilter.propertyType = "commercial";
      } else if (category === "agricultural") {
        propertyFilter.propertyType = "agricultural";
      } else {
        // Fallback: use category as property type
        propertyFilter.propertyType = category;
      }

      const subcategoriesWithApprovedProperties =
        await propertiesCollection.distinct("subCategory", propertyFilter);

      // Get all subcategories for this category
      const allSubcategories = (categoryDoc.subcategories || []).sort(
        (a: any, b: any) => a.name.localeCompare(b.name),
      );

      // Get subcategories that have approved properties
      const subcategoriesWithProperties = (categoryDoc.subcategories || [])
        .filter((sub: any) =>
          subcategoriesWithApprovedProperties.includes(sub.slug),
        )
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      // Use subcategories with properties if available, otherwise show all admin-created subcategories
      const availableSubcategories =
        subcategoriesWithProperties.length > 0
          ? subcategoriesWithProperties
          : allSubcategories;

      res.json({
        success: true,
        data: availableSubcategories,
      });
    } else {
      // Get all categories with their subcategories that have approved properties
      const categories = await categoriesCollection
        .find({
          active: true,
        })
        .sort({ order: 1 })
        .toArray();

      // Get all subcategories that have approved properties
      const allSubcategoriesWithProperties = await propertiesCollection
        .aggregate([
          {
            $match: {
              status: "active",
              approvalStatus: "approved",
              subCategory: { $nin: [null, ""] },
            },
          },
          {
            $group: {
              _id: {
                propertyType: "$propertyType",
                subCategory: "$subCategory",
              },
            },
          },
        ])
        .toArray();

      // Create a map of available subcategories by category
      const availableSubcategoriesMap = new Map();
      allSubcategoriesWithProperties.forEach((item: any) => {
        const key = item._id.propertyType;
        if (!availableSubcategoriesMap.has(key)) {
          availableSubcategoriesMap.set(key, new Set());
        }
        availableSubcategoriesMap.get(key).add(item._id.subCategory);
      });

      // Filter all subcategories to only include those with approved properties
      const allSubcategories = categories.reduce((acc, cat) => {
        if (cat.subcategories && availableSubcategoriesMap.has(cat.slug)) {
          const availableForCategory = availableSubcategoriesMap.get(cat.slug);
          const filteredSubs = cat.subcategories
            .filter((sub: any) => availableForCategory.has(sub.slug))
            .map((sub: any) => ({
              ...sub,
              categorySlug: cat.slug,
              categoryName: cat.name,
            }));
          acc.push(...filteredSubs);
        }
        return acc;
      }, []);

      res.json({
        success: true,
        data: allSubcategories,
      });
    }
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subcategories",
    });
  }
};

// Get subcategories with property counts - only shows subcategories with approved properties
export const getSubcategoriesWithCounts: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { category } = req.query;

    // Set no-cache headers to ensure live data
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Get categories collection
    const categoriesCollection = db.collection("categories");
    const propertiesCollection = db.collection("properties");

    if (category) {
      // Get specific category with its subcategories
      const categoryDoc = await categoriesCollection.findOne({
        slug: category,
        active: true,
      });

      if (!categoryDoc) {
        return res.status(404).json({
          success: false,
          error: "Category not found",
        });
      }

      // Get live subcategory data by aggregating actual approved properties
      // For buy/sale categories, filter by priceType, for others use propertyType
      const propertyFilter: any = {
        status: "active",
        approvalStatus: "approved",
      };

      // Map category to appropriate property field filter
      if (category === "buy" || category === "sale") {
        // Buy category includes both residential and plot types for sale
        propertyFilter.$or = [
          { propertyType: "residential", priceType: "sale" },
          { propertyType: "plot", priceType: "sale" },
        ];
      } else if (category === "rent") {
        propertyFilter.propertyType = "residential";
        propertyFilter.priceType = "rent";
      } else if (category === "lease") {
        propertyFilter.priceType = "lease";
      } else if (category === "pg") {
        propertyFilter.propertyType = "pg";
      } else if (category === "commercial") {
        propertyFilter.propertyType = "commercial";
      } else if (category === "agricultural") {
        propertyFilter.propertyType = "agricultural";
      } else {
        // Fallback: use category as property type
        propertyFilter.propertyType = category;
      }

      const subcategoriesWithCounts = await propertiesCollection
        .aggregate([
          {
            $match: propertyFilter,
          },
          {
            $group: {
              _id: "$subCategory",
              count: { $sum: 1 },
            },
          },
          {
            $match: {
              _id: { $nin: [null, ""] }, // Only include subcategories that exist
            },
          },
        ])
        .toArray();

      // Map to include subcategory details from the category definition
      const result = subcategoriesWithCounts
        .map((item: any) => {
          const subcategorySlug = item._id;
          const subcategoryDef = categoryDoc.subcategories?.find(
            (sub: any) => sub.slug === subcategorySlug,
          );

          if (subcategoryDef) {
            return {
              ...subcategoryDef,
              count: item.count,
            };
          }
          return null;
        })
        .filter(Boolean) // Remove null entries
        .sort((a: any, b: any) => a.name.localeCompare(b.name)); // Sort alphabetically

      res.json({
        success: true,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Category parameter is required",
      });
    }
  } catch (error) {
    console.error("Error fetching subcategories with counts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subcategories with counts",
    });
  }
};
