// sw.js - Service Worker with remote debug logging
const CACHE_NAME = 'medication-tracker-v8'; // Bump version to force update
const DEBUG_ENDPOINT = 'https://nqrtkgxqgenflhpijpxa.supabase.co/functions/v1/debug-log';

// Remote logging function
async function remoteLog(message, data = {}) {
  const logData = {
    message,
    data,
    timestamp: new Date().toISOString(),
    userAgent: self.navigator.userAgent
  };
  
  console.log('[SW]', message, data);
  
  // Try to send log to server
  try {
    await fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(() => {}); // Ignore errors
  } catch (e) {
    // Silently fail
  }
}

// Log SW start
remoteLog('🚀 Service Worker loaded - Version 8');

const urlsToCache = [
  '/',
  '/manifest.json',
  '/navikinder-logo-256.png'
];

// Install event
self.addEventListener('install', (event) => {
  remoteLog('📦 Install event triggered');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        remoteLog('✅ Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => remoteLog('✅ URLs cached'))
      .catch((error) => {
        remoteLog('❌ Cache installation failed', { error: error.message });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  remoteLog('🔄 Service Worker activating');
  event.waitUntil(
    self.clients.claim().then(() => {
      remoteLog('✅ Clients claimed');
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              remoteLog(`🗑️ Deleting old cache: ${cacheName}`);
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
  remoteLog('📨 Message received', { type: event.data?.type });
  
  // Add version check
  if (event.data && event.data.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ version: 'v8-debug' });
    }
    return;
  }
  
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    remoteLog('🧪 Test notification requested');
    event.waitUntil(
      self.registration.showNotification('Test Notification v8', {
        body: 'This is from service worker version 8 with debug',
        icon: '/navikinder-logo-256.png',
        badge: '/navikinder-logo-256.png',
        tag: 'test-' + Date.now(),
        requireInteraction: false,
        silent: false
      }).then(() => {
        remoteLog('✅ Test notification shown');
      }).catch((error) => {
        remoteLog('❌ Test notification failed', { error: error.message });
      })
    );
  }
});

// Fetch event - simplified
self.addEventListener('fetch', (event) => {
  // Don't log fetch events (too noisy)
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
      .catch(() => fetch(event.request))
  );
});

// CRITICAL: Push event handler
self.addEventListener('push', (event) => {
  const timestamp = new Date().toISOString();
  remoteLog('🔔 PUSH EVENT RECEIVED', { timestamp });
  
  event.waitUntil((async () => {
    try {
      let payload = {};
      
      // Parse push data
      if (event.data) {
        try {
          payload = event.data.json();
          remoteLog('📦 Parsed JSON payload', payload);
        } catch (e) {
          const text = event.data.text();
          remoteLog('📝 Text payload', { text });
          try {
            payload = JSON.parse(text);
          } catch (e2) {
            payload = {
              notification: {
                title: 'Medication Reminder',
                body: text || 'Time for medication'
              }
            };
          }
        }
      } else {
        remoteLog('⚠️ No data in push event');
        payload = {
          notification: {
            title: 'Medication Reminder',
            body: 'You have a medication to take'
          }
        };
      }
      
      // Extract notification data
      const notification = payload.notification || {};
      const title = notification.title || 'Medication Reminder';
      const body = notification.body || 'Time for your medication';
      
      remoteLog('📢 Attempting to show notification', { title, body });
      
      // Show notification
      await self.registration.showNotification(title, {
        body: body,
        icon: notification.icon || '/navikinder-logo-256.png',
        badge: notification.badge || '/navikinder-logo-256.png',
        data: payload.data || {},
        tag: `push-${Date.now()}`,
        renotify: true,
        silent: false
      });
      
      remoteLog('✅ Notification display called successfully');
      
    } catch (error) {
      remoteLog('❌ Push handler error', { 
        error: error.message,
        stack: error.stack 
      });
      
      // Emergency fallback
      try {
        await self.registration.showNotification('📱 Notification', {
          body: 'You have a new notification',
          icon: '/navikinder-logo-256.png',
          tag: `error-${Date.now()}`
        });
        remoteLog('✅ Fallback notification shown');
      } catch (fallbackError) {
        remoteLog('❌ Fallback also failed', { 
          error: fallbackError.message 
        });
      }
    }
  })());
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  remoteLog('👆 Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then((clientList) => {
      const client = clientList.find(c => c.url.includes(self.location.origin));
      if (client) {
        return client.focus();
      }
      return clients.openWindow('/overview');
    })
  );
});

remoteLog('📍 Service Worker script fully loaded');