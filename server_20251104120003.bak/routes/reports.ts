import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

export interface ReportReason {
  _id?: string;
  title: string;
  description: string;
  category: "property" | "user" | "review" | "general";
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserReport {
  _id?: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reportedUserId?: string;
  reportedUserName?: string;
  reportedPropertyId?: string;
  reportedPropertyTitle?: string;
  reasonId: string;
  reasonTitle: string;
  customReason?: string;
  description: string;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

// Get all report reasons (admin)
export const getAllReportReasons: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { category, active } = req.query;

    const filter: any = {};
    if (category && category !== "all") {
      filter.category = category;
    }
    if (active !== undefined) {
      filter.active = active === "true";
    }

    const reasons = await db
      .collection("report_reasons")
      .find(filter)
      .sort({ order: 1 })
      .toArray();

    const response: ApiResponse<ReportReason[]> = {
      success: true,
      data: reasons as ReportReason[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching report reasons:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch report reasons",
    });
  }
};

// Get public report reasons
export const getPublicReportReasons: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { category } = req.query;

    const filter: any = { active: true };
    if (category && category !== "all") {
      filter.category = category;
    }

    const reasons = await db
      .collection("report_reasons")
      .find(filter)
      .sort({ order: 1 })
      .toArray();

    const response: ApiResponse<ReportReason[]> = {
      success: true,
      data: reasons as ReportReason[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching public report reasons:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch report reasons",
    });
  }
};

// Create report reason (admin)
export const createReportReason: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { title, description, category, order = 999 } = req.body;

    const reason: Omit<ReportReason, "_id"> = {
      title,
      description,
      category,
      active: true,
      order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("report_reasons").insertOne(reason);

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating report reason:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create report reason",
    });
  }
};

// Update report reason (admin)
export const updateReportReason: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { reasonId } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    delete updateData._id;

    const result = await db
      .collection("report_reasons")
      .updateOne({ _id: new ObjectId(reasonId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Report reason not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Report reason updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating report reason:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update report reason",
    });
  }
};

// Delete report reason (admin)
export const deleteReportReason: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { reasonId } = req.params;

    // Check if reason is being used in reports
    const activeReports = await db
      .collection("user_reports")
      .countDocuments({ reasonId });

    if (activeReports > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete reason. It's used in ${activeReports} reports.`,
      });
    }

    const result = await db
      .collection("report_reasons")
      .deleteOne({ _id: new ObjectId(reasonId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Report reason not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Report reason deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting report reason:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete report reason",
    });
  }
};

// Get all user reports (admin)
export const getAllUserReports: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "20", status, priority, category } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (priority && priority !== "all") {
      filter.priority = priority;
    }

    const reports = await db
      .collection("user_reports")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("user_reports").countDocuments(filter);

    const response: ApiResponse<{
      reports: UserReport[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        reports: reports as UserReport[],
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
    console.error("Error fetching user reports:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user reports",
    });
  }
};

// Create user report
export const createUserReport: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      reportedUserId,
      reportedPropertyId,
      reasonId,
      customReason,
      description,
    } = req.body;

    // @ts-ignore - req.user is set by auth middleware
    const reporter = req.user;

    // Get reason details
    const reason = await db
      .collection("report_reasons")
      .findOne({ _id: new ObjectId(reasonId) });

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: "Invalid report reason",
      });
    }

    // Get reported user/property details
    let reportedUserName;
    let reportedPropertyTitle;

    if (reportedUserId) {
      const reportedUser = await db
        .collection("users")
        .findOne({ _id: new ObjectId(reportedUserId) });
      reportedUserName = reportedUser?.name;
    }

    if (reportedPropertyId) {
      const reportedProperty = await db
        .collection("properties")
        .findOne({ _id: new ObjectId(reportedPropertyId) });
      reportedPropertyTitle = reportedProperty?.title;
    }

    const report: Omit<UserReport, "_id"> = {
      reporterId: reporter._id,
      reporterName: reporter.name,
      reporterEmail: reporter.email,
      reportedUserId,
      reportedUserName,
      reportedPropertyId,
      reportedPropertyTitle,
      reasonId,
      reasonTitle: reason.title,
      customReason,
      description,
      status: "pending",
      priority: "medium",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("user_reports").insertOne(report);

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating user report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create user report",
    });
  }
};

// Update user report status (admin)
export const updateUserReportStatus: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { reportId } = req.params;
    const { status, priority, assignedTo, resolution } = req.body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (resolution) updateData.resolution = resolution;

    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    }

    const result = await db
      .collection("user_reports")
      .updateOne({ _id: new ObjectId(reportId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "User report not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "User report updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating user report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user report",
    });
  }
};

// Initialize default report reasons
export const initializeReportReasons: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Check if reasons already exist
    const existingCount = await db.collection("report_reasons").countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: "Report reasons already initialized",
      });
    }

    const defaultReasons: Omit<ReportReason, "_id">[] = [
      {
        title: "Spam or Misleading Content",
        description: "Property listing contains spam or misleading information",
        category: "property",
        active: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Inappropriate Photos",
        description: "Property photos are inappropriate or not related to the property",
        category: "property",
        active: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Fake Listing",
        description: "This appears to be a fake or duplicate property listing",
        category: "property",
        active: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Harassment",
        description: "User is engaging in harassment or inappropriate behavior",
        category: "user",
        active: true,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Fraud/Scam",
        description: "Suspected fraudulent activity or scam attempt",
        category: "user",
        active: true,
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Fake Review",
        description: "Review appears to be fake or manipulated",
        category: "review",
        active: true,
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Offensive Language",
        description: "Content contains offensive or inappropriate language",
        category: "general",
        active: true,
        order: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection("report_reasons").insertMany(defaultReasons);

    res.json({
      success: true,
      message: "Report reasons initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing report reasons:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize report reasons",
    });
  }
};
