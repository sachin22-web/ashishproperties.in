import React, { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

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
  lastMessage: {
    _id: string;
    senderId: string;
    senderName: string;
    message: string;
    createdAt: string;
  };
  messageCount: number;
  hasUnreadAdminMessages: boolean;
  status?: "open" | "closed" | "pending";
}

export default function SupportInbox() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching conversations...");

      // Use the global api helper
      const result = await (window as any).api("/admin/conversations?limit=20");

      console.log("API result:", result);

      if (result.ok) {
        const data = result.json;
        console.log("Response data:", data);

        if (data && data.success) {
          setConversations(data.data.conversations || []);
        } else if (data && data.error) {
          setError(data.error);
        } else {
          setError("Invalid response format");
        }
      } else {
        // Handle different error status codes
        const errorData = result.json;
        if (result.status === 401) {
          setError("Authentication required. Please login as admin.");
        } else if (result.status === 403) {
          setError("Access denied. Admin permissions required.");
        } else if (result.status === 404) {
          setError("API endpoint not found.");
        } else {
          setError(errorData?.error || `Server error: ${result.status}`);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setError(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px]"
        data-testid="support-inbox"
      >
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="support-inbox">
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="h-6 w-6 text-[#C70000]" />
          <h1 className="text-2xl font-bold text-gray-900">Support Inbox</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No tickets
            </h3>
            <p className="text-gray-500">No support conversations found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {conversation.property?.title || "Property Chat"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Participants:{" "}
                        {(conversation.participantDetails ?? [])
                          .filter((p) => p && p.userType !== "admin")
                          .map((p) => p.name)
                          .join(", ") || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Last message:{" "}
                        {conversation.lastMessage?.message || "No messages yet"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">
                        {formatTime(
                          conversation.lastMessageAt || conversation.createdAt,
                        )}
                      </span>
                      {conversation.hasUnreadAdminMessages && (
                        <div className="w-2 h-2 bg-red-500 rounded-full ml-auto mt-1"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
