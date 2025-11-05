// client/pages/Wishlist.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Clock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/* ---------------- Types ---------------- */
type Property = {
  _id: string;
  title: string;
  price?: number;
  propertyType?: string;
  createdAt?: string;
  premium?: boolean;
  images?: (string | { url: string })[];
  coverImageUrl?: string;
  location?: { city?: string; state?: string; address?: string };
  contactInfo?: { name?: string };
};

/* ---- LocalStorage helpers (logged-out wishlist) ---- */
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

/* ================= Component ================= */
export default function Wishlist() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [items, setItems] = useState<Property[]>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---- GET helper (prefers window.api) ---- */
  const apiGet = async (path: string) => {
    const anyWin = window as any;
    const opts = {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "include" as const,
    };
    if (anyWin.api) {
      try {
        const r = await anyWin.api(path, opts);
        return { ok: r?.ok ?? true, status: r?.status ?? 200, json: r?.json ?? r };
      } catch { /* fallthrough */ }
    }
    const res = await fetch(`/api/${path}`, opts as any);
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  };

  /* Helper: fetch full property by id (tries both routes) */
  async function fetchPropertyById(id: string) {
    const r1 = await apiGet(`properties/${id}`);
    if (r1?.ok && (r1.json?.data || r1.json?.property)) {
      return r1.json.data || r1.json.property;
    }
    const r2 = await apiGet(`property/${id}`);
    if (r2?.ok && (r2.json?.data || r2.json?.property)) {
      return r2.json.data || r2.json.property;
    }
    return null;
  }

  /* ---------------- LOADERS: server / local ---------------- */

  // Normalize rows from /favorites/my
  const normalizeServerRows = (rows: any[]) => {
    const props: Property[] = [];
    const ids: string[] = [];
    for (const row of rows) {
      const p = row?.property ?? row?.propertyData ?? null;
      const pid = String(row?.propertyId || p?._id || row?._id || "").trim();
      if (p && p._id) props.push(p as Property);
      if (pid) ids.push(pid);
    }
    return { props, ids: Array.from(new Set(ids)) };
  };

  // Logged-in
  const fetchWishlistServer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet("favorites/my");
      if (res?.ok && res?.json?.success) {
        const rows = Array.isArray(res.json.data) ? res.json.data : [];
        const { props: readyProps, ids } = normalizeServerRows(rows);

        // fetch missing details if we got only IDs
        const toFetch = ids.filter(
          (id) => !readyProps.some((p) => String(p._id) === String(id))
        );
        const fetched: Property[] = [];
        for (const id of toFetch) {
          try {
            const p = await fetchPropertyById(id);
            if (p && p._id) fetched.push(p);
          } catch {}
        }

        const all = [...readyProps, ...fetched];
        setItems(all);
        setFavIds(ids.length ? ids : all.map((p) => String(p._id)));
      } else {
        setItems([]);
        setFavIds([]);
      }
    } catch (e) {
      console.error("wishlist load failed", e);
      setItems([]);
      setFavIds([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Logged-out: localStorage ids -> fetch details
  const fetchWishlistLocal = useCallback(async () => {
    setLoading(true);
    try {
      const ids = getLocalFavIds();
      setFavIds(ids);

      const results: Property[] = [];
      for (const id of ids) {
        try {
          const p = await fetchPropertyById(id);
          if (p && p._id) results.push(p);
        } catch {}
      }
      setItems(results);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchWishlistServer();
    else fetchWishlistLocal();
  }, [token, fetchWishlistServer, fetchWishlistLocal]);

  // Sync across tabs + from listing page events
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!token && e.key === "favorites") {
        setFavIds(getLocalFavIds());
        fetchWishlistLocal();
      }
    };
    const onFavEvt = () => {
      if (token) fetchWishlistServer();
      else fetchWishlistLocal();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("favorites:changed", onFavEvt as any);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("favorites:changed", onFavEvt as any);
    };
  }, [token, fetchWishlistServer, fetchWishlistLocal]);

  /* ---------------- TOGGLE (remove) ---------------- */

  const removeFromWishlist = async (id: string) => {
    // optimistic UI
    const prevItems = items;
    const prevFavs = favIds;
    setItems((p) => p.filter((x) => x._id !== id));
    setFavIds((p) => p.filter((x) => x !== id));

    let ok = true;

    if (token) {
      try {
        setBusyId(id);
        const res = await fetch(`/api/favorites/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        // treat "not in favorites" as success
        const msg = (json?.error || json?.message || "").toString().toLowerCase();
        ok = res.ok || msg.includes("not in") || msg.includes("not found");
      } catch {
        ok = false;
      } finally {
        setBusyId(null);
      }
    } else {
      // localStorage removal
      const next = getLocalFavIds().filter((x) => x !== id);
      setLocalFavIds(next);
    }

    if (!ok) {
      // revert on failure
      setItems(prevItems);
      setFavIds(prevFavs);
      try {
        toast.error("Could not remove. Please try again.");
      } catch {
        alert("Could not remove. Please try again.");
      }
      return;
    }

    // success: notify + refresh header badge
    window.dispatchEvent(new Event("favorites:changed"));
    try {
      toast.success("Removed from wishlist");
    } catch {
      alert("Removed from wishlist");
    }
  };

  /* ---------------- UI helpers ---------------- */

  const firstImage = (p: Property) =>
    p.coverImageUrl ||
    (typeof p.images?.[0] === "string"
      ? (p.images[0] as string)
      : (p.images?.[0] as any)?.url) ||
    "/placeholder.png";

  // FULL digits — no Cr/L/K
  const formatPrice = (price?: number) =>
    price == null ? "—" : `₹ ${Math.round(Number(price || 0)).toString()}`;

  const getTimeAgo = (iso?: string) => {
    if (!iso) return "";
    const now = new Date();
    const d = new Date(iso);
    const hours = Math.floor((now.getTime() - d.getTime()) / 36e5);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const goBack = () => {
    // if there is no history entry (direct open), send home
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  /* ---------------- Renders ---------------- */

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        {/* Header with Back */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-2xl font-semibold">My Wishlist</h1>
          </div>
          <span className="text-sm text-gray-500">Loading…</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white border border-gray-200 rounded-lg h-64"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="px-4 py-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-2xl font-semibold">My Wishlist</h1>
          </div>
          <span className="text-sm text-gray-500">{items.length} saved</span>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            {token ? (
              <p className="text-gray-600">No properties saved yet.</p>
            ) : (
              <p className="text-gray-600">
                You’re not logged in. We’ll still keep your saved properties on
                this device.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {items.map((p) => {
              const isBusy = busyId === p._id;
              return (
                <div
                  key={p._id}
                  onClick={() => navigate(`/properties/${p._id}`)}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-95"
                >
                  <div className="relative aspect-square md:aspect-[4/3]">
                    <img
                      src={firstImage(p)}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      onError={(e) =>
                        ((e.target as HTMLImageElement).src = "/placeholder.png")
                      }
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isBusy) removeFromWishlist(p._id);
                      }}
                      disabled={isBusy}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition disabled:opacity-60"
                      aria-label="remove from wishlist"
                      title="Remove"
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </button>
                  </div>

                  <div className="p-3 md:p-3.5">
                    <div className="text-base md:text-lg font-bold text-gray-900 mb-1">
                      {formatPrice(p.price)}
                    </div>

                    <h3 className="text-xs md:text-sm text-gray-700 mb-2 line-clamp-2 leading-tight">
                      {p.title}
                    </h3>

                    <div className="flex items-center text-[11px] md:text-xs text-gray-500 mb-1">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {p.location?.city || "—"}, {p.location?.state || ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] md:text-xs text-gray-400">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{getTimeAgo(p.createdAt)}</span>
                      </div>
                      <span className="capitalize px-2 py-0.5 bg-gray-100 rounded">
                        {p.propertyType || "property"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
