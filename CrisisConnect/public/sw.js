// CrisisConnect Service Worker: Clean, Resilient Offline Engine
const CACHE_NAME = 'crisisconnect-v33-office';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/firebase-config.js',
  '/qrcode.bundle.js',
  '/manifest.json',
  '/icon.svg'
];

// 1. Install: Pre-cache local files safely
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Pre-caching static assets');
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          console.warn('[SW] Pre-cache skipped asset:', asset);
        }
      }
    })
  );
});

// 2. Activate: Clear old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch: Strict MIME-type isolation so CSS/JS never receive HTML
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. API Requests: NEVER intercept POST / PUT / DELETE mutation requests!
  // Let mutations hit network or reject cleanly so client offline queue handles them
  if (url.pathname.startsWith('/api/')) {
    if (event.request.method !== 'GET') {
      return; // Direct network passthrough for all mutation requests
    }

    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const networkRes = await fetch(event.request);
          if (networkRes && networkRes.ok) {
            cache.put(event.request, networkRes.clone());
          }
          return networkRes;
        } catch (err) {
          const cached = await cache.match(event.request);
          if (cached) return cached;
          return new Response(JSON.stringify([]), { 
            status: 503, 
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      })
    );
    return;
  }

  // B. CSS Stylesheets: Network first with cache fallback
  if (url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then(c => c.put(url.pathname, copy));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(url.pathname);
          if (cached) return cached;
          return new Response('/* Offline CSS Fallback */', { headers: { 'Content-Type': 'text/css' } });
        })
    );
    return;
  }

  // C. JavaScript Scripts: Network first with cache fallback
  if (url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then(c => c.put(url.pathname, copy));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(url.pathname);
          if (cached) return cached;
          return new Response('console.warn("Offline script fallback");', { headers: { 'Content-Type': 'application/javascript' } });
        })
    );
    return;
  }

  // D. HTML Document Navigation
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).then((networkRes) => {
        if (networkRes && networkRes.ok) {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then(c => c.put('/index.html', copy));
        }
        return networkRes;
      }).catch(async () => {
        const cached = await caches.match('/index.html') || await caches.match('/');
        if (cached) return cached;
        return new Response('<!DOCTYPE html><html><body><h2>CrisisConnect Offline</h2><p>Please check your connection.</p></body></html>', {
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }

  // E. Images, Icons, Fonts, Maps
  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      if (cached) return cached;
      try {
        const networkRes = await fetch(event.request);
        if (networkRes && networkRes.ok) {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
        }
        return networkRes;
      } catch (err) {
        return new Response('', { status: 204 });
      }
    })
  );
});
