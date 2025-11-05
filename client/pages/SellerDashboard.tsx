import React, { useEffect, useMemo, useState } from "react";
import { Check, X, Bell, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { api } from "../lib/api";

/** Adjust this to your backend shape if needed */
export interface SellerNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  sender_role?: string;
  sender_name?: string;
  isRead: boolean;
  createdAt: string;
  source?: string;
  priority?: string;
  propertyId?: string;
  propertyTitle?: string;
  conversationId?: string;
}

export default function SellerNotifications() {
  const [items, setItems] = useState<SellerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [actingId, setActingId] = useState<string | null>(null);

  const token = useMemo(() => localStorage.getItem("token") || "", []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // Primary endpoint
        let res: any = await api.get("/user/notifications", token);
        // Fallback endpoint if your API is different
        if (!res?.data?.success || !Array.isArray(res?.data?.data)) {
          res = await api.get("/notifications", token);
        }

        if (mounted) {
          const list = (res?.data?.data || []) as SellerNotification[];
          // sort newest first
          list.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setItems(list);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load notifications.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  const formatWhen = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const markRead = async (id: string) => {
    setActingId(id);
    // optimistic
    const prev = items;
    setItems((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      // try primary
      if ((api as any).post) {
        await api.post(`/user/notifications/${id}/read`, {}, token);
      } else {
        // unlikely, but keep it safe
        await (api as any).put?.(`/user/notifications/${id}/read`, {}, token);
      }
    } catch {
      // fallback path style
      try {
        await api.post(`/notifications/${id}/read`, {}, token);
      } catch {
        // revert if both fail
        setItems(prev);
      }
    } finally {
      setActingId(null);
    }
  };

  const deleteOne = async (id: string) => {
    setActingId(id);
    // optimistic remove
    const prev = items;
    setItems((list) => list.filter((n) => n.id !== id));
    try {
      // Try DELETE first (if your api helper exposes .delete)
      if ((api as any).delete) {
        await (api as any).delete(`/user/notifications/${id}`, token);
      } else if ((api as any).del) {
        await (api as any).del(`/user/notifications/${id}`, token);
      } else {
        // Fallback to POST-based delete
        await api.post(`/user/notifications/${id}/delete`, {}, token);
      }
    } catch {
      // Try alternate route shape
      try {
        if ((api as any).delete) {
          await (api as any).delete(`/notifications/${id}`, token);
        } else if ((api as any).del) {
          await (api as any).del(`/notifications/${id}`, token);
        } else {
          await api.post(`/notifications/${id}/delete`, {}, token);
        }
      } catch {
        // Revert if still failing
        setItems(prev);
      }
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Bell className="h-5 w-5 text-gray-700" />
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="animate-spin w-5 h-5 border-2 border-[#C70000] border-t-transparent rounded-full" />
            Loading notifications…
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-700" />
          <CardTitle>Notifications</CardTitle>
          <Badge variant="outline">
            {items.filter((n) => !n.isRead).length} unread
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3">
            {error}
          </div>
        )}

        {items.length === 0 && (
          <div className="text-gray-600">No notifications yet.</div>
        )}

        {items.map((n) => (
          <div
            key={n.id}
            className={`relative rounded-lg border ${
              n.isRead ? "bg-white" : "bg-blue-50"
            } p-4`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-gray-900">
                    {n.title || n.sender_name || "Notification"}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="shrink-0 flex items-center gap-2">
                    {/* Mark as read */}
                    <button
                      aria-label="Mark as read"
                      title="Mark as read"
                      disabled={actingId === n.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(n.id);
                      }}
                      className="pointer-events-auto inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>

                    {/* DELETE */}
                    <button
                      aria-label="Delete"
                      title="Delete"
                      disabled={actingId === n.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOne(n.id);
                      }}
                      className="pointer-events-auto inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-2 py-1 hover:bg-red-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {n.message && (
                  <div className="mt-1 text-gray-700">{n.message}</div>
                )}

                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatWhen(n.createdAt)}</span>
                  {n.type && (
                    <>
                      <span>•</span>
                      <span className="uppercase">{n.type}</span>
                    </>
                  )}
                  {!n.isRead && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        Unread
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
