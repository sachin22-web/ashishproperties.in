import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

export default function AuthDebug() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Test User',
    email: 'test@example.com',
    phone: '+91 9876543210',
    password: 'password123',
    userType: 'seller'
  });

  const testRegistration = async () => {
    setLoading(true);
    setTestResult('Testing registration...');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      setTestResult(`Registration test result:
Status: ${response.status}
Success: ${data.success}
Message: ${data.message || 'No message'}
Error: ${data.error || 'No error'}
Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setTestResult(`Registration test failed:
Error: ${error.message}
Stack: ${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setTestResult('Testing login...');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      
      setTestResult(`Login test result:
Status: ${response.status}
Success: ${data.success}
Message: ${data.message || 'No message'}
Error: ${data.error || 'No error'}
Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setTestResult(`Login test failed:
Error: ${error.message}
Stack: ${error.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    setTestResult('Testing database connection...');

    try {
      const response = await fetch('/api/ping');
      const data = await response.json();

      setTestResult(`Database connection test:
Status: ${response.status}
Database Status: ${data.database?.status}
Database Error: ${data.database?.error || 'None'}
Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setTestResult(`Database test failed:
Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeSystem = async () => {
    setLoading(true);
    setTestResult('Initializing system...');

    try {
      const response = await fetch('/api/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      setTestResult(`System initialization result:
Status: ${response.status}
Success: ${data.success}
Message: ${data.data?.message || 'No message'}
Initialized: ${JSON.stringify(data.data?.initialized, null, 2)}
Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setTestResult(`System initialization failed:
Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={testDatabaseConnection}
              disabled={loading}
              variant="outline"
            >
              Test Database
            </Button>
            <Button
              onClick={initializeSystem}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Initialize System
            </Button>
            <Button
              onClick={testRegistration}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Test Registration
            </Button>
            <Button
              onClick={testLogin}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              Test Login
            </Button>
          </div>

          {testResult && (
            <Alert>
              <AlertDescription>
                <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-60">
                  {testResult}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
