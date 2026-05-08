/* Service Worker FleurMat — cache statique + images visitées */
const VERSION = 'v1';
const CACHE_STATIQUE = `fleurmat-static-${VERSION}`;
const CACHE_IMAGES = `fleurmat-images-${VERSION}`;

const STATIQUE = ['/', '/index.html', '/style.css', '/app.js', '/data/plantes.json', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIQUE).then(c => c.addAll(STATIQUE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_STATIQUE && k !== CACHE_IMAGES).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Fichiers statiques : cache-first
  if (STATIQUE.some(p => url.pathname === p || url.pathname.endsWith(p))) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_STATIQUE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // Images : cache-first avec mise en cache au premier accès
  if (url.pathname.startsWith('/images/')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_IMAGES).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => new Response('', { status: 404 })))
    );
    return;
  }

  // Reste : réseau
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
