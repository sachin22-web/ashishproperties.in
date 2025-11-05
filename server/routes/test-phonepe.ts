import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import crypto from "crypto";

// Test PhonePe configuration
export const testPhonePeConfig: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Get PhonePe settings
    const settings = await db.collection("admin_settings").findOne({});

    if (!settings || !settings.payment || !settings.payment.phonePe) {
      return res.json({
        success: false,
        error: "PhonePe settings not found in database",
        data: {
          hasSettings: false,
          phonePeEnabled: false,
        },
      });
    }

    const phonePeConfig = settings.payment.phonePe;

    // Check if all required fields are present
    const missingFields = [];
    if (!phonePeConfig.merchantId) missingFields.push("merchantId");
    if (!phonePeConfig.saltKey) missingFields.push("saltKey");
    if (!phonePeConfig.saltIndex) missingFields.push("saltIndex");

    // Test checksum generation
    let checksumTest = null;
    if (phonePeConfig.saltKey) {
      try {
        const testPayload = "test";
        const testEndpoint = "/test";
        const data = testPayload + testEndpoint + phonePeConfig.saltKey;
        const hash = crypto.createHash("sha256").update(data).digest("hex");
        const checksum = hash + "###" + phonePeConfig.saltIndex;
        checksumTest = {
          success: true,
          checksum: checksum.substring(0, 20) + "...", // Show partial for security
        };
      } catch (error) {
        checksumTest = {
          success: false,
          error: error.message,
        };
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        hasSettings: true,
        phonePeEnabled: phonePeConfig.enabled,
        testMode: phonePeConfig.testMode,
        hasMerchantId: !!phonePeConfig.merchantId,
        merchantIdLength: phonePeConfig.merchantId
          ? phonePeConfig.merchantId.length
          : 0,
        hasSaltKey: !!phonePeConfig.saltKey,
        saltKeyLength: phonePeConfig.saltKey ? phonePeConfig.saltKey.length : 0,
        saltIndex: phonePeConfig.saltIndex,
        missingFields,
        checksumTest,
        apiUrl: phonePeConfig.testMode
          ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
          : "https://api.phonepe.com/apis/hermes",
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error testing PhonePe config:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test PhonePe configuration",
      details: error.message,
    });
  }
};

// Test payment methods endpoint
export const testPaymentMethods: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Get admin settings
    const settings = await db.collection("admin_settings").findOne({});

    const paymentMethods = {
      upi: {
        enabled: true,
        upiId: "aashishproperty@paytm",
        qrCode: "/api/payments/upi-qr",
      },
      bankTransfer: {
        enabled: true,
        bankName: "State Bank of India",
        accountNumber: "1234567890",
        ifscCode: "SBIN0001234",
        accountHolder: "Aashish Property",
      },
      online: {
        enabled: true,
        gateways: ["razorpay", "stripe"],
      },
      phonepe: {
        enabled: settings?.payment?.phonePe?.enabled || false,
        merchantId: settings?.payment?.phonePe?.merchantId || "",
        testMode: settings?.payment?.phonePe?.testMode || true,
        configured: !!(
          settings?.payment?.phonePe?.merchantId &&
          settings?.payment?.phonePe?.saltKey
        ),
      },
    };

    const response: ApiResponse<any> = {
      success: true,
      data: paymentMethods,
    };

    res.json(response);
  } catch (error) {
    console.error("Error testing payment methods:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test payment methods",
    });
  }
};

// Test database connection
export const testDatabaseConnection: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Test basic database operations
    const collections = await db.listCollections().toArray();
    const stats = await db.stats();

    // Test admin_settings collection
    const settingsCount = await db
      .collection("admin_settings")
      .countDocuments();
    const usersCount = await db.collection("users").countDocuments();

    const response: ApiResponse<any> = {
      success: true,
      data: {
        connected: true,
        collections: collections.map((c) => c.name),
        collectionsCount: collections.length,
        dbStats: {
          collections: stats.collections,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
        },
        testCounts: {
          adminSettings: settingsCount,
          users: usersCount,
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error testing database:", error);
    res.status(500).json({
      success: false,
      error: "Database connection failed",
      details: error.message,
    });
  }
};
