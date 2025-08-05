// Service Worker for PWA and Push Notifications
const CACHE_NAME = 'medication-tracker-v2'; // Bumped for critical iOS fixes
const urlsToCache = [
  '/',
  '/manifest.json',
  '/navikinder-logo-256.png' // Include notification icon in cache
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Activate event - take control immediately
self.addEventListener('activate', (event) => {
  self.clients.claim(); // Take control of all pages immediately
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Return cached version
        }
        // Fetch from network
        return fetch(event.request).catch((error) => {
          console.error('Network fetch failed:', error);
          throw error;
        });
      })
      .catch((error) => {
        console.error('Cache lookup failed:', error);
        return fetch(event.request);
      })
  );
});

// Push event - iOS compatible with proper event.waitUntil() wrapping
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  console.log('Service worker permission:', Notification.permission);
  
  // CRITICAL: Wrap ALL push event code with event.waitUntil()
  event.waitUntil(
    (async () => {
      let data = {};
      
      if (event.data) {
        try {
          data = event.data.json();
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          try {
            data = { body: event.data.text() };
          } catch (textError) {
            console.error('Failed to parse text:', textError);
            data = {};
          }
        }
      }
      
      const title = data.title || 'Medication Reminder';
      const options = {
        body: data.body || 'It\'s time for a medication dose',
        icon: '/navikinder-logo-256.png',
        // Remove tag during testing to avoid notification replacement
        // tag: 'medication-reminder',
        data: data.data || {}
      };

      try {
        await self.registration.showNotification(title, options);
        console.log('✅ Notification shown successfully');
      } catch (error) {
        // If this is NotAllowedError, user permission/settings are the blocker
        console.error('❌ showNotification failed:', error.name, error.message, 'permission=', Notification.permission);
      }
    })()
  );
});

// Notification click event - improved window management
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open in a window
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      // No existing window found, open new one
      return clients.openWindow('/overview');
    }).catch(error => {
      console.error('Failed to handle notification click:', error);
    })
  );
});