/**
 * API Diagnostics Utility
 * Helps debug and verify API connectivity issues
 */

interface DiagnosticResult {
  endpoint: string;
  success: boolean;
  status?: number;
  error?: string;
  responseTime?: number;
  data?: any;
}

/**
 * Test multiple API endpoints to diagnose connectivity issues
 */
export async function runApiDiagnostics(): Promise<DiagnosticResult[]> {
  const endpoints = [
    "/api/ping",
    "/api/plans",
    "/api/banners?active=true",
    "/api/categories",
  ];

  const results: DiagnosticResult[] = [];

  for (const endpoint of endpoints) {
    const startTime = Date.now();

    try {
      console.log(`🔍 Testing endpoint: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add timeout
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - startTime;
      let data;

      try {
        data = await response.json();
      } catch (parseError) {
        data = null;
      }

      results.push({
        endpoint,
        success: response.ok,
        status: response.status,
        responseTime,
        data: response.ok ? data : null,
        error: response.ok
          ? undefined
          : `HTTP ${response.status}: ${response.statusText}`,
      });

      console.log(
        `${response.ok ? "✅" : "❌"} ${endpoint}: ${response.status} (${responseTime}ms)`,
      );
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      results.push({
        endpoint,
        success: false,
        responseTime,
        error: error.message || "Unknown error",
      });

      console.log(`❌ ${endpoint}: ${error.message} (${responseTime}ms)`);
    }
  }

  return results;
}

/**
 * Test specific endpoint with detailed logging
 */
export async function testEndpoint(
  endpoint: string,
): Promise<DiagnosticResult> {
  const startTime = Date.now();

  try {
    console.log(`🔍 Testing specific endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    let data;
    try {
      const responseText = await response.text();
      if (responseText.trim()) {
        data = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.warn("Failed to parse response as JSON:", parseError);
      data = null;
    }

    const result = {
      endpoint,
      success: response.ok,
      status: response.status,
      responseTime,
      data: response.ok ? data : null,
      error: response.ok
        ? undefined
        : `HTTP ${response.status}: ${response.statusText}`,
    };

    console.log(`${response.ok ? "✅" : "❌"} Result:`, result);
    return result;
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    const result = {
      endpoint,
      success: false,
      responseTime,
      error: error.message || "Unknown error",
    };

    console.log(`❌ Error result:`, result);
    return result;
  }
}

/**
 * Log comprehensive diagnostic information
 */
export function logDiagnosticInfo() {
  console.group("🔧 API Diagnostic Information");

  console.log("Current URL:", window.location.href);
  console.log("Origin:", window.location.origin);
  console.log("Protocol:", window.location.protocol);
  console.log("Host:", window.location.host);
  console.log("Hostname:", window.location.hostname);
  console.log("Port:", window.location.port);

  console.log("User Agent:", navigator.userAgent);
  console.log("Online Status:", navigator.onLine);

  // Check if global API is available
  console.log(
    "Global API Available:",
    typeof (window as any).api === "function",
  );

  // Check environment variables
  console.log("Environment Variables:");
  console.log("- NODE_ENV:", process.env.NODE_ENV);
  console.log("- VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);

  console.groupEnd();
}

/**
 * Run comprehensive diagnostics and log results
 */
export async function runComprehensiveDiagnostics() {
  console.log("🚀 Starting comprehensive API diagnostics...");

  logDiagnosticInfo();

  const results = await runApiDiagnostics();

  console.group("📊 API Test Results");
  results.forEach((result) => {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} ${result.endpoint}:`, result);
  });
  console.groupEnd();

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  console.log(`📈 Summary: ${successCount}/${totalCount} endpoints successful`);

  if (successCount === 0) {
    console.error(
      "🚨 All API endpoints failed - this indicates a serious connectivity issue",
    );
  } else if (successCount < totalCount) {
    console.warn(
      "⚠️ Some API endpoints failed - this indicates intermittent issues",
    );
  } else {
    console.log("🎉 All API endpoints working correctly");
  }

  return results;
}

// Make diagnostics available globally for debugging
(window as any).apiDiagnostics = {
  runDiagnostics: runApiDiagnostics,
  testEndpoint,
  logInfo: logDiagnosticInfo,
  runFull: runComprehensiveDiagnostics,
};
