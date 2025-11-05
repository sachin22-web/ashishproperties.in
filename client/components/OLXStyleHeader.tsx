import React, { useEffect, useState } from "react";
import {
  Search,
  Heart,
  Menu,
  Bell,
  MapPin,
  Clock,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ROHTAK_AREAS } from "@shared/types";
import MenuDashboard from "./MenuDashboard";
import { useNotificationsUnread } from "../hooks/useNotificationsUnread";

export default function OLXStyleHeader() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("recent_searches") || "[]");
    } catch {
      return [];
    }
  });
  const unread = useNotificationsUnread();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const normalizeSector = (q: string) => {
    const m = q.toLowerCase().match(/^(sec|sector)\s*-?\s*(\d+[a-zA-Z]?)$/);
    if (m) return `Sector-${m[2]}`;
    return q;
  };

  const pickSuggestion = (text: string) => {
    const city = "Rohtak";
    const sector = normalizeSector(text);
    try {
      const payload = { city, sector, lat: null, lng: null };
      sessionStorage.setItem("selected_location", JSON.stringify(payload));
      const next = [text, ...recent.filter((r) => r !== text)].slice(0, 5);
      setRecent(next);
      localStorage.setItem("recent_searches", JSON.stringify(next));
    } catch {}
    window.location.href = `/properties?search=${encodeURIComponent(`${sector}, ${city}`)}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) pickSuggestion(searchQuery.trim());
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    window.location.href = `/properties?search=${encodeURIComponent(suggestion)}`;
  };

  const filteredAreas = ROHTAK_AREAS.filter((area) =>
    area.toLowerCase().includes(debouncedQuery.toLowerCase()),
  );
  const suggestions = (
    debouncedQuery ? filteredAreas : [...recent, ...ROHTAK_AREAS.slice(0, 5)]
  ).slice(0, 20);

  const handleFavoritesClick = () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirectTo=${encodeURIComponent("/wishlist")}`;
    } else {
      window.location.href = "/wishlist";
    }
  };

  return (
    <header className="bg-[#C70000] border-b border-red-800 sticky top-0 z-40">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            className="p-2 hover:bg-red-700 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 text-white" />
          </button>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-white">Ashish Properties</div>
          </div>

          {/* Actions: Heart (wishlist) to the LEFT of Bell (notifications) */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleFavoritesClick}
              className="p-2 hover:bg-red-700 rounded-lg transition-colors text-white"
              aria-label="Wishlist"
            >
              <Heart className="h-6 w-6" />
            </button>

            <button
              onClick={() => (window.location.href = "/notifications")}
              className="relative p-2 hover:bg-red-700 rounded-lg transition-colors text-white"
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-[#C70000] text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <form
            onSubmit={handleSearch}
            className="relative"
            onKeyDown={(e) => {
              if (!showSuggestions || suggestions.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter" && activeIndex >= 0) {
                e.preventDefault();
                pickSuggestion(suggestions[activeIndex]);
                setShowSuggestions(false);
              }
            }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-200" />
              <input
                type="text"
                placeholder="Search properties in Rohtak..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveIndex(-1);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                className="w-full pl-10 pr-4 py-3 border-2 border-white border-opacity-30 rounded-lg focus:border-white focus:outline-none text-white placeholder-white placeholder-opacity-70 bg-white bg-opacity-20 backdrop-blur-sm"
              />
              {/* (Heart removed from inside the input) */}
            </div>

            {/* Search Suggestions */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-64 overflow-y-auto w-full">
                {!debouncedQuery && recent.length > 0 && (
                  <div className="p-2 border-b border-gray-100">
                    <div className="text-xs text-gray-500 mb-2 px-2 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Recent</span>
                    </div>
                    {recent.map((r) => (
                      <button
                        key={`recent-${r}`}
                        type="button"
                        onClick={() => pickSuggestion(r)}
                        className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded flex items-center space-x-2 min-h-11 whitespace-normal break-words"
                      >
                        <MapPin className="h-4 w-4 text-[#C70000]" />
                        <span className="text-gray-900">{r}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-2">
                  {!debouncedQuery && (
                    <div className="text-xs text-gray-500 mb-2 px-2">
                      Popular nearby
                    </div>
                  )}
                  {suggestions.map((area, idx) => (
                    <button
                      key={`sugg-${area}-${idx}`}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => pickSuggestion(area)}
                      className={`w-full text-left px-3 py-3 rounded flex items-center space-x-2 min-h-11 whitespace-normal break-words ${
                        activeIndex === idx ? "bg-gray-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <MapPin className="h-4 w-4 text-[#C70000]" />
                      <span className="text-gray-900">{area}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="bg-white w-80 h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {isAuthenticated ? "Dashboard" : "Menu"}
              </h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {isAuthenticated ? (
              <MenuDashboard onClose={() => setIsMenuOpen(false)} />
            ) : (
              <div className="p-4">
                <nav className="space-y-2 mb-8">
                  <a href="/" className="block px-4 py-3 hover:bg-gray-100 rounded-lg text-gray-700">
                    Home
                  </a>
                  <a href="/categories" className="block px-4 py-3 hover:bg-gray-100 rounded-lg text-gray-700">
                    Categories
                  </a>
                  <a href="/post-property" className="block px-4 py-3 hover:bg-gray-100 rounded-lg text-gray-700">
                    Sell
                  </a>
                  <a href="/my-account" className="block px-4 py-3 hover:bg-gray-100 rounded-lg text-gray-700">
                    My Account
                  </a>
                </nav>

                <div className="pt-6 border-t border-gray-200">
                  <a
                    href="/auth"
                    className="block px-4 py-3 text-[#C70000] font-semibold hover:bg-red-50 rounded-lg"
                  >
                    Login / Sign Up
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
