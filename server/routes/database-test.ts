import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";

// Test database connectivity and operations
export const testDatabase: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    // Test basic connection
    console.log("🔍 Testing database connection...");
    await db.admin().ping();
    console.log("✅ Database ping successful");

    // Test collections access
    const collections = await db.listCollections().toArray();
    console.log("📚 Available collections:", collections.map(c => c.name));

    // Test users collection
    const usersCount = await db.collection("users").countDocuments();
    console.log("👥 Users count:", usersCount);

    // Test properties collection  
    const propertiesCount = await db.collection("properties").countDocuments();
    console.log("🏠 Properties count:", propertiesCount);

    // Test transactions collection
    const transactionsCount = await db.collection("transactions").countDocuments();
    console.log("💳 Transactions count:", transactionsCount);

    // Test a simple user query
    const adminUser = await db.collection("users").findOne({ userType: "admin" });
    console.log("👨‍💼 Admin user found:", !!adminUser);

    // Test a simple property query
    const sampleProperty = await db.collection("properties").findOne({});
    console.log("🏠 Sample property found:", !!sampleProperty);

    const response: ApiResponse<{
      ping: boolean;
      collections: string[];
      counts: {
        users: number;
        properties: number;
        transactions: number;
      };
      adminExists: boolean;
      samplePropertyExists: boolean;
    }> = {
      success: true,
      data: {
        ping: true,
        collections: collections.map(c => c.name),
        counts: {
          users: usersCount,
          properties: propertiesCount,
          transactions: transactionsCount,
        },
        adminExists: !!adminUser,
        samplePropertyExists: !!sampleProperty,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error("❌ Database test failed:", error);
    res.status(500).json({
      success: false,
      error: `Database test failed: ${error.message}`,
      details: {
        name: error.name,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 3),
      }
    });
  }
};

// Test admin user creation
export const testAdminUser: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    // Check if admin exists
    let adminUser = await db.collection("users").findOne({ userType: "admin" });
    
    if (!adminUser) {
      console.log("🔧 Creating admin user...");
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("admin123", 10);

      const adminData = {
        name: "Administrator",
        email: "admin@aashishproperty.com", 
        phone: "+91 9876543210",
        password: hashedPassword,
        userType: "admin",
        status: "active",
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("users").insertOne(adminData);
      adminUser = await db.collection("users").findOne({ _id: result.insertedId });
      console.log("✅ Admin user created successfully");
    }

    res.json({
      success: true,
      data: {
        adminExists: !!adminUser,
        adminEmail: adminUser?.email,
        adminUserType: adminUser?.userType,
        message: adminUser ? "Admin user exists" : "Admin user created"
      }
    });
  } catch (error: any) {
    console.error("❌ Admin user test failed:", error);
    res.status(500).json({
      success: false,
      error: `Admin user test failed: ${error.message}`,
    });
  }
};

// Test specific admin API that's failing
export const testAdminStats: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    console.log("🧮 Testing admin stats generation...");

    // Test the exact same query as getUserStats
    const stats = await db
      .collection("users")
      .aggregate([
        {
          $group: {
            _id: "$userType",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const totalUsers = await db.collection("users").countDocuments();
    const totalProperties = await db.collection("properties").countDocuments();
    const activeProperties = await db
      .collection("properties")
      .countDocuments({ status: "active" });

    console.log("📊 Stats calculated successfully:", {
      totalUsers,
      totalProperties,
      activeProperties,
      usersByType: stats,
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProperties,
        activeProperties,
        usersByType: stats,
      },
    });
  } catch (error: any) {
    console.error("❌ Admin stats test failed:", error);
    res.status(500).json({
      success: false,
      error: `Admin stats test failed: ${error.message}`,
    });
  }
};
