export interface ChatConversation {
  _id?: string;
  participants: string[]; // user IDs
  propertyId?: string; // Optional: if chat is about a specific property
  lastMessage?: ChatMessage;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  _id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: "buyer" | "seller" | "agent" | "admin";
  message: string;
  messageType: "text" | "image" | "property_card";
  propertyData?: {
    id: string;
    title: string;
    price: number;
    image: string;
    location: string;
  };
  readBy: {
    userId: string;
    readAt: Date;
  }[];
  createdAt: Date;
}

export interface ChatUser {
  id: string;
  name: string;
  userType: "buyer" | "seller" | "agent" | "admin";
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface UnreadCount {
  conversationId: string;
  count: number;
}
