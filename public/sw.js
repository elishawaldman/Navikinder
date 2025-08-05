// Service Worker for PWA and Push Notifications
const CACHE_NAME = 'medication-tracker-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/Navikinder logo 256.png' // Include notification icon in cache
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

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      console.error('Failed to parse push data as JSON:', e);
      notificationData = { body: event.data.text() }; // fallback
    }
  }
  
  const title = notificationData.title || 'Medication Reminder';
  
  // Simplified options for maximum iOS PWA compatibility
  // Only use title, body, and PNG icon - remove all advanced features
  const options = {
    body: notificationData.body || 'It\'s time for a medication dose',
    icon: '/Navikinder logo 256.png', // Use larger icon for better iOS compatibility
    tag: 'medication-reminder',
    data: notificationData.data || {}
    // Remove: vibrate, badge, actions, requireInteraction - not supported on iOS PWA
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch(error => {
        console.error('Failed to show notification:', error);
      })
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