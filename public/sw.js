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
    notificationData = event.data.json();
  }
  
  const title = notificationData.title || 'Medication Reminder';
  
  // iOS-compatible notification options
  const options = {
    body: notificationData.body || 'It\'s time for a medication dose',
    icon: '/placeholder.svg',
    tag: 'medication-reminder',
    data: notificationData.data || {},
    // iOS-compatible settings
    silent: false,
    vibrate: [200, 100, 200]
  };

  // Add actions only for non-iOS devices (iOS PWA doesn't support them reliably)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!isIOS) {
    options.requireInteraction = true;
    options.badge = '/placeholder.svg';
    options.actions = [
      {
        action: 'given',
        title: 'Mark as Given'
      },
      {
        action: 'skip',
        title: 'Skip Dose'
      }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'given' || action === 'skip') {
    // Handle medication logging
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].postMessage({
            type: 'MEDICATION_ACTION',
            action: action,
            doseInstanceId: data.doseInstanceId
          });
        }
        return clients.openWindow('/overview');
      })
    );
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/overview');
      })
    );
  }
});