// Offline support: network-first so updates show up straight away, falling back
// to the cache when offline. Bump VERSION if you add/rename shell files.
const VERSION = 'v37';
const CACHE = `life-rpg-${VERSION}`;
const SHELL = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './js/app.js', './js/game.js', './js/data.js', './js/sprites.js', './js/sprites2.js', './js/pets.js', './js/install.js', './js/updates.js', './js/engage.js', './js/sfx.js', './js/music.js', './js/celebrate.js', './js/card.js', './js/uiicons.js', './js/skillicons.js',
  './js/dungeon/ddata.js', './js/dungeon/engine.js', './js/dungeon/dgame.js', './js/dungeon/dart.js', './js/dungeon/dui.js', './js/dungeon/dbot.js', './js/dungeon/gearart.js', './js/dungeon/gearart2.js', './js/dungeon/armour.js',
  './fonts/cinzel-latin.woff2', './fonts/new-rocker.woff2', './fonts/alegreya-sans-400.woff2', './fonts/alegreya-sans-500.woff2', './fonts/alegreya-sans-700.woff2', './fonts/alegreya-sans-800.woff2', './fonts/alegreya-sans-italic.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/logo.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && url.pathname.endsWith('/version.json')) return; // always straight to network
  // Same-origin files: ask the server whether they changed (cheap ETag check)
  // instead of trusting the browser's HTTP cache, so new code arrives immediately.
  const req = sameOrigin ? new Request(url.href, { cache: 'no-cache', credentials: 'same-origin' }) : e.request;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
