// Mentor-IT Service Worker
const CACHE_NAME = 'mentor-it-v3';
const ASSETS = [
  './index.html',
  './admin-dashboard.html',
  './coach-dashboard.html',
  './coaching-session.html',
  './dashboard.html',
  './emotions.html',
  './equation-solver.html',
  './lecture-effortless.html',
  './parenting.html',
  './positive-thinking.html',
  './relationships.html',
  './signup.html',
  './solution-engine.html',
  './strengths-finder.html',
  './trainee-dashboard.html',
  './trainee-login.html',
  './wheel-of-life.html',
  './manifest.json',
  './demo-data.js',
  './feedback.js',
  './onboarding.js'
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
  if (e.request.url.includes('/functions/')) {
    return;
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
