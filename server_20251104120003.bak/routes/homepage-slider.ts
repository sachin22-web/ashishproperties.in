import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

interface HomepageSlider {
  _id?: ObjectId;
  title: string;
  subtitle: string;
  icon: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Get all homepage sliders (admin)
export const getHomepageSliders: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sliders = await db
      .collection("homepage_sliders")
      .find({})
      .sort({ order: 1 })
      .toArray();

    const response: ApiResponse<HomepageSlider[]> = {
      success: true,
      data: sliders as HomepageSlider[],
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

// Get active homepage sliders (public)
export const getActiveHomepageSliders: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sliders = await db
      .collection("homepage_sliders")
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();

    const response: ApiResponse<HomepageSlider[]> = {
      success: true,
      data: sliders as HomepageSlider[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching active homepage sliders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch homepage sliders",
    });
  }
};

// Create new homepage slider (admin)
export const createHomepageSlider: RequestHandler = async (req, res) => {
  try {
    const { title, subtitle, icon, backgroundColor, textColor, isActive, order } = req.body;

    if (!title || !subtitle) {
      return res.status(400).json({
        success: false,
        error: "Title and subtitle are required",
      });
    }

    const db = getDatabase();

    // Check if order already exists
    const existingSlider = await db
      .collection("homepage_sliders")
      .findOne({ order: parseInt(order) });

    if (existingSlider) {
      // Shift existing sliders order
      await db
        .collection("homepage_sliders")
        .updateMany(
          { order: { $gte: parseInt(order) } },
          { $inc: { order: 1 } }
        );
    }

    const sliderData: Omit<HomepageSlider, "_id"> = {
      title,
      subtitle,
      icon: icon || "🏠",
      backgroundColor: backgroundColor || "from-[#C70000] to-red-600",
      textColor: textColor || "text-white",
      isActive: isActive !== undefined ? isActive : true,
      order: parseInt(order) || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("homepage_sliders").insertOne(sliderData);

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: result.insertedId.toString() },
      message: "Homepage slider created successfully",
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

// Update homepage slider (admin)
export const updateHomepageSlider: RequestHandler = async (req, res) => {
  try {
    const { sliderId } = req.params;
    const { title, subtitle, icon, backgroundColor, textColor, isActive, order } = req.body;

    if (!ObjectId.isValid(sliderId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid slider ID",
      });
    }

    const db = getDatabase();

    // Get current slider
    const currentSlider = await db
      .collection("homepage_sliders")
      .findOne({ _id: new ObjectId(sliderId) });

    if (!currentSlider) {
      return res.status(404).json({
        success: false,
        error: "Slider not found",
      });
    }

    // Handle order change
    if (order && parseInt(order) !== currentSlider.order) {
      const newOrder = parseInt(order);
      const oldOrder = currentSlider.order;

      if (newOrder > oldOrder) {
        // Moving down - shift items up
        await db
          .collection("homepage_sliders")
          .updateMany(
            { 
              order: { $gt: oldOrder, $lte: newOrder },
              _id: { $ne: new ObjectId(sliderId) }
            },
            { $inc: { order: -1 } }
          );
      } else {
        // Moving up - shift items down
        await db
          .collection("homepage_sliders")
          .updateMany(
            { 
              order: { $gte: newOrder, $lt: oldOrder },
              _id: { $ne: new ObjectId(sliderId) }
            },
            { $inc: { order: 1 } }
          );
      }
    }

    const updateData: Partial<HomepageSlider> = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (subtitle) updateData.subtitle = subtitle;
    if (icon) updateData.icon = icon;
    if (backgroundColor) updateData.backgroundColor = backgroundColor;
    if (textColor) updateData.textColor = textColor;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order) updateData.order = parseInt(order);

    await db
      .collection("homepage_sliders")
      .updateOne(
        { _id: new ObjectId(sliderId) },
        { $set: updateData }
      );

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: "Homepage slider updated successfully",
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

// Toggle slider active status (admin)
export const toggleSliderStatus: RequestHandler = async (req, res) => {
  try {
    const { sliderId } = req.params;
    const { isActive } = req.body;

    if (!ObjectId.isValid(sliderId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid slider ID",
      });
    }

    const db = getDatabase();

    await db
      .collection("homepage_sliders")
      .updateOne(
        { _id: new ObjectId(sliderId) },
        { 
          $set: { 
            isActive: isActive,
            updatedAt: new Date()
          } 
        }
      );

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: `Slider ${isActive ? 'activated' : 'deactivated'} successfully`,
    };

    res.json(response);
  } catch (error) {
    console.error("Error toggling slider status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update slider status",
    });
  }
};

// Delete homepage slider (admin)
export const deleteHomepageSlider: RequestHandler = async (req, res) => {
  try {
    const { sliderId } = req.params;

    if (!ObjectId.isValid(sliderId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid slider ID",
      });
    }

    const db = getDatabase();

    // Get slider to delete
    const sliderToDelete = await db
      .collection("homepage_sliders")
      .findOne({ _id: new ObjectId(sliderId) });

    if (!sliderToDelete) {
      return res.status(404).json({
        success: false,
        error: "Slider not found",
      });
    }

    // Delete the slider
    await db
      .collection("homepage_sliders")
      .deleteOne({ _id: new ObjectId(sliderId) });

    // Reorder remaining sliders
    await db
      .collection("homepage_sliders")
      .updateMany(
        { order: { $gt: sliderToDelete.order } },
        { $inc: { order: -1 } }
      );

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: "Homepage slider deleted successfully",
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

// Initialize default slider (admin)
export const initializeDefaultSlider: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Check if any sliders exist
    const existingSliders = await db
      .collection("homepage_sliders")
      .countDocuments();

    if (existingSliders > 0) {
      return res.json({
        success: true,
        message: "Sliders already exist",
      });
    }

    // Create default slider
    const defaultSlider: Omit<HomepageSlider, "_id"> = {
      title: "Find Properties in Rohtak",
      subtitle: "Search from thousands of listings",
      icon: "🏠",
      backgroundColor: "from-[#C70000] to-red-600",
      textColor: "text-white",
      isActive: true,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("homepage_sliders").insertOne(defaultSlider);

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: "Default homepage slider created successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error initializing default slider:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize default slider",
    });
  }
};
