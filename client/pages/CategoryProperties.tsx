import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Filter,
  Grid,
  List,
  MapPin,
  Heart,
  Phone,
  X,
  ZoomIn,
} from "lucide-react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import ImageModal from "../components/ImageModal";
import Watermark from "../components/Watermark";
import { Button } from "../components/ui/button";
import { Property } from "@shared/types";

/** ---------------- Filters ---------------- */
interface FilterState {
  priceType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  minArea: string;
  maxArea: string;
  sector: string;
  mohalla: string;
  sortBy: string;
}

const initialFilters: FilterState = {
  priceType: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
  bathrooms: "",
  minArea: "",
  maxArea: "",
  sector: "",
  mohalla: "",
  sortBy: "date_desc",
};

const rohtakSectors = [
  "Sector 1",
  "Sector 2",
  "Sector 3",
  "Sector 4",
  "Sector 5",
  "Sector 6",
  "Sector 7",
  "Sector 8",
  "Sector 9",
  "Sector 10",
];

const mohallas = [
  "Prem Nagar",
  "Shastri Nagar",
  "DLF Colony",
  "Model Town",
  "Subhash Nagar",
  "Civil Lines",
  "Ram Nagar",
  "Industrial Area",
];

/** ---------------- Component ---------------- */
export default function CategoryProperties() {
  const { category, subcategory, propertyType, slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Drawer / sidebar
  const [showFilters, setShowFilters] = useState(false);

  // Image zoom modal
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedPropertyForZoom, setSelectedPropertyForZoom] =
    useState<Property | null>(null);

  // Initialize filters from URL params on mount
  const getInitialFilters = (): FilterState => {
    return {
      priceType: searchParams.get("priceType") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      bedrooms: searchParams.get("bedrooms") || "",
      bathrooms: searchParams.get("bathrooms") || "",
      minArea: searchParams.get("minArea") || "",
      maxArea: searchParams.get("maxArea") || "",
      sector: searchParams.get("sector") || "",
      mohalla: searchParams.get("mohalla") || "",
      sortBy: searchParams.get("sortBy") || "date_desc",
    };
  };

  const [filters, setFilters] = useState<FilterState>(getInitialFilters());
  const [categoryData, setCategoryData] = useState<any>(null);

  /** Sync filters with URL params when searchParams change (e.g., browser back/forward) */
  useEffect(() => {
    const updatedFilters = getInitialFilters();
    setFilters(updatedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /** Lock body scroll when mobile drawer open */
  useEffect(() => {
    if (showFilters) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showFilters]);

  // Get category from URL path
  const getCurrentCategory = () => {
    const path = window.location.pathname;
    if (path.startsWith("/buy/")) return "buy";
    if (path.startsWith("/sale/")) return "sale";
    if (path.startsWith("/rent/")) return "rent";
    if (path.startsWith("/lease/")) return "lease";
    if (path.startsWith("/pg/")) return "pg";
    return category;
  };

  useEffect(() => {
    fetchCategoryData();
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subcategory, slug]);

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchCategoryData = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.success) {
        const foundCategory = data.data.find(
          (cat: any) => cat.slug === category,
        );
        setCategoryData(foundCategory);
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
    }
  };

  const getPropertyTypeAndSubCategory = (
    categoryName: string,
    slugValue?: string,
  ): { propertyType?: string; subCategory?: string } => {
    if (!slugValue) return {};

    const slugLower = slugValue.toLowerCase();

    // Map slug to propertyType and subCategory
    // For BHK apartments and houses
    if (
      ["1bhk", "2bhk", "3bhk", "4bhk", "villa", "house", "flat"].includes(
        slugLower,
      )
    ) {
      return { propertyType: "residential", subCategory: slugLower };
    }

    // For plots
    if (
      slugLower === "plot" ||
      slugLower === "land" ||
      slugLower.includes("plot")
    ) {
      return { propertyType: "plot" };
    }

    // For commercial
    if (
      slugLower === "commercial" ||
      slugLower === "office" ||
      slugLower === "shop"
    ) {
      return { propertyType: "commercial" };
    }

    // For agricultural
    if (
      slugLower === "agricultural" ||
      slugLower === "agriculture" ||
      slugLower.includes("agriculture")
    ) {
      return { propertyType: "agricultural" };
    }

    // For PG
    if (slugLower === "pg" || slugLower.includes("pg")) {
      return { propertyType: "pg" };
    }

    // Fallback: treat slug as subCategory
    return { subCategory: slugLower };
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Handle category and subcategory from URL
      const currentCategory = getCurrentCategory();

      // Set priceType based on main category (buy/rent/lease/pg)
      if (currentCategory === "buy" || currentCategory === "sale") {
        params.append("priceType", "sale");
      } else if (currentCategory === "rent") {
        params.append("priceType", "rent");
      } else if (currentCategory === "lease") {
        params.append("priceType", "lease");
      } else if (currentCategory === "pg") {
        params.append("propertyType", "pg");
      }

      // Handle propertyType from subcategory parameter (e.g., /buy/residential, /rent/commercial)
      if (subcategory && !slug) {
        // subcategory is the propertyType (residential, commercial, plot, etc.)
        params.append("propertyType", subcategory);
      }

      // Handle slug from category page (e.g., /buy/commercial, /buy/1bhk, /buy/plot)
      if (slug) {
        const mapping = getPropertyTypeAndSubCategory(currentCategory, slug);
        if (mapping.propertyType) {
          params.append("propertyType", mapping.propertyType);
        }
        if (mapping.subCategory) {
          params.append("subCategory", mapping.subCategory);
        }
      }

      // Handle direct propertyType from category only if it's not buy/rent/lease/pg
      if (
        category &&
        !["buy", "sale", "rent", "lease", "pg"].includes(category) &&
        !subcategory
      ) {
        params.append("propertyType", category);
      }

      if (propertyType) params.append("propertyType", propertyType);

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== "sortBy") params.append(key, value);
      });

      // Add sorting
      if (filters.sortBy) params.append("sortBy", filters.sortBy);

      const apiResponse = await (window as any).api(
        `properties?${params.toString()}`,
      );
      const data = apiResponse.ok
        ? apiResponse.json
        : { success: false, error: "Failed to fetch properties" };

      if (data.success && data.data) {
        setProperties(
          Array.isArray(data.data.properties) ? data.data.properties : [],
        );
      } else {
        console.warn("API response:", data);
        setProperties([]);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };

      // Update URL params
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      setSearchParams(params, { replace: true });

      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters(initialFilters);

    // Clear all filter params from URL, keeping only non-filter params
    const params = new URLSearchParams();
    setSearchParams(params, { replace: true });
  };

  const getActiveFilterCount = () =>
    Object.entries(filters).filter(([key, value]) => value && key !== "sortBy")
      .length;

  const getCategoryTitle = () => {
    const currentCategory = getCurrentCategory();

    if (slug) {
      const subcategoryName = slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const categoryName = currentCategory?.replace(/\b\w/g, (l) =>
        l.toUpperCase(),
      );
      return `${subcategoryName} for ${categoryName}`;
    }
    if (propertyType) {
      return propertyType
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }
    if (subcategory) {
      return subcategory
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }
    if (category) {
      return category
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return "Properties";
  };

  /** ---------------- Loading ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading properties...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  /** flag: are there any results? */
  const hasResults = Array.isArray(properties) && properties.length > 0;

  /** ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ---------------- Mobile Filters Drawer (full-screen, scrollable) ---------------- */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowFilters(false)}
            aria-hidden="true"
          />
          {/* Drawer Panel */}
          <aside className="absolute inset-y-0 left-0 w-11/12 max-w-sm bg-white shadow-xl flex flex-col">
            {/* Drawer Header - sticky */}
            <div className="p-4 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content - scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Price Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Property For
                </label>
                <select
                  value={filters.priceType}
                  onChange={(e) =>
                    handleFilterChange("priceType", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All</option>
                  <option value="sale">Sale</option>
                  <option value="rent">Rent</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange("minPrice", e.target.value)
                    }
                    className="p-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", e.target.value)
                    }
                    className="p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bedrooms
                </label>
                <select
                  value={filters.bedrooms}
                  onChange={(e) =>
                    handleFilterChange("bedrooms", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Any</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4+ BHK</option>
                </select>
              </div>

              {/* Bathrooms */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bathrooms
                </label>
                <select
                  value={filters.bathrooms}
                  onChange={(e) =>
                    handleFilterChange("bathrooms", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Any</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
              </div>

              {/* Area Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Area (sq ft)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min Area"
                    value={filters.minArea}
                    onChange={(e) =>
                      handleFilterChange("minArea", e.target.value)
                    }
                    className="p-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="number"
                    placeholder="Max Area"
                    value={filters.maxArea}
                    onChange={(e) =>
                      handleFilterChange("maxArea", e.target.value)
                    }
                    className="p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Sector */}
              <div>
                <label className="block text-sm font-medium mb-2">Sector</label>
                <select
                  value={filters.sector}
                  onChange={(e) => handleFilterChange("sector", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Any Sector</option>
                  {rohtakSectors.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mohalla */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mohalla
                </label>
                <select
                  value={filters.mohalla}
                  onChange={(e) =>
                    handleFilterChange("mohalla", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Any Mohalla</option>
                  {mohallas.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="area_desc">Area: Large to Small</option>
                </select>
              </div>
            </div>

            {/* Drawer Footer - sticky */}
            <div className="p-4 border-t sticky bottom-0 bg-white z-10 flex gap-2">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="flex-1"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setShowFilters(false)}
                className="flex-1 bg-[#C70000] hover:bg-[#A60000] text-white"
              >
                Apply Filters
              </Button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex">
        {/* ---------------- Desktop Sidebar Filters (sticky, own scroll, sticky footer) ---------------- */}
        <aside className="hidden md:block w-64 bg-white sticky top-0 border-r border-gray-200">
          <div className="flex flex-col h-[100vh]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <h2 className="text-lg font-semibold">Filters</h2>

              {/* Property For */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Property For
                </label>
                <select
                  value={filters.priceType}
                  onChange={(e) =>
                    handleFilterChange("priceType", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All</option>
                  <option value="sale">Sale</option>
                  <option value="rent">Rent</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price Range
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange("minPrice", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bedrooms
                </label>
                <select
                  value={filters.bedrooms}
                  onChange={(e) =>
                    handleFilterChange("bedrooms", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Any</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4+ BHK</option>
                </select>
              </div>

              {/* Sector */}
              <div>
                <label className="block text-sm font-medium mb-2">Sector</label>
                <select
                  value={filters.sector}
                  onChange={(e) => handleFilterChange("sector", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Any Sector</option>
                  {rohtakSectors.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="area_desc">Area: Large to Small</option>
                </select>
              </div>
            </div>

            {/* Sticky footer: Clear All always visible */}
            <div className="p-4 border-t bg-white">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="w-full"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </aside>

        {/* ---------------- Main Content ---------------- */}
        <main className="flex-1 p-4">
          {/* Header with Back + View toggles + Mobile filter btn */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => window.history.back()}
                className="mr-4 p-2 bg-white rounded-full shadow-md"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  {getCategoryTitle()}
                </h1>
                <p className="text-sm text-gray-600">
                  {properties.length} properties found
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Toggle - Desktop */}
              <div className="hidden md:flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-gray-100" : ""}`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-gray-100" : ""}`}
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>

              {/* Filter Button - Mobile (disabled when no results) */}
              <Button
                onClick={() => hasResults && setShowFilters(true)}
                variant="outline"
                size="sm"
                disabled={!hasResults}
                aria-disabled={!hasResults}
                title={hasResults ? "Filter" : "Filter disabled – no results"}
                className={`md:hidden ${
                  hasResults
                    ? "border-[#C70000] text-[#C70000]"
                    : "border-gray-300 text-gray-400 opacity-50 cursor-not-allowed pointer-events-none"
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {hasResults && getActiveFilterCount() > 0 && (
                  <span className="ml-1 bg-[#C70000] text-white text-xs rounded-full px-1.5 py-0.5">
                    {getActiveFilterCount()}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Listing */}
          <div data-testid="listing-page">
            {properties.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-lg p-8 shadow-sm inline-block">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Properties Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    No properties match your current filters. Try adjusting your
                    search criteria.
                  </p>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="border-[#C70000] text-[#C70000]"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "prop-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "space-y-4"
                }
              >
                {properties.map((property) => (
                  <div
                    key={property._id}
                    className={`prop-card bg-white rounded-lg shadow-sm overflow-hidden ${
                      viewMode === "grid" ? "flex flex-col" : "flex"
                    }`}
                  >
                    <div
                      className={`relative group ${
                        viewMode === "grid"
                          ? "w-full h-48"
                          : "w-32 h-32 flex-shrink-0"
                      }`}
                    >
                      <img
                        src={
                          property.coverImageUrl ??
                          property.images?.[0]?.url ??
                          (property.images?.[0] as any) ??
                          "/placeholder.png"
                        }
                        alt={property.title}
                        className="w-full h-full object-cover cursor-pointer group-hover:opacity-90 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          const images = Array.isArray(property.images)
                            ? property.images
                                .map((img) =>
                                  typeof img === "string"
                                    ? img
                                    : (img as any)?.url,
                                )
                                .filter(Boolean)
                            : [];
                          if (images.length > 0) {
                            setSelectedPropertyForZoom(property);
                            setImageModalOpen(true);
                          }
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.png";
                        }}
                      />
                      <Watermark
                        variant="badge"
                        small
                        text="ashishproperties.in"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const images = Array.isArray(property.images)
                            ? property.images
                                .map((img) =>
                                  typeof img === "string"
                                    ? img
                                    : (img as any)?.url,
                                )
                                .filter(Boolean)
                            : [];
                          if (images.length > 0) {
                            setSelectedPropertyForZoom(property);
                            setImageModalOpen(true);
                          }
                        }}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition z-10"
                        aria-label="Zoom image"
                        title="Click to zoom"
                      >
                        <ZoomIn className="h-3.5 w-3.5 text-gray-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: favorites toggle
                        }}
                        className="absolute top-2 right-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white opacity-0 group-hover:opacity-100 transition z-10"
                        aria-label="Save"
                      >
                        <Heart className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                    </div>

                    <div
                      className={`p-4 ${viewMode === "grid" ? "flex-1" : ""}`}
                    >
                      <div
                        className={`${
                          viewMode === "grid"
                            ? "mb-2"
                            : "flex justify-between items-start mb-2"
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900 leading-tight">
                          {property.title}
                        </h3>
                        <span
                          className={`text-lg font-bold text-[#C70000] ${
                            viewMode === "list" ? "ml-2" : ""
                          }`}
                        >
                          ₹{property.price?.toLocaleString() || "0"}
                          {property.priceType === "rent" && "/month"}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-500 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {property.location?.address ||
                            "Location not available"}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-500 mb-3 text-sm">
                        {property.specifications?.bedrooms && (
                          <span className="mr-4">
                            {property.specifications.bedrooms} BHK
                          </span>
                        )}
                        {property.specifications?.bathrooms && (
                          <span className="mr-4">
                            {property.specifications.bathrooms} Bath
                          </span>
                        )}
                        <span>{property.specifications?.area || 0} sq ft</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {property.contactInfo?.name || "Owner"}
                        </span>
                        <Button
                          size="sm"
                          className="bg-[#C70000] hover:bg-[#A60000] text-white"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNavigation />

      {/* Image Zoom Modal */}
      {selectedPropertyForZoom && (
        <ImageModal
          isOpen={imageModalOpen}
          onClose={() => {
            setImageModalOpen(false);
            setSelectedPropertyForZoom(null);
          }}
          images={
            Array.isArray(selectedPropertyForZoom.images)
              ? selectedPropertyForZoom.images
                  .map((img) =>
                    typeof img === "string" ? img : (img as any)?.url,
                  )
                  .filter(Boolean)
              : []
          }
          title={selectedPropertyForZoom.title}
        />
      )}
    </div>
  );
}
