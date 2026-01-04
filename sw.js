// Simple service worker for offline-first caching of static assets.
// Place sw.js at the site root so the scope covers the whole site.

const CACHE_NAME = 'quicktracker-v1';
const ASSETS_TO_CACHE = [
  '/',              // index
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE).catch(err => {
      // some assets may be missing during first deploy; ignore individual failures
      console.warn('Some assets failed to cache on install', err);
    }))
  );
});

self.addEventListener('activate', event => {
  // cleanup old caches
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // network-first for start page to get fresh content, fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/'))
    );
    return;
  }

  // cache-first for other static assets
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => res))
  );
});
