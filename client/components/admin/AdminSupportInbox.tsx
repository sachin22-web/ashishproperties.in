import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  User,
  Calendar,
  MapPin,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  MoreVertical,
  Reply,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { useAuth } from "../../hooks/useAuth";
import { createApiUrl } from "../../lib/api";

interface ConversationMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderType: "buyer" | "seller" | "agent" | "admin";
  message: string;
  imageUrl?: string;
  messageType: "text" | "image";
  createdAt: string;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
}

interface Conversation {
  _id: string;
  propertyId: string;
  participants: string[];
  createdAt: string;
  lastMessageAt: string;
  property: {
    _id: string;
    title: string;
    price: number;
    location: { address: string };
  };
  participantDetails: Array<{
    _id: string;
    name: string;
    userType: string;
  }>;
  lastMessage: ConversationMessage;
  messageCount: number;
  hasUnreadAdminMessages: boolean;
  status?: "open" | "closed" | "pending";
}

interface ConversationStats {
  totalConversations: number;
  conversationsToday: number;
  conversationsThisWeek: number;
  activeConversations: number;
}

export default function AdminSupportInbox() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchConversations();
    fetchStats();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }

      const response = await fetch(
        createApiUrl(`admin/conversations?${queryParams.toString()}`),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConversations(data.data.conversations);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(createApiUrl("admin/conversations/stats"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        createApiUrl(`conversations/${conversationId}/messages`),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendAdminMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const response = await fetch(
        createApiUrl(
          `admin/conversations/${selectedConversation._id}/messages`,
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newMessage }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages((prev) => [...prev, data.data]);
          setNewMessage("");
          fetchConversations(); // Refresh to update last message
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const updateConversationStatus = async (
    conversationId: string,
    status: string,
  ) => {
    try {
      const response = await fetch(
        createApiUrl(`admin/conversations/${conversationId}/status`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        fetchConversations();
        if (selectedConversation?._id === conversationId) {
          setSelectedConversation({
            ...selectedConversation,
            status: status as any,
          });
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      (conv.property?.title?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      ) ||
      (conv.participantDetails || []).some((p) =>
        (p.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
      );

    return matchesSearch;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Conversations</p>
                  <p className="text-2xl font-bold">
                    {stats.totalConversations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Today</p>
                  <p className="text-2xl font-bold">
                    {stats.conversationsToday}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold">
                    {stats.conversationsThisWeek}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Active (24h)</p>
                  <p className="text-2xl font-bold">
                    {stats.activeConversations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Support Inbox</span>
              <Badge variant="secondary">{filteredConversations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Search and Filter */}
            <div className="p-4 border-b space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Conversations</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Conversations */}
            <div className="max-h-[600px] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No conversations found</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv._id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?._id === conv._id
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm truncate">
                          {conv.property?.title || "Property Chat"}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {conv.participantDetails
                            .filter((p) => p.userType !== "admin")
                            .map((p) => p.name)
                            .join(", ")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className="text-xs text-gray-400">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                        {conv.hasUnreadAdminMessages && (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600 truncate flex-1">
                        {conv.lastMessage?.message || "No messages yet"}
                      </p>
                      <Badge
                        className={`ml-2 text-xs ${getStatusColor(conv.status)}`}
                      >
                        {conv.status || "open"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedConversation.property?.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      with{" "}
                      {selectedConversation.participantDetails
                        .filter((p) => p.userType !== "admin")
                        .map((p) => p.name)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={getStatusColor(selectedConversation.status)}
                    >
                      {selectedConversation.status || "open"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateConversationStatus(
                          selectedConversation._id,
                          selectedConversation.status === "closed"
                            ? "open"
                            : "closed",
                        )
                      }
                    >
                      {selectedConversation.status === "closed"
                        ? "Reopen"
                        : "Close"}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${
                        message.senderType === "admin"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderType === "admin"
                            ? "bg-[#C70000] text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">
                            {message.senderName}
                          </span>
                          <span className="text-xs opacity-75">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        {message.imageUrl ? (
                          <img
                            src={message.imageUrl}
                            alt="Sent image"
                            className="max-w-full h-auto rounded"
                          />
                        ) : (
                          <p className="text-sm">{message.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your reply..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 resize-none"
                      rows={2}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendAdminMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={sendAdminMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-[#C70000] hover:bg-[#A60000]"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Select a conversation to start chatting
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
