// STEP 4 Test: Sticky Categories button (footer)
console.log("🧪 Testing STEP 4: Sticky Categories button functionality");

function testStep4() {
  // Wait for page to load
  setTimeout(() => {
    console.log("🔍 Checking for sticky Categories button...");

    // Test for Categories button
    const categoriesButton = document.querySelector(
      '[data-testid="footer-cats"]',
    );
    console.log(
      `📊 Categories button found: ${categoriesButton ? "Yes" : "No"}`,
    );

    if (categoriesButton) {
      console.log("✅ Categories button found!");

      // Check button text
      const buttonText =
        categoriesButton.textContent || categoriesButton.innerText;
      console.log(`🏷️ Button text: "${buttonText}"`);

      if (buttonText.toLowerCase().includes("categories")) {
        console.log("✅ Button has correct text");
      } else {
        console.log("⚠️ Button text might be incorrect");
      }

      // Check if button is sticky/fixed positioned
      const computedStyle = window.getComputedStyle(
        categoriesButton.closest(".fixed") || categoriesButton,
      );
      const position = computedStyle.position;
      console.log(`📍 Button position: ${position}`);

      if (position === "fixed") {
        console.log("✅ Button is properly positioned as sticky/fixed");
      }

      // Test clicking the Categories button
      console.log("🖱️ Testing Categories button click...");
      categoriesButton.click();

      // Wait for drawer to open
      setTimeout(() => {
        testCategoryDrawer();
      }, 500);
    } else {
      console.log(
        '❌ FAIL: Categories button not found with data-testid="footer-cats"',
      );
      return false;
    }
  }, 3000);
}

function testCategoryDrawer() {
  console.log("🔍 Checking for category drawer...");

  // Check if drawer is open
  const drawer = document.querySelector(
    '.fixed.inset-0, [class*="drawer"], [class*="CategoryDrawer"]',
  );

  if (drawer) {
    console.log("✅ Category drawer opened successfully");

    // Wait a bit more for content to load
    setTimeout(() => {
      // Test for category items
      const categoryItems = document.querySelectorAll(
        '[data-testid="footer-cat-item"]',
      );
      console.log(`📊 Found ${categoryItems.length} category items`);

      if (categoryItems.length > 0) {
        console.log(
          "✅ PASS: STEP4 - Category items found with correct data-testid",
        );

        // Test category item details
        categoryItems.forEach((item, index) => {
          const itemText = item.textContent || item.innerText;
          console.log(`📋 Category ${index + 1}: "${itemText.trim()}"`);
        });

        // Check for tabs (Property/Service)
        const propertyTab = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) =>
          (btn.textContent || "").toLowerCase().includes("properties"),
        );
        const serviceTab = Array.from(document.querySelectorAll("button")).find(
          (btn) => (btn.textContent || "").toLowerCase().includes("services"),
        );

        if (propertyTab && serviceTab) {
          console.log("✅ Property and Service tabs found");
        } else {
          console.log("⚠️ Tabs not found or not properly labeled");
        }

        // Check for expandable subcategories
        const expandableItems = Array.from(categoryItems).filter((item) => {
          const hasChevron = item.querySelector(
            'svg[class*="chevron"], [class*="ChevronRight"], [class*="ChevronDown"]',
          );
          return hasChevron !== null;
        });

        console.log(
          `🔽 Found ${expandableItems.length} expandable category items`,
        );

        // Test expansion of first expandable item
        if (expandableItems.length > 0) {
          console.log("🧪 Testing category expansion...");
          expandableItems[0].click();

          setTimeout(() => {
            const newCategoryItems = document.querySelectorAll(
              '[data-testid="footer-cat-item"]',
            );
            if (newCategoryItems.length > categoryItems.length) {
              console.log(
                "✅ Category expansion working - subcategories shown",
              );
            } else {
              console.log("⚠️ Category expansion might not be working");
            }
          }, 300);
        }

        console.log("✅ PASS: STEP4 - Categories drawer fully functional");
      } else {
        console.log(
          '❌ FAIL: No category items found with data-testid="footer-cat-item"',
        );
      }
    }, 1000);
  } else {
    console.log("❌ FAIL: Category drawer did not open");
  }
}

// Test API endpoints
function testCategoryAPI() {
  console.log("🧪 Testing category API endpoints...");

  // Test property categories
  fetch("/api/categories?active=1&type=property")
    .then((response) => {
      console.log(`📡 Property categories API: ${response.status}`);
      if (response.ok) {
        return response.json();
      }
      throw new Error(`API error: ${response.status}`);
    })
    .then((data) => {
      console.log(
        "✅ Property categories API working:",
        data.data?.length || 0,
        "categories",
      );
    })
    .catch((error) => {
      console.error("❌ Property categories API error:", error);
    });

  // Test service categories
  fetch("/api/categories?active=1&type=service")
    .then((response) => {
      console.log(`📡 Service categories API: ${response.status}`);
      if (response.ok) {
        return response.json();
      }
      throw new Error(`API error: ${response.status}`);
    })
    .then((data) => {
      console.log(
        "✅ Service categories API working:",
        data.data?.length || 0,
        "categories",
      );
    })
    .catch((error) => {
      console.error("❌ Service categories API error:", error);
    });
}

// Auto-run test when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", testStep4);
} else {
  testStep4();
}

// Test API endpoints
setTimeout(testCategoryAPI, 2000);

// Additional test after delay for slow-loading components
setTimeout(testStep4, 5000);
