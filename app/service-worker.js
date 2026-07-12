const CACHE_NAME = 'mingli-cache-v2-reset';
const ASSETS = [];

// Install - skip caching, force immediate activation
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate - clear ALL old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - network first, no cache
self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
