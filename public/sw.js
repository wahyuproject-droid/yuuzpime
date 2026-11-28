self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  await Promise.all((await caches.keys()).filter(k=>k.startsWith('eliasdex-')||k.startsWith('yuuzpime-')||k.startsWith('workbox-')).map(k=>caches.delete(k)));
  await self.registration.unregister();
  await self.clients.claim();
})()));
