import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

// Create sample transactions for testing
export const createSampleTransactions: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Get some sample users and packages
    const users = await db.collection("users").find({}).limit(5).toArray();
    const packages = await db.collection("ad_packages").find({}).limit(3).toArray();

    if (users.length === 0 || packages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Need at least 1 user and 1 package to create sample transactions",
      });
    }

    const sampleTransactions = [
      {
        userId: users[0]._id.toString(),
        userName: users[0].name || "Sample User 1",
        userEmail: users[0].email || "user1@example.com",
        packageId: packages[0]._id.toString(),
        packageName: packages[0].name || "Basic Package",
        amount: packages[0].price || 500,
        type: "package_purchase",
        status: "pending",
        paymentMethod: "upi",
        transactionId: `TXN${Date.now()}001`,
        description: "Package purchase - Basic listing upgrade",
        paymentDetails: {
          upiId: "testuser@paytm",
          transactionId: `UPI${Date.now()}001`
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: users[1]._id.toString(),
        userName: users[1].name || "Sample User 2", 
        userEmail: users[1].email || "user2@example.com",
        packageId: packages[0]._id.toString(),
        packageName: packages[0].name || "Premium Package",
        amount: 1000,
        type: "featured_upgrade",
        status: "completed",
        paymentMethod: "card",
        transactionId: `TXN${Date.now()}002`,
        description: "Featured property upgrade",
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000),
      },
      {
        userId: users[2]._id.toString(),
        userName: users[2].name || "Sample User 3",
        userEmail: users[2].email || "user3@example.com",
        packageId: packages[0]._id.toString(),
        packageName: packages[0].name || "Standard Package",
        amount: 750,
        type: "listing_fee",
        status: "failed",
        paymentMethod: "bank_transfer",
        transactionId: `TXN${Date.now()}003`,
        description: "Property listing fee payment via bank transfer",
        paymentDetails: {
          bankAccount: "9876543210123456",
          transactionId: `BANK${Date.now()}003`
        },
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        updatedAt: new Date(Date.now() - 172800000),
      },
      {
        userId: users[0]._id.toString(),
        userName: users[0].name || "Sample User 1",
        userEmail: users[0].email || "user1@example.com",
        packageId: packages[1]._id.toString(),
        packageName: packages[1].name || "Premium Package",
        amount: 300,
        type: "refund",
        status: "completed",
        paymentMethod: "upi",
        transactionId: `TXN${Date.now()}004`,
        description: "Refund for cancelled premium upgrade",
        paymentDetails: {
          upiId: "anotheruser@gpay",
          transactionId: `UPI${Date.now()}004`
        },
        createdAt: new Date(Date.now() - 259200000), // 3 days ago
        updatedAt: new Date(Date.now() - 259200000),
      },
      {
        userId: users[3]._id.toString(),
        userName: users[3].name || "Sample User 4",
        userEmail: users[3].email || "user4@example.com",
        packageId: packages[2]._id.toString(),
        packageName: packages[2].name || "Enterprise Package",
        amount: 2000,
        type: "package_purchase",
        status: "pending",
        paymentMethod: "wallet",
        transactionId: `TXN${Date.now()}005`,
        description: "Enterprise package subscription",
        createdAt: new Date(Date.now() - 345600000), // 4 days ago
        updatedAt: new Date(Date.now() - 345600000),
      }
    ];

    // Insert sample transactions
    const result = await db.collection("transactions").insertMany(sampleTransactions);

    const response: ApiResponse<{ message: string; count: number }> = {
      success: true,
      data: { 
        message: "Sample transactions created successfully",
        count: result.insertedCount
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating sample transactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create sample transactions",
    });
  }
};

// Clear all transactions (for testing only)
export const clearAllTransactions: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    const result = await db.collection("transactions").deleteMany({});

    const response: ApiResponse<{ message: string; deletedCount: number }> = {
      success: true,
      data: { 
        message: "All transactions cleared",
        deletedCount: result.deletedCount
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error clearing transactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear transactions",
    });
  }
};
