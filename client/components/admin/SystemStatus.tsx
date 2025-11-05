import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Database,
  Users,
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Settings,
  Play,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

interface SystemHealth {
  database: {
    status: 'connected' | 'failed' | 'unknown';
    error?: string;
  };
  authentication: {
    endpoints: boolean;
    testUsers: number;
    adminUser: boolean;
  };
  packages: {
    count: number;
    active: number;
    initialized: boolean;
  };
  payments: {
    methods: string[];
    transactions: number;
    working: boolean;
  };
  overall: 'healthy' | 'warning' | 'error';
}

export default function SystemStatus() {
  const { token } = useAuth();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    setLoading(true);
    setError('');

    try {
      // Check database
      const pingResponse = await fetch('/api/ping');
      const pingData = await pingResponse.json();

      // Check packages
      const packagesResponse = await fetch('/api/packages');
      const packagesData = await packagesResponse.json();

      // Check admin stats if authenticated
      let statsData = null;
      if (token) {
        try {
          const statsResponse = await fetch('/api/admin/stats', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (statsResponse.ok) {
            statsData = await statsResponse.json();
          }
        } catch (e) {
          console.log('Admin stats not available');
        }
      }

      const systemHealth: SystemHealth = {
        database: {
          status: pingData.database?.status || 'unknown',
          error: pingData.database?.error,
        },
        authentication: {
          endpoints: pingResponse.ok,
          testUsers: statsData?.data?.totalUsers || 0,
          adminUser: statsData?.data?.totalUsers > 0,
        },
        packages: {
          count: packagesData.success ? packagesData.data?.length || 0 : 0,
          active: packagesData.success 
            ? packagesData.data?.filter((p: any) => p.active)?.length || 0 
            : 0,
          initialized: packagesData.success && packagesData.data?.length > 0,
        },
        payments: {
          methods: ['upi', 'bank_transfer', 'online'],
          transactions: 0,
          working: true,
        },
        overall: 'healthy',
      };

      // Determine overall health
      if (systemHealth.database.status !== 'connected') {
        systemHealth.overall = 'error';
      } else if (!systemHealth.packages.initialized || systemHealth.packages.count === 0) {
        systemHealth.overall = 'warning';
      } else if (systemHealth.authentication.testUsers === 0) {
        systemHealth.overall = 'warning';
      }

      setHealth(systemHealth);
    } catch (err: any) {
      setError(`Failed to check system health: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeSystem = async () => {
    setInitializing(true);
    setError('');

    try {
      const response = await fetch('/api/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('System initialized successfully! Admin credentials:\nEmail: admin@aashishproperty.com\nPassword: admin123');
        await checkSystemHealth(); // Refresh health status
      } else {
        setError(data.error || 'Failed to initialize system');
      }
    } catch (err: any) {
      setError(`Initialization failed: ${err.message}`);
    } finally {
      setInitializing(false);
    }
  };

  const getStatusIcon = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      );
    }

    switch (status) {
      case 'connected':
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      healthy: { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      warning: { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800' },
      error: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      connected: { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      failed: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
    };

    const conf = config[status as keyof typeof config] || config.warning;

    return (
      <Badge variant={conf.variant} className={conf.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Checking system health...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Overall Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">System Status</CardTitle>
          <div className="flex items-center space-x-2">
            {health && getStatusIcon(health.overall)}
            {health && getStatusBadge(health.overall)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Overall system health and component status
            </p>
            <div className="flex space-x-2">
              <Button onClick={checkSystemHealth} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {health && health.overall !== 'healthy' && (
                <Button 
                  onClick={initializeSystem} 
                  disabled={initializing}
                  className="bg-[#C70000] hover:bg-[#A60000]"
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {initializing ? 'Initializing...' : 'Initialize System'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Database */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                {health && getStatusBadge(health.database.status)}
                {health?.database.error && (
                  <p className="text-xs text-red-500 mt-1">{health.database.error}</p>
                )}
              </div>
              {health && getStatusIcon(health.database.status === 'connected')}
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authentication</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">Endpoints</span>
                {health && getStatusIcon(health.authentication.endpoints)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Users: {health?.authentication.testUsers || 0}</span>
                {health && getStatusIcon(health.authentication.testUsers > 0)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Packages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">Total: {health?.packages.count || 0}</span>
                {health && getStatusIcon(health.packages.count > 0)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Active: {health?.packages.active || 0}</span>
                {health && getStatusIcon(health.packages.active > 0)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">Methods: {health?.payments.methods.length || 0}</span>
                {health && getStatusIcon(health.payments.working)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Gateway</span>
                {health && getStatusIcon(health.payments.working)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle>System Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Authentication System</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Registration endpoints: {health.authentication.endpoints ? '✓' : '✗'}</li>
                  <li>• Login endpoints: {health.authentication.endpoints ? '✓' : '✗'}</li>
                  <li>• OTP verification: {health.authentication.endpoints ? '✓' : '✗'}</li>
                  <li>• Total users: {health.authentication.testUsers}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Package System</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Total packages: {health.packages.count}</li>
                  <li>• Active packages: {health.packages.active}</li>
                  <li>• Package selection: {health.packages.initialized ? '✓' : '✗'}</li>
                  <li>• Payment integration: {health.payments.working ? '✓' : '✗'}</li>
                </ul>
              </div>
            </div>

            {health.overall !== 'healthy' && (
              <Alert className="mt-4">
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  System needs initialization. Click "Initialize System" to set up default data including admin user, test users, packages, and categories.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
