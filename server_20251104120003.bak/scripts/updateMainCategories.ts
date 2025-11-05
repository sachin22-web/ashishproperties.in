#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

async function updateMainCategories() {
  console.log("🏠 Updating Main Categories to Final Set...");
  console.log("=".repeat(60));

  try {
    const { db } = await connectToDatabase();
    console.log("✅ Connected to MongoDB Atlas");

    // Define the final set of categories
    const finalCategories = [
      {
        name: "Buy",
        slug: "buy",
        iconUrl: "🏠",
        sortOrder: 1,
        isActive: true,
      },
      {
        name: "Sale",
        slug: "sale", 
        iconUrl: "💰",
        sortOrder: 2,
        isActive: true,
      },
      {
        name: "Rent",
        slug: "rent",
        iconUrl: "🏡",
        sortOrder: 3,
        isActive: true,
      },
      {
        name: "Lease",
        slug: "lease",
        iconUrl: "📝",
        sortOrder: 4,
        isActive: true,
      },
      {
        name: "PG",
        slug: "pg",
        iconUrl: "🏨",
        sortOrder: 5,
        isActive: true,
      },
      {
        name: "Other Services",
        slug: "other-services",
        iconUrl: "🔧",
        sortOrder: 6,
        isActive: true,
      },
      {
        name: "Top Property",
        slug: "top-property",
        iconUrl: "⭐",
        sortOrder: 7,
        isActive: true,
      },
    ];

    // First, let's examine what we currently have
    console.log("📋 Examining current categories...");
    const currentCategories = await db
      .collection("categories")
      .find({})
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray();

    console.log(`📊 Current categories count: ${currentCategories.length}`);
    if (currentCategories.length > 0) {
      console.log("   Current categories:");
      currentCategories.forEach((cat: any, index: number) => {
        console.log(`   ${index + 1}. ${cat.name} (${cat.slug}) - Active: ${cat.isActive || cat.active}`);
      });
    }

    // Get final category slugs for reference
    const finalSlugs = new Set(finalCategories.map(cat => cat.slug));

    // Find categories to remove (not in final set)
    const categoriesToRemove = currentCategories.filter((cat: any) => 
      !finalSlugs.has(cat.slug)
    );

    console.log(`\n🗑️  Categories to remove: ${categoriesToRemove.length}`);
    if (categoriesToRemove.length > 0) {
      categoriesToRemove.forEach((cat: any) => {
        console.log(`   - ${cat.name} (${cat.slug})`);
      });
    }

    // Check for subcategories in categories to be removed
    for (const category of categoriesToRemove) {
      const subcategoriesCount = await db
        .collection("subcategories")
        .countDocuments({ categoryId: category._id.toString() });

      if (subcategoriesCount > 0) {
        console.log(`   ⚠️  Category "${category.name}" has ${subcategoriesCount} subcategories`);
        
        // Remove subcategories first
        console.log(`   🗑️  Removing subcategories for "${category.name}"`);
        await db
          .collection("subcategories")
          .deleteMany({ categoryId: category._id.toString() });
        console.log(`   ✅ Removed ${subcategoriesCount} subcategories`);
      }
    }

    // Remove old categories
    if (categoriesToRemove.length > 0) {
      const removeIds = categoriesToRemove.map(cat => cat._id);
      const removeResult = await db
        .collection("categories")
        .deleteMany({ _id: { $in: removeIds } });
      
      console.log(`✅ Removed ${removeResult.deletedCount} old categories`);
    }

    // Now create/update the final categories
    console.log("\n📋 Creating/updating final categories...");

    for (const categoryData of finalCategories) {
      const existingCategory = await db
        .collection("categories")
        .findOne({ slug: categoryData.slug });

      const categoryDoc = {
        ...categoryData,
        createdAt: existingCategory ? existingCategory.createdAt : new Date(),
        updatedAt: new Date(),
      };

      if (existingCategory) {
        // Update existing category
        await db
          .collection("categories")
          .updateOne(
            { slug: categoryData.slug },
            { $set: categoryDoc }
          );
        console.log(`   ✅ Updated: ${categoryData.name}`);
      } else {
        // Create new category
        await db.collection("categories").insertOne(categoryDoc);
        console.log(`   ➕ Created: ${categoryData.name}`);
      }
    }

    // Final verification
    console.log("\n📊 FINAL VERIFICATION:");
    const finalResult = await db
      .collection("categories")
      .find({})
      .sort({ sortOrder: 1 })
      .toArray();

    console.log(`✅ Total categories: ${finalResult.length}`);
    console.log("📋 Final category list:");
    finalResult.forEach((cat: any, index: number) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.slug}) - Active: ${cat.isActive} - Order: ${cat.sortOrder}`);
    });

    // Check Other Services subcategories
    console.log("\n🔧 Checking Other Services subcategories...");
    const osSubcategories = await db
      .collection("os_subcategories")
      .find({ category: "other-services" })
      .toArray();

    console.log(`📊 Other Services subcategories: ${osSubcategories.length}`);
    if (osSubcategories.length > 0) {
      console.log("   Subcategories:");
      osSubcategories.forEach((sub: any, index: number) => {
        console.log(`   ${index + 1}. ${sub.name} (${sub.slug}) - Active: ${sub.active}`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Main Categories Update Completed Successfully!");
    console.log(`✅ Categories: ${finalResult.length}`);
    console.log(`✅ Other Services Subcategories: ${osSubcategories.length}`);
    console.log("🌐 Admin can now manage these through: Admin > Categories");

  } catch (error) {
    console.error("❌ Error updating main categories:", error);
    throw error;
  } finally {
    await closeDatabaseConnection();
  }
}

// Run if called directly (ES module way)
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  updateMainCategories()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { updateMainCategories };
