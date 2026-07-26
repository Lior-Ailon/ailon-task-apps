// Service Worker — קיץ חכם PWA
const CACHE_NAME = 'keit-chacham-v1';
const ASSETS = [
  './',
  './index.html',
  './english.html',
  './math.html',
  './hebrew.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './icon-maskable-512.png',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Heebo:wght@400;700;900&display=swap'
];

// Install — cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache assets one by one to handle failures gracefully
        return Promise.allSettled(
          ASSETS.map(url => cache.add(url).catch(err => console.log('Skip:', url, err)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests (like API calls to Base44)
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isFonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  
  if (!isSameOrigin && !isFonts) {
    // Let it go to network (API calls, etc.)
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        const fetchPromise = fetch(event.request)
          .then(response => {
            // Cache successful responses
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone).catch(() => {});
              });
            }
            return response;
          })
          .catch(() => {
            // Offline — return cached if available
            return cached;
          });
        
        // Return cached immediately if available, otherwise wait for network
        return cached || fetchPromise;
      })
  );
});
