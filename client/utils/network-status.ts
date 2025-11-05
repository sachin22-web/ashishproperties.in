// Network status utility to help diagnose connectivity issues

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType?: string;
  rtt?: number;
  downlink?: number;
  serverReachable: boolean;
  lastChecked: Date;
}

class NetworkMonitor {
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private currentStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    serverReachable: false,
    lastChecked: new Date()
  };

  constructor() {
    this.initializeMonitoring();
    this.checkServerConnectivity();
  }

  private initializeMonitoring() {
    // Listen to online/offline events
    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true });
      this.checkServerConnectivity();
    });

    window.addEventListener('offline', () => {
      this.updateStatus({ isOnline: false, serverReachable: false });
    });

    // Use Network Information API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnectionInfo = () => {
        this.updateStatus({
          connectionType: connection.effectiveType || connection.type || 'unknown',
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          downlink: connection.downlink,
        });
      };

      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }

    // Periodic server connectivity check
    setInterval(() => {
      if (navigator.onLine) {
        this.checkServerConnectivity();
      }
    }, 30000); // Check every 30 seconds
  }

  private async checkServerConnectivity() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Try to reach a simple endpoint
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      
      this.updateStatus({ 
        serverReachable: response.ok,
        lastChecked: new Date()
      });

    } catch (error) {
      console.warn('Server connectivity check failed:', error);
      this.updateStatus({ 
        serverReachable: false,
        lastChecked: new Date()
      });
    }
  }

  private updateStatus(updates: Partial<NetworkStatus>) {
    this.currentStatus = {
      ...this.currentStatus,
      ...updates,
      lastChecked: new Date()
    };

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('Network status listener error:', error);
      }
    });
  }

  public getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  public addListener(callback: (status: NetworkStatus) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async testConnection(): Promise<{
    online: boolean;
    serverReachable: boolean;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      return {
        online: navigator.onLine,
        serverReachable: response.ok,
        latency,
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      
      return {
        online: navigator.onLine,
        serverReachable: false,
        latency,
        error: error.message
      };
    }
  }
}

// Global network monitor instance
const networkMonitor = new NetworkMonitor();

export default networkMonitor;

// React hook for network status
export const useNetworkStatus = () => {
  const [status, setStatus] = React.useState(networkMonitor.getStatus());

  React.useEffect(() => {
    const unsubscribe = networkMonitor.addListener(setStatus);
    return unsubscribe;
  }, []);

  return status;
};

// Helper functions
export const isConnectionSlow = (status: NetworkStatus): boolean => {
  if (status.effectiveType) {
    return ['slow-2g', '2g'].includes(status.effectiveType);
  }
  
  if (status.rtt) {
    return status.rtt > 1000; // RTT > 1 second is considered slow
  }
  
  return false;
};

export const getConnectionQuality = (status: NetworkStatus): 'excellent' | 'good' | 'fair' | 'poor' | 'offline' => {
  if (!status.isOnline) return 'offline';
  if (!status.serverReachable) return 'poor';
  
  if (status.effectiveType) {
    switch (status.effectiveType) {
      case '4g': return 'excellent';
      case '3g': return 'good';
      case '2g': return 'fair';
      case 'slow-2g': return 'poor';
      default: return 'good';
    }
  }
  
  if (status.rtt) {
    if (status.rtt < 100) return 'excellent';
    if (status.rtt < 300) return 'good';
    if (status.rtt < 1000) return 'fair';
    return 'poor';
  }
  
  return 'good';
};

// Export React import
declare const React: any;
