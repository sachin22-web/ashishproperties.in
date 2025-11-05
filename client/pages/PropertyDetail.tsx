// src/pages/PropertyDetail.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  MessageCircle,
  Phone,
  Share2,
  Heart,
  MapPin,
  ArrowLeft,
  Ruler,
  Home,
  Layers,
  Tag,
  BadgeCheck,
  Landmark,
  FileText,
  IdCard,
} from "lucide-react";
import { useWatermark } from "../hooks/useWatermark";
import Watermark from "../components/Watermark";
// NOTE: aapka import nahi hataya:
import ImageViewerWithZoom from "../components/ImageViewerWithZoom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { toast as shadcnToast } from "../components/ui/use-toast";
import ApiDiagnostic from "../components/ApiDiagnostic";
import EnquiryModal from "../components/EnquiryModal";
import PropertyReviews from "../components/PropertyReviews";
import ReviewsList from "../components/ReviewsList";
import ReviewForm from "../components/ReviewForm";
import LocationMap from "../components/LocationMap";
import { useAuth } from "../hooks/useAuth";

/* ---------------- UI helpers ---------------- */
const KV = ({ k, v }: { k: string; v?: any }) =>
  v !== undefined && v !== null && v !== "" ? (
    <div className="flex justify-between py-1 text-[13px]">
      <span className="text-gray-500">{k}</span>
      <span className="text-gray-900 font-medium text-right ml-3">{v}</span>
    </div>
  ) : null;

