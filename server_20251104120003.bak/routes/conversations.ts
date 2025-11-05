// server/routes/conversations.ts
import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";
import { ApiResponse } from "@shared/types";
import { getSocketServer } from "../index";

/* ------------------------ Helpers ------------------------ */

const messageRateMap: Map<string, number[]> = new Map();
const now = () => Date.now();
const WINDOW_MS = 30 * 1000; // 30s
const MAX_MSGS = 10; // 10 messages / 30s

function canSend(userId: string): boolean {
  const ts = now();
  const arr = messageRateMap.get(userId) || [];
  const filtered = arr.filter((t) => ts - t < WINDOW_MS);
  if (filtered.length >= MAX_MSGS) return false;
  filtered.push(ts);
  messageRateMap.set(userId, filtered);
  return true;
}

function sanitizeText(input?: string): string {
  if (!input) return "";
  const noTags = input.replace(/<[^>]*>/g, "");
  return noTags.trim().slice(0, 2000);
}

function isHexObjectId(v: any): boolean {
  return typeof v === "string" && /^[a-f\d]{24}$/i.test(v);
}

function toObjectIdOrNull(v: any): ObjectId | null {
  try {
    if (v instanceof ObjectId) return v;
    if (isHexObjectId(v)) return new ObjectId(v);
    return null;
  } catch {
    return null;
  }
}

/* =========================================================
   POST /conversations/find-or-create
   Find existing or create new conversation for a property
   ========================================================= */
export const findOrCreateConversation: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const buyerId = (req as any).userId as string;
    const { propertyId } = req.body as { propertyId?: string };

    if (!buyerId) {
      return res.status(401).json({ success: false, error: "Auth required" });
    }
    if (!propertyId || !ObjectId.isValid(propertyId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid property ID" });
    }

    const property = await db
      .collection("properties")
      .findOne({ _id: new ObjectId(propertyId) });

    if (!property) {
      return res.status(404).json({ success: false, error: "Property not found" });
    }

    // Resolve seller/owner from multiple possible fields
    const resolvedOwner =
      property.owner ??
      property.seller ??
      property.postedBy ??
      property.user ??
      property.createdBy ??
      property.ownerId ??
      property.sellerId;

    if (!resolvedOwner) {
      return res
        .status(400)
        .json({ success: false, error: "Property has no owner" });
    }

    const sellerIdStr =
      typeof resolvedOwner === "string"
        ? resolvedOwner
        : resolvedOwner?.toString?.() ?? String(resolvedOwner);

    if (sellerIdStr === buyerId) {
      return res
        .status(400)
        .json({ success: false, error: "Cannot create conversation with yourself" });
    }

    // Try existing by normalized schema (property as ObjectId, buyer/seller as strings)
    const existingConversation = await db.collection("conversations").findOne({
      property: new ObjectId(propertyId),
      buyer: buyerId,
      seller: sellerIdStr,
    });

    if (existingConversation) {
      return res.json({ success: true, data: { _id: existingConversation._id } });
    }

    // Create new conversation
    const newConversation = {
      property: new ObjectId(propertyId),
      propertyId, // legacy-friendly
      buyer: buyerId,
      seller: sellerIdStr,
      participants: Array.from(new Set([buyerId, sellerIdStr])),
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("conversations").insertOne(newConversation);

    const response: ApiResponse<any> = {
      success: true,
      data: { _id: result.insertedId },
    };
    return res.status(201).json(response);
  } catch (error) {
    console.error("Error finding/creating conversation:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to find or create conversation",
    });
  }
};

/* =======================================
   POST /conversations
   Create new conversation (explicit)
   ======================================= */
export const createConversation: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId as string;
    const { propertyId, participants, ownerId } = req.body as {
      propertyId?: string;
      participants?: string[];
      ownerId?: string;
    };

    if (!userId) {
      return res.status(401).json({ success: false, error: "Auth required" });
    }
    if (!propertyId || !ObjectId.isValid(propertyId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid property ID" });
    }

    const property = await db
      .collection("properties")
      .findOne({ _id: new ObjectId(propertyId) });

    if (!property) {
      return res.status(404).json({ success: false, error: "Property not found" });
    }

    const resolvedOwner =
      property.owner ??
      property.seller ??
      property.postedBy ??
      property.user ??
      property.createdBy ??
      property.ownerId ??
      property.sellerId;

    const sellerId =
      typeof resolvedOwner === "string"
        ? resolvedOwner
        : resolvedOwner?.toString?.() ?? String(resolvedOwner);

    if (ownerId && ownerId !== sellerId) {
      return res
        .status(400)
        .json({ success: false, error: "ownerId does not match property owner" });
    }

    const allParticipants =
      Array.isArray(participants) && participants.length
        ? Array.from(new Set([userId, ...participants]))
        : Array.from(new Set([userId, sellerId]));

    // Try existing by either normalized or legacy shape
    const existingConversation = await db.collection("conversations").findOne({
      $or: [
        { property: new ObjectId(propertyId), buyer: userId, seller: sellerId },
        { propertyId: propertyId, participants: { $all: allParticipants } },
      ],
    });

    if (existingConversation) {
      return res.json({ success: true, data: { _id: existingConversation._id } });
    }

    const newConversation = {
      property: new ObjectId(propertyId),
      propertyId,
      buyer: userId,
      seller: sellerId,
      participants: allParticipants,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("conversations").insertOne(newConversation);

    const response: ApiResponse<any> = {
      success: true,
      data: { _id: result.insertedId },
    };
    return res.status(201).json(response);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create conversation",
    });
  }
};

