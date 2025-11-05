/**
 * ZERO-TOKEN PATCH+TEST for chat functionality
 * Tests the complete chat flow as specified
 */

async function testChatFunctionality() {
  console.log("🧪 Starting chat functionality test...");

  try {
    // Step 1: Get one active property
    console.log("📋 Step 1: Getting active property...");
    const propertiesResponse = await fetch(
      "/api/properties?status=active&limit=1",
    );

    if (!propertiesResponse.ok) {
      throw new Error(
        `Failed to fetch properties: ${propertiesResponse.status}`,
      );
    }

    const propertiesData = await propertiesResponse.json();
    console.log("Properties response:", propertiesData);

    if (
      !propertiesData.success ||
      !propertiesData.data ||
      propertiesData.data.length === 0
    ) {
      throw new Error("No active properties found");
    }

    const propertyId = propertiesData.data[0]._id;
    console.log(`✅ Found active property: ${propertyId}`);

    // Step 2: Get JWT token (check if user is logged in)
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No JWT token found. Please login first.");
    }
    console.log("✅ JWT token found");

    // Step 3: Create/find conversation
    console.log("📋 Step 2: Creating/finding conversation...");
    const conversationResponse = await fetch(
      `/api/conversations/find-or-create?propertyId=${propertyId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(
      `Conversation request: POST /api/conversations/find-or-create?propertyId=${propertyId}`,
    );
    console.log(`Response status: ${conversationResponse.status}`);

    if (!conversationResponse.ok) {
      const errorText = await conversationResponse.text();
      console.error(`❌ FAIL: conversation creation`);
      console.error(
        `URL: /api/conversations/find-or-create?propertyId=${propertyId}`,
      );
      console.error(`Method: POST`);
      console.error(`Status: ${conversationResponse.status}`);
      console.error(`Body: ${errorText}`);
      return;
    }

    const conversationData = await conversationResponse.json();
    console.log("Conversation response:", conversationData);

    if (!conversationData.success) {
      console.error(`❌ FAIL: conversation creation`);
      console.error(
        `URL: /api/conversations/find-or-create?propertyId=${propertyId}`,
      );
      console.error(`Method: POST`);
      console.error(`Status: ${conversationResponse.status}`);
      console.error(`Body: ${JSON.stringify(conversationData)}`);
      return;
    }

    const conversationId = conversationData.data._id;
    console.log(`✅ Conversation created/found: ${conversationId}`);

    // Step 4: Send ping-test message
    console.log("📋 Step 3: Sending ping-test message...");
    const messageResponse = await fetch(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "ping-test",
        }),
      },
    );

    console.log(
      `Message request: POST /api/conversations/${conversationId}/messages`,
    );
    console.log(`Response status: ${messageResponse.status}`);

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error(`❌ FAIL: message send`);
      console.error(`URL: /api/conversations/${conversationId}/messages`);
      console.error(`Method: POST`);
      console.error(`Status: ${messageResponse.status}`);
      console.error(`Body: ${errorText}`);
      return;
    }

    const messageData = await messageResponse.json();
    console.log("Message response:", messageData);

    if (!messageData.success) {
      console.error(`❌ FAIL: message send`);
      console.error(`URL: /api/conversations/${conversationId}/messages`);
      console.error(`Method: POST`);
      console.error(`Status: ${messageResponse.status}`);
      console.error(`Body: ${JSON.stringify(messageData)}`);
      return;
    }

    // Success!
    console.log("✅ PASS: chat send");
    return true;
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    return false;
  }
}

// Run the test
testChatFunctionality().then((success) => {
  if (success) {
    console.log("🎉 Chat functionality test completed successfully!");
  } else {
    console.log("💥 Chat functionality test failed.");
  }
});

// Make function available globally for manual testing
window.testChatFunctionality = testChatFunctionality;
