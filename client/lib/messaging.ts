import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
} from "firebase/messaging";
import app from "./firebase";

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY as string | undefined;

let messaging: Messaging | null = null;

export function initMessaging() {
  if (typeof window === "undefined") return;
  try {
    messaging = getMessaging(app);
  } catch (e) {
    console.warn("Messaging init failed:", e);
    messaging = null;
  }
}

export async function ensurePushPermissionNonBlocking() {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  try {
    if (Notification.permission === "granted") return "granted";
    // Non-blocking: defer the prompt slightly
    setTimeout(() => {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }, 2000);
    return Notification.permission;
  } catch {
    return null;
  }
}

export async function getFcmToken(): Promise<string | null> {
  if (!messaging) initMessaging();
  if (!messaging) return null;
  try {
    if (!VAPID_KEY) {
      console.warn("FCM VAPID key missing; skipping push registration");
      return null;
    }
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (e) {
    console.warn("FCM getToken failed:", e);
    return null;
  }
}

export function listenForegroundNotifications() {
  if (!messaging) initMessaging();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    try {
      const title = payload.notification?.title || "Notification";
      const body = payload.notification?.body || "";
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: payload.notification?.icon || "/favicon.ico",
        });
      }
    } catch {}
  });
}

export async function subscribeTokenToGeneralTopic(token: string) {
  try {
    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, topic: "general" }),
    });
  } catch (e) {
    console.warn("Topic subscribe failed (non-fatal):", e);
  }
}
