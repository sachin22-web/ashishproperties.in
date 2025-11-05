// src/lib/reviewsApi.ts
type SubmitReviewArgs = {
  targetId: string;
  targetType: string; // "property"
  rating: number;
  title?: string;
  comment: string;
  token?: string | null;
};

export async function submitReview(args: SubmitReviewArgs) {
  const { targetId, targetType, rating, title, comment, token } = args;
  const t =
    token ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token");

  if (!t) {
    return { success: false, error: "Not authenticated" };
  }

  // ✅ IMPORTANT: use app-wide API helper (same as properties/conversations)
  const res = await (window as any).api(`reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${t}`,
    },
    body: {
      targetId,
      targetType,
      rating,
      title,
      comment,
    },
  });

  // window.api returns a normalized object
  if (res?.success || res?.ok) return res;
  return { success: false, error: res?.error || "Failed to submit review" };
}

export async function fetchReviews(targetId: string, targetType = "property") {
  // GET /reviews?targetId=...&targetType=...
  const res = await (window as any).api(
    `reviews?targetId=${encodeURIComponent(targetId)}&targetType=${encodeURIComponent(targetType)}`
  );
  return res;
}
