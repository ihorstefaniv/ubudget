// Minimal service worker — enables PWA install prompt on Android
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
// Passthrough fetch — no caching, app stays online-only
self.addEventListener("fetch", () => {});
