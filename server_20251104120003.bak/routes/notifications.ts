import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

interface NotificationData {
  _id?: ObjectId;
  title: string;
  message: string;
  type: "email" | "push" | "both";
  audience: "all" | "buyers" | "sellers" | "agents" | "specific";
  specificUsers?: string[]; // Array of user IDs for specific targeting
  sentAt: Date;
  scheduledTime?: Date;
  recipientCount: number;
  deliveredCount: number;
  status: "sent" | "failed" | "pending" | "scheduled";
  createdBy: string;
  metadata?: {
    emailsSent?: number;
    pushNotificationsSent?: number;
    failedDeliveries?: number;
    errorDetails?: string[];
  };
}

// Get all notifications (admin only)
export const getAllNotifications: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "20", status, type } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (type && type !== "all") filter.type = type;

    const notifications = await db
      .collection("notifications")
      .find(filter)
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("notifications").countDocuments(filter);

    const response: ApiResponse<{
      notifications: NotificationData[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        notifications: notifications as NotificationData[],
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
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
    });
  }
};

// Send notification (admin only)
export const sendNotification: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { title, message, type, audience, specificUsers, scheduledTime } = req.body;
    const createdBy = (req as any).userId;

    console.log("📨 Sending notification:", { title, type, audience, specificUsers: specificUsers?.length });

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: "Title and message are required",
      });
    }

    // Get recipient users based on audience
    let recipients: any[] = [];
    let recipientFilter: any = {};

    if (audience === "specific" && specificUsers && specificUsers.length > 0) {
      // Specific users selected
      recipientFilter = { _id: { $in: specificUsers.map((id: string) => new ObjectId(id)) } };
    } else {
      // Audience-based targeting
      switch (audience) {
        case "buyers":
          recipientFilter = { userType: "buyer" };
          break;
        case "sellers":
          recipientFilter = { userType: "seller" };
          break;
        case "agents":
          recipientFilter = { userType: "agent" };
          break;
        case "all":
        default:
          recipientFilter = { userType: { $in: ["buyer", "seller", "agent"] } };
          break;
      }
    }

    // Get recipients
    recipients = await db
      .collection("users")
      .find(recipientFilter, { projection: { _id: 1, name: 1, email: 1, userType: 1 } })
      .toArray();

    console.log(`📊 Found ${recipients.length} recipients for audience: ${audience}`);

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No recipients found for the selected audience",
      });
    }

    // Create notification record
    const notificationData: Omit<NotificationData, "_id"> = {
      title,
      message,
      type,
      audience,
      specificUsers: audience === "specific" ? specificUsers : undefined,
      sentAt: scheduledTime ? new Date(scheduledTime) : new Date(),
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      recipientCount: recipients.length,
      deliveredCount: 0,
      status: scheduledTime ? "scheduled" : "pending",
      createdBy,
      metadata: {
        emailsSent: 0,
        pushNotificationsSent: 0,
        failedDeliveries: 0,
        errorDetails: [],
      },
    };

    const result = await db.collection("notifications").insertOne(notificationData);
    const notificationId = result.insertedId;

    // If not scheduled, send immediately
    if (!scheduledTime) {
      try {
        let emailsSent = 0;
        let pushNotificationsSent = 0;
        let failedDeliveries = 0;
        const errorDetails: string[] = [];

        // Send notifications to each recipient
        for (const recipient of recipients) {
          try {
            // Log the notification for tracking
            await db.collection("user_notifications").insertOne({
              notificationId,
              userId: recipient._id,
              title,
              message,
              type,
              sentAt: new Date(),
              readAt: null,
              status: "delivered",
              recipientInfo: {
                name: recipient.name,
                email: recipient.email,
                userType: recipient.userType,
              },
            });

            // Simulate email sending
            if (type === "email" || type === "both") {
              // In a real implementation, you would integrate with an email service
              // For now, we'll just log it
              console.log(`📧 Email sent to ${recipient.email}: ${title}`);
              emailsSent++;
            }

            // Simulate push notification sending
            if (type === "push" || type === "both") {
              // In a real implementation, you would integrate with a push notification service
              // For now, we'll just log it
              console.log(`🔔 Push notification sent to ${recipient.name}: ${title}`);
              pushNotificationsSent++;
            }
          } catch (recipientError) {
            console.error(`Failed to send to ${recipient.email}:`, recipientError);
            failedDeliveries++;
            errorDetails.push(`Failed to send to ${recipient.email}: ${recipientError}`);
          }
        }

        // Update notification with delivery results
        await db.collection("notifications").updateOne(
          { _id: notificationId },
          {
            $set: {
              deliveredCount: emailsSent + pushNotificationsSent,
              status: failedDeliveries === recipients.length ? "failed" : "sent",
              metadata: {
                emailsSent,
                pushNotificationsSent,
                failedDeliveries,
                errorDetails,
              },
            },
          }
        );

        console.log(`✅ Notification sent successfully: ${emailsSent + pushNotificationsSent} delivered, ${failedDeliveries} failed`);
      } catch (sendError) {
        console.error("Error sending notifications:", sendError);
        // Update notification status to failed
        await db.collection("notifications").updateOne(
          { _id: notificationId },
          {
            $set: {
              status: "failed",
              metadata: {
                emailsSent: 0,
                pushNotificationsSent: 0,
                failedDeliveries: recipients.length,
                errorDetails: [`Sending failed: ${sendError}`],
              },
            },
          }
        );
      }
    }

    const response: ApiResponse<{
      notificationId: string;
      recipientCount: number;
      status: string;
    }> = {
      success: true,
      data: {
        notificationId: notificationId.toString(),
        recipientCount: recipients.length,
        status: scheduledTime ? "scheduled" : "sent",
      },
      message: scheduledTime 
        ? `Notification scheduled for ${recipients.length} recipients`
        : `Notification sent to ${recipients.length} recipients`,
    };

    res.json(response);
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send notification",
    });
  }
};

// Get all users for specific targeting
export const getUsers: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { userType, search } = req.query;

    const filter: any = {};
    if (userType && userType !== "all") {
      filter.userType = userType;
    } else {
      filter.userType = { $in: ["buyer", "seller", "agent"] };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await db
      .collection("users")
      .find(filter, { 
        projection: { 
          _id: 1, 
          name: 1, 
          email: 1, 
          userType: 1,
          createdAt: 1 
        } 
      })
      .sort({ name: 1 })
      .limit(100) // Limit for performance
      .toArray();

    const response: ApiResponse<any[]> = {
      success: true,
      data: users,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
};

// Get notification details by ID
export const getNotificationById: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { notificationId } = req.params;

    if (!ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid notification ID",
      });
    }

    const notification = await db
      .collection("notifications")
      .findOne({ _id: new ObjectId(notificationId) });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    // Get delivery details
    const deliveryDetails = await db
      .collection("user_notifications")
      .find({ notificationId: new ObjectId(notificationId) })
      .toArray();

    const response: ApiResponse<{
      notification: NotificationData;
      deliveryDetails: any[];
    }> = {
      success: true,
      data: {
        notification: notification as NotificationData,
        deliveryDetails,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching notification details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notification details",
    });
  }
};

// Send welcome notification to new users (internal function)
export const sendWelcomeNotification = async (userId: string, userName: string, userType: string) => {
  try {
    console.log(`🎉 Sending welcome notification to new ${userType}: ${userName} (${userId})`);

    const db = getDatabase();

    // Create welcome notification specifically for this user
    const welcomeMessage = `Welcome to POSTTRR, ${userName}! 🏠 We're excited to have you join our property community. Start exploring properties and connect with verified ${userType === 'buyer' ? 'sellers' : 'buyers'} in your area.`;

    const notificationData: Omit<NotificationData, "_id"> = {
      title: `Welcome to POSTTRR! ���`,
      message: welcomeMessage,
      type: "both", // Send both email and push notification
      audience: "specific",
      specificUsers: [userId],
      sentAt: new Date(),
      recipientCount: 1,
      deliveredCount: 0,
      status: "sent",
      createdBy: "system", // System-generated notification
      metadata: {
        emailsSent: 0,
        pushNotificationsSent: 0,
        failedDeliveries: 0,
        errorDetails: [],
      },
    };

    // Insert notification record
    const result = await db.collection("notifications").insertOne(notificationData);
    const notificationId = result.insertedId;

    // Create user notification entry for dashboard display
    const userNotification = {
      userId: new ObjectId(userId),
      notificationId: notificationId,
      title: notificationData.title,
      message: notificationData.message,
      type: "welcome",
      delivered: true,
      read: false,
      deliveredAt: new Date(),
      createdAt: new Date(),
    };

    await db.collection("user_notifications").insertOne(userNotification);

    // Update notification as delivered
    await db.collection("notifications").updateOne(
      { _id: notificationId },
      {
        $set: {
          deliveredCount: 1,
          "metadata.emailsSent": 1,
          "metadata.pushNotificationsSent": 1,
        }
      }
    );

    console.log(`✅ Welcome notification sent successfully to ${userName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send welcome notification:`, error);
    return false;
  }
};

// Delete a notification by ID
export const deleteNotification: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid notification ID" });
    }

    // Delete from main notifications collection (if admin removes)
    await db.collection("notifications").deleteOne({ _id: new ObjectId(id) });

    // Also delete user-specific notification logs (if exist)
    await db.collection("user_notifications").deleteMany({ notificationId: new ObjectId(id) });

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete notification",
    });
  }
};




