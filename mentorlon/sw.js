// Mentor-IT Service Worker
const CACHE_NAME = 'mentor-it-v1';
const ASSETS = [
  './index.html',
  './dashboard.html',
  './signup.html',
  './trainee-login.html',
  './trainee-dashboard.html',
  './admin-dashboard.html',
  './coaching-session.html',
  './equation-solver.html',
  './strengths-finder.html',
  './wheel-of-life.html',
  './solution-engine.html',
  './lecture-effortless.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network-first for API calls, cache-first for static assets
  if (e.request.url.includes('/functions/')) {
    return; // Don't cache API responses
  }
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
