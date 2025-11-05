import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import CategoryBar from "../components/CategoryBar";
import BottomNavigation from "../components/BottomNavigation";
import StaticFooter from "../components/StaticFooter";

interface Subcategory {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  description: string;
  count?: number;
}

export default function Commercial() {
  const navigate = useNavigate();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubcategoriesAndCounts();
  }, []);

  /**
   * Fetch subcategories and live property counts for commercial category
   */
  const fetchSubcategoriesAndCounts = async () => {
    try {
      setLoading(true);

      // Fetch subcategories from API
      const apiResponse = await (window as any).api(
        "/categories/commercial/subcategories",
      );

      let fetchedSubcategories: Subcategory[] = [];

      if (apiResponse.ok && apiResponse.json?.success) {
        fetchedSubcategories = apiResponse.json.data || [];
      } else {
        console.warn(
          "Subcategories API returned non-OK; using fallback",
          apiResponse.status,
          apiResponse.json?.error,
        );
        // Fallback subcategories
        fetchedSubcategories = getFallbackSubcategories();
      }

      // Fetch live property counts for each subcategory
      const subcategoriesWithCounts = await Promise.all(
        fetchedSubcategories.map(async (sub) => {
          try {
            // Query properties by subCategory for commercial
            const countResponse = await (window as any).api(
              `/properties?category=commercial&subCategory=${sub.slug}&limit=1`,
            );

            let count = sub.count || 0;
            if (
              countResponse.ok &&
              countResponse.json?.success &&
              countResponse.json.data?.pagination
            ) {
              count = countResponse.json.data.pagination.total || 0;
            }

            return { ...sub, count };
          } catch (error) {
            console.error(
              `Error fetching count for subcategory ${sub.slug}:`,
              error,
            );
            return sub;
          }
        }),
      );

      setSubcategories(subcategoriesWithCounts);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories(getFallbackSubcategories());
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fallback subcategories for commercial page
   */
  const getFallbackSubcategories = (): Subcategory[] => [
    {
      id: "shop",
      name: "Shop",
      slug: "shop",
      description: "Retail shops and storefronts",
      count: 0,
    },
    {
      id: "office",
      name: "Office Space",
      slug: "office",
      description: "Office spaces and suites",
      count: 0,
    },
    {
      id: "showroom",
      name: "Showroom",
      slug: "showroom",
      description: "Showrooms and display spaces",
      count: 0,
    },
    {
      id: "warehouse",
      name: "Warehouse",
      slug: "warehouse",
      description: "Warehouses and storage spaces",
      count: 0,
    },
    {
      id: "factory",
      name: "Factory",
      slug: "factory",
      description: "Industrial factories and units",
      count: 0,
    },
    {
      id: "restaurant-space",
      name: "Restaurant Space",
      slug: "restaurant-space",
      description: "Food and beverage spaces",
      count: 0,
    },
  ];

  const handleSubcategoryClick = (subcategory: Subcategory) => {
    // Navigate with category filter for commercial
    navigate(`/commercial/${subcategory.slug}?category=commercial`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <OLXStyleHeader />

      <main className="pb-16">
        <CategoryBar />

        <div className="px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Commercial Properties
            </h1>
            <p className="text-gray-600">
              Find commercial spaces for your business - Shops, Offices,
              Warehouses & more
            </p>
          </div>

          {/* Subcategories Grid */}
          <div className="grid grid-cols-2 gap-3">
            {subcategories.map((subcategory) => (
              <button
                key={subcategory._id || subcategory.id || subcategory.slug}
                onClick={() => handleSubcategoryClick(subcategory)}
                className="subcat-card bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
                data-testid="subcat-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {subcategory.name}
                  </h3>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {subcategory.description}
                </p>
                {subcategory.count !== undefined && (
                  <span className="text-xs bg-[#C70000] text-white px-2 py-1 rounded-full font-medium">
                    {subcategory.count} properties
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Note about auto-categorization */}
          {subcategories.length > 0 && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 <strong>Auto-Updated Listings:</strong> New commercial
                properties are automatically displayed here after admin
                approval.
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
      <StaticFooter />
    </div>
  );
}
