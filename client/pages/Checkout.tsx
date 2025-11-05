import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Loader2, CheckCircle2, XCircle } from "lucide-react";

type Plan = {
  _id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
};

type CouponValidation = {
  valid: boolean;
  discountAmount: number;
  finalAmount: number;
  couponId: string;
};

export default function Checkout() {
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponData, setCouponData] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/plans/${planId}`);
        if (!res.ok) throw new Error("Failed to load plan");
        const data = await res.json();
        const p = data?.data || data?.plan;
        if (!p) throw new Error("Plan not found");
        setPlan(p);
      } catch (e) {
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [planId, navigate]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !plan) return;

    setCouponLoading(true);
    setCouponError("");
    setCouponData(null);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          packageId: plan._id,
          purchaseAmount: plan.price,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setCouponData(data.data);
        setCouponError("");
      } else {
        setCouponError(data.error || "Invalid coupon code");
        setCouponData(null);
      }
    } catch (error) {
      setCouponError("Failed to validate coupon. Please try again.");
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponData(null);
    setCouponError("");
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!plan) return <div className="p-6">Plan not found</div>;

  const originalPrice = plan.price;
  const discountAmount = couponData?.discountAmount || 0;
  const finalPrice = couponData?.finalAmount ?? originalPrice;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Checkout</h1>
      <p className="text-gray-600 mb-6">
        {plan.description || "Complete your plan purchase"}
      </p>

      {/* Plan Details */}
      <div className="rounded-lg border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-lg">{plan.name}</div>
            <div className="text-sm text-gray-600">{plan.duration} days</div>
          </div>
          <div className="text-2xl font-bold">
            {plan.price === 0 ? "Free" : `₹${originalPrice}`}
          </div>
        </div>
      </div>

      {/* Coupon Section */}
      {plan.price > 0 && (
        <div className="rounded-lg border p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-[#C70000]" />
            <h3 className="font-semibold">Have a coupon code?</h3>
          </div>

          {!couponData ? (
            <div className="flex gap-2">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleApplyCoupon()}
                disabled={couponLoading}
                className="flex-1"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || couponLoading}
                variant="outline"
                className="border-[#C70000] text-[#C70000] hover:bg-[#C70000] hover:text-white"
              >
                {couponLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <p className="font-medium">Coupon applied successfully!</p>
                  <p className="text-sm">Code: {couponCode}</p>
                </div>
              </div>
              <Button
                onClick={handleRemoveCoupon}
                variant="ghost"
                size="sm"
                className="text-green-700 hover:text-green-900"
              >
                Remove
              </Button>
            </div>
          )}

          {couponError && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{couponError}</p>
            </div>
          )}
        </div>
      )}

      {/* Price Breakdown */}
      {plan.price > 0 && (
        <div className="rounded-lg border p-4 mb-6">
          <h3 className="font-semibold mb-3">Price Summary</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Original Price:</span>
              <span>₹{originalPrice}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>- ₹{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className={discountAmount > 0 ? "text-green-600" : ""}>
                ₹{finalPrice.toFixed(2)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="text-xs text-green-600 text-right">
                You save ₹{discountAmount.toFixed(2)}!
              </div>
            )}
          </div>
        </div>
      )}

      <Button className="w-full bg-[#C70000] hover:bg-[#A60000] text-white">
        {plan.price === 0 ? "Start Free Listing" : `Pay ₹${finalPrice.toFixed(2)}`}
      </Button>
    </div>
  );
}
