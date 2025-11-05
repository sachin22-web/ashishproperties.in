import React, { useState, useEffect } from "react";
import {
  X,
  ChevronDown,
  ChevronRight,
  Home,
  Briefcase,
  Grid3X3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Subcategory {
  _id?: string;
  name: string;
  slug: string;
  categoryId?: string;
  active: boolean;
  order: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  type: "property" | "service";
  icon: string;
  description?: string;
  subcategories: Subcategory[];
  order: number;
  active: boolean;
}

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryDrawer: React.FC<CategoryDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [selectedTab, setSelectedTab] = useState<"property" | "service">(
    "property",
  );

  // Fetch categories when drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const allCategories: Category[] = [];

      // Fetch property categories with subcategories (new API)
      const propRes = await fetch("/api/categories?active=true&withSub=true");
      if (propRes.ok) {
        const propJson = await propRes.json();
        if (propJson.success && Array.isArray(propJson.data)) {
          const mappedProps: Category[] = propJson.data.map((c: any) => ({
            _id: c._id,
            name: c.name,
            slug: c.slug,
            type: "property",
            icon: c.iconUrl || "",
            description: c.description || "",
            order: c.sortOrder ?? 999,
            active: !!c.isActive,
            subcategories: Array.isArray(c.subcategories)
              ? c.subcategories.map((s: any) => ({
                  _id: s._id,
                  name: s.name,
                  slug: s.slug,
                  categoryId: s.categoryId,
                  active: !!s.isActive,
                  order: s.sortOrder ?? 999,
                }))
              : [],
          }));
          allCategories.push(...mappedProps);
        }
      }

      // Fetch service categories (Other Services) and their subcategories
      const osCatsRes = await fetch("/api/os/categories?active=1");
      if (osCatsRes.ok) {
        const osCatsJson = await osCatsRes.json();
        if (osCatsJson.success && Array.isArray(osCatsJson.data)) {
          const osCategories = osCatsJson.data as any[];
          // Load subcategories per OS category
          const osWithSubs = await Promise.all(
            osCategories.map(async (cat: any, idx: number) => {
              let subcats: any[] = [];
              try {
                const subsRes = await fetch(
                  `/api/os/subcategories?active=1&cat=${encodeURIComponent(cat.slug)}`,
                );
                if (subsRes.ok) {
                  const subsJson = await subsRes.json();
                  if (subsJson.success && Array.isArray(subsJson.data)) {
                    subcats = subsJson.data;
                  }
                }
              } catch {}
              const mapped: Category = {
                _id: cat._id || cat.slug,
                name: cat.name,
                slug: cat.slug,
                type: "service",
                icon: "🔧",
                description: "",
                order: (idx + 1) * 1000, // place services after properties
                active: !!cat.active,
                subcategories: subcats.map((s: any, i: number) => ({
                  _id: s._id || s.slug,
                  name: s.name,
                  slug: s.slug,
                  active: !!s.active,
                  order: (i + 1) * 10,
                })),
              };
              return mapped;
            }),
          );
          allCategories.push(...osWithSubs);
        }
      }

      // Sort by order then by name
      allCategories.sort((a, b) => {
        if ((a.order ?? 999) !== (b.order ?? 999))
          return (a.order ?? 999) - (b.order ?? 999);
        return a.name.localeCompare(b.name);
      });

      setCategories(allCategories);
      console.log("✅ Fetched categories:", allCategories.length);
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    if (category.subcategories && category.subcategories.length > 0) {
      // Toggle expansion if has subcategories
      setExpandedCategories((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(category._id)) {
          newSet.delete(category._id);
        } else {
          newSet.add(category._id);
        }
        return newSet;
      });
    } else {
      // Navigate to category page
      handleNavigation(category);
    }
  };

  const handleSubcategoryClick = (
    category: Category,
    subcategory: Subcategory,
  ) => {
    handleNavigation(category, subcategory);
  };

  const handleNavigation = (category: Category, subcategory?: Subcategory) => {
    let path = "";

    if (category.type === "property") {
      if (subcategory) {
        // Navigate to subcategory page
        path = `/categories/${category.slug}/${subcategory.slug}`;
      } else {
        // Navigate to category page
        path = `/categories/${category.slug}`;
      }
    } else if (category.type === "service") {
      if (subcategory) {
        path = `/services/${category.slug}/${subcategory.slug}`;
      } else {
        path = `/services/${category.slug}`;
      }
    }

    if (path) {
      navigate(path);
      onClose(); // Close drawer after navigation
    }
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === selectedTab,
  );

  const getCategoryIcon = (category: Category) => {
    if (category.type === "service") {
      return <Briefcase className="w-5 h-5" />;
    }

    // Property category icons
    switch (category.slug) {
      case "residential":
      case "flat":
      case "pg":
        return <Home className="w-5 h-5" />;
      case "commercial":
      case "showroom":
      case "industrial-property":
        return <Briefcase className="w-5 h-5" />;
      default:
        return <Grid3X3 className="w-5 h-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative bg-white w-full max-w-md ml-auto h-full shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-[#C70000] text-white">
          <h2 className="text-lg font-semibold">Categories</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close categories"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setSelectedTab("property")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              selectedTab === "property"
                ? "text-[#C70000] border-b-2 border-[#C70000] bg-red-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Home className="w-4 h-4 inline mr-2" />
            Properties
          </button>
          <button
            onClick={() => setSelectedTab("service")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              selectedTab === "service"
                ? "text-[#C70000] border-b-2 border-[#C70000] bg-red-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Briefcase className="w-4 h-4 inline mr-2" />
            Services
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Grid3X3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No {selectedTab} categories found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCategories.map((category) => (
                    <div key={category._id} data-testid="footer-cat-item">
                      {/* Main Category */}
                      <button
                        onClick={() => handleCategoryClick(category)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-[#C70000]">
                            {getCategoryIcon(category)}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 capitalize">
                              {category.name}
                            </h3>
                            {category.description && (
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {category.subcategories &&
                          category.subcategories.length > 0 && (
                            <div className="text-gray-400">
                              {expandedCategories.has(category._id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </div>
                          )}
                      </button>

                      {/* Subcategories */}
                      {expandedCategories.has(category._id) &&
                        category.subcategories &&
                        category.subcategories.length > 0 && (
                          <div className="ml-8 space-y-1 pb-2">
                            {category.subcategories
                              .filter((sub) => sub.active)
                              .sort(
                                (a, b) =>
                                  a.order - b.order ||
                                  a.name.localeCompare(b.name),
                              )
                              .map((subcategory) => (
                                <button
                                  key={subcategory._id || subcategory.slug}
                                  onClick={() =>
                                    handleSubcategoryClick(
                                      category,
                                      subcategory,
                                    )
                                  }
                                  data-testid="footer-cat-item"
                                  className="block w-full text-left p-2 rounded text-sm text-gray-600 hover:text-[#C70000] hover:bg-red-50 transition-colors capitalize"
                                >
                                  {subcategory.name}
                                </button>
                              ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Browse all {selectedTab} categories
            </p>
            <button
              onClick={() => {
                navigate(
                  selectedTab === "property" ? "/categories" : "/services",
                );
                onClose();
              }}
              className="mt-2 text-sm text-[#C70000] font-medium hover:underline"
            >
              View All Categories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDrawer;
