import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Clock, Send, ZoomIn } from "lucide-react";
import PropertyLoadingSkeleton from "./PropertyLoadingSkeleton";
import EnquiryModal from "./EnquiryModal";
import ImageModal from "./ImageModal";
import Watermark from "./Watermark";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/* ----------------------------- Types ----------------------------- */
interface Property {
  _id: string;
  title: string;
  price: number;
  location: { city: string; state: string; address?: string };
  images: (string | { url: string })[];
  coverImageUrl?: string;
  propertyType: string;
  createdAt: string;
  premium?: boolean;
  contactInfo: { name?: string };
}

/* -------- LocalStorage helpers (for logged-out wishlist) -------- */
const getLocalFavIds = (): string[] => {
  try {
    const raw = localStorage.getItem("favorites");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
};
const setLocalFavIds = (ids: string[]) => {
  localStorage.setItem("favorites", JSON.stringify(Array.from(new Set(ids))));
};

/* ========================== Component =========================== */
export default function OLXStyleListings() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // wishlist ids visible on cards
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favBusy, setFavBusy] = useState<string | null>(null);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedPropertyForZoom, setSelectedPropertyForZoom] =
    useState<Property | null>(null);

  /* --------------------------- Helpers --------------------------- */
  const notify = (msg: string, type: "success" | "error" = "success") => {
    try {
      type === "success" ? toast.success(msg) : toast.error(msg);
    } catch {
      alert(msg);
    }
  };

  // build auth headers from multiple possible tokens your app uses
  const buildAuthHeaders = () => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    const ls = typeof window !== "undefined" ? window.localStorage : null;

    const bearer =
      token ||
      ls?.getItem("token") ||
      ls?.getItem("adminToken") ||
      ls?.getItem("authToken");
    if (bearer) h["Authorization"] = `Bearer ${bearer}`;

    const xAuth = ls?.getItem("x-auth-token");
    if (xAuth) h["x-auth-token"] = xAuth;

    const admin = ls?.getItem("adminToken");
    if (admin) h["adminToken"] = admin;

    return h;
  };

  // GET helper (window.api if available) — returns {ok,status,json}
  const apiGet = async (path: string) => {
    const anyWin = window as any;
    const opts = {
      headers: buildAuthHeaders(),
      credentials: "include" as const,
    };
    if (anyWin.api) {
      try {
        const r = await anyWin.api(path, opts);
        return {
          ok: r?.ok ?? true,
          status: r?.status ?? 200,
          json: r?.json ?? r,
        };
      } catch {
        /* fall-through to fetch */
      }
    }
    const res = await fetch(`/api/${path}`, opts as any);
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  };

  // WRITE helper (POST/DELETE) — single request, headers included
  const apiWrite = async (path: string, method: "POST" | "DELETE") => {
    const anyWin = window as any;
    const opts = {
      method,
      headers: buildAuthHeaders(),
      credentials: "include" as const,
    };
    if (anyWin.api) {
      try {
        const r = await anyWin.api(path, opts);
        return {
          ok: r?.ok ?? (r?.status ? r.status < 400 : true),
          status: r?.status ?? 200,
          json: r?.json ?? r,
        };
      } catch {
        /* fall-through */
      }
    }
    const res = await fetch(`/api/${path}`, opts as any);
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  };

  /* --------------------------- Effects --------------------------- */

  // load properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await apiGet("properties?status=active&limit=24");
        if (res?.ok && res?.json?.success) {
          const list = Array.isArray(res.json.data)
            ? res.json.data
            : res.json.data?.properties || [];
          if (list?.length) {
            setProperties(list);
            return;
          }
        }
        loadMockProperties();
      } catch {
        loadMockProperties();
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // load favorites list: server if logged-in, else localStorage
  const fetchFavoritesFromServer = useCallback(async () => {
    try {
      const res = await apiGet("favorites/my");
      if (res?.ok && res?.json?.success) {
        const ids = (res.json.data as any[])
          ?.map((row: any) => String(row?.property?._id || row?.propertyId))
          .filter(Boolean);
        setFavorites(Array.from(new Set(ids)));
      } else {
        setFavorites([]);
      }
    } catch (e) {
      console.error("favorites load failed", e);
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (token) {
        await fetchFavoritesFromServer();
      } else {
        setFavorites(getLocalFavIds());
      }
      setFavoritesLoaded(true);
    };
    init();
  }, [token, fetchFavoritesFromServer]);

  // keep local favorites in sync across tabs when logged out
  useEffect(() => {
    if (token) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === "favorites") setFavorites(getLocalFavIds());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [token]);

  const loadMockProperties = () => {
    const mock: Property[] = [
      {
        _id: "mock-1",
        title: "3 BHK Flat for Sale in Rohtak",
        price: 4500000,
        location: { city: "Rohtak", state: "Haryana" },
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
        ],
        propertyType: "apartment",
        createdAt: new Date().toISOString(),
        contactInfo: { name: "Rajesh Kumar" },
      },
      {
        _id: "mock-2",
        title: "2 BHK Independent House",
        price: 3200000,
        location: { city: "Rohtak", state: "Haryana" },
        images: [
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
        ],
        propertyType: "house",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        contactInfo: { name: "Priya Sharma" },
      },
      {
        _id: "mock-3",
        title: "Commercial Shop for Rent",
        price: 25000,
        location: { city: "Rohtak", state: "Haryana" },
        images: [
          "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800",
        ],
        propertyType: "commercial",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        contactInfo: { name: "Amit Singh" },
      },
      {
        _id: "mock-4",
        title: "4 BHK Villa with Garden",
        price: 8500000,
        location: { city: "Rohtak", state: "Haryana" },
        images: [
          "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=800",
        ],
        propertyType: "villa",
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        contactInfo: { name: "Vikash Yadav" },
      },
    ];
    setProperties(mock);
  };

  /* -------------------- Favorite toggle logic ------------------- */

  const serverToggleFavorite = async (id: string, makeFav: boolean) => {
    try {
      setFavBusy(id);
      const res = await apiWrite(
        `favorites/${id}`,
        makeFav ? "POST" : "DELETE",
      );

      const msg = (res?.json?.error || res?.json?.message || "")
        .toString()
        .toLowerCase();

      // Unauthorized → treat as logged-out UX
      if (res.status === 401) {
        const cur = getLocalFavIds();
        const next = makeFav
          ? Array.from(new Set([id, ...cur]))
          : cur.filter((x) => x !== id);
        setLocalFavIds(next);
        window.dispatchEvent(new Event("favorites:changed"));
        return true;
      }

      // Success direct
      if (res.ok || res.status === 200 || res.status === 201) return true;

      // Duplicate add/remove → treat as success
      if (
        makeFav &&
        (res.status === 400 || res.status === 409) &&
        msg.includes("already")
      )
        return true;
      if (
        !makeFav &&
        (res.status === 400 || res.status === 404) &&
        (msg.includes("not in") || msg.includes("not found"))
      )
        return true;

      console.error("toggle favorite failed", res);
      return false;
    } catch (e) {
      console.error("toggle favorite error", e);
      return false;
    } finally {
      setFavBusy(null);
    }
  };

  const toggleFavorite = async (id: string) => {
    if (!favoritesLoaded) return;

    // logged-out + mock ids: local demo save
    if (!token && id.startsWith("mock-")) {
      const isFav = getLocalFavIds().includes(id);
      const next = isFav
        ? getLocalFavIds().filter((x) => x !== id)
        : [id, ...getLocalFavIds()];
      setLocalFavIds(next);
      setFavorites(next);
      window.dispatchEvent(new Event("favorites:changed"));
      notify(isFav ? "Removed from wishlist" : "Saved to this device");
      return;
    }

    const ls = window.localStorage;
    const hasAnyToken =
      token ||
      ls.getItem("token") ||
      ls.getItem("adminToken") ||
      ls.getItem("authToken");

    /* ---------- LOGGED OUT: LOCAL STORAGE ---------- */
    if (!hasAnyToken) {
      const currentlyFav = getLocalFavIds().includes(id);
      const next = currentlyFav
        ? getLocalFavIds().filter((x) => x !== id)
        : [id, ...getLocalFavIds()];
      setLocalFavIds(next);
      setFavorites(next);
      window.dispatchEvent(new Event("favorites:changed"));
      notify(currentlyFav ? "Removed from wishlist" : "Saved to this device");
      return;
    }

    /* ---------- LOGGED IN: SERVER ---------- */
    const currentlyFav = favorites.includes(id);

    // Optimistic UI
    setFavorites((prev) =>
      currentlyFav ? prev.filter((x) => x !== id) : [id, ...prev],
    );

    const ok = await serverToggleFavorite(id, !currentlyFav);

    if (!ok) {
      // revert
      setFavorites((prev) =>
        currentlyFav ? [id, ...prev] : prev.filter((x) => x !== id),
      );
      notify("Something went wrong, please try again.", "error");
      return;
    }

    notify(currentlyFav ? "Removed from wishlist" : "Saved to wishlist");
    window.dispatchEvent(new Event("favorites:changed"));
  };

  /* -------------------------- UI helpers ------------------------ */
  // ✅ FULL DIGITS — no Cr/L/K, no commas
  const formatPrice = (price: number) =>
    `₹ ${Math.round(Number(price || 0)).toString()}`;

  const getTimeAgo = (iso: string) => {
    const now = new Date();
    const d = new Date(iso);
    const hours = Math.floor((now.getTime() - d.getTime()) / 36e5);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const handlePropertyClick = (p: Property) => navigate(`/properties/${p._id}`);

  const firstImage = useMemo(
    () => (p: Property) =>
      p.coverImageUrl ||
      (typeof p.images?.[0] === "string"
        ? (p.images[0] as string)
        : (p.images?.[0] as any)?.url) ||
      "/placeholder.png",
    [],
  );

  /* ---------------------------- Render -------------------------- */
  if (loading) return <PropertyLoadingSkeleton />;

  return (
    <div className="bg-white">
      <div className="px-4 py-4 max-w-6xl mx-auto">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
          Fresh recommendations
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {properties.map((property) => {
            const isFav = favorites.includes(property._id);
            const isBusy = favBusy === property._id;

            return (
              <div
                key={property._id}
                onClick={() => handlePropertyClick(property)}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-95"
              >
                <div className="relative aspect-square md:aspect-[4/3] group">
                  <img
                    src={firstImage(property)}
                    alt={property.title}
                    className="w-full h-full object-cover cursor-pointer group-hover:opacity-90 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPropertyForZoom(property);
                      setImageModalOpen(true);
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />
                  <Watermark variant="badge" small text="ashishproperties.in" />
                  {property.premium && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-2 py-1 rounded-md text-[10px] md:text-xs font-bold shadow">
                      AP Premium
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPropertyForZoom(property);
                      setImageModalOpen(true);
                    }}
                    className="absolute top-2 right-2 md:top-3 md:right-3 w-8 h-8 md:w-9 md:h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                    aria-label="zoom image"
                    title="Click to zoom"
                  >
                    <ZoomIn className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isBusy) toggleFavorite(property._id);
                    }}
                    disabled={isBusy}
                    className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-8 h-8 md:w-9 md:h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition disabled:opacity-60"
                    aria-label="favorite"
                    title={isFav ? "Remove from wishlist" : "Save to wishlist"}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isFav ? "fill-red-500 text-red-500" : "text-gray-600"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 md:p-3.5">
                  <div className="text-base md:text-lg font-bold text-gray-900 mb-1">
                    {formatPrice(property.price)}
                  </div>

                  <h3 className="text-xs md:text-sm text-gray-700 mb-2 line-clamp-2 leading-tight">
                    {property.title}
                  </h3>

                  <div className="flex items-center text-[11px] md:text-xs text-gray-500 mb-1">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {property.location.city}, {property.location.state}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] md:text-xs text-gray-400 mb-2">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{getTimeAgo(property.createdAt)}</span>
                    </div>
                    <span className="capitalize px-2 py-0.5 bg-gray-100 rounded">
                      {property.propertyType}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedProperty(property);
                      setEnquiryModalOpen(true);
                    }}
                    data-testid="enquiry-btn"
                    className="w-full bg-[#C70000] hover:bg-[#A60000] text-white text-[11px] md:text-xs py-2 rounded-md flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Send className="h-3 w-3" />
                    <span>Enquiry Now</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No properties available</p>
          </div>
        )}

        {properties.length > 0 && (
          <div className="mt-6 text-center">
            <button className="text-[#C70000] font-semibold text-sm hover:underline">
              View all properties
            </button>
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      {selectedProperty && (
        <EnquiryModal
          isOpen={enquiryModalOpen}
          onClose={() => {
            setEnquiryModalOpen(false);
            setSelectedProperty(null);
          }}
          propertyId={selectedProperty._id}
          propertyTitle={selectedProperty.title}
          ownerName={selectedProperty.contactInfo?.name || "Property Owner"}
        />
      )}

      {/* Image Zoom Modal */}
      {selectedPropertyForZoom && (
        <ImageModal
          isOpen={imageModalOpen}
          onClose={() => {
            setImageModalOpen(false);
            setSelectedPropertyForZoom(null);
          }}
          images={
            selectedPropertyForZoom.images
              ?.filter((img) => typeof img === "string" || img?.url)
              .map((img) =>
                typeof img === "string" ? img : (img as any).url,
              ) || []
          }
          title={selectedPropertyForZoom.title}
        />
      )}
    </div>
  );
}
