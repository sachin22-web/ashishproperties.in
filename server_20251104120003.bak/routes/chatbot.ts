import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

interface ChatMessage {
  _id?: ObjectId;
  conversationId: ObjectId;
  senderId: string;
  senderType: 'user' | 'bot' | 'human';
  message: string;
  messageType: 'text' | 'property' | 'contact' | 'system';
  data?: any;
  timestamp: Date;
  isRead: boolean;
  readAt?: Date;
}

interface ChatConversation {
  _id?: ObjectId;
  propertyId?: ObjectId;
  sellerId?: ObjectId;
  buyerId: ObjectId;
  participants: string[];
  lastMessage: string;
  lastMessageAt: Date;
  status: 'active' | 'closed' | 'bot' | 'human';
  isBot: boolean;
  handoffRequested: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// AI Bot Response Generator
class AIBotManager {
  private propertyResponses = {
    price: [
      "The property is listed at ₹{price}. This includes all basic amenities. Would you like to know about any additional costs or financing options?",
      "The asking price is ₹{price}. Based on the location and features, this is quite competitive. Are you interested in scheduling a visit?",
      "This property is priced at ₹{price}. I can connect you with the owner to discuss any negotiations if you're seriously interested."
    ],
    location: [
      "This property is located in {location}. It's a well-connected area with good transportation links. Would you like to know about nearby amenities?",
      "The location is {location}. This area has excellent schools, hospitals, and shopping centers nearby. What specific locality features are you looking for?",
      "It's situated in {location}. The neighborhood is known for its peaceful environment and good infrastructure. Would you like more details about the area?"
    ],
    features: [
      "This property offers excellent features including modern amenities. The seller can provide a detailed feature list. Would you like me to connect you with them?",
      "The property has been well-maintained with quality fittings. For specific details about rooms, amenities, and features, I can arrange a call with the owner.",
      "It comes with all modern conveniences. The best way to understand all features is through a property visit. Shall I help you schedule one?"
    ],
    visit: [
      "I'd be happy to help you schedule a visit! The property owner is usually available for showings. What time works best for you - weekdays or weekends?",
      "Great idea! Visiting the property will give you a complete picture. I can connect you with the owner to arrange a convenient time. When would you prefer?",
      "Property visits are the best way to make a decision. The owner is very accommodating with timings. Should I set up a meeting for you?"
    ],
    contact: [
      "I can connect you directly with the property owner. They're very responsive and can answer all your specific questions. Would you like their contact details?",
      "The seller is available for direct communication. They can provide detailed information and arrange meetings. Shall I facilitate the introduction?",
      "For detailed discussions, direct contact with the owner works best. They can share more photos, documents, and arrange visits. Would you like me to connect you?"
    ],
    general: [
      "I'm here to help with any questions about this property. Whether it's about pricing, location, features, or scheduling a visit - just ask!",
      "Feel free to ask me anything about this property. I can help with information about the area, pricing details, or connect you with the owner for specific queries.",
      "What would you like to know about this property? I can assist with general information and help you get in touch with the seller for detailed discussions."
    ]
  };

  private getRandomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('₹') || lowerMessage.includes('expensive') || lowerMessage.includes('cheap')) {
      return 'price';
    }
    if (lowerMessage.includes('location') || lowerMessage.includes('area') || lowerMessage.includes('address') || lowerMessage.includes('where')) {
      return 'location';
    }
    if (lowerMessage.includes('feature') || lowerMessage.includes('amenity') || lowerMessage.includes('facility') || lowerMessage.includes('room') || lowerMessage.includes('bathroom') || lowerMessage.includes('kitchen')) {
      return 'features';
    }
    if (lowerMessage.includes('visit') || lowerMessage.includes('see') || lowerMessage.includes('tour') || lowerMessage.includes('viewing') || lowerMessage.includes('inspection')) {
      return 'visit';
    }
    if (lowerMessage.includes('contact') || lowerMessage.includes('owner') || lowerMessage.includes('seller') || lowerMessage.includes('call') || lowerMessage.includes('speak') || lowerMessage.includes('talk')) {
      return 'contact';
    }
    
