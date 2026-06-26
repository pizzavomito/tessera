// sw.js — service worker PWA.
// Bump CACHE à chaque changement d'assets pour forcer la mise à jour.
const CACHE = 'tessera-v1';

const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/styles.css',
  './js/main.js', './js/home.js', './js/theme.js', './js/state.js',
  './js/patterns.js', './js/tesselle.js', './js/grid.js', './js/resources.js',
  './js/atelier.js', './js/editor.js', './js/engine.js', './js/story.js',
  './data/index.json', './data/themes/poc.json', './data/stories/poc.json',
  './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Données JSON : network-first (les modifs de thèmes/histoires se propagent), repli cache.
  if (url.pathname.includes('/data/')) {
    e.respondWith(
      fetch(req)
        .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req))
    );
    return;
  }

  // App shell : cache-first, repli réseau.
  e.respondWith(caches.match(req).then(c => c || fetch(req)));
});
