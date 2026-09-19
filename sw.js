/* Service Worker der Standort-Uhr — uebernommen aus dem Projekt Zettel, mit
   einer bewussten Abweichung: Zettel bedient auch fremde Dateien (Schriften,
   Bibliotheken) "Cache zuerst". Hier laufen ueber fremde Adressen die
   Firebase-Verbindungen; ein gecachter Datenbank-Abruf waere fatal. Deshalb
   fasst dieser Worker AUSSCHLIESSLICH eigene Dateien an und laesst alles
   andere unberuehrt durch.

   Warum ueberhaupt ein Worker: Ohne ihn liefert iOS die Homescreen-App aus dem
   HTTP-Cache (GitHub Pages: max-age 600), ohne beim Server nachzufragen —
   Wegwischen und neu oeffnen bringt trotzdem die alte Fassung. "Netz zuerst"
   mit cache:'no-cache' fragt bei jedem Start nach; unveraendert antwortet der
   Server mit 304, es fliessen kaum Daten. Der Cache ist nur der Rueckfall,
   wenn gar kein Netz da ist. */
const CACHE = 'standort-uhr-v1';
const ASSETS = ['./', './index.html', './version.json', './apple-touch-icon-v3.png', './zeiger/perl.webp', './zeiger/nabe.webp'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();            // sonst wartet der neue Worker, bis ALLE Fenster zu sind — passiert auf dem iPhone nie
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();          // sonst bedient der ALTE Worker die schon offene Seite weiter
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;   // fremd: nicht anfassen
  e.respondWith(
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    // ignoreSearch: nach einem Update laeuft die Seite unter "?v=1234" — ohne das
    // faende sie ihren eigenen Cache-Eintrag nicht und fiele auf index.html zurueck
    // (aus dem Labor waere damit offline die Uhr geworden).
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
  );
});
