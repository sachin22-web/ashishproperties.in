import { useState } from "react";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CheckCircle, AlertCircle, Shield, Chrome } from "lucide-react";
import { signInWithGoogle } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";

interface GoogleAuthProps {
  userType?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: "card" | "button";
}

export default function GoogleAuth({
  userType = "buyer",
  onSuccess,
  onError,
  className = "",
  variant = "card",
}: GoogleAuthProps) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1) Firebase popup → ID token
      const { idToken } = await signInWithGoogle();
      if (!idToken) throw new Error("Failed to get Firebase ID token");

      // 2) ✅ Unified backend (works for Google & Phone)
      const res = await fetch("/api/auth/firebase-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ idToken, userType }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || "Google login failed");
      }

      // Normalize shape
      const appToken = data?.token ?? data?.data?.token;
      const appUser  = data?.user  ?? data?.data?.user;
      if (!appToken || !appUser) throw new Error("Invalid server response");

      // 3) Save JWT + user via context/storage
      login(appToken, appUser);

      setSuccess("You're signed in with Google!");
      onSuccess?.();
    } catch (e: any) {
      const msg = e?.message || "Google authentication failed. Please try again.";
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const ButtonUI = (
    <Button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2"
      variant={variant === "button" ? "outline" : undefined}
    >
      <Chrome className="w-5 h-5" />
      {loading ? "Signing in..." : "Continue with Google"}
    </Button>
  );

  if (variant === "button") {
    return (
      <div className={className}>
        {error && (
          <Alert className="mb-3 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-3 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        {ButtonUI}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Sign in with Google
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-3 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-3 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        {ButtonUI}
        <p className="text-xs text-gray-500 mt-2">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </CardContent>
    </Card>
  );
}
