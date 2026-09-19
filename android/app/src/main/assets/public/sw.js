// JS Duo Service Worker for Browser Push Notifications
const CACHE_NAME = 'js-duo-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Notification Click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
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

// Handle incoming background Push events
self.addEventListener('push', (event) => {
  let data = {
    title: '🦉 Czas na codzienną dawkę JavaScriptu!',
    body: 'Minęły 24 godziny od Twojej ostatniej sesji. Zrób 1 lekcję i uratuj streak!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.svg',
      badge: data.badge || '/favicon.svg',
      tag: 'js-duo-daily-reminder',
      renotify: true,
      data: { url: '/' },
    })
  );
});
