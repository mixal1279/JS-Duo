// JS Duo Service Worker for Browser Push Notifications
const CACHE_NAME = 'js-duo-cache-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Notification Click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If user clicked the 'dismiss' button, just close and do nothing
  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If an existing window is open, focus it and notify it
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            action: event.action || 'open',
            tag: event.notification.tag,
          });
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close event
self.addEventListener('notificationclose', () => {
  // Can be used for analytics or telemetry if required
});

// Handle incoming background Push events
self.addEventListener('push', (event) => {
  let data = {
    title: '🦉 Czas na codzienną dawkę JavaScriptu!',
    body: 'Minęły 24 godziny od Twojej ostatniej sesji. Zrób 1 lekcję i uratuj streak!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'js-duo-daily-reminder',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    tag: data.tag || 'js-duo-daily-reminder',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: data.data || { url: '/' },
    actions: [
      { action: 'practice', title: 'Ćwicz teraz 🚀' },
      { action: 'dismiss', title: 'Później' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});
