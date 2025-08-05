/**
 * Service Worker Logger
 * 
 * This module provides a way to capture and display service worker logs
 * in the main app UI, since console logs aren't accessible on mobile devices.
 */

interface LogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
  data?: any;
}

class ServiceWorkerLogger {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private maxLogs = 50;

  constructor() {
    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_LOG') {
          this.addLog(event.data.logType, event.data.message, event.data.data);
        }
      });
    }
  }

  addLog(type: LogEntry['type'], message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data
    };

    this.logs.unshift(entry); // Add to beginning
    
    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify all listeners
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  subscribe(callback: (logs: LogEntry[]) => void) {
    this.listeners.push(callback);
    // Send current logs immediately
    callback([...this.logs]);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }

  getLogs() {
    return [...this.logs];
  }
}

// Create a singleton instance
export const swLogger = new ServiceWorkerLogger();