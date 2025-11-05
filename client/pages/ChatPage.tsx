import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Search,
  User,
  MapPin,
  Image as ImageIcon,
  Upload,
  X,
  Paperclip,
} from "lucide-react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { toast } from "../components/ui/use-toast";
import { useAuth } from "../hooks/useAuth";

interface ConversationMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderType: "buyer" | "seller" | "agent" | "admin";
  message: string;
  imageUrl?: string;
  messageType: "text" | "image";
  createdAt: string;
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
    images: string[];
  };
  participantDetails: Array<{
    _id: string;
    name: string;
    userType: string;
  }>;
  lastMessage: ConversationMessage;
  unreadCount: number;
}

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c._id === conversationId);
      if (conv) {
        setSelectedConversation(conv);
      } else {
        // If conversation not found in list, try to fetch it directly
        fetchSingleConversation(conversationId);
      }
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
      // Start polling for new messages every 5 seconds
      const interval = setInterval(
        () => fetchMessages(selectedConversation._id),
        5000,
      );
      setPollInterval(interval);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await (window as any).api("/conversations/my");

      if (response.success) {
        setConversations(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load conversations",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleConversation = async (convId: string) => {
    try {
      const response = await (window as any).api(
        `/conversations/${convId}/messages`,
      );
      if (response.success) {
        // This will return messages, but we need conversation details
        // Let's refresh the full conversations list
        fetchConversations();
      }
    } catch (error) {
      console.error("Error fetching single conversation:", error);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const response = await (window as any).api(
        `/conversations/${convId}/messages`,
      );

      if (response.success) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (messageText?: string, imageUrl?: string) => {
    const textToSend = messageText || newMessage;
    if ((!textToSend.trim() && !imageUrl) || !selectedConversation || sending)
      return;

    try {
      setSending(true);

      // Optimistic UI - add temporary message
      const tempMessage: ConversationMessage = {
        _id: `temp-${Date.now()}`,
        senderId: user!.id,
        senderName: user!.name,
        senderType: "buyer",
        message: textToSend,
        imageUrl,
        messageType: imageUrl ? "image" : "text",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");

      const response = await (window as any).api(
        `/conversations/${selectedConversation._id}/messages`,
        {
          method: "POST",
          body: { text: textToSend, imageUrl },
        },
      );

      if (response.success) {
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempMessage._id ? response.data : msg,
          ),
        );
        // Refresh conversations to update last message
        fetchConversations();
      } else {
        // Remove temp message and show error
        setMessages((prev) =>
          prev.filter((msg) => msg._id !== tempMessage._id),
        );
        toast({
          title: "Error",
          description: response.error || "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Remove temp message and show error
      setMessages((prev) => prev.filter((msg) => msg._id.startsWith("temp-")));
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);

      // Upload image
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const uploadData = await uploadResponse.json();
      if (uploadData.success) {
        // Send message with image
        await sendMessage("", uploadData.url);
      } else {
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    navigate(`/chat/${conversation._id}`);
  };

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

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredConversations = conversations.filter((conversation) => {
    const property = conversation.property;
    const otherParticipants = conversation.participantDetails.filter(
      (p) => p._id !== user?.id,
    );

    return (
      property?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherParticipants.some((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    );
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Please login to access chat</p>
            <Button
              onClick={() => navigate("/login")}
              className="bg-[#C70000] hover:bg-[#A60000]"
            >
              Login
            </Button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex-1 flex">
        {/* Left Panel - Conversation List */}
        <div className="w-full lg:w-1/3 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-2 border-[#C70000] border-t-transparent rounded-full"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No conversations yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start chatting with property owners by visiting property
                  listings.
                </p>
                <Button
                  onClick={() => navigate("/")}
                  className="bg-[#C70000] hover:bg-[#A60000]"
                >
                  Browse Properties
                </Button>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const otherParticipants =
                  conversation.participantDetails.filter(
                    (p) => p._id !== user?.id,
                  );
                const property = conversation.property;
                const isSelected =
                  selectedConversation?._id === conversation._id;

                return (
                  <div
                    key={conversation._id}
                    onClick={() => handleConversationSelect(conversation)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      isSelected ? "bg-blue-50 border-blue-200" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        {property?.images?.[0] ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-12 h-12 object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#C70000] rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {conversation.unreadCount > 9
                                ? "9+"
                                : conversation.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">
                            {property?.title || "Property Chat"}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {otherParticipants.map((p) => p.name).join(", ")}
                        </p>
                        <p
                          className={`text-sm truncate ${
                            conversation.unreadCount > 0
                              ? "text-gray-900 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          {conversation.lastMessage?.message ||
                            "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Message Thread */}
        <div className="hidden lg:flex lg:w-2/3 flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center space-x-3">
                  {selectedConversation.property?.images?.[0] && (
                    <img
                      src={selectedConversation.property.images[0]}
                      alt={selectedConversation.property.title}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedConversation.property?.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      with{" "}
                      {selectedConversation.participantDetails
                        .filter((p) => p._id !== user?.id)
                        .map((p) => p.name)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderId === user?.id;
                    const isOwner =
                      selectedConversation.participantDetails.find(
                        (p) => p._id === message.senderId,
                      )?.userType === "seller";

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwn
                              ? "bg-[#C70000] text-white"
                              : message.senderType === "admin"
                                ? "bg-blue-100 text-blue-900"
                                : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {!isOwn && (
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">
                                {message.senderName}
                              </span>
                              {isOwner && (
                                <Badge variant="secondary" className="text-xs">
                                  Owner
                                </Badge>
                              )}
                              {message.senderType === "admin" && (
                                <Badge variant="secondary" className="text-xs">
                                  Support
                                </Badge>
                              )}
                            </div>
                          )}
                          {isOwn && (
                            <div className="flex items-center justify-between mb-1">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-white/20 text-white"
                              >
                                You
                              </Badge>
                            </div>
                          )}
                          {message.imageUrl ? (
                            <img
                              src={message.imageUrl}
                              alt="Sent image"
                              className="max-w-full h-auto rounded"
                            />
                          ) : (
                            <p className="text-sm">{message.message}</p>
                          )}
                          <p className="text-xs opacity-75 mt-1">
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="p-4 border-t">
                <div className="flex space-x-2 items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="p-2"
                  >
                    {uploadingImage ? (
                      <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 resize-none"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!newMessage.trim() || sending}
                    className="bg-[#C70000] hover:bg-[#A60000] px-4"
                  >
                    {sending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                    e.target.value = "";
                  }
                }}
                className="hidden"
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
