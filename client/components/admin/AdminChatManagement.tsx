import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  MessageSquare,
  Search,
  Filter,
  MoreHorizontal,
  Send,
  Trash2,
  Eye,
  Bot,
  User,
  Headphones,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Users,
  TrendingUp,
  Activity,
  Phone,
  Mail,
  ExternalLink,
  Download,
  Flag,
  Ban,
  UserX,
  MessageCircle,
  Zap
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface ChatConversation {
  _id: string;
  buyerName: string;
  sellerName: string;
  propertyTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  status: 'active' | 'closed' | 'bot' | 'human';
  isBot: boolean;
  handoffRequested: boolean;
  messageCount: number;
  createdAt: string;
}

interface ChatMessage {
  _id: string;
  senderId: string;
  senderType: 'user' | 'bot' | 'human';
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface ChatStats {
  totalConversations: number;
  botConversations: number;
  humanConversations: number;
  handoffRequests: number;
  activeConversations: number;
  totalMessages: number;
  recentConversations: number;
}

export default function AdminChatManagement() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<ChatStats>({
    totalConversations: 0,
    botConversations: 0,
    humanConversations: 0,
    handoffRequests: 0,
    activeConversations: 0,
    totalMessages: 0,
    recentConversations: 0,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStats();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/chat/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching chat stats:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('filter', filterType);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/admin/chat/conversations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      if (data.success) {
        setConversations(data.data.conversations);
      } else {
        setError(data.error || 'Failed to fetch conversations');
      }
    } catch (error) {
      setError('Network error while fetching conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/admin/chat/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendAdminMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const response = await fetch(`/api/admin/chat/conversations/${selectedConversation._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage }),
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages(selectedConversation._id);
        fetchConversations(); // Refresh to update last message
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (error) {
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        fetchConversations();
        if (selectedConversation?._id === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
      } else {
        setError(data.error || 'Failed to delete conversation');
      }
    } catch (error) {
      setError('Failed to delete conversation');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusBadge = (conversation: ChatConversation) => {
    if (conversation.handoffRequested) {
      return <Badge className="bg-orange-100 text-orange-800">Handoff Requested</Badge>;
    }
    if (conversation.isBot) {
      return <Badge className="bg-blue-100 text-blue-800">Bot Chat</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Human Chat</Badge>;
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'bot':
        return <Bot className="h-4 w-4 text-blue-600" />;
      case 'human':
        return <Headphones className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const safeSearchQuery = (searchQuery || '').toLowerCase();
    const matchesSearch =
      conv.buyerName?.toLowerCase().includes(safeSearchQuery) ||
      conv.sellerName?.toLowerCase().includes(safeSearchQuery) ||
      conv.propertyTitle?.toLowerCase().includes(safeSearchQuery) ||
      conv.lastMessage?.toLowerCase().includes(safeSearchQuery);

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'bot' && conv.isBot) ||
      (filterType === 'human' && !conv.isBot) ||
      (filterType === 'handoff' && conv.handoffRequested);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chat Management</h2>
          <p className="text-gray-600">Monitor and manage all chatbot and human conversations</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchConversations} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalConversations}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.recentConversations} in last 24h
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bot Conversations</CardTitle>
                <Bot className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.botConversations}</div>
                <p className="text-xs text-muted-foreground">
                  AI handled conversations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Human Handoffs</CardTitle>
                <Headphones className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.humanConversations}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.handoffRequests} pending handoffs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.totalMessages}</div>
                <p className="text-xs text-muted-foreground">
                  Across all conversations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversations.slice(0, 5).map((conversation) => (
                  <div key={conversation._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {conversation.isBot ? (
                          <Bot className="h-5 w-5 text-blue-600" />
                        ) : (
                          <User className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {conversation.buyerName} → {conversation.sellerName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {conversation.propertyTitle}
                        </div>
                        <div className="text-xs text-gray-400">
                          {(conversation.lastMessage || '').substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(conversation)}
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTime(conversation.lastMessageAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-4">
          {/* Filters */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conversations</SelectItem>
                <SelectItem value="bot">Bot Conversations</SelectItem>
                <SelectItem value="human">Human Conversations</SelectItem>
                <SelectItem value="handoff">Handoff Requested</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversations List */}
            <Card>
              <CardHeader>
                <CardTitle>Conversations ({filteredConversations.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation._id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedConversation?._id === conversation._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {conversation.buyerName} → {conversation.sellerName}
                            </span>
                            {getSenderIcon(conversation.isBot ? 'bot' : 'human')}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Property: {conversation.propertyTitle}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {(conversation.lastMessage || '').substring(0, 60)}...
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(conversation)}
                          <div className="text-xs text-gray-400 mt-1">
                            {formatTime(conversation.lastMessageAt)}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conversation._id);
                            }}
                            className="mt-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Messages View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {selectedConversation ? 
                      `${selectedConversation.buyerName} ↔ ${selectedConversation.sellerName}` : 
                      'Select a conversation'
                    }
                  </span>
                  {selectedConversation && (
                    <Button
                      size="sm"
                      onClick={() => setShowMessageDialog(true)}
                      className="bg-[#C70000] hover:bg-[#A60000]"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedConversation ? (
                  <div className="space-y-4">
                    {/* Property Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium">Property: {selectedConversation.propertyTitle}</div>
                      <div className="text-xs text-gray-500">
                        Status: {getStatusBadge(selectedConversation)}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="max-h-64 overflow-y-auto space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs p-3 rounded-lg ${
                            message.senderType === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : message.senderType === 'bot'
                              ? 'bg-gray-100 text-gray-900'
                              : 'bg-green-100 text-green-900'
                          }`}>
                            <div className="flex items-center space-x-2 mb-1">
                              {getSenderIcon(message.senderType)}
                              <span className="text-xs font-medium">
                                {message.senderType === 'user' ? 'User' : 
                                 message.senderType === 'bot' ? 'Bot' : 'Human Agent'}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a conversation to view messages
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Live Monitor Tab */}
        <TabsContent value="monitor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Chat Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Real-time chat monitoring will be displayed here</p>
                <p className="text-sm text-gray-400 mt-2">
                  This feature requires WebSocket integration for live updates
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chatbot Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-responses">Enable Auto Responses</Label>
                <Switch id="auto-responses" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="human-handoff">Allow Human Handoff</Label>
                <Switch id="human-handoff" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notification-sellers">Notify Sellers</Label>
                <Switch id="notification-sellers" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admin Reply Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Admin Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reply as Admin to: {selectedConversation?.buyerName}</Label>
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowMessageDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  sendAdminMessage();
                  setShowMessageDialog(false);
                }}
                disabled={!newMessage.trim() || sendingMessage}
                className="bg-[#C70000] hover:bg-[#A60000]"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
