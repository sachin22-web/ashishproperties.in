import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Info,
} from "lucide-react";

interface DiagnosticResult {
  endpoint: string;
  success: boolean;
  status?: number;
  error?: string;
  responseTime?: number;
  data?: any;
}

export default function ApiDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const endpoints = [
    { path: "/api/ping", name: "Health Check" },
    { path: "/api/plans", name: "Plans/Packages" },
    { path: "/api/banners?active=true", name: "Banners" },
    { path: "/api/categories", name: "Categories" },
  ];

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    const newResults: DiagnosticResult[] = [];

    for (const endpoint of endpoints) {
      const startTime = Date.now();

      try {
        console.log(`🔍 Testing: ${endpoint.path}`);

        const response = await fetch(endpoint.path, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(8000), // 8 second timeout
        });

        const responseTime = Date.now() - startTime;
        let data;

        try {
          data = await response.json();
        } catch (parseError) {
          data = null;
        }

        const result = {
          endpoint: endpoint.path,
          success: response.ok,
          status: response.status,
          responseTime,
          data: response.ok ? data : null,
          error: response.ok
            ? undefined
            : `HTTP ${response.status}: ${response.statusText}`,
        };

        newResults.push(result);
        setResults([...newResults]); // Update UI incrementally
      } catch (error: any) {
        const responseTime = Date.now() - startTime;

        const result = {
          endpoint: endpoint.path,
          success: false,
          responseTime,
          error: error.message || "Network error",
        };

        newResults.push(result);
        setResults([...newResults]); // Update UI incrementally
      }
    }

    setLastRun(new Date());
    setIsRunning(false);
  };

  // Auto-run on component mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (result: DiagnosticResult) => {
    if (result.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (result: DiagnosticResult) => {
    if (result.success) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Success
        </Badge>
      );
    } else {
      return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const getEndpointName = (path: string) => {
    const endpoint = endpoints.find((e) => e.path === path);
    return endpoint?.name || path;
  };

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            API Diagnostics
          </CardTitle>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Test
              </>
            )}
          </Button>
        </div>
        {lastRun && (
          <p className="text-sm text-gray-600">
            Last run: {lastRun.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {/* Summary */}
        {results.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {successCount === totalCount ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : successCount === 0 ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">
                {successCount}/{totalCount} endpoints working
              </span>
            </div>

            {successCount === 0 && (
              <p className="text-red-600 text-sm">
                🚨 All API endpoints failed. This indicates a serious
                connectivity issue. Check your internet connection or server
                status.
              </p>
            )}

            {successCount > 0 && successCount < totalCount && (
              <p className="text-yellow-600 text-sm">
                ⚠️ Some endpoints are failing. This may indicate intermittent
                issues. Try refreshing the page or check the failing endpoints
                below.
              </p>
            )}

            {successCount === totalCount && (
              <p className="text-green-600 text-sm">
                ✅ All API endpoints are working correctly.
              </p>
            )}
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {endpoints.map((endpoint, index) => {
            const result = results.find((r) => r.endpoint === endpoint.path);

            return (
              <div key={endpoint.path} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {result ? (
                      getStatusIcon(result)
                    ) : isRunning && index <= results.length ? (
                      <Clock className="h-5 w-5 text-gray-400 animate-pulse" />
                    ) : (
                      <div className="h-5 w-5 bg-gray-200 rounded-full" />
                    )}
                    <span className="font-medium">{endpoint.name}</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
                  </div>

                  {result && getStatusBadge(result)}
                </div>

                {result && (
                  <div className="ml-8 text-sm text-gray-600">
                    {result.success ? (
                      <div className="flex gap-4">
                        <span>Status: {result.status}</span>
                        <span>Response time: {result.responseTime}ms</span>
                        {result.data && (
                          <span>
                            Data:{" "}
                            {Array.isArray(result.data?.data)
                              ? `${result.data.data.length} items`
                              : "Available"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-600">
                        Error: {result.error}
                        {result.responseTime && (
                          <span className="ml-2">
                            ({result.responseTime}ms)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {isRunning && !result && index === results.length && (
                  <div className="ml-8 text-sm text-gray-500">Testing...</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Debug Information</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Current URL: {window.location.href}</div>
            <div>Origin: {window.location.origin}</div>
            <div>Online: {navigator.onLine ? "Yes" : "No"}</div>
            <div>
              Global API:{" "}
              {typeof (window as any).api === "function"
                ? "Available"
                : "Not Available"}
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-sm text-gray-600">
          <p>
            💡 <strong>Tip:</strong> If you're seeing "Failed to fetch" errors
            in your components, run this test to identify which endpoints are
            failing. You can also open browser DevTools and use{" "}
            <code>window.apiDiagnostics.runFull()</code> for more detailed
            debugging.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
