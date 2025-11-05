import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";

interface AreaMapItem {
  _id?: string;
  title?: string;
  area?: string;
  description?: string;
  imageUrl: string;
}

export default function Maps() {
  const [items, setItems] = useState<AreaMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeArea, setActiveArea] = useState<string>("");

  // Lightbox / Modal state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number>(0);

  // Zoom/Pan state (only for the lightbox image)
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lastOffset, setLastOffset] = useState({ x: 0, y: 0 });
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const baseDistanceRef = useRef<number | null>(null);
  const baseScaleRef = useRef<number>(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const lastTapRef = useRef<number>(0);

  const resetTransform = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setLastOffset({ x: 0, y: 0 });
    baseDistanceRef.current = null;
    baseScaleRef.current = 1;
    pointersRef.current.clear();
  }, []);

  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

  const openViewer = useCallback((idx: number) => {
    setViewerIndex(idx);
    setViewerOpen(true);
    // reset any previous transforms
    resetTransform();
  }, [resetTransform]);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    resetTransform();
  }, [resetTransform]);

  const prevImage = useCallback(() => {
    setViewerIndex((i) => (i - 1 + items.length) % items.length);
    resetTransform();
  }, [items.length, resetTransform]);

  const nextImage = useCallback(() => {
    setViewerIndex((i) => (i + 1) % items.length);
    resetTransform();
  }, [items.length, resetTransform]);

  // Lock body scroll when modal open + keyboard shortcuts
  useEffect(() => {
    if (viewerOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeViewer();
        if (e.key === "ArrowLeft") prevImage();
        if (e.key === "ArrowRight") nextImage();
      };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = original;
        window.removeEventListener("keydown", onKey);
      };
    }
  }, [viewerOpen, closeViewer, prevImage, nextImage]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const q = activeArea ? `?area=${encodeURIComponent(activeArea)}` : "";
      const res = await fetch(`/api/maps${q}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data?.success === false)
        throw new Error(data?.error || "Failed to load maps");
      setItems(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const onUpdate = () => fetchItems();
    window.addEventListener("areaMapsUpdated", onUpdate);
    return () => window.removeEventListener("areaMapsUpdated", onUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeArea]);

  const areas = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.area) set.add(i.area);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  // Safety: clamp viewerIndex if filter changes
  useEffect(() => {
    if (viewerIndex >= items.length) setViewerIndex(0);
  }, [items.length, viewerIndex]);

  // ---------- Gesture helpers ----------
  function getTwoPointerDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const el = containerRef.current;
    if (!el) return;
    el.setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Double-tap / double-click zoom toggle
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // toggle between 1 and 2
      const newScale = scale > 1 ? 1 : 2;
      setScale(newScale);
      setOffset({ x: 0, y: 0 });
      setLastOffset({ x: 0, y: 0 });
      baseScaleRef.current = newScale;
      baseDistanceRef.current = null;
    }
    lastTapRef.current = now;
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const points = [...pointersRef.current.values()];
    if (points.length === 2) {
      // Pinch
      const d = getTwoPointerDistance(points[0], points[1]);
      if (baseDistanceRef.current == null) {
        baseDistanceRef.current = d;
        baseScaleRef.current = scale || 1;
        return;
      }
      const factor = d / (baseDistanceRef.current || d);
      let nextScale = clamp(baseScaleRef.current * factor, 1, 5);
      setScale(nextScale);
      // Keep offset reasonable (optional: simple damp)
      setOffset((prev) => ({ x: clamp(prev.x, -2000, 2000), y: clamp(prev.y, -2000, 2000) }));
    } else if (points.length === 1) {
      // Pan when zoomed
      if (scale > 1) {
        const p = points[0];
        // delta from lastOffset origin
        const dx = p.x - (imgRef.current?.getBoundingClientRect().left || 0);
        const dy = p.y - (imgRef.current?.getBoundingClientRect().top || 0);
        // Use movementX/Y instead (smoother)
        // @ts-ignore
        const movementX = e.movementX ?? 0;
        // @ts-ignore
        const movementY = e.movementY ?? 0;
        setOffset((o) => ({ x: clamp(o.x + movementX, -4000, 4000), y: clamp(o.y + movementY, -4000, 4000) }));
      }
    }
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      baseDistanceRef.current = null;
      baseScaleRef.current = scale || 1;
      setLastOffset((o) => o);
    }
  };

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    // Block browser zoom on ctrl/cmd
    if (e.ctrlKey) {
      e.preventDefault();
    }
    // Smooth zoom around cursor (desktop)
    const delta = e.deltaY;
    if (Math.abs(delta) > 0) {
      const direction = delta > 0 ? -1 : 1;
      const zoomStep = 0.1 * direction;
      const next = clamp(scale + zoomStep, 1, 5);
      setScale(next);
    }
  };

  // Prevent touch scrolling/zooming the page while interacting
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (ev: TouchEvent) => {
      // Always prevent default inside the modal container
      ev.preventDefault();
    };
    el.addEventListener("touchmove", prevent, { passive: false });
    el.addEventListener("gesturestart" as any, prevent, { passive: false });
    return () => {
      el.removeEventListener("touchmove", prevent as any);
      el.removeEventListener("gesturestart" as any, prevent as any);
    };
  }, [viewerOpen]);

  // Image style derived from scale/offset
  const imgStyle: React.CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    transition: pointersRef.current.size > 0 ? "none" : "transform 120ms ease-out",
    cursor: scale > 1 ? "grab" : "auto",
    touchAction: "none",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Maps</h1>
        </div>

        {areas.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setActiveArea("")}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                activeArea === ""
                  ? "bg-[#C70000] text-white border-[#C70000]"
                  : "bg-white text-gray-800 border-gray-200"
              }`}
            >
              All
            </button>
            {areas.map((a) => (
              <button
                key={a}
                onClick={() => setActiveArea(a)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  activeArea === a
                    ? "bg-[#C70000] text-white border-[#C70000]"
                    : "bg-white text-gray-800 border-gray-200"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center text-gray-600 py-10">Loading maps...</div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center text-gray-600 py-10">No maps found.</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it, idx) => (
            <div
              key={it._id ?? `${it.imageUrl}-${idx}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group"
            >
              <button
                type="button"
                onClick={() => openViewer(idx)}
                className="relative block w-full"
                aria-label={`Open ${it.title || it.area || "map"} image`}
              >
                <img
                  src={it.imageUrl}
                  alt={it.title || it.area || "map"}
                  className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
                  Click to view
                </span>
              </button>
              <div className="p-3">
                <div className="text-sm text-gray-600">{it.area || "—"}</div>
                <div className="font-semibold text-gray-900">
                  {it.title || "Map"}
                </div>
                {it.description && (
                  <div className="text-sm text-gray-700 mt-1 line-clamp-3">
                    {it.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNavigation />

      {/* Lightbox / Modal */}
      {viewerOpen && items.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 overscroll-contain"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeViewer();
          }}
        >
          {/* Close */}
          <button
            type="button"
            onClick={closeViewer}
            className="absolute top-3 right-3 md:top-5 md:right-5 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow px-3 py-1 text-sm"
            aria-label="Close"
          >
            Close ✕
          </button>

          {/* Prev / Next */}
          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow px-3 py-2"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow px-3 py-2"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          {/* Content (pinch-zoom container) */}
          <div
            ref={containerRef}
            className="w-[92vw] h-[82vh] flex items-center justify-center p-2 touch-none select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            <img
              ref={imgRef}
              src={items[viewerIndex]?.imageUrl}
              alt={items[viewerIndex]?.title || items[viewerIndex]?.area || "map"}
              className="max-w-full max-h-full object-contain"
              draggable={false}
              style={imgStyle}
            />
          </div>

          {/* Caption + Reset */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-center text-white text-sm px-3 py-1 bg-black/40 rounded">
            <div className="font-medium">
              {items[viewerIndex]?.title || "Map"}
            </div>
            <div className="opacity-90">
              {items[viewerIndex]?.area || "—"} · {viewerIndex + 1} / {items.length}
            </div>
            {scale > 1 && (
              <button
                onClick={resetTransform}
                className="mt-2 text-xs underline decoration-dotted"
              >
                Reset zoom
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
