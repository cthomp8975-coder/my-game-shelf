// The Shelf — Service Worker v8
const CACHE_NAME = 'the-shelf-v13';
const ASSETS = [
  '/my-game-shelf/board-game-catalogue.html',
  '/my-game-shelf/manifest.json',
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

// Fetch: only serve cached app shell files — never intercept external API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Pass through all external requests (BGG, GitHub, fonts data, etc.)
  if (url.origin !== self.location.origin) return;

  // Cache-first for same-origin app shell assets
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
