/* SMO — Save My Office service worker.
 * Handles OS-level push notifications for maintenance reminders.
 * Registered from the client via navigator.serviceWorker.register('/sw.js').
 */
self.addEventListener('install', (event) => {
  // Activate immediately, don't wait for the old SW to die.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
