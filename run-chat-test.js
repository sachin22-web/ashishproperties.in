// ZERO-TOKEN PATCH+TEST: Minimal chat functionality test

async function runChatTest() {
  console.log("🧪 ZERO-TOKEN PATCH+TEST: Starting chat test...");

  try {
    // Step 1: Pick 1 active property id via GET /api/properties?status=active&limit=1
    console.log("Step 1: Getting active property...");
    const propertiesResponse = await fetch(
      "/api/properties?status=active&limit=1",
    );
    const propertiesData = await propertiesResponse.json();

    if (
      !propertiesData.success ||
      !propertiesData.data ||
      propertiesData.data.length === 0
    ) {
      console.error("No active properties found");
      return;
    }

    const propertyId = propertiesData.data[0]._id;
    console.log(`✅ Found property: ${propertyId}`);

    // Step 2: Check JWT token
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No JWT token found. Please login first.");
      return;
    }

    // Step 3: POST /api/conversations/find-or-create {propertyId} with Authorization: Bearer <jwt>
    console.log("Step 2: Creating conversation...");
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

    if (
      !conversationResponse.ok ||
      conversationResponse.status < 200 ||
      conversationResponse.status >= 300
    ) {
      const errorText = await conversationResponse.text();
      console.error(
        `URL: /api/conversations/find-or-create?propertyId=${propertyId}`,
      );
      console.error(`Method: POST`);
      console.error(`Status: ${conversationResponse.status}`);
      console.error(`Body: ${errorText}`);
      return;
    }

    const conversationData = await conversationResponse.json();
    if (!conversationData.success) {
      console.error(
        `URL: /api/conversations/find-or-create?propertyId=${propertyId}`,
      );
      console.error(`Method: POST`);
      console.error(`Status: ${conversationResponse.status}`);
      console.error(`Body: ${JSON.stringify(conversationData)}`);
      return;
    }

    const conversationId = conversationData.data._id;
    console.log(`✅ Conversation: ${conversationId}`);

    // Step 4: POST /api/conversations/:id/messages {text:"ping-test"}
    console.log("Step 3: Sending ping-test message...");
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

    // Step 5: Expect 200/201; if ok => print "PASS: chat send" and STOP
    if (
      messageResponse.ok &&
      (messageResponse.status === 200 || messageResponse.status === 201)
    ) {
      console.log("PASS: chat send");
      return;
    } else {
      const errorText = await messageResponse.text();
      console.error(`URL: /api/conversations/${conversationId}/messages`);
      console.error(`Method: POST`);
      console.error(`Status: ${messageResponse.status}`);
      console.error(`Body: ${errorText}`);
      return;
    }
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

// Run the test
runChatTest();
