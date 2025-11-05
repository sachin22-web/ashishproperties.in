import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { PropertyAnalytics, ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

// Track property view
export const trackPropertyView: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyId } = req.params;
    const userId = (req as any).userId;

    // Validate property ID
    if (!ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID",
      });
    }

    // Update property view count
    await db.collection("properties").updateOne(
      { _id: new ObjectId(propertyId) },
      {
        $inc: { views: 1 },
        $set: { updatedAt: new Date() },
      },
    );

    // Track in analytics collection
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.collection("property_analytics").updateOne(
      {
        propertyId,
        date: today,
      },
      {
        $inc: { views: 1 },
        $set: { lastViewed: new Date() },
        $setOnInsert: {
          inquiries: 0,
          favorites: 0,
          phoneClicks: 0,
        },
      },
      { upsert: true },
    );

    // Track user view if authenticated
    if (userId) {
      await db.collection("user_property_views").updateOne(
        {
          userId,
          propertyId,
        },
        {
          $set: {
            lastViewed: new Date(),
          },
          $inc: { viewCount: 1 },
        },
        { upsert: true },
      );
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "View tracked successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error tracking view:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track view",
    });
  }
};

// Track property inquiry
export const trackPropertyInquiry: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyId } = req.params;
    const userId = (req as any).userId;

    // Validate property ID
    if (!ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID",
      });
    }

    // Update property inquiry count
    await db.collection("properties").updateOne(
      { _id: new ObjectId(propertyId) },
      {
        $inc: { inquiries: 1 },
        $set: { updatedAt: new Date() },
      },
    );

    // Track in analytics collection
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.collection("property_analytics").updateOne(
      {
        propertyId,
        date: today,
      },
      {
        $inc: { inquiries: 1 },
        $set: { lastViewed: new Date() },
        $setOnInsert: {
          views: 0,
          favorites: 0,
          phoneClicks: 0,
        },
      },
      { upsert: true },
    );

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Inquiry tracked successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error tracking inquiry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track inquiry",
    });
  }
};

// Track phone click
export const trackPhoneClick: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyId } = req.params;

    // Validate property ID
    if (!ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID",
      });
    }

    // Track in analytics collection
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.collection("property_analytics").updateOne(
      {
        propertyId,
        date: today,
      },
      {
        $inc: { phoneClicks: 1 },
        $set: { lastViewed: new Date() },
        $setOnInsert: {
          views: 0,
          inquiries: 0,
          favorites: 0,
        },
      },
      { upsert: true },
    );

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Phone click tracked successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error tracking phone click:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track phone click",
    });
  }
};

// Get property analytics for owner
export const getPropertyAnalytics: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyId } = req.params;
    const userId = (req as any).userId;
    const { days = "30" } = req.query;

    // Validate property ID
    if (!ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID",
      });
    }

    // Verify property ownership
    const property = await db.collection("properties").findOne({
      _id: new ObjectId(propertyId),
      ownerId: userId,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found or access denied",
      });
    }

    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get daily analytics
    const dailyAnalytics = await db
      .collection("property_analytics")
      .find({
        propertyId,
        date: { $gte: startDate },
      })
      .sort({ date: 1 })
      .toArray();

    // Get total analytics
    const totalAnalytics = await db
      .collection("property_analytics")
      .aggregate([
        { $match: { propertyId } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" },
            totalInquiries: { $sum: "$inquiries" },
            totalFavorites: { $sum: "$favorites" },
            totalPhoneClicks: { $sum: "$phoneClicks" },
          },
        },
      ])
      .toArray();

    const response: ApiResponse<{
      property: any;
      daily: any[];
      totals: any;
    }> = {
      success: true,
      data: {
        property,
        daily: dailyAnalytics,
        totals: totalAnalytics[0] || {
          totalViews: 0,
          totalInquiries: 0,
          totalFavorites: 0,
          totalPhoneClicks: 0,
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch analytics",
    });
  }
};

// Get seller dashboard analytics
export const getSellerAnalytics: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const { days = "30" } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Get seller properties
    const properties = await db
      .collection("properties")
      .find({ ownerId: userId })
      .toArray();

    const propertyIds = properties.map((p) => p._id.toString());

    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get aggregated analytics for all properties
    const analytics = await db
      .collection("property_analytics")
      .aggregate([
        {
          $match: {
            propertyId: { $in: propertyIds },
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$propertyId",
            totalViews: { $sum: "$views" },
            totalInquiries: { $sum: "$inquiries" },
            totalFavorites: { $sum: "$favorites" },
            totalPhoneClicks: { $sum: "$phoneClicks" },
            lastActivity: { $max: "$lastViewed" },
          },
        },
      ])
      .toArray();

    // Get overall totals
    const totals = await db
      .collection("property_analytics")
      .aggregate([
        { $match: { propertyId: { $in: propertyIds } } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" },
            totalInquiries: { $sum: "$inquiries" },
            totalFavorites: { $sum: "$favorites" },
            totalPhoneClicks: { $sum: "$phoneClicks" },
          },
        },
      ])
      .toArray();

    const response: ApiResponse<{
      properties: any[];
      analytics: any[];
      totals: any;
    }> = {
      success: true,
      data: {
        properties,
        analytics,
        totals: totals[0] || {
          totalViews: 0,
          totalInquiries: 0,
          totalFavorites: 0,
          totalPhoneClicks: 0,
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching seller analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch seller analytics",
    });
  }
};

// Get admin analytics overview
export const getAdminAnalytics: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { days = "30" } = req.query;

    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get overall platform analytics
    const platformAnalytics = await db
      .collection("property_analytics")
      .aggregate([
        { $match: { date: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" },
            },
            dailyViews: { $sum: "$views" },
            dailyInquiries: { $sum: "$inquiries" },
            dailyPhoneClicks: { $sum: "$phoneClicks" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ])
      .toArray();

    // Get top performing properties
    const topProperties = await db
      .collection("property_analytics")
      .aggregate([
        { $match: { date: { $gte: startDate } } },
        {
          $group: {
            _id: "$propertyId",
            totalViews: { $sum: "$views" },
            totalInquiries: { $sum: "$inquiries" },
            totalPhoneClicks: { $sum: "$phoneClicks" },
          },
        },
        { $sort: { totalViews: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "properties",
            localField: "_id",
            foreignField: "_id",
            as: "property",
          },
        },
      ])
      .toArray();

    // Get user activity stats
    const userStats = await db
      .collection("user_property_views")
      .aggregate([
        {
          $group: {
            _id: "$userId",
            totalViews: { $sum: "$viewCount" },
            lastActivity: { $max: "$lastViewed" },
          },
        },
        { $sort: { totalViews: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
      ])
      .toArray();

    const response: ApiResponse<{
      daily: any[];
      topProperties: any[];
      topUsers: any[];
    }> = {
      success: true,
      data: {
        daily: platformAnalytics,
        topProperties,
        topUsers: userStats,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin analytics",
    });
  }
};
