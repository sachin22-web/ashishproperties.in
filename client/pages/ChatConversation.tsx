import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Phone,
  MoreVertical,
  Circle,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../hooks/useAuth";
import { io, Socket } from "socket.io-client";
import { toast } from "../components/ui/use-toast";
import { createApiUrl } from "../lib/api";

/* ================= Types ================= */
type UserLite = { _id?: string; id?: string; name?: string; userType?: string };

interface Message {
  _id: string;
  conversationId: string; // ObjectId (string) on client
  sender: string;         // legacy field
  senderId: string;       // normalized string
  senderName?: string;
  senderType?: string;
  message: string;        // normalized (message || text)
  imageUrl?: string;
  messageType?: "text" | "image";
  createdAt: string;      // ISO string
  readBy?: Array<{ userId: string; readAt: string }>;
}

interface Conversation {
  _id: string | { $oid?: string; oid?: string };
  buyer: string;
  seller: string;
  property?: {
    _id: string;
    title?: string;
    price?: number;
    images?: string[];
    location?: { address?: string };
    coverImage?: string;
  } | null;
  buyerData?: UserLite | null;
  sellerData?: UserLite | null;
  lastMessageAt?: string;
}

/* ============== Utils ============== */
const normalizeId = (val: any): string => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (val.$oid) return val.$oid;
  if (val.oid) return val.oid;
  try {
    return String(val.toString());
  } catch {
    return String(val);
  }
};

const apiGet = async (endpoint: string, token: string) => {
  const url = createApiUrl(endpoint);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data: j };
};

