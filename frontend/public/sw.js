// Minimal service worker: enables "Add to Home Screen" / installability
// and caches the app shell so the UI still loads if the network drops.
// API calls (backend, Nominatim, Open-Meteo) always go to the network.

const CACHE_NAME = "co-climate-shell-v8";
const APP_SHELL = [
  "/index.html",
  "/login.html",
  "/assets/style.css",
  "/assets/login.js",
  "/assets/main.js",
  "/assets/style.js",
  "/manifest.json",
  "/icons/logo.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  const isApi =
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("nominatim.openstreetmap.org") ||
    url.hostname.includes("api.open-meteo.com");

  if (isApi || event.request.method !== "GET") {
    return;
  }

  // Network First, falling back to Cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
