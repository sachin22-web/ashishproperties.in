import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ChatConversation, ChatMessage } from "@shared/chat-types";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

// Get all conversations for a user
export const getUserConversations: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;

    const conversations = await db
      .collection("conversations")
      .aggregate([
        {
          $match: {
            participants: userId,
          },
        },
        {
          $lookup: {
            from: "messages",
            localField: "_id",
            foreignField: "conversationId",
            as: "messages",
          },
        },
        {
          $addFields: {
            lastMessage: {
              $arrayElemAt: [
                {
                  $sortArray: {
                    input: "$messages",
                    sortBy: { createdAt: -1 },
                  },
                },
                0,
              ],
            },
            unreadCount: {
              $size: {
                $filter: {
                  input: "$messages",
                  cond: {
                    $and: [
                      { $ne: ["$$this.senderId", userId] },
                      {
                        $not: {
                          $in: [
                            userId,
                            {
                              $map: {
                                input: "$$this.readBy",
                                as: "reader",
                                in: "$$reader.userId",
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participantDetails",
          },
        },
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "propertyDetails",
          },
        },
        {
          $project: {
            messages: 0,
          },
        },
        {
          $sort: {
            lastMessageAt: -1,
          },
        },
      ])
      .toArray();

    const response: ApiResponse<any[]> = {
      success: true,
      data: conversations,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch conversations",
    });
  }
};

// Get messages for a conversation
export const getConversationMessages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const { conversationId } = req.params;
    const { page = "1", limit = "50" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversation ID",
      });
    }

    // Check if user is participant in conversation
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(conversationId),
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const messages = await db
      .collection("messages")
      .find({ conversationId: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db
      .collection("messages")
      .countDocuments({ conversationId: conversationId });

    // Mark messages as read
    await db.collection("messages").updateMany(
      {
        conversationId: conversationId,
        senderId: { $ne: userId },
        "readBy.userId": { $ne: userId },
      },
      {
        $push: {
          readBy: {
            userId: userId,
            readAt: new Date(),
          },
        } as any,
      },
    );

    const response: ApiResponse<{
      messages: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        messages: messages.reverse() as any[],
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
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
    });
  }
};

// Send a message
export const sendMessage: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const {
      conversationId,
      message,
      messageType = "text",
      propertyData,
    } = req.body;

    // Get user details
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    let finalConversationId = conversationId;

    // If no conversation ID, create new conversation
    if (!conversationId) {
      const { recipientId, propertyId } = req.body;

      if (!recipientId) {
        return res.status(400).json({
          success: false,
          error: "Recipient ID required for new conversation",
        });
      }

      // Check if conversation already exists
      const existingConversation = await db
        .collection("conversations")
        .findOne({
          participants: { $all: [userId, recipientId] },
          propertyId: propertyId || null,
        });

      if (existingConversation) {
        finalConversationId = existingConversation._id.toString();
      } else {
        // Create new conversation
        const newConversation: Omit<ChatConversation, "_id"> = {
          participants: [userId, recipientId],
          propertyId: propertyId || undefined,
          lastMessageAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const conversationResult = await db
          .collection("conversations")
          .insertOne(newConversation);
        finalConversationId = conversationResult.insertedId.toString();
      }
    }

    // Verify user is participant in conversation
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(finalConversationId),
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    // Create message
    const newMessage: Omit<ChatMessage, "_id"> = {
      conversationId: finalConversationId,
      senderId: userId,
      senderName: user.name,
      senderType: user.userType,
      message,
      messageType,
      propertyData,
      readBy: [
        {
          userId: userId,
          readAt: new Date(),
        },
      ] as any,
      createdAt: new Date(),
    };

    const messageResult = await db.collection("messages").insertOne(newMessage);

    // Update conversation last message
    await db.collection("conversations").updateOne(
      { _id: new ObjectId(finalConversationId) },
      {
        $set: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    const response: ApiResponse<{
      messageId: string;
      conversationId: string;
    }> = {
      success: true,
      data: {
        messageId: messageResult.insertedId.toString(),
        conversationId: finalConversationId,
      },
      message: "Message sent successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
};

// Start conversation with property owner
export const startPropertyConversation: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const { propertyId, message } = req.body;

    if (!ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID",
      });
    }

    // Get property details
    const property = await db
      .collection("properties")
      .findOne({ _id: new ObjectId(propertyId) });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    const ownerId = property.ownerId;

    if (ownerId === userId) {
      return res.status(400).json({
        success: false,
        error: "Cannot start conversation with yourself",
      });
    }

    // Check if conversation already exists
    const existingConversation = await db.collection("conversations").findOne({
      participants: { $all: [userId, ownerId] },
      propertyId: propertyId,
    });

    let conversationId;

    if (existingConversation) {
      conversationId = existingConversation._id.toString();
    } else {
      // Create new conversation
      const newConversation: Omit<ChatConversation, "_id"> = {
        participants: [userId, ownerId],
        propertyId: propertyId,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const conversationResult = await db
        .collection("conversations")
        .insertOne(newConversation);
      conversationId = conversationResult.insertedId.toString();
    }

    // Send initial message if provided
    if (message) {
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });

      const newMessage: Omit<ChatMessage, "_id"> = {
        conversationId: conversationId,
        senderId: userId,
        senderName: user?.name || "User",
        senderType: user?.userType || "buyer",
        message,
        messageType: "text",
        readBy: [
          {
            userId: userId,
            readAt: new Date(),
          },
        ] as any,
        createdAt: new Date(),
      };

      await db.collection("messages").insertOne(newMessage);

      // Update conversation
      await db.collection("conversations").updateOne(
        { _id: new ObjectId(conversationId) },
        {
          $set: {
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );
    }

    const response: ApiResponse<{ conversationId: string }> = {
      success: true,
      data: { conversationId },
      message: "Conversation started successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error starting conversation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start conversation",
    });
  }
};

// Get unread message count (optimized to avoid heavy aggregation)
export const getUnreadCount: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;

    // Get conversation IDs where the user is a participant
    const convs = await db
      .collection("conversations")
      .find({ participants: userId }, { projection: { _id: 1 } })
      .toArray();

    const convIds = convs.map((c: any) => c._id).filter(Boolean);

    if (convIds.length === 0) {
      const responseEmpty: ApiResponse<{ totalUnread: number }> = {
        success: true,
        data: { totalUnread: 0 },
      };
      return res.json(responseEmpty);
    }

    // Count messages that are not sent by user and which user hasn't read
    const filter: any = {
      conversationId: { $in: convIds },
      senderId: { $ne: userId },
      $or: [
        { readBy: { $exists: false } },
        { readBy: { $size: 0 } },
        { "readBy.userId": { $ne: userId } },
      ],
    };

    const totalUnread = await db.collection("messages").countDocuments(filter);

    const response: ApiResponse<{ totalUnread: number }> = {
      success: true,
      data: { totalUnread },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch unread count",
    });
  }
};
