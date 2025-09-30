/// <reference lib="webworker" />

export {};

const swSelf = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = 'trip-narrator-cache-v1';
const PRECACHE_URLS = ['/'];

swSelf.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }),
  );
});

swSelf.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clonedResponse));
        return networkResponse;
      });
    }),
  );
});
