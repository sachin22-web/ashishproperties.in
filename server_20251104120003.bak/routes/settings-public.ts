import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";

export const getPublicSettings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const [admin, footer] = await Promise.all([
      db.collection("admin_settings").findOne({}),
      db.collection("footer_settings").findOne({}),
    ]);

    // Only expose safe fields
    const general = admin?.general || {};
    const features = admin?.features || {};

    const response: ApiResponse<any> = {
      success: true,
      data: {
        general,
        features,
        footer: footer || {},
        branding: {
          siteName: general.siteName,
          siteDescription: general.siteDescription,
          siteUrl: general.siteUrl,
          logo: footer?.companyLogo || "",
        },
        contact: footer?.contactInfo || {
          email: general.contactEmail,
          phone: general.contactPhone,
          address: general.address,
        },
        updatedAt:
          (footer && footer.updatedAt) ||
          (admin && (admin as any).updatedAt) ||
          new Date().toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching public settings:", error);
    res.status(500).json({ success: false, error: "Failed to fetch settings" });
  }
};
