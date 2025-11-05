import { useState } from "react";
import { ArrowLeft, Lock, Mail, Phone, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ApiResponse } from "@shared/types";
import { useAuth } from "../hooks/useAuth";
// ⬇️ use apiClient (we just fixed it)
// client/pages/AdminLogin.tsx
import { apiClient } from "../../src/lib/apiClient";


export default function AdminLogin() {
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: Record<string, any> = {
        password,
        userType: "admin",
      };
      if (loginMethod === "email") payload.email = email;
      else payload.phone = phone;

      // ✅ call via apiClient (auto Authorization on subsequent requests)
      const data = await apiClient.post<ApiResponse<any>>("auth/login", payload);

      if (!data || (data as any).success === false) {
        throw new Error((data as any)?.error || "Login failed");
      }

      // Some backends return { data: { token, user } }, some { accessToken, user }
      const token =
        (data as any)?.data?.token ||
        (data as any)?.accessToken ||
        (data as any)?.token;

      const user =
        (data as any)?.data?.user || (data as any)?.user || null;

      if (!token) throw new Error("Token missing in response");

      // ✅ persist token so hard refresh stays logged-in
      localStorage.setItem("adminToken", token);
      apiClient.setToken(token); // hydrate current session too

      // your existing auth context (if it stores user etc.)
      if (typeof login === "function") {
        // keep signature consistent with your hook
        try { login(token, user); } catch { /* ignore if signature differs */ }
      }

      // go to admin home
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>

          <div className="mx-auto h-16 w-16 bg-[#C70000] rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
          <p className="mt-2 text-gray-600">Sign in to access the admin panel</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* Login Method Selector */}
            <div className="flex border border-gray-300 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === "email"
                    ? "bg-[#C70000] text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("phone")}
                className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === "phone"
                    ? "bg-[#C70000] text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Phone className="h-4 w-4 mr-2" />
                Phone
              </button>
            </div>

            {/* Email/Phone Input */}
            {loginMethod === "email" ? (
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@aashishproperty.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex mt-1">
                  <div className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                    <span className="text-gray-600">+91</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-l-none"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C70000] hover:bg-[#A60000] text-white"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Demo Credentials:
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <strong>Email:</strong> admin@aashishproperty.com
            </p>
            <p>
              <strong>Phone:</strong> +919876543210
            </p>
            <p>
              <strong>Password:</strong> admin123
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>Admin access only. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  );
}
