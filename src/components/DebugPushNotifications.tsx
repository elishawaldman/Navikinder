// src/components/DebugPushNotifications.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bug, Send, Bell } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const DebugPushNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Direct browser notification test (no server involved)
  const testLocalNotification = async () => {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }

      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Permission denied');
        }
      }

      // Try to show notification directly from service worker
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('🧪 Direct Test', {
        body: 'This is a direct notification test from the browser',
        icon: '/navikinder-logo-256.png',
        badge: '/navikinder-logo-256.png',
        tag: 'direct-test-' + Date.now(),
        requireInteraction: false,
        renotify: true,
        vibrate: [200, 100, 200]
      });

      toast({
        title: "Direct Test Sent",
        description: "Check if notification appears"
      });
    } catch (error: any) {
      console.error('Direct test error:', error);
      toast({
        title: "Direct Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Test via service worker message
  const testViaServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ 
          type: 'TEST_NOTIFICATION',
          timestamp: Date.now()
        });
        
        toast({
          title: "SW Test Sent",
          description: "Service worker should show notification"
        });
      } else {
        throw new Error('Service worker not active');
      }
    } catch (error: any) {
      console.error('SW test error:', error);
      toast({
        title: "SW Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Simulate push event locally
  const simulatePushEvent = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Create a synthetic push event data
      const testData = {
        title: '💊 Simulated Push',
        body: 'Time for medication (simulated push event)',
        data: {
          doseInstanceId: 'sim-' + Date.now(),
          medicationName: 'Test Med',
          childName: 'Test Child'
        }
      };

      // Send to service worker to simulate push
      if (registration.active) {
        registration.active.postMessage({
          type: 'SIMULATE_PUSH',
          pushData: testData
        });
      }

      // Also try to show directly
      await registration.showNotification(testData.title, {
        body: testData.body,
        icon: '/navikinder-logo-256.png',
        badge: '/navikinder-logo-256.png',
        data: testData.data,
        tag: 'sim-push-' + Date.now(),
        renotify: true
      });

      toast({
        title: "Push Simulated",
        description: "Check for notification"
      });
    } catch (error: any) {
      console.error('Simulate push error:', error);
      toast({
        title: "Simulation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check current state
  const checkNotificationState = async () => {
    try {
      const permission = Notification.permission;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      const state = {
        permission,
        hasServiceWorker: !!registration,
        hasSubscription: !!subscription,
        endpoint: subscription?.endpoint ? subscription.endpoint.substring(0, 50) + '...' : 'none',
        isApple: subscription?.endpoint.includes('push.apple.com') || false
      };

      console.log('📊 Notification State:', state);
      
      toast({
        title: "State Checked",
        description: `Permission: ${permission}, Subscription: ${state.hasSubscription ? 'Yes' : 'No'}`,
      });

      // Log to console for debugging
      console.table(state);
    } catch (error: any) {
      console.error('State check error:', error);
      toast({
        title: "Check Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug Push Notifications
        </CardTitle>
        <CardDescription>
          Test different notification methods to diagnose iOS issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={testLocalNotification}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Direct Test
          </Button>
          
          <Button
            onClick={testViaServiceWorker}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Via SW
          </Button>
          
          <Button
            onClick={simulatePushEvent}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Simulate Push
          </Button>
          
          <Button
            onClick={checkNotificationState}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            Check State
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground border-t pt-3">
          <p>• Direct Test: Shows notification without server</p>
          <p>• Via SW: Sends message to service worker</p>
          <p>• Simulate Push: Mimics a push event locally</p>
          <p>• Check State: Logs current notification setup</p>
        </div>
      </CardContent>
    </Card>
  );
};