const Chip = ({ children, className = "" }: any) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 ${className}`}
  >
    {children}
  </span>
);

/* ---------------- Types ---------------- */
interface Property {
  _id: string;
  title: string;
  description: string;
  propertyType: string;
  subCategory: string;
  price: number;
  priceType: "sale" | "rent";
  location: {
    city: string;
    state: string;
    address: string;
    area?: string;
    sector?: string;
    colony?: string;
    landmark?: string;
    nearby?: string[];
  };
  contactInfo: {
    name: string;
    phone: string;
    whatsappNumber?: string;
    email: string;
  };
  images: any[];
  status: "active" | "inactive" | "sold" | "rented";
  featured: boolean;
  premium: boolean;
  specifications?: {
    bedrooms?: number;
    bathrooms?: number;
    balconies?: number;
    area?: number | string;
    areaUnit?: string;
    carpetArea?: number | string;
    builtUpArea?: number | string;
    facing?: string;
    floor?: string | number;
    totalFloors?: string | number;
    parking?: boolean;
    furnishing?: string;
    age?: string;
    ownership?: string;
    maintenance?: string | number;
  };
  dimensions?: {
    length?: number | string;
    width?: number | string;
    unit?: string;
  };
  details?: {
    plotArea?: number | string;
    plotUnit?: string;
    reraId?: string;
    nearby?: string[];
    tags?: string[];
    floorPlanUrl?: string;
    reraCertificateUrl?: string;
    documents?: Array<string | { name?: string; url: string }>;
  };
  amenities?: string[];
  tags?: string[];
  isVerified?: boolean;
  meta?: {
    verified?: boolean;
    postedBy?: string;
    postedOn?: string;
    listingId?: string;
    reraId?: string;
  };
  postedBy?: string;
  createdAt?: string;
  views: number;
  inquiries: number;
}

/* ---------------- Local wishlist helpers ---------------- */
const getLocalFavIds = (): string[] => {
  try {
    const raw = localStorage.getItem("favorites");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
};
const setLocalFavIds = (ids: string[]) =>
  localStorage.setItem("favorites", JSON.stringify(Array.from(new Set(ids))));

const notify = (msg: string, type: "success" | "error" = "success") => {
  try {
    if (type === "success") shadcnToast({ title: msg });
    else shadcnToast({ title: msg, variant: "destructive" });
  } catch {
    alert(msg);
  }
};

/* =========================================================
   Small repeated transparent watermark (helper)
========================================================= */
function WatermarkLayer({
  text,
  copies = 8,
  opacity = 0.18,
}: {
  text: string;
  copies?: number;
  opacity?: number;
}) {
  // 3x3 grid ~7-8 marks
  const grid: Array<{
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    center?: boolean;
  }> = [
    { top: "12%", left: "12%" },
    { top: "12%", left: "50%", center: true },
    { top: "12%", right: "12%" },
    { top: "50%", left: "12%", center: true },
    { top: "50%", left: "50%", center: true },
    { top: "50%", right: "12%", center: true },
    { bottom: "12%", left: "12%" },
    { bottom: "12%", left: "50%", center: true },
    { bottom: "12%", right: "12%" },
  ].slice(0, Math.min(9, Math.max(7, copies)));

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none"
      style={{ opacity }}
    >
      {grid.map((pos, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            ...pos,
            transform: `${pos.center ? "translate(-50%, -50%) " : ""}rotate(-30deg)`,
            fontSize: "clamp(9px, 1.8vw, 16px)",
            fontWeight: 800,
            letterSpacing: 2,
            color: "white",
            textShadow:
              "0 1px 1px rgba(0,0,0,0.25), 0 6px 18px rgba(0,0,0,0.2)",
            userSelect: "none",
            mixBlendMode: "overlay",
          }}
        >
          {text}
        </span>
      ))}
    </div>
  );
}

/* =========================================================
   Lightbox Modal (no icons) – hooks ALWAYS run (no conditional return)
========================================================= */
function LightboxModalZoom({
  open,
  onClose,
  images,
  index,
  onIndexChange,
  title,
  wmText = "ashishproperties.in",
  wmOpacity = 0.18,
  wmCopies = 8,
}: {
  open: boolean;
  onClose: () => void;
  images: any[];
  index: number;
  onIndexChange: (i: number) => void;
  title?: string;
  wmText?: string;
  wmOpacity?: number;
  wmCopies?: number;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const imgSrc = (i: number) =>
    images?.[i]?.url || images?.[i] || "/placeholder.png";

  // keyboard nav / esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % images.length);
      if (e.key === "ArrowLeft")
        onIndexChange((index - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onClose, onIndexChange]);

  // reset on open / index change
  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [open, index]);

  const wheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!open) return;
    const delta = e.deltaY > 0 ? -0.14 : 0.14;
    const z = Math.min(5, Math.max(1, zoom + delta));
    setZoom(z);
  };

  const down: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!open) return;
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const move: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!open || !dragStart.current) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };
  const up = () => (dragStart.current = null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!open) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    dragStart.current = {
      x: e.touches[0].clientX - offset.x,
      y: e.touches[0].clientY - offset.y,
    };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!open || !dragStart.current) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.current.x,
      y: e.touches[0].clientY - dragStart.current.y,
    });
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (open && touchStart.current && zoom === 1) {
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      if (dx < -50) onIndexChange((index + 1) % images.length);
      else if (dx > 50) onIndexChange((index - 1 + images.length) % images.length);
    }
    dragStart.current = null;
    touchStart.current = null;
  };

  const toggleZoom = () => {
    if (!open) return;
    if (zoom === 1) setZoom(2);
    else {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      style={{ display: open ? "flex" : "none" }} // ✅ hooks always run, UI toggles
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="relative max-w-[95vw] max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative w-full pt-[66%] rounded-md overflow-hidden bg-black/30 cursor-pointer select-none"
          onWheel={wheel}
          onMouseDown={down}
          onMouseMove={move}
          onMouseUp={up}
          onMouseLeave={up}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onDoubleClick={toggleZoom}
          onClick={toggleZoom}
        >
          <img
            src={imgSrc(index)}
            alt={title || "Property image"}
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transition: "transform 0.18s ease-out",
              willChange: "transform",
            }}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
          <WatermarkLayer text={wmText} copies={wmCopies} opacity={wmOpacity} />
        </div>

        <div className="mt-3 text-center text-xs text-gray-300">
          Click to zoom · Scroll to zoom · Drag to pan · Press ESC to close
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Preview (page) – click to open modal
========================================================= */
function PreviewImageWithMarks({
  images,
  index,
  onChange,
  title,
  watermarkText = "ashishproperties.in",
  watermarkOpacity = 0.18,
  watermarkCopies = 8,
  onOpenModal,
}: {
  images: any[];
  index: number;
  onChange: (i: number) => void;
  title?: string;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkCopies?: number;
  onOpenModal: () => void;
}) {
  const imgSrc = (i: number) =>
    images?.[i]?.url || images?.[i] || "/placeholder.png";

  return (
    <div className="relative select-none">
      <div
        className="relative overflow-hidden rounded-md bg-black/5 cursor-pointer"
        onClick={onOpenModal}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="relative w-full pt-[66%]">
          <img
            src={imgSrc(index)}
            alt={title || "Property image"}
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
          <WatermarkLayer
            text={watermarkText}
            copies={watermarkCopies}
            opacity={watermarkOpacity}
          />
        </div>
      </div>

      {images?.length > 1 && (
        <div className="mt-3 flex items-center gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              className={`relative h-16 w-24 flex-shrink-0 rounded-md overflow-hidden border ${
                i === index ? "border-[#C70000]" : "border-gray-200"
              }`}
              onClick={() => onChange(i)}
              aria-label={`Go to image ${i + 1}`}
            >
              <img
                src={img?.url || img || "/placeholder.png"}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
              {i === index && (
                <span className="absolute inset-0 ring-2 ring-[#C70000] ring-offset-1 rounded-md pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========================================================= */

export default function PropertyDetail() {
  const { settings: watermarkSettings } = useWatermark();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    const t = token || localStorage.getItem("token");
    if (t) {
      if (!localStorage.getItem("accessToken"))
        localStorage.setItem("accessToken", t);
      if (!localStorage.getItem("authToken"))
        localStorage.setItem("authToken", t);
    }
  }, [token]);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const buildAuthHeaders = () => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    const ls = localStorage;
    const bearer =
      token ||
      ls.getItem("token") ||
      ls.getItem("adminToken") ||
      ls.getItem("authToken");
    if (bearer) h["Authorization"] = `Bearer ${bearer}`;
    if (ls.getItem("x-auth-token"))
      h["x-auth-token"] = String(ls.getItem("x-auth-token"));
    if (ls.getItem("adminToken"))
      h["adminToken"] = String(ls.getItem("adminToken"));
    return h;
  };

  const apiGet = async (path: string) => {
    const anyWin = window as any;
    if (anyWin.api) {
      try {
        return await anyWin.api(path);
      } catch {}
    }
    const res = await fetch(`/api/${path}`, {
      headers: buildAuthHeaders(),
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  };

  const apiWrite = async (path: string, method: "POST" | "DELETE") => {
    const anyWin = window as any;
    if (anyWin.api) {
      try {
        const r = await anyWin.api(path, { method });
        if (r?.ok) return r;
      } catch {}
    }
    const res = await fetch(`/api/${path}`, {
      method,
      headers: buildAuthHeaders(),
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  };

  useEffect(() => {
    if (id) {
      fetchProperty();
      trackView();
    }
  }, [id]);

  const fetchProperty = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError("");
      if (!id) {
        setError("Property ID is required");
        setLoading(false);
        return;
      }
      if (id.length !== 24) {
        setError("Invalid property ID format");
        setLoading(false);
        return;
      }

      const apiResponse = await (window as any).api(`properties/${id}`);
      if (apiResponse.ok) {
        const data = apiResponse.json;
        if (data.success) setProperty(data.data);
        else setError(data.error || "Property not found");
      } else if (apiResponse.status === 404) {
        setError("Property not found");
      } else if (apiResponse.status === 400) {
        setError("Invalid property ID");
      } else {
        const errorData = apiResponse.json;
        setError(errorData.error || "Failed to load property");
      }
    } catch (error: any) {
      let errorMessage = "Failed to load property";
      if (
        error.name === "TypeError" &&
        String(error.message).includes("Failed to fetch")
      ) {
        if (retryCount < 2) {
          setTimeout(
            () => fetchProperty(retryCount + 1),
            1000 * (retryCount + 1)
          );
          return;
        } else
          errorMessage =
            "Network error. Please check your internet connection and try again.";
      } else if (String(error.message).includes("Invalid JSON"))
        errorMessage = "Server error. Please try again later.";
      else if (error.message) errorMessage = error.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorite = useCallback(async () => {
    if (!id) return;
    try {
      const hasAnyToken =
        token ||
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("authToken");
      if (hasAnyToken) {
        let res = await apiGet(`favorites/check/${id}`);
        if (
          res?.ok &&
          res?.json?.success &&
          typeof res.json?.data?.isFavorite === "boolean"
        ) {
          setIsLiked(!!res.json.data.isFavorite);
          return;
        }
        res = await apiGet("favorites/my");
        if (res?.ok && res?.json?.success) {
          const ids: string[] = (res.json.data as any[])
            .map((row: any) => String(row?.property?._id || row?.propertyId))
            .filter(Boolean);
          setIsLiked(ids.includes(String(id)));
          return;
        }
      }
      setIsLiked(getLocalFavIds().includes(String(id)));
    } catch {
      setIsLiked(getLocalFavIds().includes(String(id)));
    }
  }, [id, token]);

  useEffect(() => {
    loadFavorite();
  }, [loadFavorite]);

  useEffect(() => {
    const onFavChanged = () => loadFavorite();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "favorites") loadFavorite();
      if (["token", "authToken", "adminToken"].includes(e.key || ""))
        loadFavorite();
    };
    window.addEventListener("favorites:changed", onFavChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("favorites:changed", onFavChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadFavorite]);

  const toggleLike = async () => {
    if (!id || likeBusy) return;
    const hasAnyToken =
      token ||
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("authToken");
    if (!hasAnyToken) {
      const prev = getLocalFavIds();
      const next = isLiked ? prev.filter((x) => x !== id) : [id, ...prev];
      setLocalFavIds(next);
      setIsLiked(!isLiked);
      window.dispatchEvent(new Event("favorites:changed"));
      notify(isLiked ? "Removed from wishlist" : "Added to wishlist");
      return;
    }
    try {
      setLikeBusy(true);
      setIsLiked((p) => !p);
      const res = await apiWrite(
        `favorites/${id}`,
        isLiked ? "DELETE" : "POST"
      );
      if (!res?.ok || res?.json?.success === false) {
        setIsLiked((p) => !p);
        notify("Couldn't update wishlist. Try again.", "error");
        return;
      }
      window.dispatchEvent(new Event("favorites:changed"));
      notify(isLiked ? "Removed from wishlist" : "Added to wishlist");
    } catch {
      setIsLiked((p) => !p);
      notify("Couldn't update wishlist. Try again.", "error");
    } finally {
      setLikeBusy(false);
    }
  };

  const trackView = async () => {
    try {
      const url = `/api/analytics/view/${id}`;
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ ts: Date.now() })], {
          type: "application/json",
        });
        navigator.sendBeacon(url, blob);
        return;
      }
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ts: Date.now() }),
      });
    } catch {}
  };

  const handleCall = (phoneNumber: string) => {
    try {
      const url = `/api/analytics/phone/${id}`;
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ ts: Date.now() })], {
          type: "application/json",
        });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ts: Date.now() }),
        }).catch(() => {});
      }
    } catch {}
    window.open(`tel:${phoneNumber}`, "_self");
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const message = `Hi, I'm interested in your property: ${property?.title}`;
    const url = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  const handleStartChat = async () => {
    setStartingChat(true);
    try {
      const t =
        token ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("adminToken");

      if (!t) {
        navigate("/login", {
          state: {
            redirectTo: location.pathname,
            message: "Please login to start chat",
          },
        });
        return;
      }

      if (!property?._id) {
        shadcnToast({
          title: "Error",
          description: "Property information not available",
          variant: "destructive",
        });
        return;
      }

      const apiPost = async (path: string, body: any) => {
        const anyWin = window as any;
        if (anyWin.api) {
          try {
            const r = await anyWin.api(path, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${t}`,
              },
              body,
            });
            if (typeof r === "object" && ("ok" in r || "json" in r)) return r;
            return { ok: true, status: 200, json: r };
          } catch (e) {}
        }
        const res = await fetch(`/api/${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, json };
      };

      const extractConvId = (raw: any): string | null => {
        const j = raw?.json ?? raw;
        const d = j?.data ?? j;
        return (
          d?._id ||
          d?.conversationId ||
          d?.conversation?._id ||
          j?.conversationId ||
          j?._id ||
          null
        );
      };

      let res = await apiPost("conversations/find-or-create", {
        propertyId: property._id,
      });
      if (!res?.ok || res?.json?.success === false) {
        res = await apiPost("conversations", { propertyId: property._id });
      }

      const convId = extractConvId(res);
      if (!convId) {
        shadcnToast({
          title: "Error",
          description:
            res?.json?.error || "Invalid conversation id. Please try again.",
          variant: "destructive",
        });
        return;
      }

      navigate(`/conversation/${convId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      shadcnToast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Property Not Found
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          <ApiDiagnostic propertyId={id} />
        </div>
      </div>
    );
  }

  const specs = property.specifications || {};
  const loc = property.location || {};
  const details = property.details || {};
  const isRent = property.priceType === "rent";

  const images = Array.isArray(property.images) ? property.images : [];
  const addr =
    property.location?.address ||
    [loc.landmark, loc.colony, loc.sector, loc.area, loc.city]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              {/* <Button variant="ghost" size="sm" onClick={toggleLike} disabled={likeBusy} className={isLiked ? "text-red-500" : ""}>
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              </Button> */}
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const shareData = {
                    title: property?.title || "Property Listing",
                    text: `Check out this property: ${property?.title}`,
                    url: window.location.href,
                  };
                  try {
                    if (navigator.share) {
                      await navigator.share(shareData);
                      notify("Shared successfully!");
                    } else {
                      await navigator.clipboard.writeText(window.location.href);
                      notify("Link copied to clipboard!");
                    }
                  } catch {
                    await navigator.clipboard.writeText(window.location.href);
                    notify("Link copied to clipboard!");
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                disabled={startingChat}
                className="bg-[#C70000] hover:bg-[#A60000] text-white"
                onClick={handleStartChat}
              >
                {startingChat ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                ) : (
                  <MessageCircle className="h-4 w-4 mr-1" />
                )}
                {startingChat ? "Starting..." : "Message Owner"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {images.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <PreviewImageWithMarks
                    images={images}
                    index={currentImageIndex}
                    onChange={setCurrentImageIndex}
                    title={property.title}
                    watermarkText={watermarkSettings?.text || "ashishproperties.in"}
                    watermarkOpacity={
                      typeof watermarkSettings?.opacity === "number"
                        ? watermarkSettings.opacity
                        : 0.18
                    }
                    watermarkCopies={8}
                    onOpenModal={() => setLightboxOpen(true)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">
                  {property.title}
                </CardTitle>
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{addr}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#C70000] mb-3">
                  ₹{Number(property.price || 0).toLocaleString("en-IN")}{" "}
                  {isRent && <span className="text-lg">/month</span>}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {!!property.propertyType && (
                    <Chip className="bg-red-50 text-[#C70000]">
                      <Home className="h-3 w-3 mr-1" />
                      {String(property.propertyType)}
                    </Chip>
                  )}
                  {!!property.subCategory && (
                    <Chip>
                      <Layers className="h-3 w-3 mr-1" />
                      {String(property.subCategory)}
                    </Chip>
                  )}
                  {!!property.priceType && (
                    <Chip>
                      <Tag className="h-3 w-3 mr-1" />
                      {String(property.priceType).toUpperCase()}
                    </Chip>
                  )}
                  {!!property.status && <Chip>{String(property.status)}</Chip>}
                  {(property.isVerified || property.meta?.verified) && (
                    <Chip className="bg-emerald-50 text-emerald-700">
                      <BadgeCheck className="h-3 w-3 mr-1" />
                      Verified
                    </Chip>
                  )}
                </div>

                {property.description && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Description
                    </h4>
                    <p className="text-gray-700 whitespace-pre-line mb-4">
                      {property.description}
                    </p>
                  </>
                )}

                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Ruler className="h-4 w-4" /> Specifications
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6">
                  <KV k="Bedrooms" v={property.specifications?.bedrooms} />
                  <KV k="Bathrooms" v={property.specifications?.bathrooms} />
                  <KV k="Balconies" v={property.specifications?.balconies} />
                  <KV
                    k="Area"
                    v={
                      property.specifications?.area &&
                      `${property.specifications.area} ${property.specifications?.areaUnit || "sq ft"}`
                    }
                  />
                  <KV
                    k="Carpet Area"
                    v={
                      property.specifications?.carpetArea &&
                      `${property.specifications.carpetArea} ${property.specifications?.areaUnit || "sq ft"}`
                    }
                  />
                  <KV
                    k="Built-up Area"
                    v={
                      property.specifications?.builtUpArea &&
                      `${property.specifications.builtUpArea} ${property.specifications?.areaUnit || "sq ft"}`
                    }
                  />
                  <KV k="Floor" v={property.specifications?.floor} />
                  <KV k="Total Floors" v={property.specifications?.totalFloors} />
                  <KV k="Facing" v={property.specifications?.facing} />
                  <KV k="Furnishing" v={property.specifications?.furnishing} />
                  <KV k="Property Age" v={property.specifications?.age} />
                  <KV k="Ownership" v={property.specifications?.ownership} />
                  <KV k="Maintenance" v={property.specifications?.maintenance} />
                  <KV
                    k="Dimensions"
                    v={
                      (property.dimensions?.length || property.dimensions?.width) &&
                      `${property.dimensions?.length || ""}${
                        property.dimensions?.length ? " x " : ""
                      }${property.dimensions?.width || ""} ${
                        property.dimensions?.unit || ""
                      }`
                    }
                  />
                  <KV
                    k="Plot Area"
                    v={
                      property.details?.plotArea &&
                      `${property.details.plotArea} ${property.details?.plotUnit || ""}`
                    }
                  />
                  <KV k="RERA" v={property.meta?.reraId || property.details?.reraId} />
                  <KV
                    k="Posted On"
                    v={
                      (property.meta?.postedOn || property.createdAt) &&
                      new Date(
                        property.meta?.postedOn || (property.createdAt as any)
                      ).toLocaleDateString()
                    }
                  />
                  <KV k="Listing ID" v={property.meta?.listingId} />
                  <KV
                    k="Posted By"
                    v={
                      property.meta?.postedBy ||
                      property.postedBy ||
                      property.contactInfo?.name
                    }
                  />
                </div>

                {!!(
                  property.amenities?.length || property.details?.amenities?.length
                ) && (
                  <>
                    <h4 className="mt-4 text-sm font-semibold text-gray-900 mb-2">
                      Amenities / Features
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(property.amenities || property.details?.amenities || [])
                        .slice(0, 40)
                        .map((a: string, i: number) => (
                          <Chip key={i}>{a}</Chip>
                        ))}
                    </div>
                  </>
                )}

                {(loc?.landmark ||
                  loc?.nearby?.length ||
                  property.details?.nearby?.length ||
                  property.tags?.length ||
                  property.details?.tags?.length) && (
                  <>
                    <h4 className="mt-4 text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Landmark className="h-4 w-4" /> Nearby / Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {loc?.landmark && <Chip>{loc.landmark}</Chip>}
                      {Array.isArray(loc?.nearby) &&
                        loc.nearby.map((n, i) => (
                          <Chip key={`n-${i}`}>{n}</Chip>
                        ))}
                      {Array.isArray(property.details?.nearby) &&
                        property.details!.nearby!.map((n, i) => (
                          <Chip key={`dn-${i}`}>{n}</Chip>
                        ))}
                      {(property.tags || property.details?.tags || []).map(
                        (t: string, i: number) => <Chip key={`t-${i}`}>{t}</Chip>
                      )}
                    </div>
                  </>
                )}

                {(details?.floorPlanUrl ||
                  details?.reraCertificateUrl ||
                  details?.documents?.length) && (
                  <>
                    <h4 className="mt-4 text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <IdCard className="h-4 w-4" /> Documents
                    </h4>
                    <div className="flex flex-col gap-2">
                      {details?.floorPlanUrl && (
                        <a
                          className="text-[#C70000] underline"
                          href={details.floorPlanUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          • Floor Plan
                        </a>
                      )}
                      {details?.reraCertificateUrl && (
                        <a
                          className="text-[#C70000] underline"
                          href={details.reraCertificateUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          • RERA Certificate
                        </a>
                      )}
                      {Array.isArray(details?.documents) &&
                        details.documents.map((d: any, i: number) => (
                          <a
                            key={i}
                            className="text-[#C70000] underline"
                            href={typeof d === "string" ? d : d?.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            •{" "}
                            {typeof d === "string"
                              ? `Document ${i + 1}`
                              : d?.name || `Document ${i + 1}`}
                          </a>
                        ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {(property.location?.address ||
              property.location?.city ||
              property.location?.sector ||
              property.location?.colony) && (
              <Card>
                <CardContent className="p-4">
                  <LocationMap
                    address={property.location?.address}
                    city={property.location?.city}
                    state={property.location?.state}
                    sector={property.location?.sector}
                    colony={property.location?.colony}
                    landmark={property.location?.landmark}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent>
                <div className="mt-6">
                  <PropertyReviews propertyId={property._id} />
                  <ReviewsList targetId={property._id} targetType="property" />
                  {authLoading ? (
                    <div className="text-sm text-gray-500 mt-2">
                      Checking login…
                    </div>
                  ) : isAuthenticated ? (
                    <ReviewForm
                      key={user?._id || "authed"}
                      targetId={property._id}
                      targetType="property"
                    />
                  ) : (
                    <div className="mt-2 text-sm">
                      Login to write a review.{" "}
                      <Link
                        to="/login"
                        state={{ redirectTo: location.pathname }}
                        className="text-[#C70000] underline"
                      >
                        Login
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{property.contactInfo?.name}</p>
                  <p className="text-sm text-gray-600">
                    {property.contactInfo?.email}
                  </p>
                </div>

                {/* Desktop */}
                <div className="hidden md:flex flex-col space-y-3">
                  <Button
                    className="w-full bg-[#C70000] hover:bg-[#A60000] text-white flex justify-center items-center py-3"
                    onClick={handleStartChat}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" /> Message
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-[#C70000] text-[#C70000] hover:bg-[#C70000] hover:text-white flex justify-center items-center py-3"
                    onClick={() =>
                      handleCall(property.contactInfo?.phone || "")
                    }
                  >
                    <Phone className="h-4 w-4 mr-2" /> Call
                  </Button>
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 text-white flex justify-center items-center py-3"
                    onClick={() =>
                      handleWhatsApp(
                        property.contactInfo?.whatsappNumber ||
                          property.contactInfo?.phone ||
                          ""
                      )
                    }
                  >
                    WhatsApp
                  </Button>
                </div>

                {/* Mobile */}
                <div className="space-y-3 md:hidden">
                  <Button
                    className="w-full bg-[#C70000] hover:bg-[#A60000] text-white flex justify-center items-center py-3 rounded-md"
                    onClick={handleStartChat}
                    disabled={startingChat}
                  >
                    {startingChat ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <MessageCircle className="h-4 w-4 mr-2" />
                    )}
                    <span>{startingChat ? "Starting..." : "Message"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-[#C70000] text-[#C70000] hover:bg-[#C70000] hover:text-white flex justify-center items-center py-3 rounded-md"
                    onClick={() =>
                      handleCall(property.contactInfo?.phone || "")
                    }
                  >
                    <Phone className="h-4 w-4 mr-2" /> Call
                  </Button>

                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 text-white flex justify-center items-center py-3 rounded-md"
                    onClick={() =>
                      handleWhatsApp(
                        property.contactInfo?.whatsappNumber ||
                          property.contactInfo?.phone ||
                          ""
                      )
                    }
                  >
                    WhatsApp
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    Contact details are verified by our team
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* LIGHTBOX (always mounted; only hidden) */}
      <LightboxModalZoom
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={images}
        index={currentImageIndex}
        onIndexChange={setCurrentImageIndex}
        title={property.title}
        wmText={watermarkSettings?.text || "ashishproperties.in"}
        wmOpacity={
          typeof watermarkSettings?.opacity === "number"
            ? watermarkSettings.opacity
            : 0.18
        }
        wmCopies={8}
      />

      {property && (
        <EnquiryModal
          isOpen={enquiryModalOpen}
          onClose={() => setEnquiryModalOpen(false)}
          propertyId={property._id}
          propertyTitle={property.title}
          ownerName={property.contactInfo?.name || ""}
        />
      )}
    </div>
  );
}
