// Service Worker for PWA and Push Notifications - iOS Fixed Version
const CACHE_NAME = 'medication-tracker-v5'; // Bumped for iOS fixes

console.log('🚀 Service Worker script loaded');

// Helper function to send logs to main app
const sendLogToApp = async (logType, message, data = null) => {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    console.log(`[SW] Found ${clients.length} clients to send log to`);
    
    const logMessage = {
      type: 'SW_LOG',
      logType,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    clients.forEach((client, index) => {
      try {
        console.log(`[SW] Sending log to client ${index + 1}:`, logMessage);
        client.postMessage(logMessage);
      } catch (clientError) {
        console.error(`[SW] Failed to send to client ${index + 1}:`, clientError);
      }
    });
    
    console.log(`[SW] ${message}`, data || '');
  } catch (error) {
    console.error('[SW] Failed to send log to app:', error);
  }
};

const urlsToCache = [
  '/',
  '/manifest.json',
  '/navikinder-logo-256.png'
];

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activated');
  event.waitUntil(
    self.clients.claim().then(() => {
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      });
    })
  );
});

// Message handler
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'TEST_CONNECTION') {
    sendLogToApp('success', '✅ Service Worker connection verified');
  } else if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    // Test notification from main app
    event.waitUntil(
      self.registration.showNotification('Test Notification', {
        body: 'This is a test notification from your app',
        icon: '/navikinder-logo-256.png',
        badge: '/navikinder-logo-256.png',
        tag: 'test-notification',
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200]
      }).then(() => {
        sendLogToApp('success', '✅ Test notification displayed');
      }).catch((error) => {
        sendLogToApp('error', '❌ Test notification failed', error.message);
      })
    );
  }
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
      .catch(() => fetch(event.request))
  );
});

// CRITICAL iOS FIX: Push event handler
self.addEventListener('push', (event) => {
  console.log('🔔 Push event received');
  
  const showNotificationPromise = (async () => {
    try {
      let data = {};
      
      // Parse push data
      if (event.data) {
        try {
          data = event.data.json();
          console.log('📦 Push data parsed:', data);
        } catch (e) {
          console.error('Failed to parse push data:', e);
          data = { 
            title: 'Medication Reminder',
            body: event.data.text() || 'Time for medication'
          };
        }
      }
      
      const title = data.title || 'Medication Reminder';
      
      // iOS-optimized notification options
      const options = {
        body: data.body || 'It\'s time for a medication dose',
        icon: '/navikinder-logo-256.png',
        badge: '/navikinder-logo-256.png',
        data: data.data || {},
        // iOS specific options
        tag: `med-${Date.now()}`, // Unique tag to prevent grouping
        renotify: true, // Force notification even if tag exists
        requireInteraction: false, // iOS doesn't support this well
        silent: false, // Ensure sound/vibration
        vibrate: [200, 100, 200], // Vibration pattern
        timestamp: Date.now(),
        actions: [] // iOS PWA doesn't support actions
      };
      
      // Show notification with iOS-specific handling
      await self.registration.showNotification(title, options);
      
      console.log('✅ Notification displayed successfully');
      sendLogToApp('success', '✅ Push notification shown', { title, body: options.body });
      
      // For iOS, also try to focus the app if it's open
      const clients = await self.clients.matchAll({ 
        type: 'window',
        includeUncontrolled: true 
      });
      
      if (clients.length > 0) {
        // Send message to all open windows
        clients.forEach(client => {
          client.postMessage({
            type: 'PUSH_RECEIVED',
            data: data
          });
        });
      }
      
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      sendLogToApp('error', '❌ Notification error', error.message);
      
      // Fallback notification
      try {
        await self.registration.showNotification('Medication Reminder', {
          body: 'Check your medications',
          icon: '/navikinder-logo-256.png',
          tag: `fallback-${Date.now()}`
        });
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    }
  })();
  
  event.waitUntil(showNotificationPromise);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then((clientList) => {
      // Focus existing window or open new one
      const client = clientList.find(c => c.url.includes(self.location.origin));
      if (client) {
        return client.focus();
      }
      return clients.openWindow('/overview');
    })
  );
});

// iOS-specific: Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification was closed', event);
});