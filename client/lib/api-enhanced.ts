// Enhanced API utility with better error handling and fallback mechanisms

const detectEnvironment = () => {
  if (typeof window === "undefined") return "server";

  const { protocol, hostname, port } = window.location;

  // Development environment
  if (hostname === "localhost" || hostname === "127.0.0.1" || port === "8080") {
    return "development";
  }

  // Fly.dev deployment
  if (hostname.includes(".fly.dev")) {
    return "fly";
  }

  // Netlify deployment
  if (hostname.includes(".netlify.app")) {
    return "netlify";
  }

  // Other production
  return "production";
};

// API Configuration with better defaults
const getApiBaseUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  const environment = detectEnvironment();

  switch (environment) {
    case "development":
      return "http://localhost:8080";
    case "fly":
      return `${window.location.protocol}//${window.location.host}`;
    case "netlify":
      return "/.netlify/functions";
    default:
      return "";
  }
};

const API_BASE_URL = getApiBaseUrl();
const environment = detectEnvironment();

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: 35000, // Further increased timeout for Fly.dev compatibility
  retryAttempts: 2, // Reduced retry attempts to prevent long delays
  retryDelay: 1500, // Reduced initial delay
  environment,
};

// Helper function to create API URLs
export const createApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  if (API_CONFIG.baseUrl) {
    // If baseUrl points to localhost but the app is being served from a different host
    // (e.g. remote preview), prefer using a relative URL so the proxy can route requests.
    const isLocalHostBase = /localhost|127\.0\.0\.1/.test(API_CONFIG.baseUrl);
    const servedFromLocalHost = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname);

    if (isLocalHostBase && typeof window !== 'undefined' && !servedFromLocalHost) {
      const relativeUrlFallback = `/api/${cleanEndpoint.replace("api/", "")}`;
      console.log(
        `🔗 API URL adjusted to relative (${relativeUrlFallback}) because baseUrl is localhost and app is not served from localhost. (base: ${API_CONFIG.baseUrl})`,
      );
      return relativeUrlFallback;
    }

    const fullUrl = `${API_CONFIG.baseUrl}/api/${cleanEndpoint.replace("api/", "")}`;
    console.log(
      `🔗 API URL: ${fullUrl} (Environment: ${API_CONFIG.environment})`,
    );
    return fullUrl;
  }

  const relativeUrl = `/api/${cleanEndpoint.replace("api/", "")}`;
  console.log(
    `🔗 API URL: ${relativeUrl} (Environment: ${API_CONFIG.environment})`,
  );
  return relativeUrl;
};

// Enhanced fetch with retry and fallback
export const safeApiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<{
  data: any;
  status: number;
  ok: boolean;
  fromFallback?: boolean;
}> => {
  const url = createApiUrl(endpoint);
  const controller = new AbortController();

  // Use adaptive timeout based on retry count and environment
  let timeoutId: NodeJS.Timeout | null = null;
  const adaptiveTimeout =
    API_CONFIG.environment === "fly"
      ? Math.min(45000, 30000 + retryCount * 5000) // 30-45s for Fly.dev
      : Math.min(20000, 10000 + retryCount * 3000); // 10-20s for others

  timeoutId = setTimeout(() => {
    console.warn(`⏰ Request timeout for ${url} after ${adaptiveTimeout}ms`);
    controller.abort();
  }, adaptiveTimeout);

  try {
    console.log(
      `🔄 API Request [${retryCount + 1}/${API_CONFIG.retryAttempts + 1}]: ${url}`,
    );

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    let responseData;
    try {
      if (response.headers.get("content-type")?.includes("application/json")) {
        responseData = await response.json();
      } else {
        const responseText = await response.text();
        if (responseText && responseText.trim()) {
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = { error: "Invalid JSON format", raw: responseText };
          }
        } else {
          responseData = { message: "Empty response" };
        }
      }
    } catch (readError) {
      responseData = response.ok
        ? { success: true, message: "Operation completed successfully" }
        : {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
    }

    return {
      data: responseData,
      status: response.status,
      ok: response.ok,
    };
  } catch (error: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const isRetryableError =
      error.name === "AbortError" ||
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("NetworkError") ||
      error.message?.includes("timeout") ||
      error.message?.includes("Load failed") ||
      error.code === "NETWORK_ERROR" ||
      error.code === "FETCH_ERROR";

    // Enhanced retry logic with exponential backoff
    if (isRetryableError && retryCount < API_CONFIG.retryAttempts) {
      const backoffDelay = Math.min(
        API_CONFIG.retryDelay * Math.pow(2, retryCount), // Exponential backoff
        10000, // Max 10 second delay
      );

      console.warn(
        `🔄 Retrying request (${retryCount + 1}/${API_CONFIG.retryAttempts}) in ${backoffDelay}ms...`,
        { error: error.message, url },
      );

      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      return safeApiRequest(endpoint, options, retryCount + 1);
    }

    // Return fallback data after all retries failed
    const errorInfo = {
      error: error.message || "Unknown error",
      name: error.name || "Error",
      stack: error.stack?.split("\n")?.[0] || "No stack trace",
      url,
      retryCount: retryCount + 1,
      timestamp: new Date().toISOString(),
    };

    console.error(
      `❌ API request failed after ${retryCount + 1} attempts for ${endpoint}:`,
      errorInfo,
    );

    return {
      data: getFallbackData(endpoint),
      status: 0,
      ok: false,
      fromFallback: true,
    };
  }
};

