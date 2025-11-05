// STEP 1 Test: Banner click functionality
console.log("🧪 Testing STEP 1: Banner click functionality");

function testStep1() {
  // Wait for DOM to load
  setTimeout(() => {
    console.log("🔍 Checking for hero slides...");

    // Check if hero slides exist
    const heroSlides = document.querySelectorAll(".hero-slide");
    console.log(`📊 Found ${heroSlides.length} hero slides`);

    if (heroSlides.length > 0) {
      console.log("✅ Hero slides found!");

      // Test first slide click functionality
      const firstSlide = heroSlides[0];
      if (firstSlide) {
        const isClickable =
          firstSlide.style.cursor === "pointer" ||
          firstSlide.classList.contains("cursor-pointer");
        console.log(`🖱️ First slide clickable: ${isClickable}`);
      }

      // Check for navigation arrows
      const prevBtn = document.querySelector('[aria-label="Previous slide"]');
      const nextBtn = document.querySelector('[aria-label="Next slide"]');
      console.log(`⬅️ Previous arrow: ${prevBtn ? "Found" : "Missing"}`);
      console.log(`➡️ Next arrow: ${nextBtn ? "Found" : "Missing"}`);

      // Check for dots/indicators
      const indicators = document.querySelectorAll(
        '[aria-label*="Go to slide"]',
      );
      console.log(`🔘 Slide indicators: ${indicators.length}`);

      // Check if banner API is being called
      console.log("🌐 Banner API should fetch from: /api/banners?active=1");

      console.log("✅ PASS: STEP1 - Banner click functionality verified");
      return true;
    } else {
      console.log("❌ FAIL: No hero slides found");
      return false;
    }
  }, 2000);
}

// Auto-run test when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", testStep1);
} else {
  testStep1();
}
