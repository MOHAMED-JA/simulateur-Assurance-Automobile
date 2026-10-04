/* Simulateur Assurance Automobile : fonctionnement hors connexion.
   Réseau d'abord (la version en ligne reste toujours la référence), le cache sert de
   secours hors connexion. Changer VERSION quand la liste des fichiers évolue. */
const VERSION = '2026-10-04a';
const CACHE = 'simulateur-' + VERSION;
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/sinistre.css',
  './assets/js/sinistre.js',
  './assets/js/declaration.js',
  './assets/js/bareme-ftusa.js',
  './assets/js/qrcode.js',
  './assets/js/vendor/modern-screenshot.js',
  './assets/fonts/geist-latin-wght-normal.woff2',
  './assets/fonts/geist-latin-ext-wght-normal.woff2',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('simulateur-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Une page qui tarde (réseau faible) bascule sur la copie locale après 4 s
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isPage = request.mode === 'navigate';
  const network = fetch(request).then(response => {
    if (response && response.ok && response.type === 'basic') {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(isPage ? './index.html' : request, copy));
    }
    return response;
  });
  event.respondWith(
    (isPage ? withTimeout(network, 4000) : network).catch(() =>
      caches.match(isPage ? './index.html' : request, { ignoreSearch: isPage })
        .then(hit => hit || (isPage ? caches.match('./') : undefined))
        .then(hit => hit || Response.error())
    )
  );
});
