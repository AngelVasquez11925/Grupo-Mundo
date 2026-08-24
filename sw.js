/* Service Worker · Stock Fontenla — Grupo Mundo
   - El "shell" de la app (HTML, ícono) se cachea => abre rápido y funciona sin señal.
   - stock.csv NUNCA se cachea => el stock siempre se baja fresco de Netlify.
   IMPORTANTE: si algún día cambiás el catálogo o las fotos, subí el número de
   versión (fontenla-v1 -> fontenla-v2) para que los celulares tomen el cambio. */
const CACHE = 'gm-v8';
const SHELL = ['./', './index.html', './escritorio.html', './manifest.json', './icon-192.png', './icon-512.png'];

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
  // Resto del mismo sitio: cache primero, si no, red (y guarda copia).
  if (u.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
        return resp;
      }).catch(() => caches.match('./index.html')))
    );
  }
});
