import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import bcrypt from "bcrypt";

// Force create admin user
export const forceCreateAdmin: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    console.log("🔧 Force creating admin user...");

    // First, remove any existing admin users to avoid conflicts
    await db.collection("users").deleteMany({ userType: "admin" });
    console.log("🗑️ Removed existing admin users");

    // Create new admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = {
      name: "Administrator",
      email: "admin@aashishproperty.com",
      phone: "+91 9876543210",
      password: hashedPassword,
      userType: "admin",
      status: "active",
      isVerified: true,
      preferences: {
        propertyTypes: [],
        priceRange: { min: 0, max: 10000000 },
        locations: [],
      },
      favorites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(adminUser);
    console.log("✅ Admin user created with ID:", result.insertedId);

    // Verify the admin user was created
    const createdAdmin = await db.collection("users").findOne({ _id: result.insertedId });
    
    const response: ApiResponse<{
      success: boolean;
      admin: any;
      credentials: {
        email: string;
        password: string;
      };
    }> = {
      success: true,
      data: {
        success: true,
        admin: {
          id: createdAdmin?._id,
          email: createdAdmin?.email,
          name: createdAdmin?.name,
          userType: createdAdmin?.userType,
        },
        credentials: {
          email: "admin@aashishproperty.com",
          password: "admin123",
        },
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error("❌ Failed to create admin user:", error);
    res.status(500).json({
      success: false,
      error: `Failed to create admin user: ${error.message}`,
    });
  }
};

// Fix all admin endpoints by testing them
export const fixAdminEndpoints: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const results = {
      databaseConnection: false,
      adminUserExists: false,
      usersCollection: false,
      propertiesCollection: false,
      transactionsCollection: false,
      categoriesCollection: false,
      errors: [] as string[],
    };

    try {
      // Test database connection
      await db.admin().ping();
      results.databaseConnection = true;
      console.log("✅ Database connection successful");
    } catch (error: any) {
      results.errors.push(`Database connection failed: ${error.message}`);
    }

    try {
      // Check admin user
      const adminUser = await db.collection("users").findOne({ userType: "admin" });
      results.adminUserExists = !!adminUser;
      if (!adminUser) {
        results.errors.push("No admin user found");
      } else {
        console.log("✅ Admin user found:", adminUser.email);
      }
    } catch (error: any) {
      results.errors.push(`Admin user check failed: ${error.message}`);
    }

    try {
      // Test users collection
      const usersCount = await db.collection("users").countDocuments();
      results.usersCollection = usersCount >= 0;
      console.log("✅ Users collection accessible, count:", usersCount);
    } catch (error: any) {
      results.errors.push(`Users collection failed: ${error.message}`);
    }

    try {
      // Test properties collection
      const propertiesCount = await db.collection("properties").countDocuments();
      results.propertiesCollection = propertiesCount >= 0;
      console.log("✅ Properties collection accessible, count:", propertiesCount);
    } catch (error: any) {
      results.errors.push(`Properties collection failed: ${error.message}`);
    }

    try {
      // Test transactions collection
      const transactionsCount = await db.collection("transactions").countDocuments();
      results.transactionsCollection = transactionsCount >= 0;
      console.log("✅ Transactions collection accessible, count:", transactionsCount);
    } catch (error: any) {
      results.errors.push(`Transactions collection failed: ${error.message}`);
    }

    try {
      // Test categories collection
      const categoriesCount = await db.collection("categories").countDocuments();
      results.categoriesCollection = categoriesCount >= 0;
      console.log("✅ Categories collection accessible, count:", categoriesCount);
    } catch (error: any) {
      results.errors.push(`Categories collection failed: ${error.message}`);
    }

    const allGood = results.databaseConnection && 
                   results.adminUserExists && 
                   results.usersCollection && 
                   results.propertiesCollection;

    res.json({
      success: allGood,
      data: results,
      message: allGood ? "All admin endpoints are working" : "Some issues found with admin endpoints",
    });
  } catch (error: any) {
    console.error("❌ Fix admin endpoints failed:", error);
    res.status(500).json({
      success: false,
      error: `Failed to check admin endpoints: ${error.message}`,
    });
  }
};

// Initialize all required collections and data
export const initializeSystemData: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const results = {
      adminCreated: false,
      categoriesInitialized: false,
      packagesInitialized: false,
      bannersInitialized: false,
      errors: [] as string[],
    };

    // 1. Create admin user if not exists
    try {
      const existingAdmin = await db.collection("users").findOne({ userType: "admin" });
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const adminUser = {
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
        await db.collection("users").insertOne(adminUser);
        results.adminCreated = true;
        console.log("✅ Admin user created");
      } else {
        results.adminCreated = true;
        console.log("✅ Admin user already exists");
      }
    } catch (error: any) {
      results.errors.push(`Admin creation failed: ${error.message}`);
    }

    // 2. Initialize categories if empty
    try {
      const categoriesCount = await db.collection("categories").countDocuments();
      if (categoriesCount === 0) {
        const defaultCategories = [
          {
            name: "Residential",
            slug: "residential",
            icon: "🏠",
            description: "Residential properties",
            subcategories: [
              { name: "1 BHK", slug: "1bhk", icon: "🏠" },
              { name: "2 BHK", slug: "2bhk", icon: "🏠" },
              { name: "3 BHK", slug: "3bhk", icon: "🏠" },
              { name: "4 BHK", slug: "4bhk", icon: "🏠" },
              { name: "Villa", slug: "villa", icon: "🏡" },
            ],
            order: 1,
            active: true,
          },
          {
            name: "Commercial",
            slug: "commercial",
            icon: "🏢",
            description: "Commercial properties",
            subcategories: [
              { name: "Office", slug: "office", icon: "🏢" },
              { name: "Shop", slug: "shop", icon: "🏪" },
              { name: "Warehouse", slug: "warehouse", icon: "🏭" },
            ],
            order: 2,
            active: true,
          },
          {
            name: "Plot/Land",
            slug: "plot",
            icon: "🌾",
            description: "Plots and land",
            subcategories: [
              { name: "Residential Plot", slug: "residential-plot", icon: "🌾" },
              { name: "Commercial Plot", slug: "commercial-plot", icon: "🌾" },
              { name: "Agricultural Land", slug: "agricultural", icon: "🌾" },
            ],
            order: 3,
            active: true,
          },
        ];
        await db.collection("categories").insertMany(defaultCategories);
        results.categoriesInitialized = true;
        console.log("✅ Categories initialized");
      } else {
        results.categoriesInitialized = true;
        console.log("✅ Categories already exist");
      }
    } catch (error: any) {
      results.errors.push(`Categories initialization failed: ${error.message}`);
    }

    res.json({
      success: results.errors.length === 0,
      data: results,
      message: results.errors.length === 0 ? "System initialized successfully" : "Some initialization failed",
    });
  } catch (error: any) {
    console.error("❌ System initialization failed:", error);
    res.status(500).json({
      success: false,
      error: `System initialization failed: ${error.message}`,
    });
  }
};
