// Service Worker for PWA and Push Notifications
const CACHE_NAME = 'medication-tracker-v3'; // Bumped for logging fixes

console.log('🚀 Service Worker script loaded');

// Send initial log to indicate service worker is active
const sendInitialLog = async () => {
  console.log('📡 Service Worker attempting to send initial log');
  await sendLogToApp('info', '🚀 Service Worker is active and ready');
};
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
  console.log('🔄 Service Worker activated');
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
    }).then(() => {
      console.log('🧹 Cache cleanup complete');
      // Send initial log after activation
      setTimeout(sendInitialLog, 1000); // Delay to ensure clients are ready
    })
  );
});

// Listen for messages from main app
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'TEST_CONNECTION') {
    sendLogToApp('success', '✅ Service Worker connection verified');
  } else if (event.data && event.data.type === 'TEST_LOG') {
    sendLogToApp('success', '🧪 Service Worker test message received');
    sendLogToApp('info', '📊 Service Worker is functioning correctly');
  }
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
    
    // Also log to console for development
    console.log(`[SW] ${message}`, data || '');
  } catch (error) {
    console.error('[SW] Failed to send log to app:', error);
  }
};

// Push event - iOS PWA compatible with flat payload structure
self.addEventListener('push', (event) => {
  sendLogToApp('info', '🔔 Push notification received');
  sendLogToApp('info', `🔒 Permission: ${Notification.permission}`);
  
  // CRITICAL: Wrap ALL push event code with event.waitUntil()
  event.waitUntil(
    (async () => {
      let data = {};
      
      if (event.data) {
        try {
          data = event.data.json();
          sendLogToApp('success', '📦 Successfully parsed push data', data);
        } catch (e) {
          sendLogToApp('error', '❌ Failed to parse JSON', e.message);
          try {
            // Fallback for simple text pushes
            data = { body: event.data.text() };
            sendLogToApp('warning', '⚠️ Using text fallback');
          } catch (textError) {
            sendLogToApp('error', '❌ Failed to parse text', textError.message);
            data = {};
          }
        }
      } else {
        sendLogToApp('warning', '⚠️ No data in push event');
      }
      
      // Use flat structure - no nested notification object
      const title = data.title || 'Medication Reminder';
      const options = {
        body: data.body || 'It\'s time for a medication dose',
        icon: '/navikinder-logo-256.png',
        badge: '/navikinder-logo-256.png',
        data: data.data || {},
        requireInteraction: true, // Keep notification visible until user interacts
        // tag: 'medication-reminder', // Keep commented for testing
      };

      sendLogToApp('info', '📱 Attempting to show notification', { title, body: options.body });

      try {
        await self.registration.showNotification(title, options);
        sendLogToApp('success', '✅ Notification shown successfully!');
      } catch (error) {
        sendLogToApp('error', '❌ showNotification failed', {
          name: error.name,
          message: error.message,
          permission: Notification.permission
        });
        
        // Try to show a basic notification as fallback
        try {
          await self.registration.showNotification('Medication Reminder', {
            body: 'It\'s time for a medication dose',
            icon: '/navikinder-logo-256.png'
          });
          sendLogToApp('success', '✅ Fallback notification shown');
        } catch (fallbackError) {
          sendLogToApp('error', '❌ Even fallback notification failed', fallbackError.message);
        }
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