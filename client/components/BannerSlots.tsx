import { useState, useEffect } from "react";
import { BannerAd } from "@shared/types";
import { ExternalLink } from "lucide-react";

interface BannerSlotsProps {
  position:
    | "homepage_top"
    | "homepage_middle"
    | "homepage_bottom"
    | "property_top"
    | "property_sidebar";
  className?: string;
}

export default function BannerSlots({
  position,
  className = "",
}: BannerSlotsProps) {
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, [position]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/banners?active=true`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setBanners(data.data);
      } else {
        setBanners([]);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = (banner: BannerAd) => {
    if (banner.link) {
      window.open(banner.link, "_blank");
    }
  };

  if (loading || banners.length === 0) {
    return null;
  }

  const getContainerClass = () => {
    switch (position) {
      case "homepage_top":
        return "w-full h-48 md:h-64";
      case "homepage_middle":
        return "w-full h-32 md:h-40";
      case "homepage_bottom":
        return "w-full h-24 md:h-32";
      case "property_top":
        return "w-full h-32 md:h-40";
      case "property_sidebar":
        return "w-full h-40 md:h-48";
      default:
        return "w-full h-32";
    }
  };

  return (
    <div className={`banner-slots ${className}`}>
      {banners.map((banner, index) => (
        <div
          key={banner._id}
          className={`relative overflow-hidden rounded-lg shadow-sm ${getContainerClass()} ${
            index > 0 ? "mt-4" : ""
          }`}
        >
          <img
            src={(banner as any).imageUrl || (banner as any).image}
            alt={banner.title}
            className="w-full h-full object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-center p-4 md:p-6">
            <h3 className="text-white text-lg md:text-xl font-bold mb-2 drop-shadow-lg">
              {banner.title}
            </h3>
            {false && (
              <p className="text-white text-sm md:text-base drop-shadow-lg opacity-90"></p>
            )}

            {banner.link && (
              <button
                onClick={() => handleBannerClick(banner)}
                className="inline-flex items-center mt-4 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors w-fit"
              >
                Learn More
                <ExternalLink className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>

          {/* Click overlay for tracking */}
          {banner.link && (
            <div
              onClick={() => handleBannerClick(banner)}
              className="absolute inset-0 cursor-pointer"
              title={banner.title}
            />
          )}
        </div>
      ))}
    </div>
  );
}
