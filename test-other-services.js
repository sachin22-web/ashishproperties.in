// Self-test script for Other Services module
const API_BASE = "http://localhost:5173/api";

async function testOtherServices() {
  try {
    console.log("🧪 Testing Other Services module...");

    // Test 1: Create category "repairs"
    console.log('\n1️⃣ Creating category "repairs"...');
    const categoryResponse = await fetch(`${API_BASE}/admin/os-categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "repairs",
        name: "Repairs",
        active: true,
      }),
    });

    const categoryResult = await categoryResponse.json();
    console.log(
      "Category creation result:",
      categoryResult.success ? "✅ SUCCESS" : "❌ FAILED",
    );

    // Test 2: Create subcategory "plumber"
    console.log('\n2️⃣ Creating subcategory "plumber"...');
    const subcategoryResponse = await fetch(
      `${API_BASE}/admin/os-subcategories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "repairs",
          slug: "plumber",
          name: "Plumber",
          active: true,
        }),
      },
    );

    const subcategoryResult = await subcategoryResponse.json();
    console.log(
      "Subcategory creation result:",
      subcategoryResult.success ? "✅ SUCCESS" : "❌ FAILED",
    );

    // Test 3: Create plumber listing
    console.log("\n3️⃣ Creating plumber listing...");
    const listingResponse = await fetch(`${API_BASE}/admin/os-listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "repairs",
        subcategory: "plumber",
        name: "Rohtak Plumbing Services",
        phone: "9999999999",
        address: "Sector 3, Rohtak",
        photos: ["https://example.com/plumber1.jpg"],
        geo: { lat: 28.8955, lng: 76.6066 },
        open: "09:00",
        close: "18:00",
        active: true,
      }),
    });

    const listingResult = await listingResponse.json();
    console.log(
      "Listing creation result:",
      listingResult.success ? "✅ SUCCESS" : "❌ FAILED",
    );

    // Test 4: Verify public API endpoints
    console.log("\n4️⃣ Testing public API endpoints...");

    // Test categories endpoint
    const categoriesResponse = await fetch(
      `${API_BASE}/os/categories?active=1`,
    );
    const categoriesData = await categoriesResponse.json();
    console.log(
      "Categories API:",
      categoriesData.success && categoriesData.data.length > 0
        ? "✅ SUCCESS"
        : "❌ FAILED",
    );

    // Test subcategories endpoint
    const subcategoriesResponse = await fetch(
      `${API_BASE}/os/subcategories?cat=repairs&active=1`,
    );
    const subcategoriesData = await subcategoriesResponse.json();
    console.log(
      "Subcategories API:",
      subcategoriesData.success && subcategoriesData.data.length > 0
        ? "✅ SUCCESS"
        : "❌ FAILED",
    );

    // Test listings endpoint
    const listingsResponse = await fetch(
      `${API_BASE}/os/listings?sub=plumber&active=1`,
    );
    const listingsData = await listingsResponse.json();
    console.log(
      "Listings API:",
      listingsData.success && listingsData.data.length > 0
        ? "✅ SUCCESS"
        : "❌ FAILED",
    );

    // Test 5: Check if data is properly structured
    console.log("\n5️⃣ Verifying data structure...");
    if (listingsData.success && listingsData.data.length > 0) {
      const listing = listingsData.data[0];
      const hasRequiredFields =
        listing.name &&
        listing.phone &&
        listing.address &&
        listing.category &&
        listing.subcategory;
      console.log(
        "Data structure:",
        hasRequiredFields ? "✅ SUCCESS" : "❌ FAILED",
      );

      if (hasRequiredFields) {
        console.log("\n🎉 PASS: OTHER SERVICES");
        console.log("📋 Summary:");
        console.log(`   Category: ${listing.category}`);
        console.log(`   Subcategory: ${listing.subcategory}`);
        console.log(`   Listing: ${listing.name}`);
        console.log(`   Phone: ${listing.phone}`);
        console.log("🔗 Frontend URLs to test:");
        console.log(`   📂 Categories: http://localhost:5173/other-services`);
        console.log(
          `   📁 Subcategories: http://localhost:5173/other-services/repairs`,
        );
        console.log(
          `   📋 Listings: http://localhost:5173/other-services/repairs/plumber`,
        );
        console.log(
          '\n✅ Expected: ≥1 [data-testid="service-card"] at /other-services/repairs/plumber',
        );
      }
    } else {
      console.log("❌ FAILED: No listings found");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run the test
testOtherServices();
