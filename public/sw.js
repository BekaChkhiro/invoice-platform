const CACHE_NAME = 'invoice-platform-v1';
const STATIC_CACHE_NAME = 'invoice-platform-static-v1';
const DYNAMIC_CACHE_NAME = 'invoice-platform-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
];

const CACHE_STRATEGIES = {
  static: ['/_next/static/', '/icons/', '/images/'],
  networkFirst: ['/api/', '/dashboard/'],
  cacheFirst: ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.css', '.js']
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    handleFetch(request)
  );
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // API requests - Network first with fallback
    if (url.pathname.startsWith('/api/')) {
      return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME);
    }
    
    // Static assets - Cache first
    if (isStaticAsset(url.pathname)) {
      return await cacheFirstStrategy(request, STATIC_CACHE_NAME);
    }
    
    // Dashboard pages - Network first with offline fallback
    if (url.pathname.startsWith('/dashboard')) {
      return await networkFirstWithOfflineFallback(request, DYNAMIC_CACHE_NAME);
    }
    
    // Default - Network first
    return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME);
    
  } catch (error) {
    console.error('Service Worker: Fetch error', error);
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    // Return cached version if available
    return caches.match(request);
  }
}

function isStaticAsset(pathname) {
  return CACHE_STRATEGIES.static.some(path => pathname.startsWith(path)) ||
         CACHE_STRATEGIES.cacheFirst.some(ext => pathname.includes(ext));
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(cacheName).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {
      // Ignore background update errors
    });
    
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

async function networkFirstWithOfflineFallback(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Get failed requests from IndexedDB and retry them
    const failedRequests = await getFailedRequests();
    
    for (const request of failedRequests) {
      try {
        await fetch(request.url, request.options);
        await removeFailedRequest(request.id);
        console.log('Service Worker: Retry successful', request.url);
      } catch (error) {
        console.log('Service Worker: Retry failed', request.url, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync error', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'ნახვა',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'დახურვა',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Invoice Platform', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Message handler for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(updateCache());
  }
});

async function updateCache() {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    await cache.addAll(STATIC_ASSETS);
    console.log('Service Worker: Cache updated');
  } catch (error) {
    console.error('Service Worker: Cache update failed', error);
  }
}

// Helper functions for IndexedDB operations
async function getFailedRequests() {
  // Implementation would use IndexedDB to store/retrieve failed requests
  return [];
}

async function removeFailedRequest(id) {
  // Implementation would remove the request from IndexedDB
  return true;
}

// Error handler
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled rejection', event.reason);
});