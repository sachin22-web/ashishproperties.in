import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Eye, EyeOff, Mail, Phone, Lock } from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";

const UserLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    userType: "seller" as "seller" | "buyer" | "agent",
  });

  useEffect(() => {
    // Test server connectivity
    const testServerConnection = async () => {
      try {
        console.log("🔍 Testing server connectivity...");
        const response = await fetch('/api/ping');
        const data = await response.json();
        console.log("✅ Server ping successful:", data);
      } catch (error) {
        console.error("❌ Server ping failed:", error);
      }
    };

    testServerConnection();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "auth/login" : "auth/register";
      const payload = isLogin 
        ? { 
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            password: formData.password,
          }
        : formData;

      console.log("Making API request:", { endpoint, payload });
      const response = await api.post(endpoint, payload);
      console.log("API response:", response);

      if (response.data.success) {
        const { token, user } = response.data.data;
        login(token, user);
        
        // Redirect to user dashboard
        navigate("/user-dashboard");
      } else {
        setError(response.data.error || "Authentication failed");
      }
    } catch (error: any) {
      console.error("Login/Register error:", error);
      console.error("Error details:", {
        message: error.message,
        endpoint,
        payload
      });
      setError(error.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {isLogin ? "Welcome Back!" : "Create Account"}
              </CardTitle>
              <p className="text-center text-gray-600">
                {isLogin 
                  ? "Sign in to your account" 
                  : "Join our property marketplace"
                }
              </p>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required={!isLogin}
                      className="w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="pl-10"
                      required={!isLogin || !formData.phone}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="pl-10"
                      required={!isLogin || !formData.email}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      I am a
                    </label>
                    <select
                      name="userType"
                      value={formData.userType}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#C70000] focus:border-transparent"
                      required={!isLogin}
                    >
                      <option value="seller">Property Seller</option>
                      <option value="buyer">Property Buyer</option>
                      <option value="agent">Real Estate Agent</option>
                    </select>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-[#C70000] hover:bg-[#A50000] text-white"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-gray-600">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#C70000] hover:text-[#A50000] font-semibold"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link 
                  to="/" 
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Back to Home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
