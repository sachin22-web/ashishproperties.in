import { useState } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  propertyPrice: string;
  propertyImage: string;
  sellerId: string;
  sellerName: string;
  propertyId: number;
}

export default function ChatModal({
  isOpen,
  onClose,
  propertyTitle,
  propertyPrice,
  propertyImage,
  sellerId,
  sellerName,
  propertyId,
}: ChatModalProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const quickMessages = [
    "Is this property still available?",
    "I'm interested in viewing this property",
    "What's the best price for this property?",
    "Can you share more details about this property?",
  ];

  const handleSendMessage = async (messageText: string) => {
    try {
      setSending(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      // 1) Find or create conversation for this property (new unified API)
      const convRes = await fetch("/api/conversations/find-or-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ propertyId: String(propertyId) }),
      });

      if (!convRes.ok) {
        console.error("Failed to start conversation");
        return;
      }
      const convData = await convRes.json();
      const convId =
        convData?.data?._id || convData?._id || convData?.data?.conversationId || convData?.conversationId;
      if (!convId) {
        console.error("Conversation ID not returned");
        return;
      }

      // 2) Send initial message (so seller sees it immediately)
      if (messageText && messageText.trim()) {
        await fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: messageText }),
        });
      }

      // 3) Redirect to real-time chat page
      window.location.href = `/conversation/${convId}`;
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleCustomMessage = () => {
    if (message.trim()) {
      handleSendMessage(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full md:w-96 md:rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-[#C70000] text-white">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-5 w-5" />
            <h3 className="font-semibold">Chat with {sellerName}</h3>
          </div>
          <button onClick={onClose} className="p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Property Card */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-3">
            <img
              src={propertyImage}
              alt={propertyTitle}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 text-sm">
                {propertyTitle}
              </h4>
              <p className="text-lg font-bold text-[#C70000]">
                {propertyPrice}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Messages */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Quick messages:
          </h4>
          <div className="space-y-2">
            {quickMessages.map((quickMsg, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(quickMsg)}
                disabled={sending}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 border transition-colors"
              >
                {quickMsg}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Message */}
        <div className="p-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Or write your own message:
          </h4>
          <div className="space-y-3">
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCustomMessage}
                disabled={!message.trim() || sending}
                className="flex-1 bg-[#C70000] hover:bg-[#A60000] text-white"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
