// server/controllers/payments.ts
import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { Transaction, ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

/** Helpers */
function toObjectId(id?: string | null) {
  try {
    if (!id) return null;
    return new ObjectId(id);
  } catch {
    return null;
  }
}

/** -----------------------------------------
 *  Create new transaction
 *  ----------------------------------------*/
export const createTransaction: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const { packageId, propertyId, paymentMethod, paymentDetails } = req.body as {
      packageId: string;
      propertyId?: string | null;
      paymentMethod: string;
      paymentDetails?: any;
    };

    // ✅ userId must be set by auth middleware
    const userIdRaw = (req as any).userId as string | undefined;
    if (!userIdRaw) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    const userId = toObjectId(userIdRaw);
    const pkgId = toObjectId(packageId);
    const propId = toObjectId(propertyId || null);

    if (!pkgId) {
      return res.status(400).json({ success: false, error: "Invalid package id" });
    }

    // Fetch package
    const package_ = await db.collection("ad_packages").findOne({ _id: pkgId });
    if (!package_) {
      return res.status(404).json({ success: false, error: "Package not found" });
    }

    const amount = Number(package_.price || 0);
    const status: Transaction["status"] = amount === 0 ? "paid" : "pending";

    const now = new Date();

    // ✅ Store all ids as ObjectId
    const transactionData: Omit<Transaction, "_id"> = {
      userId: (userId || userIdRaw) as any,
      packageId: pkgId as any,
      propertyId: (propId as any) || undefined,
      amount,
      paymentMethod,
      paymentDetails: paymentDetails || {},
      status,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("transactions").insertOne(transactionData);

    // If free package, activate immediately
    if (amount === 0 && propId) {
      const packageExpiry = new Date();
      packageExpiry.setDate(packageExpiry.getDate() + Number(package_.duration || 0));

      await db.collection("properties").updateOne(
        { _id: propId },
        {
          $set: {
            packageId: pkgId,
            packageExpiry,
            featured: package_.type === "featured" || package_.type === "premium",
            updatedAt: new Date(),
          },
        }
      );
    }

    const response: ApiResponse<{ transactionId: string; status: string }> = {
      success: true,
      data: {
        transactionId: result.insertedId.toString(),
        status,
      },
    };
    return res.json(response);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return res.status(500).json({ success: false, error: "Failed to create transaction" });
  }
};

/** -----------------------------------------
 *  Get current user's transactions
 *  ----------------------------------------*/
export const getUserTransactions: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const userIdRaw = (req as any).userId as string | undefined;
    if (!userIdRaw) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }
    const userId = toObjectId(userIdRaw) || userIdRaw; // (in case your old data has string ids)

    const pageNum = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
    const limitNum = Math.max(parseInt((req.query.limit as string) || "20", 10), 1);
    const skip = (pageNum - 1) * limitNum;

    const match = { userId } as any;

    const transactions = await db
      .collection("transactions")
      .aggregate([
        { $match: match },
        {
          $lookup: {
            from: "ad_packages",
            localField: "packageId",
            foreignField: "_id",
            as: "package",
          },
        },
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "property",
          },
        },
        { $addFields: { package: { $arrayElemAt: ["$package", 0] }, property: { $arrayElemAt: ["$property", 0] } } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
      ])
      .toArray();

    const total = await db.collection("transactions").countDocuments(match);

    const response: ApiResponse<{
      transactions: any[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }> = {
      success: true,
      data: {
        transactions,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    };

    return res.json(response);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch transactions" });
  }
};

/** -----------------------------------------
 *  Admin: Get all transactions (filters optional)
 *  ----------------------------------------*/