    return 'general';
  }

  public async generateResponse(message: string, propertyData?: any): Promise<string> {
    const intent = this.detectIntent(message);
    let response = this.getRandomResponse(this.propertyResponses[intent] || this.propertyResponses.general);
    
    // Replace placeholders with actual data
    if (propertyData) {
      response = response.replace('{price}', propertyData.price ? `${(propertyData.price / 100000).toFixed(1)}L` : 'competitive rate');
      response = response.replace('{location}', propertyData.location || 'a prime location');
      response = response.replace('{title}', propertyData.title || 'this property');
    }
    
    return response;
  }

  public shouldHandoffToHuman(message: string): boolean {
    const handoffKeywords = [
      'speak to owner', 'talk to seller', 'human agent', 'real person',
      'not satisfied', 'complex question', 'legal', 'documentation',
      'negotiate', 'serious buyer', 'final decision'
    ];
    
    const lowerMessage = message.toLowerCase();
    return handoffKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

const botManager = new AIBotManager();

// Send message to chatbot
export const sendChatbotMessage: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { message, propertyId, sellerId, conversationId, isBotMode, userId } = req.body;
    const senderId = userId || (req as any).userId;

    if (!message || !senderId) {
      return res.status(400).json({
        success: false,
        error: "Message and user ID are required",
      });
    }

    let currentConversationId = conversationId;

    // Create or get conversation
    if (!currentConversationId) {
      const newConversation: Omit<ChatConversation, '_id'> = {
        propertyId: propertyId ? new ObjectId(propertyId) : undefined,
        sellerId: sellerId ? new ObjectId(sellerId) : undefined,
        buyerId: new ObjectId(senderId),
        participants: [senderId, sellerId].filter(Boolean),
        lastMessage: message,
        lastMessageAt: new Date(),
        status: 'bot',
        isBot: true,
        handoffRequested: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const conversationResult = await db.collection("chat_conversations").insertOne(newConversation);
      currentConversationId = conversationResult.insertedId.toString();
    }

    // Save user message
    const userMessage: Omit<ChatMessage, '_id'> = {
      conversationId: new ObjectId(currentConversationId),
      senderId,
      senderType: 'user',
      message,
      messageType: 'text',
      timestamp: new Date(),
      isRead: false,
    };

    const userMessageResult = await db.collection("chat_messages").insertOne(userMessage);

    // Get property data for context
    let propertyData = null;
    if (propertyId) {
      propertyData = await db.collection("properties").findOne(
        { _id: new ObjectId(propertyId) },
        { projection: { title: 1, price: 1, location: 1, description: 1 } }
      );
    }

    let botResponse = '';
    let shouldHandoff = false;

    if (isBotMode) {
      // Check if should handoff to human
      shouldHandoff = botManager.shouldHandoffToHuman(message);
      
      if (shouldHandoff) {
        botResponse = "I understand you'd like to speak with the property owner directly. Let me connect you with them. They'll be able to provide detailed information and answer all your specific questions.";
        
        // Update conversation to request handoff
        await db.collection("chat_conversations").updateOne(
          { _id: new ObjectId(currentConversationId) },
          { 
            $set: { 
              handoffRequested: true, 
              status: 'human',
              updatedAt: new Date() 
            } 
          }
        );
      } else {
        // Generate AI response
        botResponse = await botManager.generateResponse(message, propertyData);
      }

      // Save bot response
      const botMessage: Omit<ChatMessage, '_id'> = {
        conversationId: new ObjectId(currentConversationId),
        senderId: 'system',
        senderType: shouldHandoff ? 'human' : 'bot',
        message: botResponse,
        messageType: 'text',
        timestamp: new Date(),
        isRead: false,
      };

      await db.collection("chat_messages").insertOne(botMessage);
    }

    // Update conversation last message
    await db.collection("chat_conversations").updateOne(
      { _id: new ObjectId(currentConversationId) },
      {
        $set: {
          lastMessage: botResponse || message,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Create notification for seller if handoff requested
    if (shouldHandoff && sellerId) {
      await db.collection("notifications").insertOne({
        userId: new ObjectId(sellerId),
        userType: "seller",
        sellerId: new ObjectId(sellerId), // Keep for compatibility
        title: "New Chat Request",
        message: `A potential buyer wants to chat about your property${propertyData ? `: ${propertyData.title}` : ''}. They're ready to discuss details.`,
        type: "general",
        isRead: false,
        createdAt: new Date(),
        actionUrl: `/chat?conversation=${currentConversationId}`,
      });
    }

    const response: ApiResponse<{
      conversationId: string;
      messageId: string;
      response?: string;
      handoff?: boolean;
    }> = {
      success: true,
      data: {
        conversationId: currentConversationId,
        messageId: userMessageResult.insertedId.toString(),
        response: botResponse,
        handoff: shouldHandoff,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error in chatbot:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process message",
    });
  }
};

// Get chat conversations for admin
export const getAdminChatConversations: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 20, filter, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const mongoFilter: any = {};
    
    if (filter === 'bot') {
      mongoFilter.isBot = true;
    } else if (filter === 'human') {
      mongoFilter.isBot = false;
    } else if (filter === 'handoff') {
      mongoFilter.handoffRequested = true;
    }

    if (search) {
      mongoFilter.$or = [
        { lastMessage: { $regex: search, $options: 'i' } }
      ];
    }

    // Get conversations with aggregation for user and property details
    const conversations = await db.collection("chat_conversations")
      .aggregate([
        { $match: mongoFilter },
        { $sort: { lastMessageAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: "users",
            localField: "buyerId",
            foreignField: "_id",
            as: "buyerDetails"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "sellerId",
            foreignField: "_id",
            as: "sellerDetails"
          }
        },
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "propertyDetails"
          }
        },
        {
          $addFields: {
            buyerName: { $arrayElemAt: ["$buyerDetails.name", 0] },
            sellerName: { $arrayElemAt: ["$sellerDetails.name", 0] },
            propertyTitle: { $arrayElemAt: ["$propertyDetails.title", 0] },
          }
        }
      ])
      .toArray();

    const total = await db.collection("chat_conversations").countDocuments(mongoFilter);

    const response: ApiResponse<{
      conversations: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        conversations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching admin chat conversations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch conversations",
    });
  }
};

