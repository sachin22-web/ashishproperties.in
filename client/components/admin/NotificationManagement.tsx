import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Send,
  Bell,
  Users,
  Mail,
  MessageSquare,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Search,
  X,
  UserPlus,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'email' | 'push' | 'both';
  audience: 'all' | 'buyers' | 'sellers' | 'agents' | 'specific';
  sentAt: string;
  recipientCount: number;
  deliveredCount: number;
  status: 'sent' | 'failed' | 'pending';
}

interface User {
  _id: string;
  name: string;
  email: string;
  userType: 'buyer' | 'seller' | 'agent';
  createdAt: string;
}

export default function NotificationManagement() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'email' | 'push' | 'both'>('both');
  const [audience, setAudience] = useState<'all' | 'buyers' | 'sellers' | 'agents' | 'specific'>('all');
  const [scheduleNotification, setScheduleNotification] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  // User selection state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userType, setUserType] = useState<'all' | 'buyer' | 'seller' | 'agent'>('all');
  const [showUserSelector, setShowUserSelector] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (audience === 'specific') {
      fetchUsers();
    }
  }, [audience, userType, userSearch]);

  const fetchNotifications = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data?.notifications || []);
        } else {
          setError(data.error || 'Failed to fetch notifications');
        }
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (err) {
      setError('Network error while fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (userType !== 'all') params.append('userType', userType);
      if (userSearch) params.append('search', userSearch);

      const response = await fetch(`/api/admin/notifications/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const sendNotification = async () => {
    if (!token || !title.trim() || !message.trim()) {
      setError('Title and message are required');
      return;
    }

    if (audience === 'specific' && selectedUsers.length === 0) {
      setError('Please select at least one user for specific targeting');
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccess('');

      const payload = {
        title: title.trim(),
        message: message.trim(),
        type,
        audience,
        specificUsers: audience === 'specific' ? selectedUsers.map(u => u._id) : undefined,
        scheduledTime: scheduleNotification ? scheduledTime : undefined,
      };

      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess(
            scheduleNotification 
              ? 'Notification scheduled successfully!' 
              : 'Notification sent successfully!'
          );
          // Reset form
          setTitle('');
          setMessage('');
          setType('both');
          setAudience('all');
          setScheduleNotification(false);
          setScheduledTime('');
          setSelectedUsers([]);
          // Refresh notifications list
          fetchNotifications();
        } else {
          setError(data.error || 'Failed to send notification');
        }
      } else {
        setError('Failed to send notification');
      }
    } catch (err) {
      setError('Network error while sending notification');
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'push':
        return <Bell className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      pending: { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800' },
      failed: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant} className={config.className}>
        {(status || 'pending').charAt(0).toUpperCase() + (status || 'pending').slice(1)}
      </Badge>
    );
  };

  const getAudienceIcon = (audience: string) => {
    return <Users className="h-4 w-4" />;
  };

  const addUserToSelection = (user: User) => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const removeUserFromSelection = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const clearAllSelectedUsers = () => {
    setSelectedUsers([]);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Management</h2>
          <p className="text-gray-600">Send notifications to users and manage communication</p>
        </div>
        <Button onClick={fetchNotifications} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">Send Notification</TabsTrigger>
          <TabsTrigger value="history">Notification History</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Create New Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Notification Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Notification Type</Label>
                  <Select value={type} onValueChange={(value: any) => setType(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="push">Push Notification Only</SelectItem>
                      <SelectItem value="both">Email + Push</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your notification message..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select value={audience} onValueChange={(value: any) => setAudience(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="buyers">Buyers Only</SelectItem>
                      <SelectItem value="sellers">Sellers Only</SelectItem>
                      <SelectItem value="agents">Agents Only</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="schedule">Schedule Options</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Switch
                      id="schedule"
                      checked={scheduleNotification}
                      onCheckedChange={setScheduleNotification}
                    />
                    <Label htmlFor="schedule" className="text-sm">
                      Schedule for later
                    </Label>
                  </div>
                </div>
              </div>

              {/* Specific User Selection */}
              {audience === 'specific' && (
                <div className="space-y-4">
                  <Label>Select Specific Users</Label>

                  {/* Selected Users Display */}
                  {selectedUsers.length > 0 && (
                    <div className="border rounded-lg p-3 bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">
                          Selected Users ({selectedUsers.length})
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAllSelectedUsers}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            <span>{user.name}</span>
                            <button
                              type="button"
                              onClick={() => removeUserFromSelection(user._id)}
                              className="hover:bg-blue-200 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* User Search and Filter */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Input
                        placeholder="Search users by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Select value={userType} onValueChange={(value: any) => setUserType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All User Types</SelectItem>
                          <SelectItem value="buyer">Buyers</SelectItem>
                          <SelectItem value="seller">Sellers</SelectItem>
                          <SelectItem value="agent">Agents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* User List */}
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    <div className="space-y-1 p-2">
                      {users.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => addUserToSelection(user)}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {user.userType}
                            </Badge>
                            {selectedUsers.find(u => u._id === user._id) ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <UserPlus className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                      {users.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                          No users found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {scheduleNotification && (
                <div>
                  <Label htmlFor="scheduledTime">Scheduled Time</Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    setTitle('');
                    setMessage('');
                    setType('both');
                    setAudience('all');
                    setScheduleNotification(false);
                    setScheduledTime('');
                    setSelectedUsers([]);
                    setUserSearch('');
                    setUserType('all');
                  }}
                  variant="outline"
                >
                  Reset
                </Button>
                <Button
                  onClick={sendNotification}
                  disabled={sending || !title.trim() || !message.trim() || (audience === 'specific' && selectedUsers.length === 0)}
                  className="bg-[#C70000] hover:bg-[#A60000]"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : (
                    scheduleNotification ? 'Schedule' : `Send Now${audience === 'specific' ? ` (${selectedUsers.length})` : ''}`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Notification History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading notifications...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <TableRow key={notification._id}>
                          <TableCell className="font-medium">
                            {notification.title}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(notification.type)}
                              <span className="capitalize">{notification.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getAudienceIcon(notification.audience)}
                              <span className="capitalize">{notification.audience}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{notification.recipientCount} total</div>
                              <div className="text-gray-500">
                                {notification.deliveredCount} delivered
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(notification.status)}</TableCell>
                          <TableCell>
                            {new Date(notification.sentAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          No notifications sent yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
