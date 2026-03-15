const CACHE_NAME = 'analemma-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Try cache first, then network, and cache successful network responses for images
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Cache hit
        }

        return fetch(event.request).then(networkResponse => {
          // Check if we received a valid response and if it's an image
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // If it's a request to our captures directory, cache it dynamically
          const url = new URL(event.request.url);
          if (url.pathname.startsWith('/captures/')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }

          return networkResponse;
        });
      })
  );
});