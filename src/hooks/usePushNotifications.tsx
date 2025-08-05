import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Detect iOS and check support
  useEffect(() => {
    const checkSupport = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
                          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);
      
      // Check if running as PWA on iOS
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      const supported = 'serviceWorker' in navigator &&
                       'PushManager' in window &&
                       'Notification' in window;
      
      setIsSupported(supported);
      
      // Log environment details
      console.log('📱 Device Detection:', {
        isIOS: isIOSDevice,
        isPWA: isStandalone,
        pushSupported: supported,
        notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'not available'
      });
    };
    
    checkSupport();
  }, []);

  // Check subscription status
  useEffect(() => {
    if (isSupported && user) {
      checkSubscriptionStatus();
    }
  }, [isSupported, user]);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      
      if (subscription) {
        console.log('📍 Existing subscription found:', {
          endpoint: subscription.endpoint.substring(0, 50) + '...',
          isApple: subscription.endpoint.includes('push.apple.com')
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  // Test notification function for iOS debugging - sends REAL push notification
  const testNotification = useCallback(async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not logged in",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🧪 Sending real push notification test...');
      
      // Call the Supabase Edge Function to send a real push notification
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          dose_instance_id: "test-" + Date.now(),
          due_datetime: new Date().toISOString(),
          dose_amount: 1,
          dose_unit: "tablet",
          medication_name: "🧪 Test Medication",
          child_name: "Test User",
          parent_email: user.email!, // Edge Function expects parent_email, not user_id
          parent_name: user.user_metadata?.display_name || "Test Parent"
        }
      });

      if (error) {
        console.error('❌ Push notification error:', error);
        throw error;
      }

      console.log('✅ Push notification sent successfully:', data);
      
      toast({
        title: "Test Sent! 🚀",
        description: "Real push notification sent - check your device in a few seconds"
      });

    } catch (error: any) {
      console.error('❌ Test notification error:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Could not send test notification",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive"
      });
      return false;
    }

    try {
      // iOS requires permission request from user gesture
      const permission = await Notification.requestPermission();
      console.log('🔐 Permission result:', permission);
      
      if (permission === 'granted') {
        // On iOS, immediately show a test notification to confirm it works
        if (isIOS) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification('Notifications Enabled! 🎉', {
            body: 'You will now receive medication reminders',
            icon: '/navikinder-logo-256.png',
            badge: '/navikinder-logo-256.png',
            tag: 'permission-granted',
            requireInteraction: false
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const subscribe = async () => {
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "Please log in to enable notifications",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🚀 Starting subscription process...');
      
      // Check if PWA on iOS
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      if (isIOS && !isStandalone) {
        toast({
          title: "Install App First",
          description: "On iOS, please add this app to your home screen first, then enable notifications",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Request permission (required to be in user gesture context)
      const permission = await requestPermission();
      if (!permission) {
        toast({
          title: "Permission Denied",
          description: "Please allow notifications in your device settings",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      console.log('📝 Service Worker ready:', registration);

      // Get VAPID key
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        throw new Error('VAPID public key not configured');
      }

      // iOS-specific: Small delay to ensure permission is fully processed
      if (isIOS) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Subscribe to push notifications
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(publicVapidKey)
      };

      console.log('📲 Subscribing with options:', subscribeOptions);
      
      const subscription = await registration.pushManager.subscribe(subscribeOptions);

      console.log('✅ Subscription created:', {
        endpoint: subscription.endpoint,
        isApplePush: subscription.endpoint.includes('push.apple.com'),
        keys: {
          p256dh: subscription.getKey('p256dh') ? 'present' : 'missing',
          auth: subscription.getKey('auth') ? 'present' : 'missing'
        }
      });

      // Store in database
      const subscriptionData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
        user_agent: navigator.userAgent,
        is_ios: isIOS
      };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData);

      if (error) throw error;

      setIsSubscribed(true);
      
      // Success message
      const platformMessage = subscription.endpoint.includes('push.apple.com') 
        ? 'iOS/Safari notifications enabled!' 
        : 'Notifications enabled!';
      
      toast({
        title: "Success! 🎉",
        description: platformMessage
      });

      // On iOS, offer to send test notification
      if (isIOS) {
        setTimeout(() => {
          testNotification();
        }, 2000);
      }

    } catch (error: any) {
      console.error('❌ Subscription error:', error);
      
      let errorMessage = "Failed to enable notifications";
      if (error.message?.includes('permission')) {
        errorMessage = "Notification permission was denied";
      } else if (error.message?.includes('VAPID')) {
        errorMessage = "Server configuration error";
      } else if (error.name === 'NotAllowedError') {
        errorMessage = "Please allow notifications in Settings > Notifications";
      }
      
      toast({
        title: "Subscription Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        if (error) throw error;
      }

      setIsSubscribed(false);
      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notifications anymore"
      });
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    isIOS,
    subscribe,
    unsubscribe,
    testNotification,
    requestPermission
  };
};

// Helper function to convert VAPID key
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