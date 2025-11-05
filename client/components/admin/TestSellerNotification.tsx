import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Send,
  TestTube,
  Users,
  CheckCircle,
  AlertCircle,
  Loader,
  Crown,
  MessageSquare,
  Bell,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface User {
  _id: string;
  name: string;
  email: string;
  userType: string;
}

export default function TestSellerNotification() {
  const { token } = useAuth();
  const [sellers, setSellers] = useState<User[]>([]);
  const [selectedSeller, setSelectedSeller] = useState("");
  const [notificationType, setNotificationType] = useState("general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSellers();
  }, [token]);

  const fetchSellers = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        "/api/admin/notifications/users?userType=seller",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setSellers(data.data.users || []);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const sendTestNotification = async () => {
    if (!selectedSeller || !title.trim() || !message.trim()) {
      setError("Please fill in all fields and select a seller");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          message,
          type: "both", // Send both email and push
          audience: "specific",
          specificUsers: [selectedSeller],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          `Test notification sent successfully to ${sellers.find((s) => s._id === selectedSeller)?.name}!`,
        );
        // Clear form
        setTitle("");
        setMessage("");
        setSelectedSeller("");

        // Trigger notification update event
        window.dispatchEvent(new CustomEvent("notificationUpdate"));
      } else {
        setError(data.error || "Failed to send notification");
      }
    } catch (error: any) {
      setError("Network error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickMessage = (type: string) => {
    switch (type) {
      case "welcome":
        setTitle("Welcome to Aashish Property!");
        setMessage(
          "Welcome to our platform! Your seller account is now active. Start posting properties and reach thousands of potential buyers.",
        );
        break;
      case "premium":
        setTitle("Upgrade to Premium Plan");
        setMessage(
          "Get 3x more visibility for your properties with our Premium Plan! Your listings will be featured at the top and reach more buyers. Upgrade now for just ₹999/month.",
        );
        break;
      case "property_approved":
        setTitle("Property Approved!");
        setMessage(
          "Great news! Your property listing has been approved and is now live on our platform. Buyers can now view and contact you about this property.",
        );
        break;
      case "tips":
        setTitle("Property Listing Tips");
        setMessage(
          "💡 Tip: Add high-quality photos and detailed descriptions to get 5x more inquiries! Properties with 5+ photos get contacted 3x more often.",
        );
        break;
      default:
        setTitle("");
        setMessage("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TestTube className="h-5 w-5 mr-2" />
          Test Seller Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Quick message templates */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Quick Templates:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => fillQuickMessage("welcome")}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Bell className="h-3 w-3 mr-1" />
              Welcome
            </Button>
            <Button
              onClick={() => fillQuickMessage("premium")}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Crown className="h-3 w-3 mr-1" />
              Premium Offer
            </Button>
            <Button
              onClick={() => fillQuickMessage("property_approved")}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Button>
            <Button
              onClick={() => fillQuickMessage("tips")}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Tips
            </Button>
          </div>
        </div>

        {/* Seller selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Send to Seller:
          </label>
          <Select value={selectedSeller} onValueChange={setSelectedSeller}>
            <SelectTrigger>
              <SelectValue placeholder="Select a seller to test..." />
            </SelectTrigger>
            <SelectContent>
              {sellers.map((seller) => (
                <SelectItem key={seller._id} value={seller._id}>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {seller.name} ({seller.email})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notification title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title:</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title..."
            maxLength={100}
          />
        </div>

        {/* Notification message */}
        <div>
          <label className="block text-sm font-medium mb-2">Message:</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message..."
            rows={4}
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">
            {message.length}/500 characters
          </div>
        </div>

        {/* Send button */}
        <Button
          onClick={sendTestNotification}
          disabled={
            loading || !selectedSeller || !title.trim() || !message.trim()
          }
          className="w-full bg-[#C70000] hover:bg-[#A60000]"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Sending Test Notification...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Test Notification
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 mt-2">
          ℹ️ This will send a real notification to the selected seller. They
          will see it in their dashboard immediately.
        </div>
      </CardContent>
    </Card>
  );
}
