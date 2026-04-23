// src/services/notification.service.ts
// Ahia Campus Marketplace — Web Push Notification Service
// Uses browser Notification API + Web Push. No React Native / Expo deps.

"use client";

import api from "./api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type NotificationCategory =
  | "chat"         // New message from buyer/seller
  | "escrow"       // Escrow state changes & fund releases
  | "listing"      // Offer on a listing, price drop alert
  | "verification" // Student ID approved / rejected
  | "system"       // Platform announcements
  | "promo";       // Campus deals, featured listings

export type NotificationEvent =
  | "received"
  | "tapped"
  | "dismissed"
  | "permission_granted"
  | "permission_denied"
  | "token_registered";

export interface NotificationPreferences {
  chat: boolean;
  escrow: boolean;
  listing: boolean;
  verification: boolean;
  system: boolean;
  promo: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "07:00"
  sound: boolean;
  badge: boolean;
}

export interface AhiaNotificationData {
  category: NotificationCategory;
  href?: string;          // Next.js route to navigate to on click
  chatId?: string;
  transactionId?: string;
  listingId?: string;
  userId?: string;
  campaignId?: string;
  notificationId: string;
  sentAt: string;
}

export interface NotificationAnalyticsPayload {
  event: NotificationEvent;
  notificationId: string;
  category: NotificationCategory;
  campaignId?: string;
  timestamp: string;
  userId: string;
  platform: "web";
  timeToTap?: number; // ms from received → tapped
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PREFS_KEY = "ahia_notification_prefs";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  chat: true,
  escrow: true,
  listing: true,
  verification: true,
  system: true,
  promo: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  sound: true,
  badge: true,
};

// ─── Route Resolver ─────────────────────────────────────────────────────────────
// Maps notification data → Next.js routes in this project

export const resolveNotificationRoute = (data: AhiaNotificationData): string => {
  if (data.href) return data.href;
  switch (data.category) {
    case "chat":
      return data.chatId ? `/user/chat/${data.chatId}` : "/user/chat";
    case "escrow":
      return data.transactionId ? `/user/orders/${data.transactionId}` : "/user/orders";
    case "listing":
      return data.listingId ? `/marketplace/${data.listingId}` : "/marketplace";
    case "verification":
      return "/user/settings";
    default:
      return "/user/notifications";
  }
};

// ─── Analytics Queue (offline resilience) ──────────────────────────────────────

const analyticsQueue: NotificationAnalyticsPayload[] = [];

const flushAnalyticsQueue = async () => {
  if (analyticsQueue.length === 0) return;
  const batch = analyticsQueue.splice(0);
  try {
    await api.post("/analytics/notifications/batch", batch);
  } catch {
    analyticsQueue.unshift(...batch); // re-queue on failure
  }
};

// ─── Main Service ───────────────────────────────────────────────────────────────

