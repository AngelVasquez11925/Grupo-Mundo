/* Service Worker · App GM — Grupo Mundo
   - Paginas (HTML): RED PRIMERO -> los cambios del catalogo entran en la PRIMERA apertura.
     Si no hay internet, sirve la copia guardada (sigue funcionando sin senal).
   - stock.csv NUNCA se cachea => el stock siempre baja fresco.
   - Resto (iconos, manifest): cache primero, rapido. */
const CACHE = 'gm-v14';
const SHELL = ['./', './index.html', './escritorio.html', './manifest.json', './icon-gm-192.png', './icon-gm-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // El stock siempre desde la red (nunca del cache).
  if (u.pathname.endsWith('stock.csv')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  if (u.origin === location.origin) {
    const esHTML = e.request.mode === 'navigate' || u.pathname.endsWith('.html') || u.pathname.endsWith('/');
    if (esHTML) {
      // RED PRIMERO para las paginas: siempre lo ultimo publicado.
      e.respondWith(
        fetch(e.request).then(resp => {
          const cp = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, cp));
          return resp;
        }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
      );
      return;
    }
    // Resto: cache primero (rapido), red si falta.
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
        return resp;
      }).catch(() => caches.match('./index.html')))
    );
  }
});
