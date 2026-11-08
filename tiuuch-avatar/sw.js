const C='tiuuch-avatar-v2';
const A=['./','questions.json','avatar.jpg','manifest.json','icon-192.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(A).catch(()=>{})))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  // HTML ו-JSON: קודם רשת, מטמון רק כגיבוי
  if(url.pathname.endsWith('/')||url.pathname.endsWith('index.html')||url.pathname.endsWith('.json')){
    e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp)).catch(()=>{});return r;})
      .catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp)).catch(()=>{});return res;
  })));
});
