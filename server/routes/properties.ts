// server/routes/properties.ts
import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { Property, ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";

/* ========================= Multer (image uploads) ========================= */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads", "properties");
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req: any, file, cb: FileFilterCallback) => {
    if (file.mimetype?.startsWith?.("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

/* ========================= Public: List properties ========================= */
/** Only show ACTIVE + APPROVED on public listing */
export const getProperties: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      propertyType,
      subCategory,
      priceType,
      category,
      sector,
      mohalla,
      landmark,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      minArea,
      maxArea,
      sortBy = "date_desc",
      page = "1",
      limit = "20",
    } = req.query;

    const filter: any = {
      status: "active",
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: { $exists: false } },
      ],
    };

    // Support filtering by category (buy, rent, commercial, etc.)
    if (category) {
      const categoryStr = String(category).toLowerCase();
      switch (categoryStr) {
        case "buy":
          // Both residential and plot types for sale
          filter.$or = [
            { propertyType: "residential", priceType: "sale" },
            { propertyType: "plot", priceType: "sale" },
          ];
          break;
        case "rent":
          // Residential for rent
          filter.propertyType = "residential";
          filter.priceType = "rent";
          break;
        case "commercial":
          // Commercial for sale or rent
          filter.propertyType = "commercial";
          break;
        case "agricultural":
          // Agricultural properties
          filter.propertyType = "agricultural";
          break;
        case "pg":
          // PG/Hostel
          filter.propertyType = "pg";
          break;
      }
    }

    if (propertyType) filter.propertyType = propertyType;
    if (subCategory) filter.subCategory = subCategory;
    if (priceType) filter.priceType = priceType;
    if (sector) filter["location.sector"] = sector;
    if (mohalla) filter["location.mohalla"] = mohalla;
    if (landmark) filter["location.landmark"] = landmark;
    if (bedrooms) {
      const bedroomNum = parseInt(String(bedrooms));
      if (String(bedrooms) === "4+") {
        filter["specifications.bedrooms"] = { $gte: 4 };
      } else if (!isNaN(bedroomNum)) {
        filter["specifications.bedrooms"] = bedroomNum;
      }
    }
    if (bathrooms) {
      const bathroomNum = parseInt(String(bathrooms));
      if (!isNaN(bathroomNum)) {
        filter["specifications.bathrooms"] = bathroomNum;
      }
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(String(minPrice));
      if (maxPrice) filter.price.$lte = parseInt(String(maxPrice));
    }

    if (minArea || maxArea) {
      filter["specifications.area"] = {};
      if (minArea)
        filter["specifications.area"].$gte = parseInt(String(minArea));
      if (maxArea)
        filter["specifications.area"].$lte = parseInt(String(maxArea));
    }

    const sort: any = {};
    switch (sortBy) {
      case "price_asc":
        sort.price = 1;
        break;
      case "price_desc":
        sort.price = -1;
        break;
      case "area_desc":
        sort["specifications.area"] = -1;
        break;
      case "date_asc":
        sort.createdAt = 1;
        break;
      default:
        sort.createdAt = -1;
    }

    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));
    const skip = (pageNum - 1) * limitNum;

    const properties = await db
      .collection("properties")
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .toArray();
    const total = await db.collection("properties").countDocuments(filter);

    const response: ApiResponse<{
      properties: Property[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }> = {
      success: true,
      data: {
        properties: properties as unknown as Property[],
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
    console.error("Error fetching properties:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch properties" });
  }
};

/* ========================= Public: Get by ID ========================= */
export const getPropertyById: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid property ID" });

    const property = await db
      .collection("properties")
      .findOne({ _id: new ObjectId(id) });
    if (!property)
      return res
        .status(404)
        .json({ success: false, error: "Property not found" });

    await db
      .collection("properties")
      .updateOne({ _id: new ObjectId(id) }, { $inc: { views: 1 } });

    const response: ApiResponse<Property> = {
      success: true,
      data: property as unknown as Property,
    };
    res.json(response);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ success: false, error: "Failed to fetch property" });
  }
};

