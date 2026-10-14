// Uygulama kabuğunu (HTML, JS, wasm, yazı tipleri) telefonda saklar; böylece
// ana ekrandan internetsiz de açılır. Veritabanı parçaları (assets/db/) zaten
// IndexedDB'de durduğu için burada tekrar saklanmaz.
// Strateji: önce ağ (yeni sürüm hemen gelsin), ağ yoksa önbellek.
const ONBELLEK = 'kutuphane-kabuk-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const ad of await caches.keys()) if (ad !== ONBELLEK) await caches.delete(ad);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const istek = e.request;
  const url = new URL(istek.url);
  if (istek.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/assets/db/')) return;
  e.respondWith((async () => {
    const onbellek = await caches.open(ONBELLEK);
    try {
      const cevap = await fetch(istek);
      if (cevap.ok) onbellek.put(istek, cevap.clone());
      return cevap;
    } catch (_) {
      const eski = await onbellek.match(istek, {ignoreSearch: true});
      if (eski) return eski;
      throw _;
    }
  })());
});
