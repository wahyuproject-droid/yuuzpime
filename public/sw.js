self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{await Promise.all((await caches.keys()).filter(k=>/eliasdex|yuuzpime|workbox/i.test(k)).map(k=>caches.delete(k)));await self.registration.unregister();await self.clients.claim();})()));
