#!/usr/bin/env tsx
import { connectToDatabase } from "../db/mongodb";

async function checkCategoriesAndSubcategories() {
  console.log("🔍 Checking Categories and Subcategories");
  console.log("=".repeat(50));

  try {
    const { db } = await connectToDatabase();

    // Check categories collection
    const categoriesCount = await db.collection("categories").countDocuments();
    console.log(`📊 Total Categories: ${categoriesCount}`);

    if (categoriesCount === 0) {
      console.log("⚠️  No categories found in the database!");
      console.log("💡 Categories need to be initialized first");
      return;
    }

    // Get all categories
    console.log("\n📋 Categories:");
    console.log("-".repeat(40));

    const categories = await db.collection("categories").find({}).toArray();

    categories.forEach((category, index) => {
      console.log(`\n${index + 1}. Category: ${category.name}`);
      console.log(`   Slug: ${category.slug}`);
      console.log(`   Active: ${category.active}`);
      console.log(`   Subcategories: ${category.subcategories?.length || 0}`);

      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories
          .slice(0, 3)
          .forEach((sub: any, subIndex: number) => {
            console.log(`     ${subIndex + 1}. ${sub.name} (${sub.slug})`);
          });
        if (category.subcategories.length > 3) {
          console.log(`     ... and ${category.subcategories.length - 3} more`);
        }
      }
    });

    // Test the API endpoints the frontend is calling
    console.log("\n🧪 Testing Subcategory API Calls:");
    console.log("-".repeat(40));

    const testCategories = ["residential", "commercial", "pg"];

    for (const testCategory of testCategories) {
      console.log(
        `\nTesting: /api/subcategories/with-counts?category=${testCategory}`,
      );

      try {
        const categoryDoc = await db.collection("categories").findOne({
          slug: testCategory,
          active: true,
        });

        if (categoryDoc) {
          console.log(`✅ Found category: ${categoryDoc.name}`);
          console.log(
            `   Subcategories: ${categoryDoc.subcategories?.length || 0}`,
          );
        } else {
          console.log(`❌ Category '${testCategory}' not found`);
        }
      } catch (error) {
        console.log(`❌ Error checking category '${testCategory}': ${error}`);
      }
    }

    console.log("\n✅ Categories check completed!");
  } catch (error) {
    console.error("❌ Failed to check categories:", error);
    throw error;
  }
}

// Run the check
checkCategoriesAndSubcategories()
  .then(() => {
    console.log("\n🎉 Categories check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Categories check failed:", error);
    process.exit(1);
  });
