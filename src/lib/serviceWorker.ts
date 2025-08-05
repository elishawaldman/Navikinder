// Service Worker registration and management

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker registered:', registration);

    // Listen for messages from service worker (including logs)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'MEDICATION_ACTION') {
        handleMedicationAction(event.data.action, event.data.doseInstanceId);
      }
      // Log messages are handled by serviceWorkerLogger
    });

    // Send a test message to verify communication
    if (registration.active) {
      registration.active.postMessage({
        type: 'TEST_CONNECTION',
        message: 'Main app connected to service worker'
      });
    }

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
  }
};

const handleMedicationAction = async (action: string, doseInstanceId: string) => {
  // This would integrate with your existing dose logging system
  console.log(`Medication action: ${action} for dose: ${doseInstanceId}`);
  
  // You can implement the actual dose logging here by calling your existing functions
  // from src/lib/doseInstances.ts
};