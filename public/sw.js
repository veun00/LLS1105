const CACHE_VERSION = "v1";
const CACHE_NAME = `pwa-cache-${CACHE_VERSION}`;

const urlsToCache = ["/pwa-192x192.png", "/pwa-512x512.png", "/offline.html"];

self.addEventListener("install", (event) => {
  console.log("[SW] 설치 중...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] 캐시 열림");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("[SW] 설치 완료");
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] 활성화 중...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] 오래된 캐시 삭제:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[SW] 활성화 완료");
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", (event) => {
  // Always fetch manifest.json from network to avoid serving HTML (or stale) responses
  if (event.request.url.endsWith("/manifest.json")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For navigation requests (page loads), use network-first so refresh fetches latest page.
  if (
    event.request.mode === "navigate" ||
    (event.request.method === "GET" &&
      event.request.headers.get("accept") &&
      event.request.headers.get("accept").includes("text/html"))
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match("/offline.html");
        })
    );
    return;
  }

  // For other requests, try cache first then network, and cache successful GET/basic responses.
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("[SW] 캐시에서 반환:", event.request.url);
        return response;
      }

      console.log("[SW] 네트워크에서 가져오기:", event.request.url);
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => caches.match("/offline.html"));
    })
  );
});
