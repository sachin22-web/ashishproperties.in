import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  UserPlus,
  UserCheck,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface UserAnalyticsData {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  usersByType: {
    _id: string;
    count: number;
  }[];
  userGrowth: {
    date: string;
    count: number;
  }[];
  userActivity: {
    date: string;
    active: number;
    new: number;
  }[];
}

export default function UserAnalytics() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalyticsData>({
    totalUsers: 0,
    newUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    usersByType: [],
    userGrowth: [],
    userActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('7');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/admin/user-analytics?days=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
        } else {
          setError(data.error || 'Failed to fetch analytics');
        }
      } else {
        setError('Failed to fetch user analytics');
      }
    } catch (err) {
      setError('Network error while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      buyer: 'bg-blue-100 text-blue-800',
      seller: 'bg-green-100 text-green-800',
      agent: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Analytics</h2>
          <p className="text-gray-600">Track user engagement and growth metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.newUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {calculatePercentage(analytics.activeUsers, analytics.totalUsers)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.verifiedUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {calculatePercentage(analytics.verifiedUsers, analytics.totalUsers)}% verified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Types Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              User Types Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.usersByType.map((userType) => (
                <div key={userType._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className={getUserTypeColor(userType._id)}>
                      {userType._id?.charAt(0).toUpperCase() + userType._id?.slice(1) || 'Unknown'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {userType.count.toLocaleString()} users
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#C70000] h-2 rounded-full"
                        style={{
                          width: `${calculatePercentage(userType.count, analytics.totalUsers)}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {calculatePercentage(userType.count, analytics.totalUsers)}%
                    </span>
                  </div>
                </div>
              ))}
              {analytics.usersByType.length === 0 && (
                <p className="text-gray-500 text-center py-4">No user type data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              User Activity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.userActivity.reduce((sum, day) => sum + day.active, 0)}
                  </div>
                  <p className="text-xs text-blue-600">Total Active Sessions</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.userActivity.reduce((sum, day) => sum + day.new, 0)}
                  </div>
                  <p className="text-xs text-green-600">New Registrations</p>
                </div>
              </div>

              {analytics.userActivity.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium">Recent Activity</h4>
                  {analytics.userActivity.slice(-5).map((day, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {new Date(day.date).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-4">
                        <span className="text-blue-600">{day.active} active</span>
                        <span className="text-green-600">{day.new} new</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No activity data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            User Growth Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{timeRange}</div>
              <p className="text-sm text-blue-700">Days Period</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <UserPlus className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">
                {(analytics.newUsers / parseInt(timeRange)).toFixed(1)}
              </div>
              <p className="text-sm text-green-700">Avg. Daily Signups</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">
                {calculatePercentage(analytics.activeUsers, analytics.totalUsers)}%
              </div>
              <p className="text-sm text-purple-700">Activity Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
