const CACHE_NAME = "shemrit-order-v1";
const urls = ["./index.html", "./manifest.json", "./sw.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urls))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))); self.clients.claim(); });
self.addEventListener("fetch", e => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });
