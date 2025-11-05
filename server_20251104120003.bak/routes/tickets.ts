import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";

// Create a new ticket
export const createTicket: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const {
      subject,
      message,
      category = "general",
      priority = "medium",
    } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: "Subject and message are required",
      });
    }

    // Generate ticket number
    const ticketCount = await db.collection("tickets").countDocuments({});
    const ticketNumber = `TKT-${Date.now()}-${(ticketCount + 1).toString().padStart(4, "0")}`;

    const ticket = {
      ticketNumber,
      userId,
      subject,
      category,
      priority,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [
        {
          _id: new ObjectId(),
          senderId: userId,
          senderType: "user",
          message,
          createdAt: new Date(),
        },
      ],
    };

    const result = await db.collection("tickets").insertOne(ticket);

    // Get user details for response
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    res.status(201).json({
      success: true,
      data: {
        _id: result.insertedId,
        ticketNumber,
        subject,
        category,
        priority,
        status: "open",
        createdAt: ticket.createdAt,
        user: {
          name: user?.name || "Unknown",
          email: user?.email || "",
        },
      },
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create ticket",
    });
  }
};

// Get user's tickets
export const getUserTickets: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const tickets = await db
      .collection("tickets")
      .find({
        userId,
      })
      .sort({ updatedAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: tickets.map((ticket) => ({
        _id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        messageCount: ticket.messages?.length || 0,
        lastMessage: ticket.messages?.slice(-1)[0]?.message || "",
      })),
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tickets",
    });
  }
};

// Get all tickets (admin only)
export const getAllTickets: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { status, priority, category, page = "1", limit = "20" } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const tickets = await db
      .collection("tickets")
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            ticketNumber: 1,
            subject: 1,
            category: 1,
            priority: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            messageCount: { $size: { $ifNull: ["$messages", []] } },
            lastMessage: { $arrayElemAt: ["$messages.message", -1] },
            user: {
              name: "$user.name",
              email: "$user.email",
            },
          },
        },
        { $sort: { updatedAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
      ])
      .toArray();

    const total = await db.collection("tickets").countDocuments(filter);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching all tickets:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tickets",
    });
  }
};

// Get ticket messages
export const getTicketMessages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    const { ticketId } = req.params;

    if (!ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ticket ID",
      });
    }

    const filter: any = { _id: new ObjectId(ticketId) };

    // Non-admin users can only see their own tickets
    if (userRole !== "admin") {
      filter.userId = userId;
    }

    const ticket = await db.collection("tickets").findOne(filter);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });
    }

    // Get sender details for messages
    const messages = await Promise.all(
      (ticket.messages || []).map(async (msg: any) => {
        let senderName = "Unknown";

        if (msg.senderType === "user") {
          const user = await db
            .collection("users")
            .findOne({ _id: new ObjectId(msg.senderId) });
          senderName = user?.name || "User";
        } else if (msg.senderType === "admin") {
          const admin = await db
            .collection("users")
            .findOne({ _id: new ObjectId(msg.senderId) });
          senderName = admin?.name || "Support Team";
        }

        return {
          _id: msg._id,
          message: msg.message,
          senderType: msg.senderType,
          senderName,
          createdAt: msg.createdAt,
        };
      }),
    );

    res.json({
      success: true,
      data: {
        ticket: {
          _id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        },
        messages,
      },
    });
  } catch (error) {
    console.error("Error fetching ticket messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch ticket messages",
    });
  }
};

// Add message to ticket
export const addTicketMessage: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ticket ID",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const filter: any = { _id: new ObjectId(ticketId) };

    // Non-admin users can only reply to their own tickets
    if (userRole !== "admin") {
      filter.userId = userId;
    }

    const ticket = await db.collection("tickets").findOne(filter);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });
    }

    const newMessage = {
      _id: new ObjectId(),
      senderId: userId,
      senderType: userRole === "admin" ? "admin" : "user",
      message,
      createdAt: new Date(),
    };

    // Update ticket with new message and status
    const updateData: any = {
      $push: { messages: newMessage },
      $set: {
        updatedAt: new Date(),
        // Reopen ticket if user replies to closed ticket
        ...(userRole !== "admin" && ticket.status === "closed"
          ? { status: "open" }
          : {}),
      },
    };

    await db
      .collection("tickets")
      .updateOne({ _id: new ObjectId(ticketId) }, updateData);

    res.status(201).json({
      success: true,
      data: {
        _id: newMessage._id,
        message: newMessage.message,
        senderType: newMessage.senderType,
        createdAt: newMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Error adding ticket message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add message",
    });
  }
};

// Update ticket status (admin only)
export const updateTicketStatus: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { ticketId } = req.params;
    const { status, priority } = req.body;

    if (!ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ticket ID",
      });
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const result = await db
      .collection("tickets")
      .updateOne({ _id: new ObjectId(ticketId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });
    }

    res.json({
      success: true,
      message: "Ticket updated successfully",
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update ticket",
    });
  }
};
