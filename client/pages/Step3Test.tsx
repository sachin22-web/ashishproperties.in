import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { toast } from "../components/ui/use-toast";

export default function Step3Test() {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [propertyId, setPropertyId] = useState("674a9f20c2b70b4a34b76b65");
  const [userId, setUserId] = useState("674a9c9ac2b70b4a34b76b27");
  const [token, setToken] = useState("");

  const steps = [
    "Check authentication",
    "Find or create conversation",
    "Navigate to chat page",
    "Send ping-test message",
    "Verify message with data-testid",
    "Complete STEP3",
  ];

  const addResult = (step, status, details) => {
    const result = {
      step,
      status,
      details,
      timestamp: new Date().toISOString(),
    };
    setTestResults((prev) => [...prev, result]);
    return result;
  };

  const runAutomatedTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentStep(0);

    try {
      // Step 1: Check authentication
      setCurrentStep(1);
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        addResult(
          "Authentication",
          "FAILED",
          "No token found. Please login first.",
        );
        setIsRunning(false);
        return;
      }
      setToken(storedToken);
      addResult("Authentication", "SUCCESS", "Token found");

      // Step 2: Find or create conversation
      setCurrentStep(2);
      const conversationResponse = await (window as any).api(
        `/conversations/find-or-create`,
        {
          method: "POST",
          body: {
            propertyId: propertyId,
          },
        },
      );

      if (!conversationResponse.success) {
        addResult(
          "Create Conversation",
          "FAILED",
          `Error: ${conversationResponse.error}`,
        );
        console.error("❌ FAIL: STEP3");
        console.error("URL: /api/conversations/find-or-create");
        console.error("Method: POST");
        console.error("Status:", conversationResponse.status || "unknown");
        console.error("Body:", conversationResponse);
        setIsRunning(false);
        return;
      }

      const conversationId = conversationResponse.data._id;
      addResult(
        "Create Conversation",
        "SUCCESS",
        `Conversation ID: ${conversationId}`,
      );

      // Step 3: Navigate to chat page
      setCurrentStep(3);
      addResult(
        "Navigation",
        "SUCCESS",
        `Navigating to /chat/${conversationId}`,
      );

      // Wait a moment for navigation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 4: Send ping-test message
      setCurrentStep(4);
      const messageResponse = await (window as any).api(
        `/conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: { text: "ping-test" },
        },
      );

      if (!messageResponse.success) {
        addResult("Send Message", "FAILED", `Error: ${messageResponse.error}`);
        console.error("❌ FAIL: STEP3");
        console.error("URL:", `/api/conversations/${conversationId}/messages`);
        console.error("Method: POST");
        console.error("Status:", messageResponse.status || "unknown");
        console.error("Body:", messageResponse);
        setIsRunning(false);
        return;
      }

      addResult(
        "Send Message",
        "SUCCESS",
        `Message sent with ID: ${messageResponse.data._id}`,
      );

      // Step 5: Verify message bubble
      setCurrentStep(5);

      // Navigate to test chat page to verify the message bubble
      navigate(`/test-chat/${conversationId}`);

      // Wait for navigation and message to appear
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if message bubble exists with correct data-testid
      const messageElement = document.querySelector(
        '[data-testid="msg-outgoing"]',
      );
      if (messageElement) {
        addResult(
          "Message Bubble",
          "SUCCESS",
          "Found message with data-testid='msg-outgoing'",
        );

        // Step 6: Complete test
        setCurrentStep(6);
        addResult("STEP3 Complete", "SUCCESS", "All tests passed!");

        console.log("✅ PASS: STEP3");

        toast({
          title: "✅ STEP3 PASSED",
          description: "OLX-style chat functionality working correctly!",
        });
      } else {
        addResult(
          "Message Bubble",
          "FAILED",
          "Message bubble with data-testid='msg-outgoing' not found",
        );

        console.error("❌ FAIL: STEP3");
        console.error("Message bubble verification failed");
      }
    } catch (error) {
      addResult("Test Error", "ERROR", `Unexpected error: ${error.message}`);
      console.error("❌ FAIL: STEP3");
      console.error("Unexpected error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const createTestProperty = async () => {
    try {
      const response = await (window as any).api("/properties", {
        method: "POST",
        body: {
          title: "Test Property for Chat",
          description: "Test property for OLX-style chat functionality",
          propertyType: "apartment",
          category: "buy",
          subCategory: "apartment",
          price: 1000000,
          priceType: "sale",
          location: {
            city: "Test City",
            state: "Test State",
            address: "123 Test Street",
            area: "Test Area",
          },
          contactInfo: {
            name: "Test Owner",
            phone: "1234567890",
            email: "test@example.com",
          },
          images: ["/placeholder.png"],
          status: "active",
        },
      });

      if (response.success) {
        setPropertyId(response.data._id);
        toast({
          title: "Test Property Created",
          description: `Property ID: ${response.data._id}`,
        });
      } else {
        toast({
          title: "Failed to create test property",
          description: response.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error creating test property",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>STEP 3: OLX-Style Chat Automated Test</CardTitle>
            <p className="text-sm text-gray-600">
              Automated test for chat functionality with polling and message
              verification
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Property ID
                </label>
                <Input
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  disabled={isRunning}
                  placeholder="Enter property ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  User ID
                </label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={isRunning}
                  placeholder="Enter user ID"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={runAutomatedTest}
                disabled={isRunning || !propertyId}
                className="bg-[#C70000] hover:bg-[#A60000]"
              >
                {isRunning
                  ? `Running Step ${currentStep}/6...`
                  : "Run STEP3 Test"}
              </Button>

              <Button
                onClick={createTestProperty}
                disabled={isRunning}
                variant="outline"
              >
                Create Test Property
              </Button>

              <Button onClick={() => navigate("/")} variant="outline">
                Go to Home
              </Button>
            </div>

            {/* Progress indicator */}
            {isRunning && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#C70000] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 6) * 100}%` }}
                ></div>
              </div>
            )}

            {/* Steps */}
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`p-2 rounded border ${
                    index + 1 === currentStep
                      ? "bg-blue-50 border-blue-200"
                      : index + 1 < currentStep
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <span className="text-sm">
                    {index + 1}. {step}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      result.status === "SUCCESS"
                        ? "bg-green-50 border-green-200"
                        : result.status === "ERROR"
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`font-semibold ${
                            result.status === "SUCCESS"
                              ? "text-green-700"
                              : result.status === "ERROR"
                                ? "text-red-700"
                                : "text-yellow-700"
                          }`}
                        >
                          {result.step}: {result.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {result.details}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
