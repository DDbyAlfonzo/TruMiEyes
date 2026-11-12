/* TruMiEyes service worker — app shell offline fallback + photo cache. */
const VERSION = "v2";
const SHELL_CACHE = `trumi-shell-${VERSION}`;
const STATIC_CACHE = `trumi-static-${VERSION}`;
const PHOTO_CACHE = "trumi-photos";
const PHOTO_CACHE_LIMIT = 400;
const OFFLINE_URL = "/offline.html";

const SHELL_ASSETS = [
  OFFLINE_URL,
  "/brand/logo-stacked-white.svg",
  "/brand/wordmark.svg",
  "/brand/wordmark-white.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/site.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, STATIC_CACHE, PHOTO_CACHE]);
      for (const key of await caches.keys()) {
        if (key.startsWith("trumi-") && !keep.has(key)) await caches.delete(key);
      }
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

// Signing out clears saved photos so the next person on this device can't see them.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_PRIVATE_CACHE") {
    event.waitUntil(caches.delete(PHOTO_CACHE));
  }
});

const isPhoto = (url) =>
  url.hostname === "res.cloudinary.com" || (url.origin === self.location.origin && /\.(?:jpe?g|png|webp|avif)$/i.test(url.pathname));

async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - limit; i += 1) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never cache auth or API traffic.
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) return;

  // Pages: always network (private, personalised). Offline → friendly fallback page.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preload = await event.preloadResponse;
          return preload || (await fetch(request));
        } catch {
          return (await caches.match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
    return;
  }

  // Hashed Next.js assets and fonts: cache-first (immutable).
  if (
    (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) ||
    url.hostname === "fonts.gstatic.com" ||
    url.hostname === "fonts.googleapis.com"
  ) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Photos: cache-first (Cloudinary URLs are immutable), so viewed photos open instantly,
  // work offline and don't cost the client mobile data twice. Fetched with CORS so we
  // never store padded opaque responses.
  if (isPhoto(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PHOTO_CACHE);
        const key = url.href;
        const hit = await cache.match(key);
        if (hit) return hit;
        return fetch(new Request(key, { mode: "cors", credentials: "omit" }))
          .then((response) => {
            if (response.ok) {
              cache.put(key, response.clone()).then(() => trimCache(PHOTO_CACHE, PHOTO_CACHE_LIMIT));
            }
            return response;
          })
          .catch(() => fetch(request));
      })(),
    );
    return;
  }

  // Shell assets (logos, icons): cache-first.
  if (url.origin === self.location.origin && SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
  }
});
