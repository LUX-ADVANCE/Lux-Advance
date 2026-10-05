const CACHE_NAME = 'lux-app-v3';
const ARQUIVOS = [
  './',
  './index.html',
  './logo4.png',
  './vip1.png',
  './vip2.png',
  './vip3.png',
  './vip4.png'
];

// Instala e guarda arquivos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => Promise.all(ARQUIVOS.map(a => cache.add(a).catch(() => {}))))
  );
});

// Atualiza cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(nomes => 
      Promise.all(nomes.filter(n => n !== CACHE_NAME).map(c => caches.delete(c)))
    )
  );
});

// Busca do cache primeiro
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
