import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface Message {
  _id: string;
  message: string;
  senderType: "user" | "admin";
  senderName: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  status: "open" | "closed" | "pending";
  priority: "low" | "medium" | "high";
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function Support() {
  const { ticketId, action } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // New ticket form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const isNewTicket = action === "new";

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!isNewTicket && ticketId) {
      fetchTicketMessages();
    } else {
      setLoading(false);
    }
  }, [user, ticketId, isNewTicket, navigate]);

  const fetchTicketMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setTicket(data.data.ticket);
        setMessages(data.data.messages);
      } else {
        navigate("/user");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      navigate("/user");
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!subject.trim() || !description.trim()) return;

    try {
      setCreating(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: subject.trim(),
          message: description.trim(),
          category,
          priority,
        }),
      });

      const data = await response.json();

      if (data.success) {
        navigate(`/support/ticket/${data.data._id}`);
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setCreating(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !ticketId) return;

    try {
      setSending(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: newMessage.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages([
          ...messages,
          {
            _id: data.data._id,
            message: data.data.message,
            senderType: data.data.senderType,
            senderName: user?.name || "You",
            createdAt: data.data.createdAt,
          },
        ]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // New Ticket Form
  if (isNewTicket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />

        <main className="pb-16">
          <div className="px-4 py-6">
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate("/user")}
                className="mr-4 p-2"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">
                Create Support Ticket
              </h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-[#C70000]" />
                  New Support Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subject *
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    maxLength={100}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="general">General</option>
                      <option value="property">Property Issues</option>
                      <option value="payment">Payment</option>
                      <option value="technical">Technical</option>
                      <option value="account">Account</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description *
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please describe your issue in detail..."
                    rows={6}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/1000 characters
                  </p>
                </div>

                <Button
                  onClick={createTicket}
                  disabled={!subject.trim() || !description.trim() || creating}
                  className="w-full bg-[#C70000] hover:bg-[#A60000]"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Create Ticket
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <BottomNavigation />
      </div>
    );
  }

  // Ticket Chat View
  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />

      <main className="pb-16">
        <div className="px-4 py-6">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/user")}
              className="mr-4 p-2"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {ticket?.subject}
              </h1>
              <p className="text-sm text-gray-600">#{ticket?.ticketNumber}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(ticket?.status || "")}>
                {ticket?.status}
              </Badge>
              <Badge className={getPriorityColor(ticket?.priority || "")}>
                {ticket?.priority}
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4 mb-6">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.senderType === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.senderType === "user"
                      ? "bg-[#C70000] text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">
                      {message.senderName}
                    </span>
                    <span
                      className={`text-xs ${message.senderType === "user" ? "text-red-100" : "text-gray-500"}`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Box */}
          {ticket?.status !== "closed" && (
            <Card>
              <CardContent className="p-4">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) =>
                      e.key === "Enter" && !e.shiftKey && sendMessage()
                    }
                    disabled={sending}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-[#C70000] hover:bg-[#A60000]"
                  >
                    {sending ? (
                      <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {ticket?.status === "closed" && (
            <Card>
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">This ticket has been closed</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
