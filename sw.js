/* ══ ETS Ugokins Emmason — Service Worker v2 ══ */
const CACHE = 'ets-v4';

const FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './logo.png',
  './signature.png',
  './company_seal.jpg',
  './img_1.png',
  './img_2.png',
  './img_3.png',
  './img_4.png',
  './img_5.png',
  './img_6.png',
  './img_7.png',
  './img_8.png',
  './assets/css/style.css',
  './assets/js/db.js',
  './assets/js/app.js',
  './assets/libs/jspdf.umd.min.js',
  './assets/libs/jspdf.plugin.autotable.min.js',
  './assets/libs/xlsx.full.min.js',
];

/* Install — cache all app files */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return c.addAll(FILES);
    })
  );
  self.skipWaiting();
});

/* Activate — delete old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* Fetch — serve from cache first, fall back to network */
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        return response;
      }).catch(() => {
        // Offline fallback
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});