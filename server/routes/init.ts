import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { User, AdPackage, ApiResponse } from "@shared/types";
import bcrypt from "bcrypt";

// Category initialization with proper property types mapping
async function initializePropertyCategories() {
  const db = getDatabase();
  console.log("🏠 Initializing Property Categories...");

  const categories = [
    {
      name: "Buy",
      slug: "buy",
      description: "Buy properties - apartments, houses, plots and more",
      propertyTypes: ["residential", "plot"],
      priceTypes: ["sale"],
      sortOrder: 1,
      isActive: true,
      subcategories: [
        { name: "1 BHK", slug: "1bhk" },
        { name: "2 BHK", slug: "2bhk" },
        { name: "3 BHK", slug: "3bhk" },
        { name: "4+ BHK", slug: "4bhk-plus" },
        { name: "Independent House", slug: "independent-house" },
        { name: "Villa", slug: "villa" },
        { name: "Builder Floor", slug: "builder-floor" },
        { name: "Plot/Land", slug: "plot" },
      ],
    },
    {
      name: "Rent",
      slug: "rent",
      description: "Rent properties - apartments, houses and more",
      propertyTypes: ["residential"],
      priceTypes: ["rent"],
      sortOrder: 2,
      isActive: true,
      subcategories: [
        { name: "1 BHK", slug: "1bhk" },
        { name: "2 BHK", slug: "2bhk" },
        { name: "3 BHK", slug: "3bhk" },
        { name: "4+ BHK", slug: "4bhk-plus" },
        { name: "Independent House", slug: "independent-house" },
      ],
    },
    {
      name: "Commercial",
      slug: "commercial",
      description: "Commercial properties",
      propertyTypes: ["commercial"],
      sortOrder: 3,
      isActive: true,
      subcategories: [
        { name: "Office Space", slug: "office-space" },
        { name: "Shop/Showroom", slug: "shop-showroom" },
        { name: "Warehouse", slug: "warehouse" },
      ],
    },
    {
      name: "Agricultural",
      slug: "agricultural",
      description: "Agricultural properties",
      propertyTypes: ["agricultural"],
      sortOrder: 4,
      isActive: true,
      subcategories: [
        { name: "Agricultural Land", slug: "agricultural-land" },
        { name: "Farmhouse with Land", slug: "farmhouse-with-land" },
      ],
    },
    {
      name: "PG/Hostel",
      slug: "pg",
      description: "Paying guest and hostel accommodations",
      propertyTypes: ["pg"],
      sortOrder: 5,
      isActive: true,
      subcategories: [
        { name: "Boys PG", slug: "boys-pg" },
        { name: "Girls PG", slug: "girls-pg" },
        { name: "Co-living", slug: "co-living" },
      ],
    },
  ];

  try {
    for (const categoryData of categories) {
      const existingCategory = await db
        .collection("categories")
        .findOne({ slug: categoryData.slug });

      const categoryDoc = {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        propertyTypes: categoryData.propertyTypes,
        priceTypes: categoryData.priceTypes,
        sortOrder: categoryData.sortOrder,
        isActive: categoryData.isActive,
        subcategories: categoryData.subcategories,
        createdAt: existingCategory?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (existingCategory) {
        await db
          .collection("categories")
          .updateOne({ slug: categoryData.slug }, { $set: categoryDoc });
      } else {
        await db.collection("categories").insertOne(categoryDoc);
      }
    }

    console.log("✅ Property categories initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Error initializing categories:", error);
    return false;
  }
}

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
        await db.collection("users").insertOne({
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

  // 4. Categories - Initialize with proper property type mapping
  try {
    const categoriesInitialized = await initializePropertyCategories();
    if (categoriesInitialized) {
      resultSummary.categoriesCreated = true;
    }
  } catch (e: any) {
    console.error("Categories initialization error:", e?.message || e);
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