/* =========================================================
   GET /conversations/my
   User's conversations (hydrated safely)
   ========================================================= */
export const getMyConversations: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId as string;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Auth required" });
    }

    // Pull raw conversations first (avoid brittle $toObjectId pipelines)
    const rawConversations = await db
      .collection("conversations")
      .find({
        $or: [{ buyer: userId }, { seller: userId }, { participants: userId }],
      })
      .sort({ lastMessageAt: -1 })
      .toArray();

    // Collect propertyIds and userIds for hydration
    const propertyIds = Array.from(
      new Set(
        rawConversations
          .map((c: any) => c.property)
          .map((p: any) => (p instanceof ObjectId ? p : toObjectIdOrNull(p)))
          .filter(Boolean) as ObjectId[],
      ),
    );

    const userIdSet = new Set<string>();
    for (const c of rawConversations) {
      if (typeof c.buyer === "string") userIdSet.add(c.buyer);
      if (typeof c.seller === "string") userIdSet.add(c.seller);
      if (Array.isArray(c.participants)) {
        for (const p of c.participants) if (typeof p === "string") userIdSet.add(p);
      }
    }
    const userIds = Array.from(userIdSet);

    // Fetch properties & users in bulk
    const properties = propertyIds.length
      ? await db
          .collection("properties")
          .find({ _id: { $in: propertyIds } })
          .toArray()
      : [];

    // Try both _id as ObjectId and string (for legacy users stored as strings)
    const userObjIds = userIds.map(toObjectIdOrNull).filter(Boolean) as ObjectId[];
    const usersByObjId = userObjIds.length
      ? await db.collection("users").find({ _id: { $in: userObjIds } }).toArray()
      : [];
    const usersByStringId = userIds.length
      ? await db.collection("users").find({ _id: { $in: userIds as any } }).toArray()
      : [];

    const userMap = new Map<string, any>();
    for (const u of usersByObjId) userMap.set(String(u._id), u);
    for (const u of usersByStringId) userMap.set(String(u._id), u);

    // Fetch last messages (optional): get last message per conversation
    const convoIds = rawConversations.map((c: any) => c._id as ObjectId);
    const lastMsgs = await db
      .collection("messages")
      .aggregate([
        { $match: { conversationId: { $in: convoIds } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$conversationId",
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$senderId", userId] },
                      {
                        $not: {
                          $in: [
                            userId,
                            {
                              $map: {
                                input: { $ifNull: ["$readBy", []] },
                                as: "r",
                                in: "$$r.userId",
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
      .toArray();

    const lastMap = new Map<string, any>();
    for (const lm of lastMsgs) lastMap.set(String(lm._id), lm);

    // Hydrate conversations
    const conversations = rawConversations.map((c: any) => {
      const prop = properties.find((p) => String(p._id) === String(c.property));
      const buyerData = c.buyer ? userMap.get(String(c.buyer)) ?? null : null;
      const sellerData = c.seller ? userMap.get(String(c.seller)) ?? null : null;

      const lm = lastMap.get(String(c._id));
      const lastMessage = lm?.lastMessage ?? c.lastMessage ?? null;
      const unreadCount = lm?.unreadCount ?? 0;

      return {
        _id: c._id,
        buyer: c.buyer,
        seller: c.seller,
        participants: c.participants,
        createdAt: c.createdAt,
        lastMessageAt: c.lastMessageAt,
        property: prop ?? null,
        buyerData,
        sellerData,
        lastMessage,
        unreadCount,
      };
    });

    const response: ApiResponse<any[]> = { success: true, data: conversations };
    return res.json(response);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch conversations",
    });
  }
};

/* =========================================================
   GET /conversations/:id/messages
   Paginated messages for a conversation
   ========================================================= */
export const getConversationMessages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId as string;
    const { id } = req.params as { id: string };
    const { limit = "50", cursor } = req.query as any;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Auth required" });
    }
    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid conversation ID" });
    }
    const convoId = new ObjectId(id);

    // Must be participant
    const conversation = await db.collection("conversations").findOne({
      _id: convoId,
      $or: [{ buyer: userId }, { seller: userId }, { participants: userId }],
    });
    if (!conversation) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const q: any = { conversationId: convoId };
    if (cursor) {
      const d = new Date(String(cursor));
      if (!isNaN(d.getTime())) q.createdAt = { $lt: d };
    }

    const limitNum = Math.max(1, Math.min(parseInt(String(limit)) || 50, 100));
    const messages = await db
      .collection("messages")
      .find(q)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .toArray();

    // Mark as read (for messages not by current user)
    await db.collection("messages").updateMany(
      {
        conversationId: convoId,
        senderId: { $ne: userId },
        "readBy.userId": { $ne: userId },
      },
      { $push: { readBy: { userId, readAt: new Date() } } },
    );

    const response: ApiResponse<any[]> = {
      success: true,
      data: messages.reverse(), // chronological (old -> new)
    };
    return res.json(response);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
    });
  }
};

