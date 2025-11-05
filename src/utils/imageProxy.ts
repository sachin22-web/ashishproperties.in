// src/utils/imageProxy.ts
export function proxiedImage(raw?: string) {
  if (!raw) return "/placeholder.svg";
  const url = raw.trim();

  if (url.startsWith("/uploads/") || url.startsWith("/server/uploads/")) {
    return url.replace("/server/uploads/", "/uploads/");
  }
  if (url.startsWith("/extimg/")) return url;

  try {
    const u = new URL(url); // absolute
    const scheme = u.protocol.replace(":", "");
    return `/extimg/${scheme}/${u.host}${u.pathname}${u.search}`;
  } catch {
    // relative like: images.unsplash.com/photo.jpg?x=1
    if (/^[a-z0-9.-]+\//i.test(url)) return `/extimg/https/${url}`;
    return url;
  }
}
