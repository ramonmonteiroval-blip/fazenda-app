// Cache só da própria casca do app. Firebase (Auth/Firestore) é sempre online e não é guardado.
const CACHE = "controle-fazenda-v1";
const SHELL = ["./", "./index.html", "./logica.js", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // deixa Firebase e gstatic passarem direto
  const isPage = e.request.mode === "navigate" || /(\/|index\.html)$/.test(url.pathname);
  if (isPage) {
    // Página principal: sempre busca a versão mais nova; sem internet, usa a guardada.
    e.respondWith(fetch(e.request, { cache: "no-cache" }).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((res) => {
    const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res;
  })));
});
