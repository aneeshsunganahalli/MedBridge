const CACHE_NAME = 'medbridge-v1';

// We primarily rely on the network, caching static assets as they are requested.
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // If it's an API request, try network first, but let the client handle offline 
  // via IndexedDB (the service worker just fails the fetch).
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For static assets and navigation, use network-first strategy, fallback to cache.
  event.respondWith(
    fetch(event.request).then((response) => {
      // Don't cache non-successful responses or cross-origin stuff for now unless needed
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, responseToCache);
      });
      return response;
    }).catch(() => {
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // If it's a navigation request and we're offline, return index.html for client-side routing
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return Response.error();
      });
    })
  );
});
