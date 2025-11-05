import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
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
import { AdPackage } from "@shared/types";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import StaticFooter from "../components/StaticFooter";

export default function Advertise() {
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the global API function as specified by user - get ALL packages for advertise page
      const response = await (window as any).api("/plans?isActive=1");
      const data = response.ok
        ? response.json
        : { success: false, error: "Failed to fetch plans" };

      if (data.success && Array.isArray(data.data)) {
        setPackages(data.data);
        setError(null);
      } else {
        console.warn("Invalid packages data received:", data);
        setError("Invalid data format received");
        setPackages([]);
      }
    } catch (error: any) {
      console.error("Error fetching packages:", error);
      setError(`Failed to load packages: ${error.message}`);
      setPackages([]);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading packages...</p>
          </div>
        </div>
        <BottomNavigation />
        <StaticFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pb-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#C70000] to-[#A60000] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-6">
              <Package className="h-12 w-12 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Advertisement Packages
              </h1>
            </div>
            <p className="text-xl text-red-100 max-w-3xl mx-auto">
              Boost your property visibility with our specially designed
              packages for Rohtak market. Get more views, inquiries, and faster
              sales with the right advertising package.
            </p>
          </div>
        </section>

        {/* Packages Section */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
                {error}
              </div>
            )}

            {packages.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No packages available
                </h3>
                <p className="text-gray-500">
                  Please check back later for available advertisement packages.
                </p>
              </div>
            ) : (
              <>
                {/* Packages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  {packages.map((pkg, index) => (
                    <div
                      key={pkg._id}
                      data-testid="plan-card"
                      className={`relative rounded-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                        pkg.type === "premium"
                          ? "border-orange-300 transform scale-105 shadow-lg"
                          : "border-gray-200"
                      }`}
                    >
                      {/* Premium Badge */}
                      {pkg.type === "premium" && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                            <Crown className="h-4 w-4 mr-1" />
                            Premium
                          </div>
                        </div>
                      )}

                      {/* Package Header */}
                      <div
                        className={`bg-gradient-to-r ${getPackageColor(pkg.type)} p-6 text-center`}
                      >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4 shadow-lg">
                          <div
                            className={`${pkg.type === "basic" ? "text-gray-600" : pkg.type === "featured" ? "text-orange-600" : "text-purple-600"}`}
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
                          {pkg.features.map((feature, featureIndex) => (
                            <div
                              key={featureIndex}
                              className="flex items-start"
                            >
                              <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* CTA Button */}
                        <Button
                          onClick={() =>
                            (window.location.href = `/checkout/${pkg._id}`)
                          }
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

                {/* Benefits Section */}
                <div className="bg-gradient-to-r from-[#C70000] to-[#A60000] rounded-xl text-white p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-4">
                      Why Choose Our Packages?
                    </h2>
                    <p className="text-red-100">
                      Get the most out of your property listing with our proven
                      advertising solutions
                    </p>
                  </div>

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
                      <h3 className="text-xl font-bold mb-2">
                        3x Faster Sales
                      </h3>
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

                {/* Call to Action */}
                <div className="text-center mt-16">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Ready to Sell Your Property Faster?
                  </h3>
                  <p className="text-lg text-gray-600 mb-8">
                    Join thousands of successful sellers in Rohtak who trust our
                    platform
                  </p>
                  <Button
                    onClick={() => (window.location.href = "/post-property")}
                    className="bg-[#C70000] hover:bg-[#A60000] text-white px-12 py-4 text-lg"
                  >
                    Post Your Property Now
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <BottomNavigation />
      <StaticFooter />
    </div>
  );
}
