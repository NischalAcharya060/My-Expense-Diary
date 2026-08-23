const VERSION = "v1";
const STATIC_CACHE = `static-${VERSION}`;
const PAGE_CACHE = `pages-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      await cache.addAll([OFFLINE_URL, "/site.webmanifest"]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const current = [STATIC_CACHE, PAGE_CACHE, DATA_CACHE];
      await Promise.all(keys.filter((k) => !current.includes(k)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/_next/static/")) return true;
  return /\.(css|js|mjs|woff2?|ttf|png|jpg|jpeg|gif|svg|webp|avif|ico)$/.test(url.pathname);
}

function isSupabaseRestRead(url, request) {
  return (
    request.method === "GET" &&
    url.hostname.includes("supabase.co") &&
    url.pathname.startsWith("/rest/v1/")
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          if (fresh.ok && url.origin === self.location.origin) {
            const cache = await caches.open(PAGE_CACHE);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          const cached = await caches.match(request);
          const offline = await caches.match(OFFLINE_URL);
          return cached || offline || Response.error();
        }
      })()
    );
    return;
  }

  if (isSupabaseRestRead(url, request)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(DATA_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res && res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => null);
        event.waitUntil(network);
        if (cached) return cached;
        const fresh = await network;
        return (
          fresh ||
          new Response(JSON.stringify({ message: "Offline", details: "Served by service worker" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          })
        );
      })()
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res && res.ok && (res.type === "basic" || res.type === "cors")) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, res.clone());
          }
          return res;
        } catch {
          return Response.error();
        }
      })()
    );
  }
});
