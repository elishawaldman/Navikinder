import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function ServiceWorkerDebug() {
  const [swVersion, setSwVersion] = useState<string>('Unknown');
  const [swStatus, setSwStatus] = useState<string>('Checking...');
  
  useEffect(() => {
    checkServiceWorker();
  }, []);
  
  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.active) {
          setSwStatus('Active');
          
          // Send a message to get version
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.version) {
              setSwVersion(event.data.version);
            }
          };
          
          registration.active.postMessage(
            { type: 'GET_VERSION' },
            [messageChannel.port2]
          );
        } else {
          setSwStatus('Not Active');
        }
      } catch (error: any) {
        setSwStatus('Error: ' + error.message);
      }
    } else {
      setSwStatus('Not Supported');
    }
  };
  
  const sendTestPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ type: 'TEST_NOTIFICATION' });
        alert('Test notification sent to service worker');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };
  
  const forceUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      window.location.reload();
    }
  };
  
  return (
    <div className="p-4 border rounded-lg space-y-2 bg-gray-50">
      <h3 className="font-bold">Service Worker Debug</h3>
      <p>Status: {swStatus}</p>
      <p>Version: {swVersion}</p>
      <p>Expected: v8 (with debug logging)</p>
      
      <div className="space-x-2">
        <Button onClick={sendTestPush} size="sm">
          Test Local Notification
        </Button>
        <Button onClick={forceUpdate} size="sm" variant="destructive">
          Force Update SW
        </Button>
      </div>
    </div>
  );
}