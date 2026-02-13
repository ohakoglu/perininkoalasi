const CACHE = "perinin-koalasi-v02";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./js/app.js",
  "./js/state.js",
  "./js/storage.js",
  "./js/koala.js",
  "./assets/koala/base/base_mint.png",
  "./assets/koala/base/base_lavender.png",
  "./assets/koala/base/base_sky.png",
  "./assets/koala/hats/hat_flower.png",
  "./assets/koala/hats/hat_beanie.png",
  "./assets/koala/hats/hat_sun.png",
  "./assets/koala/hats/hat_ribbon.png",
  "./assets/koala/hats/hat_crown.png",
  "./assets/koala/neck/neck_scarf_red.png",
  "./assets/koala/neck/neck_bow_blue.png",
  "./assets/koala/neck/neck_leaf_necklace.png",
  "./assets/koala/hand/hand_star.png",
  "./assets/koala/hand/hand_book.png",
  "./assets/koala/hand/hand_leaf.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
