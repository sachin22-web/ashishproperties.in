import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Check,
  Star,
  Crown,
  Zap,
  Clock,
  TrendingUp,
  Eye,
  Phone,
  ChevronRight,
  Package,
  ArrowRight,
} from "lucide-react";
import type { AdPackage } from "@shared/types";

export default function PackagesShowcase() {
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // 🛡️ Defensive: kill any parent <a href="#"> default bubbling
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const stopAnchorDefault = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a");
      if (!anchor) return;

      // if someone wrapped this section in an <a> or used href="#"
      const href = (anchor.getAttribute("href") || "").trim();
      if (href === "#" || href === "" || href === "/") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    root.addEventListener("click", stopAnchorDefault, true);
    return () => root.removeEventListener("click", stopAnchorDefault, true);
  }, []);

  useEffect(() => {
    fetchPackages();
    const interval = setInterval(() => {
      if (!fetchingRef.current) fetchPackages();
    }, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPackages = async () => {
    if (fetchingRef.current) return;
    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      let data: any;

      // 1) try global helper first
      try {
        if (typeof (window as any).api === "function") {
          const response = await (window as any).api("/plans?isActive=true");
          data = response?.ok ? response.json : response?.data;
        } else {
          throw new Error("Global API not available");
        }
      } catch {
        // 2) fallback direct fetch
        const res = await fetch("/api/plans?isActive=true", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        data = await res.json();
      }

      if (data && data.success && Array.isArray(data.data)) {
        setPackages(data.data.slice(0, 3));
      } else {
        setError("Invalid data format received");
        setPackages([]);
      }
    } catch (e) {
      setError("Failed to load packages");
      if (packages.length === 0) setPackages([]);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  const goCheckout = (id?: string) => {
    if (!id) return;
    // Extra logging to verify
    console.log("Navigating to:", `/checkout/${id}`);
    navigate(`/checkout/${id}`);
  };

  const goPostProperty = () => {
    console.log("Navigating to: /post-property");
    navigate("/post-property");
  };

  const getPackageIcon = (type: string) => {
    switch (type) {
      case "basic":
        return <Eye className="h-6 w-6" />;
      case "featured":
        return <Star className="h-6 w-6" />;
      case "premium":
        return <Crown className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const getPackageColor = (type: string) => {
    switch (type) {
      case "basic":
        return "from-gray-100 to-gray-200 text-gray-800";
      case "featured":
        return "from-orange-100 to-orange-200 text-orange-800";
      case "premium":
        return "from-purple-100 to-purple-200 text-purple-800";
      default:
        return "from-gray-100 to-gray-200 text-gray-800";
    }
  };

  if (loading && packages.length === 0) {
    return (
      <section className="bg-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (packages.length === 0) return null;

  return (
    <section ref={rootRef} className="bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-[#C70000] mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">
              Advertisement Packages
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Boost your property visibility with our specially designed packages
            for Rohtak market. Get more views, inquiries, and faster sales.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {packages.map((pkg) => (
            <div
              key={pkg._id}
              data-testid="plan-card"
              className={`relative rounded-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                pkg.type === "featured"
                  ? "border-orange-300 transform scale-105 shadow-lg"
                  : "border-gray-200"
              }`}
              // 🛡️ kill parent click
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {/* Premium Badge */}
              {pkg.premium && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Crown className="h-4 w-4 mr-1" />
                    Premium
                  </div>
                </div>
              )}

              {/* Package Header */}
              <div
                className={`bg-gradient-to-r ${getPackageColor(
                  pkg.type
                )} p-6 text-center`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4 shadow-lg">
                  <div
                    className={`${
                      pkg.type === "basic"
                        ? "text-gray-600"
                        : pkg.type === "featured"
                        ? "text-orange-600"
                        : "text-purple-600"
                    }`}
                  >
                    {getPackageIcon(pkg.type)}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <div className="text-3xl font-bold mb-1">
                  {pkg.price === 0 ? "Free" : `₹${pkg.price}`}
                </div>
                <div className="text-sm opacity-75 flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {pkg.duration} days
                </div>
              </div>

              {/* Package Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-6">{pkg.description}</p>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {pkg.features.slice(0, 4).map((feature, i) => (
                    <div key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {pkg.features.length > 4 && (
                    <div className="text-sm text-gray-500 italic">
                      + {pkg.features.length - 4} more features
                    </div>
                  )}
                </div>

                {/* CTA Button — NO LINK, NO REFRESH */}
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goCheckout(pkg._id);
                  }}
                  className={`w-full ${
                    pkg.type === "basic"
                      ? "bg-gray-600 hover:bg-gray-700"
                      : pkg.type === "featured"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  } text-white`}
                >
                  {pkg.price === 0
                    ? "Start Free Listing"
                    : `Choose for ₹${pkg.price}`}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-[#C70000] to-[#A60000] rounded-xl text-white p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                <Eye className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">5x More Views</h3>
              <p className="text-white text-opacity-90">
                Featured listings get significantly more visibility
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">3x Faster Sales</h3>
              <p className="text-white text-opacity-90">
                Premium properties sell much faster than basic listings
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                <Phone className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">4x More Calls</h3>
              <p className="text-white text-opacity-90">
                Get more genuine inquiries from interested buyers
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Sell Your Property Faster?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of successful sellers in Rohtak who trust our
            platform
          </p>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goPostProperty();
            }}
            className="bg-[#C70000] hover:bg-[#A60000] text-white px-8 py-3 text-lg"
          >
            Post Your Property Now
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}




