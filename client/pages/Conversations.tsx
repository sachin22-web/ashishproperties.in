import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Search,
  MapPin,
  User,
} from "lucide-react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../hooks/useAuth";
import { createApiUrl } from "../lib/api";

/* ================== Types ================== */
interface ConversationMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderType: "buyer" | "seller" | "agent" | "admin" | string;
  message: string; // backend keeps "message" and "text"; we show message
  imageUrl?: string;
  messageType: "text" | "image";
  createdAt: string;
}

interface Conversation {
  _id: string | { $oid?: string; oid?: string };
  propertyId?: string;
  participants?: string[];
  createdAt?: string;
  lastMessageAt?: string;
  property?: {
    _id?: string;
    title?: string;
    price?: number;
    location?: { address?: string };
    images?: string[];
    coverImage?: string;
  } | null;
  participantDetails?: Array<{
    _id: string;
    name: string;
    userType: string;
  }>;
  buyerData?: { _id: string; name: string; userType: string } | null;
  sellerData?: { _id: string; name: string; userType: string } | null;
  lastMessage?: Partial<ConversationMessage> & { text?: string };
  unreadCount?: number;
}

/* ============== Helpers/formatters ============== */
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

const fmtRelTime = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMin < 1) return "Just now";
  if (diffHours < 1) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const fmtTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

