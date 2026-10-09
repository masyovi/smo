/* SMO — Save My Office service worker.
 * Handles OS-level push notifications for maintenance reminders.
 * Registered from the client via navigator.serviceWorker.register('/sw.js').
 */
self.addEventListener('install', (event) => {
  // Activate immediately, don't wait for the old SW to die.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim clients + evict old caches so updated icons/assets are used.
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

const CACHE_VERSION = 'smo-v2';

// Fetch handler — required for PWA installability. Network-first: try the
// network, fall back to cache (for the offline fallback page) when offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only handle GET (let POST/PATCH/DELETE go straight to network).
  if (req.method !== 'GET') return;
  // Skip non-http(s) requests (e.g. chrome-extension://, data:).
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        // Cache successful navigations + static assets for offline use.
        if (fresh && (fresh.ok || fresh.type === 'opaque')) {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (err) {
        // Offline — try cache first for navigations.
        const cached = await caches.match(req);
        if (cached) return cached;
        // For navigation requests when nothing is cached, serve the offline
        // fallback page so the user sees something friendly.
        if (req.mode === 'navigate') {
          return (await caches.match('/index.html')) || Response.error();
        }
        return Response.error();
      }
    })()
  );
});

// When the user clicks a notification, focus the app (or open it).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      // Focus an existing tab if one is open.
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          // Optionally navigate to the schedules view.
          if (client.url && client.url.indexOf(targetUrl) === -1) {
            // postMessage so the app can switch view if it wants.
            client.postMessage({ type: 'smo-notification-click', url: targetUrl });
          }
          return;
        }
      }
      // Otherwise open a new window.
      return self.clients.openWindow(targetUrl);
    })()
  );
});

// Optional: handle push events (for a future server-side push integration).
self.addEventListener('push', (event) => {
  let payload = { title: 'SMO', body: 'Pengingat maintenance' };
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
      renotify: true,
      data: payload.data || { url: '/' },
    })
  );
});
