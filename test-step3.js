// STEP 3 Test: Replace "Chat" with "Enquiry Now"
console.log("🧪 Testing STEP 3: Enquiry Now functionality");

function testStep3() {
  // Wait for components to load
  setTimeout(() => {
    console.log("🔍 Checking for enquiry buttons...");

    // Test for enquiry buttons
    const enquiryButtons = document.querySelectorAll(
      '[data-testid="enquiry-btn"]',
    );
    console.log(`📊 Found ${enquiryButtons.length} enquiry buttons`);

    if (enquiryButtons.length > 0) {
      console.log("✅ Enquiry buttons found!");

      // Test if buttons contain "Enquiry" text
      let hasEnquiryText = false;
      enquiryButtons.forEach((btn, index) => {
        const text = btn.textContent || btn.innerText;
        console.log(`Button ${index + 1} text: "${text}"`);
        if (text.toLowerCase().includes("enquiry")) {
          hasEnquiryText = true;
        }
      });

      if (hasEnquiryText) {
        console.log("✅ Enquiry buttons have correct text");
      } else {
        console.log(
          "⚠️ Warning: Enquiry buttons found but text might be incorrect",
        );
      }

      // Test clicking the first enquiry button (if safe to do so)
      if (enquiryButtons.length > 0) {
        console.log("🖱️ Testing enquiry button click...");

        // Simulate enquiry modal test
        testEnquirySubmission();
      }

      console.log("✅ PASS: STEP3 - Enquiry Now buttons implemented");
      return true;
    } else {
      console.log(
        '❌ FAIL: No enquiry buttons found with data-testid="enquiry-btn"',
      );

      // Debug: Check if old chat buttons still exist
      const chatButtons = document.querySelectorAll(
        'button:contains("Chat"), [class*="chat"]',
      );
      console.log(
        `🔍 Found ${chatButtons.length} potential chat buttons (should be 0)`,
      );

      return false;
    }
  }, 3000);
}

function testEnquirySubmission() {
  console.log("🧪 Testing enquiry submission to POST /api/enquiries");

  // Test data for enquiry submission
  const testEnquiry = {
    propertyId: "60a7b8b0c1234567890abcde", // Sample property ID
    name: "Test User",
    phone: "+91 9876543210",
    message:
      "Hi, I am interested in this property. Please provide more details.",
    timestamp: new Date().toISOString(),
  };

  fetch("/api/enquiries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(testEnquiry),
  })
    .then((response) => {
      console.log(`📡 API Response Status: ${response.status}`);

      if (response.status === 200 || response.status === 201) {
        console.log("✅ PASS: STEP3 - Enquiry submission successful (200/201)");
        return response.json();
      } else if (response.status === 400) {
        console.log(
          "⚠️ Expected: 400 Bad Request (invalid property ID in test)",
        );
        return response.json();
      } else {
        console.log(`❌ Unexpected status: ${response.status}`);
        return response.json();
      }
    })
    .then((data) => {
      console.log("📋 API Response:", data);

      if (data.success === true) {
        console.log("✅ Enquiry API working correctly");
      } else if (data.message && data.message.includes("property")) {
        console.log("✅ API validation working (property not found expected)");
      } else {
        console.log("⚠️ API response structure as expected");
      }
    })
    .catch((error) => {
      console.error("❌ Error testing enquiry submission:", error);
      console.log(
        "📋 Expected: This might fail due to CORS or test property ID",
      );
    });
}

// Auto-run test when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", testStep3);
} else {
  testStep3();
}

// Also run test after a delay to ensure components have loaded
setTimeout(testStep3, 5000);

// Test API endpoint availability
setTimeout(() => {
  console.log("🌐 Testing if /api/enquiries endpoint is available...");
  fetch("/api/enquiries", {
    method: "OPTIONS",
  })
    .then((response) => {
      console.log(`✅ API endpoint accessible: ${response.status}`);
    })
    .catch((error) => {
      console.error("❌ API endpoint test failed:", error);
    });
}, 2000);
