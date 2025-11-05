import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Property } from "@shared/types";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Bell,
  Home,
  Eye,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  User,
  LogOut,
  MapPin,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Star,
  CreditCard,
  Package,
  Download,
  ExternalLink,
  Crown,
  Zap,
  Search as SearchIcon,
  Filter,
  Check,
  X,
} from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";

// --------------------------------------------------
// Types
// --------------------------------------------------
interface Notification {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  type: "approval" | "rejection" | "account" | "general" | string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  propertyId?: string | null;
  propertyTitle?: string;
  conversationId?: string | null;
  unreadCount?: number;
  source?:
    | "admin_notification"
    | "user_notification"
    | "conversation"
    | "direct_message"
    | string;
}

interface Message {
  _id: string;
  buyerId?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  message: string;
  propertyId?: string | null;
  propertyTitle: string;
  timestamp: string;
  isRead: boolean;
  source?: "chat" | "enquiry" | "direct" | string;
  conversationId?: string | null;
}

interface PackageT {
  _id: string;
  name: string;
  price: number;
  features: string[];
  duration: number; // days
  type: "basic" | "premium" | "elite";
}

interface Payment {
  _id: string;
  amount: number;
  package: string;
  status: "completed" | "pending" | "failed";
  date: string;
  transactionId: string;
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------
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
    if (fbAuth?.currentUser?.getIdToken)
      token = await fbAuth.currentUser.getIdToken(true);
  } catch {}
  return token;
}

