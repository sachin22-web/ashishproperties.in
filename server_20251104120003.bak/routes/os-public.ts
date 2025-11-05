import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import {
  OsCategory,
  OsSubcategory,
  OsListing,
  ApiResponse,
} from "@shared/types";

// Public API: Get active categories
export const getOsCategories: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const filter: any = {};
    if (req.query.active === "1") {
      filter.active = true;
    }

    const categories = await db
      .collection("os_categories")
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    const response: ApiResponse<OsCategory[]> = {
      success: true,
      data: categories as unknown as OsCategory[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching public OS categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
};

// Public API: Get active subcategories by category
export const getOsSubcategories: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { cat } = req.query;

    if (!cat) {
      return res.status(400).json({
        success: false,
        error: "Category slug is required",
      });
    }

    const filter: any = { category: cat };
    if (req.query.active === "1") {
      filter.active = true;
    }

    const subcategories = await db
      .collection("os_subcategories")
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    const response: ApiResponse<OsSubcategory[]> = {
      success: true,
      data: subcategories as unknown as OsSubcategory[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching public OS subcategories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subcategories",
    });
  }
};

// Public API: Get active listings by subcategory
export const getOsListings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { sub } = req.query;

    if (!sub) {
      return res.status(400).json({
        success: false,
        error: "Subcategory slug is required",
      });
    }

    const filter: any = { subcategory: sub };
    if (req.query.active === "1") {
      filter.active = true;
    }

    const listings = await db
      .collection("os_listings")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<OsListing[]> = {
      success: true,
      data: listings as unknown as OsListing[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching public OS listings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch listings",
    });
  }
};
