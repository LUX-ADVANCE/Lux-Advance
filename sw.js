const CACHE_NAME = "lux-app-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./vitrine.html",
  "./offline.html",
  "./app.css",
  "./vitrine.css",
  "./vitrine.js",
  "./pwa.js",
  "./manifest.json",
  "./logo4.png",
  "./icone-lux-192.png",
  "./icone-lux-512.png",
  "./icone-lux-maskable-512.png",
];
const PRIVATE_PAGE = /(?:^|\/)(?:login|cadastro-[^/]*|acesso-admin|painel(?:-[^/]*)?|nova-senha|redefinir-senha|redefenir-senha|pagamento-retorno|agendar|doar-pix)(?:\.html)?$/i;
const CACHEABLE_HTML = /(?:^|\/)(?:index|vitrine|offline)\.html$/i;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map(path => cache.add(path)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith("lux-app-") && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const scopePath = new URL(self.registration.scope).pathname;
  const relativePath = `/${url.pathname.slice(scopePath.length)}`.replace(/\/+/g, "/");
  if (PRIVATE_PAGE.test(relativePath)) return;

  if (request.mode === "navigate" || request.destination === "document") {
    if (!CACHEABLE_HTML.test(relativePath) && relativePath !== "/") return;
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request, { ignoreSearch: true })
          || await cache.match(new URL(relativePath === "/" ? "./index.html" : `.${relativePath}`, self.registration.scope).href, { ignoreSearch: true });
        if (cached) return cached;
        return await cache.match("./offline.html") || Response.error();
      }
    })());
    return;
  }

  if (!/\.(?:css|js|png|jpe?g|webp|svg|woff2?)$/i.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch {
      return Response.error();
    }
  })());
});