export const getAllTransactions: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "20", status, paymentMethod } = req.query;

    const pageNum = Math.max(parseInt(page as string, 10), 1);
    const limitNum = Math.max(parseInt(limit as string, 10), 1);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const transactions = await db
      .collection("transactions")
      .aggregate([
        { $match: filter },
        {
          $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" },
        },
        {
          $lookup: { from: "ad_packages", localField: "packageId", foreignField: "_id", as: "package" },
        },
        {
          $lookup: { from: "properties", localField: "propertyId", foreignField: "_id", as: "property" },
        },
        {
          $addFields: {
            userName: { $arrayElemAt: ["$user.name", 0] },
            userEmail: { $arrayElemAt: ["$user.email", 0] },
            packageName: { $arrayElemAt: ["$package.name", 0] },
            propertyTitle: { $arrayElemAt: ["$property.title", 0] },
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            propertyId: 1,
            packageId: 1,
            amount: 1,
            paymentMethod: 1,
            paymentDetails: 1,
            status: 1,
            type: 1,
            description: 1,
            transactionId: 1,
            createdAt: 1,
            updatedAt: 1,
            userName: 1,
            userEmail: 1,
            packageName: 1,
            propertyTitle: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
      ])
      .toArray();

    const total = await db.collection("transactions").countDocuments(filter);

    const response: ApiResponse<{
      transactions: any[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }> = {
      success: true,
      data: {
        transactions,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    };

    return res.json(response);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch transactions" });
  }
};

/** -----------------------------------------
 *  Admin: Update transaction status
 *  ----------------------------------------*/
export const updateTransactionStatus: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { transactionId } = req.params as { transactionId: string };
    const { status, adminNotes } = req.body as { status: string; adminNotes?: string };
    const adminId = (req as any).userId as string | undefined;

    const txId = toObjectId(transactionId);
    if (!txId) {
      return res.status(400).json({ success: false, error: "Invalid transaction ID" });
    }

    const allowed = ["pending", "approved", "rejected", "processing", "paid", "failed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }

    const transaction = await db.collection("transactions").findOne({ _id: txId });
    if (!transaction) {
      return res.status(404).json({ success: false, error: "Transaction not found" });
    }

    const now = new Date();
    const updateData: any = {
      status: status === "approved" ? "paid" : status, // normalize
      updatedAt: now,
    };

    if (status === "approved" || status === "paid") {
      updateData.paidAt = now;
      if (adminId) updateData.processedBy = adminId;
    }
    if (status === "rejected") {
      updateData.rejectedAt = now;
      if (adminId) updateData.processedBy = adminId;
    }
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await db.collection("transactions").updateOne({ _id: txId }, { $set: updateData });

    // If paid/approved → activate property package
    if ((status === "approved" || status === "paid") && transaction.propertyId) {
      const pkgId = toObjectId(String(transaction.packageId));
      if (pkgId) {
        const package_ = await db.collection("ad_packages").findOne({ _id: pkgId });
        if (package_) {
          const packageExpiry = new Date();
          packageExpiry.setDate(packageExpiry.getDate() + Number(package_.duration || 0));
          await db.collection("properties").updateOne(
            { _id: toObjectId(String(transaction.propertyId))! },
            {
              $set: {
                packageId: pkgId,
                packageExpiry,
                featured: package_.type === "featured" || package_.type === "premium",
                updatedAt: new Date(),
              },
            }
          );
        }
      }
    }

    return res.json({
      success: true,
      data: { message: `Transaction ${status === "approved" ? "approved" : status} successfully` },
    } as ApiResponse<{ message: string }>);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return res.status(500).json({ success: false, error: "Failed to update transaction" });
  }
};

/** -----------------------------------------
 *  Verify payment (manual/webhook simulation)
 *  ----------------------------------------*/
export const verifyPayment: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { transactionId, paymentData } = req.body as {
      transactionId: string;
      paymentData: any;
    };

    const txId = toObjectId(transactionId);
    if (!txId) return res.status(400).json({ success: false, error: "Invalid transaction id" });

    const transaction = await db.collection("transactions").findOne({ _id: txId });
    if (!transaction) {
      return res.status(404).json({ success: false, error: "Transaction not found" });
    }

    // Simulated check
    const isPaymentValid = paymentData && paymentData.status === "success";
    const newStatus: Transaction["status"] = isPaymentValid ? "paid" : "failed";

    await db.collection("transactions").updateOne(
      { _id: txId },
      {
        $set: {
          status: newStatus,
          paymentDetails: { ...(transaction as any).paymentDetails, gatewayResponse: paymentData || {} },
          updatedAt: new Date(),
          ...(isPaymentValid ? { paidAt: new Date() } : {}),
        },
      }
    );

    // Activate package on success
    if (isPaymentValid && transaction.propertyId && transaction.packageId) {
      const pkgId = toObjectId(String(transaction.packageId));
      const propId = toObjectId(String(transaction.propertyId));
      if (pkgId && propId) {
        const package_ = await db.collection("ad_packages").findOne({ _id: pkgId });
        if (package_) {
          const packageExpiry = new Date();
          packageExpiry.setDate(packageExpiry.getDate() + Number(package_.duration || 0));
          await db.collection("properties").updateOne(
            { _id: propId },
            {
              $set: {
                packageId: pkgId,
                packageExpiry,
                featured: package_.type === "featured" || package_.type === "premium",
                updatedAt: new Date(),
              },
            }
          );
        }
      }
    }

    return res.json({ success: true, data: { status: newStatus } } as ApiResponse<{ status: string }>);
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ success: false, error: "Failed to verify payment" });
  }
};

/** -----------------------------------------
 *  Get payment methods (incl. PhonePe flags)
 *  ----------------------------------------*/
export const getPaymentMethods: RequestHandler = async (_req, res) => {
  try {
    // ✅ Keep this in DB/env in real app. For now, static + phonepe support.
    const paymentMethods = {
      upi: {
        enabled: true,
        upiId: "aashishproperty@paytm",
        qrCode: "/api/payments/upi-qr",
      },
      bankTransfer: {
        enabled: true,
        bankName: "State Bank of India",
        accountNumber: "1234567890",
        ifscCode: "SBIN0001234",
        accountHolder: "Aashish Property Services",
      },
      online: {
        enabled: true,
        gateways: ["razorpay", "paytm", "phonepe"],
      },
      // ✅ Added for your PaymentForm check: paymentMethods.phonepe?.enabled
      phonepe: {
        enabled: true,            // set false if not configured
        merchantId: process.env.PHONEPE_MERCHANT_ID || "",
        testMode: process.env.PHONEPE_ENV !== "PROD",
      },
    };

    const response: ApiResponse<any> = { success: true, data: paymentMethods };
    return res.json(response);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch payment methods" });
  }
};
