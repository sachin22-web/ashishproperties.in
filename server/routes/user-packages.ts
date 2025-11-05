import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

export interface UserPackage {
  _id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  packageType: string;
  price: number;
  duration: number;
  startDate: Date;
  endDate: Date;
  status: "active" | "expired" | "cancelled" | "pending";
  autoRenewal: boolean;
  featuresUsed: {
    listings: number;
    maxListings: number;
    views: number;
    inquiries: number;
  };
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  createdAt: Date;
  updatedAt: Date;
}

// Get all user packages (admin)
export const getAllUserPackages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "20", status, packageType, userId } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (packageType && packageType !== "all") {
      filter.packageType = packageType;
    }
    if (userId) {
      filter.userId = userId;
    }

    const userPackages = await db
      .collection("user_packages")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("user_packages").countDocuments(filter);

    const response: ApiResponse<{
      userPackages: UserPackage[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        userPackages: userPackages as UserPackage[],
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
    console.error("Error fetching user packages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user packages",
    });
  }
};

// Get user packages for a specific user
export const getUserPackages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    // @ts-ignore - req.user is set by auth middleware
    const userId = req.user._id;

    const userPackages = await db
      .collection("user_packages")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<UserPackage[]> = {
      success: true,
      data: userPackages as UserPackage[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching user packages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user packages",
    });
  }
};

// Create user package subscription
export const createUserPackage: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { packageId, paymentId } = req.body;
    // @ts-ignore - req.user is set by auth middleware
    const user = req.user;

    // Get package details
    const package_ = await db
      .collection("ad_packages")
      .findOne({ _id: new ObjectId(packageId) });

    if (!package_) {
      return res.status(404).json({
        success: false,
        error: "Package not found",
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + package_.duration);

    const userPackage: Omit<UserPackage, "_id"> = {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      packageId: package_._id,
      packageName: package_.name,
      packageType: package_.type,
      price: package_.price,
      duration: package_.duration,
      startDate,
      endDate,
      status: "active",
      autoRenewal: false,
      featuresUsed: {
        listings: 0,
        maxListings: package_.maxListings || 999,
        views: 0,
        inquiries: 0,
      },
      paymentStatus: package_.price === 0 ? "paid" : "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("user_packages").insertOne(userPackage);

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating user package:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create user package",
    });
  }
};

// Update user package status (admin)
export const updateUserPackageStatus: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { packageId } = req.params;
    const { status, autoRenewal, paymentStatus } = req.body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (autoRenewal !== undefined) updateData.autoRenewal = autoRenewal;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const result = await db
      .collection("user_packages")
      .updateOne({ _id: new ObjectId(packageId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "User package not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "User package updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating user package:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user package",
    });
  }
};

// Update package usage stats
export const updatePackageUsage: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { packageId } = req.params;
    const { listings, views, inquiries } = req.body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (listings !== undefined) updateData["featuresUsed.listings"] = listings;
    if (views !== undefined) updateData["featuresUsed.views"] = views;
    if (inquiries !== undefined) updateData["featuresUsed.inquiries"] = inquiries;

    const result = await db
      .collection("user_packages")
      .updateOne({ _id: new ObjectId(packageId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "User package not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Package usage updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating package usage:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update package usage",
    });
  }
};

// Cancel user package
export const cancelUserPackage: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { packageId } = req.params;

    const result = await db
      .collection("user_packages")
      .updateOne(
        { _id: new ObjectId(packageId) },
        { 
          $set: { 
            status: "cancelled",
            autoRenewal: false,
            updatedAt: new Date()
          }
        }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "User package not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "User package cancelled successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error cancelling user package:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel user package",
    });
  }
};

// Get package statistics
export const getPackageStats: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const stats = await db
      .collection("user_packages")
      .aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            revenue: { $sum: "$price" },
          },
        },
      ])
      .toArray();

    const totalSubscriptions = await db.collection("user_packages").countDocuments();
    const activeSubscriptions = await db.collection("user_packages").countDocuments({ status: "active" });
    const totalRevenue = await db
      .collection("user_packages")
      .aggregate([{ $group: { _id: null, total: { $sum: "$price" } } }])
      .toArray();

    // Get packages expiring in the next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const expiringThisWeek = await db
      .collection("user_packages")
      .countDocuments({
        status: "active",
        endDate: { $lte: nextWeek, $gte: new Date() }
      });

    const response: ApiResponse<{
      totalSubscriptions: number;
      activeSubscriptions: number;
      totalRevenue: number;
      expiringThisWeek: number;
      statusBreakdown: any[];
    }> = {
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        totalRevenue: totalRevenue[0]?.total || 0,
        expiringThisWeek,
        statusBreakdown: stats,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching package stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch package statistics",
    });
  }
};
