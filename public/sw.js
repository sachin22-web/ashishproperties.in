// public/sw.js  (FIXED)
const CACHE_NAME = "app-cache-v1";
const URLS_TO_CACHE = ["/", "/manifest.json", "/favicon.ico"]; 
// NOTE: /static/... paths ko abhi mat add karo; Vite/React build me hash names hote hain, missing file par install fail ho jata hai.

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(URLS_TO_CACHE);
      self.skipWaiting(); // new SW ko turant activate karne ke liye
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : undefined))
      );
      self.clients.claim(); // pages ko control me lo
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // API ya non-GET ko SW se bypass karo
  if (req.method !== "GET" || url.pathname.startsWith("/api/")) return;

  // HTML navigations: network-first, offline me cache fallback
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
          return res;
        } catch {
          return (await caches.match(req)) || (await caches.match("/"));
        }
      })()
    );
    return;
  }

  // Static assets: cache-first, then network
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      try {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone());
      } catch {}
      return res;
    })()
  );
});
