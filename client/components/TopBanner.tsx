import { useEffect, useState } from "react";
import { BannerAd } from "@shared/types";

export default function TopBanner() {
  const [banner, setBanner] = useState<BannerAd | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setLoading(true);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch("/api/banners?active=true", { signal: controller.signal, cache: "no-cache" });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length) {
            // Highest priority first (sorted on server by sortOrder asc)
            setBanner(data.data[0]);
          } else {
            setBanner(null);
          }
        } else {
          setBanner(null);
        }
      } catch (e) {
        setBanner(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, []);

  if (loading || !banner) return null;

  return (
    <div className="w-full">
      <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 overflow-hidden rounded-none">
        <img
          src={(banner as any).imageUrl || (banner as any).image}
          alt={banner.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&h=500&fit=crop&q=80";
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-3xl">
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold drop-shadow">
              {banner.title}
            </h2>
            {banner.link && (
              <div className="mt-4">
                <button
                  className="bg-[#C70000] hover:bg-[#A60000] text-white px-5 py-2 rounded-lg font-semibold"
                  onClick={() => {
                    if (banner.link.startsWith("http")) {
                      window.open(banner.link, "_blank", "noopener,noreferrer");
                    } else {
                      window.location.href = banner.link;
                    }
                  }}
                >
                  Learn More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
