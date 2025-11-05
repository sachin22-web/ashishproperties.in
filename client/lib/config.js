// API Configuration for Production
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export const API_CONFIG = {
  baseUrl: API_BASE,
  timeout: 15000,
  retryAttempts: 2,
  retryDelay: 1000,
};

console.log("🔧 Production API Config:", {
  baseUrl: API_BASE,
  environment: import.meta.env.NODE_ENV || "development",
});
