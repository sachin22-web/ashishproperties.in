



import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { Property } from "@shared/types";
import { api } from "../lib/api";
import { Badge } from "./ui/badge";
import {
  Plus, Home, Eye, MessageSquare, Heart, User, Settings, LogOut,
  Users, Briefcase, ArrowRight, Edit,
} from "lucide-react";

interface MenuDashboardProps { onClose: () => void; }

type Stats = {
  totalProperties: number;
  pendingApproval: number;
  approved: number;
  totalViews: number;
  totalInquiries: number;
  unreadNotifications: number;
  totalClients: number;
  closedDeals: number;
  commission: number;
  favorites: number;
  recentViews: number;
};

const EMPTY: Stats = {
  totalProperties: 0, pendingApproval: 0, approved: 0,
  totalViews: 0, totalInquiries: 0, unreadNotifications: 0,
  totalClients: 0, closedDeals: 0, commission: 0,
  favorites: 0, recentViews: 0,
};

// ---- token helper (same as dashboard) ----
async function getAuthToken(): Promise<string | null> {
  let token: string | null =
    localStorage.getItem("userToken") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    null;

  if (!token) {
    try {
      const u =
        JSON.parse(localStorage.getItem("user") || "null") ||
        JSON.parse(localStorage.getItem("adminUser") || "null");
      token = u?.token || null;
    } catch {}
  }
  try {
    // @ts-ignore
    const fbAuth = (window as any)?.firebaseAuth || undefined;
    if (fbAuth?.currentUser?.getIdToken) token = await fbAuth.currentUser.getIdToken(true);
  } catch {}
  return token;
}

// ---- tailwind-safe color map ----
const C = {
  blue:   { box: "bg-blue-50",   val: "text-blue-600",   lbl: "text-blue-700" },
  green:  { box: "bg-green-50",  val: "text-green-600",  lbl: "text-green-700" },
  yellow: { box: "bg-yellow-50", val: "text-yellow-600", lbl: "text-yellow-700" },
  purple: { box: "bg-purple-50", val: "text-purple-600", lbl: "text-purple-700" },
  orange: { box: "bg-orange-50", val: "text-orange-600", lbl: "text-orange-700" },
  red:    { box: "bg-red-50",    val: "text-red-600",    lbl: "text-red-700" },
} as const;

function StatBox({
  color, label, value,
}: { color: keyof typeof C; label: string; value: string | number; }) {
  const k = C[color];
  return (
    <div className={`${k.box} p-3 rounded-lg text-center`}>
      <div className={`text-lg font-bold ${k.val}`}>{value}</div>
      <div className={`text-xs ${k.lbl}`}>{label}</div>
    </div>
  );
}

