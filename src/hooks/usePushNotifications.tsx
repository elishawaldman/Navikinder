import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { debugPushNotifications, testPushSubscription } from '@/lib/pushNotificationDebug';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if push notifications are supported
  useEffect(() => {
    setIsSupported(
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }, []);

  // Check current subscription status
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
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive"
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const subscribe = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Run comprehensive debug check first
      console.log('🚀 Starting push notification subscription...');
      const debugResults = await debugPushNotifications();
      
      // Check for iOS specific requirements
      if (debugResults.isIOS && !debugResults.checks.iosSpecific?.isPWA) {
        toast({
          title: "iOS Setup Required",
          description: "On iOS, please add this app to your home screen first, then try enabling notifications",
          variant: "destructive"
        });
        return;
      }

      const permission = await requestPermission();
      if (!permission) {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications to receive medication reminders",
          variant: "destructive"
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from environment
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!publicVapidKey) {
        console.error('❌ VAPID public key not found. Please set VITE_VAPID_PUBLIC_KEY in your environment.');
        toast({
          title: "Configuration Error",
          description: "VAPID public key not configured. Please contact support.",
          variant: "destructive"
        });
        return;
      }

      console.log('🔑 VAPID key found, length:', publicVapidKey.length);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(publicVapidKey)
      });

      // Enhanced debug logging
      console.log('✅ Push subscription created:', {
        endpoint: subscription.endpoint,
        isApple: subscription.endpoint.includes('web.push.apple.com'),
        isFCM: subscription.endpoint.includes('fcm.googleapis.com'),
        keys: {
          p256dh: subscription.getKey('p256dh') ? 'present' : 'missing',
          auth: subscription.getKey('auth') ? 'present' : 'missing'
        }
      });

      // Store subscription in Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          user_agent: navigator.userAgent
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: "Notifications Enabled",
        description: `Push notifications enabled! ${subscription.endpoint.includes('web.push.apple.com') ? '(iOS/Safari)' : '(Chrome/FCM)'}`
      });
    } catch (error: any) {
      console.error('❌ Error subscribing to push notifications:', error);
      
      // Enhanced error messages
      let errorMessage = "Failed to enable push notifications";
      if (error.message?.includes('VAPID')) {
        errorMessage = "VAPID key configuration error";
      } else if (error.message?.includes('permission')) {
        errorMessage = "Permission denied for notifications";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Push notifications not supported on this device";
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
        
        // Remove from Supabase
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
        description: "Push notifications have been disabled"
      });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: "Unsubscribe Failed",
        description: "Failed to disable push notifications",
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
    subscribe,
    unsubscribe,
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