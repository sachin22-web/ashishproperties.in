self.addEventListener("push", function (event) {
  try {
    const data = event.data ? event.data.json() : {};
    const title =
      (data.notification && data.notification.title) ||
      data.title ||
      "Notification";
    const body =
      (data.notification && data.notification.body) || data.body || "";
    const icon =
      (data.notification && data.notification.icon) ||
      data.icon ||
      "/favicon.ico";
    const tag =
      (data.notification && data.notification.tag) || data.tag || "general";

    const options = {
      body,
      icon,
      tag,
      data: data.data || {},
      badge: "/favicon.ico",
      vibrate: [100, 50, 100],
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // Fallback: show basic notification
    event.waitUntil(
      self.registration.showNotification("Notification", {
        body: "You have a new message",
      }),
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url =
    (event.notification &&
      event.notification.data &&
      event.notification.data.url) ||
    "/notifications";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (let client of windowClients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});