export const NotificationService = {

  // ── Internal state ────────────────────────────────────────────────────────
  _userId: null as string | null,
  _activeChatId: null as string | null,
  _receivedAt: new Map<string, number>(), // notificationId → timestamp

  setUserId: (id: string | null) => { NotificationService._userId = id; },
  setActiveChatId: (id: string | null) => { NotificationService._activeChatId = id; },
  isViewingChat: (chatId?: string) =>
    !!chatId && NotificationService._activeChatId === chatId,

  // ── Permission ────────────────────────────────────────────────────────────

  getPermissionStatus: (): NotificationPermission | "unsupported" => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  },

  requestPermission: async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) return "denied";
    const result = await Notification.requestPermission();
    NotificationService.trackAnalytics({
      event: result === "granted" ? "permission_granted" : "permission_denied",
      notificationId: "system",
      category: "system",
      timestamp: new Date().toISOString(),
      userId: NotificationService._userId ?? "anonymous",
      platform: "web",
    });
    return result;
  },

  // ── Initialise (call after login) ─────────────────────────────────────────

  /**
   * Boot push subscriptions. Call this once after useAuthStore rehydrates.
   * Returns the subscription endpoint string, or null if unsupported/denied.
   */
  initialize: async (userId: string): Promise<string | null> => {
    NotificationService.setUserId(userId);
    if (typeof window === "undefined") return null;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[Notifications] Web Push not supported.");
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const perm = await NotificationService.requestPermission();
      if (perm !== "granted") return null;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn("[Notifications] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.");
        return null;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      const token = JSON.stringify(sub);
      await NotificationService.registerToken(userId, token);
      NotificationService.trackAnalytics({
        event: "token_registered",
        notificationId: "system",
        category: "system",
        timestamp: new Date().toISOString(),
        userId,
        platform: "web",
      });

      // Listen for messages from service worker (push received while tab open)
      navigator.serviceWorker.addEventListener("message", NotificationService._onSWMessage);

      return token;
    } catch (err) {
      console.error("[Notifications] Initialisation failed:", err);
      return null;
    }
  },

  /**
   * Call on logout to unsubscribe and clean up.
   */
  teardown: async (userId: string): Promise<void> => {
    NotificationService.setUserId(null);
    NotificationService.setActiveChatId(null);
    navigator.serviceWorker?.removeEventListener("message", NotificationService._onSWMessage);
    try {
      const reg = await navigator.serviceWorker?.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await api.delete("/users/push-token", { data: { userId, token: JSON.stringify(sub) } });
      }
    } catch { /* silent — logout should not fail */ }
  },

  // ── Service Worker message handler ───────────────────────────────────────

  _onSWMessage: (event: MessageEvent) => {
    if (event.data?.type !== "PUSH_RECEIVED") return;
    const { title, body, data } = event.data as {
      title: string;
      body: string;
      data: AhiaNotificationData;
    };

    // Don't show notification if user is already in that chat
    if (data.category === "chat" && NotificationService.isViewingChat(data.chatId)) return;
    // Don't show during quiet hours
    if (NotificationService.isQuietHours()) return;
    // Respect category preference
    const prefs = NotificationService.getPreferences();
    if (!prefs[data.category]) return;

    NotificationService.showBrowserNotification(title, body, data);

    NotificationService._receivedAt.set(data.notificationId, Date.now());
    NotificationService.trackAnalytics({
      event: "received",
      notificationId: data.notificationId,
      category: data.category,
      campaignId: data.campaignId,
      timestamp: new Date().toISOString(),
      userId: NotificationService._userId ?? "anonymous",
      platform: "web",
    });
  },

  // ── Browser Notification ─────────────────────────────────────────────────

  /**
   * Show a native browser notification with click-to-navigate behaviour.
   */
  showBrowserNotification: (
    title: string,
    body: string,
    data: AhiaNotificationData
  ): void => {
    if (Notification.permission !== "granted") return;
    const prefs = NotificationService.getPreferences();

    const notif = new Notification(title, {
      body,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: data.notificationId,
      data,
      silent: !prefs.sound,
    });

    notif.onclick = () => {
      const receivedAt = NotificationService._receivedAt.get(data.notificationId);
      const timeToTap = receivedAt ? Date.now() - receivedAt : undefined;
      NotificationService._receivedAt.delete(data.notificationId);

      NotificationService.trackAnalytics({
        event: "tapped",
        notificationId: data.notificationId,
        category: data.category,
        campaignId: data.campaignId,
        timestamp: new Date().toISOString(),
        userId: NotificationService._userId ?? "anonymous",
        platform: "web",
        timeToTap,
      });

      window.focus();
      window.location.href = resolveNotificationRoute(data);
      notif.close();
    };

    notif.onclose = () => {
      NotificationService.trackAnalytics({
        event: "dismissed",
        notificationId: data.notificationId,
        category: data.category,
        timestamp: new Date().toISOString(),
        userId: NotificationService._userId ?? "anonymous",
        platform: "web",
      });
    };
  },

  // ── Preferences ──────────────────────────────────────────────────────────

  getPreferences: (): NotificationPreferences => {
    if (typeof window === "undefined") return { ...DEFAULT_PREFERENCES };
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch { /* use defaults */ }
    return { ...DEFAULT_PREFERENCES };
  },

  updatePreferences: async (
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const merged = { ...NotificationService.getPreferences(), ...updates };
    if (typeof window !== "undefined") {
      localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
    }
    // Sync to backend so server-side suppression works
    const userId = NotificationService._userId;
    if (userId) {
      api.put(`/users/${userId}/notification-preferences`, merged).catch(console.warn);
    }
    return merged;
  },

  // ── Quiet Hours ───────────────────────────────────────────────────────────

  isQuietHours: (): boolean => {
    const prefs = NotificationService.getPreferences();
    if (!prefs.quietHoursEnabled) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = prefs.quietHoursStart.split(":").map(Number);
    const [eh, em] = prefs.quietHoursEnd.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    // Handle overnight ranges e.g. 22:00 → 07:00
    return start > end ? cur >= start || cur < end : cur >= start && cur < end;
  },

  // ── Backend ───────────────────────────────────────────────────────────────

  registerToken: async (userId: string, token: string): Promise<void> => {
    await api.post("/users/push-token", {
      userId,
      token,
      platform: "web",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    });
  },

  // ── Analytics ─────────────────────────────────────────────────────────────

  trackAnalytics: (payload: NotificationAnalyticsPayload): void => {
    api.post("/analytics/notifications", payload).catch(() => {
      analyticsQueue.push(payload);
    });
    // Attempt to flush any queued events
    flushAnalyticsQueue().catch(() => {});
  },
};

// ─── Utility ───────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export default NotificationService;
