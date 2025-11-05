import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";

interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  iconUrl?: string;
}

export default function PublicCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<Subcategory[]>([]);
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await apiRequest(`categories/${slug}/subcategories`, {
        method: "GET",
      });
      const list: any[] = (res?.data?.data || []) as any[];
      setSubs(Array.isArray(list) ? list : []);
      setName(slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onUpdate = () => fetchData();
    window.addEventListener("subcategories:updated", onUpdate);
    fetchData();
    return () => window.removeEventListener("subcategories:updated", onUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const onClick = (sub: Subcategory) => {
    navigate(`/category/${slug}/${sub.slug}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{name}</h1>
      {loading ? (
        <div>Loading...</div>
      ) : subs.length === 0 ? (
        <div className="text-gray-600">No subcategories yet</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {subs.map((s) => (
            <button
              key={s._id || s.slug}
              className="border rounded-lg p-4 text-left hover:bg-gray-50"
              onClick={() => onClick(s)}
              aria-label={`Open ${s.name}`}
            >
              <div className="text-2xl mb-2">
                {s.iconUrl ? (
                  <img
                    src={s.iconUrl}
                    alt=""
                    className="w-8 h-8 inline-block"
                  />
                ) : (
                  "🏷️"
                )}
              </div>
              <div className="font-medium">{s.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
