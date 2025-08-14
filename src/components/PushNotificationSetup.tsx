import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, TestTube } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationSetup = () => {
  // Temporarily disabled - Push Notifications card not needed for the moment
  // To re-enable, uncomment the code below and remove the return null
  
  // const { isSupported, isSubscribed, isLoading, isIOS, subscribe, unsubscribe, testNotification } = usePushNotifications();

  // if (!isSupported) {
  //   return (
  //     <Card>
  //       <CardHeader>
  //         <CardTitle className="flex items-center gap-2">
  //           <BellOff className="h-5 w-5" />
  //           Push Notifications
  //         </CardTitle>
  //         <CardDescription>
  //           Push notifications are not supported in this browser. For the best experience on iOS, 
  //           add this app to your home screen first.
  //         </CardDescription>
  //       </CardHeader>
  //     </Card>
  //   );
  // }

  // return (
  //   <Card>
  //     <CardHeader>
  //       <CardTitle className="flex items-center gap-2">
  //         <Bell className="h-5 w-5" />
  //         Push Notifications
  //       </CardTitle>
  //       <CardDescription>
  //         Get instant alerts for medication reminders, even when the app isn't open.
  //       </CardDescription>
  //     </CardHeader>
  //     <CardContent className="space-y-4">
  //       <div className="flex items-center justify-between">
  //         <div className="text-sm">
  //           {isSubscribed ? (
  //             <span className="text-green-600">✓ Notifications enabled</span>
  //           ) : (
  //             <span className="text-muted-foreground">Notifications disabled</span>
  //           )}
  //           {isIOS && isSubscribed && (
  //             <div className="text-xs text-blue-600 mt-1">iOS device detected</div>
  //           )}
  //         </div>
  //         <Button
  //           onClick={isSubscribed ? unsubscribe : subscribe}
  //           disabled={isLoading}
  //           variant={isSubscribed ? "outline" : "default"}
  //         >
  //           {isLoading ? (
  //             "Loading..."
  //           ) : isSubscribed ? (
  //             "Disable"
  //           ) : (
  //             "Enable Notifications"
  //           )}
  //         </Button>
  //       </div>
  //       
  //       {/* iOS Test Button */}
  //       {isSubscribed && isIOS && (
  //         <div className="pt-2 border-t">
  //           <div className="flex items-center justify-between">
  //             <div>
  //               <div className="text-sm font-medium">Test Notifications</div>
  //               <div className="text-xs text-muted-foreground">
  //                 Send a test notification to verify iOS notifications work
  //               </div>
  //             </div>
  //             <Button
  //               onClick={testNotification}
  //               variant="outline"
  //               size="sm"
  //               className="flex items-center gap-2"
  //             >
  //               <TestTube className="h-4 w-4" />
  //               Test
  //             </Button>
  //           </div>
  //         </div>
  //       )}
  //     </CardContent>
  //   </Card>
  // );

  return null;
};