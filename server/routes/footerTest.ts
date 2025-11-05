import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";

// Test endpoint to verify footer data
export const testFooterData: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get footer settings
    const settings = await db.collection("footer_settings").findOne({});
    
    // Get footer links
    const links = await db.collection("footer_links").find({}).toArray();
    
    // Get counts
    const linksCount = await db.collection("footer_links").countDocuments();
    const activeLinksCount = await db.collection("footer_links").countDocuments({ isActive: true });
    
    const response: ApiResponse<{
      settings: any;
      links: any[];
      stats: {
        totalLinks: number;
        activeLinks: number;
        hasSettings: boolean;
        lastUpdated: string;
      };
    }> = {
      success: true,
      data: {
        settings,
        links,
        stats: {
          totalLinks: linksCount,
          activeLinks: activeLinksCount,
          hasSettings: !!settings,
          lastUpdated: settings?.updatedAt || new Date().toISOString(),
        }
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error testing footer data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test footer data",
    });
  }
};
