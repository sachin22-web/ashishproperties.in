import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, RefreshCw, X } from "lucide-react";
import { Button } from "./ui/button";

interface Notification {
  id: string;
  type:
    | "page_published"
    | "page_unpublished"
    | "page_updated"
    | "footer_updated";
  title: string;
  message: string;
  timestamp: Date;
  autoHide?: boolean;
}

export default function PageUpdateNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handlePagePublished = (event: any) => {
      const { pageId, title, slug } = event.detail || {};
      addNotification({
        type: "page_published",
        title: "New Page Published",
        message: `"${title}" is now live and appears in the footer`,
        autoHide: true,
      });
    };

    const handlePageUnpublished = (event: any) => {
      const { pageId, title, slug } = event.detail || {};
      addNotification({
        type: "page_unpublished",
        title: "Page Unpublished",
        message: `"${title}" has been removed from the footer`,
        autoHide: true,
      });
    };

    const handleFooterUpdate = () => {
      addNotification({
        type: "footer_updated",
        title: "Footer Updated",
        message: "Footer links and content have been refreshed",
        autoHide: true,
      });
    };

    // Add event listeners
    window.addEventListener("pagePublished", handlePagePublished);
    window.addEventListener("pageUnpublished", handlePageUnpublished);
    window.addEventListener("footerUpdate", handleFooterUpdate);
    window.addEventListener("footerRefresh", handleFooterUpdate);

    return () => {
      window.removeEventListener("pagePublished", handlePagePublished);
      window.removeEventListener("pageUnpublished", handlePageUnpublished);
      window.removeEventListener("footerUpdate", handleFooterUpdate);
      window.removeEventListener("footerRefresh", handleFooterUpdate);
    };
  }, []);

  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp">,
  ) => {
    const newNotification: Notification = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? (crypto as any).randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(),
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-hide notification after 5 seconds if specified
    if (notification.autoHide) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "page_published":
      case "footer_updated":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "page_unpublished":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "page_published":
      case "footer_updated":
        return "border-green-200 bg-green-50";
      case "page_unpublished":
        return "border-orange-200 bg-orange-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`border rounded-lg p-4 shadow-lg transition-all duration-300 ${getNotificationColor(notification.type)}`}
        >
          <div className="flex items-start space-x-3">
            {getNotificationIcon(notification.type)}

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>

              <div className="flex items-center space-x-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refreshPage}
                  className="text-xs h-6 px-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                <span className="text-xs text-gray-400">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
