import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import {
  CheckCircle,
  XCircle,
  Play,
  User,
  Mail,
  Shield,
  RefreshCw,
  TestTube,
  ArrowRight,
} from "lucide-react";

interface TestResult {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message: string;
  details?: any;
}

export default function LoginTestSuite() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>("");

  const updateTestResult = (
    name: string,
    status: TestResult["status"],
    message: string,
    details?: any,
  ) => {
    setResults((prev) => {
      const existing = prev.find((r) => r.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.details = details;
        return [...prev];
      } else {
        return [...prev, { name, status, message, details }];
      }
    });
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    setCurrentTest(testName);
    updateTestResult(testName, "running", "Running...");

    try {
      await testFn();
      updateTestResult(testName, "success", "Passed ✓");
    } catch (error: any) {
      updateTestResult(testName, "error", `Failed: ${error.message}`, error);
    }
  };

  const runAllTests = async () => {
    setRunning(true);
    setResults([]);
    setCurrentTest("");

    const tests = [
      {
        name: "Database Connection",
        test: async () => {
          const response = await fetch("/api/ping");
          const data = await response.json();
          if (data.database?.status !== "connected") {
            throw new Error(`Database status: ${data.database?.status}`);
          }
        },
      },
      {
        name: "System Initialization",
        test: async () => {
          const response = await fetch("/api/init", { method: "POST" });
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || "Initialization failed");
          }
        },
      },
      {
        name: "Test User Registration",
        test: async () => {
          const testUser = {
            name: "Test User",
            email: `test_${Date.now()}@example.com`,
            phone: "+91 9876543210",
            password: "TestPassword123",
            userType: "seller",
          };

          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testUser),
          });

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || "Registration failed");
          }

          // Store test credentials for login test
          (window as any).testUserCredentials = {
            email: testUser.email,
            password: testUser.password,
          };
        },
      },
      {
        name: "Test User Login",
        test: async () => {
          const credentials = (window as any).testUserCredentials;
          if (!credentials) {
            throw new Error("No test user credentials available");
          }

          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || "Login failed");
          }

          // Store token for authenticated tests
          (window as any).testToken = data.data.token;
        },
      },
      {
        name: "Authenticated API Access",
        test: async () => {
          const token = (window as any).testToken;
          if (!token) {
            throw new Error("No test token available");
          }

          const response = await fetch("/api/auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || "Profile fetch failed");
          }
        },
      },
      {
        name: "Google Auth Endpoint",
        test: async () => {
          const mockGoogleUser = {
            id: "test_google_user",
            name: "Test Google User",
            email: "testgoogle@gmail.com",
            verified_email: true,
          };

          const response = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              googleUser: mockGoogleUser,
              userType: "buyer",
            }),
          });

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || "Google auth failed");
          }
        },
      },
      {
        name: "Email Verification System",
        test: async () => {
          const response = await fetch("/api/auth/send-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@example.com" }),
          });

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || "Email verification failed");
          }
        },
      },
      {
        name: "Package System",
        test: async () => {
          const response = await fetch("/api/packages");
          const data = await response.json();
          if (!data.success || !data.data || data.data.length === 0) {
            throw new Error("No packages found");
          }
        },
      },
    ];

    for (const testCase of tests) {
      await runTest(testCase.name, testCase.test);
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setCurrentTest("");
    setRunning(false);
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <TestTube className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    const config = {
      success: {
        variant: "default" as const,
        className: "bg-green-100 text-green-800",
      },
      error: {
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800",
      },
      running: {
        variant: "outline" as const,
        className: "bg-blue-100 text-blue-800",
      },
      pending: {
        variant: "outline" as const,
        className: "bg-gray-100 text-gray-800",
      },
    };

    const conf = config[status];
    return (
      <Badge variant={conf.variant} className={conf.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const totalTests = results.length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5 text-[#C70000]" />
            <span>Login & Authentication Test Suite</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Comprehensive testing of registration, login, dashboards, and
              authentication systems
            </p>
            <Button
              onClick={runAllTests}
              disabled={running}
              className="bg-[#C70000] hover:bg-[#A60000]"
            >
              {running ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {successCount}
                </div>
                <p className="text-sm text-green-700">Passed</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {errorCount}
                </div>
                <p className="text-sm text-red-700">Failed</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {totalTests}
                </div>
                <p className="text-sm text-blue-700">Total</p>
              </div>
            </div>
          )}

          {currentTest && (
            <Alert className="bg-blue-50 border-blue-200">
              <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-700">
                Currently running: {currentTest}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.name}</p>
                      <p className="text-sm text-gray-500">{result.message}</p>
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Test Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => navigate("/login")}
              variant="outline"
              className="w-full"
            >
              <User className="h-4 w-4 mr-2" />
              Test Login Page
            </Button>
            <Button
              onClick={() => navigate("/seller-dashboard")}
              variant="outline"
              className="w-full"
            >
              <Shield className="h-4 w-4 mr-2" />
              Test Seller Dashboard
            </Button>
            <Button
              onClick={() => navigate("/buyer-dashboard")}
              variant="outline"
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Test Buyer Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Credentials */}
      <Card>
        <CardHeader>
          <CardTitle>Test Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Seller Account</h4>
              <p>Email: seller@test.com</p>
              <p>Password: password123</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Buyer Account</h4>
              <p>Email: buyer@test.com</p>
              <p>Password: password123</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Agent Account</h4>
              <p>Email: agent@test.com</p>
              <p>Password: password123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
