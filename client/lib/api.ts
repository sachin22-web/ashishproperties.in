// src/lib/api.ts

// ---------------- Environment detection ----------------
const detectEnvironment = () => {
  if (typeof window === "undefined") return "server";

  const { hostname, port } = window.location;

  // Development
  if (hostname === "localhost" || hostname === "127.0.0.1" || port === "8080") {
    return "development";
  }

  // Fly.dev
  if (hostname.includes(".fly.dev")) return "fly";

  // Netlify
  if (hostname.includes(".netlify.app")) return "netlify";

  // Other production
  return "production";
};

// ---------------- API base URL ----------------
const getApiBaseUrl = () => {
  // 1) Env var preferred
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log(
      "🔧 Using VITE_API_BASE_URL:",
      import.meta.env.VITE_API_BASE_URL,
    );
    return import.meta.env.VITE_API_BASE_URL;
  }

  const environment = detectEnvironment();
  console.log("🎯 Detected environment:", environment);

  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    console.log("📍 Current location:", {
      protocol,
      hostname,
      port,
      href: window.location.href,
    });

    switch (environment) {
      case "development":
      case "fly":
      case "netlify":
        // same-origin proxy (/api/*)
        return "";
      case "production":
      default:
        if (port && port !== "80" && port !== "443") {
          return `${protocol}//${hostname}`;
        }
        return "";
    }
  }
  return "";
};

const API_BASE_URL = getApiBaseUrl();
const environment = detectEnvironment();

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: environment === "development" ? 8000 : 15000,
  retryAttempts: 2,
  retryDelay: 1000,
  environment,
};

// Compose API URL from endpoint
export const createApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  console.log("🔗 API Config:", {
    baseUrl: API_CONFIG.baseUrl,
    endpoint: cleanEndpoint,
    currentLocation:
      typeof window !== "undefined" ? window.location.href : "server",
  });

  if (API_CONFIG.baseUrl) {
    if (API_CONFIG.baseUrl.endsWith("/api")) {
      const fullUrl = `${API_CONFIG.baseUrl}/${cleanEndpoint}`;
      console.log("🌐 Full API URL (baseUrl has /api):", fullUrl);
      return fullUrl;
    } else {
      const fullUrl = `${API_CONFIG.baseUrl}/api/${cleanEndpoint}`;
      console.log("🌐 Full API URL:", fullUrl);
      return fullUrl;
    }
  }

  const relativeUrl = `/api/${cleanEndpoint}`;
  console.log("🏠 Relative API URL:", relativeUrl);
  console.log("🌍 Environment:", environment);
  return relativeUrl;
};

// ---------------- helpers ----------------
// ---------------- helpers ----------------
// ---------------- helpers ----------------
// ---------------- helpers ----------------
const getStoredToken = (): string | null => {
  try {
    const keys = ["authToken", "token", "adminToken", "userToken"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && v.trim()) return v.trim();
    }
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        const fromUser =
          u?.token ||
          u?.accessToken ||
          u?.jwt ||
          u?.data?.token ||
          u?.data?.accessToken;
        if (typeof fromUser === "string" && fromUser.trim())
          return fromUser.trim();
      } catch {}
    }
    const cookie = (name: string) =>
      (document.cookie || "")
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(name + "="))
        ?.split("=")[1];
    const fromCookie =
      cookie("authToken") ||
      cookie("token") ||
      cookie("accessToken") ||
      cookie("jwt");
    if (fromCookie) {
      try {
        localStorage.setItem("token", fromCookie);
      } catch {}
      return fromCookie;
    }
    return null;
  } catch {
    return null;
  }
};

// ---------------- core request ----------------
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<{ data: any; status: number; ok: boolean }> => {
  const url = createApiUrl(endpoint);

  const isBuilderPreview =
    typeof window !== "undefined" &&
    window.location.hostname.includes("projects.builder.codes");

  if (isBuilderPreview && !API_CONFIG.baseUrl) {
    console.warn(
      "⚠️ Builder preview without VITE_API_BASE_URL. Using relative /api/* with reduced timeouts.",
    );
  }

  const controller = new AbortController();

  const effectiveTimeout = endpoint.includes("chat/unread-count")
    ? Math.max(API_CONFIG.timeout, 30000)
    : API_CONFIG.timeout;

  const extendedEndpoints = [
    "upload",
    "categories",
    "subcategories",
    "create",
    "delete",
  ];
  const isExtended = extendedEndpoints.some((k) => endpoint.includes(k));
  let finalTimeout = isExtended
    ? Math.max(effectiveTimeout, 45000)
    : effectiveTimeout;

  if (isBuilderPreview && !API_CONFIG.baseUrl) {
    finalTimeout = Math.min(finalTimeout, 8000);
  }

  const timeoutId = setTimeout(() => {
    try {
      // @ts-ignore
      controller.abort(new Error("timeout"));
    } catch {
      controller.abort();
    }
  }, finalTimeout);

  try {
    const callerHeaders = (options.headers as Record<string, string>) ?? {};
    const stored = getStoredToken();

    // Build headers carefully: DO NOT send Content-Type on DELETE (no body)
    const defaultHeaders: Record<string, string> = {};
    const hasBody = options.body !== undefined && options.body !== null;
    const bodyIsFormData =
      hasBody &&
      typeof FormData !== "undefined" &&
      options.body instanceof FormData;

    if (hasBody && !bodyIsFormData) {
      defaultHeaders["Content-Type"] = "application/json";
    }
    if (stored && !("Authorization" in callerHeaders)) {
      defaultHeaders.Authorization = `Bearer ${stored}`;
    }

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { ...defaultHeaders, ...callerHeaders },
      credentials: "include",
    });

    clearTimeout(timeoutId);

    // Safe parse
    let responseData: any = {};
    try {
      const clone = response.clone();
      const t = await clone.text();
      if (t && t.trim()) {
        try {
          responseData = JSON.parse(t);
        } catch {
          responseData = { raw: t };
        }
      }
    } catch {
      try {
        responseData = await response.json();
      } catch {
        responseData = {};
      }
    }

    if (!response.ok) {
      console.warn("⚠️ API responded with error", {
        url,
        status: response.status,
        data: responseData,
      });
    }

    return { data: responseData, status: response.status, ok: response.ok };
  } catch (error: any) {
    clearTimeout(timeoutId);

    const msg = String(error?.message || "").toLowerCase();
    const retriable =
      error?.name === "AbortError" ||
      msg.includes("timeout") ||
      msg.includes("failed to fetch") ||
      msg.includes("network error");

    if (retriable && retryCount < API_CONFIG.retryAttempts) {
      await new Promise((r) => setTimeout(r, API_CONFIG.retryDelay));
      return apiRequest(endpoint, options, retryCount + 1);
    }

    const isBuilderPreviewNoApi =
      typeof window !== "undefined" &&
      window.location.hostname.includes("projects.builder.codes") &&
      !API_CONFIG.baseUrl;

    if (isBuilderPreviewNoApi) {
      console.warn(
        "⚠️ apiRequest failed in Builder preview (no API base). Returning graceful failure.",
        error?.message || error,
      );
      return { data: null, status: 0, ok: false } as any;
    }

    console.error("apiRequest network error:", error?.message || error);
    return { data: null, status: 0, ok: false } as any;
  }
};

