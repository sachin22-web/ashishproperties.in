import React, { useEffect, useState } from "react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";
import { Bell, Check, Trash2 } from "lucide-react";

interface UserNotification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead?: boolean;
}

export default function Notifications() {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/notifications", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems(data.data || []);
      } else {
        setError(data.error || "Failed to load notifications");
      }
    } catch (e) {
      setError("Network error loading notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/user/notifications/${id}/read`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    } catch {}
  };

  const remove = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/user/notifications/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setItems((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-4">Notifications</h1>
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => (
              <div
                key={n._id}
                className={`bg-white border rounded-lg p-4 flex items-start justify-between ${n.isRead ? "" : "border-[#C70000]"}`}
              >
                <div>
                  <h3 className="font-medium text-gray-900">
                    {n.title || "Notification"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n._id)}
                      className="p-2 rounded hover:bg-gray-100"
                      aria-label="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => remove(n._id)}
                    className="p-2 rounded hover:bg-gray-100"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
}
