import React, { useEffect, useState, useRef } from "react";
import { BannerAd } from "@shared/types";

interface HomepageBannerProps {
  position: "homepage_top" | "homepage_middle" | "homepage_bottom";
  className?: string;
  intervalMs?: number; // optional: default 4000ms
}

export default function HomepageBanner({
  position,
  className = "",
  intervalMs = 4000,
}: HomepageBannerProps) {
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);

  // Fetch banners for this position
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const apiRes = await (window as any).api(
          `/banners?active=true&position=${encodeURIComponent(position)}&status=approved&isFeatured=true`,
          { timeout: 8000 }
        );

        if (apiRes?.ok && apiRes.json?.success && Array.isArray(apiRes.json.data)) {
          // only this position; keep items that have an image
          // filter for approved & featured (server-side filtered, but double-check client-side)
          const list = (apiRes.json.data as BannerAd[])
            .filter((b: any) => (b as any).position === position)
            .filter((b: any) => (b as any).imageUrl || (b as any).image)
            .filter((b: any) => (b as any).status === "approved" || !(b as any).status)
            .filter((b: any) => (b as any).isFeatured === true || (b as any).isFeatured === undefined);

          if (mounted) {
            setBanners(list);
            setIdx(0);
          }
        } else if (mounted) {
          setBanners([]);
        }
      } catch {
        if (mounted) setBanners([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [position]);

  // Auto-slide
  useEffect(() => {
    if (paused || banners.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIdx((p) => (p + 1) % banners.length);
    }, Math.max(1500, intervalMs));
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [banners.length, paused, intervalMs]);

  const current = banners[idx];

  const handleClick = () => {
    if (current?.link) {
      window.open(current.link, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 rounded-lg h-24 md:h-32" />
      </div>
    );
  }
  if (!banners.length) return null;

  return (
    <div
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300"
        role={current?.link ? "button" : "img"}
        aria-label={current?.title || "Banner"}
        onClick={handleClick}
        style={{ height: "auto" }}
      >
        {/* Slides stacked (fade transition) */}
        <div className="relative w-full h-24 md:h-32">
          {banners.map((b, i) => {
            const src = (b as any).imageUrl || (b as any).image || "";
            const active = i === idx;
            return (
              <img
                key={(b as any)._id || i}
                src={src}
                alt={b.title || "Banner"}
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-700 ${
                  active ? "opacity-100" : "opacity-0"
                }`}
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.src = `https://via.placeholder.com/1200x320/f97316/ffffff?text=${encodeURIComponent(
                    b.title || "Banner"
                  )}`;
                }}
              />
            );
          })}

          {/* gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 to-transparent rounded-xl" />
        </div>

        {/* 'Ad' tag indicator */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-md font-medium">
          Ad
        </div>

        {/* Title + CTA chevron */}
        <div className="absolute inset-0 flex items-center justify-between p-4">
          <div className="text-white">
            <h3 className="text-sm md:text-lg font-bold leading-tight line-clamp-2">
              {current?.title}
            </h3>
          </div>
          {current?.link && (
            <div className="text-white/80">
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Dots hidden intentionally (desktop + mobile) */}
        {false && banners.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                }}
                aria-label={`Go to banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-5 bg-white" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-gray-500 mt-1 text-center">Banner: {position}</div>
      )}
    </div>
  );
}
