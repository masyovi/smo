/* SMO — Save My Office service worker.
 * Handles: PWA fetch/offline cache, OS-level notifications (foreground),
 * notification click, AND Firebase Cloud Messaging (FCM) background push.
 *
 * Firebase is loaded via importScripts. If /firebase-config.js still has
 * placeholder values, FCM is skipped (the app works without Firebase —
 * only foreground notifications won't be sent).
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

const CACHE_VERSION = 'smo-v3';

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ---------- Firebase Cloud Messaging (background push) ----------
let fcmReady = false;
try {
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
  importScripts('/firebase-config.js');
  if (
    self.firebaseConfig &&
    self.firebaseConfig.apiKey &&
    self.firebaseConfig.apiKey !== 'REPLACE_WITH_YOUR_API_KEY' &&
    self.firebase &&
    self.firebase.messaging
  ) {
    self.firebase.initializeApp(self.firebaseConfig);
    const messaging = self.firebase.messaging();
    // FCM auto-shows notifications for payloads with a "notification" field.
    // onBackgroundMessage handles data-only messages (we show them ourselves).
    messaging.onBackgroundMessage((payload) => {
      const n = payload.notification || {};
      const title = n.title || (payload.data && payload.data.title) || 'SMO — Pengingat';
      const body = n.body || (payload.data && payload.data.body) || '';
      const tag = (payload.data && payload.data.tag) || 'smo-maintenance';
      self.registration.showNotification(title, {
        body,
        icon: '/smo-icon.png',
        badge: '/smo-icon.png',
        tag,
        renotify: true,
        data: { url: (payload.data && payload.data.url) || '/' },
      });
    });
    fcmReady = true;
  }
} catch (e) {
  // Firebase SDK failed to load (e.g. offline) — foreground notifications
  // still work via registration.showNotification() from the client.
}

// ---------- PWA fetch handler (network-first, offline fallback) ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && (fresh.ok || fresh.type === 'opaque')) {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (err) {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') {
          return (await caches.match('/index.html')) || Response.error();
        }
        return Response.error();
      }
    })()
  );
});

// ---------- Foreground push fallback (used by useDeviceNotifications) ----------
// This handles push events when FCM is NOT configured. When FCM IS configured,
// FCM's own listener handles push events (this listener is a no-op then
// because the event is consumed by FCM first — but to be safe we guard it).
self.addEventListener('push', (event) => {
  if (fcmReady) return; // FCM handles push when configured
  let payload = { title: 'SMO — Pengingat', body: 'Maintenance jatuh tempo' };
  try {
    if (event.data) payload = event.data.json();
  } catch {
    if (event.data) payload = { ...payload, body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/smo-icon.png',
      badge: '/smo-icon.png',
      tag: payload.tag || 'smo-maintenance',
      data: payload.data || { url: '/' },
    })
  );
});

// ---------- Notification click (focus/open the app) ----------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          client.postMessage({ type: 'smo-notification-click', url: targetUrl });
          return;
        }
      }
      return self.clients.openWindow(targetUrl);
    })()
  );
});
