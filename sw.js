// The Shelf — Service Worker
// Caches the app shell for offline access

const CACHE_NAME = 'the-shelf-v1';
const ASSETS = [
  '/my-game-shelf/board-game-catalogue.html',
  '/my-game-shelf/manifest.json',
  '/my-game-shelf/icon-512.svg',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600&display=swap'
];

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache, fall back to network
// GitHub API calls always go to network (never cache)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache GitHub API or Anthropic API calls
  if (url.hostname === 'api.github.com' || url.hostname === 'api.anthropic.com' || url.hostname === 'raw.githubusercontent.com') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for app shell assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses for app assets
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/my-game-shelf/board-game-catalogue.html');
        }
      });
    })
  );
});
