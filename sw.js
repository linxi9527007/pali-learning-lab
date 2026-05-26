// Pāli Learning Lab 20.33 cache cleaner
self.addEventListener("install", event => {
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({type:"window"}))
      .then(clients => clients.forEach(client => client.navigate(client.url)))
  );
});
self.addEventListener("fetch", event => {
  return;
});
