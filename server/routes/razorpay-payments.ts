import { Router, type RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import type { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";
import Razorpay from "razorpay";
import crypto from "crypto";

/** ---------- Config ---------- */
interface RazorpayConfig {
  enabled: boolean;
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

const getRazorpayConfig = (): RazorpayConfig | null => {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();

  if (!keyId || !keySecret) {
    console.error(
      "❌ Razorpay credentials not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing)"
    );
    return null;
  }

  return {
    enabled: true,
    keyId,
    keySecret,
    webhookSecret: webhookSecret || undefined,
  };
};

/** ---------- Helpers ---------- */
const bad = (res: any, msg: string, code = 400) =>
  res.status(code).json({ success: false, error: msg });

const rupeesToPaise = (amt: number) => Math.round(Number(amt) * 100);

/** =====================================================================
 *  POST /api/payments/razorpay/create
 *  Body: { packageId: string; propertyId?: string; paymentDetails?: { amount?: number; ... } }
 *  Returns: { transactionId, razorpayOrderId, amount (paise), currency, keyId }
 * ===================================================================== */
export const createRazorpayOrder: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const cfg = getRazorpayConfig();
    if (!cfg) return bad(res, "Razorpay is not configured");

    // auth (expects upstream middleware to have set req.userId)
    const userIdRaw = (req as any).userId as string | undefined;
    if (!userIdRaw) return bad(res, "Please login to continue", 401);

    let userObjId: ObjectId;
    try {
      userObjId = new ObjectId(userIdRaw);
    } catch {
      return bad(res, "Invalid user id", 401);
    }

    const { packageId, propertyId, paymentDetails } = (req.body || {}) as {
      packageId: string;
      propertyId?: string;
      paymentDetails?: { amount?: number; [k: string]: any };
    };
    if (!packageId) return bad(res, "Missing packageId");

    let pkgObjId: ObjectId;
    try {
      pkgObjId = new ObjectId(packageId);
    } catch {
      return bad(res, "Invalid package ID");
    }

    const pkg = await db.collection("ad_packages").findOne({ _id: pkgObjId });
    if (!pkg) return bad(res, "Package not found", 404);

    // Prefer package price; allow explicit override for testing if > 0
    const amountRupees =
      Number(pkg.price || 0) > 0
        ? Number(pkg.price)
        : Number(paymentDetails?.amount || 0);

    if (!amountRupees || amountRupees <= 0) {
      return bad(res, "Invalid package amount");
    }

    const amountPaise = rupeesToPaise(amountRupees);

    // Optional propertyId
    let propObjId: ObjectId | undefined;
    if (propertyId) {
      try {
        propObjId = new ObjectId(propertyId);
      } catch {
        return bad(res, "Invalid propertyId");
      }
    }

    // Razorpay instance
    const rzp = new Razorpay({
      key_id: cfg.keyId,
      key_secret: cfg.keySecret,
    });

    // Create order
    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${pkgObjId.toString().slice(-8)}_${Date.now()}`,
      payment_capture: 1,
      notes: {
        packageId: pkgObjId.toString(),
        propertyId: propObjId?.toString() || "none",
        userId: userObjId.toString(),
        packageName: String(pkg.name || ""),
      },
    });

    // Persist transaction (store rupees for readability)
    const now = new Date();
    const txDoc = {
      userId: userObjId,
      packageId: pkgObjId,
      propertyId: propObjId,
      amount: amountRupees,
      currency: "INR",
      paymentMethod: "razorpay",
      paymentDetails: paymentDetails || {},
      razorpayOrderId: order.id,
      status: "pending",
      packageName: String(pkg.name || ""),
      packageDuration: Number(pkg.duration || 0),
      createdAt: now,
      updatedAt: now,
    };

    const insertRes = await db.collection("transactions").insertOne(txDoc);

    const response: ApiResponse<{
      transactionId: string;
      razorpayOrderId: string;
      amount: number; // paise
      currency: string;
      keyId: string;
    }> = {
      success: true,
      data: {
        transactionId: insertRes.insertedId.toString(),
        razorpayOrderId: order.id,
        amount: amountPaise,
        currency: "INR",
        keyId: cfg.keyId,
      },
    };

    return res.json(response);
  } catch (err: any) {
    console.error("❌ Error creating Razorpay order:", err?.message || err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to create Razorpay order" });
  }
};

/** =====================================================================
 *  POST /api/payments/razorpay/verify
 *  Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *  Verifies signature, marks tx paid, and (critically) sets property to PENDING APPROVAL.
 * ===================================================================== */
export const verifyRazorpayPayment: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const cfg = getRazorpayConfig();
    if (!cfg) return bad(res, "Razorpay not configured");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      (req.body || {}) as {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return bad(res, "Missing required payment details");
    }

    // Signature verify
    const expected = crypto
      .createHmac("sha256", cfg.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return bad(res, "Payment verification failed - Invalid signature");
    }

    const tx = await db.collection("transactions").findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!tx) return bad(res, "Transaction not found", 404);

    const now = new Date();

    // 1) Mark transaction paid
    await db.collection("transactions").updateOne(
      { _id: tx._id },
      {
        $set: {
          status: "paid",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paidAt: now,
          updatedAt: now,
        },
      }
    );

    // 2) If property/package present → attach package snapshot & mark as PENDING APPROVAL (not live)
    if (tx.propertyId && tx.packageId) {
      const pkg = await db.collection("ad_packages").findOne({
        _id: new ObjectId(String(tx.packageId)),
      });

      if (pkg) {
        const packageExpiry = new Date();
        packageExpiry.setDate(packageExpiry.getDate() + Number(pkg.duration || 0));

        await db.collection("properties").updateOne(
          { _id: new ObjectId(String(tx.propertyId)) },
          {
            $set: {
              // payment meta
              isPaid: true,
              paymentStatus: "paid",
              paymentGateway: "razorpay",
              lastPaymentAt: now,

              // paid amount (for admin dashboard display)
              paidAmount: Number(tx.amount || 0),
              paidCurrency: String(tx.currency || "INR"),
              razorpayPaymentId: razorpay_payment_id,
              razorpayOrderId: razorpay_order_id,

              // package meta (snapshot)
              packageId: new ObjectId(String(tx.packageId)),
              package: {
                id: new ObjectId(String(pkg._id)),
                name: String(pkg.name || ""),
                type: String(pkg.type || ""),
                price: Number(pkg.price || 0),
                duration: Number(pkg.duration || 0),
                features: Array.isArray(pkg.features) ? pkg.features : [],
                purchasedAt: now,
                expiry: packageExpiry,
              },
              packageExpiry,

              // visibility / moderation
              status: "pending_approval",
              approvalStatus: "pending",
              isApproved: false,

              // UX extras
              featured: pkg.type === "featured" || pkg.type === "premium",
              updatedAt: now,
            },
            $unset: {
              // ensure any accidental live flags are removed
              liveAt: "",
              approvedAt: "",
            },
          }
        );
      }
    }

    const response: ApiResponse<{ message: string; transactionId: string }> = {
      success: true,
      data: {
        message:
          "Payment verified. Property is pending admin approval (will go live after approval).",
        transactionId: String(tx._id),
      },
    };
    return res.json(response);
  } catch (err: any) {
    console.error("❌ Error verifying Razorpay payment:", err?.message || err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to verify payment" });
  }
};

/** =====================================================================
 *  GET /api/payments/razorpay/status/:orderId
 *  Returns latest tx status for given Razorpay order id
 * ===================================================================== */
export const getRazorpayPaymentStatus: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { orderId } = req.params as { orderId: string };

    if (!orderId) return bad(res, "orderId required");

    const tx = await db.collection("transactions").findOne({
      razorpayOrderId: orderId,
    });

    if (!tx) return bad(res, "Transaction not found", 404);

    const response: ApiResponse<{ status: string; transactionId: string }> = {
      success: true,
      data: {
        status: String(tx.status),
        transactionId: String(tx._id),
      },
    };
    return res.json(response);
  } catch (err: any) {
    console.error("❌ Error getting payment status:", err?.message || err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to get payment status" });
  }
};

/** ---------- Router (default export) ----------
 *   POST /api/payments/razorpay/create
 *   POST /api/payments/razorpay/verify
 *   GET  /api/payments/razorpay/status/:orderId
 */
export const razorpayRouter = Router();
razorpayRouter.post("/create", createRazorpayOrder);
razorpayRouter.post("/verify", verifyRazorpayPayment);
razorpayRouter.get("/status/:orderId", getRazorpayPaymentStatus);

export default razorpayRouter;
