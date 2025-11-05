import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Advertisement {
  _id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  position: string;
  active: boolean;
}

const SLIDE_INTERVAL = 4000;
const SWIPE_THRESHOLD_RATIO = 0.18; // ~18%
const SETTLE_MS = 320;

const PropertyAdsSlider: React.FC = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  // slide state with ref (so pointer handlers read fresh value)
  const [currentSlide, _setCurrentSlide] = useState(0);
  const currentSlideRef = useRef(0);
  const setCurrentSlide = (n: number | ((p: number) => number)) => {
    const val = typeof n === "function" ? (n as any)(currentSlideRef.current) : n;
    currentSlideRef.current = val;
    _setCurrentSlide(val);
  };

  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const dxRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastClickSuppressedRef = useRef(false);

  const transitionEnabledRef = useRef(true);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const slides = useMemo(
    () => ads.map((ad) => ({ type: "ad" as const, data: ad })),
    [ads]
  );

  // fetch banners
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const adsRes = await (window as any).api("/banners?active=true", { timeout: 7000 });
        if (adsRes?.ok && adsRes.json?.success && Array.isArray(adsRes.json.data)) {
          const mapped: Advertisement[] = adsRes.json.data.map((b: any) => ({
            _id: b._id || Math.random().toString(36).slice(2),
            title: b.title,
            description: b.description || "",
            image: b.imageUrl || b.image,
            link: b.link,
            position: b.position || "homepage_middle",
            active: b.isActive !== false,
          }));
          setAds(mapped.filter((m) => !!m.image));
        } else {
          setAds([]);
        }
      } catch (e) {
        console.warn("ads fetch fail:", e);
        setAds([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // helpers
  const width = () => wrapRef.current?.getBoundingClientRect().width || 1;
  const applyTransform = (offsetPercent: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${offsetPercent}%,0,0)`;
  };
  const syncToSlide = () => {
    const el = trackRef.current;
    if (!el) return;
    if (!transitionEnabledRef.current) {
      el.style.transition = `transform ${SETTLE_MS}ms ease`;
      transitionEnabledRef.current = true;
    }
    applyTransform(-currentSlideRef.current * 100);
  };

  // autoplay controls (no play/pause UI)
  const clearAutoplay = () => {
    if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    autoplayTimerRef.current = null;
  };
  const startAutoplay = () => {
    clearAutoplay();
    if (slides.length <= 1) return;
    if (draggingRef.current) return;
    if (document.visibilityState !== "visible") return;
    autoplayTimerRef.current = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % slides.length);
    }, SLIDE_INTERVAL);
  };

  useEffect(() => {
    startAutoplay();
    return clearAutoplay;
  }, [slides.length]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") startAutoplay();
      else clearAutoplay();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // pointer logic (mounted once per slide-count)
  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    track.style.willChange = "transform";

    const setNoTransition = () => {
      if (transitionEnabledRef.current) {
        track.style.transition = "none";
        transitionEnabledRef.current = false;
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      draggingRef.current = true;
      startXRef.current = e.clientX;
      dxRef.current = 0;
      lastClickSuppressedRef.current = false;
      clearAutoplay();
      setNoTransition();
      wrap.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      e.cancelable && e.preventDefault(); // avoid UA horizontal scroll conflicts
      dxRef.current = e.clientX - startXRef.current;

      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const w = width();

          // ✅ FIX: natural drag direction (right drag => previous slide visible, left drag => next slide)
          const offsetPct = -currentSlideRef.current * 100 + (dxRef.current / w) * 100; // <-- was * -100

          applyTransform(offsetPct);
        });
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      wrap.releasePointerCapture(e.pointerId);

      const w = width();
      const ratio = Math.abs(dxRef.current) / w;
      const dir = dxRef.current < 0 ? 1 : -1; // left swipe => next, right swipe => prev

      if (Math.abs(dxRef.current) > 8) lastClickSuppressedRef.current = true;

      if (ratio > SWIPE_THRESHOLD_RATIO) {
        const max = slides.length - 1;
        const target = Math.max(0, Math.min(max, currentSlideRef.current + dir));
        setCurrentSlide(target);
      }
      syncToSlide();
      startAutoplay(); // resume
    };

    // initial align
    syncToSlide();

    wrap.addEventListener("pointerdown", onDown, { passive: true });
    wrap.addEventListener("pointermove", onMove, { passive: false });
    wrap.addEventListener("pointerup", onUp, { passive: true });
    wrap.addEventListener("pointercancel", onUp, { passive: true });

    return () => {
      wrap.removeEventListener("pointerdown", onDown as any);
      wrap.removeEventListener("pointermove", onMove as any);
      wrap.removeEventListener("pointerup", onUp as any);
      wrap.removeEventListener("pointercancel", onUp as any);
    };
  }, [slides.length]);

  // keep position in sync when slide changes by arrows/autoplay
  useEffect(() => {
    syncToSlide();
  }, [currentSlide]);

  const next = () => slides.length > 1 && setCurrentSlide((p) => (p + 1) % slides.length);
  const prev = () => slides.length > 1 && setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);

  const handleBannerClick = (ad: Advertisement) => {
    if (lastClickSuppressedRef.current) return; // ignore click after drag
    if (ad.link) window.open(ad.link, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
          <div className="w-full h-48 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }
  if (slides.length === 0) return null;

  return (
    <div className="px-4 py-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Sponsored Banners</h2>
        </div>

        {/* MAIN CAROUSEL */}
        <div className="relative">
          <div
            ref={wrapRef}
            className="overflow-hidden rounded-lg touch-pan-y select-none"
            style={{ WebkitUserSelect: "none", userSelect: "none" }}
          >
            <div
              ref={trackRef}
              className="flex"
              style={{ transform: `translate3d(-${currentSlide * 100}%,0,0)` }}
            >
              {slides.map(({ data: ad }, index) => {
                const mainUrl = ad.image || "/placeholder.svg";
                const title = ad.title || "Advertisement";
                return (
                  <div key={`${ad._id}-${index}`} className="w-full flex-shrink-0">
                    <div
                      onClick={() => handleBannerClick(ad)}
                      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <div className="relative h-64">
                        <img
                          src={mainUrl}
                          alt={title}
                          draggable={false}
                          className="w-full h-full object-cover pointer-events-none select-none"
                          onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.svg")}
                        />
                        <div className="absolute top-4 right-4">
                          <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium">Ad</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                        <div className="absolute left-4 bottom-4 text-white">
                          <h3 className="text-lg font-semibold drop-shadow">{title}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {slides.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyAdsSlider;
