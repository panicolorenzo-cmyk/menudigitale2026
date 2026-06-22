const CACHE = 'menu-digitale-v1';
const ASSETS = ['/', '/manifest.webmanifest', '/icons/icon-192.svg', '/icons/icon-512.svg'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener('fetch', (event) => event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request))));