/* ================== Page ================== */
export default function Conversations() {
  const [searchParams] = useSearchParams();
  const { user, token, isAuthenticated } = useAuth();

  const meId = (user as any)?.id || (user as any)?._id; // support both shapes
  const queryConvId = searchParams.get("id");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* -------- Load conversations on auth -------- */
  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await xhr("GET", `conversations/my`, undefined, token);
        if (!res.ok) throw new Error(res.data?.error || `HTTP ${res.status}`);
        const payload = res.data?.data ?? res.data;
        const list = Array.isArray(payload) ? payload : [];
        if (alive) setConversations(list);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load conversations");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [isAuthenticated, token]);

  /* -------- Select conv by URL param when list arrives -------- */
  useEffect(() => {
    if (!queryConvId || conversations.length === 0) return;
    const conv = conversations.find((c) => normalizeId(c._id) === queryConvId);
    if (conv) setSelectedConversation(conv);
  }, [queryConvId, conversations]);

  /* -------- Load + poll messages when a conv is selected -------- */
  useEffect(() => {
    if (!selectedConversation) return;

    const cid = normalizeId(selectedConversation._id);
    let alive = true;
    let interval: any;

    const loadMsgs = async () => {
      await fetchMessages(cid);
      // mark read on open
      await markRead(cid);
    };

    loadMsgs(); // initial
    interval = setInterval(loadMsgs, 5000); // poll @5s

    return () => {
      alive = false;
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation, token]);

  /* -------- Auto scroll on new messages -------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================== API wrapper ================== */
  async function xhr(
    method: string,
    endpoint: string,
    body?: any,
    jwt?: string | null,
  ): Promise<{ ok: boolean; status: number; data: any }> {
    const url = createApiUrl(endpoint); // typically prefixes /api/
    return new Promise((resolve) => {
      try {
        const x = new XMLHttpRequest();
        x.open(method.toUpperCase(), url, true);
        if (jwt) x.setRequestHeader("Authorization", `Bearer ${jwt}`);
        if (body) x.setRequestHeader("Content-Type", "application/json");
        x.timeout = 15000;
        x.onreadystatechange = () => {
          if (x.readyState === 4) {
            let parsed: any = {};
            try {
              parsed = x.responseText ? JSON.parse(x.responseText) : {};
            } catch {
              parsed = { raw: x.responseText };
            }
            resolve({
              ok: x.status >= 200 && x.status < 300,
              status: x.status,
              data: parsed,
            });
          }
        };
        x.ontimeout = () => resolve({ ok: false, status: 408, data: { error: "timeout" } });
        x.onerror = () => resolve({ ok: false, status: 0, data: { error: "network" } });
        x.send(body ? JSON.stringify(body) : null);
      } catch (e: any) {
        resolve({ ok: false, status: 0, data: { error: e?.message || "network" } });
      }
    });
  }

  /* ================== Data loaders ================== */

  const fetchMessages = async (convId: string) => {
    if (!token) return;
    try {
      const resp = await xhr("GET", `conversations/${convId}/messages`, undefined, token);
      if (resp.ok) {
        const payload = resp.data?.data ?? resp.data;
        const arr = Array.isArray(payload?.messages)
          ? payload.messages
          : Array.isArray(payload)
          ? payload
          : [];
        // normalize to keep .message populated
        const normalized: ConversationMessage[] = arr.map((m: any) => ({
          ...m,
          message: m.message ?? m.text ?? "",
        }));
        setMessages(normalized);
      } else if (resp.status === 404 || resp.status === 403) {
        setError(resp.data?.error || "Conversation not found");
      }
    } catch (e) {
      // silent; network hiccup will retry on next poll
    }
  };

  const markRead = async (convId: string) => {
    if (!token) return;
    try {
      await xhr("POST", `conversations/${convId}/read`, {}, token);
      // Also reflect in local list
      setConversations((prev) =>
        prev.map((c) =>
          normalizeId(c._id) === convId ? { ...c, unreadCount: 0 } : c,
        ),
      );
    } catch {}
  };

  /* ================== Actions ================== */

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending || !token) return;

    try {
      setSending(true);
      const convId = normalizeId(selectedConversation._id);
      let resp = await xhr(
        "POST",
        `conversations/${convId}/messages`,
        { text: newMessage },
        token,
      );

      // If 400/404 try to create by property and retry once
      if (!resp.ok && (resp.status === 404 || resp.status === 400)) {
        const propId =
          (selectedConversation as any)?.property?._id ||
          (selectedConversation as any)?.propertyId;
        if (propId) {
          const created = await xhr(
            "POST",
            `conversations/find-or-create`,
            { propertyId: propId },
            token,
          );
          const newId =
            created.data?.data?._id ||
            created.data?._id ||
            created.data?.data?.conversationId ||
            created.data?.conversationId;
          if (created.ok && newId) {
            resp = await xhr(
              "POST",
              `conversations/${newId}/messages`,
              { text: newMessage },
              token,
            );
            // Switch selection to the new conversation id
            if (resp.ok) {
              const newConv = { ...(selectedConversation as any), _id: newId };
              setSelectedConversation(newConv);
              window.history.pushState({}, "", `/chats?id=${newId}`);
            }
          }
        }
      }

      if (resp.ok) {
        const msgRaw = resp.data?.data || resp.data;
        const msg: ConversationMessage = {
          ...msgRaw,
          message: msgRaw?.message ?? msgRaw?.text ?? "",
        };
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");

        // bump list + mark read for me
        await markRead(normalizeId(selectedConversation._id));
        // refresh list to update lastMessageAt etc.
        try {
          const listRes = await xhr("GET", `conversations/my`, undefined, token);
          if (listRes.ok) {
            const payload = listRes.data?.data ?? listRes.data;
            const list = Array.isArray(payload) ? payload : [];
            setConversations(list);
          }
        } catch {}
      } else {
        setError(resp.data?.error || "Failed to send message");
      }
    } catch (e) {
      setError("Failed to send message");
    } finally {
      setSending(false);
      // scroll down after attempt
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    const cid = normalizeId(conversation._id);
    window.history.pushState({}, "", `/chats?id=${cid}`);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    window.history.pushState({}, "", "/chats");
  };

  /* ================== Filters ================== */

  const filteredConversations = conversations.filter((conversation) => {
    const property =
      conversation.property || (conversation as any).propertyDetails?.[0];

    const othersArray =
      conversation.participantDetails ||
      ([conversation.buyerData, conversation.sellerData].filter(Boolean) as any[]) ||
      [];
    const otherParticipants = othersArray.filter(
      (p: any) => p && p._id !== meId,
    );

    const haystacks = [
      property?.title || "",
      conversation.lastMessage?.message || conversation.lastMessage?.text || "",
      otherParticipants.map((p: any) => p.name || "").join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return haystacks.includes(searchQuery.toLowerCase());
  });

  /* ================== Guards (auth/loading) ================== */

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Please login to access your conversations</p>
            <Button onClick={() => (window.location.href = "/login")} className="bg-[#C70000] hover:bg-[#A60000]">
              Login
            </Button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading conversations...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  /* ================== Selected conversation view ================== */
  if (selectedConversation) {
    const othersArray =
      selectedConversation.participantDetails ||
      ([selectedConversation.buyerData, selectedConversation.sellerData].filter(Boolean) as any[]) ||
      [];
    const otherParticipants = othersArray.filter((p: any) => p && p._id !== meId);
    const property =
      selectedConversation.property || (selectedConversation as any).propertyDetails?.[0];

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Conversation Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleBackToList} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900">
              {otherParticipants.length
                ? otherParticipants.map((p) => p.name).join(", ")
                : "Conversation"}
            </h1>
            <p className="text-sm text-gray-600 truncate">{property?.title || "Property"}</p>
          </div>
        </header>

        {/* Property Card */}
        {property && (
          <div className="bg-white border-b p-4">
            <div className="flex items-start space-x-3">
              {(property.images?.[0] || property.coverImage) && (
                <img
                  src={property.images?.[0] || property.coverImage!}
                  alt={property.title || "Property"}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{property.title || "Property"}</h3>
                {typeof property.price === "number" && (
                  <p className="text-lg font-semibold text-[#C70000]">
                    ₹{Number(property.price).toLocaleString()}
                  </p>
                )}
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.location?.address || "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-500">Start the conversation!</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === meId;
              const isAdmin = (m.senderType || "").toLowerCase() === "admin";
              return (
                <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      mine
                        ? "bg-[#C70000] text-white"
                        : isAdmin
                        ? "bg-blue-100 text-blue-900"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    {!mine && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{m.senderName}</span>
                        {isAdmin && (
                          <Badge variant="secondary" className="text-xs">
                            Support
                          </Badge>
                        )}
                      </div>
                    )}
                    {m.imageUrl ? (
                      <img src={m.imageUrl} alt="Sent" className="max-w-full h-auto rounded" />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                    )}
                    <p className={`text-xs opacity-75 mt-1 ${mine ? "text-white/80" : "text-gray-500"}`}>
                      {fmtTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="flex space-x-2 max-w-full">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-[#C70000] hover:bg-[#A60000] px-4"
              title="Send"
            >
              {sending ? (
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

  /* ================== List view ================== */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="bg-white border-b p-4">
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

      {/* Conversation List */}
      <div className="flex-1 pb-20">
        {error && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {filteredConversations.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No chats yet—open a property and tap Message Owner
            </h3>
            <Button onClick={() => (window.location.href = "/")} className="bg-[#C70000] hover:bg-[#A60000]">
              Browse Properties
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => {
              const othersArray =
                conversation.participantDetails ||
                ([conversation.buyerData, conversation.sellerData].filter(Boolean) as any[]) ||
                [];
              const otherParticipants = othersArray.filter((p: any) => p && p._id !== meId);
              const property =
                conversation.property || (conversation as any).propertyDetails?.[0];

              return (
                <div
                  key={normalizeId(conversation._id)}
                  onClick={() => handleConversationSelect(conversation)}
                  className="bg-white border-b p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      {property?.images?.[0] || property?.coverImage ? (
                        <img
                          src={property.images?.[0] || property.coverImage!}
                          alt={property.title || "Property"}
                          className="w-12 h-12 object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#C70000] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">
                          {otherParticipants.length
                            ? otherParticipants.map((p) => p.name).join(", ")
                            : "Conversation"}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {fmtRelTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{property?.title || "Property"}</p>
                      <p
                        className={`text-sm truncate ${
                          (conversation.unreadCount || 0) > 0
                            ? "text-gray-900 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {conversation.lastMessage?.message ||
                          conversation.lastMessage?.text ||
                          "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
