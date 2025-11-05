import React, { useState, useEffect } from "react";
import { Check, RefreshCw, AlertCircle, X } from "lucide-react";

interface FooterUpdateNotificationProps {
  className?: string;
}

export default function FooterUpdateNotification({
  className = "",
}: FooterUpdateNotificationProps) {
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "info" | "warning";
      message: string;
      timestamp: Date;
    }>
  >([]);

  useEffect(() => {
    const handleFooterUpdate = () => {
      const notification = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? (crypto as any).randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "info" as const,
        message: "🔄 Footer updated! Changes are now live on the website.",
        timestamp: new Date(),
      };

      setNotifications((prev) => [notification, ...prev.slice(0, 4)]); // Keep last 5

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
      }, 5000);
    };

    const handlePageCreate = () => {
      const notification = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? (crypto as any).randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "success" as const,
        message:
          "✅ Page published! It will appear in the footer automatically.",
        timestamp: new Date(),
      };

      setNotifications((prev) => [notification, ...prev.slice(0, 4)]);

      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
      }, 5000);
    };

    window.addEventListener("footerUpdate", handleFooterUpdate);
    window.addEventListener("footerRefresh", handleFooterUpdate);
    window.addEventListener("pagePublished", handlePageCreate);

    return () => {
      window.removeEventListener("footerUpdate", handleFooterUpdate);
      window.removeEventListener("footerRefresh", handleFooterUpdate);
      window.removeEventListener("pagePublished", handlePageCreate);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Check className="h-4 w-4 text-green-600" />;
      case "info":
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Check className="h-4 w-4 text-green-600" />;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-green-50 border-green-200 text-green-800";
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center justify-between p-3 rounded-lg border shadow-lg min-w-80 animate-in slide-in-from-right-5 duration-300 ${getColorClasses(notification.type)}`}
        >
          <div className="flex items-center space-x-3">
            {getIcon(notification.type)}
            <div>
              <p className="text-sm font-medium">{notification.message}</p>
              <p className="text-xs opacity-75">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-3 p-1 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
