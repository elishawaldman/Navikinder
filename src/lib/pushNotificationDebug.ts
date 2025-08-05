/**
 * Push Notification Debug Helper
 * 
 * This module provides comprehensive debugging tools for push notifications,
 * helping identify issues with service worker registration, VAPID keys, and subscriptions.
 */

export const debugPushNotifications = async () => {
  console.log('🔍 Starting Push Notification Debug...');
  
  const results: any = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    checks: {}
  };

  // 1. Check Service Worker Support
  results.checks.serviceWorkerSupport = 'serviceWorker' in navigator;
  console.log('✅ Service Worker Support:', results.checks.serviceWorkerSupport);

  // 2. Check Push Manager Support
  results.checks.pushManagerSupport = 'PushManager' in window;
  console.log('✅ Push Manager Support:', results.checks.pushManagerSupport);

  // 3. Check Notification Support
  results.checks.notificationSupport = 'Notification' in window;
  console.log('✅ Notification Support:', results.checks.notificationSupport);

  // 4. Check Notification Permission
  results.checks.notificationPermission = Notification.permission;
  console.log('🔒 Notification Permission:', results.checks.notificationPermission);

  // 5. Check VAPID Key Configuration
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  results.checks.vapidKeyConfigured = !!vapidKey;
  results.checks.vapidKeyLength = vapidKey?.length || 0;
  console.log('🔑 VAPID Key Configured:', results.checks.vapidKeyConfigured);
  console.log('🔑 VAPID Key Length:', results.checks.vapidKeyLength);

  if (results.checks.serviceWorkerSupport) {
    try {
      // 6. Check Service Worker Registration
      const registration = await navigator.serviceWorker.getRegistration();
      results.checks.serviceWorkerRegistered = !!registration;
      results.checks.serviceWorkerScope = registration?.scope;
      console.log('🔧 Service Worker Registered:', results.checks.serviceWorkerRegistered);
      console.log('🔧 Service Worker Scope:', results.checks.serviceWorkerScope);

      if (registration) {
        // 7. Check Push Subscription
        const subscription = await registration.pushManager.getSubscription();
        results.checks.hasActiveSubscription = !!subscription;
        results.checks.subscriptionEndpoint = subscription?.endpoint;
        results.checks.isAppleEndpoint = subscription?.endpoint?.includes('web.push.apple.com');
        console.log('📱 Has Active Subscription:', results.checks.hasActiveSubscription);
        console.log('📱 Subscription Endpoint:', subscription?.endpoint?.substring(0, 50) + '...');
        console.log('🍎 Is Apple Endpoint:', results.checks.isAppleEndpoint);
      }
    } catch (error) {
      console.error('❌ Error checking service worker:', error);
      results.checks.serviceWorkerError = error.message;
    }
  }

  // 8. Environment Check
  results.checks.environment = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    hasViteVapidKey: !!import.meta.env.VITE_VAPID_PUBLIC_KEY
  };

  console.log('🌐 Environment:', results.checks.environment);

  // 9. iOS Specific Checks
  if (results.isIOS) {
    console.log('🍎 iOS Device Detected');
    results.checks.iosSpecific = {
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isAddedToHomeScreen: (window.navigator as any).standalone === true,
      isPWA: window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    };
    console.log('🍎 iOS PWA Status:', results.checks.iosSpecific);
  }

  console.log('🔍 Debug Complete. Full Results:', results);
  return results;
};

/**
 * Test push notification subscription with detailed logging
 */
export const testPushSubscription = async () => {
  console.log('🧪 Testing Push Subscription...');
  
  try {
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      throw new Error('VAPID public key not configured. Please set VITE_VAPID_PUBLIC_KEY in your environment.');
    }

    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker Ready:', registration);

    // Request permission if needed
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('🔒 Permission Result:', permission);
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    // Convert VAPID key
    const applicationServerKey = urlB64ToUint8Array(vapidKey);
    console.log('🔑 VAPID Key Converted, Length:', applicationServerKey.length);

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    console.log('✅ Subscription Created:', {
      endpoint: subscription.endpoint,
      isApple: subscription.endpoint.includes('web.push.apple.com'),
      keys: {
        p256dh: subscription.getKey('p256dh') ? 'present' : 'missing',
        auth: subscription.getKey('auth') ? 'present' : 'missing'
      }
    });

    return subscription;
  } catch (error) {
    console.error('❌ Subscription Test Failed:', error);
    throw error;
  }
};

// Helper function to convert VAPID key (same as in usePushNotifications)
function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}