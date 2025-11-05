import { useState, useEffect, useRef } from "react";
import { MapPin, Menu, Search, Heart, Bell, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  getRohtakSectors,
  getRohtakColonies,
  getRohtakLandmarks,
} from "../data/rohtakLocations";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationsUnread } from "@/hooks/useNotificationsUnread";

/* ---------- local favorites (logged-out fallback) ---------- */
const getLocalFavIds = (): string[] => {
  try {
    const raw = localStorage.getItem("favorites");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchType, setSearchType] =
    useState<"sectors" | "colonies" | "landmarks">("sectors");

  const { token } = useAuth();
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const notificationCount = useNotificationsUnread();
  const loc = useLocation();
  const loadingRef = useRef(false);

  const apiGet = async (path: string) => {
    const anyWin = window as any;
    if (anyWin.api) return anyWin.api(path);
    const res = await fetch(`/api/${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, json };
  };

  const loadWishlistCount = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      if (!token) {
        setWishlistCount(getLocalFavIds().length);
        return;
      }
      const res = await apiGet("favorites/my");
      const count = Array.isArray(res?.json?.data) ? res.json.data.length : 0;
      setWishlistCount(count);
    } catch {
      setWishlistCount(0);
    } finally {
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    loadWishlistCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loc.pathname]);

  useEffect(() => {
    const onFavChanged = () => loadWishlistCount();
    const onVisible = () => {
      if (document.visibilityState === "visible") loadWishlistCount();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "favorites") loadWishlistCount();
      if (["token", "adminToken", "authToken"].includes(e.key || "")) {
        loadWishlistCount();
      }
    };

    window.addEventListener("favorites:changed", onFavChanged);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("favorites:changed", onFavChanged);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const getSearchOptions = () => {
    switch (searchType) {
      case "sectors":
        return getRohtakSectors();
      case "colonies":
        return getRohtakColonies();
      case "landmarks":
        return getRohtakLandmarks();
      default:
        return getRohtakSectors();
    }
  };

  return (
    <header className="bg-[#C70000] text-white sticky top-0 z-50">
      {/* ---- SCOPED CSS: hide any heart/wishlist only inside the SEARCH ROW ---- */}
      <style>{`
        /* Only inside the search row */
        .ap-search-row .lucide-heart,
        .ap-search-row [data-icon="heart"],
        .ap-search-row a[href="/wishlist"],
        .ap-search-row a[aria-label="Wishlist"],
        .ap-search-row [data-role="quick-wishlist"],
        .ap-search-row .wishlist,
        .ap-search-row .wishlist-button {
          display: none !important;
        }
      `}</style>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white flex items-center justify-center rounded">
            <span className="text-[#C70000] font-bold text-lg">A</span>
          </div>
        <span className="text-xl font-bold tracking-wide">ASHISH PROPERTIES</span>
        </div>

        {/* Right actions: MapPin | Heart (wishlist) | Bell (notifications) | Menu */}
        <div className="flex items-center space-x-3">
          <button className="p-2" aria-label="Location">
            <MapPin className="h-5 w-5" />
          </button>

          {/* ❤️ Wishlist — Bell ke bilkul side (left) with count */}
          <Link
            to="/wishlist"
            className="p-2 bg-white/20 rounded-lg relative z-20 pointer-events-auto"
            aria-label="Wishlist"
            title="Wishlist"
            onClick={() => setTimeout(loadWishlistCount, 50)}
          >
            <div className="relative">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1.5 rounded-full bg-white text-[#C70000] text-[10px] leading-[18px] text-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </div>
          </Link>

          {/* 🔔 Notifications */}
          <Link
            to="/user-dashboard?tab=notifications"
            className="p-2 bg-white/20 rounded-lg relative z-20 pointer-events-auto"
            aria-label="Notifications"
            title="Notifications"
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1.5 rounded-full bg-yellow-400 text-gray-900 text-[10px] leading-[18px] text-center font-bold animate-pulse">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </div>
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="p-2 md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between px-4 pb-2">
        <nav className="flex space-x-6">
          <a href="/" className="text-white hover:text-red-200 font-medium">Home</a>
          <a href="/categories" className="text-white hover:text-red-200 font-medium">Categories</a>
          <a href="/maps" className="text-white hover:text-gray-200 transition-colors text-sm font-bold px-4 py-2 rounded-md bg-[#A60000] border border-white/20 shadow-sm">MAPS</a>
          <a href="/new-projects" className="text-white hover:text-gray-200 transition-colors text-sm font-bold px-4 py-2 rounded-md bg-[#A60000] border border-white/20 shadow-sm">NEW PROJECTS</a>
          <a href="/post-property" className="text-white hover:text-red-200 font-medium">Post Properties</a>
        </nav>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#A60000] px-4 py-4">
          <nav className="flex flex-col space-y-3">
            <a href="/" className="text-white hover:text-red-200 font-medium py-2">Home</a>
            <a href="/categories" className="text-white hover:text-red-200 font-medium py-2">Categories</a>
            <a href="/maps" className="text-white hover:text-gray-200 font-bold py-2 px-3 rounded bg-[#950000] border border-white/20">MAPS</a>
            <a href="/new-projects" className="text-white hover:text-gray-200 font-bold py-2 px-3 rounded bg-[#950000] border border-white/20">NEW PROJECTS</a>
            <a href="/post-property" className="text-white hover:text-red-200 font-medium py-2">Post Property</a>
          </nav>
        </div>
      )}

      {/* Enhanced Search Bar */}
      <div className="px-4 pb-4 ap-search-row">
        {/* Search Type Selector */}
        <div className="flex space-x-2 mb-3">
          {(["sectors", "colonies", "landmarks"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSearchType(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                searchType === t ? "bg-white text-[#C70000]" : "bg-white bg-opacity-20 text-white"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Search Bar with Dropdown (inside .ap-search-row — yahan heart hidden rahega) */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <Select>
              <SelectTrigger className="h-12 bg-white border-0 text-gray-900">
                <SelectValue placeholder={`Select ${searchType}...`} />
              </SelectTrigger>
              <SelectContent>
                {getSearchOptions().map((option) => (
                  <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, "-")}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="h-12 px-6 bg-white text-[#C70000] hover:bg-gray-100">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between px-4 pb-3">
        <div className="flex space-x-2">
          <a href="/maps" className="px-3 py-1.5 bg-white text-[#C70000] rounded-md text-sm font-semibold hover:bg-red-50">MAPS</a>
        </div>
        <div className="flex space-x-2">
          <a href="/new-projects" className="px-3 py-1.5 bg-white text-[#C70000] rounded-md text-sm font-semibold hover:bg-red-50">NEW PROJECTS</a>
        </div>
      </div>
    </header>
  );
}
