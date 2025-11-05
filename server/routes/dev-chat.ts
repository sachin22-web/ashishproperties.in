import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";
import type { RequestHandler } from "express";

export const seedChatData: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Create users
    const owner =
      (await db.collection("users").findOne({ email: "owner@test.com" })) ||
      (
        await db
          .collection("users")
          .insertOne({
            name: "Owner",
            email: "owner@test.com",
            userType: "seller",
            createdAt: new Date(),
          })
      ).ops?.[0];

    const buyer =
      (await db.collection("users").findOne({ email: "buyer@test.com" })) ||
      (
        await db
          .collection("users")
          .insertOne({
            name: "Buyer",
            email: "buyer@test.com",
            userType: "buyer",
            createdAt: new Date(),
          })
      ).ops?.[0];

    // Ensure we have proper docs
    const ownerId =
      owner?._id ||
      (await db.collection("users").findOne({ email: "owner@test.com" }))._id;
    const buyerId =
      buyer?._id ||
      (await db.collection("users").findOne({ email: "buyer@test.com" }))._id;

    // Create property
    const property =
      (await db
        .collection("properties")
        .findOne({ title: "Sample Seed Property" })) ||
      (
        await db.collection("properties").insertOne({
          title: "Sample Seed Property",
          price: 2500000,
          images: [],
          location: { address: "Test Address" },
          owner: ownerId,
          createdAt: new Date(),
        })
      ).ops?.[0];

    const propertyId =
      property?._id ||
      (
        await db
          .collection("properties")
          .findOne({ title: "Sample Seed Property" })
      )._id;

    // Create conversation
    let conversation = await db
      .collection("conversations")
      .findOne({
        property: propertyId,
        buyer: buyerId.toString(),
        seller: ownerId.toString(),
      });
    if (!conversation) {
      const result = await db.collection("conversations").insertOne({
        property: propertyId,
        buyer: buyerId.toString(),
        seller: ownerId.toString(),
        participants: [buyerId.toString(), ownerId.toString()],
        createdAt: new Date(),
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      });
      conversation = { _id: result.insertedId } as any;
    }

    // Seed messages
    await db.collection("messages").insertOne({
      conversationId: conversation._id.toString(),
      sender: buyerId.toString(),
      senderId: buyerId.toString(),
      senderName: "Buyer",
      senderType: "buyer",
      text: "Hello from buyer",
      message: "Hello from buyer",
      createdAt: new Date(),
      readBy: [{ userId: buyerId.toString(), readAt: new Date() }],
    });

    await db.collection("messages").insertOne({
      conversationId: conversation._id.toString(),
      sender: ownerId.toString(),
      senderId: ownerId.toString(),
      senderName: "Owner",
      senderType: "seller",
      text: "Hi from owner",
      message: "Hi from owner",
      createdAt: new Date(),
      readBy: [{ userId: ownerId.toString(), readAt: new Date() }],
    });

    const buyerConvCount = await db
      .collection("conversations")
      .countDocuments({ buyer: buyerId.toString() });
    const ownerConvCount = await db
      .collection("conversations")
      .countDocuments({ seller: ownerId.toString() });

    res.json({
      ok: true,
      conversationId: conversation._id.toString(),
      buyerConvCount,
      ownerConvCount,
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const replyAsOwner: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { conversationId } = req.params as any;
    if (!ObjectId.isValid(conversationId)) {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid conversation ID" });
    }

    const conv = await db
      .collection("conversations")
      .findOne({ _id: new ObjectId(conversationId) });
    if (!conv)
      return res
        .status(404)
        .json({ ok: false, error: "Conversation not found" });

    const sellerId = conv.seller;
    const seller = await db.collection("users").findOne({ _id: sellerId });

    const message = {
      conversationId,
      sender: sellerId,
      senderId: sellerId,
      senderName: seller?.name || "Owner",
      senderType: "seller",
      text: "pong",
      message: "pong",
      createdAt: new Date(),
      readBy: [{ userId: sellerId, readAt: new Date() }],
    } as any;

    const result = await db.collection("messages").insertOne(message);
    await db
      .collection("conversations")
      .updateOne(
        { _id: new ObjectId(conversationId) },
        { $set: { lastMessageAt: new Date() } },
      );

    res.json({ ok: true, messageId: result.insertedId.toString() });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
