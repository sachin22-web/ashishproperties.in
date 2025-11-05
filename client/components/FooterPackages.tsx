import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Crown, Star, Eye, ArrowRight } from "lucide-react";
import { AdPackage } from "@shared/types";

export default function FooterPackages() {
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFooterPackages();
  }, []);

  const fetchFooterPackages = async () => {
    try {
      setLoading(true);

      // Get packages with placement='footer'
      const response = await (window as any).api("/plans?isActive=true");
      const data = response.ok
        ? response.json
        : { success: false, error: "Failed to fetch plans" };

      if (data.success && Array.isArray(data.data)) {
        // Filter for footer placement packages
        const footerPackages = data.data.filter(
          (pkg: AdPackage) => pkg.placement === "footer",
        );
        setPackages(footerPackages);
      }
    } catch (error) {
      console.error("Error fetching footer packages:", error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const getPackageIcon = (type: string) => {
    switch (type) {
      case "basic":
        return <Eye className="h-5 w-5" />;
      case "featured":
        return <Star className="h-5 w-5" />;
      case "premium":
        return <Crown className="h-5 w-5" />;
      default:
        return <Eye className="h-5 w-5" />;
    }
  };

  // Don't render if no packages or still loading
  if (loading || packages.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-red-600 pt-8 mt-8">
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">
          Advertisement Packages
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg._id}
              data-testid="plan-card"
              className="bg-white bg-opacity-10 rounded-lg p-4 hover:bg-opacity-20 transition-all duration-200"
            >
              {/* Package Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="text-white">{getPackageIcon(pkg.type)}</div>
                  <h5 className="font-semibold text-white">{pkg.name}</h5>
                </div>
                {pkg.premium && (
                  <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Premium
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="text-2xl font-bold text-white mb-2">
                {pkg.price === 0 ? "Free" : `₹${pkg.price}`}
              </div>

              {/* Features (show first 2) */}
              <ul className="text-red-100 text-sm space-y-1 mb-4">
                {pkg.features.slice(0, 2).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1 h-1 bg-red-200 rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
                {pkg.features.length > 2 && (
                  <li className="text-red-200 text-xs">
                    +{pkg.features.length - 2} more features
                  </li>
                )}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => (window.location.href = `/checkout/${pkg._id}`)}
                className="w-full bg-white text-[#C70000] hover:bg-red-50 text-sm py-2"
              >
                Choose Package
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
