import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

interface BankTransfer {
  _id?: ObjectId;
  userId: ObjectId;
  userName: string;
  userEmail: string;
  userPhone?: string;
  amount: number;
  referenceNumber: string;
  bankName: string;
  accountHolderName: string;
  transactionDate: Date;
  status: "pending" | "verified" | "rejected";
  proofDocument?: string;
  remarks?: string;
  verifiedBy?: string;
  verificationDate?: Date;
  packageId?: ObjectId;
  packageName?: string;
  propertyId?: ObjectId;
  propertyTitle?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Get all bank transfers (admin)
export const getAllBankTransfers: RequestHandler = async (req, res) => {
  try {
    console.log("🏦 Fetching bank transfers...");
    const db = getDatabase();
    const { page = "1", limit = "50", status, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
        { referenceNumber: { $regex: search, $options: "i" } },
        { bankName: { $regex: search, $options: "i" } },
        { accountHolderName: { $regex: search, $options: "i" } },
      ];
    }

    console.log("🔍 Filter:", filter);

    const transfers = await db
      .collection("bank_transfers")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("bank_transfers").countDocuments(filter);

    console.log(`📊 Found ${transfers.length} transfers out of ${total} total`);

    const response: ApiResponse<{
      transfers: BankTransfer[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        transfers: transfers as BankTransfer[],
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
    console.error("Error fetching bank transfers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch bank transfers",
    });
  }
};

// Create bank transfer (user submits)
export const createBankTransfer: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const {
      amount,
      referenceNumber,
      bankName,
      accountHolderName,
      transactionDate,
      proofDocument,
      packageId,
      packageName,
      propertyId,
      propertyTitle,
    } = req.body;

    if (!amount || !referenceNumber || !bankName || !accountHolderName || !transactionDate) {
      return res.status(400).json({
        success: false,
        error: "Amount, reference number, bank name, account holder name, and transaction date are required",
      });
    }

    const db = getDatabase();

    // Get user details
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check for duplicate reference number
    const existingTransfer = await db
      .collection("bank_transfers")
      .findOne({ referenceNumber: referenceNumber });

    if (existingTransfer) {
      return res.status(400).json({
        success: false,
        error: "A transfer with this reference number already exists",
      });
    }

    const transferData: Omit<BankTransfer, "_id"> = {
      userId: new ObjectId(userId),
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      amount: parseFloat(amount),
      referenceNumber,
      bankName,
      accountHolderName,
      transactionDate: new Date(transactionDate),
      status: "pending",
      proofDocument,
      packageId: packageId ? new ObjectId(packageId) : undefined,
      packageName,
      propertyId: propertyId ? new ObjectId(propertyId) : undefined,
      propertyTitle,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("bank_transfers").insertOne(transferData);

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: result.insertedId.toString() },
      message: "Bank transfer submitted successfully. It will be verified within 24 hours.",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating bank transfer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit bank transfer",
    });
  }
};

// Update bank transfer status (admin)
export const updateBankTransferStatus: RequestHandler = async (req, res) => {
  try {
    const { transferId } = req.params;
    const { status, remarks } = req.body;
    const adminId = (req as any).userId;

    if (!ObjectId.isValid(transferId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid transfer ID",
      });
    }

    if (!["pending", "verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be pending, verified, or rejected",
      });
    }

    const db = getDatabase();

    // Get admin details
    const admin = await db.collection("users").findOne({ _id: new ObjectId(adminId) });
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "verified" || status === "rejected") {
      updateData.verifiedBy = admin.name;
      updateData.verificationDate = new Date();
      if (remarks) {
        updateData.remarks = remarks;
      }
    }

    const result = await db
      .collection("bank_transfers")
      .updateOne(
        { _id: new ObjectId(transferId) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Bank transfer not found",
      });
    }

    // If verified, activate the package or credit the user
    if (status === "verified") {
      const transfer = await db
        .collection("bank_transfers")
        .findOne({ _id: new ObjectId(transferId) });

      if (transfer && transfer.packageId) {
        // Activate package for the user
        await db.collection("user_packages").insertOne({
          userId: transfer.userId,
          packageId: transfer.packageId,
          packageName: transfer.packageName,
          amount: transfer.amount,
          propertyId: transfer.propertyId,
          propertyTitle: transfer.propertyTitle,
          status: "active",
          purchaseDate: new Date(),
          activatedBy: adminId,
          paymentMethod: "bank_transfer",
          referenceNumber: transfer.referenceNumber,
        });

        // Update property to premium if propertyId exists
        if (transfer.propertyId) {
          await db
            .collection("properties")
            .updateOne(
              { _id: transfer.propertyId },
              { 
                $set: { 
                  premium: true,
                  premiumApprovalStatus: "approved",
                  premiumActivatedAt: new Date(),
                } 
              }
            );
        }
      }
    }

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: `Bank transfer ${status} successfully`,
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating bank transfer status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update bank transfer status",
    });
  }
};

// Get bank transfer by ID (admin)
export const getBankTransferById: RequestHandler = async (req, res) => {
  try {
    const { transferId } = req.params;

    if (!ObjectId.isValid(transferId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid transfer ID",
      });
    }

    const db = getDatabase();

    const transfer = await db
      .collection("bank_transfers")
      .findOne({ _id: new ObjectId(transferId) });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: "Bank transfer not found",
      });
    }

    const response: ApiResponse<BankTransfer> = {
      success: true,
      data: transfer as BankTransfer,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching bank transfer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch bank transfer",
    });
  }
};

// Get user's bank transfers
export const getUserBankTransfers: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const db = getDatabase();

    const transfers = await db
      .collection("bank_transfers")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<BankTransfer[]> = {
      success: true,
      data: transfers as BankTransfer[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching user bank transfers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch bank transfers",
    });
  }
};

// Delete bank transfer (admin only)
export const deleteBankTransfer: RequestHandler = async (req, res) => {
  try {
    const { transferId } = req.params;

    if (!ObjectId.isValid(transferId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid transfer ID",
      });
    }

    const db = getDatabase();

    const result = await db
      .collection("bank_transfers")
      .deleteOne({ _id: new ObjectId(transferId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Bank transfer not found",
      });
    }

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: "Bank transfer deleted successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting bank transfer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete bank transfer",
    });
  }
};

// Get bank transfer stats (admin)
export const getBankTransferStats: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const stats = await db.collection("bank_transfers").aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]).toArray();

    const totalTransfers = await db.collection("bank_transfers").countDocuments();
    const todayTransfers = await db.collection("bank_transfers").countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    const formattedStats = {
      total: totalTransfers,
      today: todayTransfers,
      pending: stats.find(s => s._id === "pending")?.count || 0,
      verified: stats.find(s => s._id === "verified")?.count || 0,
      rejected: stats.find(s => s._id === "rejected")?.count || 0,
      totalAmount: stats.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
      pendingAmount: stats.find(s => s._id === "pending")?.totalAmount || 0,
    };

    const response: ApiResponse<typeof formattedStats> = {
      success: true,
      data: formattedStats,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching bank transfer stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch bank transfer stats",
    });
  }
};