export default function MenuDashboard({ onClose }: MenuDashboardProps) {
  const { user, logout } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [loading, setLoading] = useState(true);

  // mount/abort guards
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  // cache key + hydrate (but only if not all zeros)
  const cacheKey = user ? `menuStats:${user._id || (user as any).id || "me"}:${user.userType}` : "";
  useEffect(() => {
    if (!cacheKey) return;
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return;
    try {
      const { t, data } = JSON.parse(raw) as { t: number; data: Stats };
      const age = Date.now() - t;
      const nonTrivial = Object.values(data).some(v => Number(v) > 0);
      if (age < 2 * 60 * 1000 && nonTrivial) setStats(data);
    } catch {}
  }, [cacheKey]);

  const saveCache = useCallback((data: Stats) => {
    if (!cacheKey) return;
    const nonTrivial = Object.values(data).some(v => Number(v) > 0);
    if (!nonTrivial) return; // don't cache all-zeros
    sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data }));
  }, [cacheKey]);

  // allow external refresh
  useEffect(() => {
    const fn = () => void fetchAll();
    window.addEventListener("seller:dashboard:refresh", fn as any);
    return () => window.removeEventListener("seller:dashboard:refresh", fn as any);
  }, []);

  useEffect(() => { fetchAll(); }, [user]);

  async function fetchAll() {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!user || !token) { setLoading(false); return; }

      // parallel calls (some may fail)
      const results = await Promise.allSettled([
        api.get("/seller/properties", token),
        api.get("/seller/notifications?unread=1", token),
        api.get("/seller/stats", token), // optional; will be used to override
      ]);

      // properties
      let props: Property[] = [];
      const rProps = results[0];
      if (rProps.status === "fulfilled" && rProps.value?.data?.success) {
        props = (rProps.value.data.data || []) as Property[];
      }

      // compute stats from properties (fallback that always works)
      const computed: Stats = {
        ...EMPTY,
        totalProperties: props.length,
        pendingApproval: props.filter(p => p.approvalStatus === "pending").length,
        approved: props.filter(p => p.approvalStatus === "approved").length,
        totalViews: props.reduce((s, p) => s + (p.views || 0), 0),
        totalInquiries: props.reduce((s, p) => s + (p.inquiries || 0), 0),
      };

      // unread notifications
      const rNoti = results[1];
      if (rNoti.status === "fulfilled" && rNoti.value?.data?.success) {
        const arr = rNoti.value.data.data || [];
        computed.unreadNotifications = Array.isArray(arr) ? arr.length : Number(arr) || 0;
      }

      // optional /seller/stats override (use only if exists)
      const rStats = results[2];
      if (rStats.status === "fulfilled" && rStats.value?.data?.success && rStats.value.data.data) {
        const s = rStats.value.data.data;
        computed.totalProperties = s.totalProperties ?? computed.totalProperties;
        computed.pendingApproval = s.pendingApproval ?? computed.pendingApproval;
        computed.approved = s.approved ?? computed.approved;
        computed.totalViews = s.totalViews ?? computed.totalViews;
        computed.totalInquiries = s.totalInquiries ?? computed.totalInquiries;
        computed.unreadNotifications = s.unreadNotifications ?? computed.unreadNotifications;
      }

      // agent/buyer extras
      if (user.userType === "agent") {
        computed.totalClients = 25; // replace with /agent/stats when available
        computed.closedDeals = 12;
        computed.commission = 450000;
      } else if (user.userType === "buyer") {
        // if you store favorites on user
        // @ts-ignore
        computed.favorites = (user?.favorites?.length as number) || 0;
        computed.recentViews = 5;
      }

      if (!mounted.current) return;
      setProperties(props);
      setStats(computed);
      saveCache(computed);
    } catch (e) {
      console.error("Sidebar fetch failed:", e);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  const handleLogout = () => {
    logout();
    onClose();
    window.location.href = "/";
  };

  const go = (path: string) => { onClose(); window.location.href = path; };

  const getDash = () => {
    switch (user?.userType) {
      case "seller": return "/enhanced-seller-dashboard";
      case "agent": return "/agent-dashboard";
      case "buyer": return "/buyer-dashboard";
      case "admin": return "/admin";
      default: return "/user-dashboard";
    }
  };

  if (loading) {
    return (
      <div className="fixed left-0 top-0 w-80 h-full bg-white flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg z-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Profile */}
        <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200">
          <div className="w-12 h-12 bg-[#C70000] rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{user?.name}</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {user?.userType?.charAt(0).toUpperCase() + user?.userType?.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats */}
        {user?.userType === "seller" && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatBox color="blue" label="Total Listings" value={stats.totalProperties} />
            <StatBox color="green" label="Approved" value={stats.approved} />
            <StatBox color="yellow" label="Pending" value={stats.pendingApproval} />
            <StatBox color="purple" label="Total Views" value={stats.totalViews} />
          </div>
        )}
        {user?.userType === "agent" && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatBox color="blue" label="Active Listings" value={stats.totalProperties} />
            <StatBox color="green" label="Total Clients" value={stats.totalClients} />
            <StatBox color="purple" label="Closed Deals" value={stats.closedDeals} />
            <StatBox color="orange" label="Commission" value={`₹${(stats.commission/1000).toFixed(0)}K`} />
          </div>
        )}
        {user?.userType === "buyer" && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatBox color="red" label="Favorites" value={stats.favorites} />
            <StatBox color="blue" label="Recent Views" value={stats.recentViews} />
            <StatBox color="green" label="Saved Searches" value={"2"} />
            <StatBox color="purple" label="Inquiries" value={"3"} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
          {[
            ...(user?.userType === "seller"
              ? [
                  { icon: <Plus className="h-4 w-4" />, label: "Post Property", path: "/post-property" },
                  { icon: <Home className="h-4 w-4" />, label: "My Properties", path: "/my-properties" },
                  { icon: <Edit className="h-4 w-4" />, label: "Blog", path: "/seller/blog" },
                ]
              : user?.userType === "agent"
              ? [
                  { icon: <Plus className="h-4 w-4" />, label: "Add Listing", path: "/post-property" },
                  { icon: <Users className="h-4 w-4" />, label: "Clients", path: "/clients" },
                ]
              : user?.userType === "buyer"
              ? [
                  { icon: <Heart className="h-4 w-4" />, label: "Wishlist", path: "/wishlist" },
                  { icon: <Eye className="h-4 w-4" />, label: "Recent Views", path: "/recent-views" },
                ]
              : []),
            { icon: <Settings className="h-4 w-4" />, label: "Settings", path: "/settings" },
            { icon: <MessageSquare className="h-4 w-4" />, label: "Messages", path: "/messages" },
          ].map((a, i) => (
            <button
              key={i}
              onClick={() => go(a.path)}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg text-left transition-colors"
            >
              {a.icon}
              <span className="text-sm">{a.label}</span>
              <ArrowRight className="h-3 w-3 ml-auto" />
            </button>
          ))}
        </div>

        {/* Recent Listings */}
        {(user?.userType === "seller" || user?.userType === "agent") && properties.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Listings</h4>
            <div className="space-y-2">
              {properties.slice(0, 3).map((property) => (
                <div key={(property as any)._id || (property as any).id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                    <Home className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{property.title}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>₹{Number(property.price).toLocaleString()}</span>
                      <span>•</span>
                      <span>{property.views || 0} views</span>
                    </div>
                  </div>
                  <Badge
                    variant={property.approvalStatus === "approved" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {property.approvalStatus}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <button
            onClick={() => go(getDash())}
            className="w-full bg-[#C70000] hover:bg-[#A60000] text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
          >
            View Full Dashboard
          </button>
        </div>

        <div className="space-y-1 mb-4 border-t border-gray-200 pt-4">
          <button onClick={() => go("/")} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm">Home</button>
          <button onClick={() => go("/categories")} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm">Categories</button>
          <button onClick={() => go("/properties")} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm">Browse Properties</button>
        </div>

        <div className="border-t border-gray-200 mt-6 pt-4 pb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 text-[#C70000] hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
