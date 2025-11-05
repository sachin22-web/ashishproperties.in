import { useState, useEffect } from "react";
import {
  Home,
  Building2,
  MapPin,
  Building,
  Users,
  Layers,
  TreePine,
  Store,
  Warehouse,
  Car,
} from "lucide-react";

const iconMap: Record<string, any> = {
  "🏠": Home,
  "🏢": Building2,
  "🏞️": MapPin,
  "🏘️": Building,
  "🏨": Users,
  "🌾": TreePine,
  "🏪": Store,
  "🏭": Warehouse,
};

interface Category {
  _id?: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: any[];
  order: number;
  active: boolean;
}

export default function CategoriesGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = () => fetchCategories();
    fetchCategories();
    window.addEventListener('categories:updated', handler);
    return () => window.removeEventListener('categories:updated', handler);
  }, []);

  const fetchCategories = async () => {
    try {
      // Prefer public endpoint with active=true
      let response = await fetch("/api/categories?active=true");
      let data: any;
      try {
        data = await response.json();
      } catch {
        data = { success: false };
      }

      if (!response.ok || !data?.success) {
        // Fallback to admin endpoint and filter active
        const adminRes = await fetch("/api/admin/categories");
        const adminData = await adminRes.json().catch(() => ({ success: false, data: [] }));
        if (adminData?.success) {
          const mapped = (adminData.data || [])
            .filter((c: any) => c.isActive === true || c.active === true)
            .map((c: any) => ({
              ...c,
              order: c.sortOrder ?? c.order ?? 0,
              icon: c.icon || c.iconUrl || "",
              active: c.isActive ?? c.active ?? true,
            }));
          const sorted = mapped.sort((a: any, b: any) => (a.order - b.order) || a.name.localeCompare(b.name));
          setCategories(sorted.slice(0, 10));
          return;
        }
      }

      if (data?.success) {
        const mapped = (data.data || []).map((c: any) => ({
          ...c,
          order: c.sortOrder ?? c.order ?? 0,
          icon: c.icon || c.iconUrl || "",
          active: c.isActive ?? c.active ?? true,
        }));
        const sorted = mapped.sort((a: any, b: any) => (a.order - b.order) || a.name.localeCompare(b.name));
        setCategories(sorted.slice(0, 10));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    window.location.href = `/categories/${category.slug}`;
  };

  // Split categories into rows of 5
  const categoryRows = [];
  for (let i = 0; i < categories.length; i += 5) {
    categoryRows.push(categories.slice(i, i + 5));
  }

  if (loading) {
    return (
      <section className="bg-[#C70000] py-6">
        <div className="px-4">
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-2 animate-pulse"></div>
                <div className="w-16 h-3 bg-white bg-opacity-20 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#C70000] py-6">
      <div className="px-4">
        {categoryRows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-4 mb-6 last:mb-0">
            {row.map((category) => {
              const IconComponent = iconMap[category.icon] || Building2;
              return (
                <div
                  key={category._id || category.slug}
                  onClick={() => handleCategoryClick(category)}
                  className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-2">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white text-xs text-center font-medium leading-tight">
                    {category.name}
                  </span>
                </div>
              );
            })}
            {/* Fill empty spots in last row */}
            {rowIndex === categoryRows.length - 1 &&
              row.length < 5 &&
              [...Array(5 - row.length)].map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center">
                  <div className="w-12 h-12"></div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
