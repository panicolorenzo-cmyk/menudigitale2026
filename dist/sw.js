const CACHE = 'menu-digitale-v1';
const BASE = '/menudigitale2026/';
const ASSETS = [BASE, `${BASE}manifest.webmanifest`, `${BASE}icons/icon-192.svg`, `${BASE}icons/icon-512.svg`];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener('fetch', (event) => event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request))));
