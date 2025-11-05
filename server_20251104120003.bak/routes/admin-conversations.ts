import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";
import { ApiResponse } from "@shared/types";
import { getSocketServer } from "../index";

// GET /admin/conversations - Admin support inbox to see all conversations
export const getAdminConversations: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "20", status, propertyId } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter for new schema
    const filter: any = {};
    if (propertyId) {
      filter.property = new ObjectId(propertyId as string);
    }

    const conversations = await db
      .collection("conversations")
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "properties",
            localField: "property",
            foreignField: "_id",
            as: "propertyData",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "buyer",
            foreignField: "_id",
            as: "buyerData",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "seller",
            foreignField: "_id",
            as: "sellerData",
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
            messageCount: { $size: "$messages" },
            hasUnreadAdminMessages: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$messages",
                      cond: {
                        $and: [
                          { $ne: ["$$this.senderType", "admin"] },
                          {
                            $not: {
                              $in: [
                                "admin",
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
                0,
              ],
            },
          },
        },
        {
          $project: {
            buyer: 1,
            seller: 1,
            property: 1,
            createdAt: 1,
            lastMessageAt: 1,
            propertyData: { $arrayElemAt: ["$propertyData", 0] },
            buyerData: { $arrayElemAt: ["$buyerData", 0] },
            sellerData: { $arrayElemAt: ["$sellerData", 0] },
            lastMessage: 1,
            messageCount: 1,
            hasUnreadAdminMessages: 1,
          },
        },
        {
          $sort: { lastMessageAt: -1 },
        },
        { $skip: skip },
        { $limit: limitNum },
      ])
      .toArray();

    const total = await db.collection("conversations").countDocuments(filter);

    const response: ApiResponse<{
      conversations: any[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      success: true,
      data: {
        conversations,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching admin conversations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch conversations",
    });
  }
};

// POST /admin/conversations/:id/messages - Admin reply to conversation
export const adminReplyToConversation: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const adminId = (req as any).userId;
    const { id } = req.params;
    const { text, imageUrl } = req.body;

    if (!text && !imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Either text or imageUrl is required",
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversation ID",
      });
    }

    // Check if conversation exists
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(id),
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    // Get admin details
    const admin = await db.collection("users").findOne({ _id: adminId });
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: "Admin user not found",
      });
    }

    // Create admin message
    const newMessage = {
      conversationId: id,
      senderId: adminId,
      senderName: admin.name || "Admin",
      senderType: "admin",
      message: text || "",
      imageUrl: imageUrl || null,
      messageType: imageUrl ? "image" : "text",
      readBy: [
        {
          userId: adminId,
          readAt: new Date(),
        },
      ],
      createdAt: new Date(),
    };

    const messageResult = await db.collection("messages").insertOne(newMessage);

    // Update conversation last message timestamp
    await db.collection("conversations").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    // Emit real-time message via Socket.io
    const socketServer = getSocketServer();
    if (socketServer) {
      const messageWithId = {
        ...newMessage,
        _id: messageResult.insertedId,
        text: newMessage.message,
        sender: newMessage.senderId,
      };
      socketServer.emitNewMessage(conversation, messageWithId);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        _id: messageResult.insertedId,
        ...newMessage,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error sending admin message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
};

// GET /admin/conversations/stats - Get conversation statistics for admin
export const getAdminConversationStats: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const stats = await db
      .collection("conversations")
      .aggregate([
        {
          $facet: {
            totalConversations: [{ $count: "count" }],
            conversationsToday: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  },
                },
              },
              { $count: "count" },
            ],
            conversationsThisWeek: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  },
                },
              },
              { $count: "count" },
            ],
            activeConversations: [
              {
                $match: {
                  lastMessageAt: {
                    $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                  },
                },
              },
              { $count: "count" },
            ],
          },
        },
      ])
      .toArray();

    const result = stats[0];
    const response: ApiResponse<any> = {
      success: true,
      data: {
        totalConversations: result.totalConversations[0]?.count || 0,
        conversationsToday: result.conversationsToday[0]?.count || 0,
        conversationsThisWeek: result.conversationsThisWeek[0]?.count || 0,
        activeConversations: result.activeConversations[0]?.count || 0,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching admin conversation stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
};

// PUT /admin/conversations/:id/status - Update conversation status (close, open, etc.)
export const updateConversationStatus: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversation ID",
      });
    }

    if (!["open", "closed", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: open, closed, or pending",
      });
    }

    const result = await db.collection("conversations").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: status,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: `Conversation status updated to ${status}` },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating conversation status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update conversation status",
    });
  }
};
