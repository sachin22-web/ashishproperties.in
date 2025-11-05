import React, { useEffect, useState } from "react";
import { fetchApprovedReviews, Review } from "../lib/reviewsApi";
import { formatDistanceToNow } from "date-fns";

type Props = {
  targetId: string;
  targetType?: "property" | "agent";
};

export default function ReviewsList({ targetId, targetType = "property" }: Props) {
  const [items, setItems] = useState<Review[]>([]);
  const [summary, setSummary] = useState<{ count: number; avg: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    fetchApprovedReviews(targetId, targetType)
      .then((res) => {
        if (!mounted) return;
        setItems(res.data || []);
        setSummary(res.summary || null);
      })
      .catch((e) => setErr(e?.message || "Failed to load reviews"))
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, [targetId, targetType]);

  if (loading) return <div className="py-4">Loading reviews…</div>;
  if (err) return <div className="py-4 text-red-600">{err}</div>;
  if (!items.length) return <div className="py-4">No reviews yet.</div>;

  return (
    <div className="space-y-3">
      {summary && (
        <div className="mb-2 text-sm">
          <b>{summary.avg?.toFixed(1) ?? "-"}</b> / 5 · {summary.count} reviews
        </div>
      )}
      {items.map((rv) => (
        <div key={rv._id} className="p-3 border rounded">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-500">
              {"★".repeat(rv.rating)}
              <span className="text-gray-300">{"★".repeat(5 - rv.rating)}</span>
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(rv.createdAt), { addSuffix: true })}
            </span>
          </div>
          {rv.title ? <div className="font-medium">{rv.title}</div> : null}
          <div className="text-sm text-gray-800 whitespace-pre-line">{rv.comment}</div>
        </div>
      ))}
    </div>
  );
}
