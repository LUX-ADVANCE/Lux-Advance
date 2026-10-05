const CACHE_NAME = 'lux-app-v3';
const ARQUIVOS = [
  './',
  './index.html',
  './lux-halloween.jpg',
  './halloween-feminina.jpg',
  './logo4.png',
  './icone-lux-192.png',
  './icone-lux-512.png',
  './vip1.png',
  './vip3.png'
];

// Instala e guarda arquivos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARQUIVOS))
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
