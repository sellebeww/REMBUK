/* Copyright (c) 2026 Vassel Goleyu. Dibangkitkan oleh scripts/build.mjs dari scripts/sw.template.js; jangan diedit langsung. */
'use strict';
const VERSION = '__VERSION__';
const CACHE = 'rembuk-app-' + VERSION;
const ASSETS = __ASSETS__;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('rembuk-app-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Cache-first untuk berkas aplikasi (satu asal); permintaan lintas asal (font, API Supabase) tidak disentuh.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    }),
  );
});
