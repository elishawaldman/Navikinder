/**
 * ServiceWorkerLogs.tsx
 * 
 * Purpose: Display service worker logs in the UI for mobile debugging
 * Location: /src/components/ServiceWorkerLogs.tsx
 * 
 * This component shows real-time service worker activity since console logs
 * aren't accessible on mobile devices.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { swLogger } from '@/lib/serviceWorkerLogger';
import { Trash2, Eye, TestTube } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
  data?: any;
}

export const ServiceWorkerLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = swLogger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    return unsubscribe;
  }, []);

  const getLogTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const clearLogs = () => {
    swLogger.clear();
  };

  const testServiceWorkerConnection = async () => {
    try {
      // Test if service worker is registered and active
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: 'TEST_LOG',
            message: 'Testing service worker connection'
          });
          swLogger.addLog('info', '📤 Sent test message to service worker');
        } else {
          swLogger.addLog('error', '❌ No active service worker found');
        }
      } else {
        swLogger.addLog('error', '❌ Service Worker not supported');
      }
    } catch (error) {
      swLogger.addLog('error', `❌ Service Worker test failed: ${error.message}`);
    }
  };

  if (!isVisible) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Service Worker Logs
          </CardTitle>
          <CardDescription>
            View real-time service worker activity for debugging push notifications
            {logs.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {logs.length} entries
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsVisible(true)} variant="outline">
            Show Logs
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Service Worker Logs
            {logs.length > 0 && (
              <Badge variant="secondary">
                {logs.length} entries
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={testServiceWorkerConnection} variant="outline" size="sm">
              <TestTube className="h-4 w-4" />
            </Button>
            <Button onClick={clearLogs} variant="outline" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsVisible(false)} variant="outline" size="sm">
              Hide
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Real-time service worker activity (newest first)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full">
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No logs yet. Send a test notification to see activity.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border text-sm ${getLogTypeColor(log.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{log.message}</div>
                      {log.data && (
                        <div className="mt-1 text-xs opacity-75">
                          <pre className="whitespace-pre-wrap">
                            {typeof log.data === 'string' 
                              ? log.data 
                              : JSON.stringify(log.data, null, 2)
                            }
                          </pre>
                        </div>
                      )}
                    </div>
                    <div className="text-xs opacity-60 ml-2 whitespace-nowrap">
                      {log.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};