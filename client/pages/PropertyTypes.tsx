import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import {
  getPropertyTypesForSubcategory,
  PropertyType,
} from "../data/propertyTypes";

interface Category {
  _id?: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export default function PropertyTypes() {
  const { category, subcategory } = useParams();
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [subcategoryData, setSubcategoryData] = useState<Subcategory | null>(
    null,
  );
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryData();
  }, [category, subcategory]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const data = await response.json();

      if (data.success) {
        const foundCategory = data.data.find(
          (cat: Category) => cat.slug === category,
        );
        setCategoryData(foundCategory);

        if (foundCategory && subcategory) {
          const foundSubcategory = foundCategory.subcategories.find(
            (sub: Subcategory) => sub.slug === subcategory,
          );
          setSubcategoryData(foundSubcategory);

          if (foundSubcategory) {
            const types = getPropertyTypesForSubcategory(foundSubcategory.slug);
            setPropertyTypes(types);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyTypeClick = (propertyType: PropertyType) => {
    // Navigate to filtered property list with property type
    window.location.href = `/categories/${category}/${subcategory}/${propertyType.slug}`;
  };

  const handleBackClick = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading property types...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!subcategoryData || propertyTypes.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Property Types Found
            </h3>
            <p className="text-gray-600 mb-4">
              No property types available for this subcategory.
            </p>
            <button
              onClick={handleBackClick}
              className="text-[#C70000] hover:underline"
            >
              Go Back
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="px-4 py-6">
        {/* Header with Back Button */}
        <div className="flex items-center mb-6">
          <button onClick={handleBackClick} className="mr-4 p-2">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-medium text-gray-900">
              {subcategoryData.name}
            </h1>
            <p className="text-sm text-gray-500">Choose property type</p>
          </div>
        </div>

        {/* Property Types List */}
        <div className="space-y-2">
          {propertyTypes.map((propertyType) => (
            <button
              key={propertyType.id}
              onClick={() => handlePropertyTypeClick(propertyType)}
              className="w-full bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">
                    {propertyType.icon || categoryData?.icon || "🏠"}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900 text-base">
                    {propertyType.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {propertyType.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
