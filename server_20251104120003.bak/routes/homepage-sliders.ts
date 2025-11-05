import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

interface SliderImage {
  _id?: ObjectId;
  url: string;
  alt: string;
  title?: string;
  subtitle?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Get all homepage sliders (public)
export const getHomepageSliders: RequestHandler = async (req, res) => {
  try {
    let db;
    try {
      db = getDatabase();
    } catch (dbError) {
      // Database not initialized yet
      return res.status(503).json({
        success: false,
        error: "Database connection is being established. Please try again in a moment.",
      });
    }

    const sliders = await db
      .collection("homepage_sliders")
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();

    const response: ApiResponse<SliderImage[]> = {
      success: true,
      data: sliders as SliderImage[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching homepage sliders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch homepage sliders",
    });
  }
};

// Get all homepage sliders for admin
export const getAdminHomepageSliders: RequestHandler = async (req, res) => {
  try {
    let db;
    try {
      db = getDatabase();
    } catch (dbError) {
      // Database not initialized yet
      return res.status(503).json({
        success: false,
        error: "Database connection is being established. Please try again in a moment.",
      });
    }

    const sliders = await db
      .collection("homepage_sliders")
      .find({})
      .sort({ order: 1 })
      .toArray();

    const response: ApiResponse<SliderImage[]> = {
      success: true,
      data: sliders as SliderImage[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching homepage sliders for admin:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch homepage sliders",
    });
  }
};

// Create new homepage slider (admin only)
export const createHomepageSlider: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { url, alt, title, subtitle, isActive = true, order = 1 } = req.body;

    if (!url || !alt) {
      return res.status(400).json({
        success: false,
        error: "URL and alt text are required",
      });
    }

    const newSlider: Omit<SliderImage, "_id"> = {
      url,
      alt,
      title: title || "",
      subtitle: subtitle || "",
      isActive: isActive !== false,
      order: parseInt(order) || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("homepage_sliders").insertOne(newSlider);

    const response: ApiResponse<{ _id: ObjectId }> = {
      success: true,
      data: { _id: result.insertedId },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating homepage slider:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create homepage slider",
    });
  }
};

// Update homepage slider (admin only)
export const updateHomepageSlider: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { sliderId } = req.params;
    const updateData = { ...req.body };

    if (!ObjectId.isValid(sliderId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid slider ID",
      });
    }

    // Remove _id from update data and add updatedAt
    delete updateData._id;
    updateData.updatedAt = new Date();

    const result = await db
      .collection("homepage_sliders")
      .updateOne({ _id: new ObjectId(sliderId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Slider not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Slider updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating homepage slider:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update homepage slider",
    });
  }
};

// Delete homepage slider (admin only)
export const deleteHomepageSlider: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { sliderId } = req.params;

    if (!ObjectId.isValid(sliderId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid slider ID",
      });
    }

    const result = await db
      .collection("homepage_sliders")
      .deleteOne({ _id: new ObjectId(sliderId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Slider not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Slider deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting homepage slider:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete homepage slider",
    });
  }
};

// Initialize default homepage sliders
export const initializeHomepageSliders: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Check if sliders already exist
    const existingCount = await db
      .collection("homepage_sliders")
      .countDocuments();

    if (existingCount > 0) {
      return res.json({
        success: true,
        data: { message: "Sliders already initialized" },
      });
    }

    // Create default sliders
    const defaultSliders: Omit<SliderImage, "_id">[] = [
      {
        url: "https://cdn.builder.io/api/v1/image/assets%2F4993b79b8ae445d4ae5618117571cced%2Ffa2e9286339c496d856e6de8806ef00c?format=webp&width=800",
        alt: "Property showcase 1",
        title: "Find Your Perfect Property",
        subtitle:
          "Discover amazing properties in your area with verified listings",
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        url: "https://cdn.builder.io/api/v1/image/assets%2F4993b79b8ae445d4ae5618117571cced%2Fdcba62406a134729a34be08c488ddbab?format=webp&width=800",
        alt: "Property showcase 2",
        title: "Premium Properties",
        subtitle: "Luxury homes and commercial spaces",
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        url: "https://cdn.builder.io/api/v1/image/assets%2F4993b79b8ae445d4ae5618117571cced%2Feb795a9f70554d888ddf9669d4b3441d?format=webp&width=800",
        alt: "Property showcase 3",
        title: "Your Dream Home Awaits",
        subtitle: "Browse verified listings with expert guidance",
        isActive: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        url: "https://cdn.builder.io/api/v1/image/assets%2F4993b79b8ae445d4ae5618117571cced%2F817b72ff3e4f40ee830c7ab0fcd5d25a?format=webp&width=800",
        alt: "Property showcase 4",
        title: "Trusted Property Partner",
        subtitle: "Professional service you can rely on",
        isActive: true,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection("homepage_sliders").insertMany(defaultSliders);

    const response: ApiResponse<{ message: string; count: number }> = {
      success: true,
      data: {
        message: "Default sliders initialized successfully",
        count: defaultSliders.length,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error initializing homepage sliders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize homepage sliders",
    });
  }
};
