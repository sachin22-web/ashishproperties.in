#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

async function initializeOtherServices() {
  console.log("🏠 Initializing Other Services category and subcategories...");
  console.log("=".repeat(60));

  try {
    const { db } = await connectToDatabase();
    console.log("✅ Connected to MongoDB Atlas");

    // First, create the main "Other Services" category
    const otherServicesCategory = {
      name: "Other Services",
      slug: "other-services",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if category already exists
    const existingCategory = await db
      .collection("os_categories")
      .findOne({ slug: "other-services" });

    let categoryId;
    if (existingCategory) {
      console.log("📋 Other Services category already exists, updating...");
      await db
        .collection("os_categories")
        .updateOne(
          { slug: "other-services" },
          { $set: { ...otherServicesCategory, _id: existingCategory._id } }
        );
      categoryId = existingCategory._id;
    } else {
      console.log("📋 Creating Other Services category...");
      const result = await db
        .collection("os_categories")
        .insertOne(otherServicesCategory);
      categoryId = result.insertedId;
    }

    console.log("✅ Other Services category created/updated");

    // Define all required subcategories
    const subcategories = [
      {
        name: "Home Painting",
        slug: "home-painting",
        category: "other-services",
        description: "Professional home painting and wall decoration services",
        active: true,
      },
      {
        name: "Home Cleaning",
        slug: "home-cleaning", 
        category: "other-services",
        description: "Complete home cleaning and housekeeping services",
        active: true,
      },
      {
        name: "Electrician",
        slug: "electrician",
        category: "other-services", 
        description: "Electrical installation, repair, and maintenance services",
        active: true,
      },
      {
        name: "Plumbing",
        slug: "plumbing",
        category: "other-services",
        description: "Plumbing installation, repair, and maintenance services", 
        active: true,
      },
      {
        name: "Carpentry",
        slug: "carpentry",
        category: "other-services",
        description: "Wood work, furniture making, and carpentry services",
        active: true,
      },
      {
        name: "AC Service/Repair",
        slug: "ac-service-repair",
        category: "other-services",
        description: "Air conditioner installation, service, and repair",
        active: true,
      },
      {
        name: "Home Appliances Service/Repair (WM, RO, MW, Fridge)",
        slug: "home-appliances-service-repair",
        category: "other-services", 
        description: "Washing machine, RO, microwave, refrigerator service and repair",
        active: true,
      },
      {
        name: "Home Interiors",
        slug: "home-interiors",
        category: "other-services",
        description: "Interior design, decoration, and home styling services",
        active: true,
      },
      {
        name: "Packers & Movers",
        slug: "packers-movers",
        category: "other-services",
        description: "Professional packing, moving, and relocation services",
        active: true,
      },
    ];

    console.log("📋 Creating/updating subcategories...");

    for (const subcategory of subcategories) {
      const subcategoryData = {
        ...subcategory,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Check if subcategory already exists
      const existing = await db
        .collection("os_subcategories")
        .findOne({ slug: subcategory.slug, category: "other-services" });

      if (existing) {
        console.log(`   ✅ Updating: ${subcategory.name}`);
        await db
          .collection("os_subcategories")
          .updateOne(
            { slug: subcategory.slug, category: "other-services" },
            { $set: subcategoryData }
          );
      } else {
        console.log(`   ➕ Creating: ${subcategory.name}`);
        await db.collection("os_subcategories").insertOne(subcategoryData);
      }
    }

    console.log("✅ All subcategories created/updated");

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY:");
    console.log("✅ Category: Other Services");
    console.log(`✅ Subcategories: ${subcategories.length}`);
    console.log("\n📋 Subcategories created:");
    subcategories.forEach((sub, index) => {
      console.log(`   ${index + 1}. ${sub.name} (${sub.slug})`);
    });

    console.log("\n🎉 Other Services initialization completed successfully!");
    console.log("🌐 Admin can now manage these through: Admin > Other Services");

  } catch (error) {
    console.error("❌ Error initializing Other Services:", error);
    throw error;
  } finally {
    await closeDatabaseConnection();
  }
}

// Run if called directly (ES module way)
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  initializeOtherServices()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { initializeOtherServices };
