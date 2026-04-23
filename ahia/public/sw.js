// public/sw.js
// Ahia Campus Marketplace — PWA + Web Push Service Worker
// Handles: push notifications, notificationclick, static asset caching (PWA)

const CACHE_NAME = "ahia-v1";
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/logo.png",
  "/ahia.png",
  "/manifest.json",
];

// ─── Install — pre-cache critical static assets ───────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate — clean up old caches ──────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch — cache-first for static, network-first for API ───────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin && !url.hostname.endsWith("ahiamarket.app")) return;

  // API calls — network first, no caching
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Next.js _next/static — cache first (these are content-hashed)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // HTML pages — network first, fall back to cache, then /offline
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached ?? caches.match("/offline"))
        )
    );
    return;
  }

  // Images — cache first for performance
  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }
});

// ─── Push received ────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Ahia", body: event.data.text(), data: {} };
  }

  const { title = "Ahia", body = "", data = {} } = payload;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Relay to open tabs — NotificationProvider decides whether to suppress
      clients.forEach((client) => {
        client.postMessage({ type: "PUSH_RECEIVED", title, body, data });
      });

      // No open tabs — show natively
      if (clients.length === 0) {
        return self.registration.showNotification(title, {
          body,
          icon: "/logo.png",
          badge: "/logo.png",
          tag: data.notificationId || `ahia-${Date.now()}`,
          data,
        });
      }
    })
  );
});

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const route = resolveRoute(data);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const ahiaClient = clients.find((c) => c.url.includes(self.location.origin));
      if (ahiaClient) {
        ahiaClient.focus();
        ahiaClient.navigate(self.location.origin + route);
        return;
      }
      return self.clients.openWindow(self.location.origin + route);
    })
  );
});

// ─── Route resolver ───────────────────────────────────────────────────────────

function resolveRoute(data) {
  if (data.href) return data.href;
  switch (data.category) {
    case "chat":         return data.chatId        ? `/user/chat/${data.chatId}`          : "/user/chat";
    case "escrow":       return data.transactionId ? `/user/orders/${data.transactionId}` : "/user/orders";
    case "listing":      return data.listingId     ? `/marketplace/${data.listingId}`     : "/marketplace";
    case "verification": return "/user/settings";
    default:             return "/user/notifications";
  }
}
