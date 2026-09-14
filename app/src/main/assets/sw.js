const CACHE = 'moonlit-vjk5-10-final';
const CORE = [
  './','./index.html','./css/style.css','./js/data.js','./js/app.js','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./assets/profile/jasmyn-profile.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        if (fresh.ok) caches.open(CACHE).then(c => c.put('./index.html', fresh.clone())).catch(() => {});
        return fresh;
      } catch (_) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Scripts, CSS, icons and local images: cache-first for a much faster app.
  // The versioned SW cache is replaced on every new deployment.
  if (['script','style','manifest','image','font'].includes(req.destination)) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh.ok) caches.open(CACHE).then(c => c.put(req, fresh.clone())).catch(() => {});
        return fresh;
      } catch (_) {
        return cached || Response.error();
      }
    })());
    return;
  }

  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
