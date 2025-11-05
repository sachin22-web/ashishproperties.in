import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Users,
  Home,
  CreditCard,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";

export default function DatabaseDiagnostics() {
  const { token } = useAuth();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [fixing, setFixing] = useState(false);
  const [fixResults, setFixResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      // Test basic database connection
      console.log("🔍 Testing database connection...");
      const dbResponse = await fetch("/api/test/database");
      const dbResult = await dbResponse.json();

      // Test admin user
      console.log("👨‍💼 Testing admin user...");
      const adminResponse = await fetch("/api/test/admin-user");
      const adminResult = await adminResponse.json();

      // Test admin stats
      console.log("📊 Testing admin stats...");
      const statsResponse = await fetch("/api/test/admin-stats");
      const statsResult = await statsResponse.json();

      // Test authenticated admin endpoint
      let authResult = null;
      if (token) {
        console.log("🔐 Testing authenticated admin endpoint...");
        const authResponse = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        authResult = await authResponse.json();
      }

      setResults({
        database: dbResult,
        admin: adminResult,
        stats: statsResult,
        authenticated: authResult,
        timestamp: new Date().toISOString(),
      });

    } catch (err: any) {
      console.error("❌ Diagnostics failed:", err);
      setError(`Diagnostics failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fixDatabase = async () => {
    setFixing(true);
    setError("");
    setFixResults(null);

    try {
      // Force create admin user
      console.log("🔧 Creating admin user...");
      const adminResponse = await fetch("/api/fix/create-admin", {
        method: "POST",
      });
      const adminResult = await adminResponse.json();

      // Initialize system data
      console.log("🔧 Initializing system data...");
      const initResponse = await fetch("/api/fix/initialize-system", {
        method: "POST",
      });
      const initResult = await initResponse.json();

      // Test admin endpoints
      console.log("🔧 Testing admin endpoints...");
      const endpointsResponse = await fetch("/api/fix/admin-endpoints");
      const endpointsResult = await endpointsResponse.json();

      setFixResults({
        admin: adminResult,
        initialization: initResult,
        endpoints: endpointsResult,
        timestamp: new Date().toISOString(),
      });

      // Re-run diagnostics after fixing
      setTimeout(() => {
        runDiagnostics();
      }, 1000);

    } catch (err: any) {
      console.error("❌ Fix failed:", err);
      setError(`Fix failed: ${err.message}`);
    } finally {
      setFixing(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean, label: string) => {
    return (
      <Badge 
        variant={success ? "default" : "destructive"}
        className={success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
      >
        {success ? "✅" : "❌"} {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Database Diagnostics</h3>
          <p className="text-gray-600">Test database connectivity and admin functions</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={runDiagnostics}
            disabled={loading || fixing}
            className="bg-[#C70000] hover:bg-[#A60000]"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Run Diagnostics
              </>
            )}
          </Button>
          <Button
            onClick={fixDatabase}
            disabled={loading || fixing}
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            {fixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Fix Issues
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database Connection Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Database Connection</span>
                {getStatusIcon(results.database?.success)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.database?.success ? (
                <>
                  <div className="space-y-2">
                    {getStatusBadge(results.database.data.ping, "Connection")}
                    {getStatusBadge(results.database.data.adminExists, "Admin User")}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                      <div className="font-semibold">{results.database.data.counts.users}</div>
                      <div className="text-gray-600">Users</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <Home className="h-4 w-4 mx-auto mb-1 text-green-500" />
                      <div className="font-semibold">{results.database.data.counts.properties}</div>
                      <div className="text-gray-600">Properties</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <CreditCard className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                      <div className="font-semibold">{results.database.data.counts.transactions}</div>
                      <div className="text-gray-600">Transactions</div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Collections:</p>
                    <div className="flex flex-wrap gap-1">
                      {results.database.data.collections.map((collection: string) => (
                        <Badge key={collection} variant="outline" className="text-xs">
                          {collection}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-600 font-medium">Database connection failed</p>
                  <p className="text-sm text-gray-600">{results.database?.error}</p>
                  {results.database?.details && (
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(results.database.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin User Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Admin User</span>
                {getStatusIcon(results.admin?.success)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.admin?.success ? (
                <div className="space-y-2">
                  {getStatusBadge(results.admin.data.adminExists, "Admin Exists")}
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Email:</span> {results.admin.data.adminEmail}</p>
                    <p><span className="font-medium">Type:</span> {results.admin.data.adminUserType}</p>
                    <p><span className="font-medium">Status:</span> {results.admin.data.message}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-600 font-medium">Admin user test failed</p>
                  <p className="text-sm text-gray-600">{results.admin?.error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Admin Stats</span>
                {getStatusIcon(results.stats?.success)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.stats?.success ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-semibold text-blue-600">{results.stats.data.totalUsers}</div>
                    <div className="text-gray-600">Total Users</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-600">{results.stats.data.totalProperties}</div>
                    <div className="text-gray-600">Total Properties</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="font-semibold text-purple-600">{results.stats.data.activeProperties}</div>
                    <div className="text-gray-600">Active Properties</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="font-semibold text-orange-600">{results.stats.data.usersByType?.length || 0}</div>
                    <div className="text-gray-600">User Types</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-600 font-medium">Stats calculation failed</p>
                  <p className="text-sm text-gray-600">{results.stats?.error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Authenticated Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Authenticated API</span>
                {token ? getStatusIcon(results.authenticated?.success) : (
                  <XCircle className="h-5 w-5 text-yellow-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!token ? (
                <div className="space-y-2">
                  <p className="text-yellow-600 font-medium">No authentication token</p>
                  <p className="text-sm text-gray-600">Please login as admin to test authenticated endpoints</p>
                </div>
              ) : results.authenticated?.success ? (
                <div className="space-y-2">
                  {getStatusBadge(true, "Authenticated")}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-semibold text-green-600">{results.authenticated.data.totalUsers}</div>
                      <div className="text-gray-600">Users</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-semibold text-blue-600">{results.authenticated.data.totalProperties}</div>
                      <div className="text-gray-600">Properties</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-600 font-medium">Authenticated API failed</p>
                  <p className="text-sm text-gray-600">{results.authenticated?.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {fixResults && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-sm text-orange-800">Fix Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono space-y-2">
              <p><span className="font-semibold">Timestamp:</span> {fixResults.timestamp}</p>
              <p><span className="font-semibold">Admin User:</span> {fixResults.admin?.success ? "✅ Created/Verified" : "❌ Failed"}</p>
              <p><span className="font-semibold">System Init:</span> {fixResults.initialization?.success ? "✅ Initialized" : "❌ Failed"}</p>
              <p><span className="font-semibold">Endpoints:</span> {fixResults.endpoints?.success ? "✅ Working" : "❌ Failed"}</p>
              {fixResults.admin?.data?.credentials && (
                <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
                  <p className="font-semibold text-green-800 mb-2">Admin Login Credentials:</p>
                  <p><span className="font-semibold">Email:</span> {fixResults.admin.data.credentials.email}</p>
                  <p><span className="font-semibold">Password:</span> {fixResults.admin.data.credentials.password}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Test Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono space-y-2">
              <p><span className="font-semibold">Timestamp:</span> {results.timestamp}</p>
              <p><span className="font-semibold">Database:</span> {results.database?.success ? "✅ Connected" : "❌ Failed"}</p>
              <p><span className="font-semibold">Admin User:</span> {results.admin?.success ? "✅ OK" : "❌ Failed"}</p>
              <p><span className="font-semibold">Stats:</span> {results.stats?.success ? "✅ OK" : "❌ Failed"}</p>
              <p><span className="font-semibold">Authenticated:</span> {!token ? "⚠️ No Token" : results.authenticated?.success ? "✅ OK" : "❌ Failed"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!results && !loading && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Database Diagnostics</h3>
            <p className="text-gray-600 mb-4">
              Run diagnostics to check database connectivity and admin functions
            </p>
            <Button onClick={runDiagnostics} variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Start Diagnostics
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
