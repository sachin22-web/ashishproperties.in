import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  Bell,
  MessageSquare,
  Crown,
  User,
  Home,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

interface SellerNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  sender_role: string;
  sender_name: string;
  isRead: boolean;
  createdAt: string;
  source: string;
  priority?: string;
  propertyId?: string;
  propertyTitle?: string;
  conversationId?: string;
  unreadCount?: number;
}

interface NotificationsResponse {
  success: boolean;
  data: SellerNotification[];
  total: number;
  unreadCount: number;
}

export default function SellerNotifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => fetchNotifications(true), 10000);

    const handleNotificationUpdate = () => {
      console.log("🔔 Notification update event received");
      fetchNotifications(true);
    };

    window.addEventListener("adminNotification", handleNotificationUpdate);
    window.addEventListener("newMessage", handleNotificationUpdate);
    window.addEventListener("notificationUpdate", handleNotificationUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("adminNotification", handleNotificationUpdate);
      window.removeEventListener("newMessage", handleNotificationUpdate);
      window.removeEventListener("notificationUpdate", handleNotificationUpdate);
    };
  }, [token]);

  const fetchNotifications = async (silent = false) => {
    if (!token) return;
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);
      setError("");

      console.log("📬 Fetching seller notifications...");
      const response = await fetch("/api/seller/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data: NotificationsResponse = await response.json();
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        setError(data.error || "Failed to load notifications");
      }
    } catch (error: any) {
      console.error("❌ Network error fetching notifications:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!token) return;
    try {
      const response = await fetch(
        `/api/seller/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // ✅ DELETE notification
  const deleteNotification = async (notificationId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/seller/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log("🗑️ Notification deleted:", notificationId);
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notificationId)
        );
      } else {
        console.error("❌ Failed to delete notification:", await response.text());
      }
    } catch (error) {
      console.error("❌ Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "welcome":
      case "account":
        return <User className="h-5 w-5 text-blue-500" />;
      case "premium_offer":
      case "premium":
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case "property_inquiry":
      case "conversation":
        return <Home className="h-5 w-5 text-green-500" />;
      case "direct_message":
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case "admin_notification":
        return <Bell className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleNotificationClick = (notification: SellerNotification) => {
    if (!notification.isRead) markAsRead(notification.id);
    if (notification.conversationId)
      window.location.href = `/conversation/${notification.conversationId}`;
    else if (notification.propertyId)
      window.location.href = `/property/${notification.propertyId}`;
    else if (notification.type === "premium_offer")
      window.location.href = "/packages";
  };

  if (loading && notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Messages & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mr-3"></div>
            <span className="text-gray-600">Loading messages...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Messages & Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <Button
            onClick={() => fetchNotifications()}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
            <Button
              onClick={() => fetchNotifications()}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-500">
              When you receive messages or notifications, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-all relative ${
                  notification.isRead
                    ? "bg-white border-gray-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                {/* 🗑️ Delete button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6 p-0 text-red-600 hover:text-red-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>

                <div
                  onClick={() => handleNotificationClick(notification)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-sm font-medium ${
                            notification.isRead
                              ? "text-gray-900"
                              : "text-blue-900"
                          }`}
                        >
                          {notification.title}
                        </h4>
                      </div>
                      <p
                        className={`text-sm mt-1 ${
                          notification.isRead
                            ? "text-gray-600"
                            : "text-blue-800"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>From: {notification.sender_name}</span>
                        <span>{formatTimeAgo(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
