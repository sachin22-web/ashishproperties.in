import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

interface FooterLink {
  _id?: ObjectId;
  title: string;
  url: string;
  section: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FooterSettings {
  _id?: ObjectId;
  companyName: string;
  companyDescription: string;
  companyLogo: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  showLocations: boolean;
  locations: string[];
  updatedAt: Date;
}

// Get all footer links
export const getAllFooterLinks: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    const links = await db
      .collection("footer_links")
      .find({})
      .sort({ section: 1, order: 1 })
      .toArray();

    const response: ApiResponse<FooterLink[]> = {
      success: true,
      data: links as FooterLink[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching footer links:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch footer links",
    });
  }
};

// Get active footer links (public)
export const getActiveFooterLinks: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    const links = await db
      .collection("footer_links")
      .find({ isActive: true })
      .sort({ section: 1, order: 1 })
      .toArray();

    const response: ApiResponse<FooterLink[]> = {
      success: true,
      data: links as FooterLink[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching active footer links:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch footer links",
    });
  }
};

// Create new footer link (admin only)
export const createFooterLink: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      title,
      url,
      section,
      order = 0,
      isActive = true,
      isExternal = false,
    } = req.body;

    if (!title || !url || !section) {
      return res.status(400).json({
        success: false,
        error: "Title, URL, and section are required",
      });
    }

    const newLink: Omit<FooterLink, "_id"> = {
      title,
      url,
      section,
      order,
      isActive,
      isExternal,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("footer_links").insertOne(newLink);

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating footer link:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create footer link",
    });
  }
};

// Update footer link (admin only)
export const updateFooterLink: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { linkId } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(linkId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid link ID",
      });
    }

    delete updateData._id;
    updateData.updatedAt = new Date();

    const result = await db
      .collection("footer_links")
      .updateOne({ _id: new ObjectId(linkId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Footer link not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Footer link updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating footer link:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update footer link",
    });
  }
};

// Delete footer link (admin only)
export const deleteFooterLink: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { linkId } = req.params;

    if (!ObjectId.isValid(linkId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid link ID",
      });
    }

    const result = await db
      .collection("footer_links")
      .deleteOne({ _id: new ObjectId(linkId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Footer link not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Footer link deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting footer link:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete footer link",
    });
  }
};

// Get footer settings
export const getFooterSettings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    let settings = await db.collection("footer_settings").findOne({});
    
    // If no settings exist, create default ones
    if (!settings) {
      const defaultSettings: Omit<FooterSettings, "_id"> = {
        companyName: "POSTTRR",
        companyDescription: "Share your unique properties, boost your sales online and connect with verified buyers. It's a community where your control is a priority.",
        companyLogo: "P",
        socialLinks: {
          facebook: "",
          twitter: "",
          instagram: "",
          youtube: ""
        },
        contactInfo: {
          phone: "",
          email: "",
          address: ""
        },
        showLocations: true,
        locations: ["Kolkata", "Mumbai", "Chennai", "Pune", "Delhi", "Bangalore"],
        updatedAt: new Date(),
      };

      const result = await db.collection("footer_settings").insertOne(defaultSettings);
      settings = { ...defaultSettings, _id: result.insertedId };
    }

    const response: ApiResponse<FooterSettings> = {
      success: true,
      data: settings as FooterSettings,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching footer settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch footer settings",
    });
  }
};

// Update footer settings (admin only)
export const updateFooterSettings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const updateData = { ...req.body };

    // Remove _id field to prevent MongoDB immutable field error
    delete updateData._id;
    updateData.updatedAt = new Date();

    const result = await db
      .collection("footer_settings")
      .updateOne(
        {},
        { $set: updateData },
        { upsert: true }
      );

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Footer settings updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating footer settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update footer settings",
    });
  }
};

// Initialize default footer data
export const initializeFooterData: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Check if footer data already exists
    const existingLinks = await db.collection("footer_links").countDocuments();
    const existingSettings = await db.collection("footer_settings").countDocuments();

    if (existingLinks === 0) {
      // Create default footer links
      const defaultLinks = [
        {
          title: "About Us",
          url: "/about-us",
          section: "quick_links",
          order: 1,
          isActive: true,
          isExternal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Contact Us",
          url: "/contact-us",
          section: "quick_links",
          order: 2,
          isActive: true,
          isExternal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Privacy Policy",
          url: "/privacy-policy",
          section: "legal",
          order: 1,
          isActive: true,
          isExternal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Terms & Conditions",
          url: "/terms-conditions",
          section: "legal",
          order: 2,
          isActive: true,
          isExternal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await db.collection("footer_links").insertMany(defaultLinks);
    }

    if (existingSettings === 0) {
      // Create default footer settings
      const defaultSettings = {
        companyName: "POSTTRR",
        companyDescription: "Share your unique properties, boost your sales online and connect with verified buyers. It's a community where your control is a priority.",
        companyLogo: "P",
        socialLinks: {},
        contactInfo: {},
        showLocations: true,
        locations: ["Kolkata", "Mumbai", "Chennai", "Pune", "Delhi", "Bangalore"],
        updatedAt: new Date(),
      };

      await db.collection("footer_settings").insertOne(defaultSettings);
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { 
        message: `Footer data initialized successfully. Links: ${existingLinks === 0 ? 'created' : 'existed'}, Settings: ${existingSettings === 0 ? 'created' : 'existed'}` 
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error initializing footer data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize footer data",
    });
  }
};
