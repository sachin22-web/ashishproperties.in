import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

export interface Coupon {
  _id?: ObjectId;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicableFor: "all" | "specific_packages" | "first_time_users";
  packageIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CouponUsage {
  _id?: ObjectId;
  couponId: ObjectId;
  userId: ObjectId;
  orderId?: ObjectId;
  discountAmount: number;
  usedAt: Date;
}

// Get all coupons (admin only)
export const getAllCoupons: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "20", status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const coupons = await db
      .collection("coupons")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("coupons").countDocuments(filter);

    const response: ApiResponse<{
      coupons: Coupon[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        coupons: coupons as Coupon[],
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
    console.error("Error fetching coupons:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch coupons",
    });
  }
};

// Create coupon (admin only)
export const createCoupon: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      isActive,
      applicableFor,
      packageIds,
    } = req.body;

    // Validate required fields
    if (!code || !description || !discountType || !discountValue || !validFrom || !validUntil) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Check if coupon code already exists
    const existing = await db.collection("coupons").findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Coupon code already exists",
      });
    }

    const couponData: Omit<Coupon, "_id"> = {
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue: parseFloat(discountValue),
      minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : undefined,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
      usedCount: 0,
      isActive: isActive !== false,
      applicableFor: applicableFor || "all",
      packageIds: packageIds || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("coupons").insertOne(couponData);

    const response: ApiResponse<{ couponId: string }> = {
      success: true,
      data: { couponId: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create coupon",
    });
  }
};

// Update coupon (admin only)
export const updateCoupon: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const updateData = { ...req.body };

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid coupon ID",
      });
    }

    // Don't allow changing the code if coupon has been used
    const existing = await db.collection("coupons").findOne({ _id: new ObjectId(id) });
    if (existing && (existing as any).usedCount > 0 && updateData.code && updateData.code !== (existing as any).code) {
      return res.status(400).json({
        success: false,
        error: "Cannot change code of a coupon that has been used",
      });
    }

    delete updateData._id;
    updateData.updatedAt = new Date();

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const result = await db
      .collection("coupons")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Coupon not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Coupon updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update coupon",
    });
  }
};

// Delete coupon (admin only)
export const deleteCoupon: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid coupon ID",
      });
    }

    const result = await db.collection("coupons").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Coupon not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Coupon deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete coupon",
    });
  }
};