// Enhanced fallback data for common endpoints
const getFallbackData = (endpoint: string) => {
  const cleanEndpoint = endpoint.toLowerCase();

  if (cleanEndpoint.includes("properties")) {
    return {
      success: true,
      data: [],
      message: "No properties available (offline mode)",
      fromFallback: true,
    };
  }

  if (cleanEndpoint.includes("categories")) {
    return {
      success: true,
      data: [
        {
          _id: "fallback-1",
          name: "Residential",
          slug: "residential",
          icon: "building",
          active: true,
          order: 1,
        },
        {
          _id: "fallback-2",
          name: "Commercial",
          slug: "commercial",
          icon: "office",
          active: true,
          order: 2,
        },
        {
          _id: "fallback-3",
          name: "Plots",
          slug: "plots",
          icon: "map",
          active: true,
          order: 3,
        },
      ],
      message: "Using offline categories",
      fromFallback: true,
    };
  }

  if (cleanEndpoint.includes("packages")) {
    return {
      success: true,
      data: [],
      message: "No packages available (offline mode)",
      fromFallback: true,
    };
  }

  if (cleanEndpoint.includes("homepage-sliders")) {
    return {
      success: true,
      data: [],
      message: "No sliders configured",
      fromFallback: true,
    };
  }

  // Footer-specific fallbacks
  if (cleanEndpoint.includes("footer/links")) {
    return {
      success: true,
      data: [
        {
          _id: "fallback-link-1",
          title: "Quick Buy",
          url: "/buy",
          section: "quick_links",
          order: 1,
          isActive: true,
          isExternal: false,
        },
        {
          _id: "fallback-link-2",
          title: "Quick Sale",
          url: "/sale",
          section: "quick_links",
          order: 2,
          isActive: true,
          isExternal: false,
        },
        {
          _id: "fallback-link-3",
          title: "Contact",
          url: "/contact",
          section: "support",
          order: 1,
          isActive: true,
          isExternal: false,
        },
      ],
      message: "Using offline footer links",
      fromFallback: true,
    };
  }

  if (cleanEndpoint.includes("footer/settings")) {
    return {
      success: true,
      data: {
        companyName: "Ashish Properties",
        companyDescription:
          "Your trusted property partner in Rohtak. Find your dream home with verified listings and expert guidance.",
        companyLogo: "AP",
        socialLinks: {},
        contactInfo: {
          phone: "+91 9876543210",
          email: "info@aashishproperty.com",
          address: "Rohtak, Haryana, India",
        },
        showLocations: true,
        locations: [
          "Model Town",
          "Sector 14",
          "Civil Lines",
          "Old City",
          "Industrial Area",
          "Bohar",
        ],
        customSections: {},
      },
      message: "Using offline footer settings",
      fromFallback: true,
    };
  }

  if (cleanEndpoint.includes("content/pages")) {
    return {
      success: true,
      data: [],
      message: "No content pages available (offline mode)",
      fromFallback: true,
    };
  }

  return {
    success: false,
    error: "Service temporarily unavailable",
    message: "Please try again later",
    fromFallback: true,
  };
};

// Enhanced API object with better error handling
export const enhancedApi = {
  get: async (endpoint: string, token?: string) => {
    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const result = await safeApiRequest(endpoint, {
      method: "GET",
      headers,
    });

    if (result.fromFallback) {
      console.warn(`🔄 Using fallback data for ${endpoint}`);
    }

    return result;
  },

  post: async (endpoint: string, data: any, token?: string) => {
    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return safeApiRequest(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  },

  put: async (endpoint: string, data: any, token?: string) => {
    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return safeApiRequest(endpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
  },

  delete: async (endpoint: string, token?: string) => {
    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return safeApiRequest(endpoint, {
      method: "DELETE",
      headers,
    });
  },
};

// Backward compatibility - enhanced version of existing api object
export const api = enhancedApi;

export default enhancedApi;
