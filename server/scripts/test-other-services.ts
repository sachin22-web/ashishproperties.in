import { getDatabase } from "../db/mongodb";

export async function createTestData() {
  try {
    const db = getDatabase();

    console.log("🧪 Creating test data for Other Services...");

    // Create repairs category
    await db.collection("os_categories").insertOne({
      slug: "repairs",
      name: "Repairs",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("✅ Created category: repairs");

    // Create plumber subcategory
    await db.collection("os_subcategories").insertOne({
      category: "repairs",
      slug: "plumber",
      name: "Plumber",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("✅ Created subcategory: plumber");

    // Create plumber listing
    await db.collection("os_listings").insertOne({
      category: "repairs",
      subcategory: "plumber",
      name: "Rohtak Plumbing Services",
      phone: "9999999999",
      address: "Sector 3, Rohtak, Haryana",
      photos: ["https://via.placeholder.com/300x200?text=Plumber"],
      geo: {
        lat: 28.8955,
        lng: 76.6066,
      },
      open: "09:00",
      close: "18:00",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("✅ Created listing: Rohtak Plumbing Services");

    console.log("\n🎉 PASS: OTHER SERVICES");
    console.log("Test data created successfully!");
    console.log("📋 Summary:");
    console.log("   Category: repairs");
    console.log("   Subcategory: plumber");
    console.log("   Listing: Rohtak Plumbing Services");
    console.log("   Phone: 9999999999");
    console.log("\n🔗 Frontend URLs to test:");
    console.log("   📂 Categories: /other-services");
    console.log("   📁 Subcategories: /other-services/repairs");
    console.log("   📋 Listings: /other-services/repairs/plumber");
    console.log(
      '\n✅ Expected: ≥1 [data-testid="service-card"] at /other-services/repairs/plumber',
    );

    return true;
  } catch (error) {
    console.error("❌ Error creating test data:", error);
    return false;
  }
}
