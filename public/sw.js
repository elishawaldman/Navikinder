// Service Worker for PWA and Push Notifications
const CACHE_NAME = 'medication-tracker-v1';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
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
    icon: '/favicon-32x32.png', // Use PNG for best iOS compatibility
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

// Notification click event - simplified for iOS PWA compatibility
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Simple click action - just open the app (no custom actions for iOS compatibility)
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      if (clientList.length > 0) {
        // Focus existing tab/window
        return clientList[0].focus();
      }
      // Open new window/tab
      return clients.openWindow('/overview');
    }).catch(error => {
      console.error('Failed to handle notification click:', error);
    })
  );
});