const apiPost = async (endpoint: string, token: string, body?: any) => {
  const url = createApiUrl(endpoint);
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data: j };
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* ============== Component ============== */
export default function ChatConversation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();

  const meId = (user as any)?.id || (user as any)?._id;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* -------------- Scroll on new messages -------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------------- Guard + initial load -------------- */
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!id || id === "undefined") {
      toast({ title: "Open a property and tap Message Owner" });
      navigate("/chats");
      return;
    }

    let alive = true;
    setLoading(true);
    setError("");

    (async () => {
      // load conversations list and pick one with id
      const listRes = await apiGet("conversations/my", token!);
      if (!listRes.ok || !Array.isArray(listRes.data?.data ?? listRes.data)) {
        if (alive) {
          setError(listRes.data?.error || "Failed to load conversation");
          setLoading(false);
        }
        return;
      }
      const list: Conversation[] = (listRes.data?.data ?? listRes.data) as any[];
      const conv = list.find((c) => normalizeId(c._id) === id);
      if (!conv) {
        if (alive) {
          setError("Conversation not found");
          setLoading(false);
        }
        return;
      }
      if (alive) setConversation(conv);

      // messages
      await loadMessages(id!);

      // mark read once on open
      await markRead(id!);

      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated, token]);

  /* -------------- Socket.io setup -------------- */
  useEffect(() => {
    if (!token || !isAuthenticated || !id || id === "undefined") return;

    const socket = io(window.location.origin, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    // join room for this conversation
    socket.emit("join-conversation", id);

    // handle multiple possible event names/payload shapes
    const onAnyNewMessage = (payload: any) => {
      // possible shapes:
      // { conversation: "<id>", ... } OR
      // { conversationId: "<id>", ... } OR
      // { conversation: { _id: "<id>" }, ... }
      const convId =
        payload?.conversationId ||
        (typeof payload?.conversation === "string"
          ? payload.conversation
          : normalizeId(payload?.conversation?._id));

      if (convId !== id) return;

      const msg: Message = {
        _id: String(payload?._id || payload?.id || Math.random()),
        conversationId: convId,
        sender: String(payload?.senderId || payload?.sender || ""),
        senderId: String(payload?.senderId || payload?.sender || ""),
        senderName: payload?.senderName || "",
        senderType: payload?.senderType || "",
        message: payload?.message ?? payload?.text ?? "",
        imageUrl: payload?.imageUrl || undefined,
        messageType: payload?.messageType || (payload?.imageUrl ? "image" : "text"),
        createdAt: payload?.createdAt
          ? new Date(payload.createdAt).toISOString()
          : new Date().toISOString(),
        readBy: payload?.readBy,
      };

      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("message:new", onAnyNewMessage);
    socket.on("new-message", onAnyNewMessage);
    socket.on("chat:new-message", onAnyNewMessage);

    socket.on("connect", () => console.log("Socket connected"));
    socket.on("disconnect", () => console.log("Socket disconnected"));

    return () => {
      try {
        socket.emit("leave-conversation", id);
        socket.removeAllListeners();
        socket.disconnect();
      } catch {}
      socketRef.current = null;
    };
  }, [token, isAuthenticated, id]);

  /* -------------- Visibility/focus: mark as read -------------- */
  useEffect(() => {
    if (!id || !token) return;
    const onFocus = () => markRead(id);
    const onVisible = () => {
      if (document.visibilityState === "visible") markRead(id);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [id, token]);

  /* -------------- Load messages helper -------------- */
  const loadMessages = async (convId: string) => {
    const res = await apiGet(`conversations/${convId}/messages`, token!);
    if (res.status === 403 || res.status === 404) {
      setError("Conversation not found");
      return;
    }
    if (!res.ok) {
      setError(res.data?.error || "Failed to load messages");
      return;
    }
    const payload = res.data?.data ?? res.data;
    const arr = Array.isArray(payload?.messages)
      ? payload.messages
      : Array.isArray(payload)
      ? payload
      : [];

    const normalized: Message[] = arr.map((m: any) => ({
      _id: String(m._id),
      conversationId: normalizeId(m.conversationId),
      sender: String(m.senderId || m.sender || ""),
      senderId: String(m.senderId || m.sender || ""),
      senderName: m.senderName || "",
      senderType: m.senderType || "",
      message: m.message ?? m.text ?? "",
      imageUrl: m.imageUrl || undefined,
      messageType: m.messageType || (m.imageUrl ? "image" : "text"),
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
      readBy: m.readBy,
    }));

    setMessages(normalized);
  };

  /* -------------- Mark read helper -------------- */
  const markRead = async (convId: string) => {
    await apiPost(`conversations/${convId}/read`, token!, {});
  };

  /* -------------- Send message -------------- */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id || id === "undefined" || sendingMessage || !token) return;

    setSendingMessage(true);
    setError("");

    const res = await apiPost(`conversations/${id}/messages`, token!, { text: newMessage });
    if (res.ok) {
      const raw = res.data?.data ?? res.data;
      const msg: Message = {
        _id: String(raw?._id || Math.random()),
        conversationId: id!,
        sender: String(raw?.senderId || raw?.sender || meId || ""),
        senderId: String(raw?.senderId || raw?.sender || meId || ""),
        senderName: raw?.senderName || (user as any)?.name || "You",
        senderType: raw?.senderType || "",
        message: raw?.message ?? raw?.text ?? newMessage,
        imageUrl: raw?.imageUrl || undefined,
        messageType: raw?.messageType || "text",
        createdAt: raw?.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
        readBy: raw?.readBy,
      };

      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      // ensure unread cleared for me
      await markRead(id!);
      // scroll
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } else {
      setError(res.data?.error || "Failed to send message");
    }

    setSendingMessage(false);
  };

  /* -------------- Derived -------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Conversation not found</h2>
          <p className="text-gray-600 mb-4">The conversation you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/chats")} className="bg-[#C70000] hover:bg-[#A60000] text-white">
            Back to Chats
          </Button>
        </div>
      </div>
    );
  }

  const otherParticipant =
    conversation.buyer === meId ? conversation.sellerData : conversation.buyerData;
  const property = conversation.property;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center space-x-3">
        <button onClick={() => navigate("/chats")} className="p-1">
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>

        <div className="w-10 h-10 bg-[#C70000] rounded-full flex items-center justify-center">
          <span className="text-white font-semibold">
            {otherParticipant?.name?.charAt(0)?.toUpperCase() || "U"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {otherParticipant?.name || "Unknown User"}
          </h3>
          <div className="flex items-center space-x-1">
            <Circle className="h-2 w-2 text-green-500 fill-current" />
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full" title="Call">
            <Phone className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full" title="More">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-3 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Property Card */}
      {property && (
        <div className="bg-white border-b p-4">
          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
            {(property.images?.[0] || property.coverImage) && (
              <img
                src={property.images?.[0] || property.coverImage!}
                alt={property.title || "Property"}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm truncate">{property.title || "Property"}</h4>
              <p className="text-xs text-gray-600 truncate">{property.location?.address || "—"}</p>
              {typeof property.price === "number" && (
                <p className="text-sm font-semibold text-[#C70000]">
                  ₹{Number(property.price).toLocaleString()}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => navigate(`/property/${property._id}`)}
            >
              View Listing
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No messages yet. Say hello 👋</div>
        ) : (
          messages.map((m) => {
            const isMe = (m.senderId || m.sender) === meId;
            const readCount = (m.readBy?.length || 0);
            const isRead = isMe && readCount > 1;
            return (
              <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                    isMe ? "bg-[#C70000] text-white" : "bg-white text-gray-900"
                  }`}
                >
                  {m.imageUrl ? (
                    <img src={m.imageUrl} alt="Sent" className="max-w-full h-auto rounded" />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                  )}
                  <div
                    className={`flex items-center gap-2 text-xs mt-1 ${
                      isMe ? "text-red-100" : "text-gray-500"
                    }`}
                  >
                    <span>{fmtTime(m.createdAt)}</span>
                    {isMe && <span>{isRead ? "✓✓" : "✓"}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="bg-white border-t p-4">
        <div className="flex items-end space-x-2">
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            id="file-input"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 10 * 1024 * 1024) {
                setError("File too large (max 10MB)");
                return;
              }
              toast({ title: "Attachments coming soon", description: file.name });
            }}
          />
          <Button variant="outline" className="px-2" onClick={() => document.getElementById("file-input")?.click()}>
            📎
          </Button>
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 resize-y max-h-40"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            className="bg-[#C70000] hover:bg-[#A60000] text-white p-2"
            title="Send"
          >
            {sendingMessage ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
