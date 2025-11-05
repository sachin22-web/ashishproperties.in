// client/lib/reviewsApi.ts
import { createApiUrl } from "./api";

export type ReviewPayload = {
  targetType?: "property" | "agent";
  targetId: string;
  rating: number;
  title?: string;
  comment: string;
};

function readCookie(name: string) {
  const m = document.cookie.match(
    new RegExp("(^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return m ? decodeURIComponent(m[2]) : "";
}

export function getClientToken(): string | undefined {
  try {
    // prefer explicit access token
    const ls =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("adminToken") ||
      "";

    const ck =
      readCookie("accessToken") ||
      readCookie("authToken") ||
      readCookie("token") ||
      "";

    return (ls || ck || undefined) as string | undefined;
  } catch {
    return undefined;
  }
}

function authHeader(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchReviews(
  targetId: string,
  targetType: "property" | "agent" = "property"
) {
  const url = createApiUrl(
    `/reviews?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(
      targetId
    )}`
  );
  const r = await fetch(url, { credentials: "include" });
  const j = await r.json();
  if (!r.ok || !j?.success) throw new Error(j?.error || "Failed to load reviews");
  return j as { success: true; data: any[]; summary: { count: number; avg: number } };
}

export async function fetchApprovedReviews(
  targetId: string,
  targetType: "property" | "agent" = "property"
) {
  return fetchReviews(targetId, targetType);
}

export async function submitReview(payload: ReviewPayload, token?: string) {
  const url = createApiUrl(`/reviews`);
  const t = token || getClientToken();
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(t) },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.success) throw new Error(j?.error || "Failed to submit review");
  return j;
}

// -------- Admin helpers (same endpoints as server) --------
export async function adminListPending(opts?: { signal?: AbortSignal }) {
  const url = createApiUrl(`/reviews/admin/pending`);
  const t = getClientToken();
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json", ...authHeader(t) },
    credentials: "include",
    signal: opts?.signal,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.success) throw new Error(j?.error || "Failed");
  return j.data || [];
}

export async function adminModerate(
  id: string,
  status: "approved" | "rejected",
  adminNote?: string
) {
  const url = createApiUrl(`/reviews/admin/${encodeURIComponent(id)}/moderate`);
  const t = getClientToken();
  const r = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader(t) },
    credentials: "include",
    body: JSON.stringify({
      action: status === "approved" ? "approve" : "reject",
      note: adminNote,
    }),
  });
  const j = await r.json().catch(() => ({}));
  return !!(r.ok && j?.success);
}
