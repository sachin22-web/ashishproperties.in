// Network utility functions for debugging connectivity issues

export interface NetworkStatus {
  isOnline: boolean;
  canReachServer: boolean;
  apiBaseUrl: string;
  environment: string;
  diagnostics: string[];
}

export const checkNetworkStatus = async (): Promise<NetworkStatus> => {
  const diagnostics: string[] = [];
  let canReachServer = false;

  try {
    // Detect environment
    const hostname = window.location.hostname;
    const environment = hostname.includes(".fly.dev")
      ? "fly.dev"
      : hostname.includes(".netlify.app")
        ? "netlify"
        : hostname === "localhost"
          ? "localhost"
          : "production";

    diagnostics.push(`Environment: ${environment}`);
    diagnostics.push(`Current URL: ${window.location.href}`);
    diagnostics.push(`Navigator online: ${navigator.onLine}`);

    // Try to reach the server with a simple ping
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("/api/ping", {
        method: "GET",
        cache: "no-cache",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      canReachServer = response.ok;
      diagnostics.push(
        `Server ping: ${response.status} ${response.statusText}`,
      );
    } catch (pingError: any) {
      diagnostics.push(`Server ping failed: ${pingError.message}`);

      if (pingError.name === "AbortError") {
        diagnostics.push("Request timed out after 5 seconds");
      } else if (pingError.message?.includes("Failed to fetch")) {
        diagnostics.push("Network connectivity issue detected");
      }
    }

    // Check if fetch API is available
    diagnostics.push(`Fetch API available: ${typeof fetch !== "undefined"}`);

    // Check for any CSP or security restrictions
    try {
      const securityInfo = {
        origin: window.location.origin,
        protocol: window.location.protocol,
        isSecure: window.location.protocol === "https:",
        hasServiceWorker: "serviceWorker" in navigator,
      };
      diagnostics.push(`Security context: ${JSON.stringify(securityInfo)}`);
    } catch (secError) {
      diagnostics.push(`Security check failed: ${secError.message}`);
    }
  } catch (error: any) {
    diagnostics.push(`Network check failed: ${error.message}`);
  }

  return {
    isOnline: navigator.onLine,
    canReachServer,
    apiBaseUrl: window.location.origin,
    environment: window.location.hostname.includes(".fly.dev")
      ? "fly.dev"
      : window.location.hostname.includes(".netlify.app")
        ? "netlify"
        : window.location.hostname === "localhost"
          ? "localhost"
          : "production",
    diagnostics,
  };
};

export const createSafeApiCall = (
  endpoint: string,
  options: RequestInit = {},
) => {
  return async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`/api/${endpoint.replace(/^\/+/, "")}`, {
        ...options,
        signal: controller.signal,
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data, status: response.status };
    } catch (error: any) {
      console.error(`Safe API call failed for ${endpoint}:`, error);

      return {
        success: false,
        error: error.message,
        isNetworkError:
          error.name === "TypeError" &&
          error.message?.includes("Failed to fetch"),
        isTimeout: error.name === "AbortError",
      };
    }
  };
};
