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

export default function Sale() {
  const navigate = useNavigate();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      // Fetch subcategories from API
      const apiResponse = await (window as any).api(
        "/categories/sale/subcategories",
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
        fetchedSubcategories = getFallbackSubcategories();
      }

      // Map slug to propertyType for API query
      const getPropertyTypeForSlug = (
        slug: string,
      ): { propertyType?: string; subCategory?: string } => {
        const slugLower = slug.toLowerCase();

        if (
          ["1bhk", "2bhk", "3bhk", "4bhk", "villa", "house", "flat"].includes(
            slugLower,
          )
        ) {
          return { propertyType: "residential", subCategory: slugLower };
        }

        if (slugLower === "plot" || slugLower === "land") {
          return { propertyType: "plot" };
        }

        if (slugLower === "commercial") {
          return { propertyType: "commercial" };
        }

        if (slugLower === "agricultural") {
          return { propertyType: "agricultural" };
        }

        return { subCategory: slugLower };
      };

      // Fetch live property counts for each subcategory
      const subcategoriesWithCounts = await Promise.all(
        fetchedSubcategories.map(async (sub) => {
          try {
            // Map slug to propertyType
            const mapping = getPropertyTypeForSlug(sub.slug);

            // Build query params
            const params = new URLSearchParams();
            params.append("priceType", "sale");
            params.append("limit", "1");

            if (mapping.propertyType) {
              params.append("propertyType", mapping.propertyType);
            }
            if (mapping.subCategory) {
              params.append("subCategory", mapping.subCategory);
            }

            const countResponse = await (window as any).api(
              `/properties?${params}`,
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

  const getFallbackSubcategories = (): Subcategory[] => [
    {
      id: "1bhk",
      name: "1 BHK",
      slug: "1bhk",
      description: "Single bedroom apartments",
      count: 0,
    },
    {
      id: "2bhk",
      name: "2 BHK",
      slug: "2bhk",
      description: "Two bedroom apartments",
      count: 0,
    },
    {
      id: "3bhk",
      name: "3 BHK",
      slug: "3bhk",
      description: "Three bedroom apartments",
      count: 0,
    },
    {
      id: "4bhk",
      name: "4+ BHK",
      slug: "4bhk",
      description: "Four or more bedrooms",
      count: 0,
    },
    {
      id: "villa",
      name: "Villa",
      slug: "villa",
      description: "Independent villas",
      count: 0,
    },
    {
      id: "house",
      name: "Independent House",
      slug: "house",
      description: "Independent houses",
      count: 0,
    },
    {
      id: "plot",
      name: "Plot/Land",
      slug: "plot",
      description: "Plots and land",
      count: 0,
    },
    {
      id: "commercial",
      name: "Commercial",
      slug: "commercial",
      description: "Commercial properties",
      count: 0,
    },
  ];

  const handleSubcategoryClick = (subcategory: Subcategory) => {
    navigate(`/sale/${subcategory.slug}`);
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Sale Properties
            </h1>
            <p className="text-gray-600">Choose a property type to sell</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {subcategories.map((subcategory) => (
              <button
                key={subcategory._id || subcategory.id || subcategory.slug}
                onClick={() => handleSubcategoryClick(subcategory)}
                className="subcat-card bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors shadow-sm"
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
                {subcategory.count && (
                  <span className="text-xs bg-[#C70000] text-white px-2 py-1 rounded-full">
                    {subcategory.count} properties
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </main>

      <BottomNavigation />
      <StaticFooter />
    </div>
  );
}
