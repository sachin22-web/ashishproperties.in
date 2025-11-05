import { useState, useEffect } from "react";
import { ChatMessage } from "@shared/chat-types";

export const useMessagePolling = (conversationId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        const response = await fetch(
          `/api/chat/conversations/${conversationId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setMessages(data.data.messages || []);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    // Initial fetch
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));

    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [conversationId]);

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  return { messages, loading, addMessage, setMessages };
};
