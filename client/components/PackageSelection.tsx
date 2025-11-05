// client/components/PackageSelection.tsx
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Check, Star, Crown, Zap, Clock, TrendingUp, Eye } from "lucide-react";
import type { AdPackage } from "@shared/types";
import { createApiUrl } from "../lib/api"; // <— direct URL banane ko use kar rahe

interface PackageSelectionProps {
  propertyId?: string;
  onPackageSelect?: (packageId: string) => void;
  selectedPackage?: string;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/* ---------- Auth utils ---------- */
type Role = "admin" | "seller" | "user" | "customer" | "agent" | null;

const parseJSON = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
};

const getAuth = () => {
  try {
    // Prefer normal user; fallback adminUser (some panels store separately)
    const rawAdminUser = localStorage.getItem("adminUser");
    const rawUser = localStorage.getItem("user") || rawAdminUser;

    // Common token keys
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("adminToken") ||
      null;

    const userObj = parseJSON<{ userType?: string; role?: string }>(rawUser);

    let role: Role =
      (userObj?.userType as Role) ||
      (userObj?.role as Role) ||
      "user";

    if (role) role = role.toLowerCase() as Role;

    // Normalize to our set
    if (["seller", "user", "customer", "admin", "agent"].includes(role || "")) {
      return { token, role, user: userObj };
    }

    return { token, role: "user" as Role, user: userObj };
  } catch {
    return { token: null, role: null as Role, user: null };
  }
};

// 🚫 OLD: blocked admin
// const isPaymentAllowed = (role: Role) =>
//   !!role && ["seller", "user", "customer"].includes(role);

// ✅ NEW: allow admin/agent too. Server will re-check anyway.
const isPaymentAllowed = (role: Role) =>
  !!role && ["seller", "user", "customer", "admin", "agent"].includes(role);