// --------------------------------------------------
// Component
// --------------------------------------------------
export default function EnhancedSellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // UI state
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [packages, setPackages] = useState<PackageT[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Reply modal state
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");

  // NEW: Logout confirm modal state
  const [logoutOpen, setLogoutOpen] = useState(false);

  const openReplyModal = (m: Message) => {
    setReplyTarget(m);
    setReplyText(`Hi ${m.buyerName}, regarding ${m.propertyTitle}.`);
    setReplyModalOpen(true);
  };
  const closeReplyModal = () => {
    setReplyModalOpen(false);
    setReplyTarget(null);
    setReplyText("");
  };
  const handleReplyButtonClick = (m: Message) => {
    if (m.conversationId) {
      navigate(`/conversation/${m.conversationId}`);
      return;
    }
    openReplyModal(m);
  };

  const sendReply = async () => {
    try {
      const token = await getAuthToken();
      if (!token || !replyTarget) {
        toast.error("Session expired or invalid target. Please login again.");
        return;
      }
      const trimmed = replyText.trim();
      if (!trimmed) {
        toast.error("Please enter a reply message before sending.");
        return;
      }
      const body: Record<string, unknown> = { message: trimmed };
      if (replyTarget.source === "enquiry") body.enquiryId = replyTarget._id;
      if (replyTarget.buyerId) body.buyerId = replyTarget.buyerId;
      if (replyTarget.buyerPhone) body.buyerPhone = replyTarget.buyerPhone;
      if (replyTarget.propertyId) body.propertyId = replyTarget.propertyId;

      const res = await api.post("/seller/messages", body, token);
      if (res?.data?.success) {
        toast.success("Reply sent successfully");
        const newConversationId = res.data?.data?.conversationId as
          | string
          | null
          | undefined;
        closeReplyModal();
        await fetchDashboardData();
        if (newConversationId) navigate(`/conversation/${newConversationId}`);
      } else {
        toast.error("Failed to send reply");
      }
    } catch (e) {
      console.error("sendReply:", e);
      toast.error("Failed to send reply. Please try again.");
    }
  };

  // Filters for properties
  const [propSearch, setPropSearch] = useState("");
  const [propStatus, setPropStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >(() => {
    // Initialize from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("filter");
    if (
      tabParam === "pending" ||
      tabParam === "approved" ||
      tabParam === "rejected"
    ) {
      return tabParam;
    }
    return "all";
  });

  // Handler for clicking KPI cards to filter
  const handleKPIFilter = (
    filter: "all" | "pending" | "approved" | "rejected",
  ) => {
    setPropStatus(filter);
    setActiveTab("properties"); // Switch to properties tab
    // Update URL
    const url = new URL(window.location.href);
    if (filter === "all") {
      url.searchParams.delete("filter");
    } else {
      url.searchParams.set("filter", filter);
    }
    window.history.pushState({}, "", url.toString());
  };

  // Auto-switch to properties tab if URL has filter parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get("filter");
    if (
      filterParam &&
      (filterParam === "pending" ||
        filterParam === "approved" ||
        filterParam === "rejected")
    ) {
      setActiveTab("properties");
    }
  }, []);

  // Sync filter state with URL on browser navigation (Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const filterParam = urlParams.get("filter");
      if (
        filterParam === "pending" ||
        filterParam === "approved" ||
        filterParam === "rejected"
      ) {
        setPropStatus(filterParam);
        setActiveTab("properties");
      } else {
        setPropStatus("all");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Profile
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    pushNotifications: true,
  });

  // Stats
  const [stats, setStats] = useState({
    totalProperties: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    totalViews: 0,
    totalInquiries: 0,
    unreadNotifications: 0,
    unreadMessages: 0,
    profileViews: 0,
    premiumListings: 0,
  });

  // SSE connection ref
  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<number | null>(null);

  // --------------------------------------------------
  // Auth guards
  // --------------------------------------------------
  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (user.userType !== "seller") {
      navigate("/user-dashboard", { replace: true });
      return;
    }
    void fetchDashboardData();
    const handler = () => fetchDashboardData();
    window.addEventListener("properties:updated", handler as any);
    return () =>
      window.removeEventListener("properties:updated", handler as any);
  }, [user, navigate]);

  // --------------------------------------------------
  // Live updates: SSE + Polling fallback
  // --------------------------------------------------
  useEffect(() => {
    (async () => {
      const token = await getAuthToken();
      if (!token) return;

      if (sseRef.current) {
        try {
          sseRef.current.close();
        } catch {}
        sseRef.current = null;
      }

      try {
        const es = new EventSource(
          `/api/seller/stream?token=${encodeURIComponent(token)}`,
        );
        sseRef.current = es;

        es.addEventListener("error", () => {
          try {
            es.close();
          } catch {}
          sseRef.current = null;
          startPolling();
        });

        const refresh = () => fetchDashboardData();
        es.addEventListener("property:updated", refresh);
        es.addEventListener("notification:new", refresh);
        es.addEventListener("message:new", refresh);
      } catch {
        startPolling();
      }
    })();

    return () => {
      if (sseRef.current) {
        try {
          sseRef.current.close();
        } catch {}
      }
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startPolling() {
    if (pollRef.current) return;
    pollRef.current = window.setInterval(fetchDashboardData, 60000);
  }

  // --------------------------------------------------
  // Fetch all dashboard data
  // --------------------------------------------------
  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError("");
      const token = await getAuthToken();
      if (!token) {
        navigate("/auth", { replace: true });
        return;
      }

      const [
        propertiesRes,
        notificationsRes,
        messagesRes,
        packagesRes,
        paymentsRes,
      ] = await Promise.all([
        api.get("/seller/properties", token),
        api.get("/seller/notifications", token),
        api.get("/seller/messages", token),
        api.get("/seller/packages", token),
        api.get("/seller/payments", token),
      ]);

      if (propertiesRes?.data?.success)
        setProperties(propertiesRes.data.data || []);
      if (notificationsRes?.data?.success)
        setNotifications(notificationsRes.data.data || []);
      if (messagesRes?.data?.success) setMessages(messagesRes.data.data || []);
      if (packagesRes?.data?.success) setPackages(packagesRes.data.data || []);
      if (paymentsRes?.data?.success) setPayments(paymentsRes.data.data || []);
    } catch (err: any) {
      console.error("Dashboard load failed:", err);
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        alert("Your session has expired. Please login again.");
        [
          "token",
          "authToken",
          "accessToken",
          "userToken",
          "adminToken",
          "user",
          "adminUser",
        ].forEach((k) => localStorage.removeItem(k));
        navigate("/auth", { replace: true });
        return;
      }
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // Recompute stats when data changes
  // --------------------------------------------------
  useEffect(() => {
    const totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalInquiries = properties.reduce(
      (sum, p) => sum + (p.inquiries || 0),
      0,
    );
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    const unreadMessages = messages.filter((m) => !m.isRead).length;

    setStats({
      totalProperties: properties.length,
      pendingApproval: properties.filter((p) => p.approvalStatus === "pending")
        .length,
      approved: properties.filter((p) => p.approvalStatus === "approved")
        .length,
      rejected: properties.filter((p) => p.approvalStatus === "rejected")
        .length,
      totalViews,
      totalInquiries,
      unreadNotifications,
      unreadMessages,
      profileViews: 0,
      premiumListings: properties.filter((p) => (p as any).isPremium).length,
    });
  }, [properties, notifications, messages]);

  // --------------------------------------------------
  // Actions
  // --------------------------------------------------
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = await getAuthToken();
      await api.put(`/seller/notifications/${notificationId}/read`, {}, token!);
      setNotifications((ns) =>
        ns.map((n) => {
          const id = (n as any)._id || (n as any).id;
          return id === notificationId ? { ...n, isRead: true } : n;
        }),
      );
    } catch (e) {
      console.error("markNotificationAsRead:", e);
    }
  };

  const deleteNotification = async (
    notificationId: string,
    source?: string,
  ) => {
    const prev = notifications;
    setNotifications((ns) =>
      ns.filter((n) => ((n as any)._id || (n as any).id) !== notificationId),
    );

    const token = await getAuthToken();
    try {
      await api.delete(
        `/seller/notifications/${encodeURIComponent(notificationId)}`,
        token!,
      );
      return;
    } catch (err: any) {
      try {
        await api.post(
          `/seller/notifications/${encodeURIComponent(notificationId)}/delete`,
          { source },
          token!,
        );
        return;
      } catch (e2) {
        console.warn("Delete fallback failed:", e2);
        setNotifications(prev);
        toast.error("Delete failed. Please try again.");
      }
    }
  };

  const openChatFromNotification = async (n: Notification) => {
    try {
      if (n.conversationId) {
        navigate(`/conversation/${n.conversationId}`);
        return;
      }
      if (!n.propertyId) {
        toast.error("Chat link unavailable for this notification.");
        return;
      }
      const token = await getAuthToken();
      const res = await api.post(
        "/conversations/find-or-create",
        { propertyId: n.propertyId },
        token!,
      );
      const newId =
        (res as any)?.data?.data?._id ||
        (res as any)?.data?._id ||
        (res as any)?.data?.data?.conversationId ||
        (res as any)?.data?.conversationId;
      if (newId) navigate(`/conversation/${newId}`);
      else toast.error("Failed to open chat");
    } catch (e) {
      console.error("openChatFromNotification:", e);
      toast.error("Failed to open chat");
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm("Delete this property? This cannot be undone.")) return;
    try {
      const token = await getAuthToken();
      await api.delete(`/seller/properties/${id}`, token!);
      setProperties((ps) =>
        ps.filter((p: any) => (p._id || (p as any).id) !== id),
      );
    } catch (e) {
      console.error("delete property:", e);
      alert("Failed to delete property.");
    }
  };

  const handleResubmit = async (id: string) => {
    try {
      const token = await getAuthToken();
      await api.post(`/seller/properties/${id}/resubmit`, {}, token!);
      await fetchDashboardData();
      toast({
        title: "Property Resubmitted",
        description:
          "Your property has been resubmitted for review. Our team will review it shortly.",
        duration: 5000,
      });
    } catch (e) {
      console.error("resubmit:", e);
      toast({
        title: "Resubmission Failed",
        description: "Unable to resubmit the property. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejection":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "account":
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredProperties = useMemo(() => {
    let list = properties.slice();
    if (propStatus !== "all")
      list = list.filter((p) => p.approvalStatus === propStatus);
    if (propSearch.trim()) {
      const q = propSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location?.address?.toLowerCase?.().includes(q),
      );
    }
    return list;
  }, [properties, propStatus, propSearch]);

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------
  if (loading) {
    return (
      <div
        className="min-h-screen bg-gray-50 pb-28"
        style={{ paddingBottom: "calc(88px + env(safe-area-inset-bottom))" }}
      >
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
        <div className="h-24 sm:h-28" aria-hidden="true" />
        <BottomNavigation />
      </div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div
      className="min-h-screen bg-gray-50 pb-28"
      style={{ paddingBottom: "calc(88px + env(safe-area-inset-bottom))" }}
    >
      <OLXStyleHeader />

      <div className="container mx-auto px-4 py-6">
        {/* Header (mobile-friendly, no overlap) */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              Seller Dashboard
            </h1>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="w-full md:w-auto"
                onClick={() => setActiveTab("notifications")}
              >
                <Bell className="h-4 w-4" />
              </Button>
              {stats.unreadNotifications > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                  {stats.unreadNotifications}
                </span>
              )}
            </div>

            <Button
              onClick={fetchDashboardData}
              variant="outline"
              size="sm"
              className="w-full md:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            {/* CHANGED: open confirm dialog instead of direct logout */}
            <Button
              onClick={() => setLogoutOpen(true)}
              variant="outline"
              size="sm"
              className="w-full md:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleKPIFilter("all")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleKPIFilter("pending")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingApproval}
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleKPIFilter("approved")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.approved}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalViews}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.unreadMessages}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Profile Views
              </CardTitle>
              <Crown className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {stats.profileViews}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium</CardTitle>
              <Crown className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats.premiumListings}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inquiries</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalInquiries}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* FIXED: no horizontal scroll; proper chips in 2 rows on mobile */}
          <div className="mb-3">
            <TabsList
              className="
        block w-full h-auto rounded-md bg-muted p-1
      "
            >
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                <TabsTrigger
                  value="overview"
                  className="w-full py-2 text-xs sm:text-sm justify-center"
                >
                  Overview
                </TabsTrigger>

                <TabsTrigger
                  value="notifications"
                  className="relative w-full py-2 text-xs sm:text-sm justify-center"
                >
                  Notifications
                  {stats.unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] leading-4 rounded-full bg-red-500 text-white">
                      {stats.unreadNotifications}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="properties"
                  className="w-full py-2 text-xs sm:text-sm justify-center"
                >
                  My Properties
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="relative w-full py-2 text-xs sm:text-sm justify-center"
                >
                  Messages
                  {stats.unreadMessages > 0 && (
                    <Badge className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] leading-4 rounded-full bg-red-500 text-white">
                      {stats.unreadMessages}
                    </Badge>
                  )}
                </TabsTrigger>

                {/* 2nd row */}
                <TabsTrigger
                  value="insights"
                  className="w-full py-2 text-xs sm:text-sm justify-center"
                >
                  Insights
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="w-full py-2 text-xs sm:text-sm justify-center"
                >
                  Payments
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="w-full py-2 text-xs sm:text-sm justify-center"
                >
                  Settings
                </TabsTrigger>
                {/* <TabsTrigger value="blog" className="w-full py-2 text-xs sm:text-sm justify-center">Blog</TabsTrigger> */}
              </div>
            </TabsList>
          </div>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Link to="/post-property">
                    <Button className="w-full bg-[#C70000] hover:bg-[#A60000] text-white">
                      <Plus className="h-4 w-4 mr-2" /> Post New Property
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("properties")}
                  >
                    <Home className="h-4 w-4 mr-2" /> Manage Properties
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("messages")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" /> View Messages (
                    {stats.unreadMessages})
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("payments")}
                  >
                    <Crown className="h-4 w-4 mr-2" /> Upgrade to Premium
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Properties</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("properties")}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">
                      You haven't posted any properties yet
                    </p>
                    <Link to="/post-property">
                      <Button className="bg-[#C70000] hover:bg-[#A60000] text-white">
                        <Plus className="h-4 w-4 mr-2" /> Post Your First
                        Property
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {properties.slice(0, 3).map((property: any, idx) => (
                      <div
                        key={
                          property._id || property.id || property.title || idx
                        }
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {property.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              <MapPin className="inline h-3 w-3 mr-1" />
                              {property.location?.address}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-lg font-bold text-[#C70000]">
                                ₹{Number(property.price).toLocaleString()}
                              </span>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Eye className="h-3 w-3" />
                                <span>{property.views || 0} views</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <MessageSquare className="h-3 w-3" />
                                <span>{property.inquiries || 0} inquiries</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(property.approvalStatus)}
                            {property.isPremium && (
                              <Badge className="bg-amber-100 text-amber-800">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                  {stats.unreadNotifications > 0 && (
                    <Badge className="bg-red-500 text-white">
                      {stats.unreadNotifications} unread
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n, idx) => {
                      const id = (n as any)._id || (n as any).id;
                      return (
                        <div
                          key={id || n.title || idx}
                          className={`border rounded-lg p-4 transition-all duration-200 ${
                            n.isRead
                              ? "bg-gray-50"
                              : "bg-blue-50 border-blue-200"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              {getNotificationIcon(n.type)}
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {n.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {n.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {new Date(n.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {(n.conversationId || n.propertyId) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openChatFromNotification(n)}
                                >
                                  Open Chat
                                </Button>
                              )}

                              {!n.isRead && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (!id)
                                      return toast.error(
                                        "Notification id missing",
                                      );
                                    markNotificationAsRead(id);
                                  }}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (!id)
                                    return toast.error(
                                      "Notification id missing",
                                    );
                                  deleteNotification(id, n.source);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties */}
          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <CardTitle className="flex items-center space-x-2">
                  <Home className="h-5 w-5" />
                  <span>My Posted Properties</span>
                </CardTitle>
                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Input
                        value={propSearch}
                        onChange={(e) => setPropSearch(e.target.value)}
                        placeholder="Search by title / address..."
                        className="pl-8"
                      />
                      <SearchIcon className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <select
                        className="border rounded-md px-2 py-1 text-sm"
                        value={propStatus}
                        onChange={(e) => setPropStatus(e.target.value as any)}
                      >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  <Link to="/post-property">
                    <Button className="bg-[#C70000] hover:bg-[#A60000]">
                      <Plus className="h-4 w-4 mr-2" /> Add New Property
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent>
                {filteredProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">No properties found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Inquiries</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProperties.map((property: any, idx) => {
                        const id = property._id || property.id;
                        return (
                          <TableRow
                            key={id || property.title || idx}
                            className={
                              property.approvalStatus === "rejected"
                                ? "bg-red-50"
                                : ""
                            }
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {property.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Posted{" "}
                                  {new Date(
                                    property.createdAt,
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-[#C70000]">
                                ₹{Number(property.price).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {property.location?.address}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                {getStatusBadge(property.approvalStatus)}
                                {property.approvalStatus === "rejected" && (
                                  <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                                    {property.rejectionReason && (
                                      <div>
                                        <p className="text-xs font-semibold text-red-800 mb-1">
                                          Rejection Reason:
                                        </p>
                                        <p className="text-xs text-red-700">
                                          {property.rejectionReason}
                                        </p>
                                      </div>
                                    )}
                                    {!property.rejectionReason && (
                                      <p className="text-xs text-red-700">
                                        Property rejected by admin
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-3 w-3" />
                                <span>{property.views || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{property.inquiries || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Link to={`/property/${id}`} target="_blank">
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </Link>
                                <Link to={`/post-property?edit=${id}`}>
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteProperty(id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                                {property.approvalStatus === "rejected" && (
                                  <Button
                                    size="sm"
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                    onClick={() => handleResubmit(id)}
                                    title="Click to resubmit this property for review. You can edit the property before resubmitting."
                                  >
                                    Resubmit
                                  </Button>
                                )}
                                {property.isPremium && (
                                  <Badge className="ml-1 bg-amber-100 text-amber-800">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Messages Center</span>
                  {stats.unreadMessages > 0 && (
                    <Badge className="bg-red-500 text-white">
                      {stats.unreadMessages} unread
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m, idx) => (
                      <div
                        key={m._id || m.timestamp || idx}
                        className={`border rounded-lg p-4 ${
                          m.isRead ? "bg-gray-50" : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {m.buyerName}
                              </h4>
                              {m.buyerEmail && (
                                <Badge variant="outline" className="text-xs">
                                  {m.buyerEmail}
                                </Badge>
                              )}
                              {m.buyerPhone && (
                                <Badge variant="outline" className="text-xs">
                                  {m.buyerPhone}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {m.message}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <span>Property: {m.propertyTitle}</span>
                              <span>
                                {new Date(m.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {m.buyerPhone && (
                              <>
                                <a
                                  href={`tel:${m.buyerPhone}`}
                                  className="inline-flex"
                                >
                                  <Button size="sm" variant="outline">
                                    Call
                                  </Button>
                                </a>
                                <a
                                  href={`https://wa.me/${(m.buyerPhone || "").replace(/\D/g, "")}?text=${encodeURIComponent(
                                    `Hi ${m.buyerName}, regarding ${m.propertyTitle}`,
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex"
                                >
                                  <Button size="sm" variant="outline">
                                    WhatsApp
                                  </Button>
                                </a>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReplyButtonClick(m)}
                            >
                              {m.conversationId ? "Open Chat" : "Reply"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Post Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Profile Views</span>
                      <span className="font-bold text-blue-600">
                        {stats.profileViews}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Property Views</span>
                      <span className="font-bold text-green-600">
                        {stats.totalViews}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Interested Buyers</span>
                      <span className="font-bold text-purple-600">
                        {stats.totalInquiries}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Premium Listings</span>
                      <span className="font-bold text-amber-600">
                        {stats.premiumListings}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Enhance Visibility</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Upgrade to premium to get more visibility and better reach
                      for your properties.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">Featured listings</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">
                          Priority in search results
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">10x more visibility</span>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-amber-500 hover:bg-amber-600"
                      onClick={() => setActiveTab("payments")}
                    >
                      <Crown className="h-4 w-4 mr-2" /> Upgrade to Premium
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Blog */}
          <TabsContent value="blog" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Blog</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Link to="/seller/blog">
                    <Button className="bg-[#C70000] hover:bg-[#A60000] text-white">
                      Create Blog Post
                    </Button>
                  </Link>
                  <Link to="/seller/blog">
                    <Button variant="outline">My Posts</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Available Packages</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {packages.map((pkg, idx) => (
                      <div
                        key={(pkg as any)._id || pkg.name || idx}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-lg">{pkg.name}</h3>
                          <Badge
                            className={
                              pkg.type === "elite"
                                ? "bg-purple-100 text-purple-800"
                                : pkg.type === "premium"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                            }
                          >
                            {pkg.type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-[#C70000] mb-3">
                          ₹{pkg.price.toLocaleString()}{" "}
                          <span className="text-sm text-gray-500">
                            /{pkg.duration} days
                          </span>
                        </div>
                        <div className="space-y-1 mb-4">
                          {pkg.features.map((feature, i) => (
                            <div
                              key={`${pkg._id}-${feature}-${i}`}
                              className="flex items-center space-x-2"
                            >
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                        <Button
                          className="w-full bg-[#C70000] hover:bg-[#A60000]"
                          onClick={() => navigate("/advertise")}
                        >
                          Purchase Package
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">No payments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payments.map((p, idx) => (
                        <div
                          key={(p as any)._id || p.transactionId || idx}
                          className="border rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{p.package}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(p.date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                Transaction ID: {p.transactionId}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-[#C70000]">
                                ₹{p.amount.toLocaleString()}
                              </div>
                              <Badge
                                className={
                                  p.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : p.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }
                              >
                                {p.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Invoice
                            </Button>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData((p) => ({ ...p, email: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        const token = await getAuthToken();
                        await api.put(
                          "/seller/profile",
                          {
                            name: profileData.name,
                            email: profileData.email,
                            phone: profileData.phone,
                            emailNotifications: profileData.emailNotifications,
                            pushNotifications: profileData.pushNotifications,
                          },
                          token!,
                        );
                        setError("");
                        alert("Profile updated");
                      } catch {
                        setError("Failed to update profile");
                      }
                    }}
                    className="w-full"
                  >
                    Update Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Security & Notifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) =>
                        setProfileData((p) => ({
                          ...p,
                          currentPassword: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) =>
                        setProfileData((p) => ({
                          ...p,
                          newPassword: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) =>
                        setProfileData((p) => ({
                          ...p,
                          confirmPassword: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (
                        profileData.newPassword !== profileData.confirmPassword
                      )
                        return setError("New passwords do not match");
                      try {
                        const token = await getAuthToken();
                        await api.put(
                          "/seller/change-password",
                          {
                            currentPassword: profileData.currentPassword,
                            newPassword: profileData.newPassword,
                          },
                          token!,
                        );
                        setProfileData((p) => ({
                          ...p,
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        }));
                        setError("");
                        alert("Password changed");
                      } catch {
                        setError("Failed to change password");
                      }
                    }}
                    className="w-full mb-4"
                  >
                    Change Password
                  </Button>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailNotifications">
                        Email Notifications
                      </Label>
                      <Switch
                        id="emailNotifications"
                        checked={profileData.emailNotifications}
                        onCheckedChange={(checked) =>
                          setProfileData((p) => ({
                            ...p,
                            emailNotifications: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pushNotifications">
                        Push Notifications
                      </Label>
                      <Switch
                        id="pushNotifications"
                        checked={profileData.pushNotifications}
                        onCheckedChange={(checked) =>
                          setProfileData((p) => ({
                            ...p,
                            pushNotifications: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => setLogoutOpen(true)}
                    variant="destructive"
                    className="w-full mt-4 mb-6"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reply Modal */}
      <Dialog
        open={replyModalOpen}
        onOpenChange={(o) => {
          if (!o) closeReplyModal();
          else setReplyModalOpen(Boolean(o));
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to {replyTarget?.buyerName}</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <p className="text-sm text-gray-500 mb-2">
              Property: {replyTarget?.propertyTitle}
            </p>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded p-2"
            />
            <div className="flex justify-end mt-3 space-x-2">
              <Button variant="outline" onClick={closeReplyModal}>
                Cancel
              </Button>
              <Button onClick={sendReply} className="bg-[#C70000] text-white">
                Send Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Logout Confirmation Modal */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Are you sure you want to logout?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              No
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Yes, Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reserve space so bottom content isn't hidden by the fixed nav */}
      <div className="h-24 sm:h-28" aria-hidden="true" />
      <BottomNavigation />
    </div>
  );
}