// ---------------- Specific API helpers ----------------
export const adminApi = {
  getStats: async (token: string) => {
    const response = await apiRequest("admin/stats", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok)
      throw new Error(
        response.data?.error ||
          response.data?.message ||
          (typeof response.data?.raw === "string" ? response.data.raw : "") ||
          `HTTP ${response.status}`,
      );
    return response.data;
  },

  getUsers: async (token: string, limit = 10) => {
    const response = await apiRequest(`admin/users?limit=${limit}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok)
      throw new Error(
        response.data?.error ||
          response.data?.message ||
          (typeof response.data?.raw === "string" ? response.data.raw : "") ||
          `HTTP ${response.status}`,
      );
    return response.data;
  },

  getProperties: async (token: string, limit = 10) => {
    const response = await apiRequest(`admin/properties?limit=${limit}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok)
      throw new Error(
        response.data?.error ||
          response.data?.message ||
          (typeof response.data?.raw === "string" ? response.data.raw : "") ||
          `HTTP ${response.status}`,
      );
    return response.data;
  },
};

// ---------------- General purpose API (get/post/put/delete) ----------------
export const api = {
  get: async (endpoint: string, token?: string) => {
    const authToken = token ?? getStoredToken();
    const headers: Record<string, string> = authToken
      ? { Authorization: `Bearer ${authToken}` }
      : {};
    try {
      const response = await apiRequest(endpoint, { method: "GET", headers });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          try {
            localStorage.removeItem("token");
            localStorage.removeItem("adminToken");
            localStorage.removeItem("user");
          } catch {}
          console.warn("api.get: authorization failed, redirecting to /auth");
          if (typeof window !== "undefined")
            setTimeout(() => (window.location.href = "/auth"), 300);
          return { data: null };
        }
        throw new Error(
          response.data?.error ||
            response.data?.message ||
            (typeof response.data?.raw === "string" ? response.data.raw : "") ||
            `HTTP ${response.status}`,
        );
      }
      return { data: response.data };
    } catch (err: any) {
      console.warn(`api.get(${endpoint}) failed:`, err?.message || err);
      return { data: null };
    }
  },

  post: async (endpoint: string, data?: any, token?: string) => {
    const authToken = token ?? getStoredToken();
    const headers: Record<string, string> = authToken
      ? { Authorization: `Bearer ${authToken}` }
      : {};
    const response = await apiRequest(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
    if (!response.ok) {
      const message =
        response.data?.error ||
        response.data?.message ||
        (typeof response.data?.raw === "string" ? response.data.raw : "") ||
        `HTTP ${response.status}`;
      const err: any = new Error(message);
      err.data = response.data;
      err.status = response.status;
      throw err;
    }
    return { data: response.data };
  },

  put: async (endpoint: string, data?: any, token?: string) => {
    const authToken = token ?? getStoredToken();
    const headers: Record<string, string> = authToken
      ? { Authorization: `Bearer ${authToken}` }
      : {};
    const response = await apiRequest(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
    if (!response.ok)
      throw new Error(
        response.data?.error ||
          response.data?.message ||
          (typeof response.data?.raw === "string" ? response.data.raw : "") ||
          `HTTP ${response.status}`,
      );
    return { data: response.data };
  },

  delete: async (endpoint: string, token?: string, data?: any) => {
    const authToken = token ?? getStoredToken();
    const headers: Record<string, string> = authToken
      ? { Authorization: `Bearer ${authToken}` }
      : {};
    const response = await apiRequest(endpoint, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
    if (!response.ok) {
      const message =
        response.data?.error ||
        response.data?.message ||
        (typeof response.data?.raw === "string" ? response.data.raw : "") ||
        `HTTP ${response.status}`;
      const err: any = new Error(message);
      err.data = response.data;
      err.status = response.status;
      throw err;
    }
    return { data: response.data };
  },
};

// Optional alias
// @ts-ignore
(api as any).del = (endpoint: string, token?: string) =>
  (api as any).delete(endpoint, token);
