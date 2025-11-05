import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { toast } from "../components/ui/use-toast";

export default function TestChat() {
  const { id } = useParams(); // conversation ID
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    if (id) {
      fetchConversation();
      fetchMessages();
      // Start polling every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const fetchConversation = async () => {
    try {
      const response = await (window as any).api(`/conversations/my`);
      if (response.success) {
        const conv = response.data.find((c: any) => c._id === id);
        setConversation(conv);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;

    try {
      const response = await (window as any).api(
        `/conversations/${id}/messages`,
      );
      if (response.success) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendTestMessage = async () => {
    if (!id) return;

    setTestRunning(true);
    const startTime = Date.now();

    try {
      const response = await (window as any).api(
        `/conversations/${id}/messages`,
        {
          method: "POST",
          body: { text: "ping-test" },
        },
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log("📧 Test message response:", response);
      console.log("⏱️ Response time:", responseTime, "ms");

      if (response.success) {
        const result = {
          timestamp: new Date().toISOString(),
          status: response.success ? "SUCCESS" : "FAILED",
          statusCode: 201,
          responseTime: `${responseTime}ms`,
          messageId: response.data._id,
          response: response,
        };

        setTestResults((prev) => [result, ...prev]);

        toast({
          title: "✅ Test Message Sent Successfully",
          description: `Status: 201, Response Time: ${responseTime}ms`,
        });

        // Refresh messages to see the new one
        setTimeout(fetchMessages, 1000);

        console.log("✅ PASS: STEP3");
      } else {
        const result = {
          timestamp: new Date().toISOString(),
          status: "FAILED",
          statusCode: response.status || "unknown",
          responseTime: `${responseTime}ms`,
          error: response.error,
          response: response,
        };

        setTestResults((prev) => [result, ...prev]);

        console.error("❌ FAIL: STEP3");
        console.error("URL:", `/api/conversations/${id}/messages`);
        console.error("Method: POST");
        console.error("Status:", response.status || "unknown");
        console.error("Body:", response);

        toast({
          title: "❌ Test Failed",
          description: response.error || "Failed to send test message",
          variant: "destructive",
        });
      }
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.error("❌ FAIL: STEP3");
      console.error("URL:", `/api/conversations/${id}/messages`);
      console.error("Method: POST");
      console.error("Error:", error);

      const result = {
        timestamp: new Date().toISOString(),
        status: "ERROR",
        statusCode: "network_error",
        responseTime: `${responseTime}ms`,
        error: error.message,
        response: null,
      };

      setTestResults((prev) => [result, ...prev]);

      toast({
        title: "❌ Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setTestRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>STEP 3: OLX-Style Chat Test</CardTitle>
            <p className="text-sm text-gray-600">
              Testing conversation ID: {id}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Button
                onClick={sendTestMessage}
                disabled={testRunning || !id}
                className="bg-[#C70000] hover:bg-[#A60000]"
              >
                {testRunning ? "Sending..." : "Send Ping Test"}
              </Button>

              <Button onClick={() => navigate(-1)} variant="outline">
                Back
              </Button>
            </div>

            {conversation && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold">Conversation Details:</h3>
                <p className="text-sm">
                  Property: {conversation.property?.title}
                </p>
                <p className="text-sm">
                  Participants: {conversation.participants?.length}
                </p>
                <p className="text-sm">
                  Created: {new Date(conversation.createdAt).toLocaleString()}
                </p>
              </div>
            )}
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
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`font-semibold ${
                            result.status === "SUCCESS"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {result.status}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          {result.timestamp}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {result.responseTime}
                      </div>
                    </div>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-1">
                        {result.error}
                      </p>
                    )}
                    {result.messageId && (
                      <p className="text-sm text-green-600 mt-1">
                        Message ID: {result.messageId}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Messages ({messages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No messages yet
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`p-3 rounded-lg max-w-xs ${
                      message.message === "ping-test"
                        ? "bg-yellow-100 border-2 border-yellow-300"
                        : "bg-gray-100"
                    }`}
                    data-testid={
                      message.message === "ping-test"
                        ? "msg-outgoing"
                        : "message"
                    }
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">
                        {message.senderName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="text-sm mt-1">{message.message}</p>
                    {message.message === "ping-test" && (
                      <div className="text-xs text-green-600 mt-1 font-semibold">
                        ✅ TEST MESSAGE
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
