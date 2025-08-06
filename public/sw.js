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
        tag: 'test-notification-' + Date.now(),
        requireInteraction: false,
        silent: false,
        renotify: true,
        vibrate: [200, 100, 200]
      }).then(() => {
        sendLogToApp('success', '✅ Test notification displayed');
      }).catch((error) => {
        sendLogToApp('error', '❌ Test notification failed', error.message);
      })
    );
  } else if (event.data && event.data.type === 'SIMULATE_PUSH') {
    // Simulate a push event locally
    const pushData = event.data.pushData || {
      title: 'Simulated Push',
      body: 'This is a simulated push notification'
    };
    
    event.waitUntil(
      self.registration.showNotification(pushData.title, {
        body: pushData.body,
        icon: '/navikinder-logo-256.png',
        badge: '/navikinder-logo-256.png',
        data: pushData.data || {},
        tag: 'simulate-' + Date.now(),
        requireInteraction: false,
        renotify: true,
        vibrate: [200, 100, 200]
      }).then(() => {
        sendLogToApp('success', '✅ Simulated push notification displayed');
      }).catch((error) => {
        sendLogToApp('error', '❌ Simulated push failed', error.message);
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
  console.log('🔔 Push event received at', new Date().toISOString());
  
  // MUST wrap everything in event.waitUntil to prevent early termination
  event.waitUntil((async () => {
    try {
      let payload = {};
      
      // Parse push data - iOS may send it differently
      if (event.data) {
        try {
          payload = event.data.json();
          console.log('📦 Parsed push payload:', payload);
        } catch (e) {
          console.log('⚠️ Failed to parse as JSON, trying text');
          const text = event.data.text();
          console.log('📝 Text data:', text);
          
          // Try to parse text as JSON one more time
          try {
            payload = JSON.parse(text);
          } catch (e2) {
            // Fallback to basic structure
            payload = {
              title: 'Medication Reminder',
              body: text || 'Time for medication'
            };
          }
        }
      } else {
        console.log('⚠️ No data in push event');
        payload = {
          title: 'Medication Reminder',
          body: 'You have a medication to take'
        };
      }
      
      // Extract title and body
      const title = payload.title || 'Medication Reminder';
      const body = payload.body || 'Time for your medication';
      
      console.log('📢 Showing notification:', { title, body });
      
      // iOS-specific notification options
      const options = {
        body: body,
        icon: '/navikinder-logo-256.png',
        badge: '/navikinder-logo-256.png',
        data: payload.data || {},
        tag: `push-${Date.now()}`, // Always unique to force display
        renotify: true,
        requireInteraction: false, // iOS doesn't support this
        silent: false,
        // iOS specific - ensure notification shows
        dir: 'auto',
        lang: 'en-US',
        timestamp: Date.now()
      };
      
      // Show the notification
      await self.registration.showNotification(title, options);
      
      console.log('✅ Notification shown successfully');
      
      // Log to app if possible
      try {
        const allClients = await self.clients.matchAll({
          includeUncontrolled: true,
          type: 'window'
        });
        
        allClients.forEach(client => {
          client.postMessage({
            type: 'PUSH_RECEIVED',
            payload: payload,
            timestamp: new Date().toISOString()
          });
        });
        
        console.log(`📤 Notified ${allClients.length} client(s)`);
      } catch (clientError) {
        console.error('Client notification error:', clientError);
      }
      
    } catch (error) {
      console.error('❌ Push handler error:', error);
      
      // Emergency fallback - show SOMETHING
      try {
        await self.registration.showNotification('📱 Notification', {
          body: 'You have a new notification',
          icon: '/navikinder-logo-256.png',
          tag: `error-${Date.now()}`
        });
        console.log('✅ Fallback notification shown');
      } catch (fallbackError) {
        console.error('❌ Even fallback failed:', fallbackError);
      }
    }
  })());
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