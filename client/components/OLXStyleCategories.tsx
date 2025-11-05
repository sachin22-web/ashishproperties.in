import React, { useEffect, useState } from "react";
import {
  Car,
  Building2,
  Smartphone,
  Briefcase,
  Shirt,
  Bike,
  Tv,
  Truck,
  Sofa,
  Heart,
} from "lucide-react";
import { withApiErrorBoundary } from "./ApiErrorBoundary";
import { useNavigate } from "react-router-dom";

/* ---------- Icons map (fallback to Building2) ---------- */
const categoryIcons: Record<string, any> = {
  Cars: Car,
  Properties: Building2,
  Mobiles: Smartphone,
  Jobs: Briefcase,
  Fashion: Shirt,
  Bikes: Bike,
  "Electronics & Appliances": Tv,
  "Commercial Vehicles & Spares": Truck,
  Furniture: Sofa,
  Pets: Heart,
};

/* ---------- Types ---------- */
interface Category {
  _id?: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  subcategories?: any[];
  order?: number;
  active?: boolean;
}

interface HomepageSlider {
  _id: string;
  title: string;
  subtitle: string;
  icon: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  order: number;
}

/* ---------- Helpers ---------- */
const norm = (v?: string) =>
  (v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

const isMatch = (cat: Category, ...candidates: string[]) => {
  const n = norm(cat.slug) || norm(cat.name);
  return candidates.map(norm).includes(n);
};

/** Special routes for specific category names/slugs */
const ROUTE_OVERRIDES: Record<string, string> = {
  // exact landing you wanted:
  "new-projects": "/new-projects",
  maps: "/maps",

  // common property flows (edit as per your app)
  buy: "/buy",
  sale: "/sale",
  sell: "/post-property", // action-ish
  rent: "/rent",
  lease: "/lease",
  pg: "/pg",

  // examples
  "other-services": "/other-services/other-services",
  commercial: "/commercial",
};

/* ---------- Component ---------- */
function OLXStyleCategories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [sliders, setSliders] = useState<HomepageSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<Category | null>(null);
  const [activeSubcats, setActiveSubcats] = useState<any[]>([]);

  // Defaults (safe fallback)
  const defaultCategories: Category[] = [
    { name: "Sell", slug: "sell" },
    { name: "Buy", slug: "buy" },
    { name: "Other Services", slug: "other-services" },
    { name: "Rent", slug: "rent" },
    { name: "New Projects", slug: "new-projects" },
    { name: "Maps", slug: "maps" },
    { name: "Commercial Properties", slug: "commercial" },
    { name: "Cars", slug: "cars" },
    { name: "Mobiles", slug: "mobiles" },
    { name: "Jobs", slug: "jobs" },
    { name: "Furniture", slug: "furniture" },
  ];

  useEffect(() => {
    (async () => {
      setSliders([]);
      setCategories(defaultCategories); // instant UI

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const apiRes = await (window as any).api?.("/categories?active=true");
        clearTimeout(timeout);

        if (
          apiRes?.ok &&
          apiRes.json?.success &&
          Array.isArray(apiRes.json.data) &&
          apiRes.json.data.length
        ) {
          let list = apiRes.json.data.slice(0, 10);
          const hasMaps = list.some(
            (c: any) => norm(c.slug) === "maps" || norm(c.name) === "maps",
          );
          if (!hasMaps)
            list = [{ name: "Maps", slug: "maps" }, ...list].slice(0, 10);
          setCategories(list);
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- Click handling with overrides ---------- */
  const handleCategoryClick = (category: Category) => {
    const key = norm(category.slug) || norm(category.name);

    // 1) Hard override routes (includes "new-projects" -> "/new-projects")
    if (key && ROUTE_OVERRIDES[key]) {
      navigate(ROUTE_OVERRIDES[key]);
      return;
    }

    // 2) Property pages quick-map (if API sends these names)
    if (isMatch(category, "buy", "sale", "rent", "lease", "pg")) {
      navigate(`/${norm(category.slug)}`);
      return;
    }

    // 3) Fallback generic category page
    const finalSlug = norm(category.slug) || norm(category.name) || "category";
    navigate(`/categories/${finalSlug}`);
  };

  const handleSellClick = () => navigate("/post-property");

  /* ---------- Loading skeleton ---------- */
  if (loading) {
    return (
      <div className="bg-white">
        <div className="mx-4 mt-4 mb-6">
          <div className="bg-blue-100 rounded-lg h-20 animate-pulse" />
        </div>
        <div className="px-4 pb-6">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-gray-200 rounded-lg animate-pulse mb-2" />
                <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="bg-white">
      {/* (Optional) sliders kept off unless you enable them */}
      {sliders.length > 0 && (
        <div className="mx-4 mt-4 mb-6">
          <div className="space-y-3">
            {sliders.map((slider) => (
              <div
                key={slider._id}
                className={`bg-gradient-to-r ${slider.backgroundColor} rounded-lg p-4 ${slider.textColor} relative overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{slider.title}</h3>
                    <p className="text-sm opacity-90">{slider.subtitle}</p>
                  </div>
                  <div className="text-3xl">{slider.icon}</div>
                </div>
                <div className="absolute -right-2 -top-2 w-16 h-16 bg-white/10 rounded-full" />
                <div className="absolute -right-6 -bottom-2 w-12 h-12 bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="px-4 pb-4 mt-6 md:mt-8 lg:mt-10">
        <div className="grid grid-cols-5 gap-3">
          {(categories || []).slice(0, 10).map((category, index) => {
            if (!category?.name) return null;

            const IconComponent = categoryIcons[category.name] || Building2;
            const isActive = activeCat?.slug === category.slug;

            return (
              <div
                key={category._id || category.slug || index}
                onClick={() => {
                  setActiveCat(category);
                  handleCategoryClick(category);
                }}
                className={`flex flex-col items-center cursor-pointer active:scale-95 transition-transform ${
                  isActive ? "opacity-100" : "opacity-90"
                }`}
              >
                <div
                  className={`w-14 h-14 ${
                    isActive ? "bg-red-100" : "bg-red-50"
                  } border border-red-100 rounded-lg flex items-center justify-center mb-2 hover:bg-red-100 transition-colors`}
                >
                  <IconComponent className="h-7 w-7 text-[#C70000]" />
                </div>
                <span className="text-xs text-gray-800 text-center font-medium leading-tight">
                  {category.name.length > 12
                    ? `${category.name.substring(0, 12)}...`
                    : category.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subcategories panel (optional; needs API data) */}
      {activeCat && (
        <div className="px-4 pb-12">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                {activeCat.name} Subcategories
              </h3>
              <button
                className="text-sm text-[#C70000] hover:underline"
                onClick={() =>
                  navigate(
                    `/categories/${norm(activeCat.slug) || norm(activeCat.name)}`,
                  )
                }
              >
                View All
              </button>
            </div>

            {activeSubcats.length === 0 ? (
              <div className="text-sm text-gray-500">
                No subcategories found
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeSubcats.map((sub: any) => (
                  <button
                    key={sub._id || sub.slug}
                    onClick={() =>
                      navigate(
                        `/categories/${
                          norm(activeCat.slug) || norm(activeCat.name)
                        }/${norm(sub.slug) || norm(sub.name)}`,
                      )
                    }
                    className="text-left group border border-gray-200 rounded-md p-3 hover:border-red-300 hover:shadow-sm transition"
                  >
                    <div className="text-gray-900 text-sm font-medium group-hover:text-[#C70000] truncate">
                      {sub.name || sub.title || sub.slug}
                    </div>
                    {sub.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {sub.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default withApiErrorBoundary(OLXStyleCategories);
