import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getDatabase } from './db/mongodb';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    userType?: string;
  };
}

export class ChatSocketServer {
  private io: Server;

  constructor(httpServer: any) {
    this.io = new Server(httpServer, {
      cors: {
        origin: true,
        credentials: true,
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketAuth();
    this.setupEventHandlers();
    
    console.log('🔌 Socket.io chat server initialized');
  }

  private setupSocketAuth() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded: any = jwt.verify(token, JWT_SECRET);
        socket.data.userId = decoded.userId;
        socket.data.userType = decoded.userType;

        console.log(`✅ Socket authenticated: ${socket.data.userId} (${socket.data.userType})`);
        next();
      } catch (error) {
        console.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.data.userId!;
      
      // Join user's personal room for notifications
      socket.join(`user:${userId}`);
      
      console.log(`👤 User ${userId} connected via Socket.io`);

      // Handle joining conversation rooms
      socket.on('join-conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`👥 User ${userId} joined conversation ${conversationId}`);
      });

      // Handle leaving conversation rooms
      socket.on('leave-conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`👋 User ${userId} left conversation ${conversationId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`📱 User ${userId} disconnected`);
      });
    });
  }

  // Emit new message to conversation participants
  public emitNewMessage(conversation: any, message: any) {
    const { buyer, seller } = conversation;
    
    const messageData = {
      conversation: conversation._id.toString(),
      _id: message._id.toString(),
      text: message.text || message.message,
      sender: message.sender || message.senderId,
      createdAt: message.createdAt
    };

    // Emit to both buyer and seller rooms
    this.io.to([`user:${buyer}`, `user:${seller}`]).emit('message:new', messageData);
    
    // Also emit to conversation room if anyone is actively viewing it
    this.io.to(`conversation:${conversation._id.toString()}`).emit('message:new', messageData);

    console.log(`📨 Message emitted to users: ${buyer}, ${seller}`);
  }

  // Emit to admin users (for support inbox)
  public emitToAdmins(event: string, data: any) {
    // Assuming admin users join an 'admin' room
    this.io.to('admin').emit(event, data);
  }

  // Emit to a single user by userId
  public emitToUser(userId: string, event: string, data: any) {
    try {
      this.io.to(`user:${userId}`).emit(event, data);
      console.log(`🔔 Emitted event ${event} to user:${userId}`);
    } catch (e) {
      console.error('Error emitting to user room', e);
    }
  }

  // Get connection stats
  public getStats() {
    return {
      connectedSockets: this.io.sockets.sockets.size,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys())
    };
  }
}