/* =========================================================
   POST /conversations/:id/messages
   Send a new message
   ========================================================= */
export const sendMessageToConversation: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId as string;
    const { id } = req.params as { id: string };
    const { text, imageUrl } = req.body as { text?: string; imageUrl?: string };

    if (!userId) {
      return res.status(401).json({ success: false, error: "Auth required" });
    }
    if (!text && !imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Either text or imageUrl is required",
      });
    }
    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid conversation ID" });
    }
    if (!canSend(userId)) {
      return res
        .status(429)
        .json({ success: false, error: "Too many messages. Please wait a moment." });
    }

    const convoId = new ObjectId(id);

    const conversation = await db.collection("conversations").findOne({
      _id: convoId,
      $or: [{ buyer: userId }, { seller: userId }, { participants: userId }],
    });
    if (!conversation) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    // Load user (works for both string and ObjectId _id schemas)
    const user =
      (await db
        .collection("users")
        .findOne({ _id: toObjectIdOrNull(userId) as any })) ||
      (await db.collection("users").findOne({ _id: userId as any }));

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const safeText = sanitizeText(text);

    const newMessage = {
      conversationId: convoId, // ✅ ObjectId
      sender: userId, // legacy
      senderId: userId, // normalized string
      senderName: user.name ?? "User",
      senderType: user.userType ?? (conversation.seller === userId ? "owner" : "buyer"),
      text: safeText,
      message: safeText, // legacy compatibility
      imageUrl: imageUrl || null,
      messageType: imageUrl ? "image" : "text",
      readBy: [{ userId, readAt: new Date() }],
      createdAt: new Date(),
    };

    const messageResult = await db.collection("messages").insertOne(newMessage);

    await db.collection("conversations").updateOne(
      { _id: convoId },
      {
        $set: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
          lastMessage: {
            text: newMessage.text,
            senderId: userId,
            createdAt: newMessage.createdAt,
          },
        },
      },
    );

    // Real-time push (if socket server available)
    try {
      const socketServer = getSocketServer?.();
      if (socketServer) {
        socketServer.emitNewMessage?.(conversation, {
          ...newMessage,
          _id: messageResult.insertedId,
        });
      }
    } catch (e) {
      console.warn("Socket emit failed (non-blocking):", (e as any)?.message || e);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: { _id: messageResult.insertedId, ...newMessage },
    };
    return res.status(201).json(response);
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
};

/* =========================================================
   POST /conversations/:id/read
   Mark all as read for current user
   ========================================================= */
export const markConversationRead: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId as string;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({ success: false, error: "Auth required" });
    }
    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid conversation ID" });
    }
    const convoId = new ObjectId(id);

    const conversation = await db.collection("conversations").findOne({
      _id: convoId,
      $or: [{ buyer: userId }, { seller: userId }, { participants: userId }],
    });
    if (!conversation) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    await db.collection("messages").updateMany(
      {
        conversationId: convoId,
        senderId: { $ne: userId },
        "readBy.userId": { $ne: userId },
      },
      { $push: { readBy: { userId, readAt: new Date() } } },
    );

    return res.json({ success: true, data: { conversationId: id } });
  } catch (error) {
    console.error("Error marking conversation read:", error);
    return res.status(500).json({ success: false, error: "Failed to mark as read" });
  }
};
