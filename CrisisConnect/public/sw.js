// CrisisConnect Service Worker: Offline-First Crisis Grid
const CACHE_NAME = 'crisisconnect-v8';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icon.svg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// 1. Install: Pre-cache core shell & skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline emergency shell v6');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Error pre-caching some assets:', err);
      });
    })
  );
});

// 2. Activate: Purge ALL obsolete caches immediately & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. API Requests: Stale-While-Revalidate with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(async () => {
            if (!cachedResponse) {
              if (url.pathname.includes('/api/disasters')) {
                return new Response(JSON.stringify([
                  {
                    id: 'offline-alert',
                    title: 'OFFLINE MODE: Cellular Grid Unavailable',
                    description: 'Showing cached local disaster advisory. Stay sheltered in place until connection restores.',
                    severity: 'Red',
                    pubDate: new Date().toISOString()
                  }
                ]), { headers: { 'Content-Type': 'application/json' } });
              }
              if (url.pathname.includes('/api/community')) {
                return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
              }
            }
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // B. HTML Navigation, Scripts & Styles: Network-First (Fresh updates, Cache fallback for offline)
  if (
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[ServiceWorker] Network failed, serving cached shell for:', url.pathname);
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // C. Map Tiles & External Assets: Cache-First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.includes('arcgisonline.com') ||
           event.request.url.includes('tile.openstreetmap.org') ||
           event.request.url.includes('unpkg.com'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return null or empty response if tile fails offline
        return null;
      });
    })
  );
});

// 4. Background Sync: Auto-sync queued offline community broadcasts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-community-posts') {
    event.waitUntil(syncOfflineCommunityPosts());
  }
});

async function syncOfflineCommunityPosts() {
  console.log('[ServiceWorker] Background sync triggered: uploading queued messages');
  const allClients = await self.clients.matchAll({ includeUncontrolled: true });
  allClients.forEach((client) => {
    client.postMessage({ type: 'TRIGGER_SYNC_QUEUE' });
  });
}
