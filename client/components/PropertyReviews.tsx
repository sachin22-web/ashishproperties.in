import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";

interface Testimonial {
  _id?: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function PropertyReviews({ propertyId }: { propertyId: string }) {
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/testimonials?propertyId=${encodeURIComponent(propertyId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setReviews(data.data);
          } else {
            setReviews([]);
          }
        } else {
          setReviews([]);
        }
      } catch (e) {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    if (propertyId) fetchReviews();
  }, [propertyId]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((a, r) => a + (r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  if (loading) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Reviews</h3>
        <div className="flex items-center space-x-1 text-yellow-600">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm font-medium">{avgRating || "0"}</span>
          <span className="text-xs text-gray-500">({reviews.length})</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-600">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="border rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-sm">{r.name || "User"}</div>
                <div className="flex items-center space-x-1 text-yellow-600">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < (r.rating || 0) ? "fill-current" : ""}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{r.comment}</p>
              <div className="text-xs text-gray-400 mt-2">
                {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