// Get messages for admin conversation view
export const getAdminChatMessages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { conversationId } = req.params;

    if (!ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversation ID",
      });
    }

    const messages = await db.collection("chat_messages")
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ timestamp: 1 })
      .toArray();

    // Get conversation details
    const conversation = await db.collection("chat_conversations")
      .aggregate([
        { $match: { _id: new ObjectId(conversationId) } },
        {
          $lookup: {
            from: "users",
            localField: "buyerId",
            foreignField: "_id",
            as: "buyerDetails"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "sellerId",
            foreignField: "_id",
            as: "sellerDetails"
          }
        },
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "propertyDetails"
          }
        }
      ])
      .toArray();

    const response: ApiResponse<{
      messages: any[];
      conversation: any;
    }> = {
      success: true,
      data: {
        messages,
        conversation: conversation[0] || null,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching admin chat messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
    });
  }
};

// Send admin message to conversation
export const sendAdminMessage: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { conversationId } = req.params;
    const { message } = req.body;
    const adminId = (req as any).userId;

    if (!ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversation ID",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // Save admin message
    const adminMessage: Omit<ChatMessage, '_id'> = {
      conversationId: new ObjectId(conversationId),
      senderId: adminId,
      senderType: 'human',
      message,
      messageType: 'text',
      timestamp: new Date(),
      isRead: false,
    };

    const result = await db.collection("chat_messages").insertOne(adminMessage);

    // Update conversation
    await db.collection("chat_conversations").updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessage: message,
          lastMessageAt: new Date(),
          status: 'human',
          isBot: false,
          updatedAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      data: {
        messageId: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error("Error sending admin message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
};

// Delete chat conversation
export const deleteChatConversation: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { conversationId } = req.params;

    if (!ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversation ID",
      });
    }

    // Delete messages first
    await db.collection("chat_messages").deleteMany({
      conversationId: new ObjectId(conversationId),
    });

    // Delete conversation
    await db.collection("chat_conversations").deleteOne({
      _id: new ObjectId(conversationId),
    });

    res.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat conversation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete conversation",
    });
  }
};

// Get chat statistics for admin dashboard
export const getChatStatistics: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const stats = await db.collection("chat_conversations").aggregate([
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          botConversations: {
            $sum: { $cond: [{ $eq: ["$isBot", true] }, 1, 0] }
          },
          humanConversations: {
            $sum: { $cond: [{ $eq: ["$isBot", false] }, 1, 0] }
          },
          handoffRequests: {
            $sum: { $cond: [{ $eq: ["$handoffRequested", true] }, 1, 0] }
          },
          activeConversations: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    // Get message count
    const messageCount = await db.collection("chat_messages").countDocuments();

    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentConversations = await db.collection("chat_conversations").countDocuments({
      createdAt: { $gte: yesterday }
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        ...stats[0],
        totalMessages: messageCount,
        recentConversations,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching chat statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
};
