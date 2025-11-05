import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";

interface AdminSettings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    currency: string;
    timezone: string;
  };
  features: {
    enableUserRegistration: boolean;
    enablePropertyPosting: boolean;
    enableChat: boolean;
    enableNotifications: boolean;
    requirePropertyApproval: boolean;
    enableSellerVerification: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  payment: {
    enablePayments: boolean;
    paymentGateway: string;
    paymentApiKey: string;
    commissionRate: number;
    phonePe: {
      enabled: boolean;
      merchantId: string;
      saltKey: string;
      saltIndex: string;
      testMode: boolean;
    };
    adsense?: {
      enabled: boolean;
      clientId: string;
      slots: Record<string, string>;
      disabledRoutes: string[];
      testMode: boolean;
    };
  };
}

// Get admin settings
export const getAdminSettings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    let settings = await db.collection("admin_settings").findOne({});

    if (!settings) {
      // Create default settings if they don't exist
      const defaultSettings: AdminSettings = {
        general: {
          siteName: "Aashish Property",
          siteDescription: "Your trusted partner in real estate solutions",
          siteUrl: "",
          contactEmail: "contact@aashishproperty.com",
          contactPhone: "+91 9876543210",
          address: "",
          currency: "INR",
          timezone: "Asia/Kolkata",
        },
        features: {
          enableUserRegistration: true,
          enablePropertyPosting: true,
          enableChat: true,
          enableNotifications: true,
          requirePropertyApproval: true,
          enableSellerVerification: true,
        },
        email: {
          smtpHost: "",
          smtpPort: 587,
          smtpUsername: "",
          smtpPassword: "",
          fromEmail: "",
          fromName: "",
        },
        payment: {
          enablePayments: false,
          paymentGateway: "razorpay",
          paymentApiKey: "",
          commissionRate: 5,
          phonePe: {
            enabled: false,
            merchantId: "",
            saltKey: "",
            saltIndex: "1",
            testMode: true,
          },
        },
        adsense: {
          enabled: false,
          clientId: "",
          slots: {
            below_categories: "",
            header: "",
            footer: "",
            sidebar: "",
            inline: "",
          },
          disabledRoutes: [],
          testMode: true,
        },
      };

      await db.collection("admin_settings").insertOne(defaultSettings);
      settings = defaultSettings;
    }

    const response: ApiResponse<AdminSettings> = {
      success: true,
      data: settings as AdminSettings,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin settings",
    });
  }
};

// Update admin settings
export const updateAdminSettings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const settingsData = req.body as AdminSettings;

    // Add timestamps
    const updateData = {
      ...settingsData,
      updatedAt: new Date(),
    };

    const result = await db
      .collection("admin_settings")
      .replaceOne({}, updateData, { upsert: true });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Settings updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating admin settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update admin settings",
    });
  }
};

// Get PhonePe configuration
export const getPhonePeConfig: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const settings = await db.collection("admin_settings").findOne({});

    if (!settings || !settings.payment || !settings.payment.phonePe) {
      return res.json({
        success: true,
        data: {
          enabled: false,
          merchantId: "",
          saltKey: "",
          saltIndex: "1",
          testMode: true,
        },
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: settings.payment.phonePe,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching PhonePe config:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch PhonePe configuration",
    });
  }
};

// Update PhonePe configuration
export const updatePhonePeConfig: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { enabled, merchantId, saltKey, saltIndex, testMode } = req.body;

    const result = await db.collection("admin_settings").updateOne(
      {},
      {
        $set: {
          "payment.phonePe": {
            enabled,
            merchantId,
            saltKey,
            saltIndex,
            testMode,
          },
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "PhonePe configuration updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating PhonePe config:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update PhonePe configuration",
    });
  }
};
