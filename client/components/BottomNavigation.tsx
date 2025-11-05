import React from "react";
import { Home, MessageCircle, User, FileText } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUnreadCount } from "../hooks/useUnreadCount";

type AnyUser = {
  userType?: string;
  conversationId?: string;
  sellerConversationId?: string;
  defaultConversationId?: string;
  lastConversationId?: string;
  [k: string]: any;
};

export default function BottomNavigation() {
  const location = useLocation();
  const unreadCount = useUnreadCount();
  const { isAuthenticated, user } = useAuth() as {
    isAuthenticated: boolean;
    user?: AnyUser | null;
  };

  // --- Chat target: /chats (optional ?id=...)
  const chatHref = React.useMemo(() => {
    const fromUser =
      user?.sellerConversationId ||
      user?.conversationId ||
      user?.defaultConversationId ||
      user?.lastConversationId ||
      "";

    const fromLS =
      typeof window !== "undefined"
        ? localStorage.getItem("sellerConversationId") ||
          localStorage.getItem("conversationId") ||
          localStorage.getItem("lastConversationId")
        : null;

    const cid = fromUser || fromLS || "";
    const base = "/chats";
    const target = cid ? `${base}?id=${encodeURIComponent(String(cid))}` : base;

    return isAuthenticated
      ? target
      : `/auth?returnTo=${encodeURIComponent(target)}`;
  }, [isAuthenticated, user]);

  // ---- Active checks ----
  const isHome = location.pathname === "/";
  const isMyAds = location.pathname === "/account/my-ads";
  const isChat =
    location.pathname === "/chats" ||
    location.pathname.startsWith("/conversation/");
  const isAccount = location.pathname === "/my-account";

  const navItems = [
    { icon: Home, label: "Home", to: "/", active: isHome },

    {
      icon: FileText,
      label: "My Ads",
      to: isAuthenticated
        ? "/seller-dashboard"
        : `/auth?returnTo=${encodeURIComponent("/seller-dashboard")}`,
      active: isMyAds,
    },

    { icon: null as any, label: "", to: "", active: false }, // FAB placeholder

    {
      icon: MessageCircle,
      label: "Chat",
      to: chatHref, // ✅ /chats
      active: isChat,
    },

    { icon: User, label: "My Account", to: "/my-account", active: isAccount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex items-center justify-around h-16 relative">
        {navItems.map((item, index) => {
          if (index === 2) {
            // Center add button (FAB) with "Post ad" text
            return (
              <div key="add-button" className="flex-1 flex justify-center">
                <div className="flex flex-col items-center -translate-y-2">
                  <Link
                    to={
                      isAuthenticated
                        ? "/post-property"
                        : `/auth?returnTo=${encodeURIComponent("/post-property")}`
                    }
                    aria-label="Post ad"
                    className="w-14 h-14 bg-[#C70000] rounded-full flex items-center justify-center shadow-lg hover:bg-[#A60000] transition-colors active:scale-95 border-2 border-white"
                  >
                    <span className="text-white text-[10px] font-semibold leading-tight text-center tracking-wide">
                      Post ad
                    </span>
                  </Link>
                </div>
              </div>
            );
          }

          const Icon = item.icon!;
          return (
            <Link
              key={item.label || index}
              to={item.to}
              className={`flex-1 flex flex-col items-center justify-center py-2 relative transition-colors ${
                item.active ? "text-[#C70000]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.icon && (
                <div className="relative">
                  <Icon
                    className={`h-6 w-6 mb-1 ${
                      item.active ? "text-[#C70000]" : "text-gray-500"
                    }`}
                  />
                  {item.label === "Chat" && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#C70000] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {item.label && <span className="text-xs font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