/* ========================= Create: FREE / pre-PAID (ALWAYS pending) ========================= */
export const createProperty: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated" });

    // images
    const images: string[] = [];
    if (Array.isArray((req as any).files)) {
      (req as any).files.forEach((file: any) =>
        images.push(`/uploads/properties/${file.filename}`),
      );
    }

    // safe parse
    const safeParse = <T = any>(v: any, fallback: any = {}): T => {
      if (typeof v === "string") {
        try {
          return JSON.parse(v);
        } catch {
          return fallback;
        }
      }
      return (v ?? fallback) as T;
    };
    const location = safeParse(req.body.location, {});
    const specifications = safeParse(req.body.specifications, {});
    const amenities = safeParse(req.body.amenities, []);
    const contactInfo = safeParse(req.body.contactInfo, {});

    const providedPremium = req.body.premium === "true";
    const contactVisibleFlag =
      typeof req.body.contactVisible === "string"
        ? req.body.contactVisible === "true"
        : !!req.body.contactVisible;

    const packageId: string | undefined =
      typeof req.body.packageId === "string" && req.body.packageId.trim()
        ? req.body.packageId.trim()
        : undefined;

    // moderation defaults
    const approvalStatus: "pending" | "pending_approval" = packageId
      ? "pending_approval"
      : "pending";
    const status: "inactive" | "active" = "inactive"; // 🔒 NEVER live at creation

    const toInt = (v: any): number | undefined => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.trunc(n) : undefined;
    };

    const propertyData: Omit<Property, "_id"> & {
      packageId?: string;
      isApproved?: boolean;
      approvedBy?: string;
      rejectionReason?: string;
      adminComments?: string;
      isPaid?: boolean;
      paymentStatus?: "unpaid" | "paid" | "failed";
      lastPaymentAt?: Date | null;
      package?: any;
      packageExpiry?: Date | null;
    } = {
      title: req.body.title,
      description: req.body.description,
      price: toInt(req.body.price) ?? 0,
      priceType: req.body.priceType,
      propertyType: req.body.propertyType,
      subCategory: req.body.subCategory,
      location,
      specifications: {
        ...specifications,
        bedrooms: toInt(specifications.bedrooms),
        bathrooms: toInt(specifications.bathrooms),
        area: toInt(specifications.area),
        floor: toInt(specifications.floor),
        totalFloors: toInt(specifications.totalFloors),
        parking:
          typeof specifications.parking === "string"
            ? specifications.parking === "yes"
            : !!specifications.parking,
      },
      images,
      amenities: Array.isArray(amenities) ? amenities : [],
      ownerId: String(userId),
      ownerType: (req as any).userType || "seller",
      contactInfo,

      // 🔒 moderation enforced
      status,
      approvalStatus,
      isApproved: false,
      featured: false,
      premium: providedPremium || !!packageId,
      contactVisible: contactVisibleFlag,

      // payment defaults
      isPaid: false,
      paymentStatus: "unpaid",
      lastPaymentAt: null,
      package: null,
      packageExpiry: null,

      views: 0,
      inquiries: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(packageId ? { packageId } : {}),
    };

    console.log("📥 CREATE PROPERTY → enforced", {
      status: propertyData.status,
      approvalStatus: propertyData.approvalStatus,
      isApproved: propertyData.isApproved,
      premium: propertyData.premium,
      packageId: propertyData.packageId || null,
    });

    const result = await db.collection("properties").insertOne(propertyData);

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
      message:
        "Property submitted. ⏳ Pending Admin Approval. Paid listings go live only after payment verification + admin approval.",
    };
    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating property:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to create property" });
  }
};

/* ========================= Featured (public) ========================= */
export const getFeaturedProperties: RequestHandler = async (_req, res) => {
  try {
    const db = getDatabase();
    const properties = await db
      .collection("properties")
      .find({ status: "active", featured: true, approvalStatus: "approved" })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const response: ApiResponse<Property[]> = {
      success: true,
      data: properties as unknown as Property[],
    };
    res.json(response);
  } catch (error) {
    console.error("Error fetching featured properties:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch featured properties" });
  }
};

/* ========================= User Dashboard: My Properties ========================= */
export const getUserProperties: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated" });

    const properties = await db
      .collection("properties")
      .find({ ownerId: String(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<Property[]> = {
      success: true,
      data: properties as unknown as Property[],
    };
    res.json(response);
  } catch (error) {
    console.error("Error fetching user properties:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch user properties" });
  }
};

/* ========================= User Notifications ========================= */
export const getUserNotifications: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const db = getDatabase();

    const notifications = await db
      .collection("user_notifications")
      .find({ userId: new ObjectId(String(userId)) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch notifications" });
  }
};

export const markUserNotificationAsRead: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { notificationId } = req.params;
    const db = getDatabase();

    if (!ObjectId.isValid(String(notificationId))) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid notification ID" });
    }

    await db.collection("user_notifications").updateOne(
      {
        _id: new ObjectId(String(notificationId)),
        userId: new ObjectId(String(userId)),
      },
      { $set: { isRead: true, readAt: new Date() } },
    );

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to mark notification as read" });
  }
};

export const deleteUserNotification: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { notificationId } = req.params;
    const db = getDatabase();

    if (!ObjectId.isValid(String(notificationId))) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid notification ID" });
    }

    await db.collection("user_notifications").deleteOne({
      _id: new ObjectId(String(notificationId)),
      userId: new ObjectId(String(userId)),
    });

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete notification" });
  }
};

/* ========================= Admin: Pending list ========================= */
export const getPendingProperties: RequestHandler = async (_req, res) => {
  try {
    const db = getDatabase();
    const properties = await db
      .collection("properties")
      .find({ approvalStatus: { $in: ["pending", "pending_approval"] } })
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<Property[]> = {
      success: true,
      data: properties as unknown as Property[],
    };
    res.json(response);
  } catch (error) {
    console.error("Error fetching pending properties:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch pending properties" });
  }
};

/* ========================= Admin: Approve / Reject ========================= */
export const updatePropertyApproval: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { approvalStatus, adminComments, rejectionReason } = req.body as {
      approvalStatus: "approved" | "rejected";
      adminComments?: string;
      rejectionReason?: string;
    };
    const adminId = (req as any).userId;

    if (!ObjectId.isValid(String(id))) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid property ID" });
    }
    if (!["approved", "rejected"].includes(String(approvalStatus))) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid approval status" });
    }

    const _id = new ObjectId(String(id));
    const property = await db.collection("properties").findOne({ _id });
    if (!property)
      return res
        .status(404)
        .json({ success: false, error: "Property not found" });

    const now = new Date();
    const updateData: any = { approvalStatus, updatedAt: now };

    if (approvalStatus === "approved") {
      updateData.status = "active";
      updateData.isApproved = true;
      updateData.approvedAt = now;
      updateData.approvedBy = String(adminId || "");
    } else {
      updateData.status = "inactive";
      updateData.isApproved = false;
      if (rejectionReason) updateData.rejectionReason = rejectionReason;
    }
    if (adminComments) updateData.adminComments = adminComments;

    await db.collection("properties").updateOne({ _id }, { $set: updateData });

    console.log("✅ ADMIN APPROVAL UPDATE", { id: id, set: updateData });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: `Property ${approvalStatus} successfully` },
    };
    res.json(response);
  } catch (error) {
    console.error("Error updating property approval:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update property approval" });
  }
};
