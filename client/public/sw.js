self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('ap-cache-v1').then((cache) => cache.addAll(['/']))
  );
});
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
