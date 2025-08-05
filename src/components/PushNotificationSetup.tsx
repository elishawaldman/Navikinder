import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationSetup = () => {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser. For the best experience on iOS, 
            add this app to your home screen first.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get instant alerts for medication reminders, even when the app isn't open.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {isSubscribed ? (
              <span className="text-green-600">✓ Notifications enabled</span>
            ) : (
              <span className="text-muted-foreground">Notifications disabled</span>
            )}
          </div>
          <Button
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={isLoading}
            variant={isSubscribed ? "outline" : "default"}
          >
            {isLoading ? (
              "Loading..."
            ) : isSubscribed ? (
              "Disable"
            ) : (
              "Enable Notifications"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};