import React from "react";
import { createRoot } from "react-dom/client";
import App from "../App";

createRoot(document.getElementById("root")!).render(<App />);

/* ===== PWA Service Worker Registration ===== */
// Service worker is registered here. 
// The install prompt is handled by PWAInstallButton and PWAInstallPrompt components
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(console.error);
  });
}
