import React, { useEffect, useState } from "react";
import { adminListPending, adminModerate, Review } from "../lib/reviewsApi";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

export default function AdminReviewsModeration() {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminListPending(1, 50, token);
      setItems(res.data || []);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to load pending reviews",
        description: e?.message || "Please try again.",
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function act(id: string, action: "approve" | "reject") {
    let note: string | undefined;
    if (action === "reject") {
      note = window.prompt("Reason (optional)") || undefined;
    }
    try {
      await adminModerate(id, action, note, token || undefined);
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast({
        title: action === "approve" ? "Approved" : "Rejected",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: e?.message || "Please try again.",
      });
    }
  }

  if (!user || user.role !== "admin") {
    return <div className="p-4">Admins only.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reviews Moderation</h1>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-600">No pending reviews.</div>
      ) : (
        <div className="grid gap-3">
          {items.map((r) => (
            <div key={r._id} className="rounded-xl shadow-sm border p-4 bg-white">
              <div className="flex justify-between mb-1">
                <div className="font-medium">
                  {r.userId ? `User: ${r.userId}` : "User"}
                </div>
                <div className="text-amber-500">
                  {"★".repeat(Math.max(1, Math.min(5, Number(r.rating) || 0)))}
                  <span className="text-gray-300">
                    {"★".repeat(Math.max(0, 5 - (Number(r.rating) || 0)))}
                  </span>
                </div>
              </div>

              {r.title ? <div className="text-sm font-semibold mb-1">{r.title}</div> : null}

              <div className="text-sm text-gray-700 whitespace-pre-line mb-2">
                {r.comment}
              </div>

              <div className="text-xs text-gray-500 mb-2">
                Target: <b>{r.targetType}</b> • {r.targetId}
                {r.createdAt
                  ? ` • ${formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}`
                  : null}
              </div>

              <div className="flex gap-2">
                <button
                  aria-label="Approve"
                  onClick={() => act(r._id, "approve")}
                  className="px-3 py-1 rounded-md bg-green-600 text-white text-sm"
                >
                  Approve
                </button>
                <button
                  aria-label="Reject"
                  onClick={() => act(r._id, "reject")}
                  className="px-3 py-1 rounded-md bg-red-600 text-white text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
