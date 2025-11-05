import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { User, AdPackage, ApiResponse } from "@shared/types";
import bcrypt from "bcrypt";

// Shared seeding logic for initializing default data
export async function seedDefaultData() {
  const db = getDatabase();
  console.log("🚀 Seeding default system data...");

  const resultSummary: any = {
    adminCreated: false,
    testUsersCreated: 0,
    packagesCreated: 0,
    categoriesCreated: 0,
  };

  // 1. Admin user
  try {
    const existingAdmin = await db
      .collection("users")
      .findOne({ userType: "admin" });
    if (!existingAdmin) {
      console.log("📝 Creating default admin user...");
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
      const r = await db.collection("users").insertOne(adminUser);
      resultSummary.adminCreated = true;
      console.log("✅ Admin user created", r.insertedId);
    } else {
      console.log("✅ Admin already exists");
    }
  } catch (e: any) {
    console.error("Admin seeding error:", e?.message || e);
  }

  // 2. Test users
  try {
    const testUsers = [
      {
        name: "Test Seller",
        email: "seller@test.com",
        phone: "+91 9876543211",
        password: "password123",
        userType: "seller",
      },
      {
        name: "Test Buyer",
        email: "buyer@test.com",
        phone: "+91 9876543212",
        password: "password123",
        userType: "buyer",
      },
      {
        name: "Test Agent",
        email: "agent@test.com",
        phone: "+91 9876543213",
        password: "password123",
        userType: "agent",
      },
    ];

    for (const u of testUsers) {
      const exists = await db.collection("users").findOne({ email: u.email });
      if (!exists) {
        const hashed = await bcrypt.hash(u.password, 10);
        await db
          .collection("users")
          .insertOne({
            ...u,
            password: hashed,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        resultSummary.testUsersCreated++;
      }
    }
    console.log(`✅ Test users created: ${resultSummary.testUsersCreated}`);
  } catch (e: any) {
    console.error("Test users seeding error:", e?.message || e);
  }

  // 3. Ad packages
  try {
    const existingPackages = await db
      .collection("ad_packages")
      .countDocuments();
    if (existingPackages === 0) {
      const defaultPackages = [
        {
          name: "Basic Listing",
          description: "Standard property listing with basic visibility",
          price: 0,
          duration: 30,
          features: ["30 days listing"],
          type: "basic",
          category: "property",
          location: "rohtak",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Featured Listing",
          description: "Enhanced visibility with featured badge",
          price: 299,
          duration: 30,
          features: ["Featured badge"],
          type: "featured",
          category: "property",
          location: "rohtak",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Premium Listing",
          description: "Maximum visibility with premium features",
          price: 599,
          duration: 30,
          features: ["Premium badge"],
          type: "premium",
          category: "property",
          location: "rohtak",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const r = await db.collection("ad_packages").insertMany(defaultPackages);
      resultSummary.packagesCreated = r.insertedCount || defaultPackages.length;
      console.log("✅ Ad packages seeded");
    }
  } catch (e: any) {
    console.error("Ad packages seeding error:", e?.message || e);
  }

  // 4. Categories
  try {
    const existingCategories = await db
      .collection("categories")
      .countDocuments();
    if (existingCategories === 0) {
      const defaultCategories = [
        {
          name: "Residential",
          slug: "residential",
          icon: "🏠",
          description: "Residential properties",
          subcategories: [
            { name: "1 BHK", slug: "1bhk", icon: "🏠" },
            { name: "2 BHK", slug: "2bhk", icon: "🏠" },
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
          ],
          order: 2,
          active: true,
        },
      ];
      const r = await db.collection("categories").insertMany(defaultCategories);
      resultSummary.categoriesCreated =
        r.insertedCount || defaultCategories.length;
      console.log("✅ Categories seeded");
    } else {
      console.log("✅ Categories already present");
    }
  } catch (e: any) {
    console.error("Categories seeding error:", e?.message || e);
  }

  console.log("🎉 Seeding complete", resultSummary);
  return resultSummary;
}

// Initialize system with default data
export const initializeSystem: RequestHandler = async (req, res) => {
  try {
    const summary = await seedDefaultData();
    res.json({
      success: true,
      data: summary,
      message: "System initialized successfully",
    });
  } catch (error: any) {
    console.error("❌ Error initializing system:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to initialize system" });
  }
};
