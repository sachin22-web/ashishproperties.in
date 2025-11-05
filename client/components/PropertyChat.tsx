import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  User,
  Phone,
  ArrowLeft,
  Image as ImageIcon,
  Paperclip,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { useAuth } from "../hooks/useAuth";
import { createApiUrl } from "../lib/api";

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

interface Property {
  _id: string;
  title: string;
  price: number;
  location: { address: string };
  images?: string[];
  contactInfo?: {
    name: string;
    phone: string;
  };
}

interface PropertyChatProps {
  propertyId: string;
  property?: Property;
  sellerId?: string;
  onClose?: () => void;
  minimized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export default function PropertyChat({
  propertyId,
  property,
  sellerId,
  onClose,
  minimized = false,
  onMinimize,
  onMaximize,
}: PropertyChatProps) {
  const { user, token, isAuthenticated } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated && propertyId) {
      startConversation();
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isAuthenticated, propertyId]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      // Start polling for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      setPollInterval(interval);
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startConversation = async () => {
    if (!token || !propertyId) return;

    try {
      setLoading(true);
      setError("");

      // Determine participants
      const participants = sellerId ? [sellerId] : [];

      const response = await fetch(createApiUrl("conversations"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId,
          participants,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConversationId(data.data._id);
        } else {
          setError(data.error || "Failed to start conversation");
        }
      } else {
        setError("Failed to start conversation");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      setError("Failed to start conversation");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!token || !conversationId) return;

    try {
      const response = await fetch(
        createApiUrl(`conversations/${conversationId}/messages`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || sending) return;

    try {
      setSending(true);
      const response = await fetch(
        createApiUrl(`conversations/${conversationId}/messages`),
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
        } else {
          setError(data.error || "Failed to send message");
        }
      } else {
        setError("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-96 max-w-full">
        <CardContent className="p-6 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Please login to start chatting</p>
          <Button
            onClick={() => (window.location.href = "/login")}
            className="bg-[#C70000] hover:bg-[#A60000]"
          >
            Login to Chat
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onMaximize}
          className="bg-[#C70000] hover:bg-[#A60000] rounded-full w-12 h-12 p-0 shadow-lg"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] h-[500px] z-50 shadow-xl">
      <CardHeader className="p-4 bg-[#C70000] text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <div>
              <CardTitle className="text-sm">
                {property?.title
                  ? `Chat about ${property.title.substring(0, 30)}${property.title.length > 30 ? "..." : ""}`
                  : "Property Chat"}
              </CardTitle>
              {property?.contactInfo?.name && (
                <p className="text-xs opacity-90">
                  with {property.contactInfo.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {onMinimize && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onMinimize}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[calc(500px-80px)]">
        {/* Property Info */}
        {property && (
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-start space-x-3">
              {property.images?.[0] && (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">
                  {property.title}
                </h4>
                <p className="text-xs text-gray-600">
                  ₹{property.price?.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {property.location?.address}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-6 h-6 border-2 border-[#C70000] border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 text-sm">{error}</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm">
              <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p>Start the conversation!</p>
              <p className="text-xs mt-1">Say hello to the property owner</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${
                  message.senderId === user?.id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId === user?.id
                      ? "bg-[#C70000] text-white"
                      : message.senderType === "admin"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.senderId !== user?.id && (
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-xs font-medium">
                        {message.senderName}
                      </span>
                      {message.senderType === "admin" && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-1 py-0"
                        >
                          Support
                        </Badge>
                      )}
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
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-3 border-t">
          <div className="flex space-x-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 resize-none text-sm"
              rows={2}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="bg-[#C70000] hover:bg-[#A60000] px-3"
            >
              {sending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
