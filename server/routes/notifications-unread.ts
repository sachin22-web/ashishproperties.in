import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";
import { ApiResponse } from "@shared/types";

export const getUnreadNotificationsCount: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userIdStr = (req as any).userId as string | undefined;
    const userType = (req as any).userType as string | undefined;

    if (!userIdStr) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const userId = new ObjectId(userIdStr);

    // Count unread user notifications
    const userNotifQuery = {
      userId,
      $or: [
        { readAt: null },
        { readAt: { $exists: false } },
        { read: { $ne: true } },
      ],
    } as any;

    const [userNotifsCount, sellerNotifsCount] = await Promise.all([
      db.collection("user_notifications").countDocuments(userNotifQuery),
      // Sellers/agents may also have admin notifications in unified notifications collection
      ["seller", "agent", "admin"].includes(String(userType || ""))
        ? db.collection("notifications").countDocuments({
            sellerId: userId,
            $or: [
              { isRead: { $ne: true } },
              { read: { $ne: true } },
              { readAt: null },
              { readAt: { $exists: false } },
            ],
          })
        : Promise.resolve(0 as unknown as number),
    ]);

    const response: ApiResponse<{ unread: number }> = {
      success: true,
      data: {
        unread: (userNotifsCount as number) + (sellerNotifsCount as number),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting unread notifications count:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get unread notifications count",
    });
  }
};