/* ---------- Component ---------- */
export default function PackageSelection({
  propertyId,
  selectedPackage,
}: PackageSelectionProps) {
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  const { token, role } = getAuth();
  const roleAllowed = isPaymentAllowed(role);
  const hasToken = !!token;

  useEffect(() => {
    fetchPackages();
    const interval = setInterval(fetchPackages, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const url = createApiUrl("packages?activeOnly=true");
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setPackages(data.data);
        console.log("📦 Loaded packages:", data.data);
      } else {
        console.error("Failed to fetch packages:", data?.error);
      }
    } catch (e) {
      console.error("Error fetching packages:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpay = () =>
    new Promise<void>((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(s);
    });

  /* ---- FORCE auth headers: Authorization + x-auth-token + x-admin-token ---- */
  const authHeaders = (t: string) => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${t}`,
    "x-auth-token": t,
    "x-admin-token": t,
  });

  const redirectToLogin = () => {
    const next =
      typeof window !== "undefined"
        ? encodeURIComponent(window.location.pathname + window.location.search)
        : "/";
    window.location.href = `/auth?next=${next}`;
  };

  const payWithRazorpay = async (pkg: AdPackage) => {
    try {
      // ✅ Only enforce token presence. Role is allowed (server will ultimately guard).
      if (!hasToken) {
        alert("Please login to continue.");
        redirectToLogin();
        return;
      }

      setPayingId(pkg._id!);
      await loadRazorpay();

      // 1) Create order — direct fetch with forced headers
      const createUrl = createApiUrl("payments/razorpay/create");
      const createRes = await fetch(createUrl, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(token!),
        body: JSON.stringify({
          packageId: pkg._id,
          propertyId,
          paymentDetails: { source: "web", ts: Date.now() },
        }),
      });

      if (createRes.status === 401 || createRes.status === 403) {
        alert("Please login to continue.");
        redirectToLogin();
        return;
      }

      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok || !createJson?.success) {
        console.warn("Create order failed:", createJson);
        alert(createJson?.error || `Order create failed (HTTP ${createRes.status})`);
        return;
      }

      const order = createJson.data as {
        transactionId: string;
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
      };

      // 2) Open checkout
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Ashish Properties",
        description: pkg.name,
        order_id: order.razorpayOrderId,
        notes: { packageId: pkg._id!, propertyId: propertyId || "none" },
        theme: { color: "#C70000" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 3) Verify — again force headers
            const verifyUrl = createApiUrl("payments/razorpay/verify");
            const vRes = await fetch(verifyUrl, {
              method: "POST",
              credentials: "include",
              headers: authHeaders(token!),
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const vJson = await vRes.json().catch(() => ({}));
            if (!vRes.ok || !vJson?.success) {
              alert(vJson?.error || `Payment verification failed (HTTP ${vRes.status})`);
              return;
            }

            alert("✅ Payment successful! Your package is activated (Pending Approval).");
            window.location.href = "/my-properties";
          } catch (err) {
            console.error("Verification error:", err);
            alert("Payment verification error");
          }
        },
        modal: { ondismiss: () => console.log("Razorpay closed by user") },
        prefill: { name: "Customer", email: "customer@example.com", contact: "9999999999" },
      });

      rzp.open();
    } catch (e: any) {
      console.error("create order failed:", e);
      alert(e?.message || "Razorpay failed to initialize");
    } finally {
      setPayingId(null);
    }
  };

  const getPackageIcon = (type: string) => {
    switch (type) {
      case "basic": return <Eye className="h-6 w-6" />;
      case "featured": return <Star className="h-6 w-6" />;
      case "premium": return <Crown className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getCardColors = (type: string) => {
    switch (type) {
      case "basic": return "border-gray-300 bg-white";
      case "featured": return "border-orange-300 bg-orange-50";
      case "premium": return "border-purple-300 bg-purple-50";
      default: return "border-gray-300 bg-white";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Advertisement Package</h2>
        <p className="text-gray-600">
          Pay securely with Razorpay. Your listing goes into <b>Pending Approval</b> after payment.
        </p>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No packages available</div>
          <Button
            onClick={fetchPackages}
            variant="outline"
            className="text-[#C70000] border-[#C70000] hover:bg-[#C70000] hover:text-white"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const disabled = payingId === pkg._id || (!hasToken && pkg.price !== 0);
            const label = !hasToken
              ? "Login to Pay"
              : payingId === pkg._id
              ? "Processing..."
              : "Pay with Razorpay";

            return (
              <div
                key={pkg._id}
                className={`rounded-lg border-2 p-6 transition-all hover:shadow-lg ${
                  selectedPackage === pkg._id ? "border-[#C70000] bg-red-50" : getCardColors(pkg.type)
                } ${pkg.type === "featured" ? "transform scale-105" : ""}`}
              >
                <div className="text-center mb-6">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                      pkg.type === "basic"
                        ? "bg-gray-100 text-gray-600"
                        : pkg.type === "featured"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    {getPackageIcon(pkg.type)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  {pkg.type === "featured" && (
                    <div className="inline-flex items-center bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Most Popular
                    </div>
                  )}
                </div>

                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900">
                    {pkg.price === 0 ? "Free" : `₹${pkg.price}`}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center justify-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    {pkg.duration} days
                  </div>
                </div>

                {pkg.description && (
                  <p className="text-gray-600 text-center mb-6">{pkg.description}</p>
                )}

                {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                  <div className="space-y-3 mb-8">
                    {pkg.features.map((f, i) => (
                      <div key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                {pkg.price === 0 ? (
                  <Button
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                    onClick={() => alert("Free package selected. (Admin can auto-activate without payment.)")}
                  >
                    Activate Free Package
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-[#C70000] hover:bg-[#A60000] text-white"
                    onClick={() => {
                      if (!hasToken) {
                        alert("Please login to continue.");
                        return redirectToLogin();
                      }
                      // Role allowed (admin included); server will enforce final rules
                      if (!roleAllowed) {
                        console.warn("Non-standard role; proceeding to server check.");
                      }
                      payWithRazorpay(pkg);
                    }}
                    disabled={disabled}
                  >
                    {label}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-1">Payment Status Timeline</h3>
        <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
          <li>Pay now with Razorpay</li>
          <li>After payment: Property status = “Pending Approval”</li>
          <li>Admin Approval: Property becomes “Live”</li>
        </ul>
      </div>
    </div>
  );
}
