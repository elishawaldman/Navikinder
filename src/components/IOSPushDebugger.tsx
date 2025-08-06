// src/components/IOSPushDebugger.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Download, Copy } from 'lucide-react';

export const IOSPushDebugger = () => {
  const [logs, setLogs] = useState<Array<{
    time: string;
    type: string;
    message: string;
    data?: any;
  }>>([]);
  const [swStatus, setSwStatus] = useState<'checking' | 'active' | 'inactive'>('checking');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    checkStatus();
    setupMessageListener();
  }, []);

  const checkStatus = async () => {
    // Check service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      setSwStatus(registration?.active ? 'active' : 'inactive');
      
      // Check permission
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    }
  };

  const setupMessageListener = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from SW:', event.data);
        
        const newLog = {
          time: new Date().toLocaleTimeString(),
          type: event.data.type || 'unknown',
          message: event.data.message || JSON.stringify(event.data),
          data: event.data
        };
        
        setLogs(prev => [newLog, ...prev].slice(0, 20)); // Keep last 20 logs
        
        // Show notification in UI if it's a push event
        if (event.data.type === 'PUSH_RECEIVED') {
          showInAppNotification(event.data.payload);
        }
      });
    }
  };

  const showInAppNotification = (payload: any) => {
    // Create a visual notification in the app
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-top';
    notification.innerHTML = `
      <div class="font-bold">${payload?.title || 'Push Received'}</div>
      <div class="text-sm mt-1">${payload?.body || 'Push notification received'}</div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  const clearLogs = () => setLogs([]);

  const testServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ 
          type: 'TEST_CONNECTION',
          timestamp: Date.now() 
        });
        
        setLogs(prev => [{
          time: new Date().toLocaleTimeString(),
          type: 'test',
          message: 'Test message sent to service worker'
        }, ...prev]);
      }
    }
  };

  const checkPushSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const isApple = subscription.endpoint.includes('push.apple.com');
        setLogs(prev => [{
          time: new Date().toLocaleTimeString(),
          type: 'info',
          message: `Active ${isApple ? 'Apple' : 'Web'} push subscription`,
          data: {
            endpoint: subscription.endpoint.substring(0, 50) + '...',
            hasKeys: !!(subscription.getKey('p256dh') && subscription.getKey('auth'))
          }
        }, ...prev]);
      } else {
        setLogs(prev => [{
          time: new Date().toLocaleTimeString(),
          type: 'warning',
          message: 'No push subscription found'
        }, ...prev]);
      }
    } catch (error: any) {
      setLogs(prev => [{
        time: new Date().toLocaleTimeString(),
        type: 'error',
        message: `Error checking subscription: ${error.message}`
      }, ...prev]);
    }
  };

  const exportSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const subscriptionJson = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
          }
        };
        
        setSubscriptionData(subscriptionJson);
        
        // Log to console - this always works
        console.log('📋 Subscription Data for External Testing:', subscriptionJson);
        console.log('📋 Raw JSON (copy this):', JSON.stringify(subscriptionJson, null, 2));
        
        // Try clipboard - but don't fail if it doesn't work
        try {
          await navigator.clipboard.writeText(JSON.stringify(subscriptionJson, null, 2));
          setLogs(prev => [{
            time: new Date().toLocaleTimeString(),
            type: 'success',
            message: '✅ Subscription data copied to clipboard and displayed below',
            data: subscriptionJson
          }, ...prev]);
        } catch (clipboardError) {
          setLogs(prev => [{
            time: new Date().toLocaleTimeString(),
            type: 'info',
            message: '📋 Subscription data displayed below (clipboard not available in iOS PWA)',
            data: subscriptionJson
          }, ...prev]);
        }
        
      } else {
        setLogs(prev => [{
          time: new Date().toLocaleTimeString(),
          type: 'error',
          message: 'No push subscription found. Please enable notifications first.'
        }, ...prev]);
      }
    } catch (error: any) {
      setLogs(prev => [{
        time: new Date().toLocaleTimeString(),
        type: 'error',
        message: `Export failed: ${error.message}`
      }, ...prev]);
    }
  };

  const copyToClipboardFallback = (text: string) => {
    // Create a text area element for iOS
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setLogs(prev => [{
          time: new Date().toLocaleTimeString(),
          type: 'success',
          message: '✅ Copied to clipboard (fallback method)'
        }, ...prev]);
      } else {
        throw new Error('Copy failed');
      }
    } catch (err) {
      document.body.removeChild(textArea);
      setLogs(prev => [{
        time: new Date().toLocaleTimeString(),
        type: 'warning',
        message: '⚠️ Please manually copy the JSON from the display below'
      }, ...prev]);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          iOS Push Debugger
        </CardTitle>
        <CardDescription>
          Monitor push notifications and export subscription for external testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant={swStatus === 'active' ? 'default' : 'destructive'}>
            SW: {swStatus}
          </Badge>
          <Badge variant={permissionStatus === 'granted' ? 'default' : 'secondary'}>
            Permission: {permissionStatus}
          </Badge>
          <Badge variant="outline">
            Logs: {logs.length}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={exportSubscription} size="sm" variant="default" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Sub
          </Button>
          <Button onClick={testServiceWorker} size="sm" variant="outline">
            Test SW
          </Button>
          <Button onClick={checkPushSubscription} size="sm" variant="outline">
            Check Sub
          </Button>
          <Button onClick={checkStatus} size="sm" variant="outline">
            Refresh
          </Button>
          <Button onClick={clearLogs} size="sm" variant="ghost">
            Clear
          </Button>
        </div>

        {/* Subscription Data Display */}
        {subscriptionData && (
          <div className="border rounded-lg p-3 bg-muted">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">📋 Subscription Data (Send this to developer):</h4>
              <Button 
                onClick={() => copyToClipboardFallback(JSON.stringify(subscriptionData, null, 2))}
                size="sm" 
                variant="outline"
                className="flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
            <pre className="text-xs bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(subscriptionData, null, 2)}
            </pre>
          </div>
        )}

        {/* Logs */}
        <div className="border rounded-lg max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No logs yet. Test notifications to see events.
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log, index) => (
                <div key={index} className="p-2 text-xs">
                  <div className="flex items-start gap-2">
                    {log.type === 'error' ? (
                      <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                    ) : log.type === 'success' ? (
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{log.type}</span>
                        <span className="text-muted-foreground">{log.time}</span>
                      </div>
                      <div className="mt-1 break-all">{log.message}</div>
                      {log.data && (
                        <pre className="mt-1 text-[10px] bg-muted p-1 rounded overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <p className="font-semibold mb-1">🔍 Since external test app failed on your device:</p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Click "Export Sub" to get your subscription data</li>
            <li>Copy the JSON from the display above (or check browser console)</li>
            <li>Send the JSON data to the developer for external testing</li>
            <li>Check Settings &gt; Notifications &gt; Navikinder (all options ON)</li>
            <li>Try Settings &gt; Focus &gt; Do Not Disturb (turn OFF)</li>
            <li>Try Settings &gt; Screen Time &gt; Content &amp; Privacy Restrictions</li>
          </ol>
          <p className="mt-2 font-semibold">💡 Issue is likely iOS device/account settings, not your code!</p>
        </div>
      </CardContent>
    </Card>
  );
};