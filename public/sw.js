// Service worker: deixa o app abrir sem internet e atualiza sozinho quando há conexão.
const CACHE = "fazenda-v1";
const ARQUIVOS = ["/", "/index.html", "/manifest.webmanifest", "/icone.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // A API nunca é guardada em cache: sempre vai ao servidor.
  if (url.pathname.startsWith("/api/")) return;
  // Arquivos do app: tenta a rede primeiro (pega atualização), cai no cache se não houver conexão.
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
        return resp;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("/index.html")))
  );
});
