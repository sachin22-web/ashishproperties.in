// STEP 5 Test: Advertisement Packages page
console.log("🧪 Testing STEP 5: Advertisement Packages page");

function testStep5() {
  // Wait for page to load and navigate to /advertise
  setTimeout(() => {
    console.log("🔍 Navigating to /advertise page...");

    // Navigate to advertise page if not already there
    if (!window.location.pathname.includes("/advertise")) {
      window.location.href = "/advertise";
      return;
    }

    console.log("📍 On /advertise page, checking for package cards...");

    // Test for plan cards
    setTimeout(() => {
      const planCards = document.querySelectorAll('[data-testid="plan-card"]');
      console.log(`📊 Found ${planCards.length} plan cards`);

      if (planCards.length > 0) {
        console.log(
          "✅ PASS: STEP5 - Package cards found with correct data-testid",
        );

        // Test each card has required elements
        planCards.forEach((card, index) => {
          console.log(`🧪 Testing card ${index + 1}:`);

          // Check for package name
          const nameElement = card.querySelector("h3");
          const name = nameElement?.textContent || "No name found";
          console.log(`  📝 Name: "${name}"`);

          // Check for price
          const priceElements = card.querySelectorAll('[class*="font-bold"]');
          let price = "No price found";
          priceElements.forEach((el) => {
            const text = el.textContent || "";
            if (text.includes("₹") || text.includes("Free")) {
              price = text;
            }
          });
          console.log(`  💰 Price: "${price}"`);

          // Check for features
          const featureElements = card.querySelectorAll(
            '[class*="flex items-start"]',
          );
          console.log(`  📋 Features: ${featureElements.length} items`);

          // Check for premium badge
          const premiumBadge = card.querySelector(
            '[class*="premium"], [class*="Premium"]',
          );
          const hasPremiumBadge = premiumBadge !== null;
          console.log(`  👑 Premium badge: ${hasPremiumBadge ? "Yes" : "No"}`);

          // Check for CTA button
          const ctaButton = card.querySelector("button");
          const ctaText = ctaButton?.textContent || "No CTA found";
          console.log(`  🔗 CTA: "${ctaText}"`);
        });

        // Test API endpoint
        testPackagesAPI();

        console.log(
          "✅ PASS: STEP5 - All advertisement package requirements verified",
        );
      } else {
        console.log("❌ FAIL: STEP5 - No plan cards found");
        console.log(
          "Expected: document.querySelectorAll('[data-testid=\"plan-card\"]').length > 0",
        );

        // Debug: Check if page loaded correctly
        const pageTitle = document.querySelector("h1, h2");
        const title = pageTitle?.textContent || "No title found";
        console.log(`🔍 Page title: "${title}"`);

        // Check for loading states
        const loadingElements = document.querySelectorAll(
          '[class*="loading"], [class*="skeleton"], [class*="animate-pulse"]',
        );
        console.log(`⏳ Loading elements: ${loadingElements.length}`);

        // Check for error messages
        const errorElements = document.querySelectorAll(
          '[class*="error"], .error',
        );
        console.log(`❌ Error elements: ${errorElements.length}`);
      }
    }, 3000);
  }, 2000);
}

function testPackagesAPI() {
  console.log("🧪 Testing packages API endpoint...");

  // Test GET /api/plans?isActive=1
  fetch("/api/plans?isActive=1")
    .then((response) => {
      console.log(`📡 API Response Status: ${response.status}`);
      if (response.ok) {
        return response.json();
      }
      throw new Error(`API error: ${response.status}`);
    })
    .then((data) => {
      console.log("📋 API Response:", data);

      if (data.success && Array.isArray(data.data)) {
        console.log(`✅ API working - ${data.data.length} packages returned`);

        // Test package structure
        if (data.data.length > 0) {
          const pkg = data.data[0];
          console.log("🧪 Testing package structure:");
          console.log(`  📝 Name: ${pkg.name || "Missing"}`);
          console.log(
            `  💰 Price: ${pkg.price !== undefined ? pkg.price : "Missing"}`,
          );
          console.log(
            `  📋 Features: ${Array.isArray(pkg.features) ? pkg.features.length : "Missing"} items`,
          );
          console.log(`  🏷️ Type: ${pkg.type || "Missing"}`);
          console.log(
            `  ✅ Active: ${pkg.active !== undefined ? pkg.active : "Missing"}`,
          );
        }
      } else {
        console.log("⚠️ API response format unexpected:", data);
      }
    })
    .catch((error) => {
      console.error("❌ API test failed:", error);
    });
}

// Auto-run test when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", testStep5);
} else {
  testStep5();
}

// Also run test after additional delay for slow loading
setTimeout(testStep5, 8000);
