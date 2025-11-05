import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { getDatabase } from './db/mongodb';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userType?: string;
  conversationId?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'auth' | 'message' | 'typing' | 'handoff_request' | 'join_conversation' | 'leave_conversation';
  token?: string;
  message?: string;
  propertyId?: string;
  sellerId?: string;
  userId?: string;
  conversationId?: string;
  isBotMode?: boolean;
  isTyping?: boolean;
}

export class ChatWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map(); // conversationId -> Set<WebSocket>
  private userConnections: Map<string, AuthenticatedWebSocket> = new Map(); // userId -> WebSocket

  constructor(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/chat'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.setupHeartbeat();
    
    console.log('🔌 Chat WebSocket server initialized');
  }

  private handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage) {
    console.log('��� New WebSocket connection');
    
    ws.isAlive = true;
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(ws);
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'auth':
        await this.handleAuth(ws, message);
        break;
      
      case 'message':
        await this.handleChatMessage(ws, message);
        break;
      
      case 'typing':
        this.handleTyping(ws, message);
        break;
      
      case 'handoff_request':
        await this.handleHandoffRequest(ws, message);
        break;
      
      case 'join_conversation':
        this.handleJoinConversation(ws, message);
        break;
      
      case 'leave_conversation':
        this.handleLeaveConversation(ws, message);
        break;
      
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private async handleAuth(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    try {
      if (!message.token) {
        this.sendError(ws, 'Token required');
        return;
      }

      const decoded: any = jwt.verify(message.token, JWT_SECRET);
      ws.userId = decoded.userId;
      ws.userType = decoded.userType;

      // Store user connection
      this.userConnections.set(ws.userId, ws);

      // Send auth success
      this.send(ws, {
        type: 'auth_success',
        userId: ws.userId,
        userType: ws.userType
      });

      console.log(`✅ WebSocket authenticated: ${ws.userId} (${ws.userType})`);

      // If conversation context provided, join the conversation
      if (message.propertyId || message.conversationId) {
        await this.handleConversationJoin(ws, message);
      }

    } catch (error) {
      console.error('Auth error:', error);
      this.sendError(ws, 'Authentication failed');
      ws.close();
    }
  }

  private async handleConversationJoin(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    try {
      const db = getDatabase();
      let conversationId = message.conversationId;

      // If no conversationId but propertyId provided, find or create conversation
      if (!conversationId && message.propertyId && message.sellerId && ws.userId) {
        const existingConversation = await db.collection("chat_conversations").findOne({
          propertyId: new ObjectId(message.propertyId),
          buyerId: new ObjectId(ws.userId),
          sellerId: new ObjectId(message.sellerId)
        });

        if (existingConversation) {
          conversationId = existingConversation._id.toString();
        } else {
          // Create new conversation
          const newConversation = {
            propertyId: new ObjectId(message.propertyId),
            sellerId: new ObjectId(message.sellerId),
            buyerId: new ObjectId(ws.userId),
            participants: [ws.userId, message.sellerId],
            lastMessage: '',
            lastMessageAt: new Date(),
            status: 'bot',
            isBot: true,
            handoffRequested: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await db.collection("chat_conversations").insertOne(newConversation);
          conversationId = result.insertedId.toString();

          this.send(ws, {
            type: 'conversation_created',
            conversationId
          });
        }
      }

      if (conversationId) {
        ws.conversationId = conversationId;
        
        // Add to conversation clients
        if (!this.clients.has(conversationId)) {
          this.clients.set(conversationId, new Set());
        }
        this.clients.get(conversationId)!.add(ws);

        console.log(`👥 User ${ws.userId} joined conversation ${conversationId}`);
      }

    } catch (error) {
      console.error('Error handling conversation join:', error);
      this.sendError(ws, 'Failed to join conversation');
    }
  }

  private async handleChatMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    try {
      if (!ws.userId || !message.message) {
        this.sendError(ws, 'User ID and message required');
        return;
      }

      const db = getDatabase();
      const conversationId = message.conversationId || ws.conversationId;

      if (!conversationId) {
        this.sendError(ws, 'Conversation ID required');
        return;
      }

      // Save user message to database
      const userMessage = {
        conversationId: new ObjectId(conversationId),
        senderId: ws.userId,
        senderType: 'user',
        message: message.message,
        messageType: 'text',
        timestamp: new Date(),
        isRead: false,
      };

      const userMessageResult = await db.collection("chat_messages").insertOne(userMessage);

      // Broadcast message to all clients in conversation
      this.broadcastToConversation(conversationId, {
        type: 'message',
        messageId: userMessageResult.insertedId.toString(),
        message: message.message,
        sender: 'user',
        senderId: ws.userId,
        timestamp: new Date(),
        conversationId
      });

      // If in bot mode, generate and send bot response
      if (message.isBotMode !== false) {
        setTimeout(async () => {
          await this.generateBotResponse(conversationId, message.message, message.propertyId);
        }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
      }

      // Update conversation last message
      await db.collection("chat_conversations").updateOne(
        { _id: new ObjectId(conversationId) },
        {
          $set: {
            lastMessage: message.message,
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

    } catch (error) {
      console.error('Error handling chat message:', error);
      this.sendError(ws, 'Failed to send message');
    }
  }

  private async generateBotResponse(conversationId: string, userMessage: string, propertyId?: string) {
    try {
      const db = getDatabase();

      // Get property data for context
      let propertyData = null;
      if (propertyId) {
        propertyData = await db.collection("properties").findOne(
          { _id: new ObjectId(propertyId) },
          { projection: { title: 1, price: 1, location: 1, description: 1 } }
        );
      }

      // Generate bot response (using the same AI logic from chatbot.ts)
      const botResponse = await this.generateAIResponse(userMessage, propertyData);

      // Save bot message
      const botMessage = {
        conversationId: new ObjectId(conversationId),
        senderId: 'system',
        senderType: 'bot',
        message: botResponse,
        messageType: 'text',
        timestamp: new Date(),
        isRead: false,
      };

      const botMessageResult = await db.collection("chat_messages").insertOne(botMessage);

      // Broadcast bot response
      this.broadcastToConversation(conversationId, {
        type: 'message',
        messageId: botMessageResult.insertedId.toString(),
        message: botResponse,
        sender: 'bot',
        senderId: 'system',
        timestamp: new Date(),
        conversationId
      });

    } catch (error) {
      console.error('Error generating bot response:', error);
    }
  }

  private async generateAIResponse(message: string, propertyData?: any): Promise<string> {
    // Simple AI response logic (same as in chatbot.ts)
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      const price = propertyData?.price ? `₹${(propertyData.price / 100000).toFixed(1)}L` : 'competitive rate';
      return `The property is listed at ${price}. This includes all basic amenities. Would you like to know about any additional costs or financing options?`;
    }
    
    if (lowerMessage.includes('location') || lowerMessage.includes('area')) {
      const location = propertyData?.location?.address || 'a prime location';
      return `This property is located in ${location}. It's a well-connected area with good transportation links. Would you like to know about nearby amenities?`;
    }
    
    if (lowerMessage.includes('visit') || lowerMessage.includes('see')) {
      return "I'd be happy to help you schedule a visit! The property owner is usually available for showings. What time works best for you - weekdays or weekends?";
    }
    
    if (lowerMessage.includes('contact') || lowerMessage.includes('owner')) {
      return "I can connect you directly with the property owner. They're very responsive and can answer all your specific questions. Would you like their contact details?";
    }
    
    return "I'm here to help with any questions about this property. Whether it's about pricing, location, features, or scheduling a visit - just ask!";
  }

  private handleTyping(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (ws.conversationId) {
      this.broadcastToConversation(ws.conversationId, {
        type: 'typing',
        isTyping: message.isTyping,
        userId: ws.userId
      }, ws);
    }
  }

  private async handleHandoffRequest(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    try {
      const db = getDatabase();
      const conversationId = message.conversationId || ws.conversationId;

      if (!conversationId) {
        this.sendError(ws, 'Conversation ID required');
        return;
      }

      // Update conversation to human mode
      await db.collection("chat_conversations").updateOne(
        { _id: new ObjectId(conversationId) },
        {
          $set: {
            handoffRequested: true,
            status: 'human',
            isBot: false,
            updatedAt: new Date(),
          },
        }
      );

      // Broadcast handoff notification
      this.broadcastToConversation(conversationId, {
        type: 'handoff',
        conversationId
      });

      // Notify seller if available
      if (message.sellerId) {
        const sellerWs = this.userConnections.get(message.sellerId);
        if (sellerWs) {
          this.send(sellerWs, {
            type: 'handoff_request',
            conversationId,
            propertyId: message.propertyId
          });
        }

        // Create notification in database
        await db.collection("notifications").insertOne({
          sellerId: new ObjectId(message.sellerId),
          title: "New Chat Request",
          message: "A potential buyer wants to chat with you directly about your property.",
          type: "general",
          isRead: false,
          createdAt: new Date(),
          actionUrl: `/chat?conversation=${conversationId}`,
        });
      }

    } catch (error) {
      console.error('Error handling handoff request:', error);
      this.sendError(ws, 'Failed to request handoff');
    }
  }

  private handleJoinConversation(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (message.conversationId) {
      ws.conversationId = message.conversationId;
      
      if (!this.clients.has(message.conversationId)) {
        this.clients.set(message.conversationId, new Set());
      }
      this.clients.get(message.conversationId)!.add(ws);
    }
  }

  private handleLeaveConversation(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (ws.conversationId) {
      const conversationClients = this.clients.get(ws.conversationId);
      if (conversationClients) {
        conversationClients.delete(ws);
        if (conversationClients.size === 0) {
          this.clients.delete(ws.conversationId);
        }
      }
      ws.conversationId = undefined;
    }
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      this.userConnections.delete(ws.userId);
    }

    if (ws.conversationId) {
      const conversationClients = this.clients.get(ws.conversationId);
      if (conversationClients) {
        conversationClients.delete(ws);
        if (conversationClients.size === 0) {
          this.clients.delete(ws.conversationId);
        }
      }
    }

    console.log(`📱 WebSocket disconnected: ${ws.userId}`);
  }

  private broadcastToConversation(conversationId: string, data: any, excludeWs?: AuthenticatedWebSocket) {
    const clients = this.clients.get(conversationId);
    if (clients) {
      clients.forEach((client) => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
          this.send(client, data);
        }
      });
    }
  }

  private send(ws: AuthenticatedWebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private sendError(ws: AuthenticatedWebSocket, error: string) {
    this.send(ws, {
      type: 'error',
      error
    });
  }

  private setupHeartbeat() {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          this.handleDisconnection(ws);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  public getStats() {
    return {
      totalConnections: this.wss.clients.size,
      activeConversations: this.clients.size,
      authenticatedUsers: this.userConnections.size
    };
  }
}
