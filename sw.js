// Baxnaano Hospital - Cabasho Rasmi PWA
// Cache-first service worker

const CACHE_NAME = 'cabasho-baxnaano-v1';
const ASSETS_TO_CACHE = [
  './cabasho-baxnaano.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: pre-cache the core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first, fall back to network, then update cache
self.addEventListener('fetch', (event) => {
  // Only handle same-origin GET requests; let everything else (e.g. CDN, WhatsApp) pass through
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache a copy of successful same-origin responses for next time
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            event.request.url.startsWith(self.location.origin)
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback: serve the app shell for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('./cabasho-baxnaano.html');
          }
        });
    })
  );
});
