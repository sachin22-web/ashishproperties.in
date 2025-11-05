import React, { useEffect, useState, useCallback } from "react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import useEmblaCarousel from "embla-carousel-react";

interface Banner {
  _id?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
}

export default function NewProjects() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, skipSnaps: false });

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/new-projects/banners", { cache: "no-store" });
      const data = await res.json();
      if (data && data.success) {
        const active = (data.data || []).filter((b: any) => b.isActive);
        setBanners(active);
      }
    } catch (e) {
      console.warn("Failed to load new project banners:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();

    const onUpdate = () => {
      fetchBanners();
    };

    window.addEventListener("newProjectsUpdated", onUpdate);

    // Poll as fallback every 15s when visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchBanners();
    }, 15000);

    return () => {
      window.removeEventListener("newProjectsUpdated", onUpdate);
      clearInterval(interval);
    };
  }, [fetchBanners]);

  useEffect(() => {
    // Re-init embla when banners change
    if (emblaApi) {
      try { emblaApi.reInit(); } catch (e) {}
    }
  }, [banners, emblaApi]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading new projects...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">New Projects</h1>

        {banners.length > 0 ? (
          <div className="embla overflow-hidden rounded-lg">
            <div className="embla__viewport" ref={emblaRef}>
              <div className="embla__container flex">
                {banners.map((b) => (
                  <div key={b._id} className="embla__slide min-w-full">
                    <a href={b.link} className="block w-full">
                      <div className="relative w-full h-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute left-4 bottom-4 bg-black bg-opacity-40 text-white p-3 rounded">
                          <h3 className="text-lg font-semibold">{b.title}</h3>
                          {b.subtitle && <p className="text-sm">{b.subtitle}</p>}
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">No banners to display.</div>
        )}

        {/* Projects list placeholder (could fetch projects listing) */}
        <section className="mt-8">
          <p className="text-gray-700">Explore upcoming and ongoing projects below.</p>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
