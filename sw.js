const CACHE='spend-v15';
const FILES=['./','index.html','manifest.webmanifest','app-icon-blue-180.png','app-icon-blue-512.png'];
// Install: download fresh copies, skipping the browser's own cache.
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE)
  .then(c=>Promise.all(FILES.map(f=>fetch(new Request(f,{cache:'reload'})).then(r=>{if(!r.ok)throw new Error(f);return c.put(f,r)}))))
  .then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const isPage=req.mode==='navigate';
  e.respondWith(caches.open(CACHE).then(async c=>{
    if(isPage){ // pages: try the network first so updates show up, fall back to the saved copy offline
      try{const r=await fetch(req,{cache:'no-cache'});if(r.ok)c.put('index.html',r.clone());return r}
      catch(_){return (await c.match('index.html'))||(await c.match('./'))}
    }
    const hit=await c.match(req);  // other files: saved copy first, refresh in the background
    const net=fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r}).catch(()=>null);
    return hit||(await net);
  }));
});
