import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
} from "lucide-react";

interface DatabaseStatusProps {
  token?: string;
}

interface HealthStatus {
  api: boolean;
  database: boolean;
  auth: boolean;
  categories: boolean;
  properties: boolean;
  users: boolean;
  packages: boolean;
  banners: boolean;
}

export default function DatabaseStatus({ token }: DatabaseStatusProps) {
  const [status, setStatus] = useState<HealthStatus>({
    api: false,
    database: false,
    auth: false,
    categories: false,
    properties: false,
    users: false,
    packages: false,
    banners: false,
  });
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Safe fetch wrapper with timeout and error handling
  const safeFetch = async (url: string, options: RequestInit = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  useEffect(() => {
    checkAllConnections();
  }, []);

  const checkAllConnections = async () => {
    setLoading(true);
    const newStatus: HealthStatus = {
      api: false,
      database: false,
      auth: false,
      categories: false,
      properties: false,
      users: false,
      packages: false,
      banners: false,
    };

    try {
      // 1. Check API Health with timeout
      console.log("🔍 Testing API health...");
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const healthResponse = await safeFetch("/api/ping");
        clearTimeout(timeoutId);

        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          newStatus.api = true;
          newStatus.database = healthData.database === "connected";
          console.log("✅ API is responding");
          console.log(
            newStatus.database
              ? "✅ MongoDB Atlas connected"
              : "❌ MongoDB Atlas disconnected",
          );
        } else {
          console.log(
            `❌ API returned ${healthResponse.status}: ${healthResponse.statusText}`,
          );
        }
      } catch (apiError) {
        console.log("❌ API health check failed:", apiError);
        newStatus.api = false;
        newStatus.database = false;
      }

      // 2. Check Categories
      try {
        console.log("🔍 Testing categories endpoint...");
        const categoriesResponse = await safeFetch("/api/categories");
        const categoriesData = await categoriesResponse.json();
        newStatus.categories = categoriesResponse.ok && categoriesData.success;
        console.log(
          newStatus.categories
            ? `✅ Categories loaded (${categoriesData.data?.length} found)`
            : "❌ Categories failed to load",
        );
      } catch (error) {
        console.log("❌ Categories endpoint failed:", error);
      }

      // 3. Check Properties
      try {
        console.log("🔍 Testing properties endpoint...");
        const propertiesResponse = await safeFetch("/api/properties");
        const propertiesData = await propertiesResponse.json();
        newStatus.properties = propertiesResponse.ok && propertiesData.success;
        console.log(
          newStatus.properties
            ? `✅ Properties loaded (${propertiesData.data?.properties?.length} found)`
            : "❌ Properties failed to load",
        );
      } catch (error) {
        console.log("❌ Properties endpoint failed:", error);
      }

      // 4. Check Packages
      try {
        console.log("🔍 Testing packages endpoint...");
        const packagesResponse = await safeFetch("/api/packages");
        const packagesData = await packagesResponse.json();
        newStatus.packages = packagesResponse.ok && packagesData.success;
        console.log(
          newStatus.packages
            ? `✅ Packages loaded (${packagesData.data?.length} found)`
            : "❌ Packages failed to load",
        );
      } catch (error) {
        console.log("❌ Packages endpoint failed:", error);
      }

      // 5. Check Authentication (if token provided)
      if (token) {
        try {
          console.log("🔍 Testing authentication...");
          const authResponse = await safeFetch("/api/admin/stats", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const authData = await authResponse.json();
          newStatus.auth = authResponse.ok && authData.success;
          console.log(
            newStatus.auth
              ? "✅ Authentication successful"
              : "❌ Authentication failed",
          );

          // 6. Check Users (requires auth)
          if (newStatus.auth) {
            try {
              console.log("🔍 Testing users endpoint...");
              const usersResponse = await safeFetch("/api/admin/users", {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              const usersData = await usersResponse.json();
              newStatus.users = usersResponse.ok && usersData.success;
              console.log(
                newStatus.users
                  ? `✅ Users loaded (${usersData.data?.users?.length} found)`
                  : "❌ Users failed to load",
              );
            } catch (error) {
              console.log("❌ Users endpoint failed:", error);
            }
          }
        } catch (error) {
          console.log("❌ Authentication failed:", error);
        }
      }

      // 7. Check Banners
      try {
        console.log("🔍 Testing banners endpoint...");
        const bannersResponse = await safeFetch("/api/banners?active=true");
        const bannersData = await bannersResponse.json();
        newStatus.banners = bannersResponse.ok && bannersData.success;
        console.log(
          newStatus.banners
            ? `✅ Banners loaded (${bannersData.data?.length} found)`
            : "❌ Banners failed to load",
        );
      } catch (error) {
        console.log("❌ Banners endpoint failed:", error);
      }
    } catch (error) {
      console.error("❌ Health check failed:", error);
    }

    setStatus(newStatus);
    setLastChecked(new Date());
    setLoading(false);
  };

  const getStatusIcon = (isConnected: boolean) => {
    if (isConnected) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getOverallStatus = () => {
    const connectedCount = Object.values(status).filter(Boolean).length;
    const totalCount = Object.values(status).length;
    const percentage = (connectedCount / totalCount) * 100;

    if (percentage === 100)
      return { color: "green", text: "All Systems Online" };
    if (percentage >= 75)
      return { color: "yellow", text: "Mostly Operational" };
    if (percentage >= 50)
      return { color: "orange", text: "Partial Connectivity" };
    return { color: "red", text: "System Issues" };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-gray-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Database Connectivity Status
            </h3>
            <p className="text-sm text-gray-600">
              MongoDB Atlas & API Endpoints
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              overallStatus.color === "green"
                ? "bg-green-100 text-green-800"
                : overallStatus.color === "yellow"
                  ? "bg-yellow-100 text-yellow-800"
                  : overallStatus.color === "orange"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-red-100 text-red-800"
            }`}
          >
            {status.database ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span>{overallStatus.text}</span>
          </div>
          <Button
            onClick={checkAllConnections}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">API Server</p>
            <p className="text-xs text-gray-600">Health Check</p>
          </div>
          {getStatusIcon(status.api)}
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">MongoDB Atlas</p>
            <p className="text-xs text-gray-600">Database Connection</p>
          </div>
          {getStatusIcon(status.database)}
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Categories</p>
            <p className="text-xs text-gray-600">Data Loading</p>
          </div>
          {getStatusIcon(status.categories)}
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Properties</p>
            <p className="text-xs text-gray-600">Listings API</p>
          </div>
          {getStatusIcon(status.properties)}
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Packages</p>
            <p className="text-xs text-gray-600">Advertisement</p>
          </div>
          {getStatusIcon(status.packages)}
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Banners</p>
            <p className="text-xs text-gray-600">Display Ads</p>
          </div>
          {getStatusIcon(status.banners)}
        </div>

        {token && (
          <>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Authentication
                </p>
                <p className="text-xs text-gray-600">Admin Access</p>
              </div>
              {getStatusIcon(status.auth)}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Users</p>
                <p className="text-xs text-gray-600">User Management</p>
              </div>
              {getStatusIcon(status.users)}
            </div>
          </>
        )}
      </div>

      {lastChecked && (
        <div className="mt-4 text-center text-xs text-gray-500">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}

      {!status.database && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                Database Connection Issues
              </h4>
              <p className="text-sm text-red-700 mt-1">
                MongoDB Atlas connection failed. Please check:
              </p>
              <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                <li>Network connectivity</li>
                <li>Database credentials</li>
                <li>IP whitelist configuration</li>
                <li>Database cluster status</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
