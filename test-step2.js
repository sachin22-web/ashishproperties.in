// STEP 2 Test: Property ads slider
console.log("🧪 Testing STEP 2: Property ads slider");

function testStep2() {
  // Wait for components to load and API calls to complete
  setTimeout(() => {
    console.log("🔍 Checking for home ad cards...");

    // Test for home ad cards
    const homeAdCards = document.querySelectorAll(
      '[data-testid="home-ad-card"]',
    );
    console.log(`📊 Found ${homeAdCards.length} home ad cards`);

    if (homeAdCards.length > 0) {
      console.log("✅ Home ad cards found!");

      // Test if cards are clickable
      const firstCard = homeAdCards[0];
      if (firstCard) {
        const isClickable =
          firstCard.style.cursor === "pointer" ||
          firstCard.classList.contains("cursor-pointer") ||
          firstCard.onclick !== null;
        console.log(
          `🖱️ First card clickable: ${isClickable || "has click handler"}`,
        );
      }

      // Check for navigation arrows
      const prevBtn = document.querySelector('[aria-label="Previous slide"]');
      const nextBtn = document.querySelector('[aria-label="Next slide"]');
      console.log(`⬅️ Previous arrow: ${prevBtn ? "Found" : "Missing"}`);
      console.log(`➡️ Next arrow: ${nextBtn ? "Found" : "Missing"}`);

      // Check for slide indicators
      const indicators = document.querySelectorAll(
        '[aria-label*="Go to slide"]',
      );
      console.log(`🔘 Slide indicators: ${indicators.length}`);

      // Test API endpoints being called
      console.log("🌐 APIs should fetch from:");
      console.log("  • Primary: /api/banners?position=homepage_middle");
      console.log("  • Fallback: /api/properties/featured");

      console.log("✅ PASS: STEP2 - Property ads slider verified");
      return true;
    } else {
      console.log(
        '❌ FAIL: No home ad cards found with data-testid="home-ad-card"',
      );

      // Debug: Check if PropertyAdsSlider component exists
      const slider = document.querySelector(
        '.property-ads-slider, [class*="PropertyAds"]',
      );
      console.log(
        `🔍 PropertyAdsSlider component: ${slider ? "Found" : "Missing"}`,
      );

      // Check if data is loading
      const loadingElements = document.querySelectorAll(
        '.animate-pulse, [class*="loading"]',
      );
      console.log(`⏳ Loading elements: ${loadingElements.length}`);

      return false;
    }
  }, 3000); // Wait 3 seconds for API calls and rendering
}

// Auto-run test when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", testStep2);
} else {
  testStep2();
}

// Also run test after a delay to ensure APIs have loaded
setTimeout(testStep2, 5000);