// Validate and apply coupon (user-facing)
export const validateCoupon: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { code, packageId, purchaseAmount } = req.body;
    const userId = (req as any).userId;

    if (!code || !purchaseAmount) {
      return res.status(400).json({
        success: false,
        error: "Coupon code and purchase amount are required",
      });
    }

    // Find the coupon
    const coupon = await db.collection("coupons").findOne({ 
      code: code.toUpperCase(),
      isActive: true,
    }) as Coupon | null;

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: "Invalid or inactive coupon code",
      });
    }

    // Check if coupon is valid
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        error: "Coupon has expired or is not yet valid",
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        error: "Coupon usage limit has been reached",
      });
    }

    // Check if user has already used this coupon
    if (userId) {
      const usage = await db.collection("coupon_usage").findOne({
        couponId: coupon._id,
        userId: new ObjectId(userId),
      });

      if (usage) {
        return res.status(400).json({
          success: false,
          error: "You have already used this coupon",
        });
      }

      // Check first-time user requirement
      if (coupon.applicableFor === "first_time_users") {
        const priorOrders = await db.collection("transactions").countDocuments({
          userId: new ObjectId(userId),
          status: "completed",
        });

        if (priorOrders > 0) {
          return res.status(400).json({
            success: false,
            error: "This coupon is only valid for first-time users",
          });
        }
      }
    }

    // Check minimum purchase amount
    const amount = parseFloat(purchaseAmount);
    if (coupon.minPurchaseAmount && amount < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        error: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required`,
      });
    }

    // Check if applicable for specific packages
    if (coupon.applicableFor === "specific_packages") {
      if (!packageId || !coupon.packageIds?.includes(packageId)) {
        return res.status(400).json({
          success: false,
          error: "Coupon not applicable for this package",
        });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed purchase amount
    discountAmount = Math.min(discountAmount, amount);

    const response: ApiResponse<{
      valid: boolean;
      discountAmount: number;
      finalAmount: number;
      couponId: string;
    }> = {
      success: true,
      data: {
        valid: true,
        discountAmount,
        finalAmount: amount - discountAmount,
        couponId: coupon._id!.toString(),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate coupon",
    });
  }
};

// Record coupon usage (called after successful payment)
export const recordCouponUsage: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { couponId, orderId } = req.body;
    const userId = (req as any).userId;

    if (!couponId || !orderId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Fetch and verify the transaction/order belongs to the user
    const transaction = await db.collection("transactions").findOne({
      _id: new ObjectId(orderId),
      userId: new ObjectId(userId),
      status: "completed",
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found or not completed",
      });
    }

    const purchaseAmount = (transaction as any).amount;
    const packageId = (transaction as any).packageId?.toString();

    // Re-fetch and validate the coupon
    const coupon = await db.collection("coupons").findOne({ 
      _id: new ObjectId(couponId),
      isActive: true,
    }) as Coupon | null;

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: "Invalid or inactive coupon",
      });
    }

    // Check if coupon is still valid (date range)
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        error: "Coupon has expired or is not yet valid",
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        error: "Coupon usage limit has been reached",
      });
    }

    // Verify coupon hasn't been used by this user already
    const existingUsage = await db.collection("coupon_usage").findOne({
      couponId: new ObjectId(couponId),
      userId: new ObjectId(userId),
    });

    if (existingUsage) {
      return res.status(400).json({
        success: false,
        error: "Coupon has already been used by this user",
      });
    }

    // Re-run first-time user check
    if (coupon.applicableFor === "first_time_users") {
      const priorOrders = await db.collection("transactions").countDocuments({
        userId: new ObjectId(userId),
        status: "completed",
        _id: { $ne: new ObjectId(orderId) }, // Exclude current order
      });

      if (priorOrders > 0) {
        return res.status(400).json({
          success: false,
          error: "This coupon is only valid for first-time users",
        });
      }
    }

    // Re-run minimum purchase check
    if (coupon.minPurchaseAmount && purchaseAmount < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        error: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required`,
      });
    }

    // Re-run package applicability check
    if (coupon.applicableFor === "specific_packages") {
      if (!packageId || !coupon.packageIds?.includes(packageId)) {
        return res.status(400).json({
          success: false,
          error: "Coupon not applicable for this package",
        });
      }
    }

    // Re-calculate discount using verified transaction amount
    let calculatedDiscount = 0;
    if (coupon.discountType === "percentage") {
      calculatedDiscount = (purchaseAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscountAmount);
      }
    } else {
      calculatedDiscount = coupon.discountValue;
    }
    calculatedDiscount = Math.min(calculatedDiscount, purchaseAmount);

    // Record usage with verified discount
    const usageData: Omit<CouponUsage, "_id"> = {
      couponId: new ObjectId(couponId),
      userId: new ObjectId(userId),
      orderId: new ObjectId(orderId),
      discountAmount: calculatedDiscount,
      usedAt: new Date(),
    };

    await db.collection("coupon_usage").insertOne(usageData);

    // Increment used count
    await db
      .collection("coupons")
      .updateOne({ _id: new ObjectId(couponId) }, { $inc: { usedCount: 1 } });

    const response: ApiResponse<{ message: string; discountAmount: number }> = {
      success: true,
      data: { 
        message: "Coupon usage recorded successfully",
        discountAmount: calculatedDiscount,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error recording coupon usage:", error);
    res.status(500).json({
      success: false,
      error: "Failed to record coupon usage",
    });
  }
};
