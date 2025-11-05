import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  TestTube,
  Database,
  CreditCard,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

interface TestResult {
  name: string;
  status: "pending" | "running" | "success" | "error";
  data?: any;
  error?: string;
  timestamp?: Date;
}

export default function AdminTestingDashboard() {
  const { token } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Database Connection", status: "pending" },
    { name: "PhonePe Configuration", status: "pending" },
    { name: "Payment Methods", status: "pending" },
    { name: "Admin Settings", status: "pending" },
    { name: "Staff Management", status: "pending" },
  ]);

  const updateTest = (name: string, update: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((test) =>
        test.name === name
          ? { ...test, ...update, timestamp: new Date() }
          : test,
      ),
    );
  };

  const runTest = async (testName: string) => {
    updateTest(testName, { status: "running" });

    try {
      let response;

      switch (testName) {
        case "Database Connection":
          response = await fetch("/api/test/database");
          break;

        case "PhonePe Configuration":
          response = await fetch("/api/test/phonepe-config", {
            headers: { Authorization: `Bearer ${token}` },
          });
          break;

        case "Payment Methods":
          response = await fetch("/api/test/payment-methods");
          break;

        case "Admin Settings":
          response = await fetch("/api/admin/settings", {
            headers: { Authorization: `Bearer ${token}` },
          });
          break;

        case "Staff Management":
          response = await fetch("/api/admin/staff", {
            headers: { Authorization: `Bearer ${token}` },
          });
          break;

        default:
          throw new Error("Unknown test");
      }

      const data = await response.json();

      if (data.success) {
        updateTest(testName, {
          status: "success",
          data: data.data,
          error: undefined,
        });
      } else {
        updateTest(testName, {
          status: "error",
          error: data.error || "Test failed",
          data: data.data,
        });
      }
    } catch (error: any) {
      updateTest(testName, {
        status: "error",
        error: error.message || "Network error",
      });
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.name);
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "running":
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    const variants = {
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      running: "bg-blue-100 text-blue-800",
      pending: "bg-gray-100 text-gray-600",
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <TestTube className="h-6 w-6 mr-2" />
            System Testing Dashboard
          </h2>
          <p className="text-gray-600">
            Test all system components and integrations
          </p>
        </div>
        <div className="space-x-2">
          <Button
            onClick={runAllTests}
            className="bg-[#C70000] hover:bg-[#A60000]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Run All Tests
          </Button>
        </div>
      </div>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <Card key={test.name} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center">
                  {getStatusIcon(test.status)}
                  <span className="ml-2">{test.name}</span>
                </span>
                {getStatusBadge(test.status)}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {test.timestamp && (
                <p className="text-xs text-gray-500">
                  Last run: {test.timestamp.toLocaleTimeString()}
                </p>
              )}

              {test.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-800 text-sm font-medium">Error:</p>
                  <p className="text-red-700 text-sm">{test.error}</p>
                </div>
              )}

              {test.data && (
                <div className="bg-green-50 border border-green-200 rounded p-3 max-h-40 overflow-y-auto">
                  <p className="text-green-800 text-sm font-medium mb-2">
                    Results:
                  </p>
                  <pre className="text-xs text-green-700 whitespace-pre-wrap">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                </div>
              )}

              <Button
                onClick={() => runTest(test.name)}
                disabled={test.status === "running"}
                variant="outline"
                className="w-full"
              >
                {test.status === "running" ? "Running..." : "Run Test"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => window.open("/api/test/database", "_blank")}
              variant="outline"
              className="flex items-center"
            >
              <Database className="h-4 w-4 mr-2" />
              View Database Stats
            </Button>

            <Button
              onClick={() => window.open("/api/test/payment-methods", "_blank")}
              variant="outline"
              className="flex items-center"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              View Payment Methods
            </Button>

            <Button
              onClick={() => (window.location.href = "/admin")}
              variant="outline"
              className="flex items-center"
            >
              <Users className="h-4 w-4 mr-2" />
              Back to Admin Panel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {tests.filter((t) => t.status === "success").length}
              </p>
              <p className="text-sm text-gray-600">Passed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {tests.filter((t) => t.status === "error").length}
              </p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {tests.filter((t) => t.status === "running").length}
              </p>
              <p className="text-sm text-gray-600">Running</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {tests.filter((t) => t.status === "pending").length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
